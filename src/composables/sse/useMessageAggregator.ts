/**
 * 消息聚合模块
 *
 * 负责:
 * - 消息的创建和聚合（相同 messageId 自动合并）
 * - 用户消息 turnId 更新
 * - 中间状态消息过滤
 *
 * 从原 useSSE.ts 提取，保持逻辑完全一致
 */

import { ref } from 'vue'
import i18n from '@/i18n'
import { useChatStore } from '@/stores/chatStore'
import { EventType, type BaseEventItem, type UIMessage, type TokenUsageData, type BillingData, type WarningData } from '@/types/events'

// 需要过滤的中间状态类型（与后端 AgentStorageService.getSessionMessages 保持一致）
// 这些类型的消息不应该存储到 messagesBySession 中
// 对齐规则参见：CLAUDE.md「SSE 与 DB 同步规范」
// 排除列表必须与后端 AgentStorageService.getSessionMessages() 完全对齐
// 修改任一端时，必须同步修改另一端（参见 CLAUDE.md「SSE 与 DB 同步规范」）
const EXCLUDED_MESSAGE_TYPES = new Set<string>([
  EventType.PROGRESS,
  EventType.STARTED,
  EventType.COMPLETED,
  EventType.EXECUTING,
  EventType.TASK_INIT,
  EventType.TASK_ANALYSIS,
  EventType.BILLING,
  EventType.TOKEN_USAGE
])

