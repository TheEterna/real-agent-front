import http from '@/services/http'
import type { ResponseResult, FileAttachment, FileUploadResponse } from '@/api/file'

export interface DriveFolderVO {
  id: string | null
  name: string
  parentId: string | null
}

/**
 * 上传场景类型
 */
export type UploadScene = 'chat' | 'knowledgeBase'

/**
 * 上传参数（支持场景化上传）
 */
export interface UploadParams {
  /** 自定义文件夹 ID（优先级高于 scene） */
  folderId?: string | null
  /** 场景类型 */
  scene?: UploadScene
  /** 会话 ID（scene=chat 时必填） */
  sessionId?: string
  /** 知识库名称（scene=knowledgeBase 时必填） */
  kbName?: string
}

export async function listDriveFolders(): Promise<ResponseResult<DriveFolderVO[]>> {
  return http.get('/drive/folders')
}

export async function createDriveFolder(payload: { name: string; parentId: string | null | undefined }): Promise<ResponseResult<DriveFolderVO>> {
  return http.post('/drive/folders', payload)
}

export async function renameDriveFolder(folderId: string, payload: { name: string }): Promise<ResponseResult<void>> {
  return http.put(`/drive/folders/${folderId}/rename`, payload)
}

export async function moveDriveFolder(folderId: string, payload: { parentId: string | null }): Promise<ResponseResult<void>> {
  return http.put(`/drive/folders/${folderId}/move`, payload)
}

export async function listDriveFiles(folderId: string | null | undefined): Promise<ResponseResult<FileAttachment[]>> {
  return http.get('/drive/files', { params: folderId ? { folderId } : {} })
}

export async function moveDriveFiles(payload: { fileIds: string[]; folderId: string | null | undefined }): Promise<ResponseResult<void>> {
  return http.put('/drive/files/move', payload)
}

export async function renameDriveFile(fileId: string, payload: { fileName: string }): Promise<ResponseResult<void>> {
  return http.put(`/drive/files/${fileId}/rename`, payload)
}

/**
 * 上传多个文件（支持场景化上传）
 * @param files 文件列表
 * @param params 上传参数（场景/文件夹）
 */
export async function uploadDriveFiles(files: File[], params?: UploadParams): Promise<ResponseResult<FileUploadResponse[]>> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))

  const queryParams: Record<string, string> = {}

  // 优先使用 folderId
  if (params?.folderId) {
    queryParams.folderId = params.folderId
  }
  // 否则使用场景参数
  else if (params?.scene) {
    queryParams.scene = params.scene
    if (params.scene === 'chat' && params.sessionId) {
      queryParams.sessionId = params.sessionId
    } else if (params.scene === 'knowledgeBase' && params.kbName) {
      queryParams.kbName = params.kbName
    }
  }

  return http.post('/drive/files/upload', formData, {
    params: queryParams,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 上传单个文件（支持场景化上传）
 * @param file 文件
 * @param params 上传参数（场景/文件夹）
 */
export async function uploadDriveFile(file: File, params?: UploadParams): Promise<ResponseResult<FileUploadResponse>> {
  const formData = new FormData()
  formData.append('file', file)

  const queryParams: Record<string, string> = {}

  // 优先使用 folderId
  if (params?.folderId) {
    queryParams.folderId = params.folderId
  }
  // 否则使用场景参数
  else if (params?.scene) {
    queryParams.scene = params.scene
    if (params.scene === 'chat' && params.sessionId) {
      queryParams.sessionId = params.sessionId
    } else if (params.scene === 'knowledgeBase' && params.kbName) {
      queryParams.kbName = params.kbName
    }
  }

  return http.post('/drive/files/upload/single', formData, {
    params: queryParams,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 聊天场景上传文件
 * @param files 文件列表
 * @param sessionId 会话 ID
 */
export async function uploadChatFiles(files: File[], sessionId: string): Promise<ResponseResult<FileUploadResponse[]>> {
  return uploadDriveFiles(files, { scene: 'chat', sessionId })
}

/**
 * 聊天场景上传单个文件
 * @param file 文件
 * @param sessionId 会话 ID
 */
export async function uploadChatFile(file: File, sessionId: string): Promise<ResponseResult<FileUploadResponse>> {
  return uploadDriveFile(file, { scene: 'chat', sessionId })
}

/**
 * 知识库场景上传文件
 * @param files 文件列表
 * @param kbName 知识库名称
 */
export async function uploadKnowledgeBaseFiles(files: File[], kbName: string): Promise<ResponseResult<FileUploadResponse[]>> {
  return uploadDriveFiles(files, { scene: 'knowledgeBase', kbName })
}

/**
 * 知识库场景上传单个文件
 * @param file 文件
 * @param kbName 知识库名称
 */
export async function uploadKnowledgeBaseFile(file: File, kbName: string): Promise<ResponseResult<FileUploadResponse>> {
  return uploadDriveFile(file, { scene: 'knowledgeBase', kbName })
}

export function getDrivePreviewUrl(fileId: string): string {
  return `/api/drive/files/${fileId}/preview`
}

export function getDriveDownloadUrl(fileId: string, name?: string): string {
  const encodedId = encodeURIComponent(fileId)
  if (!name) return `/api/drive/files/${encodedId}/download`
  return `/api/drive/files/${encodedId}/download?name=${encodeURIComponent(name)}`
}

