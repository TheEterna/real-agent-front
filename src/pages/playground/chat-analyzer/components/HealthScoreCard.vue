<script setup lang="ts">
/**
 * HealthScoreCard - 关系健康度评分卡
 *
 * 总分 + 四维度进度条（信任/尊重/亲密/支持）
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import type { HealthScore } from '../types'

const { t } = useI18n()

const props = defineProps<{
  score: HealthScore
}>()

const cardRef = ref<HTMLElement | null>(null)

const dimensions = computed(() => [
  { key: 'trust', label: t('chatAnalyzer.healthScore.trust'), value: props.score.dimensions.trust, color: 'bg-sky-500 dark:bg-sky-400' },
  { key: 'respect', label: t('chatAnalyzer.healthScore.respect'), value: props.score.dimensions.respect, color: 'bg-indigo-500 dark:bg-indigo-400' },
  { key: 'intimacy', label: t('chatAnalyzer.healthScore.intimacy'), value: props.score.dimensions.intimacy, color: 'bg-pink-500 dark:bg-pink-400' },
  { key: 'support', label: t('chatAnalyzer.healthScore.support'), value: props.score.dimensions.support, color: 'bg-emerald-500 dark:bg-emerald-400' },
])

const overallColor = computed(() => {
  const s = props.score.overall
  if (s >= 80) return 'text-emerald-500'
  if (s >= 60) return 'text-amber-500'
  return 'text-red-500'
})

const overallRingColor = computed(() => {
  const s = props.score.overall
  if (s >= 80) return 'stroke-emerald-500'
  if (s >= 60) return 'stroke-amber-500'
  return 'stroke-red-500'
})

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Animate bars on mount (respects prefers-reduced-motion)
onMounted(() => {
  if (!cardRef.value || prefersReduced) return
  const bars = cardRef.value.querySelectorAll('[data-bar]')
  gsap.from(bars, {
    scaleX: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out',
    transformOrigin: 'left center',
  })
})

onUnmounted(() => {
  if (cardRef.value) {
    gsap.killTweensOf(cardRef.value.querySelectorAll('[data-bar]'))
  }
})
</script>

<template>
  <div ref="cardRef" class="space-y-4">
    <!-- Overall score circle -->
    <div class="flex items-center justify-center">
      <div class="relative w-20 h-20">
        <svg class="w-20 h-20 -rotate-90" viewBox="0 0 80 80" role="img" :aria-label="t('chatAnalyzer.healthScore.scoreAria', { score: score.overall })">
          <circle
            cx="40" cy="40" r="34"
            fill="none" stroke="currentColor" stroke-width="6"
            class="text-zinc-100 dark:text-zinc-800"
          />
          <circle
            cx="40" cy="40" r="34"
            fill="none" stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="`${(score.overall / 100) * 213.6} 213.6`"
            :class="overallRingColor"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-xl font-bold" :class="overallColor">
            {{ score.overall }}
          </span>
          <span class="text-xs text-zinc-400">{{ t('chatAnalyzer.healthScore.scoreUnit') }}</span>
        </div>
      </div>
    </div>

    <!-- Dimensions -->
    <div class="space-y-3">
      <div
        v-for="dim in dimensions"
        :key="dim.key"
        class="space-y-1"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs text-zinc-600 dark:text-zinc-400">{{ dim.label }}</span>
          <span class="text-xs font-medium text-zinc-900 dark:text-zinc-100">{{ dim.value }}</span>
        </div>
        <div
          class="h-2 rounded-full bg-zinc-200/60 dark:bg-zinc-800 overflow-hidden"
          role="progressbar"
          :aria-valuenow="dim.value"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="t('chatAnalyzer.healthScore.dimAria', { label: dim.label, value: dim.value })"
        >
          <div
            data-bar
            class="h-full rounded-full"
            :class="dim.color"
            :style="{ width: `${dim.value}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
