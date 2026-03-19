<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { UI_COMPONENT_REGISTRY } from './registry'
import UIFallback from './UIFallback.vue'
import type { UIEventPayload, UIEventMeta } from '@/types/ui-event'

const props = defineProps<{
  payload: UIEventPayload
  meta?: UIEventMeta
  messageId?: string
  turnId?: string
}>()

const emit = defineEmits<{
  submit: [data: Record<string, any>]
}>()

const resolvedComponent = computed(() => {
  const loader = UI_COMPONENT_REGISTRY[props.payload.type]
  return loader ? defineAsyncComponent(loader) : UIFallback
})

const isElicitation = computed(() => props.payload.interact === 'elicitation')
</script>

<template>
  <div class="ui-renderer" :class="{ 'ui-renderer--elicitation': isElicitation }">
    <component
      :is="resolvedComponent"
      :args="payload.args"
      :interact="payload.interact ?? 'ui'"
      :meta="meta"
      :message-id="messageId"
      :turn-id="turnId"
      @submit="emit('submit', $event)"
    />
  </div>
</template>
