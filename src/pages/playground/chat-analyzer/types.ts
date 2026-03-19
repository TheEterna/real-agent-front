/**
 * Chat Analyzer 模块类型定义
 *
 * 前端 Model 类型，从后端 DTO/VO 转换后的结构。
 */

// ==================== 通用响应 ====================

export type { ResponseResult } from '@/types/http'

// ==================== 联系人 ====================

export interface Contact {
  id: string
  platformId?: string
  name: string
  relationType?: RelationType
  isSelf: boolean
  avatar?: string // base64 data URL 或随机色值
  messageCount: number
  earliestMessageAt?: Date
  latestMessageAt?: Date
  updatedTime?: Date
}

export type RelationType = 'lover' | 'family' | 'friend' | 'colleague' | 'other'

// ==================== 聊天记录 ====================

export interface ChatRecord {
  id: string
  senderName: string
  content: string
  msgType: MessageType
  sentAt?: Date
  emotions: EmotionTag[]
  seqOrder: number
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'emoji' | 'other'

export interface EmotionTag {
  type: 'positive' | 'negative' | 'neutral'
  label: string
  confidence: number
}

// ==================== 分析报告 ====================

export interface AnalysisReport {
  id: string
  contactId: string
  processingLevel: ProcessingLevel
  healthScore: number
  reportData: ReportData
  createdTime: Date
}

export type ProcessingLevel = 'light' | 'medium' | 'heavy'

export interface ReportData {
  emotionTrend: EmotionTrend
  communicationPatterns: CommunicationPatterns
  keyMoments: KeyMoment[]
  healthScore: HealthScore
  summary: string
}

export interface EmotionTrend {
  timeline: EmotionPeriod[]
}

export interface EmotionPeriod {
  period: string
  self: EmotionDistribution
  other: EmotionDistribution
}

export interface EmotionDistribution {
  positive: number
  neutral: number
  negative: number
}

export interface CommunicationPatterns {
  replySpeed: { self: string; other: string }
  initiationRate: { self: number; other: number }
  avgMessageLength: { self: number; other: number }
  topicDepth: string
}

export interface KeyMoment {
  date: string
  type: 'conflict' | 'reconciliation' | 'coldwar' | 'sweet' | 'milestone' | 'other'
  label: string
  description: string
  recordSeqStart: number
  recordSeqEnd: number
}

export interface HealthScore {
  overall: number
  dimensions: {
    trust: number
    respect: number
    intimacy: number
    support: number
  }
}

// ==================== AI 对话 ====================

export interface DialogMessage {
  id: string
  role: DialogRole
  content: string
  createdTime: Date
}

export type DialogRole = 'user' | 'ai_advisor' | 'ai_simulator'
export type DialogMode = 'advisor' | 'simulator'

// ==================== 导入相关 ====================

export type ImportFormat = 'chatlab' | 'csv' | 'txt' | 'paste'
export type ImportStatus = 'idle' | 'uploading' | 'parsing' | 'done' | 'error'
export type AnalysisStatus = 'idle' | 'analyzing' | 'done' | 'error'

export interface ContactPreset {
  name: string
  relationType?: RelationType
  myName?: string
}

// ==================== 导入结果 ====================

export interface ImportResult {
  contactId: string
  contactName: string
  totalMessages: number
  newMessages: number
  duplicateMessages: number
  periodStart?: Date
  periodEnd?: Date
  contacts: Contact[]
}

export interface ImportHistory {
  id: string
  contactId: string
  fileName?: string
  format: ImportFormat
  totalMessages: number
  newMessages: number
  duplicateMessages: number
  periodStart?: Date
  periodEnd?: Date
  createdTime: Date
}

// ==================== SSE 事件 ====================

export interface ChatAnalyzerEvent {
  type: ChatAnalyzerEventType
  content?: string
  contactId?: string
  data?: unknown
  error?: string
}

export type ChatAnalyzerEventType =
  | 'STARTED'
  | 'PARSING'
  | 'ANALYZING'
  | 'REPORT'
  | 'CONTENT'
  | 'EMOTION_TAG'
  | 'DONE'
  | 'ERROR'
