/// <reference types="vite/client" />
/**
 * Mock 模式入口
 *
 * 通过替换 axios adapter 拦截所有 HTTP 请求，返回 mock 数据。
 * 仅在 VITE_MOCK=true 时生效（npm run mock）。
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

// 导入所有 handler
import authMock from './handlers/auth'
import sessionMock from './handlers/session'
import llmMock from './handlers/llm'
import textConfigMock from './handlers/textConfig'
import subscriptionMock from './handlers/subscription'
import memoryMock from './handlers/memory'
import adminMock from './handlers/admin'
import chatAssistantMock from './handlers/chatAssistant'
import knowledgeMock from './handlers/knowledge'
import kbMock from './handlers/kb'
import fileMock from './handlers/file'
import driveMock from './handlers/drive'
import playgroundMock from './handlers/playground'
import terminalMock from './handlers/terminal'
import canvasMock from './handlers/canvas'
import thesisMock from './handlers/thesis'
import billingMock from './handlers/billing'
import memoryPanelMock from './handlers/memoryPanel'
import voloaiMock from './handlers/voloai'
import avatarMock from './handlers/avatar'
import feedMock from './handlers/feed'
import roleplayMock from './handlers/roleplay'

type MockHandler = (config: InternalAxiosRequestConfig) => any | null

const handlers: MockHandler[] = [
  // 认证 & 用户
  authMock,
  // VoloAI 对话（/agent/chat/volo-ai/*，需在 sessionMock 之前以区分路由）
  voloaiMock,
  // 会话管理
  sessionMock,
  // 角色扮演（/roles/*、/sessions/:code/role 等，不与 session 冲突）
  roleplayMock,
  // 模型 & 配置
  llmMock,
  textConfigMock,
  // 订阅 & 计费
  subscriptionMock,
  billingMock,
  // 记忆系统（memoryPanel 在 memory 之前，路径更具体）
  memoryPanelMock,
  memoryMock,
  // 数字分身
  avatarMock,
  // 社区动态
  feedMock,
  // 管理后台
  adminMock,
  // Playground
  chatAssistantMock,
  playgroundMock,
  // 知识库
  knowledgeMock,
  kbMock,
  // 文件 & 云盘
  fileMock,
  driveMock,
  // 终端
  terminalMock,
  // 画布
  canvasMock,
  // 论文写作
  thesisMock,
]

/**
 * 创建 mock adapter，替代 axios 默认的 XHR/fetch adapter
 */
function createMockAdapter() {
  return (config: InternalAxiosRequestConfig): Promise<any> => {
    // 剥离 /api 前缀，让 handler 匹配干净的路径
    const rawUrl = config.url || ''
    const url = rawUrl.startsWith('/api') ? rawUrl.slice(4) : rawUrl
    const mockConfig = { ...config, url }

    for (const handler of handlers) {
      const result = handler(mockConfig)
      if (result !== null && result !== undefined) {
        // Mock 命中
        console.log(`%c[Mock] %c${(config.method || 'GET').toUpperCase()} ${url}`, 'color:#10b981;font-weight:bold', 'color:#6b7280')
        return Promise.resolve({
          data: result,
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config,
        })
      }
    }

    // 未匹配任何 handler — 返回空数据而非报错，避免页面崩溃
    console.warn(`[Mock] Unhandled: ${(config.method || 'GET').toUpperCase()} ${url}`)
    return Promise.resolve({
      data: { code: 200, message: 'mock: not implemented', data: null, timestamp: Date.now() },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
    })
  }
}

/**
 * 为 axios 实例安装 mock adapter
 * 仅在 VITE_MOCK=true 时生效
 */
export function setupMockAdapter(instance: AxiosInstance) {
  if (import.meta.env.VITE_MOCK !== 'true') return
  instance.defaults.adapter = createMockAdapter() as any
}

// 启动时打印 banner
if (import.meta.env.VITE_MOCK === 'true') {
  console.log(
    '%c[VOLO AI] Mock Mode Enabled',
    'background:#10b981;color:#fff;padding:4px 12px;border-radius:4px;font-weight:bold;font-size:14px'
  )
  console.log(
    '%c登录账号: 3168134942@qq.com / 111111',
    'color:#f59e0b;font-weight:bold'
  )
  console.log(
    '%c注意: SSE 流式端点（Agent 对话、AI 写作等）在 Mock 模式下不可用',
    'color:#ef4444'
  )
}
