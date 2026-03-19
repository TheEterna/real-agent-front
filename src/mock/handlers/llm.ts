import type { InternalAxiosRequestConfig } from 'axios'
import { ok, error, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Mock LLM Model Data ====================

interface LlmConfig {
  id: string
  provider: string
  displayName: string
  description: string
  contentWindow: number
  capabilities: { text: boolean; vision: boolean; tools: boolean; reasoning: boolean }
  creditPrice: number
  minTier: string
  maxOutputTokens: number
  iconUrl?: string
  sortOrder: number
  available: boolean
}

const TIER_RANK: Record<string, number> = { FREE: 0, PRO: 1, TURBO: 2 }

function tierAccessible(modelTier: string, userTier: string): boolean {
  return (TIER_RANK[modelTier] ?? 99) <= (TIER_RANK[userTier] ?? 0)
}

const ALL_MODELS: LlmConfig[] = [
  // ── OpenAI ──
  {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    description: 'OpenAI 最新旗舰多模态模型，支持文本与视觉理解',
    contentWindow: 128000,
    capabilities: { text: true, vision: true, tools: true, reasoning: false },
    creditPrice: 0.5,
    minTier: 'FREE',
    maxOutputTokens: 4096,
    iconUrl: '',
    sortOrder: 1,
    available: true,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    description: '轻量高效模型，适合日常对话与简单任务',
    contentWindow: 128000,
    capabilities: { text: true, vision: false, tools: true, reasoning: false },
    creditPrice: 0.1,
    minTier: 'FREE',
    maxOutputTokens: 4096,
    iconUrl: '',
    sortOrder: 2,
    available: true,
  },
  {
    id: 'o1',
    provider: 'openai',
    displayName: 'o1',
    description: '推理增强模型，擅长复杂逻辑和数学',
    contentWindow: 200000,
    capabilities: { text: true, vision: false, tools: false, reasoning: true },
    creditPrice: 1.5,
    minTier: 'PRO',
    maxOutputTokens: 100000,
    iconUrl: '',
    sortOrder: 3,
    available: true,
  },
  {
    id: 'o3-mini',
    provider: 'openai',
    displayName: 'o3-mini',
    description: '轻量推理模型，平衡速度与推理深度',
    contentWindow: 200000,
    capabilities: { text: true, vision: false, tools: false, reasoning: true },
    creditPrice: 0.8,
    minTier: 'PRO',
    maxOutputTokens: 65000,
    iconUrl: '',
    sortOrder: 4,
    available: true,
  },

  // ── Anthropic ──
  {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 4.6',
    description: 'Anthropic 高性能模型，擅长长文分析与代码生成',
    contentWindow: 200000,
    capabilities: { text: true, vision: true, tools: true, reasoning: false },
    creditPrice: 0.6,
    minTier: 'FREE',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 5,
    available: true,
  },
  {
    id: 'claude-opus-4-6',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.6',
    description: '最强推理能力，适合复杂分析与创意写作',
    contentWindow: 200000,
    capabilities: { text: true, vision: true, tools: true, reasoning: true },
    creditPrice: 2.0,
    minTier: 'TURBO',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 6,
    available: true,
  },
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    description: '极速响应，适合高频轻量任务',
    contentWindow: 200000,
    capabilities: { text: true, vision: false, tools: true, reasoning: false },
    creditPrice: 0.15,
    minTier: 'FREE',
    maxOutputTokens: 4096,
    iconUrl: '',
    sortOrder: 7,
    available: true,
  },

  // ── Google ──
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    displayName: 'Gemini 2.0 Flash',
    description: 'Google 高速推理模型，延迟极低，适合实时交互',
    contentWindow: 1000000,
    capabilities: { text: true, vision: true, tools: true, reasoning: false },
    creditPrice: 0.2,
    minTier: 'FREE',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 8,
    available: true,
  },
  {
    id: 'gemini-1.5-pro',
    provider: 'google',
    displayName: 'Gemini 1.5 Pro',
    description: '超长上下文窗口，支持 200 万 token 输入',
    contentWindow: 2000000,
    capabilities: { text: true, vision: true, tools: true, reasoning: true },
    creditPrice: 0.8,
    minTier: 'PRO',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 9,
    available: true,
  },

  // ── DeepSeek ──
  {
    id: 'deepseek-v3',
    provider: 'deepseek',
    displayName: 'DeepSeek V3',
    description: 'DeepSeek 开源大模型，中文能力出众，性价比极高',
    contentWindow: 64000,
    capabilities: { text: true, vision: false, tools: true, reasoning: false },
    creditPrice: 0.05,
    minTier: 'FREE',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 10,
    available: true,
  },
  {
    id: 'deepseek-r1',
    provider: 'deepseek',
    displayName: 'DeepSeek R1',
    description: '开源推理模型，擅长数学和逻辑推理',
    contentWindow: 64000,
    capabilities: { text: true, vision: false, tools: false, reasoning: true },
    creditPrice: 0.3,
    minTier: 'FREE',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 11,
    available: true,
  },

  // ── Qwen (通义千问) ──
  {
    id: 'qwen-max',
    provider: 'qwen',
    displayName: '通义千问 Max',
    description: '阿里云旗舰模型，中文理解与生成能力顶尖',
    contentWindow: 128000,
    capabilities: { text: true, vision: true, tools: true, reasoning: false },
    creditPrice: 0.3,
    minTier: 'FREE',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 12,
    available: true,
  },
  {
    id: 'qwen-plus',
    provider: 'qwen',
    displayName: '通义千问 Plus',
    description: '均衡型模型，兼顾速度与质量',
    contentWindow: 128000,
    capabilities: { text: true, vision: false, tools: true, reasoning: false },
    creditPrice: 0.1,
    minTier: 'FREE',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 13,
    available: true,
  },

  // ── xAI ──
  {
    id: 'grok-3',
    provider: 'xai',
    displayName: 'Grok 3',
    description: 'xAI 最新模型，实时信息获取与推理能力突出',
    contentWindow: 128000,
    capabilities: { text: true, vision: false, tools: true, reasoning: true },
    creditPrice: 1.0,
    minTier: 'PRO',
    maxOutputTokens: 8192,
    iconUrl: '',
    sortOrder: 14,
    available: true,
  },
]

