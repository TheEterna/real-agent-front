<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { TableArgs } from '@/types/ui-event'

const { t } = useI18n()

const props = defineProps<{ args: TableArgs }>()

// Pagination state
const currentPage = ref(1)
const pageSize = computed(() => props.args.pagination?.pageSize ?? props.args.rows.length)
const totalRows = computed(() => props.args.pagination?.total ?? props.args.rows.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / pageSize.value)))

const displayRows = computed(() => {
  if (!props.args.pagination) return props.args.rows
  const start = (currentPage.value - 1) * pageSize.value
  return props.args.rows.slice(start, start + pageSize.value)
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const alignClass = (align?: 'left' | 'center' | 'right') => {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

const formatCell = (value: string | number | boolean | null): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? t('uiEvent.table.boolTrue') : t('uiEvent.table.boolFalse')
  return String(value)
}
</script>

<template>
  <div class="w-full rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm overflow-hidden">
    <!-- Title -->
    <div v-if="args.title" class="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
      <h4 class="text-sm font-semibold text-zinc-700">{{ args.title }}</h4>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-zinc-100 bg-zinc-50/30">
            <th
              v-for="col in args.columns"
              :key="col.key"
              :class="alignClass(col.align)"
              :style="col.width ? { width: col.width + 'px', minWidth: col.width + 'px' } : {}"
              class="px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in displayRows"
            :key="rowIndex"
            class="border-b border-zinc-50 last:border-b-0 transition-colors duration-150 hover:bg-zinc-50/60"
          >
            <td
              v-for="col in args.columns"
              :key="col.key"
              :class="alignClass(col.align)"
              class="px-4 py-2.5 text-zinc-700"
            >
              {{ formatCell(row[col.key]) }}
            </td>
          </tr>
          <tr v-if="displayRows.length === 0">
            <td :colspan="args.columns.length" class="px-4 py-8 text-center text-zinc-400 text-sm">
              {{ t('uiEvent.table.noData') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="args.pagination && totalPages > 1" class="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between text-xs text-zinc-500">
      <span>{{ t('uiEvent.table.itemsTotal', { total: totalRows }) }}</span>
      <div class="flex items-center gap-1">
        <button
          :disabled="currentPage <= 1"
          class="px-2 py-1 rounded-md transition-colors duration-150 hover:bg-zinc-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
          @click="goToPage(currentPage - 1)"
        >
          {{ t('uiEvent.table.prev') }}
        </button>
        <span class="px-2 text-zinc-600 font-medium">{{ currentPage }} / {{ totalPages }}</span>
        <button
          :disabled="currentPage >= totalPages"
          class="px-2 py-1 rounded-md transition-colors duration-150 hover:bg-zinc-200/60 disabled:opacity-30 disabled:cursor-not-allowed"
          @click="goToPage(currentPage + 1)"
        >
          {{ t('uiEvent.table.next') }}
        </button>
      </div>
    </div>
  </div>
</template>
