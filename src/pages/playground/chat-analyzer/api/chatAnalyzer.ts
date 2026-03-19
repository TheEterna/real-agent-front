/**
 * Chat Analyzer API 封装
 *
 * 封装所有后端 API 端点：导入、联系人、记录、分析、报告、对话
 */

import http from '@/services/http'
import type {
  ResponseResult,
  Contact,
  ChatRecord,
  AnalysisReport,
  DialogMessage,
  ImportResult,
  ImportHistory,
} from '../types'
import { useAuthStore } from '@/stores/authStore'

const BASE = '/playground/chat-analyzer'

// ==================== 导入 API ====================

export const importApi = {
  /** 导入文件（ChatLab JSON/JSONL, CSV, TXT） */
  importFile: (file: File, contactId?: string): Promise<ResponseResult<ImportResult>> => {
    const formData = new FormData()
    formData.append('file', file)
    if (contactId) formData.append('contactId', contactId)
    return http.post(`${BASE}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    })
  },

  /** 导入粘贴文本 */
  importText: (textContent: string, contactId?: string): Promise<ResponseResult<ImportResult>> =>
    http.post(`${BASE}/import/text`, { textContent, contactId }),
}

// ==================== 联系人 API ====================

export const contactApi = {
  /** 获取联系人列表（当前用户） */
  list: (): Promise<ResponseResult<Contact[]>> =>
    http.get(`${BASE}/contacts`),

  /** 更新联系人信息 */
  update: (contactId: string, data: Partial<Pick<Contact, 'name' | 'relationType' | 'avatar'>>): Promise<ResponseResult<Contact>> =>
    http.put(`${BASE}/contacts/${contactId}`, data),

  /** 删除联系人 */
  remove: (contactId: string): Promise<ResponseResult<void>> =>
    http.delete(`${BASE}/contacts/${contactId}`),

  /** 获取导入历史 */
  importHistory: (contactId: string): Promise<ResponseResult<ImportHistory[]>> =>
    http.get(`${BASE}/contacts/${contactId}/import-history`),
}

// ==================== 聊天记录 API ====================

export const recordApi = {
  /** 获取聊天记录（分页） */
  list: (contactId: string, page = 0, pageSize = 100): Promise<ResponseResult<ChatRecord[]>> =>
    http.get(`${BASE}/contacts/${contactId}/records`, { params: { page, pageSize } }),
}

// ==================== 分析 API ====================

export const analysisApi = {
  /** 获取分析 SSE 流 URL（需拼接完整路径） */
  getAnalyzeStreamUrl: (contactId: string) => `/api${BASE}/contacts/${contactId}/analyze`,

  /** 获取分析报告 */
  getReport: (contactId: string): Promise<ResponseResult<AnalysisReport>> =>
    http.get(`${BASE}/contacts/${contactId}/report`),
}

// ==================== AI 对话 API ====================

export const dialogApi = {
  /** 获取对话 SSE 流 URL */
  getDialogStreamUrl: (contactId: string) => `/api${BASE}/contacts/${contactId}/dialog`,

  /** 获取对话历史 */
  getHistory: (contactId: string, page = 0, pageSize = 50): Promise<ResponseResult<DialogMessage[]>> =>
    http.get(`${BASE}/contacts/${contactId}/dialog`, { params: { page, pageSize } }),
}

// ==================== 工具函数 ====================

/** 获取 SSE 请求头（包含认证信息） */
export function getStreamHeaders(): Record<string, string> {
  const authStore = useAuthStore()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authStore.accessToken}`,
  }
}

// ==================== 统一导出 ====================

export const chatAnalyzerApi = {
  import: importApi,
  contact: contactApi,
  record: recordApi,
  analysis: analysisApi,
  dialog: dialogApi,
}

export default chatAnalyzerApi
