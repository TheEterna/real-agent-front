<script setup lang="ts">
/**
 * KeyMoments - 关键时刻列表
 *
 * 每项有 [跳转] 按钮 emit 事件定位到聊天记录
 */
import { useI18n } from 'vue-i18n'
import { ExternalLink } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { KeyMoment } from '../types'

const { t } = useI18n()

const props = defineProps<{
  moments: KeyMoment[]
}>()

const emit = defineEmits<{
  jumpTo: [seqStart: number]
}>()

const typeIcon: Record<string, string> = {
  conflict: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  reconciliation: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  coldwar: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  sweet: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  milestone: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  other: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(moment, idx) in moments"
      :key="idx"
      class="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 group"
    >
      <!-- Type badge -->
      <span
        class="shrink-0 px-2 py-0.5 rounded text-[10px] font-medium mt-0.5"
        :class="typeIcon[moment.type] || typeIcon.other"
      >
        {{ moment.label }}
      </span>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">{{ moment.date }}</p>
        <p class="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {{ moment.description }}
        </p>
      </div>

      <!-- Jump button -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            class="shrink-0 h-7 w-7 min-w-[44px] min-h-[44px] p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:scale-95 transition-opacity duration-150"
            :aria-label="t('chatAnalyzer.keyMoments.jumpToRecord')"
            @click="emit('jumpTo', moment.recordSeqStart)"
          >
            <ExternalLink :size="14" class="text-zinc-400" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" :side-offset="4">{{ t('chatAnalyzer.keyMoments.jumpToRecord') }}</TooltipContent>
      </Tooltip>
    </div>

    <!-- Empty -->
    <p
      v-if="moments.length === 0"
      class="text-xs text-muted-foreground text-center py-4"
    >
      {{ t('chatAnalyzer.keyMoments.empty') }}
    </p>
  </div>
</template>
