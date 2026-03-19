import http from '@/services/http'
import type { ResponseResult } from '@/types/http'

/**
 * 发送交互响应（REST，用于 BySink 实时审批路径）
 *
 * 与 resumeVoloAI（SSE）的区别：
 * - resumeVoloAI：创建新 SSE 连接，重建上下文后重新执行（DB Stop+Resume 机制 A）
 * - sendInteractionResponse：REST 调用，解除现有 SSE 流中的 Sinks.One 阻塞（BySink 机制 B）
 *
 * @param turnId Turn ID
 * @param response 交互响应内容
 */
export function sendInteractionResponse(turnId: string, response: {
  selectedOptionId?: string
  data?: Record<string, unknown>
}): Promise<ResponseResult<string>> {
  return http.post('/api/agent/chat/volo-ai/interaction_response', {
    turnId,
    ...response
  })
}
