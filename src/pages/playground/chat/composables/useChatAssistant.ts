/**
 * 核心聊天逻辑 composable
 * 对接真实后端 API，管理消息列表、流式发送/接收
 */
import { shallowRef, triggerRef, ref, readonly } from 'vue'
import i18n from '@/i18n'
import type { Message, Personality, ResponseStyle } from '../types'
import { chatApi } from '../api/mock'

const { t } = i18n.global

/** 当前正在进行的流式请求控制器，用于取消 */
let currentController: AbortController | null = null
/** 24小时阈值（毫秒） */
const RECENT_THRESHOLD_MS = 24 * 60 * 60 * 1000

export function useChatAssistant() {
  const messages = shallowRef<Message[]>([])
  const isStreaming = ref(false)
  const isSending = ref(false)
  const hasMore = ref(false)
  /** 是否存在被 24h 规则折叠的旧消息 */
  const hasOlderMessages = ref(false)
  /** 全量消息（未经 24h 过滤） */
  let allLoadedMessages: Message[] = []

  function createAssistantMessage(messageId?: string): Message {
    const assistant: Message = {
      id: messageId || `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }
    messages.value.push(assistant)
    triggerRef(messages)
    return assistant
  }

  /**
   * 发送消息并处理流式响应
   */
  async function sendMessage(
    content: string,
    options?: {
      emotion?: string
      personality?: Personality
      responseStyle?: ResponseStyle
    },
  ) {
    if (!content.trim() || isSending.value) return

    // 取消上一次未完成的流式请求
    currentController?.abort()
    currentController = new AbortController()

    isSending.value = true

    // 添加用户消息
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    messages.value.push(userMsg)
    triggerRef(messages)

    // 准备 AI 消息占位
    let assistantMsg: Message | null = null
    isStreaming.value = true

    try {
      const stream = chatApi.sendMessage(content, {
        ...options,
      }, currentController.signal)

      for await (const chunk of stream) {
        switch (chunk.type) {
          case 'started':
            assistantMsg = assistantMsg || createAssistantMessage(chunk.messageId)
            if (chunk.messageId) {
              assistantMsg.id = chunk.messageId
            }
            assistantMsg.isStreaming = true
            triggerRef(messages)
            break

          case 'text':
            if (!assistantMsg && chunk.content) {
              assistantMsg = createAssistantMessage()
            }
            if (assistantMsg && chunk.content) {
              assistantMsg.content += chunk.content
              triggerRef(messages)
            }
            break

          case 'thinking':
            // thinking 事件暂时忽略，后续可展示思考过程
            break

          case 'done':
            if (assistantMsg) {
              assistantMsg.isStreaming = false
              triggerRef(messages)
            }
            break

          case 'error':
            assistantMsg = assistantMsg || createAssistantMessage()
            assistantMsg.content = assistantMsg.content || t('playgroundChat.composables.errorFallback')
            assistantMsg.isStreaming = false
            triggerRef(messages)
            break
        }
      }
    } catch (err) {
      const error = err as Error | undefined
      if (error?.name === 'AbortError') {
        return
      }
      console.error('[useChatAssistant] 发送失败:', err)
      assistantMsg = assistantMsg || createAssistantMessage()
      assistantMsg.content = t('playgroundChat.composables.errorFallback')
      assistantMsg.isStreaming = false
      triggerRef(messages)
    } finally {
      isStreaming.value = false
      isSending.value = false
      currentController = null
    }
  }

  /**
   * 创建 checkpoint（伪新建对话 / 忘记刚刚对话）
   * 后端插入 checkpoint 消息作为记忆截断边界，不删除任何消息。
   * 重新拉取历史后，checkpoint 之后若无消息则显示 WelcomeScreen。
   */
  async function clearMessages() {
    try {
      await chatApi.clearChat()
      // 重新拉取：初始加载会在 checkpoint 处截断，checkpoint 之后无消息则清空显示
      await loadHistory()
    } catch (err) {
      console.error('[useChatAssistant] 创建 checkpoint 失败:', err)
    }
  }

  /**
   * 加载历史消息（仅展示 24h 内的，旧消息折叠）
   */
  async function loadHistory(limit?: number) {
    try {
      const result = await chatApi.getMessages(limit)
      allLoadedMessages = result.messages
      hasMore.value = result.hasMore
      applyRecentFilter()
      return result.hasMore
    } catch (err) {
      console.error('[useChatAssistant] 加载历史失败:', err)
      return false
    }
  }

  /** 将全量消息按 24h 阈值拆分 */
  function applyRecentFilter() {
    const cutoff = Date.now() - RECENT_THRESHOLD_MS
    const recentIdx = allLoadedMessages.findIndex(m => m.timestamp.getTime() >= cutoff)
    if (recentIdx === -1 && allLoadedMessages.length > 0) {
      // 所有已加载消息都超过 24h — 不显示任何消息，但标记有旧消息
      messages.value = []
      hasOlderMessages.value = true
    } else if (recentIdx <= 0) {
      // 全部在 24h 内，或列表为空
      messages.value = allLoadedMessages
      hasOlderMessages.value = hasMore.value
    } else {
      // 部分旧消息 + 部分新消息
      messages.value = allLoadedMessages.slice(recentIdx)
      hasOlderMessages.value = true
    }
  }

  /**
   * 展开被 24h 规则折叠的旧消息
   */
  async function revealOlderMessages() {
    // 先把已加载但被过滤掉的补回来
    messages.value = [...allLoadedMessages]
    triggerRef(messages)
    hasOlderMessages.value = hasMore.value
  }

  /**
   * 加载更多历史消息（上滑加载）
   */
  async function loadMore(limit = 20) {
    if (!hasMore.value || messages.value.length === 0) return false
    // 找到第一条有后端真实 ID 的消息作为游标
    const firstRealMsg = messages.value.find(m => !m.id.startsWith('user-') && !m.id.startsWith('assistant-'))
    const beforeId = firstRealMsg?.id
    try {
      const result = await chatApi.getMessages(limit, beforeId)
      if (result.messages.length > 0) {
        messages.value.unshift(...result.messages)
        triggerRef(messages)
      }
      hasMore.value = result.hasMore
      return result.hasMore
    } catch (err) {
      console.error('[useChatAssistant] 加载更多失败:', err)
      return false
    }
  }

  /** 清理资源，供组件 onUnmounted 调用 */
  function cleanup() {
    currentController?.abort()
    currentController = null
  }

  return {
    messages: readonly(messages),
    isStreaming: readonly(isStreaming),
    isSending: readonly(isSending),
    hasMore: readonly(hasMore),
    hasOlderMessages: readonly(hasOlderMessages),
    sendMessage,
    clearMessages,
    loadHistory,
    loadMore,
    revealOlderMessages,
    cleanup,
  }
}
