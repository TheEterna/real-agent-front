/**
 * Mock 模式共享工具和常量
 */

// ==================== 请求解析 ====================

/** 安全解析请求体 */
export function parseBody(data: any): any {
  if (!data) return {}
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return {} }
  }
  return data
}

// ==================== 响应构造器 ====================

/** 成功响应 */
export function ok<T>(data: T) {
  return { code: 200, message: 'ok', data, timestamp: Date.now() }
}

/** 错误响应 */
export function error(code: number, message: string) {
  return { code, message, data: null, timestamp: Date.now() }
}

// ==================== URL 匹配 ====================

/**
 * URL 模式匹配
 * 支持 :param 路径参数，如 match('/sessions/:id', '/sessions/abc-123') → true
 */
export function match(pattern: string, url: string): boolean {
  const cleanUrl = url.split('?')[0]
  const patternParts = pattern.split('/').filter(Boolean)
  const urlParts = cleanUrl.split('/').filter(Boolean)
  if (patternParts.length !== urlParts.length) return false
  return patternParts.every((part, i) => part.startsWith(':') || part === urlParts[i])
}

/** 提取路径参数 */
export function param(pattern: string, url: string, name: string): string {
  const cleanUrl = url.split('?')[0]
  const patternParts = pattern.split('/').filter(Boolean)
  const urlParts = cleanUrl.split('/').filter(Boolean)
  const index = patternParts.indexOf(`:${name}`)
  return index >= 0 && index < urlParts.length ? urlParts[index] : ''
}

// ==================== Mock 用户数据 ====================

export const MOCK_ACCESS_TOKEN = 'mock-access-token-volo-ai-2026'
export const MOCK_REFRESH_TOKEN = 'mock-refresh-token-volo-ai-2026'

export const MOCK_USER = {
  userId: 'mock-user-001',
  username: 'mock-user',
  nickname: 'Mock 用户',
  email: '3168134942@qq.com',
  phone: '13800138000',
  avatarUrl: '',
  credits: 99999,
  totalCreditsUsed: 100,
  tier: 'PRO' as const,
  billing: 'monthly' as const,
  subscription: {
    planId: 'pro',
    planName: 'Pro',
    tier: 'PRO',
    billingCycle: 'monthly',
    status: 'ACTIVE',
    startTime: '2026-01-01T00:00:00Z',
    endTime: '2027-01-01T00:00:00Z',
    autoRenew: true,
    maxModeUsesToday: 0,
    maxModeDailyLimit: 100,
  },
}

export const MOCK_USER_PROFILE = {
  userId: MOCK_USER.userId,
  username: MOCK_USER.username,
  nickname: MOCK_USER.nickname,
  email: MOCK_USER.email,
  phone: MOCK_USER.phone,
  avatarUrl: MOCK_USER.avatarUrl,
  credits: MOCK_USER.credits,
  totalCreditsUsed: MOCK_USER.totalCreditsUsed,
  tier: MOCK_USER.tier,
  subscription: MOCK_USER.subscription,
  status: 1,
  createdTime: '2026-01-01T00:00:00Z',
}

// ==================== ID 生成 ====================

let _counter = 0
export function mockId(prefix = 'mock'): string {
  return `${prefix}-${Date.now()}-${++_counter}`
}
