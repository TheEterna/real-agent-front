/**
 * 图像 Playground API 封装
 *
 * @author Han
 * @since 2026-01-28
 */

import http from '@/services/http'
import type {
  ImageModelConfig,
  ImageSession,
  ImageMessage,
  ImageGenerateRequest,
  ImageStreamEvent
} from '@/types/playground-image'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = '/playground/basic/image'

/**
 * 图像 Playground API
 */
export const imagePlaygroundApi = {
  // ==================== 模型 ====================

  /**
   * 获取可用模型列表
   */
  getModels: () => http.get<ImageModelConfig[]>(`${BASE_URL}/models`),

  // ==================== 会话 ====================

  /**
   * 获取会话列表
   */
  getSessions: (page = 0, pageSize = 20) =>
    http.get<ImageSession[]>(`${BASE_URL}/sessions`, {
      params: { page, pageSize }
    }),

  /**
   * 获取会话详情
   */
  getSession: (sessionId: string) =>
    http.get<ImageSession>(`${BASE_URL}/sessions/${sessionId}`),

  /**
   * 删除会话
   */
  deleteSession: (sessionId: string) =>
    http.delete<boolean>(`${BASE_URL}/sessions/${sessionId}`),

  /**
   * 获取会话消息
   */
  getMessages: (sessionId: string) =>
    http.get<ImageMessage[]>(`${BASE_URL}/sessions/${sessionId}/messages`),

  /**
   * 更新会话标题
   */
  updateSessionTitle: (sessionId: string, title: string) =>
    http.patch<boolean>(`${BASE_URL}/sessions/${sessionId}/title`, null, {
      params: { title }
    }),

  // ==================== 生成 ====================

  /**
   * 非流式生成
   */
  generate: (request: ImageGenerateRequest) =>
    http.post<ImageMessage>(`${BASE_URL}/generate`, request),

  // ==================== 流式生成 ====================

  /**
   * 获取流式生成 URL
   */
  getStreamUrl: () => `/api${BASE_URL}/generate/stream`,

  /**
   * 获取流式请求头
   */
  getStreamHeaders: () => {
    const authStore = useAuthStore()
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authStore.accessToken}`
    }
  }
}

/**
 * 流式图像生成
 *
 * @param request 生成请求
 * @param onEvent 事件回调
 * @param onError 错误回调
 * @param onComplete 完成回调
 * @returns AbortController 用于取消请求
 */
export function streamGenerateImage(
  request: ImageGenerateRequest,
  onEvent: (event: ImageStreamEvent) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): AbortController {
  const controller = new AbortController()

  const fetchStream = async () => {
    try {
      const response = await fetch(imagePlaygroundApi.getStreamUrl(), {
        method: 'POST',
        headers: imagePlaygroundApi.getStreamHeaders(),
        body: JSON.stringify(request),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 事件
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留不完整的行

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = line.slice(5).trim()
              if (data) {
                const event: ImageStreamEvent = JSON.parse(data)
                onEvent(event)
              }
            } catch (e) {
              console.warn('[ImagePlayground] 解析事件失败:', line, e)
            }
          }
        }
      }

      onComplete?.()
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('[ImagePlayground] 请求已取消')
        return
      }
      console.error('[ImagePlayground] 流式生成失败:', error)
      onError?.(error as Error)
    }
  }

  fetchStream()

  return controller
}

