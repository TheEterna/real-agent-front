<script setup lang="ts">
import { computed } from 'vue'
import { UIMessage } from '@/types/events'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { LoadingOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  message: UIMessage
}

const props = defineProps<Props>()

/**
 * 判断 events 是否是流式传输的片段（每个换行符一个 event）
 * 如果是，应该合并为一个整体步骤；否则，每个 event 作为独立步骤
 */
const isStreamingFragments = (events: any[]): boolean => {
  if (!events || events.length === 0) return false
  
  // 如果 events 数量很多（>10），很可能是流式片段
  if (events.length > 10) return true
  
  // 检查是否有大量只包含换行符或很短内容的 event
  const shortEvents = events.filter(e => {
    const content = (e.message || '').toString().trim()
    return content.length <= 2 || content === '\n' || content === ''
  })
  
  // 如果超过 30% 的 events 都很短，认为是流式片段
  return shortEvents.length / events.length > 0.3
}

// ✅ 修正的理解：
// 一个 UIMessage（一个 messageId）= 一个推理步骤集合
// events 数组可能包含：
// 1. 流式传输的片段（每个换行符一个 event）- 应该合并为一个整体
// 2. 真正独立的推理步骤 - 每个 event 作为一个步骤
const thoughtSteps = computed(() => {
  const events = props.message.events || []
  
  // 如果没有 events，使用累积的 message 作为单个步骤
  if (events.length === 0) {
    return [{
      label: t('messages.thought.reasoningContent'),
      content: props.message.message || '',
      status: props.message.endTime ? 'complete' : 'active'
    }]
  }

  // 判断是否是流式片段
  if (isStreamingFragments(events)) {
    // 流式片段：合并所有内容为一个整体步骤
    // 使用累积的 message（已经包含了所有流式内容）
    return [{
      label: t('messages.thought.reasoningContent'),
      content: props.message.message || '',
      status: props.message.endTime ? 'complete' : 'active'
    }]
  }

  // 真正的独立步骤：每个 event 作为一个步骤
  // 但需要过滤掉空的或只有换行符的 event
  return events
    .map((event, index) => ({
      label: t('messages.thought.step', { index: index + 1 }),
      content: event.message || '',
      status: event.endTime ? 'complete' : 'active',
      event: event
    }))
    .filter(step => step.content.trim().length > 0) // 过滤空内容
})

// 判断是否正在思考
const isThinking = computed(() => !props.message.endTime)
</script>

<template>
  <ChainOfThought :default-open="true">
    <ChainOfThoughtHeader>
      <template v-if="isThinking">
        <span class="flex items-center gap-2">
          <LoadingOutlined class="h-4 w-4" />
          {{ t('messages.thought.deepThinking') }}
        </span>
      </template>
      <template v-else>
        {{ t('messages.thought.reasoningComplete') }}
      </template>
    </ChainOfThoughtHeader>

    <ChainOfThoughtContent>
      <!-- 如果只有一个步骤（流式片段合并后的情况），直接渲染内容，不显示步骤结构 -->
      <template v-if="thoughtSteps.length === 1">
        <div class="thought-content-single">
          <MessageResponse 
            :content="thoughtSteps[0].content" 
            class="prose prose-sm max-w-none 
              prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:my-2
              prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
              prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-ul:my-2 prose-ol:my-2 prose-li:my-1
              prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
              prose-table:w-full prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-700
              prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-2 prose-th:font-semibold
              prose-td:p-2 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700
              prose-tr:border-b prose-tr:border-gray-200 dark:prose-tr:border-gray-700
              prose-hr:border-gray-300 dark:prose-hr:border-gray-700"
          />
        </div>
      </template>
      
      <!-- 多个步骤：遍历每一个推理步骤 -->
      <template v-else>
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
          <div class="thought-step-content">
            <MessageResponse 
              :content="step.content" 
              class="prose prose-sm max-w-none 
                prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:my-2
                prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
                prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:text-gray-100
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                prose-ul:my-2 prose-ol:my-2 prose-li:my-1
                prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
                prose-table:w-full prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-700
                prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-2 prose-th:font-semibold
                prose-td:p-2 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700
                prose-tr:border-b prose-tr:border-gray-200 dark:prose-tr:border-gray-700
                prose-hr:border-gray-300 dark:prose-hr:border-gray-700"
            />
          </div>
        </ChainOfThoughtStep>
      </template>
    </ChainOfThoughtContent>
  </ChainOfThought>
</template>

<style scoped lang="scss">
.thought-content-single,
.thought-step-content {
  // 确保 markdown 内容正确渲染
  width: 100%;
  
  // 移除可能的 not-prose 影响
  :deep(.not-prose) {
    // 如果内容被 not-prose 包裹，确保 markdown 样式仍然生效
    * {
      // 恢复 prose 样式
      margin-top: revert;
      margin-bottom: revert;
    }
  }
  
  // 确保 prose 样式正确应用
  :deep(.prose) {
    max-width: 100%;
    color: inherit;
    
    // 确保段落间距
    p {
      margin-top: 0.75em;
      margin-bottom: 0.75em;
      line-height: 1.7;
    }
    
    // 确保列表正确显示
    ul, ol {
      margin-top: 0.75em;
      margin-bottom: 0.75em;
      padding-left: 1.5em;
    }
    
    li {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
    
    // 代码块样式
    pre {
      margin-top: 1em;
      margin-bottom: 1em;
      padding: 1em;
      border-radius: 0.5rem;
      overflow-x: auto;
    }
    
    code {
      font-size: 0.875em;
      font-family: var(--font-mono);
    }
    
    // 表格样式
    table {
      margin-top: 1em;
      margin-bottom: 1em;
      width: 100%;
      border-collapse: collapse;
    }
    
    // 标题样式
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.3;
    }
    hr {
      margin-top: 0;
      margin-bottom: 0;
    }
    
    h1 { font-size: 1.5em; }
    h2 { font-size: 1.3em; }
    h3 { font-size: 1.1em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.9em; }
    h6 { font-size: 0.85em; }
  }
}
</style>
