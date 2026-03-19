import type { InternalAxiosRequestConfig } from 'axios'
import { ok, error, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Mock Data ====================

const MOCK_PLANS: any[] = [
  {
    id: 'free',
    name: '免费版',
    description: '体验 AI 的无限可能',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlySaving: 0,
    monthlyCredits: 100,
    maxModeUsesPerMonth: 10,
    rechargeBonusRate: 0,
    overdraftLimit: 0,
    accessibleModels: ['gpt-4o-mini', 'gemini-2.0-flash', 'deepseek-v3', 'qwen-plus'],
    features: ['每月100积分', '基础模型访问', '10次/月深度推理', '社区支持'],
    highlightFeatures: ['免费开始，无需信用卡'],
    expandedFeatures: ['基础对话功能', '文本生成', '简单翻译', '知识问答'],
    creditsAnchor: '约 20 次对话/月',
    dailyCostAnchor: '¥0/天',
    isPublic: true,
    sortOrder: 0,
    badgeStyle: 'default',
    cardStyle: 'outlined',
    tierLevel: 0,
  },
  {
    id: 'pro',
    name: 'Pro 专业版',
    description: '为专业用户打造的全能方案',
    monthlyPrice: 99,
    yearlyPrice: 999,
    yearlyMonthlyPrice: 83,
    yearlySaving: 189,
    monthlyCredits: 2000,
    maxModeUsesPerMonth: -1,
    rechargeBonusRate: 0.1,
    overdraftLimit: 200,
    accessibleModels: [
      'gpt-4o', 'claude-sonnet-4-6', 'gemini-1.5-pro', 'deepseek-r1', 'qwen-max', 'grok-3',
      'gpt-4o-mini', 'gemini-2.0-flash', 'deepseek-v3', 'qwen-plus',
    ],
    features: ['每月2000积分', '全部主流模型', '无限深度推理', '优先响应', '10%充值加成'],
    highlightFeatures: ['最受欢迎', '性价比之王'],
    expandedFeatures: [
      '多模态生成（图像/视频/语音）', '知识库管理', '数字分身',
      'MCP工具调用', '对话导出', '优先技术支持',
    ],
    creditsAnchor: '约 400 次对话/月',
    dailyCostAnchor: '约 ¥3.3/天',
    isPublic: true,
    sortOrder: 1,
    badgeStyle: 'primary',
    cardStyle: 'highlighted',
    tierLevel: 1,
    tag: '推荐',
  },
  {
    id: 'turbo',
    name: 'Turbo 旗舰版',
    description: '极致性能，无限创造',
    monthlyPrice: 299,
    yearlyPrice: 2999,
    yearlyMonthlyPrice: 250,
    yearlySaving: 589,
    monthlyCredits: 10000,
    maxModeUsesPerMonth: -1,
    rechargeBonusRate: 0.2,
    overdraftLimit: 1000,
    accessibleModels: [
      'claude-opus-4-6', 'o1',
      'gpt-4o', 'claude-sonnet-4-6', 'gemini-1.5-pro', 'deepseek-r1', 'qwen-max', 'grok-3',
      'gpt-4o-mini', 'gemini-2.0-flash', 'deepseek-v3', 'qwen-plus',
    ],
    features: [
      '每月10000积分', '全部模型（含旗舰）', '20%充值加成',
      '1000积分透支额度', '专属客服',
    ],
    highlightFeatures: ['旗舰体验', '重度用户首选'],
    expandedFeatures: [
      'Claude Opus 4.6 访问', 'OpenAI o1 推理模型',
      '批量处理', 'API 访问', '团队协作（即将推出）',
    ],
    creditsAnchor: '约 2000 次对话/月',
    dailyCostAnchor: '约 ¥10/天',
    isPublic: true,
    sortOrder: 2,
    badgeStyle: 'gold',
    cardStyle: 'premium',
    tierLevel: 2,
  },
  {
    id: 'ultra',
    name: 'Ultra 至尊版',
    description: '企业级无上限方案',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    yearlyMonthlyPrice: 833,
    yearlySaving: 1989,
    monthlyCredits: 50000,
    maxModeUsesPerMonth: -1,
    rechargeBonusRate: 0.3,
    overdraftLimit: 5000,
    accessibleModels: ['*'],
    features: [
      '每月50000积分', '所有模型无限制', '30%充值加成',
      '5000积分透支', '1对1专属顾问', 'SLA保障',
    ],
    highlightFeatures: ['企业级', '不限量'],
    expandedFeatures: [
      '私有化部署支持', '自定义模型接入', '专属API额度',
      '数据安全保障', '优先功能体验',
    ],
    creditsAnchor: '约 10000 次对话/月',
    dailyCostAnchor: '约 ¥33/天',
    isPublic: false,
    sortOrder: 3,
    badgeStyle: 'diamond',
    cardStyle: 'elite',
    tierLevel: 3,
  },
]

const MOCK_CURRENT_SUBSCRIPTION: any = {
  userId: MOCK_USER.userId,
  planId: 'pro',
  billingCycle: 'monthly',
  subscriptionStartTime: '2026-01-15T00:00:00Z',
  subscriptionEndTime: '2027-01-15T00:00:00Z',
  autoRenew: true,
  totalSubscriptionAmount: 297,
  maxModeUsesThisMonth: 15,
  maxModeRemaining: -1,
  isActive: true,
  plan: MOCK_PLANS[1],
}

const MOCK_LOGS: any[] = [
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'free',
    paymentAmount: 0,
    operationSource: 'user',
    remark: '注册免费版',
    createdTime: '2026-01-01T08:00:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'upgrade',
    fromPlanId: 'free',
    toPlanId: 'pro',
    fromBillingCycle: 'monthly',
    toBillingCycle: 'monthly',
    paymentAmount: 99,
    paymentMethod: 'alipay',
    operationSource: 'user',
    remark: '升级至 Pro 专业版',
    createdTime: '2026-01-15T10:30:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'renew',
    fromPlanId: 'pro',
    toPlanId: 'pro',
    fromBillingCycle: 'monthly',
    toBillingCycle: 'monthly',
    paymentAmount: 99,
    paymentMethod: 'alipay',
    operationSource: 'system',
    remark: '自动续费 Pro 专业版',
    createdTime: '2026-02-01T00:00:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 50,
    paymentMethod: 'alipay',
    operationSource: 'user',
    remark: '充值 50 积分（加赠 10%，实得 55）',
    createdTime: '2026-02-10T14:20:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 0,
    operationSource: 'system',
    remark: '每日积分领取 +50',
    createdTime: '2026-02-15T09:00:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'renew',
    fromPlanId: 'pro',
    toPlanId: 'pro',
    fromBillingCycle: 'monthly',
    toBillingCycle: 'monthly',
    paymentAmount: 99,
    paymentMethod: 'wechat',
    operationSource: 'system',
    remark: '自动续费 Pro 专业版',
    createdTime: '2026-03-01T00:00:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 100,
    paymentMethod: 'wechat',
    operationSource: 'user',
    remark: '充值 100 积分（加赠 10%，实得 110）',
    createdTime: '2026-03-05T16:45:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 0,
    operationSource: 'system',
    remark: '每日积分领取 +50',
    createdTime: '2026-03-08T09:00:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 200,
    paymentMethod: 'alipay',
    operationSource: 'user',
    remark: '充值 200 积分（加赠 10%，实得 220）',
    createdTime: '2026-03-10T11:30:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 0,
    operationSource: 'system',
    remark: '邀请好友奖励 +100 积分',
    createdTime: '2026-03-12T20:00:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 0,
    operationSource: 'system',
    remark: '每日积分领取 +50',
    createdTime: '2026-03-15T09:00:00Z',
  },
  {
    id: mockId('log'),
    userId: MOCK_USER.userId,
    operationType: 'subscribe',
    toPlanId: 'pro',
    toBillingCycle: 'monthly',
    paymentAmount: 50,
    paymentMethod: 'wechat',
    operationSource: 'user',
    remark: '充值 50 积分（加赠 10%，实得 55）',
    createdTime: '2026-03-18T13:15:00Z',
  },
]