// ==================== Handler ====================

export default function llmMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()
  const userTier = MOCK_USER.tier

  // POST /llm/models/refresh-cache (before parameterized routes)
  if (method === 'post' && match('/llm/models/refresh-cache', url)) {
    return ok('ok')
  }

  // GET /llm/models/default (before :id routes)
  if (method === 'get' && match('/llm/models/default', url)) {
    return ok({ ...ALL_MODELS[0], available: true })
  }

  // GET /llm/models/all (before :id routes)
  if (method === 'get' && match('/llm/models/all', url)) {
    const result = ALL_MODELS.map((m) => ({
      ...m,
      available: tierAccessible(m.minTier, userTier),
    }))
    return ok(result)
  }

  // GET /llm/models/:id/check-access (before :id)
  if (method === 'get' && match('/llm/models/:id/check-access', url)) {
    const id = param('/llm/models/:id/check-access', url, 'id')
    const model = ALL_MODELS.find((m) => m.id === id)
    if (!model) return error(404, `Model ${id} not found`)
    return ok(tierAccessible(model.minTier, userTier))
  }

  // GET /llm/models/:id
  if (method === 'get' && match('/llm/models/:id', url)) {
    const id = param('/llm/models/:id', url, 'id')
    const model = ALL_MODELS.find((m) => m.id === id)
    if (!model) return error(404, `Model ${id} not found`)
    return ok({ ...model, available: tierAccessible(model.minTier, userTier) })
  }

  // GET /llm/models (available models for user's tier)
  if (method === 'get' && match('/llm/models', url)) {
    const result = ALL_MODELS.filter((m) => tierAccessible(m.minTier, userTier)).map((m) => ({
      ...m,
      available: true,
    }))
    return ok(result)
  }

  return null
}
