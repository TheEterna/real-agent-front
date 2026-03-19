<script setup lang="ts">
import type { HtmlHTMLAttributes } from 'vue'
import {
  Collapsible,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { BrainIcon, ChevronDownIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useChainOfThought } from './context'

const props = defineProps<{
  class?: HtmlHTMLAttributes['class']
}>()

const { t } = useI18n()
const { isOpen, setIsOpen } = useChainOfThought()
</script>

<template>
  <Collapsible :open="isOpen" @update:open="setIsOpen">
    <CollapsibleTrigger
      :class="
        cn(
          'flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground',
          props.class as string,
        )
      "
      :aria-label="isOpen ? t('aiElements.chainOfThought.collapseAriaLabel') : t('aiElements.chainOfThought.expandAriaLabel')"
      v-bind="$attrs"
    >
      <BrainIcon class="size-4 flex-shrink-0" aria-hidden="true" />
      <span class="text-left min-w-0">
        <slot>Chain of Thought</slot>
      </span>
      <ChevronDownIcon
        :class="
          cn(
            'size-4 flex-shrink-0 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0',
          )
        "
        aria-hidden="true"
      />
    </CollapsibleTrigger>
  </Collapsible>
</template>
