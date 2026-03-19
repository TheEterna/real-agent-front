// ============================================================
// useAvatarCapability — 分身能力插件管理
// 职责：管理分身的工具/技能绑定、配额校验、加载状态
// ============================================================

import { ref, computed, watch, onUnmounted } from 'vue'
import * as avatarApi from '@/api/avatar'
import { useAvatarStore } from '@/stores/avatarStore'
import { CORE_TIER_SPECS } from '../constants/templates'
import type {
  AvatarTool,
  AvatarSkill,
  AvailableTool,
  AvailableSkill,
  CapabilityQuota,
  AvatarCoreTier,
} from '../types'

export function useAvatarCapability(avatarId: string) {
  const store = useAvatarStore()

  // ---- 状态 ----
  const boundTools = ref<AvatarTool[]>([])
  const boundSkills = ref<AvatarSkill[]>([])
  const availableTools = ref<AvailableTool[]>([])
  const availableSkills = ref<AvailableSkill[]>([])
  const isLoadingBoundTools = ref(false)
  const isLoadingBoundSkills = ref(false)
  const isLoadingAvailableTools = ref(false)
  const isLoadingAvailableSkills = ref(false)
  const error = ref<string | null>(null)

  // ---- 配额 ----
  const quota = computed<CapabilityQuota>(() => {
    const avatar = store.activeAvatar
    const tier = (avatar?.agentConfig?.modelTier ?? 'lite') as AvatarCoreTier
    const spec = CORE_TIER_SPECS[tier]
    return {
      usedTools: boundTools.value.filter((t) => t.isEnabled).length,
      maxTools: spec?.maxTools ?? 3,
      usedSkills: boundSkills.value.filter((s) => s.isEnabled).length,
      maxSkills: spec?.maxTools ?? 3, // 技能配额暂与工具相同
    }
  })

  // ---- 加载已绑定工具 ----
  async function loadBoundTools() {
    if (isLoadingBoundTools.value) return
    isLoadingBoundTools.value = true
    error.value = null

    try {
      const res = await avatarApi.getAvatarTools(avatarId)
      if (res.code === 200 && res.data) {
        boundTools.value = res.data
      }
    } catch (e) {
      console.error('[useAvatarCapability] loadBoundTools failed:', e)
      error.value = '加载已装备工具失败'
    } finally {
      isLoadingBoundTools.value = false
    }
  }

  // ---- 加载已绑定技能 ----
  async function loadBoundSkills() {
    if (isLoadingBoundSkills.value) return
    isLoadingBoundSkills.value = true
    error.value = null

    try {
      const res = await avatarApi.getAvatarSkills(avatarId)
      if (res.code === 200 && res.data) {
        boundSkills.value = res.data
      }
    } catch (e) {
      console.error('[useAvatarCapability] loadBoundSkills failed:', e)
      error.value = '加载已装备技能失败'
    } finally {
      isLoadingBoundSkills.value = false
    }
  }

  // ---- 加载可用工具 ----
  async function loadAvailableTools() {
    if (isLoadingAvailableTools.value) return
    isLoadingAvailableTools.value = true

    try {
      const res = await avatarApi.getAvailableToolsForAvatar(avatarId)
      if (res.code === 200 && res.data) {
        availableTools.value = res.data
      }
    } catch (e) {
      console.error('[useAvatarCapability] loadAvailableTools failed:', e)
    } finally {
      isLoadingAvailableTools.value = false
    }
  }

  // ---- 加载可用技能 ----
  async function loadAvailableSkills() {
    if (isLoadingAvailableSkills.value) return
    isLoadingAvailableSkills.value = true

    try {
      const res = await avatarApi.getAvailableSkillsForAvatar(avatarId)
      if (res.code === 200 && res.data) {
        availableSkills.value = res.data
      }
    } catch (e) {
      console.error('[useAvatarCapability] loadAvailableSkills failed:', e)
    } finally {
      isLoadingAvailableSkills.value = false
    }
  }

  // ---- 绑定工具 ----
  async function bindTool(toolId: string, config?: Record<string, unknown>) {
    // 配额校验
    if (quota.value.maxTools !== null && quota.value.usedTools >= quota.value.maxTools) {
      error.value = '已达到工具数量上限'
      return false
    }

    try {
      const res = await avatarApi.bindToolToAvatar(avatarId, toolId, config)
      if (res.code === 200 && res.data) {
        boundTools.value.push(res.data)
        // 更新可用列表
        const tool = availableTools.value.find((t) => t.id === toolId)
        if (tool) tool.isBound = true
        return true
      }
      return false
    } catch (e) {
      console.error('[useAvatarCapability] bindTool failed:', e)
      error.value = '绑定工具失败'
      return false
    }
  }

  // ---- 解绑工具 ----
  async function unbindTool(toolId: string) {
    // 乐观更新
    const snapshot = [...boundTools.value]
    boundTools.value = boundTools.value.filter((t) => t.toolId !== toolId)

    try {
      const res = await avatarApi.unbindToolFromAvatar(avatarId, toolId)
      if (res.code !== 200) {
        // 回滚
        boundTools.value = snapshot
        return false
      }
      // 更新可用列表
      const tool = availableTools.value.find((t) => t.id === toolId)
      if (tool) tool.isBound = false
      return true
    } catch (e) {
      boundTools.value = snapshot
      console.error('[useAvatarCapability] unbindTool failed:', e)
      error.value = '解绑工具失败'
      return false
    }
  }

  // ---- 切换工具启用状态 ----
  async function toggleTool(toolId: string, enabled: boolean) {
    // 乐观更新
    const tool = boundTools.value.find((t) => t.toolId === toolId)
    if (!tool) return false
    const oldEnabled = tool.isEnabled
    tool.isEnabled = enabled

    try {
      const res = await avatarApi.toggleToolEnabled(avatarId, toolId, enabled)
      if (res.code !== 200) {
        tool.isEnabled = oldEnabled
        return false
      }
      return true
    } catch (e) {
      tool.isEnabled = oldEnabled
      console.error('[useAvatarCapability] toggleTool failed:', e)
      return false
    }
  }

  // ---- 绑定技能 ----
  async function bindSkill(skillId: string, config?: Record<string, unknown>) {
    // 配额校验
    if (quota.value.maxSkills !== null && quota.value.usedSkills >= quota.value.maxSkills) {
      error.value = '已达到技能数量上限'
      return false
    }

    try {
      const res = await avatarApi.bindSkillToAvatar(avatarId, skillId, config)
      if (res.code === 200 && res.data) {
        boundSkills.value.push(res.data)
        const skill = availableSkills.value.find((s) => s.id === skillId)
        if (skill) skill.isBound = true
        return true
      }
      return false
    } catch (e) {
      console.error('[useAvatarCapability] bindSkill failed:', e)
      error.value = '绑定技能失败'
      return false
    }
  }

  // ---- 解绑技能 ----
  async function unbindSkill(skillId: string) {
    const snapshot = [...boundSkills.value]
    boundSkills.value = boundSkills.value.filter((s) => s.skillId !== skillId)

    try {
      const res = await avatarApi.unbindSkillFromAvatar(avatarId, skillId)
      if (res.code !== 200) {
        boundSkills.value = snapshot
        return false
      }
      const skill = availableSkills.value.find((s) => s.id === skillId)
      if (skill) skill.isBound = false
      return true
    } catch (e) {
      boundSkills.value = snapshot
      console.error('[useAvatarCapability] unbindSkill failed:', e)
      error.value = '解绑技能失败'
      return false
    }
  }

  // ---- 切换技能启用状态 ----
  async function toggleSkill(skillId: string, enabled: boolean) {
    const skill = boundSkills.value.find((s) => s.skillId === skillId)
    if (!skill) return false
    const oldEnabled = skill.isEnabled
    skill.isEnabled = enabled

    try {
      const res = await avatarApi.toggleSkillEnabled(avatarId, skillId, enabled)
      if (res.code !== 200) {
        skill.isEnabled = oldEnabled
        return false
      }
      return true
    } catch (e) {
      skill.isEnabled = oldEnabled
      console.error('[useAvatarCapability] toggleSkill failed:', e)
      return false
    }
  }

  // ---- 加载所有数据 ----
  async function loadAll() {
    await Promise.all([
      loadBoundTools(),
      loadBoundSkills(),
      loadAvailableTools(),
      loadAvailableSkills(),
    ])
  }

  // ---- 初始化加载 ----
  loadAll()

  return {
    // 状态
    boundTools,
    boundSkills,
    availableTools,
    availableSkills,
    isLoadingBoundTools,
    isLoadingBoundSkills,
    isLoadingAvailableTools,
    isLoadingAvailableSkills,
    error,

    // 配额
    quota,

    // 方法
    loadBoundTools,
    loadBoundSkills,
    loadAvailableTools,
    loadAvailableSkills,
    loadAll,
    bindTool,
    unbindTool,
    toggleTool,
    bindSkill,
    unbindSkill,
    toggleSkill,
  }
}
