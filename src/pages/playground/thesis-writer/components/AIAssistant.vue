<template>
  <div class="flex flex-col h-full">
    <!-- 当前章节上下文提示 -->
    <div v-if="currentNodeTitle" class="px-4 py-2 border-b border-border/50 bg-violet-50/50 dark:bg-violet-900/10">
      <div class="flex items-center gap-1.5">
        <FileText :size="12" class="text-violet-500 shrink-0" />
        <span class="text-xs text-violet-600 dark:text-violet-400 truncate">
          {{ t('thesisWriter.aiAssistant.currentContext') }}{{ currentNodeTitle }}
        </span>
      </div>
    </div>

    <!-- Header -->
    <div class="px-4 py-3 border-b border-border">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Bot :size="16" class="text-white" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-foreground">{{ t('thesisWriter.index.tabAI') }}</h3>
          <p class="text-xs text-muted-foreground">{{ t('thesisWriter.aiAssistant.welcomeMessage') }}</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="px-4 py-3 border-b border-border">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          v-for="action in quickActions"
          :key="action.id"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground bg-muted hover:bg-accent hover:text-accent-foreground transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isTyping"
          @click="executeAction(action.id)"
        >
          <component :is="action.icon" :size="14" :class="action.iconClass" />
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Chat Area -->
    <div ref="chatContainerRef" class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Welcome Message -->
      <div v-if="currentMessages.length === 0" class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
          <Sparkles :size="24" class="text-violet-600 dark:text-violet-400" />
        </div>
        <p class="text-base text-muted-foreground mb-2">{{ t('thesisWriter.aiAssistant.welcomeMessage') }}</p>
        <p class="text-xs text-muted-foreground/70 max-w-[200px] mx-auto">
          {{ t('thesisWriter.aiAssistant.welcomeItem1') }}
        </p>
      </div>

      <!-- Message List -->
      <div
        v-for="msg in currentMessages"
        :key="msg.id"
        class="message"
        :class="msg.role === 'user' ? 'message--user' : 'message--assistant'"
      >
        <div
          v-if="msg.role === 'assistant'"
          class="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0"
        >
          <Bot :size="12" class="text-white" />
        </div>
        <div
          class="message-bubble"
          :class="{
            'bg-muted text-foreground': msg.role === 'user',
            'bg-violet-50 dark:bg-violet-900/20 text-foreground': msg.role === 'assistant'
          }"
        >
          <div class="text-base whitespace-pre-wrap">{{ msg.content }}</div>

          <!-- Insert Button (for assistant messages) -->
          <div
            v-if="msg.role === 'assistant' && msg.insertable"
            class="mt-2 pt-2 border-t border-violet-100 dark:border-violet-800/30"
          >
            <button
              class="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 transition-colors"
              :aria-label="t('thesisWriter.writingGuidance.insertToEditor')"
              @click="insertToEditor(msg.content)"
            >
              <ArrowDownToLine :size="12" />
              {{ t('thesisWriter.writingGuidance.insertToEditor') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isTyping" class="message message--assistant">
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <Bot :size="12" class="text-white" />
        </div>
        <div class="message-bubble bg-violet-50 dark:bg-violet-900/20">
          <div class="flex items-center gap-1">
            <span class="typing-dot"></span>
            <span class="typing-dot" style="animation-delay: 0.15s"></span>
            <span class="typing-dot" style="animation-delay: 0.3s"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="px-4 py-3 border-t border-border">
      <div class="relative">
        <textarea
          v-model="inputText"
          class="w-full px-3 py-2.5 pr-10 bg-muted border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-foreground placeholder:text-muted-foreground"
          :placeholder="t('thesisWriter.aiAssistant.inputPlaceholder')"
          rows="2"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="absolute right-2 bottom-2 w-7 h-7 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!inputText.trim() || isTyping"
                :aria-label="t('thesisWriter.aiAssistant.sendTooltip')"
                @click="sendMessage"
              >
                <Send :size="14" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.aiAssistant.sendTooltip') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p class="text-xs text-muted-foreground mt-1.5 text-center">
        {{ t('thesisWriter.aiAssistant.inputHint') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Bot,
  Sparkles,
  Send,
  ArrowDownToLine,
  FileText,
  Wand2,
  Quote
} from 'lucide-vue-next'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { useThesisSSE } from '../composables/useThesisSSE'
import { useThesisStore } from '../stores/thesisStore'
import type { OutlineNode } from '@/types/thesis-writer'

const props = defineProps<{
  projectId: string
  nodeId: string
}>()

const { t } = useI18n()

// ==================== 章节上下文 ====================
const thesisStore = useThesisStore()

function findNodeInTree(nodes: OutlineNode[], id: string): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

const currentNodeTitle = computed(() => {
  if (!props.nodeId) return ''
  const node = findNodeInTree(thesisStore.outline, props.nodeId)
  return node?.title || ''
})

const emit = defineEmits<{
  insertContent: [content: string]
}>()

// ==================== 类型定义 ====================
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  insertable?: boolean
}

// ==================== SSE ====================
const { streamWrite, stopStream } = useThesisSSE()

// ==================== 状态 ====================
const chatContainerRef = ref<HTMLElement>()
const inputText = ref('')
const messagesByNode = ref<Map<string, Message[]>>(new Map())
const isTyping = ref(false)

const currentMessages = computed(() => {
  const key = props.nodeId || '__global__'
  return messagesByNode.value.get(key) || []
})

// ==================== 快捷操作 ====================
const quickActions = computed(() => [
  { id: 'generate_outline', label: t('thesisWriter.aiAssistant.generateOutline'), icon: FileText, iconClass: 'text-amber-500' },
  { id: 'expand_content', label: t('thesisWriter.aiAssistant.expandContent'), icon: Sparkles, iconClass: 'text-blue-500' },
  { id: 'polish', label: t('thesisWriter.aiAssistant.polishOptimize'), icon: Wand2, iconClass: 'text-purple-500' },
  { id: 'cite_suggestion', label: t('thesisWriter.aiAssistant.citeSuggestion'), icon: Quote, iconClass: 'text-green-500' }
])

// ==================== 发送消息 ====================
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  const key = props.nodeId || '__global__'
  if (!messagesByNode.value.has(key)) {
    messagesByNode.value.set(key, [])
  }
  const msgs = messagesByNode.value.get(key)!

  // 添加用户消息
  const userMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: text,
  }
  msgs.push(userMessage)
  inputText.value = ''

  await nextTick()
  scrollToBottom()

  isTyping.value = true

  // 准备 AI 助手消息（流式填充）
  const assistantMessage: Message = {
    id: `msg-${Date.now() + 1}`,
    role: 'assistant',
    content: '',
    insertable: true,
  }
  msgs.push(assistantMessage)

  // 映射快捷操作到 action
  const actionLabels: Record<string, string> = {
    generate_outline: t('thesisWriter.aiAssistant.generateOutline'),
    expand_content: t('thesisWriter.aiAssistant.expandContent'),
    polish: t('thesisWriter.aiAssistant.polishOptimize'),
    cite_suggestion: t('thesisWriter.aiAssistant.citeSuggestion'),
  }
  const matchedAction = Object.entries(actionLabels).find(([, label]) => text.includes(label))
  const action = matchedAction ? matchedAction[0] : 'write_chapter'

  try {
    await streamWrite(
      {
        projectId: props.projectId,
        nodeId: props.nodeId || undefined,
        action: action as any,
        prompt: text,
      },
      {
        onContent(chunk) {
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content += chunk
          }
          nextTick(() => scrollToBottom())
        },
        onDone() {
          isTyping.value = false
          nextTick(() => scrollToBottom())
        },
        onError(error) {
          const lastMsg = msgs[msgs.length - 1]
          if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
            lastMsg.content = `${t('thesisWriter.aiAssistant.sendFailed')}: ${error}`
            lastMsg.insertable = false
          }
          isTyping.value = false
        },
      }
    )
  } catch (e) {
    console.error('AI 写作请求失败:', e)
    const lastMsg = msgs[msgs.length - 1]
    if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
      lastMsg.content = t('thesisWriter.aiAssistant.sendFailed')
      lastMsg.insertable = false
    }
    isTyping.value = false
  }
}

