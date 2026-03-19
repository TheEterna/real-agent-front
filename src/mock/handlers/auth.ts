import type { InternalAxiosRequestConfig } from 'axios'
import {
  parseBody,
  ok,
  error,
  match,
  mockId,
  MOCK_USER,
  MOCK_USER_PROFILE,
  MOCK_ACCESS_TOKEN,
  MOCK_REFRESH_TOKEN,
} from '../shared'

/** Login success response payload */
const LOGIN_SUCCESS_DATA = {
  user: {
    userId: 'mock-user-001',
    username: 'mock-user',
    nickname: 'Mock 用户',
    email: '3168134942@qq.com',
    avatarUrl: '',
  },
  accessToken: MOCK_ACCESS_TOKEN,
  refreshToken: MOCK_REFRESH_TOKEN,
  expiresIn: 86400,
}

/** Rich user profile (richer than shared MOCK_USER_PROFILE) */
const USER_PROFILE = {
  userId: 'mock-user-001',
  username: 'mock-user',
  nickname: 'Mock 用户',
  email: '3168134942@qq.com',
  phone: '13800138000',
  avatarUrl: '',
  bio: '全栈开发工程师 | AI 爱好者 | 开源贡献者',
  credits: 99999,
  totalCreditsUsed: 12580,
  tier: 'PRO',
  subscription: {
    planId: 'pro',
    planName: 'Pro 专业版',
    tier: 'PRO',
    billingCycle: 'monthly',
    status: 'ACTIVE',
    startTime: '2026-01-01T00:00:00Z',
    endTime: '2027-01-01T00:00:00Z',
    autoRenew: true,
    maxModeUsesToday: 15,
    maxModeDailyLimit: -1,
  },
  status: 1,
  createdTime: '2025-06-15T10:00:00Z',
  lastLoginTime: '2026-03-19T08:30:00Z',
}

/** Rich user stats */
const USER_STATS = {
  conversationCount: 156,
  messageCount: 2340,
  memberDays: 278,
  totalTokensUsed: 1580000,
  totalCreditsUsed: 12580,
  favoriteModel: 'GPT-4o',
  mostActiveHour: 14,
  streakDays: 15,
  achievements: [
    { id: 'first_chat', name: '初次对话', description: '完成第一次AI对话', achievedTime: '2025-06-15' },
    { id: 'power_user', name: '深度用户', description: '累计对话超过100次', achievedTime: '2026-01-20' },
    { id: 'explorer', name: '探索者', description: '使用过5种以上AI模型', achievedTime: '2026-02-10' },
    { id: 'streak_7', name: '连续7天', description: '连续使用7天', achievedTime: '2026-03-05' },
    { id: 'streak_30', name: '月度常客', description: '连续使用30天', achievedTime: '2026-03-15' },
  ],
}

/** User portrait */
const USER_PORTRAIT = {
  nickname: 'Mock 用户',
  avatarUrl: '',
  traits: ['技术极客', '效率至上', '细节控', '创新者', '夜猫子'],
  interests: ['AI/ML', '全栈开发', '产品设计', '开源社区', '技术写作', '科幻小说'],
  communicationStyle: '简洁专业',
  preferredTopics: ['代码优化', '架构设计', 'AI应用', '效率工具'],
  sufficient: true,
}

export default function authMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // POST /auth/login
  if (method === 'post' && match('/auth/login', url)) {
    const body = parseBody(config.data)
    if (body.email === '3168134942@qq.com' && body.password === '111111') {
      return ok(LOGIN_SUCCESS_DATA)
    }
    return error(401, '邮箱或密码错误')
  }

  // POST /auth/register
  if (method === 'post' && match('/auth/register', url)) {
    const body = parseBody(config.data)
    return ok({ userId: mockId('user'), username: body.email })
  }

  // POST /auth/refresh
  if (method === 'post' && match('/auth/refresh', url)) {
    return ok({
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
      expiresIn: 86400,
    })
  }

  // POST /auth/logout
  if (method === 'post' && match('/auth/logout', url)) {
    return ok(null)
  }

  // GET /auth/me
  if (method === 'get' && match('/auth/me', url)) {
    return ok({ userId: MOCK_USER.userId })
  }

  // POST /auth/sms/send
  if (method === 'post' && match('/auth/sms/send', url)) {
    return ok(null)
  }

  // POST /auth/login/phone
  if (method === 'post' && match('/auth/login/phone', url)) {
    return ok(LOGIN_SUCCESS_DATA)
  }

  // POST /auth/email/send
  if (method === 'post' && match('/auth/email/send', url)) {
    return ok(null)
  }

  // POST /auth/login/email
  if (method === 'post' && match('/auth/login/email', url)) {
    return ok(LOGIN_SUCCESS_DATA)
  }

  // GET /user/profile
  if (method === 'get' && match('/user/profile', url)) {
    return ok(USER_PROFILE)
  }

  // PUT /user/profile
  if (method === 'put' && match('/user/profile', url)) {
    const body = parseBody(config.data)
    return ok({ ...USER_PROFILE, ...body })
  }

  // POST /user/avatar
  if (method === 'post' && match('/user/avatar', url)) {
    return ok({ avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}` })
  }

  // GET /user/stats
  if (method === 'get' && match('/user/stats', url)) {
    return ok(USER_STATS)
  }

  // GET /user/portrait
  if (method === 'get' && match('/user/portrait', url)) {
    return ok(USER_PORTRAIT)
  }

  return null
}
