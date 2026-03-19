import { nanoid } from 'nanoid'

/**
 * 统一的 ID 生成工具
 * 避免不同组件使用不同格式导致 ID 冲突
 */

/**
 * 生成消息 ID (使用 nanoid，长度 16)
 */
export function generateMessageId(): string {
    return nanoid(16)
}

/**
 * 生成会话 ID
 */
export function generateSessionId(): string {
    return nanoid(16)
}

/**
 * 生成临时 ID (用于前端临时标识，后续需要后端替换)
 */
export function generateTempId(prefix: string = 'temp'): string {
    return `${prefix}-${nanoid(12)}`
}

/**
 * 判断是否为临时 ID
 */
export function isTempId(id: string): boolean {
    return id.startsWith('temp-')
}
