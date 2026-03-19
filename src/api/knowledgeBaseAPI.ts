import http from '@/services/http'
import type { ResponseResult } from '@/types/http'

export interface RagflowParserConfig {
  chunkTokenNum?: number | null
  delimiter?: string | null
  layoutRecognize?: string | null
}

export interface KnowledgeBase {
  id: string
  name: string
  description: string | null
  ragflowDatasetId: string
  avatar: string | null
  language?: string | null
  embeddingModel?: string | null
  chunkMethod?: string | null
  permission?: string | null
  documentCount?: number | null
  chunkCount?: number | null
  tokenNum?: number | null
  folderId?: string | null
  status?: number | null
  createTime?: number | null
  updateTime?: number | null
  parserConfig?: RagflowParserConfig | null
}

export interface KbFolder {
  id: string | null
  name: string
  parentId: string | null
}

export interface CreateKnowledgeBaseRequest {
  name: string
  description?: string | null
  avatar?: string | null

  // RagFlow Dataset advanced create params (Pro+)
  embeddingModel?: string | null
  language?: string | null
  chunkMethod?: string | null
  permission?: string | null
  parserConfig?: {
    chunkTokenNum?: number | null
    delimiter?: string | null
    layoutRecognize?: string | null
  } | null
}

export async function listKnowledgeBases(): Promise<ResponseResult<KnowledgeBase[]>> {
  return http.get('/kb/knowledge-bases')
}

export async function createKnowledgeBase(
  request: CreateKnowledgeBaseRequest
): Promise<ResponseResult<KnowledgeBase>> {
  return http.post('/kb/knowledge-bases', request)
}

export async function updateKnowledgeBase(
  id: string,
  request: Partial<CreateKnowledgeBaseRequest>
): Promise<ResponseResult<KnowledgeBase>> {
  return http.put(`/kb/knowledge-bases/${id}`, request)
}

export async function deleteKnowledgeBase(id: string): Promise<ResponseResult<null>> {
  return http.delete(`/kb/knowledge-bases/${id}`)
}
