/**
 * SSE 连接管理模块
 *
 * 负责:
 * - SSE 连接的建立和关闭
 * - Token 刷新重试机制
 * - 连接状态管理
 *
 * 从原 useSSE.ts 提取，保持逻辑完全一致
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { notification } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import type { SSESource, SSEConnectionConfig } from './types'
import { SSE_EVENT_TYPES } from './types'

const ssePromise = import('sse.js')

/** SSE 连接事件回调 */
export interface SSEConnectionCallbacks {
  /** 收到事件 */
  onEvent: (event: MessageEvent, eventType: string) => void
  /** 连接成功 */
  onConnected?: () => void
  /** 连接关闭 */
  onDisconnected?: () => void
  /** 连接错误 */
  onError?: (error: any, errorInfo?: SSEConnectionErrorInfo) => void
}

/** SSE 连接错误信息 */
export interface SSEConnectionErrorInfo {
  isUnauthorized: boolean      // 401 未授权
  isServerError: boolean      // 5xx 服务器错误
  isNetworkError: boolean     // 网络错误（无响应码）
  responseCode?: number       // HTTP 响应码
  errorData?: any            // 错误响应数据
}

export function useSSEConnection() {
  const authStore = useAuthStore()
  const router = useRouter()
  const { t } = useI18n()

  // === 连接状态 ===
  const activeSource = ref<SSESource | null>(null)
  // tokenRefreshAttempts 改为 Map，按连接隔离（解决跨连接竞争问题）
  const tokenRefreshAttempts = ref<Map<string, number>>(new Map())
  const MAX_TOKEN_REFRESH_ATTEMPTS = 3
  // 连接状态守卫：防止并行连接
  let isConnecting = false

  // === 重试配置 ===
  const MAX_RETRY_ATTEMPTS = 3  // 最大重试次数
  const BASE_RETRY_DELAY = 1000  // 基础退避延迟（ms）
  const MAX_RETRY_DELAY = 10000  // 最大退避延迟（ms）

  // === 工具函数 ===

  /** 安全关闭 SSE 源，并清理所有事件监听器防止内存泄漏 */
  const closeSource = (source: SSESource | null) => {
    try {
      if (!source) return
      // 先关闭连接（中止底层 XHR）
      if (typeof source.close === 'function') source.close()
      // 清空 sse.js 内部的 listeners map，切断回调闭包的引用链
      // 防止在 connect/disconnect 循环中累积对 resolve/reject/callbacks 等闭包的引用
      const rawSource = source as any
      if (rawSource.listeners && typeof rawSource.listeners === 'object') {
        for (const key of Object.keys(rawSource.listeners)) {
          delete rawSource.listeners[key]
        }
      }
    } catch (e) {
      console.error('Failed to close SSE source:', e)
    }
  }

  /** 关闭当前活动的 SSE 连接 */
  const closeActiveSource = () => {
    isConnecting = false
    if (activeSource.value) {
      closeSource(activeSource.value)
      activeSource.value = null
    }
  }

  /** 处理认证失败 */
  const handleAuthFailure = (message: string, reject: (reason?: any) => void) => {
    isConnecting = false
    notification.error({
      message: t('composable.sse.authFailedTitle'),
      description: message,
      duration: 5
    })
    authStore.clearAuth()
    void router.push({ path: '/', query: { redirect: router.currentRoute.value.fullPath } })
    reject(new Error(message))
  }

  /**
   * 指数退避重试函数
   * @param fn 要重试的异步函数
   * @param operationName 操作名称（用于日志）
   * @param maxAttempts 最大重试次数
   * @returns 重试结果
   */
  const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    operationName: string,
    maxAttempts: number = MAX_RETRY_ATTEMPTS
  ): Promise<T | null> => {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (e) {
        lastError = e as Error
        const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY)
        console.warn(`[SSE] ${operationName} 失败，${attempt}/${maxAttempts} 次，${delay}ms 后重试:`, lastError.message)

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    console.error(`[SSE] ${operationName} 重试${maxAttempts}次均失败，放弃重试:`, lastError?.message)
    return null
  }

  /**
   * 刷新 Token 并重试连接
   * @param sessionId 会话 ID（用于隔离计数器）
   * @returns 是否成功刷新
   */
  const refreshTokenAndRetry = async (
    sessionId: string,
    retryFn: () => void,
    reject: (reason?: any) => void
  ): Promise<boolean> => {
    const attempts = tokenRefreshAttempts.value.get(sessionId) || 0

    // 检查重试次数
    if (attempts >= MAX_TOKEN_REFRESH_ATTEMPTS) {
      console.error(`[SSE] Token 刷新次数超限 (${MAX_TOKEN_REFRESH_ATTEMPTS})，跳转登录`)
      tokenRefreshAttempts.value.delete(sessionId)
      handleAuthFailure(t('composable.sse.tokenRefreshFailed'), reject)
      return false
    }

    tokenRefreshAttempts.value.set(sessionId, attempts + 1)
    console.warn(`[SSE] 尝试刷新 Token (${sessionId}: ${attempts + 1}/${MAX_TOKEN_REFRESH_ATTEMPTS})`)

    const refreshToken = authStore.refreshToken
    if (!refreshToken) {
      console.warn('[SSE] 没有 Refresh Token，无法重试')
      handleAuthFailure(t('composable.sse.loginExpired'), reject)
      return false
    }

    try {
      const { authApi } = await import('@/api/auth')
      const response = await authApi.refresh(refreshToken)

      if (Number(response.code) === 200) {
        const { accessToken: newToken, refreshToken: newRefreshToken, expiresIn } = response.data
        authStore.setTokens(newToken, newRefreshToken, expiresIn)
        tokenRefreshAttempts.value.delete(sessionId)  // 成功，清理计数器
        console.log('[SSE] Token 刷新成功')
        retryFn()
        return true
      } else {
        console.error('[SSE] Token 刷新失败:', response.message)
        handleAuthFailure(t('composable.sse.loginExpired'), reject)
        return false
      }
    } catch (err) {
      console.error('[SSE] Token 刷新异常:', err)
      handleAuthFailure(t('composable.sse.pleaseReLogin'), reject)
      return false
    }
  }

  /**
   * 建立 SSE 连接
   *
   * @param config 连接配置
   * @param callbacks 事件回调
   */
  const connect = (
    config: SSEConnectionConfig,
    callbacks: SSEConnectionCallbacks
  ): Promise<void> => {
    // 防止并行连接：如果已在连接中，拒绝新请求
    if (isConnecting) {
      console.warn('[SSE] 连接已在进行中，忽略重复请求')
      return Promise.reject(new Error('SSE connection in progress'))
    }
    isConnecting = true

    return new Promise<void>((resolve, reject) => {
      ssePromise.then(({ SSE }) => {
        // 启动新任务前先清理之前的连接
        closeActiveSource()

        const defaultHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        }

        // 获取当前 token
        let token = authStore.accessToken

        // 定义内层函数，用于建立 SSE 连接
        const establishSSEConnection = () => {
          if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`
          }

          const source = new SSE(config.endpoint, {
            method: config.method || 'POST',
            headers: { ...defaultHeaders, ...(config.headers || {}) },
            payload: config.payload ? JSON.stringify(config.payload) : undefined,
          }) as SSESource

          // 保存当前活动连接的引用
          activeSource.value = source

          // 连接成功
          source.addEventListener('open', () => {
            isConnecting = false
            // 连接成功，重置 Token 刷新计数器
            const connectionKey = config.endpoint
            tokenRefreshAttempts.value.delete(connectionKey)
            resolve()
            callbacks.onConnected?.()
          })

          // 创建事件监听器的工厂函数
          const createEventListener = (eventName: string) => (messageEvent: MessageEvent) => {
            if (!messageEvent?.data) return
            callbacks.onEvent(messageEvent, eventName)
          }

          // 统一注册所有事件监听器
          SSE_EVENT_TYPES.forEach(eventType => {
            source.addEventListener(eventType, createEventListener(eventType))
          })

          // 特别重要：监听默认的 'message' 事件
          source.addEventListener('message', createEventListener('message'))

          // 监听连接错误
          source.addEventListener('error', (event: Event) => {
            isConnecting = false
            console.error('[SSE] 连接错误:', event)
            const customEvent = event as any
            const responseCode = customEvent.responseCode
            const errorData = customEvent.data ? JSON.parse(customEvent.data) : null

            console.log('[SSE] 错误详情 - Code:', responseCode, 'Data:', errorData)

            // 处理 401 未授权错误
            const isUnauthorized = responseCode === 401 || errorData?.code === 401
            if (isUnauthorized) {
              closeActiveSource()
              // 使用 endpoint 作为计数器 key，实现按连接隔离
              const connectionKey = config.endpoint
              refreshTokenAndRetry(connectionKey, () => {
                // 更新 token 后重新建立连接
                token = authStore.accessToken
                establishSSEConnection()
              }, reject)
              return
            }

            // 处理 5xx 服务器错误和其他错误
            const isServerError = responseCode && responseCode >= 500
            const isNetworkError = !responseCode
            const errorInfo: SSEConnectionErrorInfo = {
              isUnauthorized: false,
              isServerError: !!isServerError,
              isNetworkError,
              responseCode,
              errorData
            }

            // 通知调用方（调用方负责 UI 反馈和状态更新）
            callbacks.onError?.(event, errorInfo)

            // 构造错误描述
            const errorDesc = isServerError
              ? t('composable.sse.serverError', { code: responseCode })
              : isNetworkError
                ? t('composable.sse.networkError')
                : t('composable.sse.connectionLost')

            // reject Promise，让调用方的 catch 块能正确触发
            reject(new Error(errorDesc))
          })

          // 连接关闭
          source.addEventListener('close', () => {
            isConnecting = false
            console.log('[SSE] 连接关闭')
            resolve()
            callbacks.onDisconnected?.()
          })

          // 启动流
          try {
            source.stream()
          } catch (e: any) {
            isConnecting = false
            const errorMsg = e?.message || 'Unknown error'
            const error = new Error('SSE stream start failed: ' + errorMsg)
            console.error('[SSE] 流启动失败:', error)

            notification.error({
              message: t('composable.sse.connectionStartFailed'),
              description: errorMsg,
              duration: 5
            })

            reject(error)
          }
        }

        // 检查 Token 是否即将过期，如果过期则同步刷新
        if (authStore.isTokenExpiring) {
          console.warn('[SSE] Token 即将过期，尝试同步刷新')
          const refreshToken = authStore.refreshToken

          if (refreshToken) {
            import('@/api/auth').then(({ authApi }) => {
              authApi.refresh(refreshToken).then(response => {
                if (Number(response.code) === 200) {
                  const { accessToken: newToken, refreshToken: newRefreshToken, expiresIn } = response.data
                  authStore.setTokens(newToken, newRefreshToken, expiresIn)
                  token = newToken
                  console.log('[SSE] Token 刷新成功')
                  establishSSEConnection()
                } else {
                  console.error('[SSE] Token 刷新失败:', response.message)
                  handleAuthFailure(t('composable.sse.tokenRefreshFailedShort'), reject)
                }
              }).catch(err => {
                console.error('[SSE] Token 刷新异常:', err)
                handleAuthFailure(t('composable.sse.pleaseReLogin'), reject)
              })
            })
            return
          } else {
            console.warn('[SSE] 没有 Refresh Token，无法重试')
            handleAuthFailure(t('composable.sse.loginExpired'), reject)
            return
          }
        }

        // Token 状态正常，直接建立连接
        establishSSEConnection()
      })
        .catch((e) => {
          const errorMsg = (e as Error).message
          console.error('[SSE] 加载失败:', errorMsg)
          isConnecting = false  // 重置连接状态

          notification.error({
            message: t('composable.sse.sseModuleLoadFailed'),
            description: errorMsg,
            duration: 5
          })

          reject(new Error('Failed to load sse.js: ' + errorMsg))
        })
    })
  }

  return {
    activeSource,
    connect,
    closeActiveSource
  }
}
