/**
 * Memory API 封装
 *
 * 记忆管理、Onboarding 接口。
 * 认证由 http 拦截器自动处理（SecurityUtils 从 Token 提取 userId）。
 *
 * @author Han
 * @since 2026-02-12
 */

import http from '@/services/http'
import type { MemoryItem, MemoryStats } from '@/types/memory'

// ==================== Memory Panel API ====================

export const memoryPanelApi = {
  /** 获取记忆列表（可按 tier 过滤） */
  list: (tier?: string, limit = 50): Promise<MemoryItem[]> =>
    http.get('/memory', { params: { tier, limit } }).then(res => res.data),

  /** 搜索记忆（混合检索） */
  search: (q: string, limit = 20): Promise<MemoryItem[]> =>
    http.get('/memory/search', { params: { q, limit } }).then(res => res.data),

  /** 获取记忆详情 */
  detail: (memoryId: string): Promise<MemoryItem> =>
    http.get(`/memory/${memoryId}`).then(res => res.data),

  /** 更新记忆内容 */
  update: (memoryId: string, content: string, summary?: string): Promise<MemoryItem> =>
    http.put(`/memory/${memoryId}`, { content, summary }).then(res => res.data),

  /** 删除单条记忆（软删除） */
  remove: (memoryId: string): Promise<void> =>
    http.delete(`/memory/${memoryId}`).then(res => res.data),

  /** 批量删除记忆 */
  batchRemove: (ids: string[]): Promise<number> =>
    http.delete('/memory', { data: { ids } }).then(res => res.data),

  /** 获取记忆统计 */
  stats: (): Promise<MemoryStats> =>
    http.get('/memory/stats').then(res => res.data),

  /** 变更记忆层级（手动晋升/降级） */
  changeTier: (memoryId: string, tier: string): Promise<MemoryItem> =>
    http.put(`/memory/${memoryId}/tier`, { tier }).then(res => res.data),

  /** 固定/取消固定记忆 */
  pin: (memoryId: string, pinned: boolean): Promise<void> =>
    http.put(`/memory/${memoryId}/pin`, { pinned }).then(res => res.data)
}

// ==================== Onboarding API ====================

export const onboardingApi = {
  /** 提交 Onboarding 数据 */
  submit: (data: {
    userName: string
    communicationStyle: string
    useCases: string[]
    interests: string
  }): Promise<{ success: boolean; message: string }> =>
    http.post('/memory/onboarding', data).then(res => res.data),

  /** 检查 Onboarding 状态 */
  status: (): Promise<{ completed: boolean }> =>
    http.get('/memory/onboarding/status').then(res => res.data),

  /** 获取已有 Onboarding 配置 */
  get: (): Promise<{ userName: string; communicationStyle: string; useCases: string[]; interests: string }> =>
    http.get('/memory/onboarding').then(res => res.data)
}

// ==================== 统一导出 ====================

export const memoryApi = {
  panel: memoryPanelApi,
  onboarding: onboardingApi
}

export default memoryApi
