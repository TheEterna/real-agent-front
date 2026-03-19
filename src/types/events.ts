// Strong types for SSE events and UI messages


export enum EventType {
  STARTED = 'STARTED',
  PROGRESS = 'PROGRESS',
  AGENT_SELECTED = 'AGENT_SELECTED',
  THINKING = 'THINKING',
  ACTION = 'ACTION',
  ACTING = 'ACTING',
  OBSERVING = 'OBSERVING',
  DONE = 'DONE',
  EXECUTING = 'EXECUTING',
  ERROR = 'ERROR',
  DONEWITHWARNING = 'DONEWITHWARNING',
  INTERACTION = 'INTERACTION',
  COMPLETED = 'COMPLETED',

  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  TOOL = 'TOOL',
  TOOL_APPROVAL = 'TOOL_APPROVAL',

  // 内部事件类型
  TASK_INIT = 'TASK_INIT',          // 任务初始化（内部事件，不展示）

  // 扩展事件类型
  TASK_ANALYSIS = 'TASK_ANALYSIS',  // 任务分析阶段
  THOUGHT = 'THOUGHT',              // 思维链生成
  INIT_PLAN = 'INIT_PLAN',          // 初始化计划
  UPDATE_PLAN = 'UPDATE_PLAN',      // 更新计划
  ADVANCE_PLAN = 'ADVANCE_PLAN',    // 推进计划
  PLAN_WRITE = 'PLAN_WRITE',        // 统一的计划写入事件（用于 PlanWriteTool）
  WEB_SEARCH = 'WEB_SEARCH',        // 联网搜索事件
  KNOWLEDGE_RETRIEVAL = 'KNOWLEDGE_RETRIEVAL',  // 知识库检索事件

  // ========== 模型推理事件 ==========
  REASONING = 'REASONING',          // 模型推理内容（reasoning_content，DeepSeek-R1/o1/o3 等）

  // ========== 计费相关事件 ==========
  TOKEN_USAGE = 'TOKEN_USAGE',      // Token 使用统计（实时显示）
  BILLING = 'BILLING',              // 计费结果（扣费完成）
  WARNING = 'WARNING',              // 警告事件（余额不足、透支警告等）

  // ========== UI 事件 ==========
  UI = 'UI',                        // 结构化 UI 组件渲染事件（参见 UI_EVENT_PROTOCOL.md）

}

/**
 * SSE 事件 data 字段的联合类型
 *
 * 各事件类型对应的 data 结构：
 * - TOKEN_USAGE → TokenUsageData
 * - BILLING → BillingData
 * - WARNING → WarningData
 * - INIT_PLAN → InitPlanEventData
 * - UPDATE_PLAN → UpdatePlanEventData
 * - ADVANCE_PLAN → AdvancePlanEventData
 * - PLAN_WRITE → PlanWriteEventData
 * - TOOL → ToolResponseData
 * - 其他 → Record<string, unknown>
 */
export type EventData =
  | TokenUsageData
  | BillingData
  | WarningData
  | InitPlanEventData
  | UpdatePlanEventData
  | AdvancePlanEventData
  | PlanWriteEventData
  | ToolResponseData
  | Record<string, unknown>

export interface BaseEventItem {
  sessionId?: string
  turnId?: string
  parentTurnId?: string
  startTime: Date
  endTime?: Date
  messageId?: string
  agentId: string
  type: EventType
  message: string
  data?: EventData
  meta?: Record<string, unknown>
}

export interface ToolResponseData {
  toolCallId?: string
  toolName?: string
  responseData?: unknown
}

export type ToolEventData = ToolResponseData | Record<string, unknown>

// 计划相关的数据结构定义
export interface PlanPhase {
  id?: string                  // 唯一标识，前端生成
  title: string               // 阶段标题
  description: string         // 阶段详细描述
  status?: PlanPhaseStatus   // 阶段执行状态
  index?: number             // 阶段在计划中的顺序
}

export enum PlanPhaseStatus {
  TODO = 'TODO',                 // 待执行
  RUNNING = 'RUNNING',           // 执行中
  COMPLETED = 'COMPLETED',       // 已完成
  PAUSED = 'PAUSED',             // 已暂停
  FAILED = 'FAILED'              // 执行失败
}
export interface PlanData {
  goal: string                   // 任务总体目标
  phases: PlanPhase[]           // 计划阶段列表
  currentPhaseId?: string       // 当前执行的阶段ID
  status?: PlanStatus           // 整体计划状态
  createdAt?: Date             // 计划创建时间
  updatedTime?: Date             // 计划最后更新时间
}

