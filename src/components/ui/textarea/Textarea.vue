<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  defaultValue?: string | number
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <textarea
    data-slot="textarea"
    :class="cn(
      'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      props.class
    )"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :rows="rows"
    @input="handleInput"
  />
</template>
