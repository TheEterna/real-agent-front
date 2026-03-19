<script setup lang="ts">
/**
 * 论文健康度仪表盘（精简版）
 * 指标：字数进度、章节完成度、引用数量
 * GSAP 动画驱动，支持 prefers-reduced-motion
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import {
  FileText,
  CheckCircle2,
  Quote,
  TrendingUp,
  Zap
} from 'lucide-vue-next'
import type { HealthMetrics } from '@/types/thesis-writer'
import { useReducedMotion } from '@/composables/useReducedMotion'

const props = defineProps<{
  metrics: HealthMetrics
}>()

const { t } = useI18n()

// 动画降级支持
const { duration, ease } = useReducedMotion()

// 动画值
const animatedScore = ref(0)
const animatedWordProgress = ref(0)
const animatedChapterProgress = ref(0)

// 健康度等级
const healthLevel = computed(() => {
  const score = props.metrics.overallScore
  if (score >= 80) return { label: t('thesisWriter.health.excellent'), color: 'text-emerald-500', bg: 'bg-emerald-500' }
  if (score >= 60) return { label: t('thesisWriter.health.good'), color: 'text-blue-500', bg: 'bg-blue-500' }
  if (score >= 40) return { label: t('thesisWriter.health.fair'), color: 'text-amber-500', bg: 'bg-amber-500' }
  return { label: t('thesisWriter.health.needsWork'), color: 'text-red-500', bg: 'bg-red-500' }
})

// 环形参数
const circleRadius = 40
const circleCircumference = 2 * Math.PI * circleRadius
const strokeDashoffset = computed(() => {
  return circleCircumference * (1 - animatedScore.value / 100)
})

const scoreGradient = computed(() => {
  const score = props.metrics.overallScore
  if (score >= 80) return ['var(--color-emerald-500, #10b981)', 'var(--color-emerald-400, #34d399)']
  if (score >= 60) return ['var(--color-blue-500, #3b82f6)', 'var(--color-blue-400, #60a5fa)']
  if (score >= 40) return ['var(--color-amber-500, #f59e0b)', 'var(--color-amber-400, #fbbf24)']
  return ['var(--color-red-500, #ef4444)', 'var(--color-red-400, #f87171)']
})

// 指标卡片
const metricCards = computed(() => [
  {
    id: 'words',
    icon: FileText,
    label: t('thesisWriter.health.wordCount'),
    value: formatNumber(props.metrics.wordProgress.current),
    subValue: `/ ${formatNumber(props.metrics.wordProgress.target)}`,
    progress: animatedWordProgress.value,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    progressColor: 'bg-violet-500',
  },
  {
    id: 'chapters',
    icon: CheckCircle2,
    label: t('thesisWriter.health.chapters'),
    value: `${props.metrics.chapterProgress.completed}`,
    subValue: `/ ${props.metrics.chapterProgress.total}`,
    progress: animatedChapterProgress.value,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    progressColor: 'bg-cyan-500',
  },
  {
    id: 'citations',
    icon: Quote,
    label: t('thesisWriter.health.citations'),
    value: `${props.metrics.citationCount}`,
    subValue: t('thesisWriter.health.citationUnit'),
    progress: Math.min(100, props.metrics.citationCount * 5),
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    progressColor: 'bg-amber-500',
  },
])

function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + t('thesisWriter.healthDashboard.tenThousandUnit')
  return num.toLocaleString()
}

function animateMetrics() {
  gsap.to(animatedScore, {
    value: props.metrics.overallScore,
    duration: duration.value,
    ease: ease.value,
  })
  gsap.to(animatedWordProgress, {
    value: props.metrics.wordProgress.percentage,
    duration: duration.value,
    ease: ease.value,
  })
  gsap.to(animatedChapterProgress, {
    value: props.metrics.chapterProgress.percentage,
    duration: duration.value,
    ease: ease.value,
  })
}

watch(() => props.metrics, () => animateMetrics(), { deep: true })
onMounted(() => animateMetrics())

onUnmounted(() => {
  gsap.killTweensOf(animatedScore)
  gsap.killTweensOf(animatedWordProgress)
  gsap.killTweensOf(animatedChapterProgress)
})
</script>

<template>
  <div class="p-3 space-y-3">
    <!-- 主分数 + 指标行 -->
    <div class="flex items-center gap-3">
      <!-- 环形进度（紧凑） -->
      <div class="relative shrink-0">
        <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 96 96">
          <defs>
            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" :stop-color="scoreGradient[0]" />
              <stop offset="100%" :stop-color="scoreGradient[1]" />
            </linearGradient>
          </defs>
          <circle
            cx="48" cy="48" :r="circleRadius"
            fill="none" stroke="currentColor" stroke-width="6"
            class="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="48" cy="48" :r="circleRadius"
            fill="none" stroke="url(#healthGrad)" stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="circleCircumference"
            :stroke-dashoffset="strokeDashoffset"
            class="transition-all duration-300"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-lg font-bold leading-none" :class="healthLevel.color">
            {{ Math.round(animatedScore) }}
          </span>
          <span class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ t('thesisWriter.health.healthLabel') }}</span>
        </div>
      </div>

      <!-- 右侧指标列表 -->
      <div class="flex-1 space-y-1.5">
        <div
          v-for="card in metricCards"
          :key="card.id"
          class="flex items-center gap-2"
        >
          <component :is="card.icon" :size="12" :class="card.color" class="shrink-0" />
          <span class="text-xs text-slate-500 dark:text-slate-400 w-8">{{ card.label }}</span>
          <div class="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="card.progressColor"
              :style="{ width: `${card.progress}%` }"
            />
          </div>
          <span class="text-xs font-medium text-slate-700 dark:text-slate-200 tabular-nums w-16 text-right">
            {{ card.value }}<span class="text-slate-400 font-normal">{{ card.subValue }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 趋势提示 -->
    <div
      v-if="metrics.wordProgress.target - metrics.wordProgress.current > 0"
      class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
    >
      <TrendingUp :size="12" class="text-emerald-500" aria-hidden="true" />
      <span class="text-xs text-slate-500 dark:text-slate-400">
        {{ t('thesisWriter.health.wordGap', { count: formatNumber(metrics.wordProgress.target - metrics.wordProgress.current) }) }}
      </span>
    </div>
  </div>
</template>
