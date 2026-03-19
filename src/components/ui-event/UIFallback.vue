<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UIEventMeta, UIComponentArgs } from '@/types/ui-event'
import type { UIInteractMode } from '@/types/ui-event'

const { t } = useI18n()

defineProps<{
  args: UIComponentArgs
  interact?: UIInteractMode
  meta?: UIEventMeta
  messageId?: string
  turnId?: string
}>()
</script>

<template>
  <div class="ui-fallback rounded-xl border border-zinc-200 bg-zinc-50/80 backdrop-blur-sm p-4">
    <p class="text-sm text-zinc-600">
      {{ meta?.fallback || t('uiEvent.fallback.unsupported') }}
    </p>
    <details class="mt-3">
      <summary class="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors select-none">
        {{ t('uiEvent.fallback.rawData') }}
      </summary>
      <pre class="mt-2 text-xs text-zinc-500 bg-zinc-100 rounded-lg p-3 overflow-auto max-h-60 font-mono">{{ JSON.stringify(args, null, 2) }}</pre>
    </details>
  </div>
</template>
