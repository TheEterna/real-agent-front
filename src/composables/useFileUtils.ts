import type { FileAttachment } from '@/api/file'

export type ParseStatus = 'success' | 'parsing' | 'error' | 'pending'

export interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  fileType?: 'pdf' | 'markdown' | 'image' | 'video' | 'code' | 'excel' | 'web'
  size?: string
  updatedAt?: string
  children?: FileNode[]
  status?: ParseStatus
  chunks?: number
  raw?: FileAttachment
  ragflowDocumentId?: string | null
  rawFolder?: any
}

export const bytesToSize = (bytes?: number | null): string => {
  if (!bytes && bytes !== 0) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

export const guessFileType = (mimeTypeOrType?: string | null, name?: string | null): FileNode['fileType'] => {
  const lowerName = (name || '').toLowerCase()
  const lowerType = (mimeTypeOrType || '').toLowerCase()
  if (lowerType === 'pdf' || lowerName.endsWith('.pdf')) return 'pdf'
  if (lowerType === 'md' || lowerType === 'markdown' || lowerName.endsWith('.md')) return 'markdown'
  if (lowerType === 'xls' || lowerType === 'xlsx' || lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx')) return 'excel'
  if (lowerType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].some(ext => lowerName.endsWith('.' + ext) || lowerType === ext)) return 'image'
  if (lowerType.startsWith('video/') || ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'].some(ext => lowerName.endsWith('.' + ext) || lowerType === ext)) return 'video'
  const codeExts = ['.ts', '.js', '.java', '.py', '.cpp', '.c', '.go', '.rs', '.php', '.swift']
  if (codeExts.some(ext => lowerName.endsWith(ext)) || lowerType === 'code' || lowerType.startsWith('text/')) return 'code'
  return 'web'
}

export const mapIngestStatusToParseStatus = (att: FileAttachment): ParseStatus => {
  if (att.ingestStatus === 'INGESTED') return 'success'
  if (att.ingestStatus === 'INGESTING') return 'parsing'
  if (att.ingestStatus === 'FAILED') return 'error'
  return 'pending'
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Invalid file read result'))
        return
      }
      const commaIndex = result.indexOf(',')
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const withLock = async <T>(inFlightKeys: Set<string>, key: string, fn: () => Promise<T>): Promise<T | undefined> => {
  if (inFlightKeys.has(key)) return undefined
  inFlightKeys.add(key)
  try {
    return await fn()
  } finally {
    inFlightKeys.delete(key)
  }
}
