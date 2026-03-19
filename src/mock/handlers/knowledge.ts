import type { InternalAxiosRequestConfig } from 'axios'
import { parseBody, ok, match, param, mockId } from '../shared'

// ==================== Mock Data ====================

// --- Documents by dataset ---

const MOCK_DOCUMENTS: Record<string, any[]> = {
  'kb-001': [
    {
      id: 'doc-001',
      datasetId: 'kb-001',
      name: '产品需求文档 PRD v3.2.pdf',
      size: 3355443,
      mimeType: 'application/pdf',
      chunkCount: 45,
      tokenCount: 28000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-02-10T09:00:00Z',
      updatedTime: '2026-02-10T09:12:00Z',
    },
    {
      id: 'doc-002',
      datasetId: 'kb-001',
      name: '用户调研报告 2026Q1.docx',
      size: 1887436,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      chunkCount: 28,
      tokenCount: 16500,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-02-15T14:30:00Z',
      updatedTime: '2026-02-15T14:38:00Z',
    },
    {
      id: 'doc-003',
      datasetId: 'kb-001',
      name: '竞品分析_ChatGPT vs Claude.pdf',
      size: 2621440,
      mimeType: 'application/pdf',
      chunkCount: 22,
      tokenCount: 13200,
      status: 'parsing',
      progress: 65,
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-03-18T10:00:00Z',
      updatedTime: '2026-03-18T10:05:00Z',
    },
    {
      id: 'doc-004',
      datasetId: 'kb-001',
      name: 'API 接口文档 v2.0.md',
      size: 512000,
      mimeType: 'text/markdown',
      chunkCount: 15,
      tokenCount: 9800,
      status: 'done',
      chunkMethod: 'markdown',
      parserConfig: { chunkSize: 600, chunkOverlap: 80 },
      enabled: true,
      createdTime: '2026-01-20T16:00:00Z',
      updatedTime: '2026-01-20T16:04:00Z',
    },
  ],
  'kb-002': [
    {
      id: 'doc-005',
      datasetId: 'kb-002',
      name: 'Spring Boot 3 最佳实践.pdf',
      size: 4194304,
      mimeType: 'application/pdf',
      chunkCount: 60,
      tokenCount: 38000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-01-25T08:00:00Z',
      updatedTime: '2026-01-25T08:15:00Z',
    },
    {
      id: 'doc-006',
      datasetId: 'kb-002',
      name: 'Vue 3 组合式API指南.md',
      size: 819200,
      mimeType: 'text/markdown',
      chunkCount: 20,
      tokenCount: 12000,
      status: 'done',
      chunkMethod: 'markdown',
      parserConfig: { chunkSize: 600, chunkOverlap: 80 },
      enabled: true,
      createdTime: '2026-02-05T11:00:00Z',
      updatedTime: '2026-02-05T11:06:00Z',
    },
    {
      id: 'doc-007',
      datasetId: 'kb-002',
      name: '数据库设计规范.docx',
      size: 1258291,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      chunkCount: 0,
      tokenCount: 0,
      status: 'error',
      error: 'PDF解析失败：文件格式损坏，无法提取文本内容',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-03-01T09:30:00Z',
      updatedTime: '2026-03-01T09:31:00Z',
    },
    {
      id: 'doc-008',
      datasetId: 'kb-002',
      name: '微服务架构设计.pdf',
      size: 5242880,
      mimeType: 'application/pdf',
      chunkCount: 0,
      tokenCount: 0,
      status: 'waiting',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-03-18T15:00:00Z',
      updatedTime: '2026-03-18T15:00:00Z',
    },
  ],
  'kb-003': [
    {
      id: 'doc-009',
      datasetId: 'kb-003',
      name: 'VOLO AI 隐私政策 v2.0.pdf',
      size: 1048576,
      mimeType: 'application/pdf',
      chunkCount: 32,
      tokenCount: 19000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 400, chunkOverlap: 60 },
      enabled: true,
      createdTime: '2026-02-01T08:30:00Z',
      updatedTime: '2026-02-01T08:36:00Z',
    },
    {
      id: 'doc-010',
      datasetId: 'kb-003',
      name: '用户服务协议.pdf',
      size: 890000,
      mimeType: 'application/pdf',
      chunkCount: 25,
      tokenCount: 15000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 400, chunkOverlap: 60 },
      enabled: true,
      createdTime: '2026-02-01T09:00:00Z',
      updatedTime: '2026-02-01T09:05:00Z',
    },
    {
      id: 'doc-011',
      datasetId: 'kb-003',
      name: '个人信息保护法合规指南.docx',
      size: 1500000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      chunkCount: 40,
      tokenCount: 24000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 400, chunkOverlap: 60 },
      enabled: true,
      createdTime: '2026-02-15T10:00:00Z',
      updatedTime: '2026-02-15T10:08:00Z',
    },
  ],
  'kb-004': [
    {
      id: 'doc-012',
      datasetId: 'kb-004',
      name: 'VOLO AI 品牌手册 2026.pdf',
      size: 8388608,
      mimeType: 'application/pdf',
      chunkCount: 85,
      tokenCount: 42000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-02-10T14:00:00Z',
      updatedTime: '2026-02-10T14:20:00Z',
    },
    {
      id: 'doc-013',
      datasetId: 'kb-004',
      name: '社交媒体运营策略Q1.docx',
      size: 2097152,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      chunkCount: 35,
      tokenCount: 20000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-01-10T09:00:00Z',
      updatedTime: '2026-01-10T09:10:00Z',
    },
    {
      id: 'doc-014',
      datasetId: 'kb-004',
      name: '客户成功案例集.pdf',
      size: 6291456,
      mimeType: 'application/pdf',
      chunkCount: 70,
      tokenCount: 35000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2026-03-05T11:00:00Z',
      updatedTime: '2026-03-05T11:18:00Z',
    },
  ],
  'kb-005': [
    {
      id: 'doc-015',
      datasetId: 'kb-005',
      name: 'VoloAI 架构设计评审记录.md',
      size: 1200000,
      mimeType: 'text/markdown',
      chunkCount: 30,
      tokenCount: 18000,
      status: 'done',
      chunkMethod: 'markdown',
      parserConfig: { chunkSize: 600, chunkOverlap: 80 },
      enabled: true,
      createdTime: '2025-12-15T10:00:00Z',
      updatedTime: '2025-12-15T10:05:00Z',
    },
    {
      id: 'doc-016',
      datasetId: 'kb-005',
      name: '2026年2月线上故障复盘.md',
      size: 450000,
      mimeType: 'text/markdown',
      chunkCount: 12,
      tokenCount: 7200,
      status: 'done',
      chunkMethod: 'markdown',
      parserConfig: { chunkSize: 600, chunkOverlap: 80 },
      enabled: true,
      createdTime: '2026-02-28T16:00:00Z',
      updatedTime: '2026-02-28T16:03:00Z',
    },
    {
      id: 'doc-017',
      datasetId: 'kb-005',
      name: 'SSE 流式通信最佳实践.md',
      size: 680000,
      mimeType: 'text/markdown',
      chunkCount: 18,
      tokenCount: 10800,
      status: 'done',
      chunkMethod: 'markdown',
      parserConfig: { chunkSize: 600, chunkOverlap: 80 },
      enabled: true,
      createdTime: '2026-01-08T14:00:00Z',
      updatedTime: '2026-01-08T14:04:00Z',
    },
    {
      id: 'doc-018',
      datasetId: 'kb-005',
      name: '新人入职培训手册 v3.pdf',
      size: 3145728,
      mimeType: 'application/pdf',
      chunkCount: 50,
      tokenCount: 30000,
      status: 'done',
      chunkMethod: 'recursive',
      parserConfig: { chunkSize: 500, chunkOverlap: 50 },
      enabled: true,
      createdTime: '2025-12-01T10:00:00Z',
      updatedTime: '2025-12-01T10:12:00Z',
    },
  ],
}

