<script setup lang="ts">
import { computed } from 'vue'
import type { KeyValueArgs, UIKeyValue as UIKeyValueItem } from '@/types/ui-event'

const props = defineProps<{ args: KeyValueArgs }>()

const layout = computed(() => props.args.layout ?? 'vertical')
const gridColumns = computed(() => props.args.columns ?? 2)

const containerClass = computed(() => {
  switch (layout.value) {
    case 'horizontal':
      return 'flex flex-wrap gap-x-6 gap-y-2'
    case 'grid':
      return 'grid gap-3'
    default:
      return 'flex flex-col gap-2'
  }
})

const containerStyle = computed(() => {
  if (layout.value === 'grid') {
    return { gridTemplateColumns: `repeat(${gridColumns.value}, minmax(0, 1fr))` }
  }
  return {}
})

const renderValue = (item: UIKeyValueItem) => {
  return String(item.value)
}
</script>

<template>
  <div :class="containerClass" :style="containerStyle">
    <div
      v-for="(item, index) in args.items"
      :key="index"
      class="flex items-baseline gap-2 min-w-0"
      :class="layout === 'horizontal' ? '' : 'justify-between'"
    >
      <span class="text-xs text-zinc-500 shrink-0">{{ item.key }}</span>

      <!-- text (default) -->
      <span v-if="!item.type || item.type === 'text'" class="text-xs font-medium text-zinc-800 truncate">
        {{ renderValue(item) }}
      </span>

      <!-- link -->
      <a
        v-else-if="item.type === 'link'"
        :href="String(item.value)"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline truncate"
      >
        {{ renderValue(item) }}
      </a>

      <!-- tag -->
      <span
        v-else-if="item.type === 'tag'"
        class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.75rem] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/60"
      >
        {{ renderValue(item) }}
      </span>

      <!-- badge -->
      <span
        v-else-if="item.type === 'badge'"
        class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.75rem] font-medium bg-teal-50 text-teal-700 border border-teal-200/60"
      >
        {{ renderValue(item) }}
      </span>
    </div>
  </div>
</template>
