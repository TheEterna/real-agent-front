/**
 * Canvas API 层
 *
 * 采用 localStorage 持久化 + API 端点混合策略：
 * - 项目 CRUD 使用 localStorage 持久化（后端未实现时）
 * - 尝试调用后端 API，失败时降级到 localStorage
 * - 高度可扩展，后端实现后只需移除 localStorage fallback
 *
 * @author Han
 * @since 2026-02-19
 */

import http from '@/services/http'
import i18n from '@/i18n'
import type { CanvasProject, CanvasNode, CanvasEdge } from '@/types/canvas'
import {
  CanvasNodeType,
  StickyColor,
  AiGenerationStatus,
  DEFAULT_CANVAS_SETTINGS,
  DEFAULT_VIEWPORT
} from '@/types/canvas'
import { CANVAS_EDGE_COLOR } from '@/styles/canvas-colors'

// ==================== 常量 ====================

const STORAGE_KEY = 'volo_canvas_projects'
const API_PREFIX = '/playground/canvas'

// ==================== localStorage 持久化层 ====================

/** 从 localStorage 读取项目列表 */
function getProjectsFromStorage(): CanvasProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.warn('[Canvas API] localStorage 读取失败:', e)
    return []
  }
}

/** 将项目列表保存到 localStorage */
function saveProjectsToStorage(projects: CanvasProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch (e) {
    console.warn('[Canvas API] localStorage 写入失败:', e)
  }
}

// ==================== API 层（带 localStorage fallback）====================

/**
 * 获取项目列表
 * 1. 尝试 GET /playground/canvas/projects
 * 2. 失败时从 localStorage 读取
 */
export async function fetchCanvasProjects(): Promise<CanvasProject[]> {
  try {
    const res = await http.get<any, { code: number; data: CanvasProject[] }>(
      `${API_PREFIX}/projects`
    )
    if (res.code === 200 && Array.isArray(res.data)) {
      // 同步到 localStorage 作为缓存
      saveProjectsToStorage(res.data)
      return res.data
    }
    throw new Error(`Unexpected response code: ${res.code}`)
  } catch (e) {
    console.warn('[Canvas API] fetchCanvasProjects 降级到 localStorage:', e)
    return getProjectsFromStorage()
  }
}

/**
 * 获取单个项目
 * 1. 尝试 GET /playground/canvas/projects/:projectId
 * 2. 失败时从 localStorage 查找
 */
export async function fetchCanvasProject(projectId: string): Promise<CanvasProject | null> {
  try {
    const res = await http.get<any, { code: number; data: CanvasProject }>(
      `${API_PREFIX}/projects/${projectId}`
    )
    if (res.code === 200 && res.data) {
      return res.data
    }
    throw new Error(`Unexpected response code: ${res.code}`)
  } catch (e) {
    console.warn('[Canvas API] fetchCanvasProject 降级到 localStorage:', e)
    const projects = getProjectsFromStorage()
    return projects.find(p => p.id === projectId) ?? null
  }
}

/**
 * 创建项目
 * 1. 生成 UUID
 * 2. 构建默认 CanvasProject
 * 3. 尝试 POST /playground/canvas/projects
 * 4. 失败时保存到 localStorage
 */
export async function createCanvasProject(
  title: string,
  description?: string
): Promise<CanvasProject> {
  const now = new Date().toISOString()
  const project: CanvasProject = {
    id: generateId('project'),
    title,
    description,
    nodes: [],
    edges: [],
    viewport: { ...DEFAULT_VIEWPORT },
    settings: { ...DEFAULT_CANVAS_SETTINGS },
    createdTime: now,
    updatedTime: now
  }

  try {
    const res = await http.post<any, { code: number; data: CanvasProject }>(
      `${API_PREFIX}/projects`,
      project
    )
    if (res.code === 200 && res.data) {
      // 同步到 localStorage
      const projects = getProjectsFromStorage()
      projects.unshift(res.data)
      saveProjectsToStorage(projects)
      return res.data
    }
    throw new Error(`Unexpected response code: ${res.code}`)
  } catch (e) {
    console.warn('[Canvas API] createCanvasProject 降级到 localStorage:', e)
    const projects = getProjectsFromStorage()
    projects.unshift(project)
    saveProjectsToStorage(projects)
    return project
  }
}