// --- Chunks by document ---

const MOCK_CHUNKS: Record<string, any[]> = {
  'doc-001': [
    { id: 'chunk-001', documentId: 'doc-001', content: 'VOLO AI 的核心产品愿景是构建一个开源可控的多 Agent 协作框架。系统通过智能任务分级机制（VoloAI）自动分析用户请求的复杂度，并选择最优的执行路径，实现从简单问答到复杂任务规划的全覆盖。', important_keywords: ['VoloAI', '多Agent', '任务分级', '协作框架'], available: true, tokenCount: 128, position: 0 },
    { id: 'chunk-002', documentId: 'doc-001', content: '产品采用四级任务分级体系：DIRECT（直接回答）、SIMPLE（简单工具调用）、THOUGHT（深度推理）、COMPLEX（复杂任务分解）。每个级别对应不同的执行策略和资源消耗，确保响应效率与质量的平衡。', important_keywords: ['任务分级', 'DIRECT', 'SIMPLE', 'THOUGHT', 'COMPLEX'], available: true, tokenCount: 135, position: 1 },
    { id: 'chunk-003', documentId: 'doc-001', content: '用户体验核心指标：首字节响应时间 < 500ms，流式输出帧率 ≥ 30fps，工具调用可视化延迟 < 200ms。所有交互操作必须在 200ms 内提供视觉反馈，遵循 Don Norman 的即时反馈原则。', important_keywords: ['用户体验', '响应时间', '流式输出', 'Norman'], available: true, tokenCount: 142, position: 2 },
    { id: 'chunk-004', documentId: 'doc-001', content: 'MCP（Model Context Protocol）工具生态是 VOLO AI 的差异化竞争优势。通过标准化的工具注册与发现机制，系统可以动态集成搜索引擎、地图服务、代码执行器等外部能力，避免供应商锁定。', important_keywords: ['MCP', '工具生态', '标准化', '动态集成'], available: true, tokenCount: 130, position: 3 },
    { id: 'chunk-005', documentId: 'doc-001', content: '数字分身功能允许用户创建具有独立人格和记忆的 AI 角色。每个分身拥有自主对话能力、知识库绑定和行为偏好设定，可用于客服代理、个人助手、知识顾问等多种场景。', important_keywords: ['数字分身', 'AI角色', '自主对话', '知识库'], available: true, tokenCount: 118, position: 4 },
  ],
  'doc-002': [
    { id: 'chunk-006', documentId: 'doc-002', content: '2026年Q1用户调研覆盖 320 名目标用户，其中开发者占比 45%、产品经理 25%、研究人员 20%、其他 10%。调研方式包括深度访谈（30人）、在线问卷（290人）和可用性测试（15人）。', important_keywords: ['用户调研', '开发者', '产品经理', '可用性测试'], available: true, tokenCount: 140, position: 0 },
    { id: 'chunk-007', documentId: 'doc-002', content: '核心发现：78% 的用户认为现有 AI 助手的工具调用透明度不足，无法理解 AI 的决策过程。65% 的用户希望能自定义 Agent 的行为策略，而非被动接受单一推理模式。', important_keywords: ['工具调用', '透明度', '自定义', 'Agent策略'], available: true, tokenCount: 125, position: 1 },
    { id: 'chunk-008', documentId: 'doc-002', content: '用户留存分析显示，首周留存率 62%，月留存率 38%。流失主要原因：响应速度不稳定（32%）、工具调用失败率高（28%）、缺乏个性化配置（22%）、界面操作复杂（18%）。', important_keywords: ['留存率', '流失原因', '响应速度', '个性化'], available: true, tokenCount: 132, position: 2 },
  ],
  'doc-005': [
    { id: 'chunk-009', documentId: 'doc-005', content: 'Spring Boot 3 引入了对 GraalVM 原生镜像的一级支持。通过 AOT（Ahead-of-Time）编译，应用启动时间可从数秒降低到毫秒级，内存占用减少 50% 以上，特别适合 Serverless 和微服务场景。', important_keywords: ['Spring Boot 3', 'GraalVM', 'AOT', '原生镜像'], available: true, tokenCount: 138, position: 0 },
    { id: 'chunk-010', documentId: 'doc-005', content: 'Project Reactor 是 Spring WebFlux 的底层响应式库。核心概念包括 Mono（0或1个元素）和 Flux（0到N个元素）。在 VOLO AI 中，SSE 流式响应通过 Flux<ServerSentEvent> 实现，确保端到端非阻塞。', important_keywords: ['Reactor', 'WebFlux', 'Mono', 'Flux', 'SSE'], available: true, tokenCount: 145, position: 1 },
    { id: 'chunk-011', documentId: 'doc-005', content: 'R2DBC（Reactive Relational Database Connectivity）是响应式数据库访问标准。与传统 JDBC 不同，R2DBC 不会阻塞线程等待数据库响应，而是通过回调机制异步处理结果集，与 Reactor 链路天然兼容。', important_keywords: ['R2DBC', '响应式', '非阻塞', '异步'], available: true, tokenCount: 140, position: 2 },
    { id: 'chunk-012', documentId: 'doc-005', content: 'Spring AI 提供了统一的 LLM 抽象层，支持 OpenAI、Gemini、通义千问等多模型切换。通过 ChatModel 接口，业务代码无需感知底层模型差异，只需修改配置即可切换供应商。', important_keywords: ['Spring AI', 'LLM', 'ChatModel', '多模型'], available: true, tokenCount: 128, position: 3 },
  ],
  'doc-006': [
    { id: 'chunk-013', documentId: 'doc-006', content: 'Vue 3 组合式 API 的核心思想是将相关逻辑聚合在一起，而非按选项类型分散。一个功能的响应式状态（ref/reactive）、计算属性（computed）、方法和生命周期钩子可以封装为一个 composable 函数。', important_keywords: ['Vue 3', '组合式API', 'composable', '响应式'], available: true, tokenCount: 135, position: 0 },
    { id: 'chunk-014', documentId: 'doc-006', content: 'Pinia 是 Vue 3 官方推荐的状态管理库，相比 Vuex 4 移除了 mutations 概念，直接通过 actions 修改状态。在 VOLO AI 中，每个 Store 遵循 SWR 模式：先从 localStorage 水合缓存，再后台刷新最新数据。', important_keywords: ['Pinia', '状态管理', 'SWR', 'localStorage'], available: true, tokenCount: 142, position: 1 },
  ],
  'doc-015': [
    { id: 'chunk-015', documentId: 'doc-015', content: 'VoloAI 架构采用经典的 DDD 分层设计：Web 层（Controller）→ 应用层（Service）→ 领域层（Entity/Repository）→ 基础设施层（Agent策略/工具实现）。每层职责明确，依赖方向单向向下。', important_keywords: ['DDD', '分层架构', 'Controller', 'Service'], available: true, tokenCount: 130, position: 0 },
    { id: 'chunk-016', documentId: 'doc-015', content: 'Agent 执行策略评审结论：ThinkingAgent → ActionAgent → ObservationAgent 的三阶段循环模式被确认为最优方案。每个阶段通过 SSE 事件实时推送前端，用户可以清晰看到 AI 的思考、行动和观察过程。', important_keywords: ['Agent策略', 'ThinkingAgent', 'SSE', '三阶段循环'], available: true, tokenCount: 138, position: 1 },
    { id: 'chunk-017', documentId: 'doc-015', content: '工具注册机制采用关键词匹配方案：每个工具注册时声明一组关键词，Agent 构造时根据用户输入自动筛选相关工具。这种设计避免了每次请求都加载全量工具的性能开销。', important_keywords: ['工具注册', '关键词匹配', '性能优化'], available: true, tokenCount: 122, position: 2 },
  ],
}