export function useMessageAggregator() {
  const chatStore = useChatStore()

  // messageId -> 消息索引，按会话隔离（解决跨会话竞态问题）
  // 结构：Map<sessionId, Map<messageId, index>>
  // 使用 Record 避免复杂的 Map 类型推断问题
  const nodeIndex = ref<Record<string, Record<string, number>>>({})

  /** 获取或创建会话的索引映射 */
  const getOrCreateSessionIndex = (sessionId: string): Record<string, number> => {
    if (!nodeIndex.value[sessionId]) {
      nodeIndex.value[sessionId] = {}
    }
    return nodeIndex.value[sessionId]
  }

  /** 根据事件类型获取发送者（与后端 ChatMessageVO.deriveSender 保持一致） */
  const getSenderByEventType = (event: BaseEventItem): string => {
    if (event.type === EventType.USER) {
      return i18n.global.t('composable.sse.userSender')
    }
    return event.agentId || 'Agent'
  }

  /** 生成 fallback messageId（标准 UUID 格式，确保与后端 UUID.fromString() 兼容）*/
  const generateFallbackMessageId = (): string => {
    return crypto.randomUUID()
  }

  /**
   * 尝试用 parentTurnId 更新之前创建的临时 turnId 用户消息
   * 逻辑：AI 回复的 parentTurnId 就是用户消息的 turnId
   *
   * 重要：必须创建新数组和新对象来触发 Vue 响应式更新
   */
  const tryUpdateUserMessageTurnId = (sessionId: string, parentTurnId: string | undefined): void => {
    if (!parentTurnId) return

    const originalMessages = chatStore.getSessionMessages(sessionId)
    // 查找最后一条需要更新 turnId 的 USER 消息
    // 条件：turnId 为空，或者是临时 turnId（以 temp-turn- 开头）
    for (let i = originalMessages.length - 1; i >= 0; i--) {
      const msg = originalMessages[i]
      const needsUpdate = !msg.turnId || msg.turnId === '' || msg.turnId.startsWith('temp-turn-')
      if (msg.type === EventType.USER && needsUpdate) {
        // 创建新数组和新消息对象以确保 Vue 响应式正常触发
        const newMessages = [...originalMessages]
        newMessages[i] = {
          ...msg,
          turnId: parentTurnId,        // 用 AI 回复的 parentTurnId 作为用户消息的 turnId
          sessionId: sessionId         // 同时更新 sessionId（可能从临时会话迁移过来）
        }
        console.log('[useSSE] 更新用户消息 turnId:', msg.turnId, '->', parentTurnId, 'sessionId:', sessionId)
        chatStore.setSessionMessages(sessionId, newMessages)
        break
      }
    }
  }

  /**
   * 创建 UIMessage 对象
   */
  const createUIMessage = (
    event: BaseEventItem,
    sessionId: string,
    messageId: string,
    overrideType?: EventType
  ): UIMessage => {
    return {
      messageId: messageId,
      sessionId: sessionId,
      turnId: event.turnId,
      parentTurnId: event.parentTurnId,
      type: overrideType || (event.type as EventType),
      sender: getSenderByEventType(event),
      message: (event.message || '').toString(),
      data: event.data,
      startTime: event.startTime || new Date(),
      endTime: event.endTime,
      meta: event.meta,
      events: [event]
    }
  }

  /**
   * 更新消息到消息列表（默认的消息聚合逻辑）
   *
   * 逻辑说明：
   * 1. 过滤中间状态消息（PROGRESS, STARTED 等）
   * 2. TOOL/TOOL_APPROVAL 事件作为独立消息插入
   * 3. 相同 messageId 的消息自动合并
   * 4. 新消息创建并建立 nodeIndex 映射
   */
  const updateMessage = (event: BaseEventItem, currentSessionId: string): void => {
    const eventType = event.type as string

    // ========== 计费事件特殊处理 ==========
    if (eventType === EventType.TOKEN_USAGE) {
      // TOKEN_USAGE 事件不作为消息存储，仅更新 UI 显示
      chatStore.updateTokenUsage(currentSessionId, event.data as TokenUsageData)
      return
    }
    if (eventType === EventType.BILLING) {
      // BILLING 事件不作为消息存储，仅更新 UI 显示
      chatStore.updateBillingInfo(currentSessionId, event.data as BillingData)
      return
    }
    if (eventType === EventType.WARNING) {
      // WARNING 事件：更新警告状态，并作为独立消息显示
      chatStore.updateWarningInfo(currentSessionId, event.data as WarningData, event.message)
      // WARNING 消息作为独立消息插入到消息列表
      const sessionId = event.sessionId || currentSessionId
      const messages = chatStore.getSessionMessages(sessionId)
      const warningMsg: UIMessage = {
        messageId: event.messageId || generateFallbackMessageId(),
        sessionId: sessionId,
        turnId: event.turnId,
        parentTurnId: event.parentTurnId,
        type: EventType.WARNING,
        sender: 'System',
        message: event.message || '',
        data: event.data,
        startTime: event.startTime || new Date(),
        endTime: event.endTime,
        meta: event.meta
      }
      messages.push(warningMsg)
      chatStore.setSessionMessages(sessionId, messages)
      return
    }
    // ========== 计费事件特殊处理 ==========

    // 过滤中间状态消息，不存储到消息列表
    if (EXCLUDED_MESSAGE_TYPES.has(eventType)) {
      return
    }

    // 生成 fallback messageId（防御性编程）
    let messageId = event.messageId
    if (!messageId) {
      messageId = generateFallbackMessageId()
      console.warn('Event missing messageId, generated fallback:', messageId, event)
      event.messageId = messageId // 更新事件对象，确保后续处理有 ID
    }

    const sessionId = event.sessionId || currentSessionId

    // 安全校验：确保 sessionId 有效
    if (!sessionId) {
      console.error('[useSSE] 事件缺少 sessionId 且当前会话为空，丢弃事件:', event.type, event.messageId)
      return
    }

    // 警告 sessionId 不匹配的情况（帮助调试，不阻断流程）
    if (event.sessionId && currentSessionId && event.sessionId !== currentSessionId) {
      console.warn('[useSSE] 事件 sessionId 与当前会话不匹配，使用事件的 sessionId:',
        { eventSessionId: event.sessionId, currentSessionId: currentSessionId })
    }

    const turnId = event.turnId
    const parentTurnId = event.parentTurnId
    const type = event.type as EventType
    const message = (event.message || '').toString()
    const data = event.data
    const startTime = event.startTime || new Date()
    const endTime = event.endTime

    // 尝试用 parentTurnId 更新之前创建的空 turnId 用户消息
    if (parentTurnId) {
      tryUpdateUserMessageTurnId(sessionId, parentTurnId)
    }

    // 从 store 中获取当前会话的消息
    const messages = chatStore.getSessionMessages(sessionId)
    const index = getOrCreateSessionIndex(sessionId)[messageId]

    if (type === EventType.TOOL || type === EventType.WEB_SEARCH) {
      // 使用原始 messageId，保证与后端 DB 存储一致（SSE/DB 同步规范）
      // 后端已确保每条 TOOL/WEB_SEARCH 事件独立成窗，messageId 唯一
      const toolMsg: UIMessage = {
        messageId: messageId,
        sessionId: sessionId,
        turnId: turnId,
        parentTurnId: parentTurnId,
        type: type,
        sender: getSenderByEventType(event),
        message: message,
        data: data,
        startTime: startTime,
        endTime: endTime,
        // WEB_SEARCH 不对前端透出 meta（尤其是 arguments/toolSchema 等输入信息）
        meta: type === EventType.WEB_SEARCH ? undefined : event.meta
      }
      messages.push(toolMsg)
      chatStore.setSessionMessages(sessionId, messages)
    }
    else if (type === EventType.UI) {
      // UI 事件不聚合，每个独立落库（与 TOOL 事件一致）
      // 参见 UI_EVENT_PROTOCOL.md 第 9.1 节
      const uiMsg: UIMessage = {
        messageId: messageId,
        sessionId: sessionId,
        turnId: turnId,
        parentTurnId: parentTurnId,
        type: type,
        sender: getSenderByEventType(event),
        message: message,
        data: data,
        startTime: startTime,
        endTime: endTime,
        meta: event.meta
      }
      messages.push(uiMsg)
      chatStore.setSessionMessages(sessionId, messages)
    }
    else if (type === EventType.TOOL_APPROVAL || type === EventType.INTERACTION) {
      // TOOL_APPROVAL / INTERACTION 事件作为独立消息插入（不聚合）
      // 使用原始 messageId，保证与后端 DB 存储一致
      const interactionMsg: UIMessage = {
        messageId: messageId,
        sessionId: sessionId,
        turnId: turnId,
        parentTurnId: parentTurnId,
        type: type,
        sender: getSenderByEventType(event),
        message: message,
        data: data,
        startTime: startTime,
        endTime: endTime,
        meta: event.meta
      }
      messages.push(interactionMsg)
      chatStore.setSessionMessages(sessionId, messages)
    } else if (index !== undefined && index < messages.length && messages[index].messageId === messageId) {
      // messageId已存在且索引有效，更新现有消息
      const node = messages[index]

      // 非工具事件：累积到message字段
      node.message = node.message ? `${node.message}${message}` : message
      node.events?.push?.(event)

	  // 仅当事件明确给出 endTime 时，才将消息标记为结束
	  if (event.endTime) {
		node.endTime = event.endTime
	  }
      chatStore.setSessionMessages(sessionId, messages)

    } else {
      // 非工具事件作为主消息创建并建立nodeIndex
      const firstNodeMessage: UIMessage = {
        messageId: messageId,
        sessionId: sessionId,
        turnId: turnId,
        parentTurnId: parentTurnId,
        type: type,
        sender: getSenderByEventType(event),
        message: message,
        data: data,
        startTime: startTime,
        endTime: endTime,
        meta: event.meta
      }
      messages.push(firstNodeMessage)
      // 立即建立nodeIndex映射（按会话隔离）
      getOrCreateSessionIndex(sessionId)[messageId] = messages.length - 1
      chatStore.setSessionMessages(sessionId, messages)
    }
  }

  /**
   * 更新思维链消息（扩展事件）
   *
   * 与 updateMessage 的区别：
   * - 使用 THOUGHT 类型
   * - 初始化 events 数组
   */
  const updateThoughtMessage = (event: BaseEventItem, currentSessionId: string): void => {
    const messageId = event.messageId
    if (!messageId) {
      console.warn('THOUGHT event missing messageId, falling back to default handling', event)
      updateMessage(event, currentSessionId)
      return
    }

    const sessionId = event.sessionId || currentSessionId
    const messages = chatStore.getSessionMessages(sessionId)
    const index = getOrCreateSessionIndex(sessionId)[messageId]
    const message = (event.message || '').toString()

    if (index !== undefined && index < messages.length && messages[index].messageId === messageId) {
      // messageId已存在，累积思维链内容到现有消息
      const node = messages[index]
      node.message = node.message ? `${node.message}${message}` : message
      if (!node.events) {
        node.events = []
      }
      node.events.push(event)
      // 更新 endTime 如果事件已结束
      if (event.endTime) {
        node.endTime = event.endTime
      }
      chatStore.setSessionMessages(sessionId, messages)
    } else {
      // 创建新的思维链节点
      const thoughtMessage: UIMessage = {
        messageId: messageId,
        sessionId: sessionId,
        turnId: event.turnId,
        parentTurnId: event.parentTurnId,
        type: EventType.THOUGHT,
        sender: getSenderByEventType(event),
        message: message,
        data: event.data,
        startTime: event.startTime || new Date(),
        endTime: event.endTime,
        events: [event],
        meta: event.meta
      }
      messages.push(thoughtMessage)
      getOrCreateSessionIndex(sessionId)[messageId] = messages.length - 1
      chatStore.setSessionMessages(sessionId, messages)
    }
  }

  /**
   * 更新任务分析消息（扩展事件）
   *
   * 与 updateMessage 的区别：
   * - 使用 TASK_ANALYSIS 类型
   * - 初始化 events 数组
   */
  const updateTaskAnalysisMessage = (event: BaseEventItem, currentSessionId: string): void => {
    const messageId = event.messageId
    if (!messageId) {
      console.warn('TASK_ANALYSIS event missing messageId, falling back to default handling', event)
      updateMessage(event, currentSessionId)
      return
    }

    const sessionId = event.sessionId || currentSessionId
    const messages = chatStore.getSessionMessages(sessionId)
    const index = getOrCreateSessionIndex(sessionId)[messageId]
    const message = (event.message || '').toString()

    if (index !== undefined && index < messages.length && messages[index].messageId === messageId) {
      // messageId已存在，累积任务分析内容到现有消息
      const node = messages[index]
      node.message = node.message ? `${node.message}${message}` : message
      if (!node.events) {
        node.events = []
      }
      node.events.push(event)
      // 更新 endTime 如果事件已结束
      if (event.endTime) {
        node.endTime = event.endTime
      }
      chatStore.setSessionMessages(sessionId, messages)
    } else {
      // 创建新的任务分析消息节点
      const analysisMessage: UIMessage = {
        messageId: messageId,
        sessionId: sessionId,
        turnId: event.turnId,
        parentTurnId: event.parentTurnId,
        type: EventType.TASK_ANALYSIS,
        sender: getSenderByEventType(event),
        message: message,
        data: event.data,
        startTime: event.startTime || new Date(),
        endTime: event.endTime,
        events: [event],
        meta: event.meta
      }
      messages.push(analysisMessage)
      getOrCreateSessionIndex(sessionId)[messageId] = messages.length - 1
      chatStore.setSessionMessages(sessionId, messages)
    }
  }

  /**
   * 更新模型推理消息（reasoning_content）
   *
   * 与 updateThoughtMessage 的区别：
   * - 使用 REASONING 类型
   * - 用于模型级别的推理内容（DeepSeek-R1, o1/o3 等推理模型）
   * - 与 Agent 级别的 THINKING 事件不同
   */
  const updateReasoningMessage = (event: BaseEventItem, currentSessionId: string): void => {
    const messageId = event.messageId
    if (!messageId) {
      console.warn('REASONING event missing messageId, falling back to default handling', event)
      updateMessage(event, currentSessionId)
      return
    }

    const sessionId = event.sessionId || currentSessionId
    const messages = chatStore.getSessionMessages(sessionId)
    const index = getOrCreateSessionIndex(sessionId)[messageId]
    const message = (event.message || '').toString()

    if (index !== undefined && index < messages.length && messages[index].messageId === messageId) {
      // messageId已存在，累积推理内容到现有消息
      const node = messages[index]
      node.message = node.message ? `${node.message}${message}` : message
      if (!node.events) {
        node.events = []
      }
      node.events.push(event)
      // 更新 endTime 如果事件已结束
      if (event.endTime) {
        node.endTime = event.endTime
      }
      chatStore.setSessionMessages(sessionId, messages)
    } else {
      // 创建新的推理消息节点
      const reasoningMessage: UIMessage = {
        messageId: messageId,
        sessionId: sessionId,
        turnId: event.turnId,
        parentTurnId: event.parentTurnId,
        type: EventType.REASONING,
        sender: getSenderByEventType(event),
        message: message,
        data: event.data,
        startTime: event.startTime || new Date(),
        endTime: event.endTime,
        events: [event],
        meta: event.meta
      }
      messages.push(reasoningMessage)
      getOrCreateSessionIndex(sessionId)[messageId] = messages.length - 1
      chatStore.setSessionMessages(sessionId, messages)
    }
  }

  /** 重置 nodeIndex（开始新任务时调用）- 按会话隔离，只清除指定会话的索引*/
  const resetNodeIndex = (sessionId?: string) => {
    if (sessionId) {
      // 清除指定会话的索引
      if (nodeIndex.value[sessionId]) {
        delete nodeIndex.value[sessionId]
      }
    } else {
      // 清除所有会话的索引（向后兼容）
      nodeIndex.value = {}
    }
  }

  return {
    nodeIndex,
    updateMessage,
    updateThoughtMessage,
    updateTaskAnalysisMessage,
    updateReasoningMessage,
    tryUpdateUserMessageTurnId,
    resetNodeIndex
  }
}
