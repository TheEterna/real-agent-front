<script setup lang="ts">
import type { UIMessage } from 'ai'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  from: UIMessage['role']
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="
      cn(
        'group flex w-full',
        props.from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
        props.class as string,
      )
    "
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
