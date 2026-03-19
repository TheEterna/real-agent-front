import { notification } from 'ant-design-vue'

/**
 * 错误通知去重管理器
 *
 * 设计思路：
 * 1. 使用"消息指纹"（message + description 的组合）作为唯一标识
 * 2. 在时间窗口内（默认 300ms）相同的错误只显示一次
 * 3. 支持错误计数累加，显示"该错误已发生 N 次"
 * 4. 使用固定的 notification key，确保更新而不是创建新通知
 */

interface ErrorRecord {
  /** 错误指纹（唯一标识） */
  fingerprint: string
  /** 首次出现时间 */
  firstTime: number
  /** 最后一次出现时间 */
  lastTime: number
  /** 出现次数 */
  count: number
  /** 定时器 ID（用于延迟显示） */
  timerId?: NodeJS.Timeout
  /** 是否已显示 */
  displayed: boolean
}

class ErrorNotificationManager {
  /** 错误记录映射表 */
  private errorMap = new Map<string, ErrorRecord>()

  /** 时间窗口（毫秒），在此窗口内的相同错误会被合并 */
  private readonly TIME_WINDOW = 300

  /** 错误记录过期时间（毫秒），超过此时间的记录会被清理 */
  private readonly EXPIRE_TIME = 10000

  /** 清理定时器 */
  private cleanupTimer?: NodeJS.Timeout

  constructor() {
    // 启动定期清理任务（每 5 秒清理一次过期记录）
    this.startCleanupTask()
  }

  /**
   * 生成错误指纹（用作唯一标识和 notification key）
   */
  private generateFingerprint(message: string, description: string): string {
    // 使用简单的哈希，确保 key 的稳定性
    const raw = `${message}::${description}`
    let hash = 0
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `error_${Math.abs(hash)}`
  }

  /**
   * 显示错误通知（带去重）
   */
  showError(message: string, description: string, duration: number = 5): void {
    const fingerprint = this.generateFingerprint(message, description)
    const now = Date.now()
    const existingRecord = this.errorMap.get(fingerprint)

    // 如果在时间窗口内已经有相同的错误
    if (existingRecord && now - existingRecord.lastTime < this.TIME_WINDOW) {
      // 更新记录
      existingRecord.count++
      existingRecord.lastTime = now

      // 清除之前的定时器
      if (existingRecord.timerId) {
        clearTimeout(existingRecord.timerId)
      }

      // 延迟显示，等待时间窗口结束后再显示/更新通知
      existingRecord.timerId = setTimeout(() => {
        this.displayNotification(fingerprint, message, description, duration, existingRecord.count)
        existingRecord.displayed = true
      }, this.TIME_WINDOW)

      return
    }

    // 新的错误或已过时间窗口的错误
    const newRecord: ErrorRecord = {
      fingerprint,
      firstTime: now,
      lastTime: now,
      count: 1,
      displayed: false
    }

    // 延迟显示，等待时间窗口结束
    newRecord.timerId = setTimeout(() => {
      this.displayNotification(fingerprint, message, description, duration, newRecord.count)
      newRecord.displayed = true
    }, this.TIME_WINDOW)

    this.errorMap.set(fingerprint, newRecord)
  }

  /**
   * 显示/更新通知
   * 使用固定的 key，确保 Ant Design Vue 更新同一个通知而不是创建新的
   */
  private displayNotification(
    key: string,
    message: string,
    description: string,
    duration: number,
    count: number
  ): void {
    notification.error({
      key, // 使用固定的 key，确保更新而不是创建新通知
      message,
      description,
      duration
    })
  }

  /**
   * 启动定期清理任务
   */
  private startCleanupTask(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, 5000)
  }

  /**
   * 清理过期的错误记录
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.errorMap.forEach((record, key) => {
      if (now - record.lastTime > this.EXPIRE_TIME) {
        // 清除定时器
        if (record.timerId) {
          clearTimeout(record.timerId)
        }
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => this.errorMap.delete(key))
  }

  /**
   * 销毁管理器（清理所有资源）
   */
  destroy(): void {
    // 清除所有定时器
    this.errorMap.forEach(record => {
      if (record.timerId) {
        clearTimeout(record.timerId)
      }
    })

    // 清除清理定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.errorMap.clear()
  }
}

// 导出单例
export const errorNotificationManager = new ErrorNotificationManager()

/**
 * 便捷函数：显示错误通知（自动去重）
 */
export function showErrorNotification(
  message: string,
  description: string,
  duration: number = 5
): void {
  errorNotificationManager.showError(message, description, duration)
}
