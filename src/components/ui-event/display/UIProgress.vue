<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressArgs } from '@/types/ui-event'

const props = defineProps<{ args: ProgressArgs }>()

const max = computed(() => props.args.max ?? 100)
const percent = computed(() => {
  if (max.value <= 0) return 0
  return Math.min(100, Math.max(0, (props.args.value / max.value) * 100))
})
const showPercent = computed(() => props.args.showPercent !== false)

const barColorClass = computed(() => {
  switch (props.args.status) {
    case 'success': return 'bg-emerald-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-blue-500'
  }
})

const trackColorClass = computed(() => {
  switch (props.args.status) {
    case 'success': return 'bg-emerald-100'
    case 'error': return 'bg-red-100'
    default: return 'bg-blue-100'
  }
})

const textColorClass = computed(() => {
  switch (props.args.status) {
    case 'success': return 'text-emerald-600'
    case 'error': return 'text-red-600'
    default: return 'text-blue-600'
  }
})
</script>

<template>
  <div class="w-full flex flex-col gap-1.5">
    <!-- Label row -->
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-zinc-700">{{ args.label }}</span>
      <span v-if="showPercent" :class="textColorClass" class="text-xs font-semibold tabular-nums">
        {{ Math.round(percent) }}%
      </span>
    </div>

    <!-- Track -->
    <div :class="trackColorClass" class="w-full h-2 rounded-full overflow-hidden">
      <div
        :class="barColorClass"
        class="h-full rounded-full transition-all duration-500 ease-out"
        :style="{ width: percent + '%' }"
      />
    </div>
  </div>
</template>
