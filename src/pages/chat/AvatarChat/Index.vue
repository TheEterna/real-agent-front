<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAvatarStore } from '@/stores/avatarStore'
import { useAvatarChatStore } from '@/stores/avatarChatStore'
import { useAuthStore } from '@/stores/authStore'
import { useFluidAnimation } from '@/composables/useFluidAnimation'
import gsap from 'gsap'
import MarkdownIt from 'markdown-it'

import { Sparkles, Send, Loader2, ArrowLeft, AlertCircle, RotateCw } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInputPreferences } from '@/composables/useInputPreferences'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const avatarStore = useAvatarStore()
const chatStore = useAvatarChatStore()
const authStore = useAuthStore()
const { springIn } = useFluidAnimation()

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

// ---- 路由参数 ----
const avatarId = computed(() => route.params.avatarId as string)
const conversationId = computed(() => (route.params.conversationId as string) || null)

// ---- 分身信息 ----
watch(avatarId, (id) => {
  if (id) avatarStore.setActiveAvatarId(id)
}, { immediate: true })

onMounted(() => {
  avatarStore.ensureAvatarsLoaded()
})

const avatar = computed(() => avatarStore.activeAvatar)

// ---- 会话 & 消息加载 ----
watch(conversationId, async (id) => {
  chatStore.clearMessages()
  if (id) {
    chatStore.setActiveConversationId(id)
    await chatStore.loadMessages(avatarId.value, id)
    scrollToBottom()
  } else {
    chatStore.setActiveConversationId(null)
  }
}, { immediate: true })

// ---- UI 状态 ----
const inputMessage = ref('')
const chatContent = ref<HTMLElement>()
const messageListRef = ref<HTMLElement>()
const isSubmitting = ref(false)
const abortController = ref<AbortController | null>(null)
/** 首条消息正在创建会话中，阻止并发发送 */
const isConversationPending = ref(false)

const canSend = computed(() =>
  inputMessage.value.trim().length > 0 &&
  !chatStore.isStreaming &&
  !isSubmitting.value &&
  !isConversationPending.value
)

// ---- 自动滚动 ----
const shouldFollowOutput = ref(true)

const scrollToBottom = () => {
  if (!chatContent.value) return
  nextTick(() => {
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight
    }
  })
}

// 监听消息变化自动滚动 + 入场动画
let prevMessageCount = 0
watch(() => chatStore.messages.length, (newLen) => {
  if (shouldFollowOutput.value) scrollToBottom()
  if (messageListRef.value && newLen > prevMessageCount) {
    nextTick(() => {
      if (!messageListRef.value) return
      const children = messageListRef.value.children
      const newCount = newLen - prevMessageCount
      for (let i = children.length - newCount; i < children.length; i++) {
        if (children[i]) springIn(children[i] as HTMLElement)
      }
    })
  }
  prevMessageCount = newLen
})

// 监听流式内容变化自动滚动
watch(() => chatStore.streamingContent, () => {
  if (shouldFollowOutput.value) scrollToBottom()
})

const onScroll = () => {
  if (!chatContent.value) return
  const { scrollTop, scrollHeight, clientHeight } = chatContent.value
  shouldFollowOutput.value = scrollHeight - scrollTop - clientHeight < 100
}

// ---- 独立 SSE 通信（fetch + ReadableStream）----