// Fallback chunks for documents without specific mock data
function generateFallbackChunks(docId: string, count: number): any[] {
  const chunks = []
  for (let i = 0; i < count; i++) {
    chunks.push({
      id: `chunk-${docId}-${i}`,
      documentId: docId,
      content: `这是文档 ${docId} 的第 ${i + 1} 个文本分块。该分块包含了文档中关于系统架构设计、技术选型和实现方案的关键信息，用于支撑 RAG 检索和语义问答功能。`,
      important_keywords: ['系统架构', '技术选型', 'RAG检索'],
      available: true,
      tokenCount: 85 + Math.floor(Math.random() * 60),
      position: i,
    })
  }
  return chunks
}

// ==================== Retrieval Results ====================

const MOCK_RETRIEVAL_RESULTS = [
  {
    id: 'ret-001',
    content: 'VOLO AI 采用多 Agent 协作框架，通过 VoloAI 智能任务分级机制自动分析请求复杂度。系统支持四级任务分级：DIRECT、SIMPLE、THOUGHT、COMPLEX，每个级别对应不同的执行路径和资源分配策略。',
    score: 0.92,
    documentId: 'doc-001',
    documentName: '产品需求文档 PRD v3.2.pdf',
    datasetId: 'kb-001',
    highlights: ['多 Agent 协作框架', 'VoloAI 智能任务分级', '四级任务分级'],
    similarity: { vector: 0.92, term: 0.78 },
  },
  {
    id: 'ret-002',
    content: 'Spring AI 提供了统一的 LLM 抽象层，通过 ChatModel 接口实现多模型切换。配合 Project Reactor 的 Flux 流式处理，SSE 响应实现端到端非阻塞，确保流式输出的低延迟和高吞吐。',
    score: 0.88,
    documentId: 'doc-005',
    documentName: 'Spring Boot 3 最佳实践.pdf',
    datasetId: 'kb-002',
    highlights: ['Spring AI', 'ChatModel', 'Flux 流式处理', 'SSE'],
    similarity: { vector: 0.88, term: 0.75 },
  },
  {
    id: 'ret-003',
    content: '用户调研显示 78% 的用户认为现有 AI 助手的工具调用透明度不足。VOLO AI 通过 THINKING→ACTION→TOOL→OBSERVING 的阶段可视化，让用户实时了解 AI 的决策过程。',
    score: 0.85,
    documentId: 'doc-002',
    documentName: '用户调研报告 2026Q1.docx',
    datasetId: 'kb-001',
    highlights: ['工具调用透明度', '阶段可视化', 'THINKING→ACTION'],
    similarity: { vector: 0.85, term: 0.72 },
  },
  {
    id: 'ret-004',
    content: 'MCP（Model Context Protocol）工具生态通过标准化的工具注册与发现机制，支持动态集成搜索引擎、地图服务、代码执行器等外部能力。每个工具声明关键词集合，Agent 根据用户输入自动筛选。',
    score: 0.82,
    documentId: 'doc-001',
    documentName: '产品需求文档 PRD v3.2.pdf',
    datasetId: 'kb-001',
    highlights: ['MCP', '工具注册', '动态集成', '关键词匹配'],
    similarity: { vector: 0.82, term: 0.70 },
  },
  {
    id: 'ret-005',
    content: 'Vue 3 组合式 API 配合 Pinia 状态管理，遵循 SWR（Stale-While-Revalidate）模式。Store 从 localStorage 水合缓存数据实现即时渲染，后台异步刷新确保数据最终一致性。',
    score: 0.79,
    documentId: 'doc-006',
    documentName: 'Vue 3 组合式API指南.md',
    datasetId: 'kb-002',
    highlights: ['组合式 API', 'Pinia', 'SWR', 'localStorage'],
    similarity: { vector: 0.79, term: 0.68 },
  },
]

