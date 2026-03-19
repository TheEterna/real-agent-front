import http from '@/services/http'
import type { ResponseResult } from '@/types/http'

export interface DocumentVO {
  id: string
  name: string
  datasetId?: string
  size?: number
  type?: string
  sourceType?: string
  chunkCount?: number
  tokenCount?: number
  status?: number
  progress?: number
  progressMsg?: string
  run?: string | number
  createTime?: number
  createdBy?: string
}

export interface ChunkVO {
  id: string
  content: string
  documentId?: string
  documentName?: string
  datasetId?: string
  positions?: number[]
  images?: string[]
  keywords?: string[]
  available?: boolean
  metadata?: Record<string, any>
  createTime?: number
}

export interface RetrievalRequest {
  question: string
  datasetIds: string[]
  topK?: number
  similarityThreshold?: number
  vectorSimilarityWeight?: number
  termSimilarityWeight?: number
  highlight?: boolean
}

export interface RetrievalChunk {
  id: string
  content: string
  documentId?: string
  documentName?: string
  datasetId?: string
  similarity?: number
  vectorSimilarity?: number
  termSimilarity?: number
  highlightContent?: string
  metadata?: Record<string, any>
}

export async function listDocuments(
  datasetId: string,
  params?: { page?: number; pageSize?: number; orderBy?: string; desc?: boolean; keywords?: string }
): Promise<ResponseResult<DocumentVO[]>> {
  return http.get(`/knowledge/datasets/${datasetId}/documents`, { params })
}

export async function parseDocuments(datasetId: string, documentIds: string[]): Promise<ResponseResult<null>> {
  return http.post(`/knowledge/datasets/${datasetId}/documents/parse`, documentIds)
}

export async function stopParsingDocuments(datasetId: string, documentIds: string[]): Promise<ResponseResult<null>> {
  return http.post(`/knowledge/datasets/${datasetId}/documents/stop-parse`, documentIds)
}

export async function listChunks(
  datasetId: string,
  documentId: string,
  params?: { page?: number; pageSize?: number; keywords?: string }
): Promise<ResponseResult<ChunkVO[]>> {
  return http.get(`/knowledge/datasets/${datasetId}/documents/${documentId}/chunks`, { params })
}

export async function updateDocument(
  datasetId: string,
  documentId: string,
  data: {
    name?: string
    meta_fields?: Record<string, any>
    chunk_method?: string
    parser_config?: any
    enabled?: number
  }
): Promise<ResponseResult<null>> {
  return http.put(`/knowledge/datasets/${datasetId}/documents/${documentId}`, data)
}

export async function updateChunk(
  datasetId: string,
  documentId: string,
  chunkId: string,
  data: {
    content?: string
    important_keywords?: string[]
    available?: boolean
  }
): Promise<ResponseResult<null>> {
  return http.put(`/knowledge/datasets/${datasetId}/documents/${documentId}/chunks/${chunkId}`, data)
}

export async function deleteChunks(
  datasetId: string,
  documentId: string,
  chunkIds: string[]
): Promise<ResponseResult<null>> {
  return http.delete(`/knowledge/datasets/${datasetId}/documents/${documentId}/chunks`, { data: chunkIds })
}

export async function retrieve(request: RetrievalRequest): Promise<ResponseResult<RetrievalChunk[]>> {
  return http.post('/knowledge/retrieval', request)
}

export interface FileIngestRequest {
  fileIds: string[]
  datasetId?: string | null
}

export interface FileConvertResultVO {
  id: string
  fileId: string
  documentId: string
}

export async function ingestFilesConvert(request: FileIngestRequest): Promise<ResponseResult<FileConvertResultVO[]>> {
  return http.post('/knowledge/ingest/files/convert', request)
}
