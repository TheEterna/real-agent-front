<script setup lang="ts">
/**
 * ProfileEmptyState - 通用空状态组件
 *
 * 渐变光晕背景 + 图标 + 标题 + 描述 + CTA 按钮
 */
import { computed, type Component } from 'vue'
import {
  FileText, Heart, Lightbulb, Film, Brain,
  LayoutGrid, Sparkles
} from 'lucide-vue-next'

const props = defineProps<{
  icon: string
  title: string
  description: string
  actionText?: string
}>()

const emit = defineEmits<{
  action: []
}>()

/** 图标名称映射到组件 */
const iconMap: Record<string, Component> = {
  FileText,
  Heart,
  Lightbulb,
  Film,
  Brain,
  LayoutGrid,
  Sparkles
}

const iconComponent = computed(() => iconMap[props.icon] || LayoutGrid)

/** 图标对应的颜色 */
const iconColorClass = computed(() => {
  const colorMap: Record<string, string> = {
    FileText: 'text-slate-400 dark:text-zinc-500',
    Heart: 'text-rose-300 dark:text-rose-800/60',
    Lightbulb: 'text-amber-300 dark:text-amber-800/60',
    Film: 'text-indigo-300 dark:text-indigo-800/60',
    Brain: 'text-emerald-300 dark:text-emerald-800/60',
    LayoutGrid: 'text-slate-400 dark:text-zinc-500',
    Sparkles: 'text-amber-300 dark:text-amber-800/60'
  }
  return colorMap[props.icon] || 'text-slate-400 dark:text-zinc-500'
})

/** 光晕对应的渐变 */
const auraGradient = computed(() => {
  const gradientMap: Record<string, string> = {
    FileText: 'from-slate-200/40 dark:from-zinc-700/40 via-blue-200/40 dark:via-blue-900/40 to-indigo-100/40 dark:to-indigo-900/40',
    Heart: 'from-rose-200/40 dark:from-rose-900/40 via-pink-200/40 dark:via-pink-900/40 to-red-100/40 dark:to-red-900/40',
    Lightbulb: 'from-amber-200/40 dark:from-amber-900/40 via-yellow-200/40 dark:via-yellow-900/40 to-orange-100/40 dark:to-orange-900/40',
    Film: 'from-indigo-200/40 dark:from-indigo-900/40 via-purple-200/40 dark:via-purple-900/40 to-violet-100/40 dark:to-violet-900/40',
    Brain: 'from-emerald-200/40 dark:from-emerald-900/40 via-teal-200/40 dark:via-teal-900/40 to-green-100/40 dark:to-green-900/40'
  }
  return gradientMap[props.icon] || 'from-indigo-200/40 dark:from-indigo-900/40 via-purple-200/40 dark:via-purple-900/40 to-amber-100/40 dark:to-amber-900/40'
})
</script>

<template>
  <div class="flex flex-col items-center justify-center pb-20 pt-12">
    <!-- 图标容器 + 光晕 -->
    <div class="relative mb-6 flex h-64 w-64 items-center justify-center">
      <!-- 渐变光晕 -->
      <div
        class="absolute inset-0 rounded-full bg-gradient-to-tr blur-[60px]"
        :class="auraGradient"
        style="animation: pulse-slow 4s ease-in-out infinite;"
      />

      <!-- 图标卡片 -->
      <div class="relative z-10 flex flex-col items-center">
        <div class="mb-4 flex h-24 w-24 items-center justify-center rounded-[var(--radius-2xl)] border border-border/30 bg-background shadow-[var(--shadow-lg)]">
          <component
            :is="iconComponent"
            :size="40"
            :class="iconColorClass"
            fill="currentColor"
          />
        </div>

        <!-- 装饰光斑 -->
        <div class="absolute -right-8 -top-4 h-12 w-12 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-xl" />
      </div>
    </div>

    <!-- 标题 -->
    <h3 class="mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-xl font-bold tracking-tight text-transparent">
      {{ title }}
    </h3>

    <!-- 描述 -->
    <p class="max-w-xs text-center text-base font-medium leading-relaxed text-muted-foreground">
      {{ description }}
    </p>

    <!-- CTA 按钮 -->
    <button
      v-if="actionText"
      class="mt-6 rounded-[var(--radius-xl)] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 ease-[var(--ease-snap)] hover:bg-primary/90 hover:shadow-[var(--shadow-md)] active:scale-95"
      @click="emit('action')"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
