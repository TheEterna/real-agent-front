/**
 * Chat Assistant API 适配层
 *
 * 封装 @/api/chat-assistant 和 @/api/memory，
 * 将后端 DTO 转换为前端 Model，供 composables 消费。
 */
import i18n from '@/i18n'
import { chatAssistantApi } from '@/api/chat-assistant'
import type { MessageVO, ChatAssistantEvent, EmotionCalendarVO, SoulStateVO } from '@/api/chat-assistant'
import { memoryPanelApi } from '@/api/memory'

const { t } = i18n.global
import type {
  Message,
  ChatStreamChunk,
  MessagePage,
  MemoryCard,
  MemoryStats,
  MemoryCategory,
  UserSettings,
  Personality,
  ResponseStyle,
  EmotionDay,
  EmotionSummary,
  EmotionLevel,
  SoulState,
  MoodType,
} from '../types'

// ========== DTO → Model 转换 ==========

/** 后端 MessageVO → 前端 Message */
function transformMessage(vo: MessageVO): Message {
  return {
    id: vo.id,
    role: vo.role as 'user' | 'assistant' | 'checkpoint',
    content: vo.content,
    timestamp: new Date(vo.createdTime),
    emotion: vo.emotionType
      ? {
          type: vo.emotionType as Message['emotion'] extends infer E
            ? E extends { type: infer T } ? T : never
            : never,
          label: vo.emotionLabel || '',
          intensity: vo.emotionIntensity || 0,
        }
      : undefined,
  }
}

/** 根据记忆内容推断分类 */
function inferCategory(content: string, tier: string): MemoryCategory {
  const lower = content.toLowerCase()
  if (/喜欢|偏好|不加糖|咖啡|口味/.test(lower)) return t('playgroundChat.api.categories.preference') as MemoryCategory
  if (/开发|框架|项目|工作|产品/.test(lower)) return t('playgroundChat.api.categories.work') as MemoryCategory
  if (/习惯|深夜|早起|每天/.test(lower)) return t('playgroundChat.api.categories.habit') as MemoryCategory
  if (/兴奋|兴趣|热情|喜爱/.test(lower)) return t('playgroundChat.api.categories.interest') as MemoryCategory
  if (/技术|代码|架构|数据库|向量/.test(lower)) return t('playgroundChat.api.categories.tech') as MemoryCategory
  if (/感觉|心情|成就感|开心|难过/.test(lower)) return t('playgroundChat.api.categories.emotion') as MemoryCategory
  if (tier === 'CORE' || tier === 'SEMANTIC') return t('playgroundChat.api.categories.work') as MemoryCategory
  return t('playgroundChat.api.categories.interest') as MemoryCategory
}

/** 时间差转相对时间 */
function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return t('playgroundChat.api.relativeTime.justNow')
  if (minutes < 60) return t('playgroundChat.api.relativeTime.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('playgroundChat.api.relativeTime.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('playgroundChat.api.relativeTime.daysAgo', { n: days })
  const weeks = Math.floor(days / 7)
  return t('playgroundChat.api.relativeTime.weeksAgo', { n: weeks })
}

// ========== Chat API ==========

