// ============================================================
// Avatar Chat Store — 分身聊天状态管理（独立于 chatStore）
// 职责：管理分身聊天的会话列表、当前会话消息、SSE 流式状态
// 模式：Composition API + SWR + readonly 返回
// ============================================================

import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import * as avatarApi from '@/api/avatar'
import type {
  AvatarConversation,
  AvatarConversationVO,
  AvatarChatMessage,
  AvatarChatMessageVO,
} from '@/types/avatar'
import { nanoid } from 'nanoid'

// ==================== VO -> Model 转换 ====================

function transformConversation(vo: AvatarConversationVO): AvatarConversation {
  return {
    id: vo.id,
    avatarId: vo.avatarId,
    avatarName: vo.avatarName,
    avatarUrl: vo.avatarUrl,
    title: vo.title,
    lastMessageTime: vo.lastMessageTime ? new Date(vo.lastMessageTime) : null,
    createdTime: new Date(vo.createdTime),
  }
}

function transformMessage(vo: AvatarChatMessageVO): AvatarChatMessage {
  return {
    id: vo.id,
    role: vo.role,
    content: vo.content,
    model: vo.model,
    createdTime: new Date(vo.createdTime),
  }
}

// ==================== SWR 缓存 Key ====================

/** 按 avatarId 隔离缓存，避免跨分身数据污染 */
function cacheKeyFor(avatarId: string) {
  return `volo_ai_avatar_convs_${avatarId}`
}

// ==================== Store 定义 ====================

