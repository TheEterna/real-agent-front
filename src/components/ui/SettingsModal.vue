<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  User,
  Settings2,
  HelpCircle,
  Crown,
  Zap,
  LogOut,
  Edit2,
  Sparkles,
  Calendar,
  Info
} from 'lucide-vue-next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/composables/useTheme'
import { useLocale } from '@/composables/useLocale'
import { useInputPreferences } from '@/composables/useInputPreferences'
import { billingApi } from '@/api/billing'
import { useI18n } from 'vue-i18n'
import AvatarWithTierRing from '@/components/ui/AvatarWithTierRing.vue'

const { t } = useI18n()

// 假设项目中有全局 message 或使用自己封装的 toast
// 这里移除了 ant-design-vue 的 message，改为原生或预期的通知方式
const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  // 替换为您的实际 Toast 实现
  console.log(`[${type}] ${msg}`)
  alert(msg) // 仅作 fallback
}

interface Props {
  visible: boolean
  initialTab?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  initialTab: 'account'
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'tabChange', tab: string): void
  (e: 'openPricing'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const activeKey = ref<string>('account')
const userProfile = computed(() => authStore.user)
const { themeMode, setTheme } = useTheme()
const { currentLocale, setLocale } = useLocale()
const { preferences, updatePreferences } = useInputPreferences()

const dailyCreditsStatus = ref({ claimed: false, message: '' })
const isClaimingCredits = ref(false)

const fetchDailyCreditsStatus = async () => {
  try {
    const res = await billingApi.getDailyCreditsStatus()
    if (res) {
      dailyCreditsStatus.value = res
    }
  } catch (err) {
    console.error('获取每日积分状态失败', err)
  }
}

const handleClaimDailyCredits = async () => {
  if (isClaimingCredits.value) return
  isClaimingCredits.value = true
  try {
    const res = await billingApi.claimDailyCredits()
    if (res?.success) {
      showToast(res.message, 'success')
      await fetchDailyCreditsStatus()
      await authStore.refreshUserProfile()
    } else {
      showToast(res?.message || t('uiComp.settings.account.claimFailed'), 'error')
    }
  } catch (err: any) {
    showToast(err.message || t('uiComp.settings.account.claimFailed'), 'error')
  } finally {
    isClaimingCredits.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  handleClose()
  void router.push('/')
}

const changelogs = computed(() => [
  { version: 'v3.0.0', date: '2026-03-05', desc: t('uiComp.settings.help.changelogs.v300') },
  { version: 'v2.9.0', date: '2026-03-02', desc: t('uiComp.settings.help.changelogs.v290') },
  { version: 'v2.8.5', date: '2026-02-26', desc: t('uiComp.settings.help.changelogs.v285') }
])

const settingItems = computed(() => [
  { key: 'account', label: t('uiComp.settings.tabs.account'), icon: User, desc: t('uiComp.settings.tabs.accountDesc') },
  { key: 'preferences', label: t('uiComp.settings.tabs.preferences'), icon: Settings2, desc: t('uiComp.settings.tabs.preferencesDesc') },
  { key: 'help', label: t('uiComp.settings.tabs.help'), icon: HelpCircle, desc: t('uiComp.settings.tabs.helpDesc') }
])

const handleClose = () => {
  emit('update:visible', false)
}

const handleMenuClick = (key: string) => {
  activeKey.value = key
  emit('tabChange', key)
}

const handleUpgradeClick = () => {
  emit('openPricing')
}

const goToProfile = () => {
  handleClose()
  void router.push('/profile')
}

const formatCredits = (credits: number | undefined): string => {
  if (!credits && credits !== 0) return '0.0'
  return credits.toFixed(1)
}

const currentTier = computed(() => {
  return userProfile.value?.subscription?.planId || userProfile.value?.tier || 'free'
})

const getTierLabel = (tier: string | undefined): string => {
  const key = tier || 'free'
  const labelKey = `uiComp.settings.account.tierLabels.${key}`
  return t(labelKey)
}

const formatExpireDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return t('uiComp.settings.account.expireDate.forever')
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return t('uiComp.settings.account.expireDate.expired')
  if (diffDays === 0) return t('uiComp.settings.account.expireDate.today')
  if (diffDays <= 7) return t('uiComp.settings.account.expireDate.daysLater', { days: diffDays })

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const updateRequireCommandEnter = (checked: boolean) => {
  updatePreferences({ requireCommandEnterToSubmit: checked })
}

const updateTaskCompleteNotice = (checked: boolean) => {
  updatePreferences({ taskCompleteNotification: checked })
}

const updateTaskCompleteSound = (checked: boolean) => {
  updatePreferences({ taskCompleteSound: checked })
}

watch(
  () => props.initialTab,
  (newTab) => {
    if (newTab && ['account', 'preferences', 'help'].includes(newTab)) {
      activeKey.value = newTab
    }
  },
  { immediate: true }
)

watch(() => props.visible, (visible) => {
  if (visible && props.initialTab) {
    activeKey.value = props.initialTab
  }
  if (visible && activeKey.value === 'account') {
    void fetchDailyCreditsStatus()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @mousedown.self="handleClose">
        <div class="modal-content">
          <div class="settings-container">
            
            <div class="sidebar">
              <div class="sidebar-header">
                <span class="logo-text">{{ t('uiComp.settings.title') }}</span>
              </div>

              <div class="nav-list">
                <button
                    v-for="item in settingItems"
                    :key="item.key"
                    class="nav-item"
                    :class="{ active: activeKey === item.key }"
                    @click="handleMenuClick(item.key)"
                >
                  <component :is="item.icon" :size="18" class="nav-icon" stroke-width="2" />
                  <span class="label">{{ item.label }}</span>
                </button>
              </div>
            </div>

            <div class="main-content">
              <div class="content-header">
                <h2 class="section-title">
                  {{ settingItems.find(i => i.key === activeKey)?.label }}
                </h2>
                <button class="close-btn" @click="handleClose" :aria-label="t('common.tooltip.close')">
                  <X :size="20" />
                </button>
              </div>

              <div class="content-body custom-scrollbar">

                <div v-if="activeKey === 'account' && userProfile" class="panel-section fade-in flex flex-col justify-between flex-1 h-full">
                  
                  <div class="profile-masthead">
                    <div class="user-id-group">
                      <AvatarWithTierRing
                        :src="userProfile?.avatarUrl"
                        :name="userProfile?.nickname || 'User'"
                        :tier="currentTier"
                        size="2xl"
                        :show-badge="true"
                      />
                      <div class="meta">
                        <h3 class="name">{{ userProfile?.nickname || t('uiComp.settings.account.noNickname') }}</h3>
                        <p class="contact">{{ userProfile?.email || userProfile?.phone || t('uiComp.settings.account.noContact') }}</p>
                      </div>
                    </div>
                    <div class="actions">
                      <button class="icon-action-btn" @click="goToProfile" :title="t('uiComp.settings.account.editProfile')">
                        <Edit2 :size="16" />
                      </button>
                      <button class="icon-action-btn danger" @click="handleLogout" :title="t('uiComp.settings.account.logout')">
                        <LogOut :size="16" />
                      </button>
                    </div>
                  </div>

                  <div class="unified-usage-card">
                    <div class="card-header">
                      <div class="tier-badge">
                        <Crown v-if="currentTier === 'ultra'" :size="18" class="text-purple-500" />
                        <Zap v-else-if="currentTier === 'turbo'" :size="18" class="text-amber-500" />
                        <Sparkles v-else :size="18" class="text-zinc-600 dark:text-zinc-400" />
                        <span class="tier-name">{{ getTierLabel(currentTier) }}</span>
                        
                        <div v-if="currentTier !== 'free' && userProfile?.subscription" class="tier-expiry">
                          <span class="dot">·</span>
                          <span>{{ formatExpireDate(userProfile.subscription.subscriptionEndTime) }}</span>
                          <span class="dot">·</span>
                          <!-- <span>{{ userProfile.subscription.autoRenew ? '自动续费' : '手动续费' }}</span> -->
                        </div>
                      </div>
                      
                      <button class="core-action-btn" :class="{ 'is-upgrade': currentTier === 'free' }" @click="handleUpgradeClick">
                        {{ currentTier === 'free' ? t('uiComp.settings.account.upgradeMember') : t('uiComp.settings.account.manageSubscription') }}
                      </button>
                    </div>

                    <div class="card-body">
                      <div class="usage-row">
                        <div class="usage-label">
                          <Sparkles :size="16" class="icon-muted" />
                          <div class="label-text">
                            <span class="title">{{ t('uiComp.settings.account.currentCredits') }}</span>
                            <span class="desc">{{ t('uiComp.settings.account.todayUsed', { amount: formatCredits(userProfile?.totalCreditsUsed) }) }}</span>
                          </div>
                        </div>
                        <div class="usage-value">
                          <span class="amount">{{ formatCredits(userProfile?.credits) }}</span>
                        </div>
                      </div>

                      <div class="usage-row">
                        <div class="usage-label">
                          <Calendar :size="16" class="icon-muted" />
                          <div class="label-text">
                            <span class="title">{{ t('uiComp.settings.account.dailyRefresh') }}</span>
                            <span class="desc">{{ dailyCreditsStatus.message || t('uiComp.settings.account.dailyRefreshDefault') }}</span>
                          </div>
                        </div>
                        <div class="usage-value">
                          <span class="amount muted">300</span>
                          <button
                            class="claim-text-btn"
                            :class="{ claimed: dailyCreditsStatus.claimed }"
                            :disabled="dailyCreditsStatus.claimed || isClaimingCredits"
                            @click="handleClaimDailyCredits"
                          >
                            {{ isClaimingCredits ? t('uiComp.settings.account.claiming') : (dailyCreditsStatus.claimed ? t('uiComp.settings.account.claimed') : t('uiComp.settings.account.claimCredits')) }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="relative w-full overflow-hidden rounded-[20px] bg-[#050505] p-5 mt-2 flex items-center justify-between border border-zinc-800/80 shadow-2xl group cursor-pointer transition-transform duration-300 hover:scale-[1.01]">

                    <div class="absolute inset-0 z-0 pointer-events-none starry-bg opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div class="relative z-10 flex items-center gap-5 pl-2">
                      <div class="flex items-center gap-2">
                        <!-- Logo 图标 -->
                        <svg class="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stop-color="#ff6b6b">
                                <animate attributeName="stop-color" values="#ff6b6b;#feca57;#48dbfb;#ff9ff3;#54a0ff;#5f27cd;#ff6b6b" dur="3s" repeatCount="indefinite" />
                              </stop>
                              <stop offset="25%" stop-color="#feca57">
                                <animate attributeName="stop-color" values="#feca57;#48dbfb;#ff9ff3;#54a0ff;#5f27cd;#ff6b6b;#feca57" dur="3s" repeatCount="indefinite" />
                              </stop>
                              <stop offset="50%" stop-color="#48dbfb">
                                <animate attributeName="stop-color" values="#48dbfb;#ff9ff3;#54a0ff;#5f27cd;#ff6b6b;#feca57;#48dbfb" dur="3s" repeatCount="indefinite" />
                              </stop>
                              <stop offset="75%" stop-color="#ff9ff3">
                                <animate attributeName="stop-color" values="#ff9ff3;#54a0ff;#5f27cd;#ff6b6b;#feca57;#48dbfb;#ff9ff3" dur="3s" repeatCount="indefinite" />
                              </stop>
                              <stop offset="100%" stop-color="#54a0ff">
                                <animate attributeName="stop-color" values="#54a0ff;#5f27cd;#ff6b6b;#feca57;#48dbfb;#ff9ff3;#54a0ff" dur="3s" repeatCount="indefinite" />
                              </stop>
                            </linearGradient>
                          </defs>
                          <path d="M12 2L4 8.5V15.5L12 22L20 15.5V8.5L12 2Z" stroke="url(#logoGradient)" stroke-width="1.5" stroke-linejoin="round"/>
                          <path d="M12 2V22" stroke="url(#logoGradient)" stroke-width="1.5" stroke-linejoin="round"/>
                          <path d="M4 8.5L20 8.5" stroke="url(#logoGradient)" stroke-width="1.5" stroke-linejoin="round"/>
                          <path d="M7.5 5.5L12 8.5L16.5 5.5" stroke="url(#logoGradient)" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                        <span class="text-lg tracking-wide tier-badge-ultra">Volo AI</span>
                      </div>

                      <i18n-t keypath="uiComp.settings.account.inviteTitle" tag="span" class="text-zinc-400 text-[14px] font-medium tracking-wide">
                        <template #turboReward>
                          <span class="text-amber-200">{{ t('uiComp.settings.account.turboReward') }}</span>
                        </template>
                        <template #creditsReward>
                          <span class="text-emerald-300">{{ t('uiComp.settings.account.creditsReward') }}</span>
                        </template>
                      </i18n-t>
                    </div>

                    <button class="relative z-10 bg-white text-black px-6 py-2 rounded-full font-bold text-[13px] tracking-wide hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                      {{ t('uiComp.settings.account.inviteButton') }}
                    </button>
                  </div>
                </div>

                <div v-else-if="activeKey === 'preferences'" class="panel-section fade-in">
                  
                  <div class="setting-block">
                    <h3 class="block-title">{{ t('uiComp.settings.preferences.appearance') }}</h3>
                    <div class="theme-switcher">
                      <button class="theme-opt" :class="{ active: themeMode === 'light' }" @click="setTheme('light')">
                        <Sun :size="18" /> {{ t('uiComp.settings.preferences.themeLight') }}
                      </button>
                      <button class="theme-opt" :class="{ active: themeMode === 'dark' }" @click="setTheme('dark')">
                        <Moon :size="18" /> {{ t('uiComp.settings.preferences.themeDark') }}
                      </button>
                      <button class="theme-opt" :class="{ active: themeMode === 'system' }" @click="setTheme('system')">
                        <Monitor :size="18" /> {{ t('uiComp.settings.preferences.themeSystem') }}
                      </button>
                    </div>
                  </div>

                  <div class="setting-block">
                    <h3 class="block-title">{{ t('uiComp.settings.preferences.language') }}</h3>
                    <Select :default-value="currentLocale" @update:model-value="(val: string) => setLocale(val as 'zh' | 'en')">
                      <SelectTrigger class="w-full h-11 rounded-[10px] bg-[var(--bg-card)] border-[var(--border-subtle)] text-sm text-[var(--text-primary)]" :aria-label="t('uiComp.settings.preferences.selectLanguage')">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent class="z-[1100]">
                        <SelectItem value="zh">简体中文 (Chinese)</SelectItem>
                        <SelectItem value="en">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div class="setting-block">
                    <h3 class="block-title">{{ t('uiComp.settings.preferences.interaction') }}</h3>
                    <div class="switch-list">
                      <div class="switch-row">
                        <div class="switch-info">
                          <span class="title">{{ t('uiComp.settings.preferences.taskNotification') }}</span>
                          <span class="desc">{{ t('uiComp.settings.preferences.taskNotificationDesc') }}</span>
                        </div>
                        <Switch :checked="preferences.taskCompleteNotification" @update:checked="updateTaskCompleteNotice" />
                      </div>

                      <div class="switch-row">
                        <div class="switch-info">
                          <span class="title">{{ t('uiComp.settings.preferences.taskSound') }}</span>
                          <span class="desc">{{ t('uiComp.settings.preferences.taskSoundDesc') }}</span>
                        </div>
                        <Switch :checked="preferences.taskCompleteSound" @update:checked="updateTaskCompleteSound" />
                      </div>

                      <div class="switch-row">
                        <div class="switch-info">
                          <span class="title">{{ t('uiComp.settings.preferences.cmdEnterSend') }}</span>
                          <span class="desc">{{ t('uiComp.settings.preferences.cmdEnterSendDesc') }}</span>
                        </div>
                        <Switch :checked="preferences.requireCommandEnterToSubmit" @update:checked="updateRequireCommandEnter" />
                      </div>
                    </div>
                  </div>

                </div>

                <div v-else-if="activeKey === 'help'" class="panel-section fade-in">
                  
                  <div class="setting-block">
                    <h3 class="block-title">{{ t('uiComp.settings.help.changelog') }}</h3>
                    <div class="changelog-timeline">
                      <div v-for="item in changelogs" :key="item.version" class="timeline-item">
                        <div class="timeline-header">
                          <span class="version">{{ item.version }}</span>
                          <span class="date">{{ item.date }}</span>
                        </div>
                        <p class="content">{{ item.desc }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="setting-block">
                    <h3 class="block-title">{{ t('uiComp.settings.help.contactSupport') }}</h3>
                    <div class="support-card">
                      <div class="qr-code-wrapper">
                        <img src="/qrcode.jpg" alt="WeChat" class="qr-code" />
                      </div>
                      <div class="support-info">
                        <h4>{{ t('uiComp.settings.help.supportWechat') }}</h4>
                        <span class="mono-id">zhongyong522</span>
                        <p>{{ t('uiComp.settings.help.supportDesc') }}</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>

/* ==========================================================
   星空背景 (Starry Background)
   ========================================================== */
.starry-bg {
  background-image:
      radial-gradient(circle at 15% 50%, rgba(255, 255, 255, 0.8) 1px, transparent 1.5px),
      radial-gradient(circle at 85% 30%, rgba(255, 255, 255, 0.6) 1px, transparent 1.5px),
      radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.9) 1px, transparent 1.5px),
      radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
      radial-gradient(circle at 75% 70%, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
      radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
      radial-gradient(circle at 90% 85%, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
      radial-gradient(circle at 10% 90%, rgba(255, 255, 255, 0.5) 1px, transparent 1px);
  background-size: 200px 100px;
  animation: cosmic-drift 40s linear infinite;
}

@keyframes cosmic-drift {
  0% { background-position: 0 0; }
  100% { background-position: -400px 0; }
}

/* ==========================================================
   Ultra 彩钻渐变 (来自参考代码)
   ========================================================== */
.tier-badge-ultra {
  font-weight: 800;
  background: linear-gradient(
          135deg,
          #ff6b6b 0%,
          #feca57 20%,
          #48dbfb 40%,
          #ff9ff3 60%,
          #54a0ff 80%,
          #5f27cd 100%
  );
  background-size: 200% 200%;
  animation: rainbow-shift 3s ease infinite;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Logo 图标样式 */
.logo-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(255, 107, 107, 0.3));
}

@keyframes rainbow-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
/* ==========================================================
   CSS Variables & Design Tokens (Zinc/Slate Aesthetics)
   ========================================================== */
.modal-overlay {
  --bg-modal: #ffffff;
  --bg-sidebar: #fbfbfc;
  --bg-card: #f4f4f5; // zinc-100
  --bg-card-hover: #e4e4e7; // zinc-200
  --text-primary: #09090b; // zinc-950
  --text-secondary: #71717a; // zinc-500
  --border-subtle: rgba(0, 0, 0, 0.08);
  --border-focus: #18181b;
  --accent-black: #18181b;
  --accent-white: #fafafa;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-fluid: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-snap: cubic-bezier(0.4, 0, 0.2, 1);

  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
  .modal-content {
    transition: transform 0.4s var(--ease-spring), opacity 0.3s ease;
  }
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  .modal-content {
    transform: scale(0.96) translateY(10px);
  }
}

.fade-in {
  animation: fadeIn 0.4s var(--ease-fluid) forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-content {
  width: min(840px, 100%);
  height: 550px;
  max-height: calc(100vh - 40px);
}

.settings-container {
  display: flex;
  height: 100%;
  background: var(--bg-modal);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-subtle);
}

/* ==========================================================
   Sidebar
   ========================================================== */
.sidebar {
  width: 240px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 0 12px;
  margin-bottom: 24px;
  
  .logo-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s var(--ease-snap);
  
  .label {
    font-size: 14px;
    font-weight: 500;
  }
  
  &:hover {
    background: var(--bg-card);
    color: var(--text-primary);
  }
  
  &.active {
    background: var(--bg-card-hover);
    color: var(--text-primary);
    font-weight: 600;
  }

  &:active {
    transform: scale(0.97);
  }
}

/* ==========================================================
   Main Content Area
   ========================================================== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  min-width: 0; /* flex box truncation fix */
}

.content-header {
  padding: 24px 32px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s var(--ease-snap);

    &:hover {
      background: var(--bg-card);
      color: var(--text-primary);
    }
    &:active {
      transform: scale(0.92);
    }
  }
}

.content-body {
  padding: 20px 32px 32px;
  overflow-y: auto;
  flex: 1;

}

/* ==========================================================
   1. Account & Usage (The Core Reshape)
   ========================================================== */
.profile-masthead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .user-id-group {
    display: flex;
    align-items: center;
    gap: 16px;



    .meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .name {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.01em;
      }
      .contact {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }

  .actions {
    display: flex;
    gap: 8px;

    .icon-action-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-modal);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s var(--ease-snap);

      &:hover {
        background: var(--bg-card);
        color: var(--text-primary);
      }
      &:active {
        transform: scale(0.92);
      }

      &.danger:hover {
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.05);
      }
    }
  }
}

.unified-usage-card {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;

  .card-header {
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-subtle);

    .tier-badge {
      display: flex;
      align-items: center;
      gap: 8px;

      .tier-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .tier-expiry {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);
        
        .dot { opacity: 0.5; }
      }
    }

    .core-action-btn {
      padding: 8px 16px;
      border-radius: 20px; // Pill shape
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s var(--ease-snap);
      border: 1px solid var(--border-subtle);
      background: var(--bg-modal);
      color: var(--text-primary);

      &.is-upgrade {
        background: var(--accent-black);
        color: var(--accent-white);
        border: none;
      }

      &:active {
        transform: scale(0.96);
      }
      &:hover.is-upgrade {
        opacity: 0.85;
      }
      &:hover:not(.is-upgrade) {
        background: var(--bg-card-hover);
      }
    }
  }

  .card-body {
    display: flex;
    flex-direction: column;

    .usage-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(0,0,0,0.03);
      
      &:last-child {
        border-bottom: none;
      }

      .usage-label {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        .icon-muted {
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .label-text {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .title {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
          }
          .desc {
            font-size: 13px;
            color: var(--text-secondary);
          }
        }
      }

      .usage-value {
        display: flex;
        align-items: center;
        gap: 16px;

        .amount {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;

          &.muted {
            font-size: 18px;
            color: var(--text-secondary);
          }
        }

        .claim-text-btn {
          background: transparent;
          border: 1px solid var(--border-subtle);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s var(--ease-snap);

          &:hover:not(:disabled) {
            background: var(--bg-card-hover);
          }
          &:active:not(:disabled) {
            transform: scale(0.94);
          }
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: rgba(0,0,0,0.02);
          }
          &.claimed {
            color: var(--text-secondary);
            border-color: transparent;
          }
        }
      }
    }
  }
}

