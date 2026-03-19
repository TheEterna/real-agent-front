import http from '@/services/http'
import type { ResponseResult } from '@/types/http'
import type { MemoryAlbum, SearchMemoryAlbumRequest } from '@/types/memoryAlbum'

export const memoryAlbumApi = {
  upload: async (formData: FormData): Promise<ResponseResult<MemoryAlbum>> => {
    return (await http.post('/memories/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data
  },

  getList: async (page = 0, pageSize = 20): Promise<ResponseResult<MemoryAlbum[]>> => {
    return (await http.get('/memories/list', { params: { page, pageSize } })).data
  },

  search: async (request: SearchMemoryAlbumRequest): Promise<ResponseResult<MemoryAlbum[]>> => {
    return (await http.post('/memories/search', request)).data
  },

  delete: async (memoryId: string): Promise<ResponseResult<void>> => {
    return (await http.delete(`/memories/${memoryId}`)).data
  }
}