export const useAvatarChatStore = defineStore('avatarChat', () => {
  // ---- 会话列表 ----
  const conversations = ref<AvatarConversation[]>([])
  const isLoadingConversations = ref(false)
  const cacheHydrated = ref(false)

  // ---- 当前活跃会话 ----
  const activeConversationId = ref<string | null>(null)

  // ---- 当前会话消息 ----
  const messages = ref<AvatarChatMessage[]>([])
  const isLoadingMessages = ref(false)

  // ---- 消息分页 ----
  const currentPage = ref(0)
  const hasMoreMessages = ref(true)
  const isLoadingMore = ref(false)
  const PAGE_SIZE = 30

  // ---- SSE 流式状态 ----
  const streamingContent = ref('')
  const isStreaming = ref(false)

  // ==================== SWR 水合 ====================

  /** 当前缓存对应的 avatarId，用于缓存隔离 */
  const currentCachedAvatarId = ref<string | null>(null)

  /** 从 localStorage 水合指定分身的会话缓存 */
  function hydrateFromCache(avatarId: string) {
    try {
      const cached = localStorage.getItem(cacheKeyFor(avatarId))
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) {
          conversations.value = parsed.map((item: AvatarConversationVO) =>
            transformConversation(item),
          )
          cacheHydrated.value = true
          currentCachedAvatarId.value = avatarId
          return
        }
      }
    } catch {
      localStorage.removeItem(cacheKeyFor(avatarId))
    }
    // 无缓存或解析失败：清空列表，避免残留其他分身数据
    conversations.value = []
    cacheHydrated.value = false
    currentCachedAvatarId.value = avatarId
  }

  /** 将会话列表持久化到 localStorage */
  function persistCache(avatarId: string) {
    try {
      localStorage.setItem(cacheKeyFor(avatarId), JSON.stringify(conversations.value))
    } catch {
      // 忽略缓存写入失败
    }
  }

  // ==================== 会话列表操作 ====================

  /** 加载会话列表（SWR: 先水合缓存，再后台刷新） */
  async function loadConversations(avatarId: string) {
    if (isLoadingConversations.value) return

    // 切换分身时先水合对应缓存，避免跨分身残留
    if (currentCachedAvatarId.value !== avatarId) {
      hydrateFromCache(avatarId)
    }

    isLoadingConversations.value = true
    try {
      const res = await avatarApi.getAvatarConversations(avatarId)
      if (res.code === 200 && res.data) {
        conversations.value = res.data.map(transformConversation)
        persistCache(avatarId)
      }
    } catch (error) {
      console.error('[avatarChatStore] loadConversations failed, keeping stale data:', error)
      // SWR: 请求失败保留缓存，不清空
    } finally {
      isLoadingConversations.value = false
    }
  }

  /** 删除会话 */
  async function deleteConversation(avatarId: string, conversationId: string) {
    // 乐观删除
    const snapshot = [...conversations.value]
    conversations.value = conversations.value.filter((c) => c.id !== conversationId)
    persistCache(avatarId)

    // 如果删除的是当前活跃会话，清空状态
    if (activeConversationId.value === conversationId) {
      activeConversationId.value = null
      messages.value = []
    }

    try {
      const res = await avatarApi.deleteAvatarConversation(avatarId, conversationId)
      if (res.code !== 200) {
        // 后端失败，回滚
        conversations.value = snapshot
        persistCache(avatarId)
      }
    } catch (error) {
      // 网络失败，回滚
      conversations.value = snapshot
      persistCache(avatarId)
      console.error('[avatarChatStore] deleteConversation failed, rolled back:', error)
      throw error
    }
  }

  // ==================== 消息操作 ====================

  /** 加载历史消息（首页，重置分页状态） */
  async function loadMessages(avatarId: string, conversationId: string) {
    if (isLoadingMessages.value) return
    isLoadingMessages.value = true
    currentPage.value = 0
    hasMoreMessages.value = true

    try {
      const res = await avatarApi.getAvatarMessages(avatarId, conversationId, 0, PAGE_SIZE)
      if (res.code === 200 && res.data) {
        messages.value = res.data.map(transformMessage)
        hasMoreMessages.value = res.data.length >= PAGE_SIZE
      }
    } catch (error) {
      console.error('[avatarChatStore] loadMessages failed:', error)
    } finally {
      isLoadingMessages.value = false
    }
  }

  /** 加载更多历史消息（追加旧消息到头部） */
  async function loadMoreMessages(avatarId: string, conversationId: string) {
    if (isLoadingMore.value || !hasMoreMessages.value) return
    isLoadingMore.value = true

    try {
      const nextPage = currentPage.value + 1
      const res = await avatarApi.getAvatarMessages(avatarId, conversationId, nextPage, PAGE_SIZE)
      // Stale check: 异步返回时如果会话已切换，丢弃结果
      if (activeConversationId.value !== conversationId) return
      if (res.code === 200 && res.data) {
        const older = res.data.map(transformMessage)
        messages.value = [...older, ...messages.value]
        currentPage.value = nextPage
        hasMoreMessages.value = res.data.length >= PAGE_SIZE
      }
    } catch (error) {
      console.error('[avatarChatStore] loadMoreMessages failed:', error)
    } finally {
      isLoadingMore.value = false
    }
  }

  /** 乐观追加用户消息 */
  function appendUserMessage(content: string) {
    const userMessage: AvatarChatMessage = {
      id: nanoid(16),
      role: 'user',
      content,
      model: null,
      createdTime: new Date(),
    }
    messages.value = [...messages.value, userMessage]
  }

  // ==================== SSE 流式管理 ====================

  /** 开始流式接收 */
  function startStreaming() {
    isStreaming.value = true
    streamingContent.value = ''
  }

  /** 追加流式内容 */
  function appendStreamContent(chunk: string) {
    streamingContent.value += chunk
  }

  /** 完成流式接收，将累积内容作为 assistant 消息追加 */
  function finishStreaming() {
    if (streamingContent.value) {
      const assistantMessage: AvatarChatMessage = {
        id: nanoid(16),
        role: 'assistant',
        content: streamingContent.value,
        model: null,
        createdTime: new Date(),
      }
      messages.value = [...messages.value, assistantMessage]
    }
    streamingContent.value = ''
    isStreaming.value = false
  }

  /** 追加错误消息 */
  function appendErrorMessage(errorText: string) {
    const errorMessage: AvatarChatMessage = {
      id: nanoid(16),
      role: 'assistant',
      content: errorText,
      model: null,
      createdTime: new Date(),
      isError: true,
    }
    messages.value = [...messages.value, errorMessage]
    streamingContent.value = ''
    isStreaming.value = false
  }

  /** 设置活跃会话 */
  function setActiveConversationId(id: string | null) {
    activeConversationId.value = id
  }

  /** 移除末尾的错误消息（重试时清理残留） */
  function removeLastErrorMessage() {
    const msgs = messages.value
    if (msgs.length > 0 && msgs[msgs.length - 1].isError) {
      messages.value = msgs.slice(0, -1)
    }
  }

  /** 清空当前会话消息（切换会话时使用） */
  function clearMessages() {
    messages.value = []
    streamingContent.value = ''
    isStreaming.value = false
    currentPage.value = 0
    hasMoreMessages.value = true
    isLoadingMore.value = false
  }

  // ==================== 初始化 ====================
  // 注：水合延迟到 loadConversations(avatarId) 调用时执行，确保按分身隔离

  // ==================== 返回 ====================

  return {
    // 状态（只读）
    conversations: readonly(conversations),
    activeConversationId: readonly(activeConversationId),
    messages: readonly(messages),
    streamingContent: readonly(streamingContent),
    isStreaming: readonly(isStreaming),
    isLoadingConversations: readonly(isLoadingConversations),
    isLoadingMessages: readonly(isLoadingMessages),
    isLoadingMore: readonly(isLoadingMore),
    hasMoreMessages: readonly(hasMoreMessages),
    cacheHydrated: readonly(cacheHydrated),

    // 会话操作
    loadConversations,
    deleteConversation,
    setActiveConversationId,

    // 消息操作
    loadMessages,
    loadMoreMessages,
    appendUserMessage,
    clearMessages,
    removeLastErrorMessage,

    // SSE 流式操作
    startStreaming,
    appendStreamContent,
    finishStreaming,
    appendErrorMessage,
  }
})
