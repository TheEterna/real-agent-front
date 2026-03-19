import type { InternalAxiosRequestConfig } from 'axios'
import { ok, error, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Mock Data ====================

interface MemoryItem {
  id: string
  content: string
  summary: string
  tier: 'CORE' | 'SEMANTIC' | 'EPISODIC'
  importanceScore: number
  accessCount: number
  sourceType: 'conversation' | 'explicit' | 'inferred' | 'onboarding'
  isPinned: boolean
  createdTime: string
  updatedTime: string
}

const CORE_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-core-001',
    content: '用户是一名全栈开发工程师，主要使用 TypeScript 和 Java',
    summary: '全栈工程师，TypeScript + Java',
    tier: 'CORE',
    importanceScore: 0.98,
    accessCount: 156,
    sourceType: 'onboarding',
    isPinned: true,
    createdTime: '2026-01-15T10:00:00Z',
    updatedTime: '2026-03-18T08:30:00Z',
  },
  {
    id: 'mem-core-002',
    content: '用户偏好简洁直接的回答风格，不喜欢冗长解释',
    summary: '偏好简洁回答',
    tier: 'CORE',
    importanceScore: 0.95,
    accessCount: 203,
    sourceType: 'explicit',
    isPinned: true,
    createdTime: '2026-01-16T14:20:00Z',
    updatedTime: '2026-03-17T11:00:00Z',
  },
  {
    id: 'mem-core-003',
    content: '用户正在开发一个 AI 聊天应用（VOLO AI），是核心架构师',
    summary: 'VOLO AI 核心架构师',
    tier: 'CORE',
    importanceScore: 0.97,
    accessCount: 312,
    sourceType: 'conversation',
    isPinned: true,
    createdTime: '2026-01-20T09:00:00Z',
    updatedTime: '2026-03-19T07:00:00Z',
  },
  {
    id: 'mem-core-004',
    content: '用户的技术栈：Vue 3 + Spring Boot + PostgreSQL + Redis',
    summary: '技术栈：Vue3/SpringBoot/PG/Redis',
    tier: 'CORE',
    importanceScore: 0.96,
    accessCount: 189,
    sourceType: 'onboarding',
    isPinned: false,
    createdTime: '2026-01-15T10:05:00Z',
    updatedTime: '2026-03-10T15:00:00Z',
  },
  {
    id: 'mem-core-005',
    content: '用户时区为 UTC+8（中国），工作时间通常在 9:00-23:00',
    summary: 'UTC+8，工作到深夜',
    tier: 'CORE',
    importanceScore: 0.90,
    accessCount: 87,
    sourceType: 'inferred',
    isPinned: false,
    createdTime: '2026-02-01T16:00:00Z',
    updatedTime: '2026-03-15T20:00:00Z',
  },
]

