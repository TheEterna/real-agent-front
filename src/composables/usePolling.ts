/**
 * 通用轮询 Composable
 *
 * @author Han
 * @since 2026-02-03
 */

import { ref, onUnmounted } from 'vue'

export interface PollingOptions {
  /** 轮询间隔（毫秒），默认 3000 */
  interval?: number
  /** 是否立即执行一次，默认 false */
  immediate?: boolean
  /** 错误处理回调 */
  onError?: (error: Error) => void
}

/**
 * 通用轮询 Hook
 *
 * @param fetchFn 轮询执行的异步函数
 * @param options 配置选项
 * @returns { isPolling, data, start, stop }
 *
 * @example
 * ```ts
 * const { start, stop, isPolling } = usePolling(
 *   async () => {
 *     const res = await api.getStatus(id)
 *     if (res.status === 'completed') stop()
 *     return res
 *   },
 *   { interval: 3000 }
 * )
 * ```
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: PollingOptions = {}
) {
  const { interval = 3000, immediate = false, onError } = options

  const isPolling = ref(false)
  const data = ref<T | null>(null) as { value: T | null }
  let timer: ReturnType<typeof setInterval> | null = null

  const poll = async () => {
    try {
      data.value = await fetchFn()
    } catch (e) {
      onError?.(e as Error)
    }
  }

  const start = async () => {
    if (isPolling.value) return
    isPolling.value = true

    if (immediate) {
      await poll()
    }

    timer = setInterval(poll, interval)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isPolling.value = false
  }

  // 组件卸载时自动停止轮询
  onUnmounted(stop)

  return {
    /** 是否正在轮询 */
    isPolling,
    /** 最新的轮询数据 */
    data,
    /** 开始轮询 */
    start,
    /** 停止轮询 */
    stop
  }
}
