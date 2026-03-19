<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  CheckboxRoot,
  CheckboxIndicator,
  type CheckboxRootEmits,
  type CheckboxRootProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    :class="cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      props.class,
    )"
    v-bind="forwarded"
  >
    <CheckboxIndicator class="flex items-center justify-center">
      <Check class="h-4 w-4" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
