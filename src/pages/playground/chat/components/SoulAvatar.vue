<script setup lang="ts">
/**
 * SoulAvatar — V3 共生风格 AI 灵魂化身
 *
 * 始终内联在 Top Bar 右侧，hover 展开 Soul World 面板
 * 面板包含：感受/记忆/里程碑 + 设置入口（D1 融合方案）
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Heart, Settings } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Avatar from '@/components/ui/Avatar.vue'
import type { MoodType } from '../types'

defineProps<{
  name: string
  feeling: string
  mood: MoodType
  isThinking: boolean
  memories: readonly string[]
  milestone: string
}>()

const { t } = useI18n()

const emit = defineEmits<{
  openMemory: []
  openEmoCal: []
  openSettings: []
}>()

const avatarUrl = computed(() =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=volo`,
)
</script>

<template>
  <div
    class="
      group relative flex items-center gap-2 z-10
      cursor-default select-none
    "
  >
    <!-- Avatar -->
    <div class="avatar-wrapper relative w-8 h-8 lg:w-9 lg:h-9">
      <!-- Breathing ring — thinking 时加速 -->
      <div
        class="
          absolute -inset-1 rounded-full
          border-2 border-primary-500/20
          pointer-events-none
        "
        :class="isThinking ? 'animate-ring-think' : 'opacity-0'"
      />
      <Avatar
        :src="avatarUrl"
        :name="name"
        size="lg"
        shape="circle"
        class="soul-avatar-inner"
      />
      <!-- Online dot — transform 锚定右下角 -->
      <span
        class="
          absolute bottom-0 right-0 z-2
          w-2 h-2 lg:w-2.5 lg:h-2.5
          rounded-full bg-emerald-500
          border-[1.5px] border-background
          translate-x-[15%] translate-y-[15%]
        "
      />
    </div>

    <!-- Name -->
    <span
      class="
        hidden sm:inline
        font-sans text-xs font-semibold
        text-zinc-800/35 dark:text-zinc-300/35 tracking-wide
        transition-colors duration-150
        group-hover:text-zinc-800/60 dark:group-hover:text-zinc-200/60
      "
    >
      {{ name }}
    </span>

    <!-- Soul World Panel — hover 展开 -->
    <div
      class="
        soul-world
        absolute top-full right-0 mt-2.5
        w-64 lg:w-72
        bg-white/[0.94] backdrop-blur-lg
        border border-border/60
        rounded-2xl p-5
        shadow-[0_12px_40px_rgba(0,0,0,0.08)]
        opacity-0 pointer-events-none
        translate-y-1
        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        z-30
        group-hover:opacity-100 group-hover:pointer-events-auto
        group-hover:translate-y-0
      "
    >
      <!-- 感受 -->
      <div class="mb-3.5">
        <div
          class="flex items-center justify-between py-0.5 cursor-pointer transition-colors duration-150 hover:text-primary-700"
          role="button"
          tabindex="0"
          @click="emit('openEmoCal')"
          @keydown.enter="emit('openEmoCal')"
          @keydown.space.prevent="emit('openEmoCal')"
        >
          <span class="font-sans text-xs font-semibold text-zinc-800/25 uppercase tracking-wider">
            {{ t('playgroundChat.soulAvatar.currentFeeling') }}
          </span>
          <ChevronRight :size="12" :stroke-width="2" class="opacity-0 transition-opacity group-hover/trigger:opacity-60" />
        </div>
        <div class="flex items-center gap-2 text-[0.8125rem] text-zinc-800/55">
          <span class="sw-feeling-dot w-[5px] h-[5px] rounded-full bg-primary-500" />
          {{ feeling }}
        </div>
      </div>

      <!-- 记忆 -->
      <div class="mb-3.5">
        <div
          class="flex items-center justify-between py-0.5 cursor-pointer transition-colors duration-150 hover:text-primary-700"
          role="button"
          tabindex="0"
          @click="emit('openMemory')"
          @keydown.enter="emit('openMemory')"
          @keydown.space.prevent="emit('openMemory')"
        >
          <span class="font-sans text-xs font-semibold text-zinc-800/25 uppercase tracking-wider">
            {{ t('playgroundChat.soulAvatar.iRememberYou') }}
          </span>
          <ChevronRight :size="12" :stroke-width="2" class="opacity-0 transition-opacity group-hover/trigger:opacity-60" />
        </div>
        <div
          v-for="(mem, i) in memories"
          :key="i"
          class="sw-memory-item text-xs text-zinc-800/55 py-0.5 leading-snug"
        >
          {{ mem }}
        </div>
      </div>

      <!-- 里程碑 -->
      <div v-if="milestone" class="mb-3.5">
        <div class="flex items-center gap-2 text-xs text-primary-700 px-2.5 py-1.5 bg-primary-500/[0.08] rounded-lg">
          <Heart :size="14" :stroke-width="1.8" class="shrink-0 opacity-60" />
          {{ milestone }}
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="h-px bg-zinc-900/[0.06] my-3" />

      <!-- 设置入口 -->
      <button
        class="
          inline-flex items-center gap-1.5 px-2.5 py-1
          text-xs text-zinc-800/40
          rounded-full cursor-pointer
          border-none bg-transparent
          transition-all duration-150
          hover:text-zinc-800/70 hover:bg-zinc-800/[0.05]
        "
        type="button"
        @click="emit('openSettings')"
      >
        <Settings :size="13" :stroke-width="1.8" />
        <span>{{ t('playgroundChat.soulAvatar.settings') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Avatar 尺寸强制 */