let maxModeUsedCount = 15

// ==================== Handler ====================

export default function subscriptionMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // GET /public/subscription/plans/:id
  if (method === 'get' && match('/public/subscription/plans/:id', url)) {
    const planId = param('/public/subscription/plans/:id', url, 'id')
    const plan = MOCK_PLANS.find((p) => p.id === planId)
    return plan ? ok(plan) : error(404, '套餐不存在')
  }

  // GET /public/subscription/plans
  if (method === 'get' && match('/public/subscription/plans', url)) {
    return ok(MOCK_PLANS)
  }

  // GET /public/subscription/current
  if (method === 'get' && match('/public/subscription/current', url)) {
    return ok(MOCK_CURRENT_SUBSCRIPTION)
  }

  // POST /public/subscription/subscribe
  if (method === 'post' && match('/public/subscription/subscribe', url)) {
    const body = parseBody(config.data)
    const targetPlan = MOCK_PLANS.find((p) => p.id === body.planId)
    const result: any = {
      success: true,
      operationType: 'subscribe',
      fromPlanId: MOCK_CURRENT_SUBSCRIPTION.planId,
      toPlanId: body.planId || 'pro',
      billingCycle: body.billingCycle || 'monthly',
      paymentAmount: targetPlan?.monthlyPrice ?? 99,
      subscriptionStartTime: new Date().toISOString(),
      subscriptionEndTime: '2027-03-19T00:00:00Z',
    }
    return ok(result)
  }

  // POST /public/subscription/cancel
  if (method === 'post' && match('/public/subscription/cancel', url)) {
    const result: any = {
      success: true,
      operationType: 'cancel',
      fromPlanId: MOCK_CURRENT_SUBSCRIPTION.planId,
      toPlanId: 'free',
      billingCycle: MOCK_CURRENT_SUBSCRIPTION.billingCycle,
    }
    return ok(result)
  }

  // POST /public/subscription/renew
  if (method === 'post' && match('/public/subscription/renew', url)) {
    const result: any = {
      success: true,
      operationType: 'renew',
      fromPlanId: 'pro',
      toPlanId: 'pro',
      billingCycle: 'monthly',
      paymentAmount: 99,
      subscriptionStartTime: new Date().toISOString(),
      subscriptionEndTime: '2027-03-19T00:00:00Z',
    }
    return ok(result)
  }

  // PUT /public/subscription/auto-renew
  if (method === 'put' && match('/public/subscription/auto-renew', url)) {
    return ok(true)
  }

  // GET /public/subscription/logs
  if (method === 'get' && match('/public/subscription/logs', url)) {
    const params = new URLSearchParams(url.split('?')[1] || '')
    const page = parseInt(params.get('page') || '1', 10)
    const pageSize = parseInt(params.get('pageSize') || '10', 10)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paged = MOCK_LOGS.slice(start, end)
    return ok({
      records: paged,
      total: MOCK_LOGS.length,
      page,
      pageSize,
    })
  }

  // GET /public/subscription/max-mode/check
  if (method === 'get' && match('/public/subscription/max-mode/check', url)) {
    const result: any = {
      allowed: true,
      usedCount: maxModeUsedCount,
      limitCount: -1,
      remainingCount: -1,
      message: 'Pro 用户无限深度推理',
      planId: 'pro',
    }
    return ok(result)
  }

  // POST /public/subscription/max-mode/use
  if (method === 'post' && match('/public/subscription/max-mode/use', url)) {
    maxModeUsedCount++
    const result: any = {
      allowed: true,
      usedCount: maxModeUsedCount,
      limitCount: -1,
      remainingCount: -1,
      message: 'Pro 用户无限深度推理',
      planId: 'pro',
    }
    return ok(result)
  }

  return null
}