export const chatApi = {
  /**
   * 发送消息 — 将后端 SSE 事件流转换为前端 ChatStreamChunk
   */
  async *sendMessage(
    message: string,
    options?: {
      emotion?: string
      personality?: Personality
      responseStyle?: ResponseStyle
    },
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamChunk> {
    const stream = chatAssistantApi.sendMessageStream({
      message,
      emotion: options?.emotion,
      personality: options?.personality,
      responseStyle: options?.responseStyle,
    }, signal)

    for await (const event of stream) {
      const chunk = transformEvent(event)
      if (chunk) yield chunk
    }
  },

  /**
   * 获取历史消息（游标分页）
   */
  async getMessages(limit = 20, beforeId?: string): Promise<MessagePage> {
    const page = await chatAssistantApi.getMessages(limit, beforeId)
    if (!page || !page.messages) {
      return { messages: [], hasMore: false }
    }
    return {
      messages: page.messages.map(transformMessage),
      hasMore: page.hasMore,
    }
  },

  /**
   * 清除对话
   */
  async clearChat(): Promise<void> {
    await chatAssistantApi.clearChat()
  },

  /**
   * 更新设置
   */
  async updateSettings(settings: UserSettings): Promise<void> {
    await chatAssistantApi.updateSettings({
      assistantName: settings.assistantName,
      userName: settings.userName,
      personality: settings.personality,
      responseStyle: settings.responseStyle,
    })
  },
}

// ========== Memory API ==========

export const memoryApi = {
  /**
   * 获取记忆列表
   */
  async list(tier?: string, limit = 50): Promise<MemoryCard[]> {
    const items = await memoryPanelApi.list(tier, limit)
    return (items || []).map((item: any) => ({
      id: item.id,
      content: item.content || '',
      summary: item.summary || '',
      tier: item.tier || 'EPISODIC',
      category: inferCategory(item.content || '', item.tier || ''),
      importanceScore: item.importanceScore || 0,
      createdTime: item.createdTime || new Date().toISOString(),
      when: relativeTime(item.createdTime || new Date().toISOString()),
    }))
  },

  /**
   * 获取记忆统计
   */
  async stats(): Promise<MemoryStats> {
    const raw = await memoryPanelApi.stats()
    return {
      total: (raw as any).total || 0,
      tiers: (raw as any).tiers || [],
      categoryCount: new Set(
        ((raw as any).tiers || []).map((t: any) => t.tier),
      ).size,
    }
  },

  /**
   * 搜索记忆
   */
  async search(query: string, limit = 20): Promise<MemoryCard[]> {
    const items = await memoryPanelApi.search(query, limit)
    return (items || []).map((item: any) => ({
      id: item.id,
      content: item.content || '',
      summary: item.summary || '',
      tier: item.tier || 'EPISODIC',
      category: inferCategory(item.content || '', item.tier || ''),
      importanceScore: item.importanceScore || 0,
      createdTime: item.createdTime || new Date().toISOString(),
      when: relativeTime(item.createdTime || new Date().toISOString()),
    }))
  },

  async update(memoryId: string, content: string, summary?: string): Promise<MemoryCard> {
    const item = await memoryPanelApi.update(memoryId, content, summary)
    return {
      id: item.id,
      content: item.content || '',
      summary: item.summary || '',
      tier: item.tier || 'EPISODIC',
      category: inferCategory(item.content || '', item.tier || ''),
      importanceScore: item.importanceScore || 0,
      createdTime: item.createdTime || new Date().toISOString(),
      when: relativeTime(item.createdTime || new Date().toISOString()),
    }
  },

  async remove(memoryId: string): Promise<void> {
    await memoryPanelApi.remove(memoryId)
  },
}

// ========== Emotion Calendar API ==========

export const emotionCalendarApi = {
  /**
   * 获取情绪日历（按月聚合）
   */
  async getCalendar(year: number, month: number): Promise<{ days: EmotionDay[]; summary: EmotionSummary }> {
    const vo: EmotionCalendarVO = await chatAssistantApi.getEmotionCalendar(year, month)
    if (!vo) {
      return {
        days: [],
        summary: {
          mainMood: t('playgroundChat.api.defaultSummaryMood'), mainMoodEmoji: '😌',
          topEmotion: '—', topEmotionEmoji: '—',
          streak: 0, streakEmoji: '🔥',
          avgScore: 0, avgLabel: '—',
        },
      }
    }
    return {
      days: (vo.days || []).map(transformEmotionDay),
      summary: transformEmotionSummary(vo.summary),
    }
  },
}

// ========== Soul API ==========

export const soulApi = {
  /**
   * 获取 Soul 内心世界状态
   */
  async getState(): Promise<SoulState & { daysSinceFirst: number; totalMessages: number }> {
    const vo: SoulStateVO = await chatAssistantApi.getSoulState()
    if (!vo) {
      return {
        feeling: t('playgroundChat.api.defaultFeeling'),
        mood: 'calm' as MoodType,
        memories: [],
        milestone: t('playgroundChat.api.defaultMilestone'),
        greeting: undefined,
        daysSinceFirst: 0,
        totalMessages: 0,
      }
    }
    return {
      feeling: vo.feeling || t('playgroundChat.api.defaultFeeling'),
      mood: (vo.mood || 'calm') as MoodType,
      memories: vo.memories || [],
      milestone: vo.milestone || t('playgroundChat.api.defaultMilestone'),
      greeting: vo.greeting || undefined,
      daysSinceFirst: vo.daysSinceFirst || 0,
      totalMessages: vo.totalMessages || 0,
    }
  },

  /**
   * 流式获取 AI 动态问候语
   */
  async *streamGreeting(signal?: AbortSignal): AsyncGenerator<ChatStreamChunk> {
    const stream = chatAssistantApi.streamGreeting(signal)
    for await (const event of stream) {
      const chunk = transformEvent(event)
      if (chunk) yield chunk
    }
  },
}

// ========== 内部工具 ==========

/** 后端 EmotionDayVO → 前端 EmotionDay */
function transformEmotionDay(vo: EmotionCalendarVO['days'][number]): EmotionDay {
  return {
    date: vo.date,
    day: vo.day,
    level: (vo.level as EmotionLevel) || undefined,
    dominantEmotion: vo.dominantEmotion as EmotionDay['dominantEmotion'],
    score: vo.score,
  }
}

/** 后端 EmotionSummaryVO → 前端 EmotionSummary */
function transformEmotionSummary(vo: EmotionCalendarVO['summary'] | undefined): EmotionSummary {
  if (!vo) {
    return {
      mainMood: t('playgroundChat.api.defaultSummaryMood'), mainMoodEmoji: '😌',
      topEmotion: '—', topEmotionEmoji: '—',
      streak: 0, streakEmoji: '🔥',
      avgScore: 0, avgLabel: '—',
    }
  }
  return {
    mainMood: vo.mainMood,
    mainMoodEmoji: vo.mainMoodEmoji,
    topEmotion: vo.topEmotion,
    topEmotionEmoji: vo.topEmotionEmoji,
    streak: vo.streak,
    streakEmoji: vo.streakEmoji || '🔥',
    avgScore: vo.avgScore,
    avgLabel: vo.avgLabel,
  }
}

/** 后端 ChatAssistantEvent → 前端 ChatStreamChunk */
function transformEvent(event: ChatAssistantEvent): ChatStreamChunk | null {
  switch (event.type) {
    case 'STARTED':
      return {
        type: 'started',
        messageId: event.messageId,
        sessionId: event.sessionId,
      }
    case 'TEXT_DELTA':
    case 'CONTENT':
      return { type: 'text', content: event.content }
    case 'THINKING':
      return { type: 'thinking', content: event.thought }
    case 'DONE':
      return { type: 'done', messageId: event.messageId }
    case 'ERROR':
      return { type: 'error', error: event.error }
    default:
      // TEXT_START, ACTION, OBSERVING, COMPLETED 等暂不处理
      return null
  }
}
