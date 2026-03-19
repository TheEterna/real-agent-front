/**
 * 毕业论文写作模块类型定义
 * Thesis Writer Module Type Definitions
 */

/** 论文写作阶段 */
export type ThesisStage =
  | 'topic_selection'    // 选题阶段
  | 'outline_design'     // 大纲设计
  | 'literature_review'  // 文献综述
  | 'content_writing'    // 内容撰写
  | 'revision'           // 修订润色
  | 'format_check'       // 格式检查

/** 章节状态 */
export type ChapterStatus =
  | 'pending'      // 待撰写
  | 'in_progress'  // 撰写中
  | 'draft'        // 初稿完成
  | 'revised'      // 已修订
  | 'completed'    // 已完成

/** 论文项目 */
export interface ThesisProject {
  id: string
  title: string
  subtitle?: string
  abstract?: string
  keywords?: string[]
  stage: ThesisStage
  degree: 'bachelor' | 'master' | 'doctor'
  major?: string
  supervisor?: string
  wordCount: number
  targetWordCount?: number
  progress: number
  createdTime: string
  updatedTime: string
}

/** 大纲节点 */
export interface OutlineNode {
  id: string
  projectId: string
  parentId?: string
  level: number          // 1=章, 2=节, 3=小节
  sortOrder: number
  title: string
  description?: string
  targetWordCount?: number
  actualWordCount: number
  status: ChapterStatus
  children?: OutlineNode[]
}

/** 章节内容 */
export interface ChapterContent {
  id: string
  nodeId: string
  content: string
  wordCount: number
  version: number
  createdTime: string
  updatedTime: string
  isCurrent?: boolean
}

/** AI 写作请求（与后端 ThesisWriteRequest 对齐） */
export interface ThesisWriteRequest {
  projectId: string
  nodeId?: string
  action: 'generate_outline' | 'write_chapter' | 'expand_content' | 'polish' | 'cite_suggestion' | 'format_check'
  prompt?: string
  datasetIds?: string[]
}

/** AI 写作响应（流式事件） */
export interface ThesisStreamEvent {
  type: 'STARTED' | 'CONTENT' | 'DONE' | 'ERROR' | 'NODE_COMPLETE'
  content?: string
  nodeId?: string
  metadata?: Record<string, unknown>
}

/** 文献引用 */
export interface Citation {
  id: string
  type: 'journal' | 'book' | 'conference' | 'thesis' | 'website' | 'other'
  title: string
  authors: string[]
  year: number
  source?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  url?: string
  accessDate?: string
  formattedText?: string
}

/** 格式检查结果（单个 issue） */
export interface FormatCheckResult {
  category: 'structure' | 'citation' | 'figure' | 'table' | 'typography' | 'language'
  severity: 'error' | 'warning' | 'info'
  message: string
  location?: {
    nodeId?: string
    line?: number
    column?: number
  }
  suggestion?: string
}

/** 格式检查结果 VO（对应后端 FormatCheckResultVO） */
export interface FormatCheckResultVO {
  totalIssues: number
  issues: FormatCheckResult[]
}

/** 写作历史记录 */
export interface WritingHistory {
  id: string
  projectId: string
  nodeId?: string
  action: string
  prompt?: string
  response?: string
  createdTime: string
}

/** 论文模板 */
export interface ThesisTemplate {
  id: string
  name: string
  description: string
  degree: 'bachelor' | 'master' | 'doctor'
  structure: OutlineNode[]
  referenceStyle: string
  formatRules?: Record<string, unknown>
}

/** 创建论文项目请求 */
export interface CreateThesisRequest {
  title: string
  degree: 'bachelor' | 'master' | 'doctor'
  major?: string
  supervisor?: string
  templateId?: string
  targetWordCount?: number
}

/** 更新论文项目请求 */
export interface UpdateThesisRequest {
  title?: string
  subtitle?: string
  abstractText?: string
  keywords?: string[]
  stage?: ThesisStage
  degree?: 'bachelor' | 'master' | 'doctor'
  major?: string
  supervisor?: string
  targetWordCount?: number
}

/** 大纲操作请求（与后端 OutlineOperateRequest 对齐） */
export interface OutlineOperationRequest {
  projectId: string
  action: 'add' | 'update' | 'delete' | 'move' | 'clear_all'
  nodeId?: string
  parentId?: string
  title?: string
  description?: string
  level?: number
  sortOrder?: number
  targetWordCount?: number
}

// ==================== 以下为 Mock→Real 迁移新增类型 ====================

/** 选题推荐（后端 TopicSuggestionVO 对应） */
export interface TopicSuggestion {
  title: string
  description: string
  keywords: string[]
  difficultyLevel: 'easy' | 'medium' | 'hard'
  innovationPoint: string
}

/** 选题推荐请求 */
export interface TopicRecommendRequest {
  major: string
  degree: string
  interests: string[]
}

/** 引导写作请求 */
export interface GuidedWritingRequest {
  projectId: string
  nodeId?: string
  chapterType: string
  answers: Record<string, string>
  /** 用户备注（如"生成整个第三章"、"重点写理论部分"） */
  note?: string
  /** 批量生成的节点 ID 列表 */
  batchNodeIds?: string[]
}

/** 论文健康度指标（前端基于大纲数据计算） */
export interface HealthMetrics {
  overallScore: number
  wordProgress: {
    current: number
    target: number
    percentage: number
  }
  chapterProgress: {
    completed: number
    total: number
    percentage: number
  }
  citationCount: number
  formatIssues: number
  lastUpdated: Date
}

/** Inline AI 写作请求（选区操作） */
export interface InlineWriteRequest {
  projectId: string
  nodeId: string
  action: 'polish' | 'expand' | 'condense' | 'academize' | 'cite' | 'custom' | 'continue'
  selectedText: string
  cursorContext: string
  customPrompt?: string
  datasetIds?: string[]
}

/** Inline AI 操作类型 */
export type InlineAction = InlineWriteRequest['action']

/** 引导问题项（AI 动态生成） */
export interface GuidedQuestionItem {
  id: string
  type: 'single_choice' | 'text'
  question: string
  options?: string[]
}

/** 引导问题生成响应 */
export interface GuidedQuestionsResponse {
  chapterTitle: string
  chapterDescription: string
  questions: GuidedQuestionItem[]
}

/** 引导问题生成请求 */
export interface GuidedQuestionsRequest {
  projectId: string
  nodeId: string
}

/** 批量生成节点审阅决策 */
export type BatchNodeDecision = 'pending' | 'accepted' | 'rejected'

/** 批量生成节点状态 */
export interface BatchNodeStatus {
  nodeId: string
  title: string
  status: 'pending' | 'generating' | 'generated' | 'saving' | 'completed' | 'error'
  wordCount: number
  /** 节点已有的字数（生成前） */
  existingWordCount: number
  /** 审阅决策 */
  decision: BatchNodeDecision
  error?: string
}
