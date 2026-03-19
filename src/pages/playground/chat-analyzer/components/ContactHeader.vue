<script setup lang="ts">
/**
 * ContactHeader - 顶栏
 *
 * 联系人名 + 关系类型 + 健康度 + [查看报告] 按钮
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileBarChart, Loader2, Activity } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import type { RelationType } from '../types'

const { t } = useI18n()

const emit = defineEmits<{
  viewReport: []
  startAnalysis: []
}>()

const store = useChatAnalyzerStore()

const contact = computed(() => store.activeContact)
const report = computed(() => store.activeReport)
const analysisStatus = computed(() => store.analysisStatus)

const relationLabel = computed<Record<RelationType, string>>(() => ({
  lover: t('chatAnalyzer.contactHeader.relationLover'),
  family: t('chatAnalyzer.contactHeader.relationFamily'),
  friend: t('chatAnalyzer.contactHeader.relationFriend'),
  colleague: t('chatAnalyzer.contactHeader.relationColleague'),
  other: t('chatAnalyzer.contactHeader.relationOther'),
}))

const healthScoreColor = computed(() => {
  const score = report.value?.healthScore
  if (!score) return 'text-zinc-400'
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
})

/** 健康度文字标签，颜色+文字双标识满足可访问性 */
const healthLabel = computed(() => {
  const score = report.value?.healthScore
  if (!score) return ''
  if (score >= 80) return t('chatAnalyzer.contactHeader.healthGood')
  if (score >= 60) return t('chatAnalyzer.contactHeader.healthFair')
  return t('chatAnalyzer.contactHeader.healthLow')
})
</script>

<template>
  <div
    v-if="contact"
    class="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background"
  >
    <!-- Left: Contact info -->
    <div class="flex items-center gap-3 min-w-0">
      <h2 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
        {{ contact.name }}
      </h2>
      <span
        v-if="contact.relationType"
        class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
      >
        {{ relationLabel[contact.relationType] ?? contact.relationType }}
      </span>
      <!-- Health score badge (图标+数值+文字标签 三重标识) -->
      <div
        v-if="report?.healthScore"
        class="flex items-center gap-1 shrink-0"
        :title="t('chatAnalyzer.contactHeader.healthTitle', { score: Math.round(report.healthScore), label: healthLabel })"
      >
        <Activity :size="14" :class="healthScoreColor" />
        <span class="text-xs font-medium" :class="healthScoreColor">
          {{ Math.round(report.healthScore) }}
        </span>
        <span class="text-[10px] text-zinc-400 dark:text-zinc-500">
          {{ healthLabel }}
        </span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2 shrink-0">
      <!-- Analyze button (if no report) -->
      <Button
        v-if="!report && analysisStatus !== 'analyzing'"
        variant="outline"
        size="sm"
        class="text-xs gap-1.5 active:scale-95 transition-all duration-200"
        @click="emit('startAnalysis')"
      >
        <Activity :size="14" />
        {{ t('chatAnalyzer.contactHeader.startAnalysis') }}
      </Button>

      <!-- Analyzing indicator -->
      <div
        v-if="analysisStatus === 'analyzing'"
        class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <Loader2 :size="14" class="animate-spin" />
        {{ t('chatAnalyzer.contactHeader.analyzing') }}
      </div>

      <!-- View report button -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            v-if="report"
            variant="ghost"
            size="sm"
            class="gap-1.5 text-xs active:scale-95 transition-all duration-200"
            :aria-label="t('chatAnalyzer.contactHeader.viewReport')"
            @click="emit('viewReport')"
          >
            <FileBarChart :size="14" />
            {{ t('chatAnalyzer.contactHeader.viewReport') }}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" :side-offset="4">{{ t('chatAnalyzer.contactHeader.viewReportTooltip') }}</TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>
