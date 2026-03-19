/**
 * Playground Chat Assistant V3 — 共生 (Symbiosis) 类型定义
 *
 * 对齐后端 ChatAssistant + Memory API 响应结构
 */

// ========== 消息 ==========

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'checkpoint'
  content: string
  timestamp: Date
  emotion?: Emotion
  /** 流式输出中 */
  isStreaming?: boolean
}

export interface Emotion {
  type: EmotionType
  label: string
  intensity: number // 0-1
}

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'calm'
  | 'excited'
  | 'tired'
  | 'neutral'

// ========== 情绪日历 ==========

/** 情绪等级：对应 V3 HTML 的 emo-dot 颜色 */
export type EmotionLevel = 'great' | 'good' | 'ok' | 'low'

/** 单日情绪数据 */
export interface EmotionDay {
  date: string // YYYY-MM-DD
  day: number
  level?: EmotionLevel
  dominantEmotion?: EmotionType
  score?: number // 1-5
}

/** 情绪月度摘要 */
export interface EmotionSummary {
  mainMood: string
  mainMoodEmoji: string
  topEmotion: string
  topEmotionEmoji: string
  streak: number
  streakEmoji: string
  avgScore: number
  avgLabel: string
}

// ========== 记忆 (Memory) ==========

export type MemoryTier = 'EPISODIC' | 'SEMANTIC' | 'CORE'

/** 记忆分类（前端展示用，值由 i18n 动态生成） */
export type MemoryCategory = string

/** 记忆卡片 — 对齐后端 MemoryVO */
export interface MemoryCard {
  id: string
  content: string
  summary: string
  tier: MemoryTier
  category: MemoryCategory
  importanceScore: number
  createdTime: string
  /** 前端展示用：相对时间 */
  when?: string
}

/** 记忆统计 — 对齐后端 MemoryStatsVO */
export interface MemoryStats {
  total: number
  tiers: { tier: MemoryTier; count: number }[]
  /** 相识天数（前端计算） */
  daysSinceFirst?: number
  /** 分类数（前端计算） */
  categoryCount?: number
}

// ========== Soul 灵魂状态 ==========

/** 环境情绪类型 — 对应 V3 HTML 的 mood-* class */
export type MoodType = 'calm' | 'happy' | 'tender' | 'focused'

/** Soul 内心世界状态 */
export interface SoulState {
  /** 当前感受文案 */
  feeling: string
  /** 当前环境情绪 */
  mood: MoodType
  /** 记忆摘要（最多3条） */
  memories: string[]
  /** 关系里程碑 */
  milestone: string
  /** 问候语（后端动态生成，24h 无消息时为久别重逢文案） */
  greeting?: string
}

// ========== 设置 ==========

export type Personality = 'WARM' | 'PROFESSIONAL' | 'HUMOROUS' | 'LEARNED'
export type ResponseStyle = 'CONCISE' | 'DETAILED' | 'CREATIVE'

export interface UserSettings {
  assistantName: string
  userName: string
  personality: Personality
  responseStyle: ResponseStyle
  emotionTracking: boolean
}

// ========== 问候 & 快捷话题 ==========

export interface Greeting {
  text: string
  emoji: string
}

export interface QuickTopic {
  id: string
  label: string
  prompt: string
  icon: string
  /** 卡片副文案 — 用助手的口吻邀请用户，而非干巴巴的功能描述 */
  description?: string
}

// ========== ChatProvider 抽象 ==========

export interface ChatStreamChunk {
  type: 'text' | 'started' | 'thinking' | 'done' | 'error'
  content?: string
  messageId?: string
  sessionId?: string
  error?: string
}

export interface MessagePage {
  messages: Message[]
  hasMore: boolean
}
