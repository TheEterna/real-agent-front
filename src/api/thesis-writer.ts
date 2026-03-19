/**
 * 毕业论文写作模块 API
 * Thesis Writer Module API
 */
import http from '@/services/http'
import type { ResponseResult } from '@/types/http'
import type {
  ThesisProject,
  OutlineNode,
  ChapterContent,
  CreateThesisRequest,
  UpdateThesisRequest,
  OutlineOperationRequest,
  ThesisWriteRequest,
  Citation,
  FormatCheckResultVO,
  WritingHistory,
  ThesisTemplate,
  TopicSuggestion,
  TopicRecommendRequest,
  GuidedQuestionsRequest,
  GuidedQuestionsResponse,
} from '@/types/thesis-writer'


// ==================== 论文项目 API ====================

/** 获取论文项目列表 */
export async function listProjects(): Promise<ResponseResult<ThesisProject[]>> {
  return http.get('/thesis/projects')
}

/** 获取单个论文项目 */
export async function getProject(projectId: string): Promise<ResponseResult<ThesisProject>> {
  return http.get(`/thesis/projects/${projectId}`)
}

/** 创建论文项目 */
export async function createProject(request: CreateThesisRequest): Promise<ResponseResult<ThesisProject>> {
  return http.post('/thesis/projects', request)
}

/** 更新论文项目 */
export async function updateProject(projectId: string, request: UpdateThesisRequest): Promise<ResponseResult<ThesisProject>> {
  return http.put(`/thesis/projects/${projectId}`, request)
}

/** 删除论文项目 */
export async function deleteProject(projectId: string): Promise<ResponseResult<null>> {
  return http.delete(`/thesis/projects/${projectId}`)
}

// ==================== 大纲 API ====================

/** 获取论文大纲 */
export async function getOutline(projectId: string): Promise<ResponseResult<OutlineNode[]>> {
  return http.get(`/thesis/projects/${projectId}/outline`)
}

/** 操作大纲节点（增删改移） */
export async function operateOutline(request: OutlineOperationRequest): Promise<ResponseResult<OutlineNode>> {
  return http.post('/thesis/outline/operate', request)
}

/** 批量更新大纲顺序 */
export async function reorderOutline(projectId: string, nodes: { id: string; order: number }[]): Promise<ResponseResult<null>> {
  return http.put(`/thesis/projects/${projectId}/outline/reorder`, { items: nodes })
}

// ==================== 章节内容 API ====================

/** 获取章节内容 */
export async function getChapterContent(nodeId: string): Promise<ResponseResult<ChapterContent>> {
  return http.get(`/thesis/chapters/${nodeId}/content`)
}

/** 保存章节内容 */
export async function saveChapterContent(nodeId: string, content: string): Promise<ResponseResult<ChapterContent>> {
  return http.put(`/thesis/chapters/${nodeId}/content`, { content })
}

/** 获取章节历史版本列表 */
export async function getChapterVersions(nodeId: string): Promise<ResponseResult<ChapterContent[]>> {
  return http.get(`/thesis/chapters/${nodeId}/versions`)
}

/** 恢复到指定版本 */
export async function restoreChapterVersion(nodeId: string, version: number): Promise<ResponseResult<ChapterContent>> {
  return http.post(`/thesis/chapters/${nodeId}/versions/${version}/restore`)
}

// ==================== AI 写作 API (SSE 流式) ====================
// SSE 流式写作通过 useThesisSSE composable 实现（基于 sse.js POST 请求）
// 端点: /api/thesis/write/stream, /api/thesis/write/inline-stream, /api/thesis/guided/generate

// ==================== 文献引用 API ====================

/** 获取项目的引用列表 */
export async function getCitations(projectId: string): Promise<ResponseResult<Citation[]>> {
  return http.get(`/thesis/projects/${projectId}/citations`)
}

/** 添加引用 */
export async function addCitation(projectId: string, citation: Omit<Citation, 'id' | 'formattedText'>): Promise<ResponseResult<Citation>> {
  return http.post(`/thesis/projects/${projectId}/citations`, citation)
}

/** 更新引用 */
export async function updateCitation(citationId: string, citation: Partial<Citation>): Promise<ResponseResult<Citation>> {
  return http.put(`/thesis/citations/${citationId}`, citation)
}

/** 删除引用 */
export async function deleteCitation(citationId: string): Promise<ResponseResult<null>> {
  return http.delete(`/thesis/citations/${citationId}`)
}

/** 搜索学术文献（用于引用推荐） */
export async function searchScholar(query: string, limit?: number): Promise<ResponseResult<Citation[]>> {
  return http.get('/thesis/scholar/search', { params: { query, limit: limit || 10 } })
}

// ==================== AI 辅助 API ====================

/** 选题推荐 */
export async function recommendTopics(request: TopicRecommendRequest): Promise<ResponseResult<TopicSuggestion[]>> {
  return http.post('/thesis/topics/recommend', request)
}

/** 生成章节引导问题（AI 动态生成） */
export async function generateGuidedQuestions(request: GuidedQuestionsRequest): Promise<ResponseResult<GuidedQuestionsResponse>> {
  return http.post('/thesis/guided/questions', request)
}

// ==================== 格式检查 API ====================

/** 执行格式检查 */
export async function checkFormat(projectId: string): Promise<ResponseResult<FormatCheckResultVO>> {
  return http.post(`/thesis/projects/${projectId}/format-check`)
}

/** 执行单章节格式检查 */
export async function checkChapterFormat(nodeId: string): Promise<ResponseResult<FormatCheckResultVO>> {
  return http.post(`/thesis/chapters/${nodeId}/format-check`)
}

// ==================== 历史记录 API ====================

/** 获取写作历史 */
export async function getWritingHistory(projectId: string, params?: { nodeId?: string; page?: number; pageSize?: number }): Promise<ResponseResult<WritingHistory[]>> {
  return http.get(`/thesis/projects/${projectId}/history`, { params })
}

// ==================== 模板 API ====================

/** 获取论文模板列表 */
export async function listTemplates(degree?: 'bachelor' | 'master' | 'doctor'): Promise<ResponseResult<ThesisTemplate[]>> {
  return http.get('/thesis/templates', { params: { degree } })
}

/** 获取单个模板详情 */
export async function getTemplate(templateId: string): Promise<ResponseResult<ThesisTemplate>> {
  return http.get(`/thesis/templates/${templateId}`)
}

// ==================== 导出 API ====================

/** 导出论文为 Word 文档 */
export async function exportToWord(projectId: string): Promise<Blob> {
  const response = await http.get(`/thesis/projects/${projectId}/export/word`, {
    responseType: 'blob'
  })
  return response as unknown as Blob
}

/** 导出论文为 PDF */
export async function exportToPdf(projectId: string): Promise<Blob> {
  const response = await http.get(`/thesis/projects/${projectId}/export/pdf`, {
    responseType: 'blob'
  })
  return response as unknown as Blob
}