async function sendMessage() {
  if (isSubmitting.value || chatStore.isStreaming || !canSend.value) return
  if (!avatar.value) return

  isSubmitting.value = true
  const userText = inputMessage.value.trim()
  inputMessage.value = ''

  // 乐观追加用户消息
  chatStore.appendUserMessage(userText)
  await nextTick()
  scrollToBottom()

  const controller = new AbortController()
  abortController.value = controller

  // 如果当前没有会话 ID，标记为正在创建会话（防并发）
  const isNewConversation = !conversationId.value
  if (isNewConversation) {
    isConversationPending.value = true
  }

  const MAX_RETRIES = 2
  const RETRY_BASE_MS = 1000

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // 每次重试都重置流式状态，防止跨 attempt 内容累积
      chatStore.startStreaming()
      try {
        const token = authStore.getAccessToken()
        const res = await fetch(`/api/avatars/${avatarId.value}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: userText }),
          signal: controller.signal,
        })

        if (!res.ok) {
          // 4xx/5xx 业务错误不重试
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No readable stream')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          // 保留最后一行（可能不完整）
          buffer = lines.pop() || ''

          let currentEventType = ''
          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEventType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim()
              if (!dataStr) continue
              try {
                const event = JSON.parse(dataStr)
                handleSSEEvent(currentEventType || event.type, event)
              } catch {
                // 忽略解析失败的行
              }
            }
          }
        }

        // 处理 buffer 中剩余内容
        if (buffer.trim()) {
          const remaining = buffer.trim().split('\n')
          let evtType = ''
          for (const line of remaining) {
            if (line.startsWith('event:')) {
              evtType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim()
              if (!dataStr) continue
              try {
                const event = JSON.parse(dataStr)
                handleSSEEvent(evtType || event.type, event)
              } catch { /* ignore */ }
            }
          }
        }

        // 流结束，完成流式接收
        chatStore.finishStreaming()
        // 刷新会话列表（后端可能创建了新会话）
        await chatStore.loadConversations(avatarId.value)
        // 如果获得了新的 conversationId，更新路由
        updateRouteIfNeeded()
        break // 成功则跳出重试循环
      } catch (error: any) {
        if (error.name === 'AbortError') {
          chatStore.finishStreaming()
          return
        }
        // 仅对网络错误重试（非 HTTP 业务错误）
        const isHttpError = error.message?.startsWith('HTTP')
        if (attempt < MAX_RETRIES && !isHttpError) {
          console.warn(`[AvatarChat] SSE 第 ${attempt + 1} 次失败，${RETRY_BASE_MS * Math.pow(2, attempt)}ms 后重试`, error)
          await new Promise(r => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)))
          continue
        }
        // 最后一次也失败，或业务错误
        console.error('[AvatarChat] SSE 失败:', error)
        chatStore.appendErrorMessage(t('chat.avatarChat.sendError'))
        break
      }
    }
  } finally {
    // 兜底：如果流式状态未正常结束（如异常路径），确保清理
    if (chatStore.isStreaming) chatStore.finishStreaming()
    isSubmitting.value = false
    isConversationPending.value = false
    abortController.value = null
  }
}

/** 从 STARTED 事件中提取的 conversationId */
let pendingConversationId: string | null = null

function handleSSEEvent(eventType: string, event: any) {
  switch (eventType) {
    case 'STARTED':
      // 提取 conversationId 以便更新路由
      if (event.data?.conversationId) {
        pendingConversationId = event.data.conversationId
        chatStore.setActiveConversationId(pendingConversationId)
        // 会话已创建，解除首条消息锁定
        isConversationPending.value = false
      }
      break
    case 'ACTING':
      if (event.message) {
        chatStore.appendStreamContent(event.message)
      }
      break
    case 'DONE':
      if (event.message) {
        chatStore.appendStreamContent(event.message)
      }
      break
    case 'ERROR':
      chatStore.appendErrorMessage(event.message || t('chat.avatarChat.avatarChatError'))
      break
    case 'COMPLETED':
      // 流完成信号，finishStreaming 在 finally 中处理
      break
  }
}

function updateRouteIfNeeded() {
  if (pendingConversationId && pendingConversationId !== conversationId.value) {
    router.replace({
      name: 'AvatarChat',
      params: { avatarId: avatarId.value, conversationId: pendingConversationId },
    })
  }
  pendingConversationId = null
}

/** 加载更早的历史消息 */
async function loadOlderMessages() {
  if (!conversationId.value) return
  await chatStore.loadMoreMessages(avatarId.value, conversationId.value)
}

/** 重试：清理错误消息，将最后一条用户消息填入输入框 */
function retryLastMessage() {
  // 先清理末尾的错误消息，避免残留红色提示
  chatStore.removeLastErrorMessage()
  const msgs = chatStore.messages
  let lastUserContent = ''
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'user') {
      lastUserContent = msgs[i].content
      break
    }
  }
  if (!lastUserContent) return
  inputMessage.value = lastUserContent
}

// ---- 键盘 & 输入 ----
const { preferences: inputPreferences } = useInputPreferences()

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter') return
  if (event.shiftKey) return

  if (inputPreferences.value.requireCommandEnterToSubmit && !(event.metaKey || event.ctrlKey)) {
    return
  }

  event.preventDefault()
  sendMessage()
}


const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
}

// ---- 清理 ----
onUnmounted(() => {
  abortController.value?.abort()
  if (messageListRef.value) {
    gsap.killTweensOf(messageListRef.value.children)
  }
})
</script>

<template>
  <div class="avatar-chat h-full flex flex-col overflow-hidden bg-background">
    <!-- Avatar Header -->
    <div class="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border">
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="rounded-lg p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors hover:bg-muted active:scale-95"
              :aria-label="t('chat.avatarChat.backAriaLabel')"
              @click="router.push(`/avatar/${avatarId}`)"
            >
              <ArrowLeft :size="18" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6">{{ t('chat.avatarChat.backTooltip') }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div
        class="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center
               text-primary-foreground text-sm font-medium"
      >
        {{ avatar?.name?.charAt(0) || 'A' }}
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-sm font-medium text-foreground">{{ avatar?.name || t('chat.avatarChat.defaultName') }}</span>
        <Sparkles :size="14" class="text-primary/60" />
      </div>
    </div>

    <!-- Messages Area -->
    <div
      ref="chatContent"
      role="log"
      aria-live="polite"
      :aria-label="t('chat.voloai.chatAriaLabel')"
      class="flex-1 overflow-y-auto px-4 py-6"
      @scroll="onScroll"
    >
      <div class="max-w-[770px] mx-auto space-y-4">
        <!-- Empty state -->
        <div
          v-if="chatStore.messages.length === 0 && !chatStore.isStreaming"
          class="flex flex-col items-center justify-center h-full text-center py-16"
        >
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles :size="28" class="text-primary/60" />
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">
            {{ t('chat.avatarChat.startConversation', { name: avatar?.name || t('chat.avatarChat.defaultName') }) }}
          </h3>
          <p class="text-base text-muted-foreground">{{ t('chat.avatarChat.startHint') }}</p>
        </div>

        <!-- 加载更多历史消息 -->
        <div
          v-if="chatStore.hasMoreMessages && conversationId"
          class="flex justify-center py-3"
        >
          <button
            v-if="!chatStore.isLoadingMore"
            class="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50"
            @click="loadOlderMessages"
          >
            {{ t('chat.avatarChat.loadOlder') }}
          </button>
          <Loader2 v-else :size="14" class="animate-spin text-muted-foreground/50" aria-hidden="true" />
        </div>

        <!-- Message list -->
        <div ref="messageListRef">
          <template v-for="msg in chatStore.messages" :key="msg.id">
            <!-- 用户消息 -->
            <div v-if="msg.role === 'user'" class="flex justify-end mb-4">
              <div class="max-w-[80%] rounded-2xl rounded-tr-md bg-primary text-primary-foreground px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap">
                {{ msg.content }}
              </div>
            </div>
            <!-- 助手消息 -->
            <div v-else class="flex justify-start mb-4">
              <!-- 错误消息 -->
              <div v-if="msg.isError" role="alert" class="max-w-[85%] rounded-2xl rounded-tl-md border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 px-4 py-2.5 text-base leading-relaxed">
                <div class="flex items-start gap-2">
                  <AlertCircle :size="16" class="mt-0.5 shrink-0 text-destructive/70" />
                  <div class="flex-1">
                    <p class="text-destructive/80">{{ msg.content }}</p>
                    <button
                      :aria-label="t('chat.avatarChat.retryAriaLabel')"
                      class="mt-2 inline-flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive transition-all duration-100 active:scale-95"
                      @click="retryLastMessage"
                    >
                      <RotateCw :size="12" />
                      {{ t('common.button.retry') }}
                    </button>
                  </div>
                </div>
              </div>
              <!-- 正常 AI 消息 -->
              <div v-else class="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-2.5 text-base leading-relaxed">
                <div class="prose prose-sm max-w-none dark:prose-invert" v-html="md.render(msg.content)" />
              </div>
            </div>
          </template>
        </div>

        <!-- Streaming content -->
        <div v-if="chatStore.isStreaming && chatStore.streamingContent" class="flex justify-start mb-4">
          <div class="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-2.5 text-base leading-relaxed">
            <div class="prose prose-sm max-w-none dark:prose-invert" v-html="md.render(chatStore.streamingContent)" />
          </div>
        </div>

        <!-- Loading indicator -->
        <div
          v-if="chatStore.isStreaming && !chatStore.streamingContent"
          class="flex items-center gap-2 text-sm text-muted-foreground pl-1"
        >
          <Loader2 :size="14" class="animate-spin" aria-hidden="true" />
          <span>{{ t('chat.avatarChat.thinking') }}</span>
        </div>
      </div>
    </div>

    <!-- Assertive live region for screen readers -->
    <div aria-live="assertive" class="sr-only">
      <span v-if="chatStore.isStreaming">{{ t('chat.avatarChat.thinkingAriaLive') }}</span>
    </div>

    <!-- Input Area -->
    <div class="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
      <div class="max-w-[830px] mx-auto">
        <div
          class="relative flex items-end gap-2 rounded-2xl border border-border bg-card
                 shadow-[var(--shadow-sm)] px-4 py-3 transition-all duration-200
                 focus-within:border-primary/40 focus-within:shadow-[var(--shadow-md)]"
        >
          <textarea
            v-model="inputMessage"
            :placeholder="t('chat.avatarChat.sendPlaceholder', { name: avatar?.name || t('chat.avatarChat.defaultName') })"
            rows="1"
            class="flex-1 resize-none bg-transparent outline-none text-base text-foreground
                   placeholder-muted-foreground max-h-[120px] leading-relaxed
                   focus-visible:outline-none"
            @keydown="handleKeydown"
            @input="handleInput"
          />
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  :disabled="!canSend"
                  :aria-label="t('chat.avatarChat.sendAriaLabel')"
                  class="shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center
                         transition-all duration-100 active:scale-95
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  :class="canSend
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground/50 cursor-not-allowed'"
                  @click="sendMessage"
                >
                  <Send v-if="!chatStore.isStreaming" :size="16" />
                  <Loader2 v-else :size="16" class="animate-spin" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">
                {{ chatStore.isStreaming ? t('chat.avatarChat.replyingTooltip') : (inputPreferences.requireCommandEnterToSubmit ? t('chat.avatarChat.cmdEnterTooltip') : t('chat.avatarChat.enterTooltip')) }}

              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div class="text-center mt-2">
          <span class="text-xs text-muted-foreground/50">
            {{ inputPreferences.requireCommandEnterToSubmit ? t('chat.avatarChat.cmdEnterHint') : t('chat.avatarChat.enterHint') }}
          </span>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  scrollbar-width: none;
}
textarea::-webkit-scrollbar {
  display: none;
}
</style>
