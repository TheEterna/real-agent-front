/**
 * VOLO Canvas Pinia Store
 *
 * 画布状态管理，包括项目、节点、边、历史记录等
 *
 * @author Han
 * @since 2026-02-03
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  CanvasProject,
  CanvasNode,
  CanvasEdge,
  CanvasSnapshot,
  CanvasViewport,
  CanvasSettings
} from '@/types/canvas'
import {
  CanvasNodeType,
  DEFAULT_CANVAS_SETTINGS,
  DEFAULT_VIEWPORT
} from '@/types/canvas'
import {
  fetchCanvasProjects,
  fetchCanvasProject,
  createCanvasProject,
  saveCanvasProject,
  deleteCanvasProject,
  createNode,
  createEdge
} from '@/api/canvas'
import i18n from '@/i18n'
const { t } = i18n.global

// ==================== 缓存 Key ====================

const CACHE_PREFIX = 'volo_ai_canvas_'
const CACHE_KEYS = {
  projects: `${CACHE_PREFIX}projects`,
  currentProjectId: `${CACHE_PREFIX}current_project_id`,
  recentProjects: `${CACHE_PREFIX}recent_projects`
}

// ==================== Store 定义 ====================

export const useCanvasStore = defineStore('canvas', () => {
  // ==================== 状态 ====================

  /** 项目列表 */
  const projects = ref<CanvasProject[]>([])

  /** 当前项目 ID */
  const currentProjectId = ref<string | null>(null)

  /** 当前画布节点 */
  const nodes = ref<CanvasNode[]>([])

  /** 当前画布边 */
  const edges = ref<CanvasEdge[]>([])

  /** 选中的节点 ID 列表 */
  const selectedNodeIds = ref<string[]>([])

  /** 视口状态 */
  const viewport = ref<CanvasViewport>({ ...DEFAULT_VIEWPORT })

  /** 画布设置 */
  const settings = ref<CanvasSettings>({ ...DEFAULT_CANVAS_SETTINGS })

  /** 历史记录栈 */
  const historyStack = ref<CanvasSnapshot[]>([])

  /** 历史记录索引 */
  const historyIndex = ref(-1)

  /** 最大历史记录数 */
  const maxHistorySize = 50

  /** 加载状态 */
  const isLoading = ref(false)

  /** 保存状态 */
  const isSaving = ref(false)

  /** 是否有未保存的更改 */
  const hasUnsavedChanges = ref(false)

  /** UI 状态 */
  const showNodePalette = ref(true)
  const showPropertyPanel = ref(true)

  // ==================== 计算属性 ====================

  /** 当前项目 */
  const currentProject = computed(() => {
    if (!currentProjectId.value) return null
    return projects.value.find(p => p.id === currentProjectId.value) || null
  })

  /** 选中的节点 */
  const selectedNodes = computed(() => {
    return nodes.value.filter(n => selectedNodeIds.value.includes(n.id))
  })

  /** 是否可以撤销 */
  const canUndo = computed(() => historyIndex.value > 0)

  /** 是否可以重做 */
  const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1)

  /** 按类型分组的节点 */
  const nodesByType = computed(() => {
    const grouped: Record<CanvasNodeType, CanvasNode[]> = {} as Record<CanvasNodeType, CanvasNode[]>
    for (const type of Object.values(CanvasNodeType)) {
      grouped[type] = nodes.value.filter(n => n.type === type)
    }
    return grouped
  })

  // ==================== 缓存管理 ====================

  /** 从缓存加载 */
  function loadFromCache() {
    try {
      const cachedProjectId = localStorage.getItem(CACHE_KEYS.currentProjectId)
      if (cachedProjectId) {
        currentProjectId.value = cachedProjectId
      }
    } catch (e) {
      console.warn('[Canvas Store] 缓存加载失败:', e)
    }
  }

  /** 保存到缓存 */
  function saveToCache() {
    try {
      if (currentProjectId.value) {
        localStorage.setItem(CACHE_KEYS.currentProjectId, currentProjectId.value)
      }
    } catch (e) {
      console.warn('[Canvas Store] 缓存保存失败:', e)
    }
  }

  // 监听当前项目变化，自动保存缓存
  watch(currentProjectId, saveToCache)

  // ==================== 项目管理 ====================

  /** 加载项目列表 */
  async function loadProjects() {
    if (isLoading.value) return
    isLoading.value = true
    try {
      projects.value = await fetchCanvasProjects()
    } catch (e) {
      console.error('[Canvas Store] 加载项目列表失败:', e)
    } finally {
      isLoading.value = false
    }
  }

  /** 加载单个项目 */
  async function loadProject(projectId: string) {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const project = await fetchCanvasProject(projectId)

      if (project) {
        currentProjectId.value = project.id
        nodes.value = project.nodes
        edges.value = project.edges
        viewport.value = project.viewport
        settings.value = project.settings
        selectedNodeIds.value = []
        clearHistory()
        pushHistory()
        hasUnsavedChanges.value = false
      }
    } catch (e) {
      console.error('[Canvas Store] 加载项目失败:', e)
    } finally {
      isLoading.value = false
    }
  }

  /** 创建新项目 */
  async function createNewProject(title: string) {
    if (isLoading.value) return null
    isLoading.value = true
    try {
      const project = await createCanvasProject(title)

      projects.value.unshift(project)
      await loadProject(project.id)
      return project
    } catch (e) {
      console.error('[Canvas Store] 创建项目失败:', e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /** 保存当前项目 */
  async function saveCurrentProject() {
    if (!currentProjectId.value) return false
    if (isSaving.value) return false

    isSaving.value = true
    try {
      const project: CanvasProject = {
        id: currentProjectId.value,
        title: currentProject.value?.title || t('storeCanvas.untitledProject'),
        nodes: nodes.value,
        edges: edges.value,
        viewport: viewport.value,
        settings: settings.value,
        createdTime: currentProject.value?.createdTime || new Date().toISOString(),
        updatedTime: new Date().toISOString()
      }

      await saveCanvasProject(project)

      // 更新项目列表中的项目
      const index = projects.value.findIndex(p => p.id === project.id)
      if (index !== -1) {
        projects.value[index] = project
      }

      hasUnsavedChanges.value = false
      return true
    } catch (e) {
      console.error('[Canvas Store] 保存项目失败:', e)
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** 删除项目 */
  async function deleteProject(projectId: string) {
    try {
      await deleteCanvasProject(projectId)

      projects.value = projects.value.filter(p => p.id !== projectId)

      if (currentProjectId.value === projectId) {
        currentProjectId.value = null
        nodes.value = []
        edges.value = []
        clearHistory()
      }

      return true
    } catch (e) {
      console.error('[Canvas Store] 删除项目失败:', e)
      return false
    }
  }

  // ==================== 节点操作 ====================

  /** 添加节点 */
  function addNode(node: CanvasNode) {
    nodes.value.push(node)
    hasUnsavedChanges.value = true
    pushHistory()
  }

  /** 创建并添加节点 */
  function createAndAddNode(
    type: CanvasNodeType,
    position: { x: number; y: number },
    data?: Partial<CanvasNode['data']>
  ): CanvasNode {
    const node = createNode(type, position, data)
    addNode(node)
    return node
  }

  /** 更新节点 */
  function updateNode(nodeId: string, updates: Partial<CanvasNode>) {
    const index = nodes.value.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      nodes.value[index] = { ...nodes.value[index], ...updates }
      hasUnsavedChanges.value = true
    }
  }

  /** 更新节点数据 */
  function updateNodeData(nodeId: string, data: Partial<CanvasNode['data']>) {
    const index = nodes.value.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      nodes.value[index] = {
        ...nodes.value[index],
        data: { ...nodes.value[index].data, ...data } as CanvasNode['data']
      }
      hasUnsavedChanges.value = true
    }
  }

  /** 删除节点 */
  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    // 同时删除相关的边
    edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
    // 从选中列表中移除
    selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
    hasUnsavedChanges.value = true
    pushHistory()
  }

  /** 删除选中的节点 */
  function removeSelectedNodes() {
    const idsToRemove = [...selectedNodeIds.value]
    nodes.value = nodes.value.filter(n => !idsToRemove.includes(n.id))
    edges.value = edges.value.filter(
      e => !idsToRemove.includes(e.source) && !idsToRemove.includes(e.target)
    )
    selectedNodeIds.value = []
    hasUnsavedChanges.value = true
    pushHistory()
  }

  /** 移动节点 */
  function moveNode(nodeId: string, position: { x: number; y: number }) {
    updateNode(nodeId, { position })
  }

  // ==================== 边操作 ====================

  /** 添加边 */
  function addEdge(edge: CanvasEdge) {
    // 检查是否已存在相同的边
    const exists = edges.value.some(
      e => e.source === edge.source && e.target === edge.target
    )
    if (!exists) {
      edges.value.push(edge)
      hasUnsavedChanges.value = true
      pushHistory()
    }
  }

  /** 创建并添加边 */
  function createAndAddEdge(source: string, target: string): CanvasEdge | null {
    // 不允许自连接
    if (source === target) return null

    const edge = createEdge(source, target)
    addEdge(edge)
    return edge
  }

  /** 删除边 */
  function removeEdge(edgeId: string) {
    edges.value = edges.value.filter(e => e.id !== edgeId)
    hasUnsavedChanges.value = true
    pushHistory()
  }

  // ==================== 选择操作 ====================

  /** 选中节点 */
  function selectNode(nodeId: string, addToSelection = false) {
    if (addToSelection) {
      if (!selectedNodeIds.value.includes(nodeId)) {
        selectedNodeIds.value.push(nodeId)
      }
    } else {
      selectedNodeIds.value = [nodeId]
    }
  }

  /** 取消选中节点 */
  function deselectNode(nodeId: string) {
    selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
  }

  /** 清除所有选中 */
  function clearSelection() {
    selectedNodeIds.value = []
  }

  /** 全选 */
  function selectAll() {
    selectedNodeIds.value = nodes.value.map(n => n.id)
  }

  // ==================== 历史记录 ====================

  /** 推入历史记录 */
  function pushHistory() {
    // 如果当前不在历史记录末尾，删除后面的记录
    if (historyIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
    }

    // 添加新快照
    const snapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      timestamp: Date.now()
    }

    historyStack.value.push(snapshot)

    // 限制历史记录大小
    if (historyStack.value.length > maxHistorySize) {
      historyStack.value.shift()
    } else {
      historyIndex.value++
    }
  }

  /** 撤销 */
  function undo() {
    if (!canUndo.value) return

    historyIndex.value--
    const snapshot = historyStack.value[historyIndex.value]
    nodes.value = JSON.parse(JSON.stringify(snapshot.nodes))
    edges.value = JSON.parse(JSON.stringify(snapshot.edges))
    hasUnsavedChanges.value = true
  }

  /** 重做 */
  function redo() {
    if (!canRedo.value) return

    historyIndex.value++
    const snapshot = historyStack.value[historyIndex.value]
    nodes.value = JSON.parse(JSON.stringify(snapshot.nodes))
    edges.value = JSON.parse(JSON.stringify(snapshot.edges))
    hasUnsavedChanges.value = true
  }

  /** 清除历史记录 */
  function clearHistory() {
    historyStack.value = []
    historyIndex.value = -1
  }

  // ==================== 视口操作 ====================

  /** 更新视口 */
  function updateViewport(newViewport: Partial<CanvasViewport>) {
    viewport.value = { ...viewport.value, ...newViewport }
  }

  /** 重置视口 */
  function resetViewport() {
    viewport.value = { ...DEFAULT_VIEWPORT }
  }

  // ==================== 设置操作 ====================

  /** 更新设置 */
  function updateSettings(newSettings: Partial<CanvasSettings>) {
    settings.value = { ...settings.value, ...newSettings }
  }

  // ==================== UI 操作 ====================

  /** 切换节点面板 */
  function toggleNodePalette() {
    showNodePalette.value = !showNodePalette.value
  }

  /** 切换属性面板 */
  function togglePropertyPanel() {
    showPropertyPanel.value = !showPropertyPanel.value
  }

  // ==================== 初始化 ====================

  /** 初始化 Store */
  async function initialize() {
    loadFromCache()
    await loadProjects()

    // 如果有缓存的项目 ID，尝试加载
    if (currentProjectId.value) {
      await loadProject(currentProjectId.value)
    }
  }

  // ==================== 返回 ====================

  return {
    // 状态
    projects,
    currentProjectId,
    nodes,
    edges,
    selectedNodeIds,
    viewport,
    settings,
    historyStack,
    historyIndex,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    showNodePalette,
    showPropertyPanel,

    // 计算属性
    currentProject,
    selectedNodes,
    canUndo,
    canRedo,
    nodesByType,

    // 项目管理
    loadProjects,
    loadProject,
    createNewProject,
    saveCurrentProject,
    deleteProject,

    // 节点操作
    addNode,
    createAndAddNode,
    updateNode,
    updateNodeData,
    removeNode,
    removeSelectedNodes,
    moveNode,

    // 边操作
    addEdge,
    createAndAddEdge,
    removeEdge,

    // 选择操作
    selectNode,
    deselectNode,
    clearSelection,
    selectAll,

    // 历史记录
    pushHistory,
    undo,
    redo,
    clearHistory,

    // 视口操作
    updateViewport,
    resetViewport,

    // 设置操作
    updateSettings,

    // UI 操作
    toggleNodePalette,
    togglePropertyPanel,

    // 初始化
    initialize
  }
})
