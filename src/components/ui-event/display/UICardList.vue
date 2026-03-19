<script setup lang="ts">
import { computed } from 'vue'
import type { CardListArgs } from '@/types/ui-event'
import UICard from './UICard.vue'

const props = defineProps<{ args: CardListArgs }>()

const isGrid = computed(() => props.args.layout === 'grid')
const gridColumns = computed(() => props.args.columns ?? 2)

const gridStyle = computed(() => {
  if (!isGrid.value) return {}
  return {
    gridTemplateColumns: `repeat(${gridColumns.value}, minmax(0, 1fr))`
  }
})
</script>

<template>
  <div
    :class="isGrid ? 'grid gap-3' : 'flex flex-col gap-3'"
    :style="isGrid ? gridStyle : {}"
    class="w-full"
  >
    <UICard
      v-for="(item, index) in args.items"
      :key="index"
      :args="item"
    />
  </div>
</template>
