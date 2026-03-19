<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  RadioGroupItem,
  RadioGroupIndicator,
  type RadioGroupItemProps,
  useForwardProps,
} from 'reka-ui'
import { Circle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <RadioGroupItem
    :class="cn(
      'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
    v-bind="forwarded"
  >
    <RadioGroupIndicator
      :class="cn('flex items-center justify-center')"
    >
      <Circle class="h-2.5 w-2.5 fill-current text-current" />
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