// ==================== URL Patterns ====================

const P_CHUNK_UPDATE = '/knowledge/datasets/:datasetId/documents/:docId/chunks/:chunkId'
const P_CHUNKS = '/knowledge/datasets/:datasetId/documents/:docId/chunks'
const P_DOC_UPDATE = '/knowledge/datasets/:datasetId/documents/:docId'
const P_DOC_PARSE = '/knowledge/datasets/:datasetId/documents/parse'
const P_DOC_STOP = '/knowledge/datasets/:datasetId/documents/stop-parse'
const P_DOC_LIST = '/knowledge/datasets/:datasetId/documents'

// ==================== Helpers ====================

function getQueryParam(url: string, key: string): string {
  const qs = url.split('?')[1]
  if (!qs) return ''
  const params = new URLSearchParams(qs)
  return params.get(key) || ''
}

function paginateAndFilter<T extends Record<string, any>>(
  items: T[],
  url: string,
  searchField: string,
): T[] {
  const keywords = getQueryParam(url, 'keywords')
  const page = parseInt(getQueryParam(url, 'page') || '1', 10)
  const pageSize = parseInt(getQueryParam(url, 'pageSize') || '20', 10)

  let filtered = items
  if (keywords) {
    const kw = keywords.toLowerCase()
    filtered = items.filter(item =>
      String(item[searchField] || '').toLowerCase().includes(kw),
    )
  }

  const start = (page - 1) * pageSize
  return filtered.slice(start, start + pageSize)
}