/* ==========================================================
   2. Preferences
   ========================================================== */
.setting-block {
  margin-bottom: 32px;

  .block-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
  }
}

.theme-switcher {
  display: flex;
  background: var(--bg-card);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);

  .theme-opt {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s var(--ease-snap);

    &:hover {
      color: var(--text-primary);
    }
    
    &.active {
      background: var(--bg-modal);
      color: var(--text-primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    
    &:active {
      transform: scale(0.97);
    }
  }
}


.switch-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(0,0,0,0.15);
  }

  .switch-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }
    .desc {
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
}


/* ==========================================================
   3. Help & Support
   ========================================================== */
.changelog-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .timeline-item {
    padding: 16px;
    background: var(--bg-card);
    border-radius: 10px;
    border: 1px solid var(--border-subtle);

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .version {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .date {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }

    .content {
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-secondary);
    }
  }
}

.support-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  align-items: center;

  .qr-code-wrapper {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    border: 1px solid var(--border-subtle);
    overflow: hidden;
    flex-shrink: 0;
  }

  .qr-code {
    width: calc(100% + 6px);
    height: calc(100% + 16px);
    margin: -8px -3px;
    object-fit: cover;
  }

  .support-info {
    flex: 1;

    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--text-primary);
    }
    .mono-id {
      display: inline-block;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      padding: 4px 8px;
      background: rgba(0,0,0,0.05);
      border-radius: 4px;
      color: var(--text-primary);
      margin-bottom: 8px;
      user-select: all;
    }
    p {
      margin: 0;
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
    &:hover { background: rgba(0,0,0,0.2); }
  }
}

/* ==========================================================
   Dark Mode Overrides
   ========================================================== */
.dark {
  .modal-overlay {
    --bg-modal: #18181b; // zinc-900
    --bg-sidebar: #131315;
    --bg-card: rgba(255, 255, 255, 0.04);
    --bg-card-hover: rgba(255, 255, 255, 0.08);
    --text-primary: #f4f4f5; // zinc-100
    --text-secondary: #a1a1aa; // zinc-400
    --border-subtle: rgba(255, 255, 255, 0.08);
    --border-focus: rgba(255, 255, 255, 0.2);
    --accent-black: #f4f4f5;
    --accent-white: #09090b;

    background: rgba(0, 0, 0, 0.6);
  }

  .settings-container {
    box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .unified-usage-card .card-body .usage-row {
    border-bottom-color: rgba(255, 255, 255, 0.04);
  }

  .toggle-switch .slider {
    background-color: rgba(255,255,255,0.15);
  }

  .support-card .support-info .mono-id {
    background: rgba(255,255,255,0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    &:hover { background: rgba(255,255,255,0.25); }
  }
}
</style>
