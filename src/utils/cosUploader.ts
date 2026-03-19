import http from '@/services/http'
import i18n from '@/i18n'

const { t } = i18n.global

/**
 * COS 上传凭证
 */
export interface UploadCredential {
  uploadUrl: string
  objectKey: string
  bucket: string
  region: string
  expiration: number
  metadata: Record<string, string>
}

/**
 * 上传进度回调
 */
export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

/**
 * 上传结果
 */
export interface UploadResult {
  fileId: string
  fileName: string
  mimeType: string
  size: number
  category: string
  url: string
  uploadTime: string
}

/**
 * COS 直传工具类
 *
 * 使用流程：
 * 1. 调用 getUploadCredential 获取上传凭证
 * 2. 调用 uploadFile 直接上传到 COS
 * 3. 调用 confirmUpload 通知后端上传完成
 */
export class CosUploader {
  private baseUrl: string

  constructor(baseUrl: string = '/files') {
    this.baseUrl = baseUrl
  }

  /**
   * 获取上传凭证（使用项目封装的 http 服务，自动携带 Token）
   */
  async getUploadCredential(
    fileName: string,
    sessionId?: string
  ): Promise<UploadCredential> {
    const params: Record<string, string> = { fileName }
    if (sessionId) {
      params.sessionId = sessionId
    }

    const response = await http.get(`${this.baseUrl}/upload/credential`, { params })

    if (response.code === 200 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || t('common.upload.getCredentialFailed'))
    }
  }

  /**
   * 直接上传文件到 COS（使用原生 XHR，不需要 Token）
   */
  async uploadFile(
    file: File,
    credential: UploadCredential,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // 监听上传进度
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percent: Math.round((e.loaded / e.total) * 100)
            })
          }
        })
      }

      // 监听上传完成
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(t('common.upload.failedWithStatus', { status: xhr.status, statusText: xhr.statusText })))
        }
      })

      // 监听上传错误
      xhr.addEventListener('error', () => {
        reject(new Error(t('common.upload.networkError')))
      })

      // 监听上传中止
      xhr.addEventListener('abort', () => {
        reject(new Error(t('common.upload.cancelled')))
      })

      // 发送 PUT 请求到预签名 URL
      xhr.open('PUT', credential.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.send(file)
    })
  }

  /**
   * 确认上传完成（使用项目封装的 http 服务，自动携带 Token）
   */
  async confirmUpload(
    fileName: string,
    objectKey: string,
    fileSize: number,
    mimeType: string,
    sessionId?: string
  ): Promise<UploadResult> {
    const response = await http.post(`${this.baseUrl}/upload/confirm`, {
      fileName,
      objectKey,
      fileSize,
      mimeType,
      sessionId
    })

    if (response.code === 200 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || t('common.upload.confirmFailed'))
    }
  }

  /**
   * 完整的上传流程（推荐使用）
   */
  async upload(
    file: File,
    sessionId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // 1. 获取上传凭证
      const credential = await this.getUploadCredential(file.name, sessionId)

      // 2. 直接上传到 COS
      await this.uploadFile(file, credential, onProgress)

      // 3. 确认上传完成
      const result = await this.confirmUpload(
        file.name,
        credential.objectKey,
        file.size,
        file.type || 'application/octet-stream',
        sessionId
      )

      return result
    } catch (error) {
      console.error('文件上传失败:', error)
      throw error
    }
  }

  /**
   * 批量上传文件
   */
  async uploadMultiple(
    files: File[],
    sessionId?: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await this.upload(
        file,
        sessionId,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      )
      results.push(result)
    }

    return results
  }
}

/**
 * 默认的 COS 上传器实例
 */
export const cosUploader = new CosUploader()

/**
 * 便捷的上传函数
 */
export async function uploadFileToCos(
  file: File,
  sessionId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return cosUploader.upload(file, sessionId, onProgress)
}

/**
 * 便捷的批量上传函数
 */
export async function uploadFilesToCos(
  files: File[],
  sessionId?: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  return cosUploader.uploadMultiple(files, sessionId, onProgress)
}
