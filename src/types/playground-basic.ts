/**
 * Playground Basic 模块类型定义
 *
 * @author Han
 * @since 2026-01-27
 */

// ==================== 通用响应 ====================

export type { ResponseResult } from '@/types/http'

// ==================== 文本对话 ====================

export interface ChatModelConfig {
  id: string
  provider: string
  displayName: string
  description: string
  contentWindow: number
  maxOutputTokens: number
  capabilities?: Record<string, unknown>
  inputPrice: number
  outputPrice: number
  creditPrice: number
  minTier: string
  iconUrl: string
  sortOrder: number
}

export interface BasicChatSession {
  id: string
  modelId: string
  title: string
  messageCount: number
  totalTokens: number
  creditsCharged: number
  createdTime: string
  updatedTime: string
}

export interface BasicChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: Array<{ type: string; url: string; name?: string }>
  inputTokens: number
  outputTokens: number
  creditsCharged: number
  createdTime: string
}

export interface BasicChatRequest {
  sessionId?: string
  modelId: string
  message: string
  attachments?: Array<{ type: string; url: string; name?: string }>
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  systemPrompt?: string
  /** 记忆优化开关 */
  enableMemoryOptimization?: boolean
}

export interface BasicChatEvent {
  type: 'STARTED' | 'CONTENT' | 'DONE' | 'ERROR'
  sessionId?: string
  content?: string
  error?: string
  // DONE 事件的 token 统计字段
  inputTokens?: number
  outputTokens?: number
  creditsCharged?: number
}

// ==================== 图像生成 ====================

/**
 * 模型能力配置（后端 ModelCapabilities）
 */
export interface ImageModelCapabilities {
  supportsEditing?: boolean
  supportsVariation?: boolean
  supportsMultiTurn?: boolean
  // OpenAI 参数
  supportedSizes?: string[]
  supportedQualities?: string[]
  supportedStyles?: string[]
  supportedBackgrounds?: string[]
  maxImages?: number
  // Gemini 参数
  supportedAspectRatios?: string[]
  personGenerationOptions?: string[]
  safetyFilterLevels?: string[]
}

export interface ImageModelConfig {
  id: string
  provider: string
  displayName: string
  description: string
  modelType: 'text2image' | 'image2image' | 'inpainting'
  supportedSizes: string[]
  maxImages: number
  creditPrice: number
  minTier: string
  iconUrl: string
  sortOrder: number
  /** 模型能力配置（来自后端 capabilities 字段） */
  capabilities?: ImageModelCapabilities
  /** 端点类型列表（云雾 API） */
  endpointTypes?: string[]
  /** 默认参数（如 size、quality、style），切换模型时自动应用 */
  defaultParams?: Record<string, unknown>
  /** 参数面板 Schema（用于动态渲染参数控件） */
  paramSchema?: Record<string, ParamSchemaItem>
}

/**
 * 生成的单张图像信息
 */
export interface GeneratedImageVO {
  id?: string
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  prompt?: string
  revisedPrompt?: string
  modelId?: string
}

/**
 * 图像生成结果（用于历史记录展示）
 * 兼容两种数据源：非流式 API 响应 和 历史记录列表
 */
export interface ImageGeneration {
  id: string
  modelId: string
  prompt: string
  negativePrompt?: string
  size: string
  quality: string
  style: string
  n: number
  /** 图像 URL 列表（从 content.images 提取，便于前端使用） */
  imageUrls: string[]
  creditsCharged: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  createdTime: string
}

/**
 * 图像生成参数（后端 ImageGenerationParams）
 */
export interface ImageGenerationParams {
  numberOfImages?: number
  // OpenAI 参数
  size?: string
  quality?: string
  style?: string
  background?: string
  // Gemini 参数
  aspectRatio?: string
  personGeneration?: string
  safetyFilterLevel?: string
}

/**
 * 图像生成请求（与后端 ImageGenerateRequest 对齐）
 */
export interface ImageGenerateRequest {
  modelId: string
  prompt: string
  negativePrompt?: string
  /** 生成参数（嵌套结构） */
  params?: ImageGenerationParams
  /** 参考图像 URL（用于编辑/变体） */
  referenceImageUrl?: string
  /** 编辑类型：generate（生成）、edit（编辑）、variation（变体） */
  editType?: 'generate' | 'edit' | 'variation'
  /** 遮罩图像 Base64（用于局部编辑） */
  maskBase64?: string
}

