<script setup lang="ts">
import { computed } from 'vue'
import { UIMessage } from '@/types/events'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { LoadingOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons-vue'

interface Props {
  message: UIMessage
}

const props = defineProps<Props>()

// ✅ 修正的理解：
// 一个 UIMessage（一个 messageId）= 一个推理步骤集合
// events 数组包含所有流式传输的 THOUGHT 事件
// 每个 event 对应一个 ChainOfThoughtStep
const thoughtSteps = computed(() => {
  if (!props.message.events || props.message.events.length === 0) {
    // 降级处理：如果没有 events，使用累积的 message
    return [{
      label: '推理步骤',
      content: props.message.message || '',
      status: props.message.endTime ? 'complete' : 'active'
    }]
  }

  // 从 events 数组生成多个 step
  return props.message.events.map((event, index) => ({
    label: `步骤 ${index + 1}`,
    content: event.message || '',
    status: event.endTime ? 'complete' : 'active',
    event: event
  }))
})

// 判断是否正在思考
const isThinking = computed(() => !props.message.endTime)
</script>

<template>
  <ChainOfThought :defaultOpen="true">
    <ChainOfThoughtHeader>
      <template v-if="isThinking">
        <span class="flex items-center gap-2">
          <LoadingOutlined class="h-4 w-4" />
          正在深度思考...
        </span>
      </template>
      <template v-else>
        推理完成
      </template>
    </ChainOfThoughtHeader>

    <ChainOfThoughtContent>
      <!-- 遍历每一个推理步骤 -->
      <ChainOfThoughtStep
        v-for="(step, stepIndex) in thoughtSteps"
        :key="stepIndex"
        :label="step.label"
        :status="step.status as any"
      >
        <template #icon>
          <CheckCircleOutlined 
            v-if="step.status === 'complete'" 
            class="size-4 text-green-500"
          />
          <LoadingOutlined 
            v-else-if="step.status === 'active'" 
            class="size-4 text-blue-500"
          />
          <ClockCircleOutlined 
            v-else 
            class="size-4 text-gray-400"
          />
        </template>
        <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {{ step.content }}
        </div>
      </ChainOfThoughtStep>
    </ChainOfThoughtContent>
  </ChainOfThought>
</template>

<style scoped>
</style>
