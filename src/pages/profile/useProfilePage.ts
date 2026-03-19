/**
 * Profile 页面 Composable
 *
 * 职责：连接 View 层与 Store/API 层，处理页面级业务逻辑
 * 架构：View 通过此 Composable 获取数据和触发动作，不直接调用 API
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import { useAuthStore } from '@/stores/authStore'
import { authApi, type UserProfile, type UserStats } from '@/api/auth'
import { useModalRoute, type SettingsTab } from '@/composables/useModalRoute'
import type { TierType } from '@/types/subscription'
import type { MaxModeInfo, ProfileTabKey, ProfileTab } from './types'

export function useProfilePage() {
  const router = useRouter()
  const { t } = useI18n()
  const authStore = useAuthStore()
  const { openSettings, openPricing } = useModalRoute()

  // ==================== 状态 ====================
  const profile = ref<UserProfile | null>(null)
  const userStats = ref<UserStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isUploadingAvatar = ref(false)

  // ==================== 标签页状态 ====================
  // 设计说明：基于设计巨匠评审（Don Norman, Jakob Nielsen, Steve Krug 等建议）
  // 当前产品阶段（工具+社交双轨，社交功能尚未上线）只展示有实际数据的标签页
  // 社交类标签页（已发布、赞过、灵感、AI 短片）将在功能上线后渐进式添加
  // 参考：docs/design/profile-page-design-masters-analysis.html
  const activeTab = ref<ProfileTabKey>('memory')
  const tabDirection = ref<'left' | 'right'>('right')

  // TAB_ORDER 保留完整顺序，为未来社交功能上线做准备
  const TAB_ORDER: ProfileTabKey[] = ['published', 'liked', 'inspiration', 'clips', 'memory', 'usage']

  // 当前只展示工具类标签页（个人记忆、消费记录）
  // 社交类标签页将在功能就绪后通过条件渲染添加
  const profileTabs = computed<ProfileTab[]>(() => [
    // { key: 'published', label: '已发布', icon: 'FileText' }, // 社交功能：用户发布内容（待上线）
    // { key: 'liked', label: '赞过', icon: 'Heart' }, // 社交功能：点赞内容（待上线）
    // { key: 'inspiration', label: '灵感', icon: 'Lightbulb' }, // 社交功能：收藏灵感（待上线）
    // { key: 'clips', label: 'AI 短片', icon: 'Film' }, // 社交功能：AI 生成短片（待上线）
    { key: 'memory', label: t('profile.tabs.memory'), icon: 'Brain' },
    { key: 'usage', label: t('profile.tabs.usage'), icon: 'Receipt' }
  ])

  // ==================== 计算属性 ====================

  /** 合并 profile + authStore 回退 */
  const user = computed(() => {
    if (profile.value) {
      return {
        ...authStore.user,
        credits: profile.value.credits,
        totalCreditsUsed: profile.value.totalCreditsUsed,
        nickname: profile.value.nickname,
        avatarUrl: profile.value.avatarUrl,
        email: profile.value.email,
        phone: profile.value.phone,
        subscription: profile.value.subscription
      }
    }
    return authStore.user
  })

  /** 当前 Tier */
  const tierType = computed<TierType>(() => {
    return user.value?.subscription?.planId ?? user.value?.tier ?? 'free'
  })

  /** 当前可用 Credits（余额，无上限概念） */
  const credits = computed(() => user.value?.credits ?? 0)

  /** 格式化当前 Credits */
  const formattedCredits = computed(() => formatNumber(credits.value))

  /** 总消耗 Credits */
  const totalCreditsUsed = computed(() => {
    const val = profile.value?.totalCreditsUsed ?? user.value?.totalCreditsUsed ?? 0
    return val
  })

  /** 格式化总消耗 */
  const formattedTotalUsed = computed(() => formatNumber(totalCreditsUsed.value))

  /** 注册日期 */
  const memberSinceDate = computed(() => {
    const created = profile.value?.createdTime
    if (!created) return null
    try {
      return new Date(created).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return null
    }
  })

  /** 订阅到期日 */
  const subscriptionEndDate = computed(() => {
    const endTime = user.value?.subscription?.subscriptionEndTime
    if (!endTime) return null
    try {
      return new Date(endTime).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return null
    }
  })

  /** MAX 模式信息 */
  const maxModeInfo = computed<MaxModeInfo>(() => {
    const sub = user.value?.subscription
    if (!sub) {
      return { remaining: 0, limit: 0, isUnlimited: false }
    }
    const remaining = sub.maxModeRemaining ?? 0
    const limit = sub.plan?.maxModeUsesPerMonth ?? null
    return {
      remaining,
      limit,
      isUnlimited: remaining === -1 || limit === null
    }
  })

  /** 是否为 Ultra（隐藏升级按钮） */
  const isUltra = computed(() => tierType.value === 'ultra')

  // ==================== 动作 ====================

  /** 加载用户数据 */
  const loadData = async () => {
    loading.value = true
    error.value = null
    try {
      const token = authStore.accessToken || undefined
      // 并行获取：Profile 完整数据 + Stats 页面本地数据
      // 同时刷新 authStore 中的共享状态
      const [profileRes, statsRes] = await Promise.all([
        authApi.getUserProfile(token),
        authApi.getUserStats(token),
        authStore.refreshUserProfile()
      ])

      if (profileRes.code === 200) {
        profile.value = profileRes.data
      }

      if (statsRes.code === 200) {
        userStats.value = statsRes.data
      }
    } catch (err) {
      console.error('加载用户数据失败:', err)
      error.value = t('profile.actions.loadError')
    } finally {
      loading.value = false
    }
  }

  /** 重试加载 */
  const retry = () => loadData()

  /** 上传头像 */
  const handleAvatarUpload = async (file: File) => {
    if (isUploadingAvatar.value) return
    isUploadingAvatar.value = true
    try {
      const token = authStore.accessToken || undefined
      const res = await authApi.uploadAvatar(file, token)
      if (res.code === 200 && res.data?.avatarUrl) {
        if (profile.value) {
          profile.value.avatarUrl = res.data.avatarUrl
        }
        await authStore.refreshUserProfile()
        message.success(t('profile.actions.avatarUpdated'))
      } else {
        message.error(res.message || t('profile.actions.uploadFailed'))
      }
    } catch {
      message.error(t('profile.actions.avatarUploadFailed'))
    } finally {
      isUploadingAvatar.value = false
    }
  }

  /** 退出登录（需二次确认） */
  const isLoggingOut = ref(false)
  const handleLogout = () => {
    Modal.confirm({
      title: t('profile.actions.logoutConfirmTitle'),
      content: t('profile.actions.logoutConfirmContent'),
      okText: t('profile.actions.logoutBtn'),
      cancelText: t('common.button.cancel'),
      okButtonProps: { danger: true },
      async onOk() {
        if (isLoggingOut.value) return
        isLoggingOut.value = true
        try {
          await authStore.logout()
          message.success(t('profile.actions.logoutSuccess'))
          router.push('/')
        } catch (err) {
          console.error('退出登录失败:', err)
          message.error(t('profile.actions.logoutFailed'))
        } finally {
          isLoggingOut.value = false
        }
      }
    })
  }

  /** 打开设置指定 Tab */
  const handleOpenSettings = (tab?: SettingsTab) => {
    openSettings(tab)
  }

  /** 打开升级弹窗 */
  const handleOpenPricing = () => {
    openPricing()
  }

  // ==================== 标签页动作 ====================

  /** 切换标签页（带方向感知） */
  const handleTabChange = (tab: ProfileTabKey) => {
    const oldIndex = TAB_ORDER.indexOf(activeTab.value)
    const newIndex = TAB_ORDER.indexOf(tab)
    tabDirection.value = newIndex > oldIndex ? 'right' : 'left'
    activeTab.value = tab
  }

  /** 导航到聊天页 */
  const handleGoToChat = () => {
    router.push('/chat')
  }

  /** 导航到 Playground */
  const handleGoToPlayground = () => {
    router.push('/playground')
  }

  /** 快速输入（暂未接入后端） */
  const handleQuickInput = (_text: string) => {
    message.info(t('profile.actions.featureInDev'))
  }

  // ==================== 生命周期 ====================
  onMounted(() => {
    loadData()
  })

  // ==================== 工具函数 ====================
  function formatNumber(val: number): string {
    const roundedVal = Math.round(val)
    if (roundedVal >= 1000) {
      return `${Math.round(roundedVal / 1000)}k`
    }
    return roundedVal.toString()
  }

  return {
    // 状态
    profile,
    userStats,
    loading,
    error,
    isUploadingAvatar,

    // 标签页
    activeTab,
    tabDirection,
    profileTabs,

    // 计算属性
    user,
    tierType,
    credits,
    formattedCredits,
    totalCreditsUsed,
    formattedTotalUsed,
    memberSinceDate,
    subscriptionEndDate,
    maxModeInfo,
    isUltra,

    // 动作
    retry,
    handleAvatarUpload,
    handleLogout,
    handleOpenSettings,
    handleOpenPricing,

    // 标签页动作
    handleTabChange,
    handleGoToChat,
    handleGoToPlayground,
    handleQuickInput
  }
}
