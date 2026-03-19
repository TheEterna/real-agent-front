/**
 * Chat Assistant API 封装（单会话模型）
 *
 * @author Han
 * @since 2026-02-13
 */

import http from '@/services/http'
import i18n from '@/i18n'
import { useAuthStore } from '@/stores/authStore'

/** fetch 直连路径（不经过 axios，需要完整前缀） */
const STREAM_URL = '/api/playground/chat-assistant/stream'
/** axios 路径（axios baseURL 已含 /api，这里不能重复） */
const BASE_URL = '/playground/chat-assistant'

// ========== 类型定义 ==========

export interface ChatAssistantEvent {
  type:
    | 'STARTED'
    | 'TEXT_START'
    | 'TEXT_DELTA'
    | 'THINKING'
    | 'ACTION'
    | 'OBSERVING'
    | 'CONTENT'
    | 'DONE'
    | 'COMPLETED'
    | 'ERROR'
  eventId?: string
  content?: string
  thought?: string
  toolCall?: ToolCall
  toolResult?: ToolResult
  sessionId?: string
  messageId?: string
  partId?: string
  tokenUsage?: TokenUsage
  error?: string
}

interface ToolCall {
  toolId: string
  toolName: string
  arguments: string
  callId: string
  messageId: string
}

interface ToolResult {
  toolName: string
  result: string
  success: boolean
  callId: string
  messageId: string
}

interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface SendMessageRequest {
  message: string
  messageType?: 'TEXT' | 'IMAGE' | 'VOICE'
  emotion?: string
  emotionIntensity?: number
  personality?: 'WARM' | 'PROFESSIONAL' | 'HUMOROUS' | 'LEARNED'
  responseStyle?: 'CONCISE' | 'DETAILED' | 'CREATIVE'
}

export interface MessageVO {
  id: string
  role: string
  content: string
  emotionType?: string
  emotionLabel?: string
  emotionIntensity?: number
  createdTime: string
}

export interface MessagePageVO {
  messages: MessageVO[]
  hasMore: boolean
}

export interface SettingsRequest {
  assistantName?: string
  assistantAvatar?: string
  userName?: string
  userAvatar?: string
  personality?: string
  responseStyle?: string
}

// ========== 情绪日历 & Soul 类型 ==========

export interface EmotionDayVO {
  date: string
  day: number
  dominantEmotion?: string
  dominantEmotionLabel?: string
  avgIntensity?: number
  messageCount?: number
  level?: string
  score?: number
}

export interface EmotionSummaryVO {
  mainMood: string
  mainMoodEmoji: string
  topEmotion: string
  topEmotionEmoji: string
  streak: number
  streakEmoji: string
  avgScore: number
  avgLabel: string
}

export interface EmotionCalendarVO {
  year: number
  month: number
  days: EmotionDayVO[]
  summary: EmotionSummaryVO
}

export interface SoulStateVO {
  feeling: string
  mood: string
  memories: string[]
  milestone: string
  daysSinceFirst: number
  totalMessages: number
  greeting?: string
}

// ========== API ==========

export const chatAssistantApi = {
  /**
   * 发送消息并返回 SSE 事件流（使用 fetch + ReadableStream）
   */
  sendMessageStream: async function* (
    request: SendMessageRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatAssistantEvent> {
    const authStore = useAuthStore()
    const token = authStore.accessToken
    const response = await fetch(STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error(i18n.global.t('api.chatAssistant.streamUnavailable'))
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const event = JSON.parse(line.slice(5))
            yield event
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    // 处理 buffer 中残留的数据（流结束时可能未以换行符结尾）
    if (buffer.trim().startsWith('data:')) {
      try {
        const event = JSON.parse(buffer.trim().slice(5))
        yield event
      } catch {
        // 忽略解析错误
      }
    }
  },

  /**
   * 获取历史消息（游标分页，支持上滑加载更多）
   */
  getMessages: async (limit = 20, beforeId?: string): Promise<MessagePageVO> => {
    const params: Record<string, string | number> = { limit }
    if (beforeId) {
      params.beforeId = beforeId
    }
    const res = await http.get(`${BASE_URL}/messages`, { params })
    // http 拦截器返回 response.data，即 { code, message, data, timestamp }
    // 所以 res.data 就是我们需要的 { messages, hasMore }
    return res.data
  },

  /**
   * 清除对话（创建 checkpoint 截断当前上下文）
   */
  clearChat: async (): Promise<void> => {
    await http.post(`${BASE_URL}/clear`)
  },

  /**
   * 获取设置（不自动创建会话，无会话时返回 null）
   */
  getSettings: async (): Promise<SettingsRequest | null> => {
    const res = await http.get(`${BASE_URL}/settings`)
    return res.data ?? null
  },

  /**
   * 更新设置
   */
  updateSettings: async (settings: SettingsRequest): Promise<void> => {
    await http.put(`${BASE_URL}/settings`, settings)
  },

  /**
   * 获取情绪日历（按月聚合）
   */
  getEmotionCalendar: async (year: number, month: number): Promise<EmotionCalendarVO> => {
    const res = await http.get(`${BASE_URL}/emotion-calendar`, { params: { year, month } })
    return res.data
  },

  /**
   * 获取 Soul 内心世界状态
   */
  getSoulState: async (): Promise<SoulStateVO> => {
    const res = await http.get(`${BASE_URL}/soul`)
    return res.data
  },

  /**
   * 流式获取 AI 动态问候语（空状态时调用）
   * 首次：LLM 流式生成；再次：缓存直返。
   */
  streamGreeting: async function* (
    signal?: AbortSignal,
  ): AsyncGenerator<ChatAssistantEvent> {
    const authStore = useAuthStore()
    const token = authStore.accessToken
    const response = await fetch('/api/playground/chat-assistant/greeting', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error(i18n.global.t('api.chatAssistant.streamUnavailable'))
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const event = JSON.parse(line.slice(5))
            yield event
          } catch { /* ignore */ }
        }
      }
    }

    if (buffer.trim().startsWith('data:')) {
      try {
        const event = JSON.parse(buffer.trim().slice(5))
        yield event
      } catch { /* ignore */ }
    }
  },
}

export default chatAssistantApi
