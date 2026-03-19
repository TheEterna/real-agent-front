import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { message } from 'ant-design-vue'
import i18n from '@/i18n'
import type {
  ThesisProject,
  OutlineNode,
  CreateThesisRequest,
  UpdateThesisRequest,
  OutlineOperationRequest,
  HealthMetrics,
  GuidedQuestionItem,
} from '@/types/thesis-writer'
import {
  listProjects,
  getOutline,
  createProject,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
  operateOutline,
  getCitations,
  saveChapterContent,
} from '@/api/thesis-writer'

// ==================== SWR Cache Infrastructure ====================

const SWR_CACHE_PREFIX = 'thesis_swr_'

function readSWRCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${SWR_CACHE_PREFIX}${key}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSWRCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(`${SWR_CACHE_PREFIX}${key}`, JSON.stringify(data))
  } catch { /* quota exceeded — 静默忽略 */ }
}

// ==================== Helper ====================

function flattenOutline(nodes: OutlineNode[]): OutlineNode[] {
  const result: OutlineNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children && node.children.length > 0) {
      result.push(...flattenOutline(node.children))
    }
  }
  return result
}

function findNode(nodes: OutlineNode[], id: string): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

// ==================== Store ====================

export const useThesisStore = defineStore('thesis-writer', () => {
  const { t } = i18n.global
  // ---- Project State ----
  const projects = ref<ThesisProject[]>([])
  const currentProjectId = ref<string>('')
  const projectLoading = ref(false)

  const currentProject = computed(() =>
    projects.value.find(p => p.id === currentProjectId.value),
  )

  // ---- Outline State ----
  const outline = ref<OutlineNode[]>([])
  const outlineLoading = ref(false)
  const selectedNodeId = ref<string>('')

  // ---- View Mode ----
  const viewMode = ref<'section' | 'document'>('section')

  // ---- Citations State (供 healthMetrics 计算) ----
  const citations = ref<{ id: string }[]>([])

  // ---- Chapter Lock State (AI生成时锁定章节) ----
  const lockedNodes = ref<Set<string>>(new Set())

  // ---- Saving State (防止重复保存) ----
  const savingNodes = ref<Set<string>>(new Set())

  // ---- SWR: Chapter Content In-Memory Cache ----
  const chapterContentCache = new Map<string, string>()

  const selectedNodeTitle = computed(() => {
    const node = findNode(outline.value, selectedNodeId.value)
    return node?.title || t('thesisWriter.store.unselectedChapter')
  })

  /** 检查节点是否被AI锁定 */
  const isNodeLocked = computed(() => (nodeId: string) => lockedNodes.value.has(nodeId))

  /** 检查节点是否正在保存 */
  const isNodeSaving = computed(() => (nodeId: string) => savingNodes.value.has(nodeId))

  // ---- Health Metrics ----
  const healthMetrics = computed<HealthMetrics>(() => {
    const nodes = outline.value || []
    const flatNodes = flattenOutline(nodes)
    const completed = flatNodes.filter(n => n.status === 'completed').length
    const totalWords = flatNodes.reduce((sum, n) => sum + (n.actualWordCount || 0), 0)
    const targetWords = currentProject.value?.targetWordCount || 30000
    return {
      overallScore: Math.round((completed / Math.max(flatNodes.length, 1)) * 100),
      wordProgress: {
        current: totalWords,
        target: targetWords,
        percentage: Math.round((totalWords / targetWords) * 100),
      },
      chapterProgress: {
        completed,
        total: flatNodes.length,
        percentage: Math.round((completed / Math.max(flatNodes.length, 1)) * 100),
      },
      citationCount: citations.value.length,
      formatIssues: 0,
      lastUpdated: new Date(),
    }
  })

  // ==================== Request Dedup ====================
  let projectsRequestId = 0
  let outlineRequestId = 0

  // ==================== Actions ====================

  async function loadProjects() {
    // SWR: 首次加载时从 localStorage 恢复缓存，用户立即看到数据
    if (projects.value.length === 0) {
      const cached = readSWRCache<ThesisProject[]>('projects')
      if (cached) {
        projects.value = cached
        if (projects.value.length > 0 && !currentProjectId.value) {
          const lastPid = readSWRCache<string>('last_project_id')
          currentProjectId.value =
            (lastPid && projects.value.some(p => p.id === lastPid))
              ? lastPid
              : projects.value[0].id
        }
      }
    }

    // 请求去重
    const requestId = ++projectsRequestId
    // 仅在完全无数据时显示 loading skeleton
    const isFirstLoad = projects.value.length === 0
    if (isFirstLoad) {
      if (projectLoading.value) return
      projectLoading.value = true
    }

    try {
      const res = await listProjects()
      if (requestId !== projectsRequestId) return
      if (res.code === 200) {
        projects.value = res.data || []
        writeSWRCache('projects', projects.value)
        if (projects.value.length > 0 && !currentProjectId.value) {
          currentProjectId.value = projects.value[0].id
        }
      }
    } catch (e) {
      if (requestId !== projectsRequestId) return
      console.error('Failed to load projects:', e)
      if (isFirstLoad) {
        message.error(t('thesisWriter.store.loadProjectFailed'))
      }
    } finally {
      if (requestId === projectsRequestId) {
        projectLoading.value = false
      }
    }
  }

  async function loadOutline(projectId?: string) {
    const pid = projectId || currentProjectId.value
    if (!pid) {
      outline.value = []
      return
    }

    // SWR: 首次加载时从 localStorage 恢复缓存
    if (outline.value.length === 0) {
      const cached = readSWRCache<OutlineNode[]>(`outline_${pid}`)
      if (cached) {
        outline.value = cached
        if (outline.value.length > 0 && !selectedNodeId.value) {
          const lastNodeId = readSWRCache<string>(`last_node_${pid}`)
          selectedNodeId.value =
            (lastNodeId && findNode(outline.value, lastNodeId))
              ? lastNodeId
              : outline.value[0].id
        }
      }
    }

    // 请求去重：后发的请求覆盖先发的
    const requestId = ++outlineRequestId
    const isFirstLoad = outline.value.length === 0
    if (isFirstLoad) {
      if (outlineLoading.value) return
      outlineLoading.value = true
    }

    try {
      const res = await getOutline(pid)
      if (requestId !== outlineRequestId) return
      if (res.code === 200) {
        outline.value = res.data || []
        writeSWRCache(`outline_${pid}`, outline.value)
        if (outline.value.length > 0 && !selectedNodeId.value) {
          selectedNodeId.value = outline.value[0].id
        }
      }
    } catch (e) {
      if (requestId !== outlineRequestId) return
      console.error('Failed to load outline:', e)
      if (isFirstLoad) {
        message.error(t('thesisWriter.store.loadOutlineFailed'))
        outline.value = []
      }
    } finally {
      if (requestId === outlineRequestId) {
        outlineLoading.value = false
      }
    }
  }

  function setCurrentProjectId(id: string) {
    currentProjectId.value = id
    if (id) writeSWRCache('last_project_id', id)
  }

  function setSelectedNodeId(id: string) {
    selectedNodeId.value = id
    if (id && currentProjectId.value) {
      writeSWRCache(`last_node_${currentProjectId.value}`, id)
    }
  }

  function setViewMode(mode: 'section' | 'document') {
    viewMode.value = mode
  }

  async function handleCreateProject(request: CreateThesisRequest): Promise<ThesisProject | null> {
    try {
      const res = await createProject(request)
      if (res.code === 200 && res.data) {
        projects.value.unshift(res.data)
        currentProjectId.value = res.data.id
        return res.data
      }
    } catch (e) {
      console.error('Failed to create project:', e)
      message.error(t('thesisWriter.store.createProjectFailed'))
    }
    return null
  }

  async function handleUpdateProject(id: string, request: UpdateThesisRequest): Promise<ThesisProject | null> {
    try {
      const res = await updateProjectApi(id, request)
      if (res.code === 200 && res.data) {
        const index = projects.value.findIndex(p => p.id === id)
        if (index !== -1) {
          projects.value[index] = res.data
        }
        return res.data
      }
    } catch (e) {
      console.error('Failed to update project:', e)
      message.error(t('thesisWriter.store.updateProjectFailed'))
    }
    return null
  }

  async function handleDeleteProject(id: string) {
    try {
      const res = await deleteProjectApi(id)
      if (res.code === 200) {
        projects.value = projects.value.filter(p => p.id !== id)
        if (currentProjectId.value === id) {
          currentProjectId.value = projects.value.length > 0 ? projects.value[0].id : ''
        }
        message.success(t('thesisWriter.store.projectDeleted'))
      }
    } catch (e) {
      console.error('Failed to delete project:', e)
      message.error(t('thesisWriter.store.deleteProjectFailed'))
    }
  }

  async function handleOperateOutline(request: OutlineOperationRequest): Promise<{ id: string } | null> {
    try {
      const res = await operateOutline(request)
      if (res.code === 200 && res.data) {
        return { id: res.data.id }
      }
    } catch (e) {
      console.error('Failed to operate outline:', e)
      message.error(t('thesisWriter.store.outlineOperationFailed'))
    }
    return null
  }

  async function loadCitations(projectId: string) {
    try {
      const res = await getCitations(projectId)
      if (res.code === 200) {
        citations.value = res.data || []
      }
    } catch (e) {
      console.error('Failed to load citations:', e)
    }
  }

  // ==================== Internal Watch ====================
  // Store 自己决定何时加载大纲：当 currentProjectId 变化时自动处理
  watch(currentProjectId, async (newId) => {
    selectedNodeId.value = ''
    outline.value = []
    citations.value = []
    if (!newId) {
      return
    }
    await loadOutline(newId)
    loadCitations(newId)
  })

  // ==================== Helper 方法暴露 ====================

  /** 扁平化大纲树，返回所有节点列表 */
  function getFlatOutline(): OutlineNode[] {
    return flattenOutline(outline.value)
  }

  /** 根据 ID 查找大纲节点 */
  function getNode(id: string): OutlineNode | null {
    return findNode(outline.value, id)
  }

  // ==================== 章节锁管理 ====================

  /** 锁定节点（AI生成时调用） */
  function lockNode(nodeId: string) {
    lockedNodes.value.add(nodeId)
  }

  /** 解锁节点 */
  function unlockNode(nodeId: string) {
    lockedNodes.value.delete(nodeId)
  }

  /** 批量锁定节点 */
  function lockNodes(nodeIds: string[]) {
    nodeIds.forEach(id => lockedNodes.value.add(id))
  }

  /** 批量解锁节点 */
  function unlockNodes(nodeIds: string[]) {
    nodeIds.forEach(id => lockedNodes.value.delete(id))
  }

  /** 清空所有锁定 */
  function clearAllLocks() {
    lockedNodes.value.clear()
  }

  // ==================== 保存管理（带锁） ====================

  /**
   * 保存章节内容（带并发保护）
   * @param nodeId 节点ID
   * @param content 内容
   * @param force 是否强制保存（忽略锁定状态）
   * @returns 保存结果
   */
  async function saveContent(nodeId: string, content: string, force = false): Promise<{ success: boolean; error?: string }> {
    // 检查是否被AI锁定
    if (!force && lockedNodes.value.has(nodeId)) {
      return { success: false, error: t('thesisWriter.store.aiGeneratingChapter') }
    }

    // 检查是否正在保存中（防止重复提交）
    if (savingNodes.value.has(nodeId)) {
      return { success: false, error: t('thesisWriter.store.saveInProgress') }
    }

    savingNodes.value.add(nodeId)
    try {
      const res = await saveChapterContent(nodeId, content)
      if (res.code === 200) {
        chapterContentCache.set(nodeId, content)
        return { success: true }
      } else {
        return { success: false, error: res.message || t('thesisWriter.store.saveFailed') }
      }
    } catch (e) {
      console.error(`Failed to save content for node ${nodeId}:`, e)
      return { success: false, error: t('thesisWriter.store.networkSaveError') }
    } finally {
      savingNodes.value.delete(nodeId)
    }
  }

  /**
   * 批量保存章节（串行执行，保证顺序）
   * @param contents Map<nodeId, content>
   * @param onProgress 进度回调 (saved, total, errors)
   * @returns 保存统计
   */
  async function batchSaveContents(
    contents: Map<string, string>,
    onProgress?: (saved: number, total: number, errors: number) => void
  ): Promise<{ saved: number; errors: number; results: Map<string, boolean> }> {
    const results = new Map<string, boolean>()
    let saved = 0
    let errors = 0

    for (const [nodeId, content] of contents) {
      // 跳过被锁定的节点
      if (lockedNodes.value.has(nodeId)) {
        results.set(nodeId, false)
        errors++
        onProgress?.(saved, contents.size, errors)
        continue
      }

      const result = await saveContent(nodeId, content)
      results.set(nodeId, result.success)

      if (result.success) {
        saved++
      } else {
        errors++
      }

      onProgress?.(saved, contents.size, errors)
    }

    return { saved, errors, results }
  }

  // ==================== 章节内容 SWR 缓存 ====================

  /** 获取章节内容缓存（内存），无缓存返回 null */
  function getCachedChapterContent(nodeId: string): string | null {
    return chapterContentCache.get(nodeId) ?? null
  }

  /** 写入章节内容缓存（内存） */
  function cacheChapterContent(nodeId: string, content: string) {
    chapterContentCache.set(nodeId, content)
  }

  /** 清除单个章节缓存 */
  function invalidateChapterContentCache(nodeId: string) {
    chapterContentCache.delete(nodeId)
  }

  // ==================== 引导问题本地缓存 ====================

  const GUIDE_CACHE_PREFIX = 'thesis_guide_'

  interface GuideCache {
    questions: GuidedQuestionItem[]
    chapterTitle: string
    chapterDescription: string
    answers: Record<string, string>
    note: string
  }

  function getGuideCache(nodeId: string): GuideCache | null {
    try {
      const raw = localStorage.getItem(`${GUIDE_CACHE_PREFIX}${nodeId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function saveGuideCache(nodeId: string, data: GuideCache) {
    try {
      localStorage.setItem(`${GUIDE_CACHE_PREFIX}${nodeId}`, JSON.stringify(data))
    } catch { /* quota exceeded — 静默忽略 */ }
  }

  function clearGuideCache(nodeId: string) {
    localStorage.removeItem(`${GUIDE_CACHE_PREFIX}${nodeId}`)
  }

  // ==================== AI 建议本地缓存 ====================

  const SUGGESTION_CACHE_PREFIX = 'thesis_suggestions_'

  interface SuggestionCache {
    suggestions: { id: string; title: string; description: string }[]
  }

  function getSuggestionCache(nodeId: string): SuggestionCache | null {
    try {
      const raw = localStorage.getItem(`${SUGGESTION_CACHE_PREFIX}${nodeId}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function saveSuggestionCache(nodeId: string, data: SuggestionCache) {
    try {
      localStorage.setItem(`${SUGGESTION_CACHE_PREFIX}${nodeId}`, JSON.stringify(data))
    } catch { /* quota exceeded — 静默忽略 */ }
  }

  function clearSuggestionCache(nodeId: string) {
    localStorage.removeItem(`${SUGGESTION_CACHE_PREFIX}${nodeId}`)
  }

  // ==================== 批量引导缓存 ====================

  const BATCH_GUIDE_CACHE_KEY = 'thesis_batch_guide'

  interface BatchGuideCache {
    questions: GuidedQuestionItem[]
    chapterTitle: string
    chapterDescription: string
    answers: Record<string, string>
    note: string
  }

  function getBatchGuideCache(): BatchGuideCache | null {
    try {
      const raw = localStorage.getItem(BATCH_GUIDE_CACHE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function saveBatchGuideCache(data: BatchGuideCache) {
    try {
      localStorage.setItem(BATCH_GUIDE_CACHE_KEY, JSON.stringify(data))
    } catch { /* quota exceeded — 静默忽略 */ }
  }

  function clearBatchGuideCache() {
    localStorage.removeItem(BATCH_GUIDE_CACHE_KEY)
  }

  // ==================== Init ====================
  // Store 初始化时自动加载项目列表
  loadProjects()

  return {
    // State
    projects,
    currentProjectId,
    projectLoading,
    currentProject,
    outline,
    outlineLoading,
    selectedNodeId,
    selectedNodeTitle,
    healthMetrics,
    citations,
    viewMode,

    // Actions
    loadProjects,
    loadOutline,
    setCurrentProjectId,
    setSelectedNodeId,
    setViewMode,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    handleOperateOutline,

    // Helper
    getFlatOutline,
    getNode,

    // Guide Cache
    getGuideCache,
    saveGuideCache,
    clearGuideCache,

    // Suggestion Cache
    getSuggestionCache,
    saveSuggestionCache,
    clearSuggestionCache,

    // Batch Guide Cache
    getBatchGuideCache,
    saveBatchGuideCache,
    clearBatchGuideCache,

    // Lock State
    lockedNodes,
    savingNodes,
    isNodeLocked,
    isNodeSaving,
    lockNode,
    unlockNode,
    lockNodes,
    unlockNodes,
    clearAllLocks,

    // Save Actions
    saveContent,
    batchSaveContents,

    // SWR Chapter Cache
    getCachedChapterContent,
    cacheChapterContent,
    invalidateChapterContentCache,
  }
})
