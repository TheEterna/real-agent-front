<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    label: string
    description?: string
    status?: 'complete' | 'active' | 'pending'
    class?: HTMLAttributes['class']
  }>(),
  {
    status: 'complete',
    description: undefined,
  },
)

const statusStyles = {
  complete: 'text-muted-foreground',
  active: 'text-foreground',
  pending: 'text-muted-foreground/50',
}

const statusText = computed(() => {
  switch (props.status) {
    case 'complete': return t('aiElements.chainOfThought.statusComplete')
    case 'active': return t('aiElements.chainOfThought.statusActive')
    case 'pending': return t('aiElements.chainOfThought.statusPending')
    default: return ''
  }
})
</script>

<template>
  <div
    :class="
      cn(
        'flex gap-2 text-base',
        statusStyles[props.status],
        'fade-in-0 slide-in-from-top-2 animate-in',
        props.class as string,
      )
    "
    role="listitem"
    :aria-label="`${props.label} - ${statusText}`"
    v-bind="$attrs"
  >
    <div class="relative mt-0.5" aria-hidden="true">
      <slot name="icon" />
      <div
        class="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border"
      />
    </div>
    <div class="flex-1 space-y-2">
      <div>{{ props.label }}</div>
      <span class="sr-only">{{ statusText }}</span>
      <div
        v-if="props.description"
        class="text-muted-foreground text-xs"
      >
        {{ props.description }}
      </div>
      <slot />
    </div>
  </div>
</template>
