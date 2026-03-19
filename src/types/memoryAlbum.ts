export interface MemoryAlbum {
  id: string
  fileName: string
  fileUrl: string
  mimeType: string
  width?: number
  height?: number
  aiCaption?: string
  aiTags: string[]
  aiEmotions: Record<string, number>
  aiScene?: string
  aiColors: string[]
  takenAt?: string
  locationName?: string
  userTitle?: string
  userDescription?: string
  createdTime: string
}

export interface SearchMemoryAlbumRequest {
  query: string
  limit?: number
}

export interface UploadMemoryAlbumRequest {
  file: File
  userTitle?: string
  userDescription?: string
}