export enum PlanStatus {
  PLANNING = 'PLANNING',         // 规划中
  EXECUTING = 'EXECUTING',       // 执行中
  COMPLETED = 'COMPLETED',       // 已完成
  PAUSED = 'PAUSED',             // 已暂停
  FAILED = 'FAILED'              // 执行失败
}

// Plan事件的数据载荷
export interface InitPlanEventData {
  plan: PlanData                // 初始化的计划数据
  sessionId: string             // 会话ID
  turnId?: string               // 轮次ID
}

export interface UpdatePlanEventData {
  planId?: string               // 计划ID（如果需要）
  updates: Partial<PlanData>    // 需要更新的计划字段
  reason?: string               // 更新原因
  sessionId: string             // 会话ID
}

export interface AdvancePlanEventData {
  planId?: string               // 计划ID
  fromPhaseId?: string          // 源阶段ID
  toPhaseId: string             // 目标阶段ID
  completedPhase?: PlanPhase    // 已完成的阶段信息
  sessionId: string             // 会话ID
}

/**
 * PLAN_WRITE 事件的数据载荷
 * 对应后端 TaskModeMeta 结构
 */
export interface PlanWriteEventData {
  goal: string                  // 任务总体目标
  currentTaskId?: string        // 当前执行的任务ID
  taskPhaseList: TaskPhaseItem[] // 任务阶段列表
}

/**
 * 任务阶段项（对应后端 TaskModeMeta.TaskPhase）
 */
export interface TaskPhaseItem {
  id: string                    // 任务ID
  title: string                 // 任务标题
  description: string           // 任务描述
  index: number                 // 任务顺序
  taskStatus: TaskPhaseStatus   // 任务状态
}

/**
 * 任务阶段状态（对应后端 TaskModeMeta.TaskStatus）
 */
export enum TaskPhaseStatus {
  TODO = 'TODO',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED'
}

// ========== HITL 交互请求数据结构 ==========

/**
 * 交互类型枚举（与后端 InteractionRequest.InteractionType 对齐）
 */
export enum InteractionType {
  TOOL_APPROVAL = 'TOOL_APPROVAL',
  CONFIRM = 'CONFIRM',
  FORM = 'FORM',
  SELECT = 'SELECT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  TEXT_INPUT = 'TEXT_INPUT'
}

/**
 * 表单字段定义（与后端 InteractionRequest.FieldDefinition 对齐）
 */
export interface FieldDefinition {
  name: string
  label: string
  fieldType: string  // text | password | number | select | checkbox | radio | textarea | date
  required?: boolean
  defaultValue?: string
  placeholder?: string
  options?: string[]
  description?: string
  validation?: string
}

/**
 * 交互请求数据（SSE INTERACTION 事件的 data 载荷）
 *
 * 与后端 InteractionRequest 一一对应
 */
export interface InteractionRequestData {
  type: InteractionType
  message: string

  // TOOL_APPROVAL 专用
  toolName?: string
  toolArgs?: Record<string, any>
  toolCallId?: string

  // CONFIRM 专用
  confirmText?: string
  cancelText?: string

  // FORM / SELECT 专用
  fields?: FieldDefinition[]
  multiSelect?: boolean

  // FILE_UPLOAD 专用
  acceptedFileTypes?: string[]
  maxFileSize?: number
}

export interface UIMessage {
  // identity & tracing
  messageId?: string
  sessionId?: string
  turnId?: string
  parentTurnId?: string    // 新增：父 turn ID，用于非线性对话分支

  // categorization
  type: EventType

  sender: string

  // text payload
  message: string
  data?: EventData

  // time
  startTime?: Date
  endTime?: Date

  events?: BaseEventItem[],
  meta?: Record<string, unknown>;

}

// ========== 计费相关数据结构 ==========

/**
 * TOKEN_USAGE 事件的数据载荷
 */
export interface TokenUsageData {
  inputTokens: number              // 输入 tokens 数量
  outputTokens: number             // 输出 tokens 数量
  totalTokens: number              // 总 tokens 数量
  estimatedCredits?: number         // 预估消耗的 credits
  modelId: string                  // 模型 ID
  elapsedMs?: number               // API 调用耗时（毫秒）
  // 累计数据（会话级别）
  cumulativeInputTokens?: number    // 累计输入 tokens
  cumulativeOutputTokens?: number   // 累计输出 tokens
  cumulativeTotalTokens?: number    // 累计总 tokens
  apiCallCount?: number             // API 调用次数
}

/**
 * BILLING 事件的数据载荷
 */