const SEMANTIC_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-sem-001',
    content: '用户喜欢用 Tailwind CSS 而不是传统 CSS',
    summary: '偏好 Tailwind CSS',
    tier: 'SEMANTIC',
    importanceScore: 0.78,
    accessCount: 45,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-05T11:30:00Z',
    updatedTime: '2026-03-12T09:00:00Z',
  },
  {
    id: 'mem-sem-002',
    content: '用户对 DDD（领域驱动设计）有深入理解',
    summary: '精通 DDD 架构',
    tier: 'SEMANTIC',
    importanceScore: 0.82,
    accessCount: 67,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-08T14:00:00Z',
    updatedTime: '2026-03-10T16:30:00Z',
  },
  {
    id: 'mem-sem-003',
    content: '用户认为代码可读性比性能更重要（除非是热路径）',
    summary: '可读性优先原则',
    tier: 'SEMANTIC',
    importanceScore: 0.75,
    accessCount: 34,
    sourceType: 'explicit',
    isPinned: false,
    createdTime: '2026-02-10T10:00:00Z',
    updatedTime: '2026-03-08T11:00:00Z',
  },
  {
    id: 'mem-sem-004',
    content: '最近在研究 MCP 协议和 Agent 架构',
    summary: '关注 MCP 协议',
    tier: 'SEMANTIC',
    importanceScore: 0.80,
    accessCount: 52,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-20T15:00:00Z',
    updatedTime: '2026-03-18T14:00:00Z',
  },
  {
    id: 'mem-sem-005',
    content: '用户喜欢在代码中使用中文注释',
    summary: '偏好中文注释',
    tier: 'SEMANTIC',
    importanceScore: 0.65,
    accessCount: 28,
    sourceType: 'inferred',
    isPinned: false,
    createdTime: '2026-02-12T09:30:00Z',
    updatedTime: '2026-03-05T10:00:00Z',
  },
  {
    id: 'mem-sem-006',
    content: '用户重视 Git 提交信息的规范性，使用 conventional commits 格式',
    summary: 'Git 提交规范化',
    tier: 'SEMANTIC',
    importanceScore: 0.70,
    accessCount: 41,
    sourceType: 'inferred',
    isPinned: false,
    createdTime: '2026-02-15T11:00:00Z',
    updatedTime: '2026-03-14T08:00:00Z',
  },
  {
    id: 'mem-sem-007',
    content: '用户偏好使用 GSAP 做复杂动画，而非 CSS transition',
    summary: '动画用 GSAP',
    tier: 'SEMANTIC',
    importanceScore: 0.68,
    accessCount: 22,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-18T16:00:00Z',
    updatedTime: '2026-03-16T12:00:00Z',
  },
  {
    id: 'mem-sem-008',
    content: '用户对响应式编程（Reactor/RxJS）有丰富经验',
    summary: '精通响应式编程',
    tier: 'SEMANTIC',
    importanceScore: 0.76,
    accessCount: 38,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-22T10:30:00Z',
    updatedTime: '2026-03-11T09:00:00Z',
  },
  {
    id: 'mem-sem-009',
    content: '用户关注产品设计美学，受 Awwwards 获奖网站启发',
    summary: '追求设计美学',
    tier: 'SEMANTIC',
    importanceScore: 0.72,
    accessCount: 19,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-01T14:00:00Z',
    updatedTime: '2026-03-17T10:00:00Z',
  },
  {
    id: 'mem-sem-010',
    content: '用户习惯使用 shadcn-vue 组件库，配合 Reka UI 底层',
    summary: '使用 shadcn-vue',
    tier: 'SEMANTIC',
    importanceScore: 0.74,
    accessCount: 55,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-25T08:00:00Z',
    updatedTime: '2026-03-18T16:00:00Z',
  },
  {
    id: 'mem-sem-011',
    content: '用户倾向于使用 Pinia 进行状态管理，遵循 SWR 数据获取模式',
    summary: 'Pinia + SWR 模式',
    tier: 'SEMANTIC',
    importanceScore: 0.71,
    accessCount: 33,
    sourceType: 'inferred',
    isPinned: false,
    createdTime: '2026-03-02T11:00:00Z',
    updatedTime: '2026-03-15T14:00:00Z',
  },
  {
    id: 'mem-sem-012',
    content: '用户对数据库设计有严格要求：浮点数用 Double，时间用 OffsetDateTime，JSON 用 jsonb',
    summary: '严格数据库类型规范',
    tier: 'SEMANTIC',
    importanceScore: 0.77,
    accessCount: 29,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-28T09:00:00Z',
    updatedTime: '2026-03-13T17:00:00Z',
  },
]

