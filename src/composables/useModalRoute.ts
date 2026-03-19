/**
 * useModalRoute - URL Hash 驱动的弹窗状态管理
 *
 * 支持的 hash 格式：
 * - #settings - 打开设置弹窗（默认 account tab）
 * - #settings/account - 打开设置弹窗的 account tab
 * - #settings/preferences - 打开设置弹窗的 preferences tab
 * - #settings/help - 打开设置弹窗的 help tab

 * - #pricing - 打开升级/定价弹窗
 *
 * 使用方式：
 * const { settingsVisible, settingsTab, pricingVisible, openSettings, openPricing, closeModal } = useModalRoute()
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'


// 有效的设置 Tab 列表
export type SettingsTab = 'account' | 'preferences' | 'help'
const VALID_SETTINGS_TABS: SettingsTab[] = ['account', 'preferences', 'help']

// 弹窗类型
export type ModalType = 'settings' | 'pricing' | null

export function useModalRoute() {
  // 弹窗状态

  const settingsVisible = ref(false)
  const settingsTab = ref<SettingsTab>('account')
  const pricingVisible = ref(false)
  // 记录是否需要返回设置弹窗
  const returnToSettings = ref(false)

  /**
   * 解析 hash 字符串
   */
  const parseHash = (hash: string): { modal: ModalType; tab?: SettingsTab } => {
    if (!hash || hash === '#') {
      return { modal: null }
    }

    // 移除开头的 #
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash
    const parts = cleanHash.split('/')

    // 支持 setting 和 settings
    if (parts[0] === 'settings' || parts[0] === 'setting') {
      const tab = parts[1] as SettingsTab
      return {
        modal: 'settings',
        tab: VALID_SETTINGS_TABS.includes(tab) ? tab : 'account'
      }
    }

    if (parts[0] === 'pricing') {
      return { modal: 'pricing' }
    }

    return { modal: null }
  }

  /**
   * 根据 hash 更新弹窗状态
   */
  const syncFromHash = () => {
    const hash = window.location.hash
    const { modal, tab } = parseHash(hash)

    settingsVisible.value = modal === 'settings'
    pricingVisible.value = modal === 'pricing'

    if (modal === 'settings' && tab) {
      settingsTab.value = tab
    }
  }

  /**
   * 更新 URL hash（不触发页面跳转）
   */
  const updateHash = (hash: string) => {
    const newUrl = hash ? `${window.location.pathname}${window.location.search}#${hash}` : `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', newUrl)
  }

  /**
   * 打开设置弹窗
   */
  const openSettings = (tab: SettingsTab = 'account') => {

    settingsTab.value = tab
    settingsVisible.value = true
    pricingVisible.value = false
    // 用户偏好使用单数 setting
    updateHash(tab === 'account' ? 'setting' : `setting/${tab}`)
  }

  /**
   * 打开定价/升级弹窗
   */
  const openPricing = () => {
    // 如果当前在设置弹窗，记录状态以便返回
    if (settingsVisible.value) {
      returnToSettings.value = true
    }
    pricingVisible.value = true
    settingsVisible.value = false
    updateHash('pricing')
  }

  /**
   * 关闭所有弹窗
   */
  const closeModal = () => {
    returnToSettings.value = false // 清除返回标记
    settingsVisible.value = false
    pricingVisible.value = false
    updateHash('')
  }

  /**
   * 切换设置 Tab（仅在设置弹窗打开时调用）
   */
  const switchSettingsTab = (tab: SettingsTab) => {
    if (settingsVisible.value) {
      settingsTab.value = tab
      updateHash(tab === 'account' ? 'setting' : `setting/${tab}`)
    }
  }

  // 监听 hashchange 事件（浏览器前进/后退）
  const handleHashChange = () => {
    syncFromHash()
  }

  // 初始化和清理
  onMounted(() => {
    // 初始同步
    syncFromHash()
    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange)
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', handleHashChange)
  })

  // 监听 settingsVisible 变化，同步到 URL
  watch(settingsVisible, (visible) => {
    if (!visible && !pricingVisible.value) {
      // 如果关闭设置且定价也没打开，清空 hash
      const currentHash = window.location.hash
      if (currentHash.includes('settings') || currentHash.includes('setting')) {
        updateHash('')
      }
    }
  })

  // 监听 pricingVisible 变化，同步到 URL
  watch(pricingVisible, (visible) => {
    if (!visible) {
      // 检查是否需要返回设置弹窗
      if (returnToSettings.value) {
        returnToSettings.value = false
        settingsVisible.value = true
        // 恢复设置弹窗的 hash
        const tab = settingsTab.value
        updateHash(tab === 'account' ? 'setting' : `setting/${tab}`)
        return
      }

      if (!settingsVisible.value) {
        const currentHash = window.location.hash
        if (currentHash.includes('pricing')) {
          updateHash('')
        }
      }
    }
  })

  return {
    // 状态
    settingsVisible,
    settingsTab,
    pricingVisible,

    // 方法
    openSettings,
    openPricing,
    closeModal,
    switchSettingsTab
  }
}
