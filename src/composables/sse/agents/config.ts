/**
 * Agent 执行器配置
 *
 * 定义各 Agent 的端点和配置信息
 * 从原 useSSE.ts 提取，保持配置完全一致
 */

/** Agent 配置 */
export interface AgentConfig {
  /** API 端点 */
  endpoint: string
  /** Agent 名称（用于日志和错误提示）*/
  name: string
}

/** 所有 Agent 的配置注册表 */
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  voloAI: {
    endpoint: '/api/agent/chat/volo-ai/stream',
    name: 'Volo AI'
  }
}

/** Volo AI 恢复执行端点（SSE，用于 DB Stop+Resume 机制） */
export const VOLO_AI_RESUME_ENDPOINT = '/api/agent/chat/volo-ai/resume'

/** Volo AI 交互响应端点（REST，用于 BySink 实时审批） */
export const VOLO_AI_INTERACTION_ENDPOINT = '/api/agent/chat/volo-ai/interaction_response'

/**
 * 获取 Agent 配置
 * @param agentType Agent 类型
 * @returns Agent 配置，如果不存在则返回 undefined
 */
export const getAgentConfig = (agentType: string): AgentConfig | undefined => {
  return AGENT_CONFIGS[agentType]
}