:deep(.soul-avatar-inner) {
  width: 100% !important;
  height: 100% !important;
}


:deep(.soul-avatar-inner > div) {
  width: 100% !important;
  height: 100% !important;
  box-shadow: var(--shadow-sm) !important;
  border: 1.5px solid rgba(255,255,255,0.8) !important;
}

.group:hover :deep(.soul-avatar-inner > div) {
  box-shadow: var(--shadow-md) !important;
}

/* 记忆圆点 */
.sw-memory-item::before {
  content: '';
  display: inline-block;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: var(--color-primary-500, #6B9A98);
  opacity: 0.4;
  margin-right: 7px;
  vertical-align: middle;
}

/* 感受脉冲 */
.sw-feeling-dot {
  animation: core-pulse 3s cubic-bezier(0.4,0,0.2,1) infinite;
}

@keyframes core-pulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50%      { transform: scale(1.3); opacity: 0.8; }
}

/* Thinking 光环 */
@keyframes ring-think-anim {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50%      { transform: scale(1.15); opacity: 0.5; }
}
.animate-ring-think {
  animation: ring-think-anim 1.8s cubic-bezier(0.4,0,0.2,1) infinite;
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .sw-feeling-dot,
  .animate-ring-think {
    animation: none;
  }
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style>
.dark .soul-world,
.dark .group .soul-world {
  background: rgba(30,30,30,0.94);
  border-color: rgba(255,255,255,0.06);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}
.dark .sw-memory-item { color: rgba(224,231,235,0.5); }
.dark .sw-memory-item::before { background: rgba(124,183,180,0.5); }
.dark .soul-avatar-inner > div {
  border-color: rgba(255,255,255,0.15) !important;
}
.dark .sw-feeling-dot {
  background: var(--color-primary-400);
}
/* Soul World 内部文本暗色适配 */
.dark .soul-world .text-zinc-800\/25 {
  color: rgba(224, 231, 235, 0.3);
}
.dark .soul-world .text-zinc-800\/55 {
  color: rgba(224, 231, 235, 0.55);
}
.dark .soul-world .text-zinc-800\/40 {
  color: rgba(224, 231, 235, 0.4);
}
.dark .soul-world .text-zinc-800\/70 {
  color: rgba(224, 231, 235, 0.7);
}
.dark .soul-world .hover\:text-primary-700:hover {
  color: var(--color-primary-400);
}
.dark .soul-world .hover\:bg-zinc-800\/\[0\.05\]:hover {
  background: rgba(255, 255, 255, 0.06);
}
.dark .soul-world .bg-zinc-900\/\[0\.06\] {
  background: rgba(255, 255, 255, 0.06);
}
</style>
