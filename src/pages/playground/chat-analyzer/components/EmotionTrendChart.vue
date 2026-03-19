<script setup lang="ts">
/**
 * EmotionTrendChart - 情绪走势图
 *
 * 使用 div 进度条模拟时间线图表，展示双方情绪正/负/中性分布
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import type { EmotionTrend } from '../types'

const { t } = useI18n()

const props = defineProps<{
  trend: EmotionTrend
}>()

const chartRef = ref<HTMLElement | null>(null)

const timeline = computed(() => props.trend.timeline ?? [])

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Animate bars on mount (respects prefers-reduced-motion)
onMounted(() => {
  if (!chartRef.value || prefersReduced) return
  const bars = chartRef.value.querySelectorAll('[data-emotion-bar]')
  gsap.from(bars, {
    scaleY: 0,
    duration: 0.5,
    stagger: 0.03,
    ease: 'power2.out',
    transformOrigin: 'bottom center',
  })
})

onUnmounted(() => {
  if (chartRef.value) {
    gsap.killTweensOf(chartRef.value.querySelectorAll('[data-emotion-bar]'))
  }
})
</script>

<template>
  <div ref="chartRef">
    <!-- Legend (color + text + pattern for a11y: not color-only) -->
    <div class="flex items-center gap-4 mb-4" role="list" :aria-label="t('chatAnalyzer.emotionTrend.legendAria')">
      <div class="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400" role="listitem">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
        <span>{{ t('chatAnalyzer.emotionTrend.positive') }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400" role="listitem">
        <span class="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-500" aria-hidden="true" />
        <span>{{ t('chatAnalyzer.emotionTrend.neutral') }}</span>
      </div>
      <div class="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400" role="listitem">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true" />
        <span>{{ t('chatAnalyzer.emotionTrend.negative') }}</span>
      </div>
    </div>

    <!-- Chart: stacked bars per period -->
    <div v-if="timeline.length > 0" class="space-y-3" role="img" :aria-label="t('chatAnalyzer.emotionTrend.chartAria')">
      <div
        v-for="period in timeline"
        :key="period.period"
        class="space-y-1.5"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 w-16 shrink-0">
            {{ period.period }}
          </span>
        </div>

        <!-- Self emotion bar -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-zinc-400 dark:text-zinc-500 w-6 shrink-0 text-right">{{ t('chatAnalyzer.emotionTrend.selfLabel') }}</span>
          <div
            class="flex-1 flex h-3 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
            role="progressbar"
            :aria-label="t('chatAnalyzer.emotionTrend.selfEmotionAria', { period: period.period, positive: Math.round(period.self.positive * 100), neutral: Math.round(period.self.neutral * 100), negative: Math.round(period.self.negative * 100) })"
          >
            <div
              data-emotion-bar
              class="bg-emerald-500 dark:bg-emerald-400"
              :style="{ width: `${period.self.positive * 100}%` }"
            />
            <div
              data-emotion-bar
              class="bg-zinc-300 dark:bg-zinc-600"
              :style="{ width: `${period.self.neutral * 100}%` }"
            />
            <div
              data-emotion-bar
              class="bg-red-500 dark:bg-red-400"
              :style="{ width: `${period.self.negative * 100}%` }"
            />
          </div>
        </div>

        <!-- Other emotion bar -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-zinc-400 dark:text-zinc-500 w-6 shrink-0 text-right">{{ t('chatAnalyzer.emotionTrend.otherLabel') }}</span>
          <div
            class="flex-1 flex h-3 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
            role="progressbar"
            :aria-label="t('chatAnalyzer.emotionTrend.otherEmotionAria', { period: period.period, positive: Math.round(period.other.positive * 100), neutral: Math.round(period.other.neutral * 100), negative: Math.round(period.other.negative * 100) })"
          >
            <div
              data-emotion-bar
              class="bg-emerald-500 dark:bg-emerald-400"
              :style="{ width: `${period.other.positive * 100}%` }"
            />
            <div
              data-emotion-bar
              class="bg-zinc-300 dark:bg-zinc-600"
              :style="{ width: `${period.other.neutral * 100}%` }"
            />
            <div
              data-emotion-bar
              class="bg-red-500 dark:bg-red-400"
              :style="{ width: `${period.other.negative * 100}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <p
      v-else
      class="text-xs text-muted-foreground text-center py-4"
    >
      {{ t('chatAnalyzer.emotionTrend.empty') }}
    </p>
  </div>
</template>
