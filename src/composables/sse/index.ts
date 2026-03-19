/**
 * SSE 模块统一导出
 *
 * 提供模块化的 SSE 功能组件，同时保持向后兼容
 */

// 类型导出
export * from './types'

// 子模块导出
export { useSSEConnection } from './useSSEConnection'
export { useMessageAggregator } from './useMessageAggregator'
export { useSSEEventBus, getHandlerNameByEventType } from './useSSEEventBus'
export {
  usePlanTransformer,
  mapTaskStatusToPlanPhaseStatus,
  determinePlanStatus,
  transformPlanWriteEventToPlanData
} from './usePlanTransformer'

// Agent 配置导出
export { AGENT_CONFIGS, VOLO_AI_RESUME_ENDPOINT, getAgentConfig } from './agents/config'
export type { AgentConfig } from './agents/config'
