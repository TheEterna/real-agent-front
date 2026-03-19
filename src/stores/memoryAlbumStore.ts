import { defineStore } from 'pinia'
import { ref } from 'vue'
import { memoryAlbumApi } from '@/api/memoryAlbum'
import type { MemoryAlbum, SearchMemoryAlbumRequest } from '@/types/memoryAlbum'
import i18n from '@/i18n'
const { t } = i18n.global

export const useMemoryAlbumStore = defineStore('memoryAlbum', () => {
  const memories = ref<MemoryAlbum[]>([])
  const isLoading = ref(false)
  const currentPage = ref(0)
  const hasMore = ref(true)

  const uploadMemory = async (file: File, userTitle?: string, userDescription?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (userTitle) formData.append('userTitle', userTitle)
    if (userDescription) formData.append('userDescription', userDescription)

    const response = await memoryAlbumApi.upload(formData)
    if (response.code === 200 && response.data) {
      memories.value.unshift(response.data)
      return response.data
    }
    throw new Error(response.message || t('storeMemoryAlbum.uploadFailed'))
  }

  const loadMemories = async (page = 0) => {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const response = await memoryAlbumApi.getList(page, 20)
      if (response.code === 200 && response.data) {
        if (page === 0) {
          memories.value = response.data
        } else {
          memories.value.push(...response.data)
        }
        hasMore.value = response.data.length === 20
        currentPage.value = page
      }
    } finally {
      isLoading.value = false
    }
  }

  const searchMemories = async (request: SearchMemoryAlbumRequest) => {
    isLoading.value = true
    try {
      const response = await memoryAlbumApi.search(request)
      if (response.code === 200 && response.data) {
        memories.value = response.data
      }
    } finally {
      isLoading.value = false
    }
  }

  const deleteMemory = async (memoryId: string) => {
    await memoryAlbumApi.delete(memoryId)
    memories.value = memories.value.filter(m => m.id !== memoryId)
  }

  return {
    memories,
    isLoading,
    hasMore,
    uploadMemory,
    loadMemories,
    searchMemories,
    deleteMemory
  }
})