// ==================== Handler ====================

export default function knowledgeMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // --- PUT /knowledge/datasets/:datasetId/documents/:docId/chunks/:chunkId ---
  if (method === 'put' && match(P_CHUNK_UPDATE, url)) {
    const body = parseBody(config.data)
    const chunkId = param(P_CHUNK_UPDATE, url, 'chunkId')
    return ok({ id: chunkId, ...body, updatedTime: new Date().toISOString() })
  }

  // --- DELETE /knowledge/datasets/:datasetId/documents/:docId/chunks ---
  if (method === 'delete' && match(P_CHUNKS, url)) {
    return ok(null)
  }

  // --- GET /knowledge/datasets/:datasetId/documents/:docId/chunks ---
  if (method === 'get' && match(P_CHUNKS, url)) {
    const docId = param(P_CHUNKS, url, 'docId')
    const datasetId = param(P_CHUNKS, url, 'datasetId')
    let chunks = MOCK_CHUNKS[docId]
    if (!chunks) {
      // Find document to get chunkCount for fallback generation
      const docs = MOCK_DOCUMENTS[datasetId] || []
      const doc = docs.find(d => d.id === docId)
      const count = doc ? Math.min(doc.chunkCount, 5) : 3
      chunks = generateFallbackChunks(docId, count)
    }
    const filtered = paginateAndFilter(chunks, url, 'content')
    return ok(filtered)
  }

  // --- POST /knowledge/datasets/:datasetId/documents/parse ---
  if (method === 'post' && match(P_DOC_PARSE, url)) {
    return ok(null)
  }

  // --- POST /knowledge/datasets/:datasetId/documents/stop-parse ---
  if (method === 'post' && match(P_DOC_STOP, url)) {
    return ok(null)
  }

  // --- PUT /knowledge/datasets/:datasetId/documents/:docId ---
  if (method === 'put' && match(P_DOC_UPDATE, url)) {
    const docId = param(P_DOC_UPDATE, url, 'docId')
    const body = parseBody(config.data)
    return ok({ id: docId, ...body, updatedTime: new Date().toISOString() })
  }

  // --- GET /knowledge/datasets/:datasetId/documents ---
  if (method === 'get' && match(P_DOC_LIST, url)) {
    const datasetId = param(P_DOC_LIST, url, 'datasetId')
    const docs = MOCK_DOCUMENTS[datasetId] || []
    const filtered = paginateAndFilter(docs, url, 'name')
    return ok(filtered)
  }

  // --- POST /knowledge/retrieval ---
  if (method === 'post' && match('/knowledge/retrieval', url)) {
    return ok(MOCK_RETRIEVAL_RESULTS)
  }

  // --- POST /knowledge/ingest/files/convert ---
  if (method === 'post' && match('/knowledge/ingest/files/convert', url)) {
    const body = parseBody(config.data)
    const fileIds: string[] = body.fileIds || []
    const results = fileIds.length > 0
      ? fileIds.map((fid: string, idx: number) => ({
          fileId: fid,
          documentId: mockId('doc'),
          status: idx === fileIds.length - 1 && fileIds.length > 3 ? 'error' as const : 'success' as const,
          name: `上传文件_${idx + 1}`,
          ...(idx === fileIds.length - 1 && fileIds.length > 3 ? { error: '文件格式不支持' } : {}),
        }))
      : [{
          fileId: mockId('file'),
          documentId: mockId('doc'),
          status: 'success' as const,
          name: '示例文件.pdf',
        }]
    return ok(results)
  }

  return null
}
