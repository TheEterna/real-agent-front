<script setup lang="ts">
import type { UIMessage } from '@/types/events'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'

interface Props {
  message: UIMessage
}

const props = defineProps<Props>()
</script>

<template>
  <Message from="assistant">
    <!-- 消息内容 -->
    <MessageContent>
      <MessageResponse :content="props.message.message" />
    </MessageContent>
  </Message>
</template>

<style scoped>
</style>
