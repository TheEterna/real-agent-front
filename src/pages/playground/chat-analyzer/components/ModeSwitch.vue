<script setup lang="ts">
/**
 * ModeSwitch - [分析模式] / [模拟对方] 切换按钮组
 *
 * Segmented control：
 * - advisor: AI 情感顾问（分析对话、给建议）
 * - simulator: 模拟对方回复（学习对方语气风格，警告色标识）
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bot, UserCircle } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import type { DialogMode } from '../types'

const { t } = useI18n()

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  switch: [mode: DialogMode]
}>()

const store = useChatAnalyzerStore()
const currentMode = computed(() => store.dialogMode)

const contactName = computed(() => store.activeContact?.name ?? t('chatAnalyzer.aiDialog.otherFallback'))

function handleSwitch(mode: DialogMode) {
  if (props.disabled || currentMode.value === mode) return
  emit('switch', mode)
}
</script>

<template>
  <div class="flex gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 transition-colors duration-200" role="radiogroup" :aria-label="t('chatAnalyzer.modeSwitch.modeGroupAria')">
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50"
          :class="[
            currentMode === 'advisor'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          ]"
          role="radio"
          :aria-checked="currentMode === 'advisor'"
          :aria-label="t('chatAnalyzer.modeSwitch.advisorLabel')"
          :disabled="disabled"
          @click="handleSwitch('advisor')"
        >
          <Bot :size="14" />
          {{ t('chatAnalyzer.modeSwitch.advisorLabel') }}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" :side-offset="4">
        {{ t('chatAnalyzer.modeSwitch.advisorTooltip') }}
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
          :class="[
            currentMode === 'simulator'
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-200 dark:border-amber-800'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          ]"
          role="radio"
          :aria-checked="currentMode === 'simulator'"
          :aria-label="t('chatAnalyzer.modeSwitch.simulatorLabel', { name: contactName })"
          :disabled="disabled"
          @click="handleSwitch('simulator')"
        >
          <UserCircle :size="14" />
          {{ t('chatAnalyzer.modeSwitch.simulatorLabel', { name: contactName }) }}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" :side-offset="4">
        {{ t('chatAnalyzer.modeSwitch.simulatorTooltip') }}
      </TooltipContent>
    </Tooltip>
  </div>
</template>
