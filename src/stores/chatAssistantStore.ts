import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatAssistantApi } from '@/api/chat-assistant'
import type { UserSettings, Personality } from '@/pages/playground/chat/types'

const CACHE_KEY = 'volo_ai_chat_assistant_settings'
const LEGACY_KEY = 'chat-assistant-settings'

const defaultSettings: UserSettings = {
  assistantName: '',
  userName: '',
  personality: 'WARM',
  responseStyle: 'DETAILED',
  emotionTracking: true,
}

/**
 * Chat Assistant 设置状态管理
 *
 * 职责：
 * - 封装 localStorage 读写（遵循 frontend/CLAUDE.md §6.2 SWR 规范）
 * - 乐观更新本地状态，后台防抖同步到后端 API
 * - onboarding 状态从数据推导：assistantName 为空 → 需要引导
 */
export const useChatAssistantStore = defineStore('chatAssistant', () => {
  // ========== 状态 ==========
  const settings = ref<UserSettings>({ ...defaultSettings })
  const cacheHydrated = ref(false)
  const isSyncing = ref(false)

  /**
   * 是否需要 onboarding — 从数据推导，非独立标记
   * assistantName 为空 = 用户从未完成引导
   */
  const needsOnboarding = computed(() => !settings.value.assistantName)

  // ========== 私有方法：localStorage ==========

  /** SWR Stale：从 localStorage 恢复状态（兼容旧 key 一次性迁移） */
  function hydrateFromCache() {
    if (typeof window === 'undefined') return
    try {
      let raw = window.localStorage.getItem(CACHE_KEY)
      if (!raw) {
        raw = window.localStorage.getItem(LEGACY_KEY)
        if (raw) {
          window.localStorage.setItem(CACHE_KEY, raw)
          window.localStorage.removeItem(LEGACY_KEY)
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSettings>
        settings.value = { ...defaultSettings, ...parsed }
        cacheHydrated.value = true
      }
    } catch {
      window.localStorage.removeItem(CACHE_KEY)
      window.localStorage.removeItem(LEGACY_KEY)
    }
  }

  function writeToCache(data: UserSettings) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('[chatAssistantStore] localStorage 写入失败:', e)
    }
  }

  // ========== 后台同步 ==========
  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let pendingSync = false

  async function doSync() {
    if (isSyncing.value) {
      pendingSync = true
      return
    }
    isSyncing.value = true
    try {
      await chatAssistantApi.updateSettings({
        assistantName: settings.value.assistantName,
        userName: settings.value.userName,
        personality: settings.value.personality,
        responseStyle: settings.value.responseStyle,
      })
    } catch (e) {
      console.error('[chatAssistantStore] 设置同步失败:', e)
    } finally {
      isSyncing.value = false
      if (pendingSync) {
        pendingSync = false
        doSync()
      }
    }
  }

  function scheduleSyncToBackend() {
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(doSync, 300)
  }

  // ========== 公开方法 ==========

  /**
   * 更新设置 — 乐观更新 + 后台防抖同步
   * 必须创建新对象引用（spread），确保 computed 消费者能检测到变化。
   */
  function updateSettings(updates: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...updates }
    writeToCache(settings.value)
    scheduleSyncToBackend()
  }

  /**
   * SWR Revalidate：从后端拉取最新设置，覆盖本地缓存
   * 跨设备同步的关键——后端有数据则 needsOnboarding 自动变 false
   */
  async function loadSettings() {
    try {
      const remote = await chatAssistantApi.getSettings()
      if (remote && remote.assistantName) {
        settings.value = {
          ...defaultSettings,
          assistantName: remote.assistantName || '',
          userName: remote.userName || '',
          personality: (remote.personality as UserSettings['personality']) || 'WARM',
          responseStyle: (remote.responseStyle as UserSettings['responseStyle']) || 'DETAILED',
        }
        writeToCache(settings.value)
      }
    } catch {
      // SWR：失败保留缓存，不清空
    }
  }

  /**
   * 立即执行待同步内容（用于组件卸载前 flush）
   */
  function flushPendingSync() {
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
      doSync()
    }
  }

  // ========== 初始化 ==========
  hydrateFromCache()

  return {
    settings,
    cacheHydrated,
    isSyncing,
    needsOnboarding,
    updateSettings,
    loadSettings,
    flushPendingSync,
  }
})
