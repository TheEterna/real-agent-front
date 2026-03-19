/**
 * SSE 模块类型定义
 *
 * 从原 useSSE.ts 提取的接口定义，保持完全兼容
 */

import type { BaseEventItem } from '@/types/events'
import type { NotificationType } from '@/types/notification'

/** SSE 连接源接口 */
export interface SSESource {
  addEventListener(event: string, handler: (e: MessageEvent) => void): void
  close(): void
  stream(): void
}

/** 自定义事件处理器映射 */
export interface SSEEventHandlers {
  onStarted?: (event: BaseEventItem) => void | boolean
  onThinking?: (event: BaseEventItem) => void | boolean
  onAction?: (event: BaseEventItem) => void | boolean
  onActing?: (event: BaseEventItem) => void | boolean
  onObserving?: (event: BaseEventItem) => void | boolean
  onExecuting?: (event: BaseEventItem) => void | boolean
  onTool?: (event: BaseEventItem) => void | boolean
  onToolApproval?: (event: BaseEventItem) => void | boolean
  onInteraction?: (event: BaseEventItem) => void | boolean
  onProgress?: (event: BaseEventItem) => void | boolean
  onDone?: (event: BaseEventItem) => void | boolean
  onDoneWithWarning?: (event: BaseEventItem) => void | boolean
  onError?: (event: BaseEventItem) => void | boolean
  onCompleted?: (event: BaseEventItem) => void | boolean
  onDefault?: (event: BaseEventItem) => void | boolean

  // 扩展事件处理器
  onTaskAnalysis?: (event: BaseEventItem) => void | boolean
  onThought?: (event: BaseEventItem) => void | boolean
  onInitPlan?: (event: BaseEventItem) => void | boolean
  onUpdatePlan?: (event: BaseEventItem) => void | boolean
  onAdvancePlan?: (event: BaseEventItem) => void | boolean
  onPlanWrite?: (event: BaseEventItem) => void | boolean

  // 模型推理事件处理器
  onReasoning?: (event: BaseEventItem) => void | boolean
}

/** Agent执行配置 */
export interface AgentExecuteOptions {
  endpoint: string
  method?: 'POST' | 'GET'
  headers?: Record<string, string>
  payload?: Record<string, any>
}

/** useSSE 配置选项 */
export interface SSEOptions {
  /** 自定义事件处理器 */
  handlers?: SSEEventHandlers
  /** 滚动到底部回调 */
  onScrollToBottom?: () => void
  /** 完成通知回调 */
  onDoneNotice?: (p: {
    text: string
    startTime: Date
    title: string
    messageId?: string
    type: NotificationType
  }) => void
  /** Turn 开始回调（STARTED 事件携带 turnId 时触发，用于更新 progress 挂载位置） */
  onTurnStarted?: (turnId: string) => void
}

/** SSE 连接配置 */
export interface SSEConnectionConfig {
  endpoint: string
  method?: 'POST' | 'GET'
  headers?: Record<string, string>
  payload?: Record<string, any>
}

/** 所有需要监听的 SSE 事件类型 */
export const SSE_EVENT_TYPES = [
  // 基础事件
  'STARTED', 'PROGRESS', 'AGENT_SELECTED', 'THINKING',
  'ACTION', 'ACTING', 'OBSERVING', 'DONE', 'EXECUTING',
  'ERROR', 'TOOL', 'WEB_SEARCH', 'DONEWITHWARNING', 'TOOL_APPROVAL',
  'INTERACTION', 'COMPLETED',
  // 扩展事件
  'TASK_ANALYSIS', 'THOUGHT', 'INIT_PLAN',
  'UPDATE_PLAN', 'ADVANCE_PLAN', 'PLAN_WRITE',
  // 模型推理事件
  'REASONING'
] as const

export type SSEEventType = typeof SSE_EVENT_TYPES[number]
