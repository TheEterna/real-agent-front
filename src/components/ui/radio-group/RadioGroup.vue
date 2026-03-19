<script setup lang="ts">
import { computed, provide, type HTMLAttributes } from 'vue'
import {
  RadioGroupRoot,
  type RadioGroupRootEmits,
  type RadioGroupRootProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<RadioGroupRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<RadioGroupRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)

provide('radioGroup', {
  modelValue: computed(() => props.modelValue),
  disabled: computed(() => props.disabled),
})
</script>

<template>
  <RadioGroupRoot
    :class="cn('grid gap-2', props.class)"
    v-bind="forwarded"
  >
    <slot />
  </RadioGroupRoot>
</template>
