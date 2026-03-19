/**
 * SSE 事件分发模块
 *
 * 负责:
 * - 事件类型到处理器的映射
 * - 自定义处理器 + 默认处理器的优先级调度
 *
 * 从原 useSSE.ts 提取，保持逻辑完全一致
 */

import { EventType, type BaseEventItem } from '@/types/events'
import type { SSEEventHandlers } from './types'

/** 事件类型 -> handler 方法名的映射 */
const HANDLER_MAP: Record<string, keyof SSEEventHandlers> = {
  [EventType.STARTED]: 'onStarted',
  [EventType.THINKING]: 'onThinking',
  [EventType.ACTION]: 'onAction',
  [EventType.ACTING]: 'onActing',
  [EventType.OBSERVING]: 'onObserving',
  [EventType.EXECUTING]: 'onExecuting',
  [EventType.TOOL]: 'onTool',
  [EventType.WEB_SEARCH]: 'onTool',
  [EventType.TOOL_APPROVAL]: 'onToolApproval',
  [EventType.INTERACTION]: 'onInteraction',
  [EventType.PROGRESS]: 'onProgress',
  [EventType.DONE]: 'onDone',
  [EventType.DONEWITHWARNING]: 'onDoneWithWarning',
  [EventType.ERROR]: 'onError',
  [EventType.COMPLETED]: 'onCompleted',
  // 扩展事件类型
  [EventType.TASK_ANALYSIS]: 'onTaskAnalysis',
  [EventType.THOUGHT]: 'onThought',
  [EventType.INIT_PLAN]: 'onInitPlan',
  [EventType.UPDATE_PLAN]: 'onUpdatePlan',
  [EventType.ADVANCE_PLAN]: 'onAdvancePlan',
  [EventType.PLAN_WRITE]: 'onPlanWrite',
  // 模型推理事件
  [EventType.REASONING]: 'onReasoning'
}

/**
 * 根据事件类型获取处理器方法名称
 */
export const getHandlerNameByEventType = (eventType: string): keyof SSEEventHandlers => {
  return HANDLER_MAP[eventType] || 'onDefault'
}

/**
 * SSE 事件分发器
 *
 * 调度逻辑：
 * 1. 优先调用自定义处理器
 * 2. 如果自定义处理器返回 false，则跳过默认处理器
 * 3. 否则执行默认处理器
 */
export function useSSEEventBus(
  defaultHandlers: Required<SSEEventHandlers>,
  customHandlers?: SSEEventHandlers
) {
  /**
   * 分发事件到对应的处理器
   *
   * @param event SSE 事件对象
   */
  const dispatch = (event: BaseEventItem): void => {
    const eventType = event.type

    // 获取事件类型对应的处理器名称
    const handlerName = getHandlerNameByEventType(eventType)

    // 优先使用自定义处理器
    if (customHandlers) {
      const customHandler = customHandlers[handlerName]
      if (customHandler) {
        const result = customHandler(event)
        // 如果自定义处理器返回 false，则跳过默认处理器
        if (result === false) return
      }
    }

    // 执行默认处理
    const defaultHandler = defaultHandlers[handlerName]
    if (defaultHandler) {
      defaultHandler(event)
    }
  }

  return {
    dispatch,
    getHandlerNameByEventType
  }
}
