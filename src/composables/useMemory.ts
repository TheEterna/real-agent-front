import { ref } from 'vue'
import { memoryPanelApi, onboardingApi } from '@/api/memory'
import { useAuthStore } from '@/stores/authStore'
import type { MemoryItem } from '@/types/memory'

export function useMemory() {
  // Memory Panel 状态
  const memories = ref<MemoryItem[]>([])
  const showMemoryPanel = ref(false)
  const memoryLoading = ref(false)

  // Onboarding 状态
  const showOnboarding = ref(false)
  const onboardingCompleted = ref(false)

  // ==================== Memory Panel ====================

  async function loadMemories(tier?: string) {
    memoryLoading.value = true
    try {
      memories.value = (await memoryPanelApi.list(tier)) || []
    } catch (error) {
      console.error('加载记忆列表失败:', error)
    } finally {
      memoryLoading.value = false
    }
  }

  async function searchMemories(query: string) {
    if (!query.trim()) {
      await loadMemories()
      return
    }
    try {
      memories.value = (await memoryPanelApi.search(query)) || []
    } catch (error) {
      console.error('搜索记忆失败:', error)
    }
  }

  async function updateMemory(id: string, content: string) {
    try {
      await memoryPanelApi.update(id, content)
      const index = memories.value.findIndex(m => m.id === id)
      if (index !== -1) {
        memories.value[index].content = content
      }
    } catch (error) {
      console.error('更新记忆失败:', error)
      throw error
    }
  }

  async function deleteMemory(id: string) {
    try {
      await memoryPanelApi.remove(id)
      memories.value = memories.value.filter(m => m.id !== id)
    } catch (error) {
      console.error('删除记忆失败:', error)
      throw error
    }
  }

  async function pinMemory(id: string, pinned: boolean) {
    try {
      await memoryPanelApi.pin(id, pinned)
      const index = memories.value.findIndex(m => m.id === id)
      if (index !== -1) {
        memories.value[index].isPinned = pinned
      }
    } catch (error) {
      console.error('固定记忆失败:', error)
      throw error
    }
  }

  async function changeTier(id: string, tier: string) {
    try {
      const updated = await memoryPanelApi.changeTier(id, tier)
      const index = memories.value.findIndex(m => m.id === id)
      if (index !== -1) {
        memories.value[index] = updated
      }
    } catch (error) {
      console.error('变更记忆层级失败:', error)
      throw error
    }
  }

  function openMemoryPanel() {
    showMemoryPanel.value = true
    loadMemories()
  }

  function closeMemoryPanel() {
    showMemoryPanel.value = false
  }

  // ==================== Onboarding ====================

  async function submitOnboarding(data: {
    userName: string
    communicationStyle: string
    useCases: string[]
    interests: string
  }) {
    try {
      const authStore = useAuthStore()
      await onboardingApi.submit(data)
      onboardingCompleted.value = true
      authStore.markOnboardingCompleted()
    } catch (error) {
      console.error('提交 Onboarding 失败:', error)
      throw error
    }
  }

  function checkOnboardingStatus() {
    const authStore = useAuthStore()
    onboardingCompleted.value = authStore.isOnboardingCompleted
    if (!onboardingCompleted.value) {
      showOnboarding.value = true
    }
  }

  return {
    // Memory Panel
    memories,
    showMemoryPanel,
    memoryLoading,
    loadMemories,
    searchMemories,
    updateMemory,
    deleteMemory,
    pinMemory,
    changeTier,
    openMemoryPanel,
    closeMemoryPanel,

    // Onboarding
    showOnboarding,
    onboardingCompleted,
    checkOnboardingStatus,
    submitOnboarding
  }
}
