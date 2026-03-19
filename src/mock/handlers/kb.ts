import type { InternalAxiosRequestConfig } from 'axios'
import { parseBody, ok, match, param, mockId } from '../shared'

// ==================== Mock Data ====================

const MOCK_KBS = [
  {
    id: 'kb-001',
    name: '产品知识库',
    description: '涵盖产品需求文档、用户调研报告、竞品分析等核心产品资料，支撑产品决策与迭代',
    documentCount: 12,
    chunkCount: 340,
    totalTokens: 180000,
    language: 'zh',
    embeddingModel: 'text-embedding-3-small',
    permission: 'team',
    createdTime: '2026-01-15T09:30:00Z',
    updatedTime: '2026-03-18T14:20:00Z',
  },
  {
    id: 'kb-002',
    name: '技术文档库',
    description: '后端架构设计、前端开发指南、API 接口文档、部署运维手册等技术资料汇总',
    documentCount: 8,
    chunkCount: 256,
    totalTokens: 120000,
    language: 'zh',
    embeddingModel: 'text-embedding-3-small',
    permission: 'team',
    createdTime: '2026-01-20T10:00:00Z',
    updatedTime: '2026-03-17T16:45:00Z',
  },
  {
    id: 'kb-003',
    name: '法律合规库',
    description: '隐私政策、用户协议、数据合规指南、GDPR/个保法相关法规文件',
    documentCount: 5,
    chunkCount: 180,
    totalTokens: 95000,
    language: 'zh',
    embeddingModel: 'text-embedding-3-small',
    permission: 'admin',
    createdTime: '2026-02-01T08:00:00Z',
    updatedTime: '2026-03-10T11:30:00Z',
  },
  {
    id: 'kb-004',
    name: '营销素材库',
    description: '品牌宣传文案、社交媒体运营素材、产品介绍PPT、客户案例集',
    documentCount: 15,
    chunkCount: 420,
    totalTokens: 200000,
    language: 'zh',
    embeddingModel: 'text-embedding-3-small',
    permission: 'team',
    createdTime: '2026-02-10T13:00:00Z',
    updatedTime: '2026-03-19T09:15:00Z',
  },
  {
    id: 'kb-005',
    name: '研发Wiki',
    description: '内部研发知识沉淀，包含技术方案评审记录、故障复盘、最佳实践、新人培训资料',
    documentCount: 20,
    chunkCount: 600,
    totalTokens: 350000,
    language: 'zh',
    embeddingModel: 'text-embedding-3-small',
    permission: 'team',
    createdTime: '2025-12-01T10:00:00Z',
    updatedTime: '2026-03-19T10:00:00Z',
  },
]

// ==================== URL Patterns ====================

const P_KB_ITEM = '/kb/knowledge-bases/:id'
const P_KB_LIST = '/kb/knowledge-bases'

// ==================== Handler ====================

export default function kbMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // --- PUT /kb/knowledge-bases/:id ---
  if (method === 'put' && match(P_KB_ITEM, url)) {
    const id = param(P_KB_ITEM, url, 'id')
    const body = parseBody(config.data)
    const existing = MOCK_KBS.find(kb => kb.id === id) || MOCK_KBS[0]
    return ok({
      ...existing,
      ...body,
      id,
      updatedTime: new Date().toISOString(),
    })
  }

  // --- DELETE /kb/knowledge-bases/:id ---
  if (method === 'delete' && match(P_KB_ITEM, url)) {
    return ok(null)
  }

  // --- GET /kb/knowledge-bases ---
  if (method === 'get' && match(P_KB_LIST, url)) {
    return ok(MOCK_KBS)
  }

  // --- POST /kb/knowledge-bases ---
  if (method === 'post' && match(P_KB_LIST, url)) {
    const body = parseBody(config.data)
    const now = new Date().toISOString()
    return ok({
      id: mockId('kb'),
      name: body.name || '新建知识库',
      description: body.description || '',
      documentCount: 0,
      chunkCount: 0,
      totalTokens: 0,
      language: body.language || 'zh',
      embeddingModel: body.embeddingModel || 'text-embedding-3-small',
      permission: body.permission || 'team',
      createdTime: now,
      updatedTime: now,
    })
  }

  return null
}
