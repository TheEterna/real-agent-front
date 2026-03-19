<script setup lang="ts">
/**
 * ProfilePage - 用户个人中心
 *
 * 职责：纯粹的 UI 编排器，通过 useProfilePage composable 获取数据和动作
 * 布局：Header + Tabs（个人记忆 | 使用记录）
 */
import { useI18n } from 'vue-i18n'
import { useProfilePage } from './useProfilePage'
import ProfilePageSkeleton from './components/ProfilePageSkeleton.vue'
import ProfileHeader from './components/ProfileHeader.vue'
import ProfileTabs from './components/ProfileTabs.vue'
import ProfileTabContent from './components/ProfileTabContent.vue'
import ProfileMemoryTab from './components/ProfileMemoryTab.vue'
import UsageLogsSection from './components/UsageLogsSection.vue'
import { AlertCircle, RotateCw } from 'lucide-vue-next'

const { t } = useI18n()

const {
  userStats,
  loading,
  error,
  isUploadingAvatar,

  user,
  tierType,
  credits,
  formattedCredits,
  formattedTotalUsed,
  memberSinceDate,
  subscriptionEndDate,
  maxModeInfo,
  isUltra,

  activeTab,
  tabDirection,
  profileTabs,

  retry,
  handleAvatarUpload,
  handleTabChange,
  handleLogout,
  handleOpenSettings,
  handleOpenPricing,
} = useProfilePage()
</script>

<template>
  <div class="relative h-full w-full overflow-y-auto bg-slate-50 dark:bg-zinc-900">
    <!-- 顶部装饰渐变 -->
    <div class="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-50/60 dark:from-teal-950/40 via-orange-50/20 dark:via-orange-950/20 to-transparent" />

    <!-- 加载骨架屏 -->
    <ProfilePageSkeleton v-if="loading && !user" />

    <!-- 错误状态 -->
    <div v-else-if="error && !user" class="flex min-h-[60vh] items-center justify-center px-4">
      <div class="flex flex-col items-center gap-4 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle :size="24" />
        </div>
        <div>
          <p class="text-base font-medium text-slate-700 dark:text-zinc-200">{{ error }}</p>
          <p class="mt-1 text-[0.8125rem] text-slate-500 dark:text-zinc-400">{{ t('profile.page.errorHint') }}</p>
        </div>
        <button
          class="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 transition-all hover:bg-slate-800 dark:hover:bg-white active:scale-95"
          @click="retry"
        >
          <RotateCw :size="14" />
          <span>{{ t('common.button.retry') }}</span>
        </button>
      </div>
    </div>

    <!-- 主内容 -->
    <div v-else class="relative mx-auto flex h-full flex-col max-w-5xl px-4 pt-2 pb-4">
      <!-- Header -->
      <ProfileHeader
        :user="user"
        :tier-type="tierType"
        :credits="credits"
        :formatted-credits="formattedCredits"
        :member-since="memberSinceDate"
        :subscription="user?.subscription"
        :subscription-end-date="subscriptionEndDate"
        :is-ultra="isUltra"
        :is-uploading-avatar="isUploadingAvatar"
        @open-pricing="handleOpenPricing"
        @upload-avatar="handleAvatarUpload"
        @logout="handleLogout"
      />

      <!-- 标签页导航 -->
      <ProfileTabs
        :active-tab="activeTab"
        :tabs="profileTabs"
        @change="handleTabChange"
      />

      <!-- 标签页内容（flex-1 填满剩余高度） -->
      <ProfileTabContent :active-tab="activeTab" :tab-direction="tabDirection" class="flex-1 min-h-0">
        <template #memory>
          <ProfileMemoryTab />
        </template>
        <template #usage>
          <UsageLogsSection
            :user-stats="userStats"
            :formatted-total-used="formattedTotalUsed"
            :max-mode="maxModeInfo"
          />
        </template>
      </ProfileTabContent>

    </div>
  </div>
</template>
