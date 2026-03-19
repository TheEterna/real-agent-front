/**
 * 上传状态枚举
 */
export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'

/**
 * 附件类（支持 COS 直传状态管理）
 */
export class Attachment {
  name: string
  size: number
  file: File

  // COS 直传相关状态
  uploadStatus: UploadStatus = 'pending'
  uploadProgress: number = 0
  uploadError?: string

  // 上传成功后的信息
  fileId?: string
  url?: string  // COS 公开访问 URL
  mimeType?: string
  category?: string

  constructor(name: string, size: number, file: File) {
    this.name = name
    this.size = size
    this.file = file
    this.mimeType = file.type
  }

  get sizeKB(): number {
    return Math.round(this.size / 1024)
  }

  get isUploading(): boolean {
    return this.uploadStatus === 'uploading'
  }

  get isUploaded(): boolean {
    return this.uploadStatus === 'success'
  }

  get hasError(): boolean {
    return this.uploadStatus === 'error'
  }
}
