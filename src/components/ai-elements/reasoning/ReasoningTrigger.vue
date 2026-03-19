<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { BrainIcon, ChevronDownIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { Shimmer } from '../shimmer'
import { useReasoningContext } from './context'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const { t } = useI18n()
const { isStreaming, isOpen, duration } = useReasoningContext()

const thinkingMessage = computed(() => {
  if (isStreaming.value || duration.value === 0) {
    return 'thinking'
  }
  if (duration.value === undefined) {
    return 'default_done'
  }
  return 'duration_done'
})
</script>

<template>
  <CollapsibleTrigger
    :class="cn(
      'flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground cursor-pointer',
      props.class,
    )"
    :aria-label="thinkingMessage === 'thinking' ? t('aiElements.reasoning.thinkingAriaLabel') : isOpen ? t('aiElements.reasoning.collapseAriaLabel') : t('aiElements.reasoning.expandAriaLabel')"
  >
    <slot>
      <BrainIcon class="size-4" aria-hidden="true" />

      <template v-if="thinkingMessage === 'thinking'">
        <Shimmer :duration="1">
          {{ t('aiElements.reasoning.thinking') }}
        </Shimmer>
      </template>

      <template v-else-if="thinkingMessage === 'default_done'">
        <p>{{ t('aiElements.reasoning.defaultDone') }}</p>
      </template>

      <template v-else>
        <p>{{ t('aiElements.reasoning.durationDone', { duration }) }}</p>
      </template>

      <ChevronDownIcon
        :class="cn(
          'size-4 transition-transform',
          isOpen ? 'rotate-180' : 'rotate-0',
        )"
        aria-hidden="true"
      />
    </slot>
  </CollapsibleTrigger>
</template>
