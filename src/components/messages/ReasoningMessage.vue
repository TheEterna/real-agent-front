<script setup lang="ts">
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'
import type { UIMessage } from '@/types/events'

const props = defineProps<{ message: UIMessage; isReasoning?: boolean }>()
</script>

<template>
  <Reasoning :is-streaming="isReasoning ?? false">
    <ReasoningTrigger />
    <ReasoningContent :content="props.message.message" />
  </Reasoning>
</template>
