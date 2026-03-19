/**
 * Mock handler: Billing
 *
 * Intercepts billing-related API requests and returns mock data.
 * Covers usage logs, daily credits claim, and claim status.
 *
 * @author Mock
 * @since 2026-03-19
 */

import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, MOCK_USER } from '../shared'

// ==================== Types ====================

interface UsageLogVO {
  id: string
  userId: string
  modelId: string
  modelName: string
  action: 'chat' | 'image' | 'video' | 'speech' | 'embedding' | 'tool_call'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  creditsCharged: number
  sessionId?: string
  description: string
  createdTime: string
}

interface ClaimResult {
  claimed: boolean
  amount: number
  newBalance: number
  claimTime: string
}

interface ClaimStatus {
  canClaim: boolean
  lastClaimTime: string
  nextClaimTime: string
  dailyAmount: number
}

// ==================== Mock Data ====================

const MOCK_USAGE_LOGS: UsageLogVO[] = [
  // --- 2026-03-19 (today) ---
  {
    id: 'usage-log-001',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 1280,
    outputTokens: 2340,
    totalTokens: 3620,
    creditsCharged: 1.81,
    sessionId: 'session-a01',
    description: '与 VoloAI 对话：分析用户增长数据',
    createdTime: '2026-03-19T09:15:00Z',
  },
  {
    id: 'usage-log-002',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 890,
    outputTokens: 1560,
    totalTokens: 2450,
    creditsCharged: 1.47,
    sessionId: 'session-a02',
    description: '与 VoloAI 对话：审查前端组件代码',
    createdTime: '2026-03-19T08:42:00Z',
  },
  {
    id: 'usage-log-003',
    userId: MOCK_USER.userId,
    modelId: 'dall-e-3',
    modelName: 'DALL-E 3',
    action: 'image',
    inputTokens: 1000,
    outputTokens: 0,
    totalTokens: 1000,
    creditsCharged: 5.0,
    description: '图像生成：未来城市概念图',
    createdTime: '2026-03-19T07:30:00Z',
  },
  {
    id: 'usage-log-004',
    userId: MOCK_USER.userId,
    modelId: 'deepseek-v3',
    modelName: 'DeepSeek V3',
    action: 'chat',
    inputTokens: 2100,
    outputTokens: 3800,
    totalTokens: 5900,
    creditsCharged: 1.18,
    sessionId: 'session-a03',
    description: '与 VoloAI 对话：数据库索引优化方案',
    createdTime: '2026-03-19T06:55:00Z',
  },
  // --- 2026-03-18 ---
  {
    id: 'usage-log-005',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 3200,
    outputTokens: 4100,
    totalTokens: 7300,
    creditsCharged: 3.65,
    sessionId: 'session-b01',
    description: '与 VoloAI 对话：设计系统 Token 规范讨论',
    createdTime: '2026-03-18T21:10:00Z',
  },
  {
    id: 'usage-log-006',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 1500,
    outputTokens: 2800,
    totalTokens: 4300,
    creditsCharged: 2.58,
    sessionId: 'session-b02',
    description: '与 VoloAI 对话：重构用户认证模块',
    createdTime: '2026-03-18T18:25:00Z',
  },
  {
    id: 'usage-log-007',
    userId: MOCK_USER.userId,
    modelId: 'gemini-2.0-flash',
    modelName: 'Gemini 2.0 Flash',
    action: 'chat',
    inputTokens: 680,
    outputTokens: 1200,
    totalTokens: 1880,
    creditsCharged: 0.38,
    sessionId: 'session-b03',
    description: '与 VoloAI 对话：快速翻译技术文档',
    createdTime: '2026-03-18T15:40:00Z',
  },
  {
    id: 'usage-log-008',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'tool_call',
    inputTokens: 500,
    outputTokens: 800,
    totalTokens: 1300,
    creditsCharged: 0.65,
    sessionId: 'session-b04',
    description: 'MCP 工具调用：搜索天气信息',
    createdTime: '2026-03-18T14:05:00Z',
  },
  {
    id: 'usage-log-009',
    userId: MOCK_USER.userId,
    modelId: 'sora',
    modelName: 'Sora',
    action: 'video',
    inputTokens: 5000,
    outputTokens: 0,
    totalTokens: 5000,
    creditsCharged: 25.0,
    description: '视频生成：产品宣传片 15 秒',
    createdTime: '2026-03-18T11:20:00Z',
  },
  // --- 2026-03-17 ---
  {
    id: 'usage-log-010',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 4200,
    outputTokens: 4800,
    totalTokens: 9000,
    creditsCharged: 5.4,
    sessionId: 'session-c01',
    description: '与 VoloAI 对话：编写单元测试用例',
    createdTime: '2026-03-17T20:30:00Z',
  },
  {
    id: 'usage-log-011',
    userId: MOCK_USER.userId,
    modelId: 'deepseek-v3',
    modelName: 'DeepSeek V3',
    action: 'chat',
    inputTokens: 1800,
    outputTokens: 2600,
    totalTokens: 4400,
    creditsCharged: 0.88,
    sessionId: 'session-c02',
    description: '与 VoloAI 对话：分析竞品功能特性',
    createdTime: '2026-03-17T17:15:00Z',
  },
  {
    id: 'usage-log-012',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 950,
    outputTokens: 1400,
    totalTokens: 2350,
    creditsCharged: 1.18,
    sessionId: 'session-c03',
    description: '与 VoloAI 对话：SSE 流式通信调试',
    createdTime: '2026-03-17T14:50:00Z',
  },
  {
    id: 'usage-log-013',
    userId: MOCK_USER.userId,
    modelId: 'dall-e-3',
    modelName: 'DALL-E 3',
    action: 'image',
    inputTokens: 1000,
    outputTokens: 0,
    totalTokens: 1000,
    creditsCharged: 5.0,
    description: '图像生成：品牌 Logo 迭代设计',
    createdTime: '2026-03-17T10:00:00Z',
  },
  // --- 2026-03-16 ---
  {
    id: 'usage-log-014',
    userId: MOCK_USER.userId,
    modelId: 'gemini-2.0-flash',
    modelName: 'Gemini 2.0 Flash',
    action: 'chat',
    inputTokens: 2400,
    outputTokens: 3100,
    totalTokens: 5500,
    creditsCharged: 1.1,
    sessionId: 'session-d01',
    description: '与 VoloAI 对话：学术论文摘要生成',
    createdTime: '2026-03-16T22:00:00Z',
  },
  {
    id: 'usage-log-015',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 1100,
    outputTokens: 1900,
    totalTokens: 3000,
    creditsCharged: 1.5,
    sessionId: 'session-d02',
    description: '与 VoloAI 对话：API 接口设计评审',
    createdTime: '2026-03-16T19:30:00Z',
  },
  {
    id: 'usage-log-016',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 3600,
    outputTokens: 4200,
    totalTokens: 7800,
    creditsCharged: 4.68,
    sessionId: 'session-d03',
    description: '与 VoloAI 对话：重构订阅计费模块',
    createdTime: '2026-03-16T16:45:00Z',
  },
  {
    id: 'usage-log-017',
    userId: MOCK_USER.userId,
    modelId: 'deepseek-v3',
    modelName: 'DeepSeek V3',
    action: 'embedding',
    inputTokens: 8000,
    outputTokens: 0,
    totalTokens: 8000,
    creditsCharged: 0.16,
    description: '知识库向量化：产品需求文档',
    createdTime: '2026-03-16T13:10:00Z',
  },
  // --- 2026-03-15 ---
  {
    id: 'usage-log-018',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 2800,
    outputTokens: 3500,
    totalTokens: 6300,
    creditsCharged: 3.15,
    sessionId: 'session-e01',
    description: '与 VoloAI 对话：MCP 工具链集成方案',
    createdTime: '2026-03-15T20:20:00Z',
  },
  {
    id: 'usage-log-019',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'speech',
    inputTokens: 500,
    outputTokens: 0,
    totalTokens: 500,
    creditsCharged: 1.5,
    description: '语音合成：会议纪要播报',
    createdTime: '2026-03-15T17:00:00Z',
  },
  {
    id: 'usage-log-020',
    userId: MOCK_USER.userId,
    modelId: 'gemini-2.0-flash',
    modelName: 'Gemini 2.0 Flash',
    action: 'chat',
    inputTokens: 560,
    outputTokens: 900,
    totalTokens: 1460,
    creditsCharged: 0.29,
    sessionId: 'session-e02',
    description: '与 VoloAI 对话：快速代码片段解释',
    createdTime: '2026-03-15T14:35:00Z',
  },
  {
    id: 'usage-log-021',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 1700,
    outputTokens: 2400,
    totalTokens: 4100,
    creditsCharged: 2.46,
    sessionId: 'session-e03',
    description: '与 VoloAI 对话：TypeScript 类型体操',
    createdTime: '2026-03-15T11:15:00Z',
  },
  // --- 2026-03-14 ---
  {
    id: 'usage-log-022',
    userId: MOCK_USER.userId,
    modelId: 'dall-e-3',
    modelName: 'DALL-E 3',
    action: 'image',
    inputTokens: 1000,
    outputTokens: 0,
    totalTokens: 1000,
    creditsCharged: 5.0,
    description: '图像生成：社区动态封面插画',
    createdTime: '2026-03-14T21:45:00Z',
  },
  {
    id: 'usage-log-023',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 4500,
    outputTokens: 4800,
    totalTokens: 9300,
    creditsCharged: 4.65,
    sessionId: 'session-f01',
    description: '与 VoloAI 对话：暗色模式全局适配方案',
    createdTime: '2026-03-14T18:30:00Z',
  },
  {
    id: 'usage-log-024',
    userId: MOCK_USER.userId,
    modelId: 'deepseek-v3',
    modelName: 'DeepSeek V3',
    action: 'chat',
    inputTokens: 3200,
    outputTokens: 4600,
    totalTokens: 7800,
    creditsCharged: 1.56,
    sessionId: 'session-f02',
    description: '与 VoloAI 对话：R2DBC 性能调优',
    createdTime: '2026-03-14T15:10:00Z',
  },
  {
    id: 'usage-log-025',
    userId: MOCK_USER.userId,
    modelId: 'gemini-2.0-flash',
    modelName: 'Gemini 2.0 Flash',
    action: 'tool_call',
    inputTokens: 300,
    outputTokens: 600,
    totalTokens: 900,
    creditsCharged: 0.18,
    sessionId: 'session-f03',
    description: 'MCP 工具调用：获取汇率信息',
    createdTime: '2026-03-14T12:25:00Z',
  },
  // --- 2026-03-13 ---
  {
    id: 'usage-log-026',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 2900,
    outputTokens: 3700,
    totalTokens: 6600,
    creditsCharged: 3.96,
    sessionId: 'session-g01',
    description: '与 VoloAI 对话：Agent 策略架构设计',
    createdTime: '2026-03-13T19:50:00Z',
  },
  {
    id: 'usage-log-027',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 750,
    outputTokens: 1100,
    totalTokens: 1850,
    creditsCharged: 0.93,
    sessionId: 'session-g02',
    description: '与 VoloAI 对话：Vue 组件生命周期问题排查',
    createdTime: '2026-03-13T16:30:00Z',
  },
  {
    id: 'usage-log-028',
    userId: MOCK_USER.userId,
    modelId: 'sora',
    modelName: 'Sora',
    action: 'video',
    inputTokens: 5000,
    outputTokens: 0,
    totalTokens: 5000,
    creditsCharged: 25.0,
    description: '视频生成：数字分身介绍动画',
    createdTime: '2026-03-13T13:00:00Z',
  },
  // --- 2026-03-12 ---
  {
    id: 'usage-log-029',
    userId: MOCK_USER.userId,
    modelId: 'deepseek-v3',
    modelName: 'DeepSeek V3',
    action: 'chat',
    inputTokens: 1400,
    outputTokens: 2100,
    totalTokens: 3500,
    creditsCharged: 0.7,
    sessionId: 'session-h01',
    description: '与 VoloAI 对话：Redis 缓存策略讨论',
    createdTime: '2026-03-12T21:15:00Z',
  },
  {
    id: 'usage-log-030',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 1950,
    outputTokens: 2800,
    totalTokens: 4750,
    creditsCharged: 2.38,
    sessionId: 'session-h02',
    description: '与 VoloAI 对话：用户画像功能需求分析',
    createdTime: '2026-03-12T17:40:00Z',
  },
  {
    id: 'usage-log-031',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 2200,
    outputTokens: 3100,
    totalTokens: 5300,
    creditsCharged: 3.18,
    sessionId: 'session-h03',
    description: '与 VoloAI 对话：知识库检索算法优化',
    createdTime: '2026-03-12T14:20:00Z',
  },
  // --- 2026-03-11 ---
  {
    id: 'usage-log-032',
    userId: MOCK_USER.userId,
    modelId: 'gemini-2.0-flash',
    modelName: 'Gemini 2.0 Flash',
    action: 'chat',
    inputTokens: 480,
    outputTokens: 720,
    totalTokens: 1200,
    creditsCharged: 0.24,
    sessionId: 'session-i01',
    description: '与 VoloAI 对话：简单问答测试',
    createdTime: '2026-03-11T20:00:00Z',
  },
  {
    id: 'usage-log-033',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'speech',
    inputTokens: 500,
    outputTokens: 0,
    totalTokens: 500,
    creditsCharged: 1.5,
    description: '语音合成：英语学习朗读',
    createdTime: '2026-03-11T16:45:00Z',
  },
  // --- 2026-03-10 ---
  {
    id: 'usage-log-034',
    userId: MOCK_USER.userId,
    modelId: 'dall-e-3',
    modelName: 'DALL-E 3',
    action: 'image',
    inputTokens: 1000,
    outputTokens: 0,
    totalTokens: 1000,
    creditsCharged: 5.0,
    description: '图像生成：记忆相册 AI 修复',
    createdTime: '2026-03-10T19:30:00Z',
  },
  {
    id: 'usage-log-035',
    userId: MOCK_USER.userId,
    modelId: 'claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    action: 'chat',
    inputTokens: 3800,
    outputTokens: 4500,
    totalTokens: 8300,
    creditsCharged: 4.98,
    sessionId: 'session-j01',
    description: '与 VoloAI 对话：多 Agent 协作流程设计',
    createdTime: '2026-03-10T15:10:00Z',
  },
  // --- 2026-03-08 ---
  {
    id: 'usage-log-036',
    userId: MOCK_USER.userId,
    modelId: 'deepseek-v3',
    modelName: 'DeepSeek V3',
    action: 'embedding',
    inputTokens: 12000,
    outputTokens: 0,
    totalTokens: 12000,
    creditsCharged: 0.24,
    description: '知识库向量化：技术架构文档批量入库',
    createdTime: '2026-03-08T10:00:00Z',
  },
  {
    id: 'usage-log-037',
    userId: MOCK_USER.userId,
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    action: 'chat',
    inputTokens: 2600,
    outputTokens: 3200,
    totalTokens: 5800,
    creditsCharged: 2.9,
    sessionId: 'session-k01',
    description: '与 VoloAI 对话：前端性能瓶颈分析',
    createdTime: '2026-03-08T08:30:00Z',
  },
  // --- 2026-03-06 ---
  {
    id: 'usage-log-038',
    userId: MOCK_USER.userId,
    modelId: 'gemini-2.0-flash',
    modelName: 'Gemini 2.0 Flash',
    action: 'chat',
    inputTokens: 1300,
    outputTokens: 1800,
    totalTokens: 3100,
    creditsCharged: 0.62,
    sessionId: 'session-l01',
    description: '与 VoloAI 对话：Tailwind CSS v4 迁移指南',
    createdTime: '2026-03-06T14:20:00Z',
  },
]

let dailyClaimed = true

// ==================== Handler ====================

export default function billingMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // GET /billing/usage-logs
  if (method === 'get' && match('/billing/usage-logs', url)) {
    return ok(MOCK_USAGE_LOGS)
  }

  // POST /billing/daily-credits/claim
  if (method === 'post' && match('/billing/daily-credits/claim', url)) {
    dailyClaimed = true
    const result: ClaimResult = {
      claimed: true,
      amount: 50,
      newBalance: 100049,
      claimTime: '2026-03-19T08:00:00Z',
    }
    return ok(result)
  }

  // GET /billing/daily-credits/status
  if (method === 'get' && match('/billing/daily-credits/status', url)) {
    const status: ClaimStatus = {
      canClaim: !dailyClaimed,
      lastClaimTime: '2026-03-19T08:00:00Z',
      nextClaimTime: '2026-03-20T00:00:00Z',
      dailyAmount: 50,
    }
    return ok(status)
  }

  return null
}
