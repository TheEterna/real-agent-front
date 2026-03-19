<script setup lang="ts">
/**
 * CommunicationPatterns - 沟通模式分析卡片
 *
 * 回复速度对比 / 主动发起率 / 话题深度 / 消息长度趋势
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Clock, MessageCircle, Layers, AlignLeft } from 'lucide-vue-next'
import type { CommunicationPatterns as CommunicationPatternsType } from '../types'

const { t } = useI18n()

const props = defineProps<{
  patterns: CommunicationPatternsType
}>()

const metrics = computed(() => [
  {
    icon: Clock,
    label: t('chatAnalyzer.commPatterns.replySpeed'),
    selfValue: props.patterns.replySpeed.self,
    otherValue: props.patterns.replySpeed.other,
  },
  {
    icon: MessageCircle,
    label: t('chatAnalyzer.commPatterns.initiationRate'),
    selfValue: `${Math.round(props.patterns.initiationRate.self * 100)}%`,
    otherValue: `${Math.round(props.patterns.initiationRate.other * 100)}%`,
    selfBar: props.patterns.initiationRate.self,
    otherBar: props.patterns.initiationRate.other,
  },
  {
    icon: AlignLeft,
    label: t('chatAnalyzer.commPatterns.avgMsgLength'),
    selfValue: t('chatAnalyzer.commPatterns.charUnit', { count: props.patterns.avgMessageLength.self }),
    otherValue: t('chatAnalyzer.commPatterns.charUnit', { count: props.patterns.avgMessageLength.other }),
  },
])
</script>

<template>
  <div class="space-y-4">
    <!-- Metric cards -->
    <div
      v-for="metric in metrics"
      :key="metric.label"
      class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
    >
      <div class="flex items-center gap-2 mb-2">
        <component :is="metric.icon" :size="14" class="text-zinc-500" />
        <span class="text-xs font-medium text-zinc-700 dark:text-zinc-300">{{ metric.label }}</span>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">{{ t('chatAnalyzer.commPatterns.selfLabel') }}</p>
          <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ metric.selfValue }}</p>
          <div
            v-if="metric.selfBar !== undefined"
            class="mt-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
            role="progressbar"
            :aria-valuenow="Math.round(metric.selfBar * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="t('chatAnalyzer.commPatterns.selfAriaLabel', { metric: metric.label, value: metric.selfValue })"
          >
            <div
              class="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
              :style="{ width: `${metric.selfBar * 100}%` }"
            />
          </div>
        </div>
        <div>
          <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">{{ t('chatAnalyzer.commPatterns.otherLabel') }}</p>
          <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ metric.otherValue }}</p>
          <div
            v-if="metric.otherBar !== undefined"
            class="mt-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
            role="progressbar"
            :aria-valuenow="Math.round(metric.otherBar * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="t('chatAnalyzer.commPatterns.otherAriaLabel', { metric: metric.label, value: metric.otherValue })"
          >
            <div
              class="h-full rounded-full bg-sky-500 dark:bg-sky-400"
              :style="{ width: `${metric.otherBar * 100}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Topic depth -->
    <div class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
      <div class="flex items-center gap-2 mb-2">
        <Layers :size="14" class="text-zinc-500" />
        <span class="text-xs font-medium text-zinc-700 dark:text-zinc-300">{{ t('chatAnalyzer.commPatterns.topicDepth') }}</span>
      </div>
      <p class="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {{ patterns.topicDepth }}
      </p>
    </div>
  </div>
</template>
