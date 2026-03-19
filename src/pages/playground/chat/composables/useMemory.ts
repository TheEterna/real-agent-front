/**
 * 记忆管理 composable
 * 对接后端 Memory API，管理记忆卡片和统计
 */
import { ref, readonly } from 'vue'
import type { MemoryCard, MemoryStats } from '../types'
import { memoryApi } from '../api/mock'

// 模块级状态（所有实例共享）
const memories = ref<MemoryCard[]>([])
const stats = ref<MemoryStats>({ total: 0, tiers: [] })
const isLoading = ref(false)

export function useMemory() {

  /** 加载记忆列表 */
  async function loadMemories(tier?: string) {
    isLoading.value = true
    try {
      memories.value = await memoryApi.list(tier)
    } catch (err) {
      console.error('[useMemory] 加载记忆失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  /** 加载记忆统计 */
  async function loadStats() {
    try {
      stats.value = await memoryApi.stats()
    } catch (err) {
      console.error('[useMemory] 加载统计失败:', err)
    }
  }

  /** 搜索记忆 */
  async function searchMemories(query: string) {
    isLoading.value = true
    try {
      if (!query.trim()) {
        memories.value = await memoryApi.list()
      } else {
        memories.value = await memoryApi.search(query)
      }
    } catch (err) {
      console.error('[useMemory] 搜索失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  /** 更新记忆 */
  async function updateMemory(memoryId: string, content: string, summary?: string) {
    const updated = await memoryApi.update(memoryId, content, summary)
    memories.value = memories.value.map(memory => (memory.id === memoryId ? updated : memory))
    return updated
  }

  /** 删除记忆 */
  async function deleteMemory(memoryId: string) {
    await memoryApi.remove(memoryId)
    memories.value = memories.value.filter(memory => memory.id !== memoryId)
    await loadStats()
  }

  /** 获取 Soul World 展示用的摘要（最多3条） */
  function getTopMemories(count = 3): string[] {
    return memories.value
      .slice(0, count)
      .map(m => m.summary || m.content)
  }

  return {
    memories: readonly(memories),
    stats: readonly(stats),
    isLoading: readonly(isLoading),
    loadMemories,
    loadStats,
    searchMemories,
    updateMemory,
    deleteMemory,
    getTopMemories,
  }
}
