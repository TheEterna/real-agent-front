import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody, mockId } from '../shared'

// ==================== Mock Data ====================

const MOCK_ROLES: any[] = [
  {
    id: 'role-admin',
    roleCode: 'ADMIN',
    roleName: '系统管理员',
    description: '全部权限，可管理用户、角色、配置、内容审核等所有系统功能',
    status: true,
    createdTime: '2026-01-01T00:00:00Z',
    userCount: 1,
  },
  {
    id: 'role-moderator',
    roleCode: 'MODERATOR',
    roleName: '内容审核员',
    description: '审核权限，可审核社区动态、评论、举报内容',
    status: true,
    createdTime: '2026-01-01T00:00:00Z',
    userCount: 2,
  },
  {
    id: 'role-vip',
    roleCode: 'VIP',
    roleName: 'VIP用户',
    description: '高级功能权限，可使用高级模型、优先队列、更高额度',
    status: true,
    createdTime: '2026-01-10T00:00:00Z',
    userCount: 4,
  },
  {
    id: 'role-user',
    roleCode: 'USER',
    roleName: '普通用户',
    description: '基础功能权限，可使用基础对话、社区浏览、知识库查询',
    status: true,
    createdTime: '2026-01-01T00:00:00Z',
    userCount: 50,
  },
  {
    id: 'role-guest',
    roleCode: 'GUEST',
    roleName: '访客',
    description: '只读权限，可浏览公开内容，无法发起对话或互动',
    status: true,
    createdTime: '2026-01-01T00:00:00Z',
    userCount: 0,
  },
]

const MOCK_USERS: any[] = [
  {
    id: 'user-001',
    username: 'admin@volo.ai',
    nickname: '系统管理员',
    avatarUrl: '',
    status: 1,
    tier: 'ultra',
    credits: 999999,
    totalCreditsUsed: 500,
    createdTime: '2026-01-01T00:00:00Z',
    updatedTime: '2026-03-15T10:00:00Z',
    roles: ['role-admin'],
  },
  {
    id: 'user-002',
    username: 'zhangsan@test.com',
    nickname: '张三',
    avatarUrl: '',
    status: 1,
    tier: 'pro',
    credits: 4500,
    totalCreditsUsed: 1200,
    createdTime: '2026-01-10T08:00:00Z',
    updatedTime: '2026-03-14T14:00:00Z',
    roles: ['role-vip', 'role-user'],
  },
  {
    id: 'user-003',
    username: 'lisi@test.com',
    nickname: '李四',
    avatarUrl: '',
    status: 1,
    tier: 'free',
    credits: 80,
    totalCreditsUsed: 20,
    createdTime: '2026-02-01T12:00:00Z',
    updatedTime: '2026-03-12T09:00:00Z',
    roles: ['role-user'],
  },
  {
    id: 'user-004',
    username: 'wangwu@test.com',
    nickname: '王五',
    avatarUrl: '',
    status: 1,
    tier: 'pro',
    credits: 2000,
    totalCreditsUsed: 3500,
    createdTime: '2026-01-15T16:00:00Z',
    updatedTime: '2026-03-10T11:30:00Z',
    roles: ['role-vip'],
  },
  {
    id: 'user-005',
    username: 'zhaoliu@test.com',
    nickname: '赵六',
    avatarUrl: '',
    status: 1,
    tier: 'turbo',
    credits: 8000,
    totalCreditsUsed: 6200,
    createdTime: '2026-01-20T09:00:00Z',
    updatedTime: '2026-03-18T08:00:00Z',
    roles: ['role-vip', 'role-moderator'],
  },
  {
    id: 'user-006',
    username: 'sunqi@test.com',
    nickname: '孙七',
    avatarUrl: '',
    status: 0,
    tier: 'free',
    credits: 0,
    totalCreditsUsed: 150,
    createdTime: '2026-02-05T10:00:00Z',
    updatedTime: '2026-03-08T15:00:00Z',
    roles: ['role-user'],
  },
  {
    id: 'user-007',
    username: 'zhouba@test.com',
    nickname: '周八',
    avatarUrl: '',
    status: 1,
    tier: 'pro',
    credits: 1500,
    totalCreditsUsed: 2800,
    createdTime: '2026-02-10T14:00:00Z',
    updatedTime: '2026-03-16T12:00:00Z',
    roles: ['role-user'],
  },
  {
    id: 'user-008',
    username: 'wujiu@test.com',
    nickname: '吴九',
    avatarUrl: '',
    status: 1,
    tier: 'free',
    credits: 50,
    totalCreditsUsed: 50,
    createdTime: '2026-02-15T08:00:00Z',
    updatedTime: '2026-03-11T10:00:00Z',
    roles: ['role-user'],
  },
  {
    id: 'user-009',
    username: 'zhengshi@test.com',
    nickname: '郑十',
    avatarUrl: '',
    status: 1,
    tier: 'pro',
    credits: 3000,
    totalCreditsUsed: 4100,
    createdTime: '2026-01-25T11:00:00Z',
    updatedTime: '2026-03-17T09:30:00Z',
    roles: ['role-user'],
  },
  {
    id: 'user-010',
    username: 'test1@test.com',
    nickname: '测试用户A',
    avatarUrl: '',
    status: 2,
    tier: 'free',
    credits: 100,
    totalCreditsUsed: 0,
    createdTime: '2026-03-01T00:00:00Z',
    updatedTime: '2026-03-01T00:00:00Z',
    roles: ['role-user'],
  },
  {
    id: 'user-011',
    username: 'test2@test.com',
    nickname: '测试用户B',
    avatarUrl: '',
    status: 1,
    tier: 'free',
    credits: 100,
    totalCreditsUsed: 10,
    createdTime: '2026-03-02T00:00:00Z',
    updatedTime: '2026-03-05T14:00:00Z',
    roles: ['role-user'],
  },
  {
    id: 'user-012',
    username: 'moderator@volo.ai',
    nickname: '审核员小王',
    avatarUrl: '',
    status: 1,
    tier: 'pro',
    credits: 5000,
    totalCreditsUsed: 1800,
    createdTime: '2026-01-05T09:00:00Z',
    updatedTime: '2026-03-18T16:00:00Z',
    roles: ['role-moderator'],
  },
]

