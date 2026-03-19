<script setup lang="ts">
/**
 * ProfileHeader - 顶部用户身份信息栏
 *
 * 水平布局：头像(可上传) + 昵称/Tier/副标题 | Credits + 设置齿轮
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, Zap, Crown, Sparkles, TrendingUp, Camera, Loader2, LogOut } from 'lucide-vue-next'

const { t } = useI18n()
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import AvatarWithTierRing from '@/components/ui/AvatarWithTierRing.vue'
import type { TierType, UserSubscription } from '@/types/subscription'

interface ProfileHeaderUser {
  nickname?: string
  username?: string
  avatarUrl?: string
}

const props = defineProps<{
  user: ProfileHeaderUser | null
  tierType: TierType
  credits: number
  formattedCredits: string
  memberSince: string | null
  subscription: UserSubscription | undefined
  subscriptionEndDate: string | null
  isUltra: boolean
  isUploadingAvatar: boolean
}>()

const emit = defineEmits<{
  openPricing: []
  uploadAvatar: [file: File]
  logout: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const tierLabel = computed(() => {
  const map: Record<TierType, { text: string; icon: typeof Sparkles | typeof Crown | typeof TrendingUp | null }> = {
    ultra: { text: 'ULTRA', icon: Sparkles },
    turbo: { text: 'TURBO', icon: Crown },
    pro: { text: 'PRO', icon: TrendingUp },
    free: { text: 'Free', icon: null }
  }
  return map[props.tierType] || map.free
})

function triggerFileInput() {
  if (props.isUploadingAvatar) return
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('uploadAvatar', file)
    input.value = '' // reset for re-upload
  }
}
</script>

<template>
  <header class="flex items-center justify-between px-2 py-6">
    <!-- 左侧：头像 + 身份信息 -->
    <div class="flex items-center gap-4">
      <!-- 头像（可点击上传） -->
      <div class="group relative cursor-pointer" role="button" tabindex="0" :aria-label="t('profile.header.uploadAvatar')" @click="triggerFileInput" @keydown.enter="triggerFileInput">
        <AvatarWithTierRing
          :src="user?.avatarUrl"
          :name="user?.nickname || 'User'"
          :tier="tierType"
          size="xl"
          :show-badge="true"
        />
        <!-- 上传遮罩（付费用户有光环 padding 2px，需内缩匹配头像） -->
        <div
          class="absolute flex items-center justify-center rounded-full transition-opacity"
          :class="[
            tierType !== 'free' ? 'inset-[2px]' : 'inset-0',
            isUploadingAvatar
              ? 'bg-black/40 opacity-100'
              : 'bg-black/30 opacity-0 group-hover:opacity-100'
          ]"
        >
          <Loader2 v-if="isUploadingAvatar" :size="20" class="animate-spin text-white" />
          <Camera v-else :size="18" class="text-white" />
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <!-- 昵称 + 副标题 -->
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ user?.nickname || 'User' }}
        </h1>
        <div class="mt-1 flex items-center gap-3 text-xs font-medium text-slate-400 dark:text-zinc-500">
          <span v-if="user?.username">@{{ user.username }}</span>
          <span v-if="user?.username && (subscriptionEndDate || memberSince)" class="h-1 w-1 rounded-full bg-slate-300 dark:bg-zinc-600" />
          <span v-if="subscriptionEndDate && tierType !== 'free'" class="flex items-center gap-1">
            <component :is="tierLabel.icon" v-if="tierLabel.icon" :size="10" />
            {{ tierLabel.text }} · {{ subscriptionEndDate }}
          </span>
          <span v-else-if="memberSince" class="flex items-center gap-1">
            <MapPin :size="10" />
            {{ memberSince }} {{ t('profile.header.joined') }}
          </span>
        </div>
      </div>
    </div>

    <!-- 右侧：Credits + 设置 -->
    <div class="flex items-center gap-4">
      <!-- Credits -->
      <button
        class="group hidden items-center gap-1.5 md:flex"
        :class="{ 'cursor-pointer': !isUltra }"
        @click="!isUltra && emit('openPricing')"
      >
        <Zap :size="14" class="text-amber-500" fill="currentColor" />
        <span
          class="text-xl font-bold leading-none tabular-nums text-slate-900 dark:text-white transition-colors group-hover:text-emerald-600 font-mono"
        >
          {{ formattedCredits }}
        </span>
      </button>

      <div class="hidden h-6 w-px bg-slate-200 dark:bg-zinc-700 md:block" />

      <!-- 退出登录 -->
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              :aria-label="t('profile.header.logout')"
              class="flex h-11 w-11 items-center justify-center rounded-full border border-border text-slate-400 dark:text-zinc-500 shadow-sm transition-all hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 dark:hover:text-red-400 active:scale-95"
              @click="emit('logout')"
            >
              <LogOut :size="16" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6">
            {{ t('profile.header.logout') }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </header>
</template>