/**
 * 保存项目（更新）
 * 1. 尝试 PUT /playground/canvas/projects/:projectId
 * 2. 失败时保存到 localStorage
 */
export async function saveCanvasProject(project: CanvasProject): Promise<boolean> {
  try {
    const res = await http.put<any, { code: number }>(
      `${API_PREFIX}/projects/${project.id}`,
      project
    )
    if (res.code === 200) {
      // 同步到 localStorage
      const projects = getProjectsFromStorage()
      const index = projects.findIndex(p => p.id === project.id)
      if (index !== -1) {
        projects[index] = project
      } else {
        projects.unshift(project)
      }
      saveProjectsToStorage(projects)
      return true
    }
    throw new Error(`Unexpected response code: ${res.code}`)
  } catch (e) {
    console.warn('[Canvas API] saveCanvasProject 降级到 localStorage:', e)
    const projects = getProjectsFromStorage()
    const index = projects.findIndex(p => p.id === project.id)
    if (index !== -1) {
      projects[index] = project
    } else {
      projects.unshift(project)
    }
    saveProjectsToStorage(projects)
    return true
  }
}

/**
 * 删除项目
 * 1. 尝试 DELETE /playground/canvas/projects/:projectId
 * 2. 失败时从 localStorage 删除
 */
export async function deleteCanvasProject(projectId: string): Promise<boolean> {
  try {
    const res = await http.delete<any, { code: number }>(
      `${API_PREFIX}/projects/${projectId}`
    )
    if (res.code === 200) {
      // 同步从 localStorage 删除
      const projects = getProjectsFromStorage()
      saveProjectsToStorage(projects.filter(p => p.id !== projectId))
      return true
    }
    throw new Error(`Unexpected response code: ${res.code}`)
  } catch (e) {
    console.warn('[Canvas API] deleteCanvasProject 降级到 localStorage:', e)
    const projects = getProjectsFromStorage()
    saveProjectsToStorage(projects.filter(p => p.id !== projectId))
    return true
  }
}

// ==================== 工具函数 ====================

/**
 * 生成唯一 ID
 * 优先使用 crypto.randomUUID()，不可用时用时间戳+随机数
 */
export function generateId(prefix = 'node'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/** 创建新节点 */
export function createNode(
  type: CanvasNodeType,
  position: { x: number; y: number },
  data?: Partial<CanvasNode['data']>
): CanvasNode {
  const id = generateId(type)

  const defaultData: Record<CanvasNodeType, CanvasNode['data']> = {
    [CanvasNodeType.TEXT]: { content: '', isEditing: true },
    [CanvasNodeType.STICKY]: { content: '', color: StickyColor.YELLOW, isEditing: true },
    [CanvasNodeType.IMAGE]: { url: '', width: 0, height: 0 },
    [CanvasNodeType.VIDEO]: { url: '', duration: 0 },
    [CanvasNodeType.AUDIO]: { url: '', duration: 0 },
    [CanvasNodeType.GROUP]: { label: i18n.global.t('api.canvas.newGroup') },
    [CanvasNodeType.AI_CHAT]: { prompt: '', status: AiGenerationStatus.IDLE },
    [CanvasNodeType.AI_IMAGE]: { prompt: '', status: AiGenerationStatus.IDLE },
    [CanvasNodeType.AI_VIDEO]: { prompt: '', status: AiGenerationStatus.IDLE },
    [CanvasNodeType.AI_AUDIO]: { prompt: '', type: 'tts', status: AiGenerationStatus.IDLE }
  }

  return {
    id,
    type,
    position,
    data: { ...defaultData[type], ...data } as CanvasNode['data']
  }
}

/** 创建新边 */
export function createEdge(source: string, target: string): CanvasEdge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    animated: true,
    style: { stroke: CANVAS_EDGE_COLOR }
  }
}
