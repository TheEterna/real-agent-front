import http from '@/services/http'
import type { ResponseResult } from '@/types/http'

export type { ResponseResult } from '@/types/http'

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  fileId: string
  fileName: string
  mimeType: string
  size: number
  category: 'image' | 'text' | 'document'
  uploadTime: string
  url?: string  // COS 公开访问 URL（图片类型会返回）
}

/**
 * 附件 DTO（与后端 AttachmentDTO 对应）
 */
export interface AttachmentDTO {
  fileId: string
  fileName: string
  mimeType: string
  size: number
  category: string
  url?: string  // 公开访问 URL（图片类型优先使用此 URL 直传给 LLM）
}

export interface FileAttachment {
  id: string
  userId: string
  fileName: string
  mimeType: string
  size: number
  storagePath: string
  storageType: string
  category: string
  folderId?: string | null
  ingestStatus: string
  ragflowDocumentId: string | null
  uploadTime: string
  isDeleted: boolean
}


/**
 * 上传多个文件
 * @param files 文件列表
 * @returns 上传结果列表
 */
export async function uploadFiles(files: File[]): Promise<ResponseResult<FileUploadResponse[]>> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  return http.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传单个文件
 * @param file 文件
 * @returns 上传结果
 */
export async function uploadFile(file: File): Promise<ResponseResult<FileUploadResponse>> {
  const formData = new FormData()
  formData.append('file', file)

  return http.post('/files/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取文件内容 URL（用于预览）
 * @param fileId 文件 ID
 * @returns 文件访问 URL
 */
export function getFileUrl(fileId: string): string {
  return `/api/files/${fileId}`
}

/**
 * 删除文件
 * @param fileId 文件 ID
 */
export async function deleteFile(fileId: string): Promise<ResponseResult<string>> {
  return http.delete(`/files/${fileId}`)
}

export async function getMyFiles(): Promise<ResponseResult<FileAttachment[]>> {
  return http.get('/files/my')
}

/**
 * 将 FileUploadResponse 转换为 AttachmentDTO
 */
export function toAttachmentDTO(response: FileUploadResponse): AttachmentDTO {
  return {
    fileId: response.fileId,
    fileName: response.fileName,
    mimeType: response.mimeType,
    size: response.size,
    category: response.category,
    url: response.url  // 传递公开访问 URL
  }
}