export interface BillingData {
  creditsCharged: number           // 本次扣除的 credits
  remainingCredits: number          // 剩余 credits
  totalTokens: number               // 总 tokens 数量
}

/**
 * WARNING 事件的数据载荷（通用警告事件）
 *
 * 设计理念：WARNING 是一个通用的警告机制，支持多种警告类型
 * - 计费警告：余额不足、透支警告、透支超限
 * - 系统警告：服务降级、限流提醒、功能受限
 * - 业务警告：任务超时、资源不足、权限不足
 */
export interface WarningData {
  /** 警告类别（用于前端分类处理和样式区分） */
  category: WarningCategory

  /** 警告级别（决定 UI 展示强度） */
  level: WarningLevel

  /** 警告代码（用于国际化和精确匹配） */
  code: string

  /** 警告标题（简短描述） */
  title?: string

  /** 是否可忽略（用户可以关闭） */
  dismissible?: boolean

  /** 建议操作（如 "充值"、"升级"、"重试"） */
  suggestedAction?: string

  /** 操作链接（如充值页面 URL） */
  actionUrl?: string

  /** 扩展数据（根据 category 不同而不同） */
  payload?: WarningPayload
}

/**
 * 警告类别枚举
 */
export enum WarningCategory {
  /** 计费相关警告 */
  BILLING = 'BILLING',
  /** 系统相关警告 */
  SYSTEM = 'SYSTEM',
  /** 业务相关警告 */
  BUSINESS = 'BUSINESS',
  /** 安全相关警告 */
  SECURITY = 'SECURITY'
}

/**
 * 警告级别枚举
 */
export enum WarningLevel {
  /** 信息提示（蓝色，可忽略） */
  INFO = 'INFO',
  /** 警告（黄色，建议关注） */
  WARN = 'WARN',
  /** 严重（橙色，需要处理） */
  SEVERE = 'SEVERE',
  /** 阻断（红色，无法继续） */
  BLOCKING = 'BLOCKING'
}

/**
 * 警告扩展数据（联合类型，根据 category 区分）
 */
export type WarningPayload =
  | BillingWarningPayload
  | SystemWarningPayload
  | BusinessWarningPayload
  | SecurityWarningPayload

/**
 * 计费警告扩展数据
 */
export interface BillingWarningPayload {
  type: 'billing'
  /** 计费警告状态 */
  status: BillingWarningStatus
  /** 当前余额 */
  currentCredits: number
  /** 执行模式要求的最低余额 */
  requiredCredits?: number
  /** 用户等级对应的最大透支额度（负数） */
  overdraftLimit?: number
  /** 用户等级 (free/pro/ultra) */
  userTier: string
  /** 任务等级 */
  taskLevel?: string
}

/**
 * 计费警告状态枚举
 */
export enum BillingWarningStatus {
  /** 余额充足 */
  SUFFICIENT = 'SUFFICIENT',
  /** 余额不足警告（余额 > 0 但低于推荐值） */
  LOW_BALANCE = 'LOW_BALANCE',
  /** 透支警告（余额 < 0 但未超限） */
  OVERDRAFT = 'OVERDRAFT',
  /** 透支超限（余额 < 透支限额，阻断执行） */
  OVERDRAFT_EXCEEDED = 'OVERDRAFT_EXCEEDED'
}

/**
 * 系统警告扩展数据
 */
export interface SystemWarningPayload {
  type: 'system'
  /** 系统警告类型 */
  systemType: 'RATE_LIMIT' | 'SERVICE_DEGRADED' | 'MAINTENANCE' | 'HIGH_LOAD'
  /** 重试等待时间（秒） */
  retryAfter?: number
  /** 受影响的功能 */
  affectedFeatures?: string[]
}

/**
 * 业务警告扩展数据
 */
export interface BusinessWarningPayload {
  type: 'business'
  /** 业务警告类型 */
  businessType: 'TIMEOUT' | 'RESOURCE_LIMIT' | 'FEATURE_DISABLED' | 'QUOTA_EXCEEDED'
  /** 资源名称 */
  resourceName?: string
  /** 当前使用量 */
  currentUsage?: number
  /** 最大限额 */
  maxLimit?: number
}

/**
 * 安全警告扩展数据
 */
export interface SecurityWarningPayload {
  type: 'security'
  /** 安全警告类型 */
  securityType: 'PERMISSION_DENIED' | 'SESSION_EXPIRING' | 'SUSPICIOUS_ACTIVITY'
  /** 需要的权限 */
  requiredPermission?: string
  /** 会话剩余时间（秒） */
  sessionTTL?: number
}