// ==================== 执行快捷操作 ====================
function executeAction(actionId: string) {
  const actionLabels: Record<string, string> = {
    generate_outline: t('thesisWriter.aiAssistant.generateOutlinePrompt'),
    expand_content: t('thesisWriter.aiAssistant.expandContentPrompt'),
    polish: t('thesisWriter.aiAssistant.polishPrompt'),
    cite_suggestion: t('thesisWriter.aiAssistant.citePrompt'),
  }

  inputText.value = actionLabels[actionId] || ''
  sendMessage()
}

// ==================== 插入到编辑器 ====================
function insertToEditor(content: string) {
  emit('insertContent', content)
}

// ==================== 滚动到底部 ====================
function scrollToBottom() {
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

// ==================== 监听项目/节点变化 ====================
watch([() => props.projectId, () => props.nodeId], () => {
  // 对话历史已按节点分组存储，切换节点时无需清空
})

onBeforeUnmount(() => {
  stopStream()
})
</script>

<style scoped>
.message {
  display: flex;
  gap: 8px;
}

.message--user {
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: var(--radius-lg, 12px);
}

.message--user .message-bubble {
  border-bottom-right-radius: var(--radius-sm, 4px);
}

.message--assistant .message-bubble {
  border-bottom-left-radius: var(--radius-sm, 4px);
}

.typing-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: var(--color-violet-500, #8b5cf6);
  border-radius: 50%;
  animation: typing 1s ease-in-out infinite;
}

@keyframes typing {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .typing-dot {
    animation: none !important;
    opacity: 0.6;
  }
}
</style>

<style>
.dark .typing-dot {
  background-color: var(--color-violet-400, #a78bfa);
}
</style>