// ==================== Helpers ====================

function getQueryParam(url: string, key: string): string | null {
  const qs = url.split('?')[1]
  if (!qs) return null
  const params = new URLSearchParams(qs)
  return params.get(key)
}

function filterUsers(
  keyword?: string | null,
  status?: string | null,
): any[] {
  let result = [...MOCK_USERS]

  if (keyword) {
    const kw = keyword.toLowerCase()
    result = result.filter(
      (u) =>
        (u.nickname || '').toLowerCase().includes(kw) ||
        u.username.toLowerCase().includes(kw),
    )
  }

  if (status !== null && status !== undefined && status !== '') {
    const statusNum = Number(status)
    if (!isNaN(statusNum)) {
      result = result.filter((u) => u.status === statusNum)
    }
  }

  return result
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = page * pageSize
  const end = start + pageSize
  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages,
  }
}

// ==================== Handler ====================

export default function adminMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url || ''
  const method = (config.method || 'get').toLowerCase()

  // ---- Roles ----

  // GET /admin/roles
  if (method === 'get' && match('/admin/roles', url)) {
    return ok(MOCK_ROLES)
  }

  // ---- User role endpoints (must be before generic /admin/users/:id) ----

  // GET /admin/users/:id/roles
  if (method === 'get' && match('/admin/users/:id/roles', url)) {
    const userId = param('/admin/users/:id/roles', url, 'id')
    const user = MOCK_USERS.find((u) => u.id === userId)
    return ok(user?.roles || ['role-user'])
  }

  // PUT /admin/users/:id/roles
  if (method === 'put' && match('/admin/users/:id/roles', url)) {
    const body = parseBody(config.data)
    return ok(body.roles || body)
  }

  // ---- Users CRUD ----

  // GET /admin/users (paginated list with search/filter)
  if (method === 'get' && match('/admin/users', url)) {
    const keyword = getQueryParam(url, 'keyword')
    const status = getQueryParam(url, 'status')
    const page = parseInt(getQueryParam(url, 'page') || '0', 10)
    const pageSize = parseInt(getQueryParam(url, 'pageSize') || '20', 10)

    const filtered = filterUsers(keyword, status)
    const result = paginate(filtered, page, pageSize)
    return ok(result)
  }

  // POST /admin/users (create)
  if (method === 'post' && match('/admin/users', url)) {
    const body = parseBody(config.data)
    const now = new Date().toISOString()
    const newUser: any = {
      id: mockId('user'),
      username: body.username || 'new-user@example.com',
      nickname: body.nickname || '新用户',
      avatarUrl: body.avatarUrl || '',
      status: 1,
      tier: body.tier || 'free',
      credits: 100,
      totalCreditsUsed: 0,
      createdTime: now,
      updatedTime: now,
      roles: ['role-user'],
    }
    return ok(newUser)
  }

  // GET /admin/users/:id
  if (method === 'get' && match('/admin/users/:id', url)) {
    const userId = param('/admin/users/:id', url, 'id')
    const user = MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[0]
    return ok(user)
  }

  // PUT /admin/users/:id
  if (method === 'put' && match('/admin/users/:id', url)) {
    const userId = param('/admin/users/:id', url, 'id')
    const body = parseBody(config.data)
    const existing = MOCK_USERS.find((u) => u.id === userId) || MOCK_USERS[0]
    const updated: any = {
      ...existing,
      nickname: body.nickname ?? existing.nickname,
      avatarUrl: body.avatarUrl ?? existing.avatarUrl,
      status: body.status ?? existing.status,
      tier: body.tier ?? existing.tier,
      credits: body.credits ?? existing.credits,
      updatedTime: new Date().toISOString(),
    }
    return ok(updated)
  }

  // DELETE /admin/users/:id
  if (method === 'delete' && match('/admin/users/:id', url)) {
    return ok(null)
  }

  return null
}