/**
 * 图像消息内容（后端 ImageMessageVO.MessageContent）
 */
export interface ImageMessageContent {
  text?: string
  prompt?: string
  negativePrompt?: string
  params?: ImageGenerationParams
  images?: GeneratedImageVO[]
  revisedPrompt?: string
  errorMessage?: string
  referenceImageId?: string
  editType?: string
}

/**
 * 图像消息 VO（后端 ImageMessageVO）
 */
export interface ImageMessageVO {
  id: string
  modelId?: string
  role: 'user' | 'assistant'
  type: 'image_request' | 'image_result' | 'error'
  content?: ImageMessageContent
  creditsCharged?: number
  createdTime: string
}

// ==================== 视频生成 ====================

export interface VideoModelConfig {
  id: string
  provider: string
  displayName: string
  description: string
  modelType: 'text2video' | 'image2video'
  supportedResolutions: string[]
  maxDurationSec: number
  creditPrice: number
  minTier: string
  iconUrl: string
  sortOrder: number
  /** 默认参数，切换模型时自动应用 */
  defaultParams?: Record<string, unknown>
  /** 参数面板 Schema（用于动态渲染参数控件） */
  paramSchema?: Record<string, ParamSchemaItem>
}

export interface VideoGeneration {
  id: string
  modelId: string
  prompt: string
  inputImageUrl?: string
  resolution: string
  durationSec: number
  videoUrl?: string
  thumbnailUrl?: string
  creditsCharged: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  errorMessage?: string
  createdTime: string
  completedTime?: string
}

export interface VideoGenerateRequest {
  modelId: string
  prompt: string
  inputImageUrl?: string
  resolution?: string
  durationSec?: number
  /** 模型特定扩展参数（根据 param_schema 动态渲染） */
  extraParams?: Record<string, unknown>
}

// ==================== 语音服务 ====================

export interface SpeechModelConfig {
  id: string
  provider: string
  displayName: string
  description: string
  modelType: 'tts' | 'asr'
  supportedVoices: string[]
  supportedFormats: string[]
  maxDurationSec: number
  creditPrice: number
  minTier: string
  iconUrl: string
  sortOrder: number
  /** 默认参数，切换模型时自动应用 */
  defaultParams?: Record<string, unknown>
  /** 参数面板 Schema（用于动态渲染参数控件） */
  paramSchema?: Record<string, ParamSchemaItem>
}

export interface SpeechGeneration {
  id: string
  modelId: string
  modelType: 'tts' | 'asr'
  inputText?: string
  inputAudioUrl?: string
  outputUrl?: string
  outputText?: string
  voice?: string
  format?: string
  speed?: number
  durationSec?: number
  creditsCharged: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  createdTime: string
}

export interface TtsRequest {
  modelId: string
  text: string
  voice?: string
  format?: string
  speed?: number
}

export interface AsrRequest {
  modelId: string
  audioUrl: string
  language?: string
}

// ==================== Tab 类型 ====================

export type BasicTabKey = 'chat' | 'image' | 'video' | 'speech'

export interface BasicTab {
  key: BasicTabKey
  label: string
  icon: string
  description: string
}

// ==================== 动态参数面板类型 ====================

/**
 * 参数 Schema 项（用于动态渲染参数面板）
 */
export interface ParamSchemaItem {
  type: 'select' | 'slider' | 'input' | 'switch' | 'textarea' | 'image'
  label: string
  default?: unknown
  min?: number
  max?: number
  step?: number
  rows?: number
  inputType?: string
  placeholder?: string
  description?: string
  required?: boolean
  options?: Array<{
    value: unknown
    label: string
  }>
}

/**
 * 工作台显示模式
 * - feed: 流式列表模式，适合快速生成
 * - classic: 经典模式，带参数面板
 */
export type WorkbenchMode = 'feed' | 'classic'

// ==================== 图像生成参数扩展 ====================

/**
 * 图像生成参数（扩展版，包含更多选项）
 */
export interface ImageGenerationParams {
  size?: string
  n?: number
  quality?: string
  style?: string
  background?: string
  aspectRatio?: string
  personGeneration?: string
  safetyFilterLevel?: string
  seed?: number
  steps?: number
  guidance?: number
}
