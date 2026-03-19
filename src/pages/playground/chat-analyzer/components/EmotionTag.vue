<script setup lang="ts">
/**
 * EmotionTag - 情绪标签小组件
 *
 * positive: 绿色+笑脸 / negative: 红色+哭脸 / neutral: 灰色+横杠
 * 颜色+图标双标识，满足可访问性"颜色独立"要求
 */
import { useI18n } from 'vue-i18n'
import { SmilePlus, Frown, Minus } from 'lucide-vue-next'
import type { EmotionTag as EmotionTagType } from '../types'

const { t } = useI18n()

const props = defineProps<{
  tag: EmotionTagType
}>()

const colorMap: Record<string, string> = {
  positive: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  negative: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  neutral: 'bg-muted text-muted-foreground border-border',
}

const iconMap: Record<string, typeof SmilePlus> = {
  positive: SmilePlus,
  negative: Frown,
  neutral: Minus,
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors duration-200"
    :class="colorMap[props.tag.type] || colorMap.neutral"
    :title="t('chatAnalyzer.emotionTag.title', { label: props.tag.label, type: props.tag.type === 'positive' ? t('chatAnalyzer.emotionTag.positive') : props.tag.type === 'negative' ? t('chatAnalyzer.emotionTag.negative') : t('chatAnalyzer.emotionTag.neutral') })"
  >
    <component
      :is="iconMap[props.tag.type] || iconMap.neutral"
      :size="10"
      class="shrink-0"
      aria-hidden="true"
    />
    {{ props.tag.label }}
  </span>
</template>
