
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tooltip } from 'ant-design-vue'
import { AlertCircle, RotateCw } from 'lucide-vue-next'
import type { UIMessage } from '@/types/events'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ message: UIMessage }>()

const emit = defineEmits<{
  retry: []
}>()

const isRetrying = ref(false)

/** 将原始错误信息映射为用户友好的简化描述 */
const friendlyError = computed(() => {
  const raw = (props.message.message || '').toLowerCase()

  if (raw.includes('timeout') || raw.includes('超时')) return t('messages.error.timeout')
  if (raw.includes('rate limit') || raw.includes('429')) return t('messages.error.rateLimit')
  if (raw.includes('unauthorized') || raw.includes('401')) return t('messages.error.unauthorized')
  if (raw.includes('network') || raw.includes('fetch') || raw.includes('连接')) return t('messages.error.network')
  if (raw.includes('500') || raw.includes('internal')) return t('messages.error.serverError')
  if (raw.includes('503') || raw.includes('unavailable')) return t('messages.error.serviceUnavailable')
  if (raw.includes('token') || raw.includes('quota') || raw.includes('余额')) return t('messages.error.quotaExceeded')

  return t('messages.error.generic')
})

const handleRetry = () => {
  if (isRetrying.value) return
  isRetrying.value = true
  emit('retry')
}
</script>

<template>
  <Tooltip :title="friendlyError" placement="top">
    <button
      role="alert"
      :aria-label="t('messages.error.retryLabel')"
      :disabled="isRetrying"
      class="cursor-pointer flex items-center bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 active:bg-amber-200 dark:active:bg-amber-800 justify-between leading-1
        px-3.5 py-3 gap-2.5 duration-200 rounded-3xl relative overflow-hidden transition-all ease-in-out transform
        hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      @click="handleRetry"
    >
      <AlertCircle class="w-4 h-4 flex-shrink-0 text-amber-500 dark:text-amber-400" />

      <span class="text-sm font-medium text-amber-700 dark:text-amber-300">
        {{ isRetrying ? t('messages.error.retrying') : t('messages.error.continue') }}
      </span>

      <RotateCw
        class="w-3.5 h-3.5 text-amber-400 dark:text-amber-500 transition-transform duration-200"
        :class="{ 'animate-spin': isRetrying }"
      />
    </button>
  </Tooltip>
</template>
