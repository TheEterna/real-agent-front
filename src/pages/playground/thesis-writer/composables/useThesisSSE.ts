/**
 * 论文写作 SSE 流式通信
 *
 * 基于全局 useSSEConnection 构建，复用 token 注入、401 刷新重试、错误分类等能力。
 */
import { ref } from 'vue'
import i18n from '@/i18n'
import { useSSEConnection } from '@/composables/sse/useSSEConnection'
import type { ThesisWriteRequest, GuidedWritingRequest, InlineWriteRequest } from '@/types/thesis-writer'

export function useThesisSSE() {
  const { t } = i18n.global
  const { connect, closeActiveSource } = useSSEConnection()

  const isStreaming = ref(false)
  const streamContent = ref('')
  const streamError = ref<string | null>(null)

  // --- 超时保护（提升到 composable 顶层，供 stopStream 清理） ---
  const BATCH_TIMEOUT_MS = 10 * 60 * 1000 // 批量整体超时 10 分钟
  const NODE_TIMEOUT_MS = 3 * 60 * 1000 // 单节点超时 3 分钟
  let batchTimeout: ReturnType<typeof setTimeout> | null = null
  let nodeTimeout: ReturnType<typeof setTimeout> | null = null

  /** 清理所有超时定时器 */
  function clearAllTimeouts() {
    if (batchTimeout) {
      clearTimeout(batchTimeout)
      batchTimeout = null
    }
    if (nodeTimeout) {
      clearTimeout(nodeTimeout)
      nodeTimeout = null
    }
  }

  /**
   * 通用 SSE 流式请求
   */
  function startStream(
    endpoint: string,
    payload: Record<string, unknown>,
    options?: {
      onContent?: (chunk: string) => void
      onDone?: (fullContent: string) => void
      onError?: (error: string) => void
      onNodeComplete?: (nodeId: string) => void
      onNodeStarted?: (nodeId: string) => void
      /** 批量模式：DONE 事件不关闭连接，由 NODE_COMPLETE 计数判断 */
      batchMode?: boolean
      /** 批量模式下预期的节点总数 */
      batchTotal?: number
    }
  ) {
    // 清理上一次连接（包括超时定时器）
    stopStream()

    isStreaming.value = true
    streamContent.value = ''
    streamError.value = null

    let batchCompletedCount = 0

    const handleError = (msg: string) => {
      clearAllTimeouts()
      streamError.value = msg
      isStreaming.value = false
      options?.onError?.(msg)
    }

    // 批量模式：启动整体超时保护
    if (options?.batchMode && options.batchTotal) {
      batchTimeout = setTimeout(() => {
        if (isStreaming.value && batchCompletedCount < (options.batchTotal ?? 0)) {
          const msg = t('thesisWriter.sse.batchTimeout', { done: batchCompletedCount, total: options.batchTotal })
          handleError(msg)
          closeActiveSource()
        }
      }, BATCH_TIMEOUT_MS)
    }

    return connect(
      { endpoint, method: 'POST', payload },
      {
        onEvent(event: MessageEvent) {
          try {
            const data = JSON.parse(event.data)

            switch (data.type) {
              case 'STARTED':
                if (data.nodeId) {
                  options?.onNodeStarted?.(data.nodeId)
                }
                // 单节点超时保护：每次节点开始时重置
                if (options?.batchMode) {
                  if (nodeTimeout) clearTimeout(nodeTimeout)
                  nodeTimeout = setTimeout(() => {
                    if (isStreaming.value) {
                      handleError(t('thesisWriter.sse.singleTimeout'))
                      closeActiveSource()
                    }
                  }, NODE_TIMEOUT_MS)
                }
                break
              case 'CONTENT':
                if (data.content) {
                  streamContent.value += data.content
                  options?.onContent?.(data.content)
                }
                break
              case 'NODE_COMPLETE':
                if (data.nodeId) {
                  options?.onNodeComplete?.(data.nodeId)
                }
                // 清除单节点超时（该节点已完成）
                if (nodeTimeout) {
                  clearTimeout(nodeTimeout)
                  nodeTimeout = null
                }
                // 重置 streamContent 准备下一个节点
                streamContent.value = ''
                // 批量模式：计数并判断是否全部完成
                if (options?.batchMode && options.batchTotal) {
                  batchCompletedCount++
                  if (batchCompletedCount >= options.batchTotal) {
                    clearAllTimeouts()
                    isStreaming.value = false
                    closeActiveSource()
                  }
                }
                break
              case 'DONE':
                if (options?.batchMode) {
                  // 批量模式下 DONE 仅回调，不关闭连接
                  options?.onDone?.(streamContent.value)
                } else {
                  clearAllTimeouts()
                  isStreaming.value = false
                  options?.onDone?.(streamContent.value)
                  closeActiveSource()
                }
                break
              case 'ERROR':
                handleError(data.error || t('thesisWriter.sse.serviceError'))
                closeActiveSource()
                break
            }
          } catch (e) {
            console.error('[ThesisSSE] 解析事件失败:', e)
          }
        },
        onError(_event, errorInfo) {
          // useSSEConnection 已处理 401 刷新重试和跳转登录
          // 这里只处理非 401 的错误
          if (errorInfo?.isUnauthorized) return

          const msg = errorInfo?.isServerError
            ? t('thesisWriter.sse.serverError')
            : errorInfo?.isNetworkError
              ? t('thesisWriter.sse.networkError')
              : t('thesisWriter.sse.sseError')
          handleError(msg)
        },
        onDisconnected() {
          clearAllTimeouts()
          if (isStreaming.value) {
            isStreaming.value = false
          }
        },
      }
    ).catch((e) => {
      // connect promise reject（如 token 彻底失败、sse.js 加载失败等）
      handleError(e instanceof Error ? e.message : t('thesisWriter.sse.sseFailed'))
    })
  }

  /**
   * AI 写作流式请求
   */
  function streamWrite(request: ThesisWriteRequest, callbacks?: {
    onContent?: (chunk: string) => void
    onDone?: (fullContent: string) => void
    onError?: (error: string) => void
  }) {
    return startStream('/api/thesis/write/stream', request as unknown as Record<string, unknown>, callbacks)
  }

  /**
   * 引导写作流式请求
   */
  function streamGuidedWrite(request: GuidedWritingRequest, callbacks?: {
    onContent?: (chunk: string) => void
    onDone?: (fullContent: string) => void
    onError?: (error: string) => void
    onNodeComplete?: (nodeId: string) => void
    onNodeStarted?: (nodeId: string) => void
    batchMode?: boolean
    batchTotal?: number
  }) {
    return startStream('/api/thesis/guided/generate', request as unknown as Record<string, unknown>, callbacks)
  }

  /**
   * Inline AI 写作流式请求（选区操作）
   */
  function streamInlineWrite(request: InlineWriteRequest, callbacks?: {
    onContent?: (chunk: string) => void
    onDone?: (fullContent: string) => void
    onError?: (error: string) => void
  }) {
    return startStream('/api/thesis/write/inline-stream', request as unknown as Record<string, unknown>, callbacks)
  }

  /**
   * 停止当前流
   */
  function stopStream() {
    clearAllTimeouts()
    closeActiveSource()
    isStreaming.value = false
  }

  return {
    isStreaming,
    streamContent,
    streamError,
    streamWrite,
    streamGuidedWrite,
    streamInlineWrite,
    stopStream,
  }
}
