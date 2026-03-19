<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'
import UIRenderer from '@/components/ui-event/UIRenderer.vue'
import type { UIMessage as UIMessageType } from '@/types/events'
import type { UIEventPayload, UIEventMeta } from '@/types/ui-event'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  message: UIMessageType
}>()

const emit = defineEmits<{
  submit: [turnId: string, data: Record<string, any>]
}>()

const cardRef = ref<HTMLElement>()
const submitted = ref(false)
const submitting = ref(false)

const payload = computed<UIEventPayload | null>(() => {
  const data = props.message.data
  if (data && typeof data === 'object' && 'type' in data && 'args' in data) {
    return data as UIEventPayload
  }
  return null
})

const meta = computed<UIEventMeta | undefined>(() => {
  return props.message.meta as UIEventMeta | undefined
})

const isElicitation = computed(() => payload.value?.interact === 'elicitation')

const handleSubmit = (data: Record<string, any>) => {
  const turnId = props.message.turnId
  if (!turnId || submitted.value || submitting.value) return
  submitting.value = true
  submitted.value = true
  emit('submit', turnId, data)
}

onMounted(() => {
  if (cardRef.value) {
    gsap.fromTo(cardRef.value,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
    )
  }
})

onUnmounted(() => {
  if (cardRef.value) gsap.killTweensOf(cardRef.value)
})
</script>

<template>
  <div ref="cardRef" class="ui-message-container w-full">
    <!-- 可选的自然语言描述 -->
    <p v-if="message.message" class="text-base text-zinc-500 mb-2">
      {{ message.message }}
    </p>

    <!-- UI 渲染区 -->
    <UIRenderer
      v-if="payload"
      :payload="payload"
      :meta="meta"
      :message-id="message.messageId"
      :turn-id="message.turnId"
      @submit="handleSubmit"
    />

    <!-- payload 解析失败的降级 -->
    <div v-else class="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p class="text-base text-zinc-500">{{ t('messages.uiMessage.parseError') }}</p>
      <details class="mt-2">
        <summary class="text-xs text-zinc-400 cursor-pointer">{{ t('messages.uiMessage.rawData') }}</summary>
        <pre class="mt-1 text-xs text-zinc-500 bg-zinc-100 rounded p-2 overflow-auto max-h-40 font-mono">{{ JSON.stringify(message.data, null, 2) }}</pre>
      </details>
    </div>

    <!-- elicitation 提交状态指示 -->
    <div v-if="isElicitation && submitted" class="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>{{ t('messages.common.submitted') }}</span>
    </div>
    <div v-else-if="isElicitation && submitting && !submitted" class="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
      <div class="w-3 h-3 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
      <span>{{ t('messages.common.submitting') }}</span>
    </div>
  </div>
</template>