const EPISODIC_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-epi-001',
    content: '2026-03-18: 用户完成了全系统 UI 优化，涉及65个页面',
    summary: '全系统 UI 优化（65页面）',
    tier: 'EPISODIC',
    importanceScore: 0.85,
    accessCount: 12,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-18T22:00:00Z',
    updatedTime: '2026-03-18T22:00:00Z',
  },
  {
    id: 'mem-epi-002',
    content: '2026-03-15: 讨论了 SSE 流式通信的重连策略',
    summary: 'SSE 重连策略讨论',
    tier: 'EPISODIC',
    importanceScore: 0.60,
    accessCount: 5,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-15T16:00:00Z',
    updatedTime: '2026-03-15T16:00:00Z',
  },
  {
    id: 'mem-epi-003',
    content: '2026-03-12: 帮助用户设计了数字分身的权限模型',
    summary: '数字分身权限模型设计',
    tier: 'EPISODIC',
    importanceScore: 0.65,
    accessCount: 8,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-12T14:00:00Z',
    updatedTime: '2026-03-12T14:00:00Z',
  },
  {
    id: 'mem-epi-004',
    content: '2026-03-10: 重构了聊天页面的消息聚合器，优化了 SSE 事件处理',
    summary: '消息聚合器重构',
    tier: 'EPISODIC',
    importanceScore: 0.58,
    accessCount: 4,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-10T18:00:00Z',
    updatedTime: '2026-03-10T18:00:00Z',
  },
  {
    id: 'mem-epi-005',
    content: '2026-03-08: 实现了知识库文件上传和向量检索功能',
    summary: '知识库向量检索实现',
    tier: 'EPISODIC',
    importanceScore: 0.62,
    accessCount: 6,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-08T20:00:00Z',
    updatedTime: '2026-03-08T20:00:00Z',
  },
  {
    id: 'mem-epi-006',
    content: '2026-03-05: 完成了社区动态模块的前端开发和联调',
    summary: '社区动态模块联调',
    tier: 'EPISODIC',
    importanceScore: 0.55,
    accessCount: 3,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-05T19:00:00Z',
    updatedTime: '2026-03-05T19:00:00Z',
  },
  {
    id: 'mem-epi-007',
    content: '2026-03-03: 讨论了 VoloAI 任务分级策略的优化方案',
    summary: 'VoloAI 分级策略优化',
    tier: 'EPISODIC',
    importanceScore: 0.70,
    accessCount: 9,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-03-03T15:00:00Z',
    updatedTime: '2026-03-03T15:00:00Z',
  },
  {
    id: 'mem-epi-008',
    content: '2026-02-28: 设计了记忆相册的 UI 原型和交互方案',
    summary: '记忆相册 UI 设计',
    tier: 'EPISODIC',
    importanceScore: 0.50,
    accessCount: 7,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-28T17:00:00Z',
    updatedTime: '2026-02-28T17:00:00Z',
  },
  {
    id: 'mem-epi-009',
    content: '2026-02-25: 修复了暗色模式下多个组件的样式问题',
    summary: '暗色模式修复批次',
    tier: 'EPISODIC',
    importanceScore: 0.52,
    accessCount: 4,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-25T21:00:00Z',
    updatedTime: '2026-02-25T21:00:00Z',
  },
  {
    id: 'mem-epi-010',
    content: '2026-02-20: 集成了 MCP 工具协议，实现了动态工具注册机制',
    summary: 'MCP 工具协议集成',
    tier: 'EPISODIC',
    importanceScore: 0.68,
    accessCount: 11,
    sourceType: 'conversation',
    isPinned: false,
    createdTime: '2026-02-20T16:00:00Z',
    updatedTime: '2026-02-20T16:00:00Z',
  },
]

const ALL_MEMORIES: MemoryItem[] = [...CORE_MEMORIES, ...SEMANTIC_MEMORIES, ...EPISODIC_MEMORIES]

const ONBOARDING_CONFIG = {
  userName: 'Mock 用户',
  communicationStyle: 'concise',
  useCases: ['coding', 'writing', 'analysis'],
  interests: 'AI, 全栈开发, 产品设计',
}

const USER_PORTRAIT = {
  nickname: 'Mock 用户',
  avatarUrl: '',
  traits: ['技术极客', '效率至上', '细节控', '创新者'],
  interests: ['AI/ML', '全栈开发', '产品设计', '开源社区', '技术写作'],
  sufficient: true,
}

const MEMORY_STATS = {
  userId: MOCK_USER.userId,
  tiers: [
    { tier: 'CORE', count: CORE_MEMORIES.length },
    { tier: 'SEMANTIC', count: SEMANTIC_MEMORIES.length },
    { tier: 'EPISODIC', count: EPISODIC_MEMORIES.length },
  ],
  total: ALL_MEMORIES.length,
}

// ==================== Helper ====================

function getQueryParam(url: string, key: string): string | null {
  const qIdx = url.indexOf('?')
  if (qIdx === -1) return null
  const params = new URLSearchParams(url.slice(qIdx))
  return params.get(key)
}

// ==================== Handler ====================

