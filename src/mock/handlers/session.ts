import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody, mockId, MOCK_USER } from '../shared'

/** SessionVO 类型的 mock 数据 */
interface SessionVO {
  id: string
  title: string
  type: 'volo_ai'
  userId: string
  isPin: boolean
  createdTime: string
  updatedTime: string
}

/** Mock session data — 15 sessions with varied topics and time distribution */
const MOCK_SESSIONS: SessionVO[] = [
  // ===== Pinned (3) =====
  {
    id: 'session-001',
    title: '帮我分析 Q4 季度用户增长数据',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: true,
    createdTime: '2026-02-20T10:30:00Z',
    updatedTime: '2026-02-24T08:15:00Z',
  },
  {
    id: 'session-002',
    title: 'VOLO AI 架构设计讨论',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: true,
    createdTime: '2026-03-10T09:00:00Z',
    updatedTime: '2026-03-10T16:30:00Z',
  },
  {
    id: 'session-003',
    title: '每周学习笔记整理',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: true,
    createdTime: '2026-03-15T08:00:00Z',
    updatedTime: '2026-03-15T20:45:00Z',
  },

  // ===== Recent — within last week (5) =====
  {
    id: 'session-004',
    title: '用 Python 写一个 Web Scraper',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-18T14:00:00Z',
    updatedTime: '2026-03-18T15:30:00Z',
  },
  {
    id: 'session-005',
    title: '翻译这篇关于 Transformer 架构的论文摘要',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-18T09:20:00Z',
    updatedTime: '2026-03-18T10:05:00Z',
  },
  {
    id: 'session-006',
    title: '帮我优化这段 SQL 查询性能',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-17T11:00:00Z',
    updatedTime: '2026-03-17T12:20:00Z',
  },
  {
    id: 'session-007',
    title: 'React vs Vue 技术选型分析',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-16T16:30:00Z',
    updatedTime: '2026-03-16T18:00:00Z',
  },
  {
    id: 'session-008',
    title: '设计一个分布式缓存方案',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-15T13:00:00Z',
    updatedTime: '2026-03-15T14:45:00Z',
  },

  // ===== Older — 1-4 weeks ago (7) =====
  {
    id: 'session-009',
    title: 'Spring Boot 3 新特性总结',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-08T10:00:00Z',
    updatedTime: '2026-03-08T11:30:00Z',
  },
  {
    id: 'session-010',
    title: '写一首关于春天的诗',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-05T19:00:00Z',
    updatedTime: '2026-03-05T19:25:00Z',
  },
  {
    id: 'session-011',
    title: '帮我制定 2026 年 Q2 OKR',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-03-01T09:30:00Z',
    updatedTime: '2026-03-01T11:00:00Z',
  },
  {
    id: 'session-012',
    title: 'Kubernetes 部署最佳实践',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-02-25T14:00:00Z',
    updatedTime: '2026-02-25T16:15:00Z',
  },
  {
    id: 'session-013',
    title: 'AI Agent 论文精读：ReAct 框架',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-02-20T10:00:00Z',
    updatedTime: '2026-02-20T12:30:00Z',
  },
  {
    id: 'session-014',
    title: '重构用户认证模块方案',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-02-15T09:00:00Z',
    updatedTime: '2026-02-15T11:45:00Z',
  },
  {
    id: 'session-015',
    title: '年度技术复盘与规划',
    type: 'volo_ai',
    userId: MOCK_USER.userId,
    isPin: false,
    createdTime: '2026-02-10T10:00:00Z',
    updatedTime: '2026-02-10T13:00:00Z',
  },
]

function findSession(id: string): SessionVO | undefined {
  return MOCK_SESSIONS.find((s) => s.id === id)
}

export default function sessionMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // GET /sessions → SessionVO[]
  if (method === 'get' && match('/sessions', url)) {
    return ok(MOCK_SESSIONS)
  }

  // POST /sessions/precreate → new SessionVO
  if (method === 'post' && match('/sessions/precreate', url)) {
    const newSession: SessionVO = {
      id: mockId('session'),
      title: '',
      type: 'volo_ai',
      userId: MOCK_USER.userId,
      isPin: false,
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
    }
    return ok(newSession)
  }

  // DELETE /sessions/:id → ok(null)
  if (method === 'delete' && match('/sessions/:id', url)) {
    return ok(null)
  }

  // PUT /sessions/:id/rename → updated SessionVO
  if (method === 'put' && match('/sessions/:id/rename', url)) {
    const id = param('/sessions/:id/rename', url, 'id')
    const body = parseBody(config.data)
    const session = findSession(id)
    if (!session) {
      return ok({ id, title: body.title ?? '', type: 'volo_ai', userId: MOCK_USER.userId, isPin: false, createdTime: new Date().toISOString(), updatedTime: new Date().toISOString() })
    }
    return ok({ ...session, title: body.title ?? session.title, updatedTime: new Date().toISOString() })
  }

  // PUT /sessions/:id/pin → pinned SessionVO
  if (method === 'put' && match('/sessions/:id/pin', url)) {
    const id = param('/sessions/:id/pin', url, 'id')
    const session = findSession(id)
    if (!session) {
      return ok({ id, title: '', type: 'volo_ai', userId: MOCK_USER.userId, isPin: true, createdTime: new Date().toISOString(), updatedTime: new Date().toISOString() })
    }
    return ok({ ...session, isPin: true, updatedTime: new Date().toISOString() })
  }

  // PUT /sessions/:id/unpin → unpinned SessionVO
  if (method === 'put' && match('/sessions/:id/unpin', url)) {
    const id = param('/sessions/:id/unpin', url, 'id')
    const session = findSession(id)
    if (!session) {
      return ok({ id, title: '', type: 'volo_ai', userId: MOCK_USER.userId, isPin: false, createdTime: new Date().toISOString(), updatedTime: new Date().toISOString() })
    }
    return ok({ ...session, isPin: false, updatedTime: new Date().toISOString() })
  }

  return null
}
