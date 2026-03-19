<script setup lang="ts">
import type { CardArgs } from '@/types/ui-event'
import UIKeyValue from './UIKeyValue.vue'

const props = defineProps<{ args: CardArgs }>()

const emit = defineEmits<{
  (e: 'action', value: string): void
}>()

const handleAction = (value: string) => {
  emit('action', value)
}
</script>

<template>
  <div class="w-full rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
    <!-- Image -->
    <div v-if="args.imageUrl" class="w-full h-40 overflow-hidden bg-zinc-100">
      <img
        :src="args.imageUrl"
        :alt="args.title"
        class="w-full h-full object-cover"
        loading="lazy"
      />
    </div>

    <!-- Content -->
    <div class="p-4">
      <h4 class="text-sm font-semibold text-zinc-800 leading-snug">{{ args.title }}</h4>
      <p v-if="args.description" class="mt-1.5 text-xs text-zinc-500 leading-relaxed">{{ args.description }}</p>

      <!-- Key-Value fields -->
      <div v-if="args.fields && args.fields.length > 0" class="mt-3">
        <UIKeyValue :args="{ items: args.fields, layout: 'vertical' }" />
      </div>

      <!-- Actions -->
      <div v-if="args.actions && args.actions.length > 0" class="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
        <button
          v-for="action in args.actions"
          :key="action.value"
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200/80 text-zinc-600
                 bg-zinc-50/80 hover:bg-zinc-100 hover:border-zinc-300/80
                 transition-all duration-150 active:scale-95"
          @click="handleAction(action.value)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>
