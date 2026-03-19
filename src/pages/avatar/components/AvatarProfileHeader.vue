<!-- ================================================
  AvatarProfileHeader — 分身主页头部（设计稿对齐版）
  职责：居中大头像 + 名称 + 标签 + 统计行 + 操作按钮
  设计语言：全宽渐变背景、居中布局、宽松间距、清晰信息层级
================================================ -->
<template>
  <header ref="headerRef" class="avatar-profile-header relative">
    <!-- 渐变背景区域 -->
    <div class="absolute inset-0 bg-gradient-to-b from-foreground/[0.06] to-transparent pointer-events-none" aria-hidden="true" />

    <!-- 返回按钮（浮动在左上角） -->
    <div class="absolute left-4 top-4 z-10">
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm border border-border/30 transition-all hover:bg-background/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              :aria-label="t('avatar.header.backToList')"
              @click="router.push('/avatar')"
            >
              <ArrowLeft :size="18" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            :side-offset="6"
            class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {{ t('avatar.header.backToList') }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- 居中内容区 -->
    <div class="relative flex flex-col items-center px-8 pt-12 pb-8">
      <!-- 头像圆环（渐变边框） -->
      <div class="avatar-circle-wrapper relative mb-5">
        <div class="avatar-circle-glow absolute inset-[-4px] rounded-full opacity-40" aria-hidden="true" />
        <div class="relative h-20 w-20 rounded-full p-[3px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
          <img
            v-if="avatar?.avatarUrl"
            :src="avatar.avatarUrl"
            :alt="avatar.name || t('avatar.list.avatarAlt')"
            class="h-full w-full rounded-full object-cover bg-background"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center rounded-full bg-background text-xl font-bold text-foreground"
          >
            {{ (avatar?.name || t('avatar.list.unnamed'))[0] }}
          </div>
        </div>
      </div>

      <!-- 名称 -->
      <h1 class="text-2xl font-bold text-foreground tracking-tight">
        {{ avatar?.name || t('avatar.list.unnamed') }}
      </h1>

      <!-- 标签行 -->
      <div class="mt-2 flex items-center gap-2 flex-wrap justify-center">
        <span
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="avatar?.active
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'"
        >
          <Power :size="10" />
          {{ avatar?.active ? t('avatar.header.running') : t('avatar.header.stopped') }}
        </span>
        <span class="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <component :is="autonomyIcon" :size="10" />
          {{ autonomyLabel }}
        </span>
      </div>

      <!-- 统计行 -->
      <div class="mt-6 flex items-center gap-10">
        <div class="flex flex-col items-center gap-0.5">
          <span class="text-2xl font-bold text-foreground tabular-nums">{{ stats.conversations }}</span>
          <span class="text-xs text-muted-foreground">{{ t('avatar.profile.statConversations') }}</span>
        </div>
        <div class="flex flex-col items-center gap-0.5">
          <span class="text-2xl font-bold text-foreground tabular-nums">{{ stats.rating }}</span>
          <span class="text-xs text-muted-foreground">{{ t('avatar.profile.statRating') }}</span>
        </div>
        <div class="flex flex-col items-center gap-0.5">
          <span class="text-2xl font-bold text-foreground tabular-nums">{{ stats.level }}</span>
          <span class="text-xs text-muted-foreground">{{ t('avatar.profile.statLevel') }}</span>
        </div>
      </div>

      <!-- 操作按钮行 -->
      <div class="mt-6 flex items-center gap-3">
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="flex h-11 items-center gap-1.5 rounded-xl border px-5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                :aria-label="t('avatar.profile.communityTooltip')"
                @click="router.push(`/feed/profile/avatar/${avatarId}`)"
              >
                <Globe :size="16" />
                <span class="hidden sm:inline">{{ t('avatar.profile.communityPage') }}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              :side-offset="6"
              class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
              {{ t('avatar.profile.communityTooltip') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                :aria-label="t('avatar.profile.chatTooltip')"
                @click="router.push(`/avatar/${avatarId}/chat`)"
              >
                <MessageSquare :size="16" />
                <span class="hidden sm:inline">{{ t('avatar.profile.chat') }}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              :side-offset="6"
              class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            >
              {{ t('avatar.profile.chatTooltip') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { ArrowLeft, Globe, Power, Zap, ShieldCheck, MessageSquare } from "lucide-vue-next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from 'vue-i18n'
import type { Avatar } from "@/types/avatar"

const props = defineProps<{
  avatar: Avatar | null
  avatarId: string
}>()

const { t } = useI18n()
const router = useRouter()
const headerRef = ref<HTMLElement>()

const autonomyLabel = computed(() => {
  if (!props.avatar) return "-"
  switch (props.avatar.autonomy) {
    case "auto": return t('avatar.header.autoMode')
    case "approval": return t('avatar.header.approvalMode')
    case "off": return t('avatar.header.offMode')
    default: return "-"
  }
})

const autonomyIcon = computed(() => {
  switch (props.avatar?.autonomy) {
    case "auto": return Zap
    case "approval": return ShieldCheck
    default: return Power
  }
})

// Stats — uses avatar data when available, fallbacks for placeholder
const stats = computed(() => {
  const av = props.avatar as Record<string, unknown> | null
  const s = (av?.stats ?? {}) as Record<string, unknown>
  return {
    conversations: s.conversations ?? '--',
    rating: s.rating != null ? `${s.rating}%` : '--',
    level: s.level != null ? `Lv.${s.level}` : '--',
  }
})

defineExpose({ headerRef })
</script>

<style lang="scss" scoped>
.avatar-profile-header {
  border-bottom: 1px solid var(--border);
}

.avatar-circle-glow {
  background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
  filter: blur(16px);
}
</style>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .avatar-profile-header {
    border-color: rgba(255, 255, 255, 0.06);

    .bg-gradient-to-b {
      --tw-gradient-from: rgba(255, 255, 255, 0.03);
    }
  }

  .avatar-circle-glow {
    opacity: 0.25;
  }
}
</style>