export default function memoryPanelMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // ---------- Memory CRUD ----------

  // GET /memory/stats
  if (method === 'get' && match('/memory/stats', url)) {
    return ok(MEMORY_STATS)
  }

  // GET /memory/search?q=&limit=
  if (method === 'get' && url.split('?')[0].endsWith('/memory/search')) {
    const q = (getQueryParam(url, 'q') || '').toLowerCase()
    const limit = parseInt(getQueryParam(url, 'limit') || '20', 10)
    const results = ALL_MEMORIES.filter(
      (m) => m.content.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q),
    ).slice(0, limit)
    return ok(results)
  }

  // GET /memory/onboarding/status
  if (method === 'get' && match('/memory/onboarding/status', url)) {
    return ok({ completed: true })
  }

  // GET /memory/onboarding
  if (method === 'get' && match('/memory/onboarding', url)) {
    return ok(ONBOARDING_CONFIG)
  }

  // POST /memory/onboarding
  if (method === 'post' && match('/memory/onboarding', url)) {
    const body = parseBody(config.data)
    return ok({
      ...ONBOARDING_CONFIG,
      ...body,
      completed: true,
    })
  }

  // GET /memory/:memoryId
  if (method === 'get' && match('/memory/:memoryId', url)) {
    const memoryId = param('/memory/:memoryId', url, 'memoryId')
    const item = ALL_MEMORIES.find((m) => m.id === memoryId)
    if (!item) return error(404, '记忆不存在')
    return ok(item)
  }

  // PUT /memory/:memoryId/tier
  if (method === 'put' && match('/memory/:memoryId/tier', url)) {
    const memoryId = param('/memory/:memoryId/tier', url, 'memoryId')
    const item = ALL_MEMORIES.find((m) => m.id === memoryId)
    if (!item) return error(404, '记忆不存在')
    const body = parseBody(config.data)
    return ok({
      ...item,
      tier: body.tier || item.tier,
      updatedTime: new Date().toISOString(),
    })
  }

  // PUT /memory/:memoryId/pin
  if (method === 'put' && match('/memory/:memoryId/pin', url)) {
    const memoryId = param('/memory/:memoryId/pin', url, 'memoryId')
    const item = ALL_MEMORIES.find((m) => m.id === memoryId)
    if (!item) return error(404, '记忆不存在')
    return ok({
      ...item,
      isPinned: !item.isPinned,
      updatedTime: new Date().toISOString(),
    })
  }

  // PUT /memory/:memoryId (update)
  if (method === 'put' && match('/memory/:memoryId', url)) {
    const memoryId = param('/memory/:memoryId', url, 'memoryId')
    const item = ALL_MEMORIES.find((m) => m.id === memoryId)
    if (!item) return error(404, '记忆不存在')
    const body = parseBody(config.data)
    return ok({
      ...item,
      ...body,
      id: item.id,
      updatedTime: new Date().toISOString(),
    })
  }

  // DELETE /memory/:memoryId (single soft delete)
  if (method === 'delete' && match('/memory/:memoryId', url)) {
    const memoryId = param('/memory/:memoryId', url, 'memoryId')
    const item = ALL_MEMORIES.find((m) => m.id === memoryId)
    if (!item) return error(404, '记忆不存在')
    return ok({ id: memoryId, deleted: true })
  }

  // DELETE /memory (batch delete)
  if (method === 'delete' && match('/memory', url)) {
    const body = parseBody(config.data)
    const ids: string[] = body.ids || []
    return ok({ count: ids.length, deleted: true })
  }

  // GET /memory?tier=&limit=
  if (method === 'get' && (match('/memory', url) || url.split('?')[0].endsWith('/memory'))) {
    const tier = getQueryParam(url, 'tier')
    const limit = parseInt(getQueryParam(url, 'limit') || '50', 10)
    let results = [...ALL_MEMORIES]
    if (tier) {
      results = results.filter((m) => m.tier === tier.toUpperCase())
    }
    results = results.slice(0, limit)
    return ok(results)
  }

  // ---------- User Portrait ----------

  // GET /user/portrait
  if (method === 'get' && match('/user/portrait', url)) {
    return ok(USER_PORTRAIT)
  }

  return null
}
