/**
 * 图像 Playground 类型定义
 *
 * @author Han
 * @since 2026-01-28
 */

// ==================== 模型配置 ====================

/**
 * 模型能力配置
 */
export interface ModelCapabilities {
  supportsEditing: boolean
  supportsVariation: boolean
  supportsMultiTurn: boolean
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

/**
 * 图像模型配置
 */
export interface ImageModelConfig {
  id: string
  provider: 'openai' | 'google'
  displayName: string
  description: string
  capabilities: ModelCapabilities
  creditPrice: number
  minTier: string
  iconUrl?: string
}

// ==================== 会话 ====================

/**
 * 图像会话
 */
export interface ImageSession {
  id: string
  modelId: string
  title: string
  messageCount: number
  thumbnailUrl?: string
  creditsCharged: number
  createdTime: string
  updatedTime: string
}

// ==================== 消息 ====================

/**
 * 生成参数（统一接口）
 */
export interface ImageGenerationParams {
  numberOfImages?: number
  // OpenAI
  size?: string
  quality?: string
  style?: string
  background?: string
  // Gemini
  aspectRatio?: string
  personGeneration?: string
  safetyFilterLevel?: string
}

/**
 * 生成的图像
 */
export interface GeneratedImage {
  id: string
  url: string
  thumbnailUrl?: string
  width: number
  height: number
  revisedPrompt?: string
}

/**
 * 消息内容
 */
export interface MessageContent {
  text?: string
  prompt?: string
  negativePrompt?: string
  params?: ImageGenerationParams
  images?: GeneratedImage[]
  revisedPrompt?: string
  errorMessage?: string
}

/**
 * 图像消息
 */
export interface ImageMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  type: 'text' | 'image_request' | 'image_result' | 'error'
  content: MessageContent
  creditsCharged: number
  createdTime: string
}

// ==================== 请求 ====================

/**
 * 图像生成请求
 */
export interface ImageGenerateRequest {
  sessionId?: string
  modelId: string
  prompt: string
  negativePrompt?: string
  params?: ImageGenerationParams
  referenceImageId?: string
  editType?: 'generate' | 'edit' | 'variation'
  maskBase64?: string
}

// ==================== 流式事件 ====================

/**
 * 流式事件类型
 */
export type ImageStreamEventType = 'STARTED' | 'PROGRESS' | 'IMAGE' | 'DONE' | 'ERROR'

/**
 * 流式事件
 */
export interface ImageStreamEvent {
  type: ImageStreamEventType
  sessionId?: string
  messageId?: string
  progress?: number
  progressMessage?: string
  image?: GeneratedImage
  revisedPrompt?: string
  creditsCharged?: number
  errorMessage?: string
}

// ==================== UI 状态 ====================

/**
 * 生成状态
 */
export type GenerationStatus = 'idle' | 'generating' | 'success' | 'error'

/**
 * 参数面板状态
 */
export interface ParameterPanelState {
  isOpen: boolean
  // OpenAI 参数
  size: string
  quality: string
  style: string
  background: string
  numberOfImages: number
  // Gemini 参数
  aspectRatio: string
  personGeneration: string
  safetyFilterLevel: string
}

/**
 * 默认参数值
 */
export const DEFAULT_PARAMS: ParameterPanelState = {
  isOpen: true,
  // OpenAI
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
  background: 'opaque',
  numberOfImages: 1,
  // Gemini
  aspectRatio: '1:1',
  personGeneration: 'ALLOW_ADULT',
  safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE'
}

/**
 * 尺寸选项（OpenAI）
 */
export const OPENAI_SIZE_OPTIONS = [
  { value: '1024x1024', label: '1024×1024 (正方形)' },
  { value: '1024x1792', label: '1024×1792 (竖版)' },
  { value: '1792x1024', label: '1792×1024 (横版)' },
  { value: '1536x1024', label: '1536×1024 (横版 3:2)' },
  { value: '1024x1536', label: '1024×1536 (竖版 2:3)' },
  { value: 'auto', label: '自动' }
]

/**
 * 质量选项（OpenAI DALL-E 3）
 */
export const DALLE3_QUALITY_OPTIONS = [
  { value: 'standard', label: '标准' },
  { value: 'hd', label: '高清 (HD)' }
]

/**
 * 质量选项（OpenAI gpt-image-1）
 */
export const GPT_IMAGE_QUALITY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'auto', label: '自动' }
]

/**
 * 风格选项（OpenAI DALL-E 3）
 */
export const STYLE_OPTIONS = [
  { value: 'vivid', label: '生动 (Vivid)' },
  { value: 'natural', label: '自然 (Natural)' }
]

/**
 * 背景选项（OpenAI gpt-image-1）
 */
export const BACKGROUND_OPTIONS = [
  { value: 'opaque', label: '不透明' },
  { value: 'transparent', label: '透明' },
  { value: 'auto', label: '自动' }
]

/**
 * 宽高比选项（Gemini）
 */
export const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1 (正方形)' },
  { value: '3:4', label: '3:4 (竖版)' },
  { value: '4:3', label: '4:3 (横版)' },
  { value: '9:16', label: '9:16 (手机竖屏)' },
  { value: '16:9', label: '16:9 (宽屏)' }
]

/**
 * 人物生成选项（Gemini）
 */
export const PERSON_GENERATION_OPTIONS = [
  { value: 'DONT_ALLOW', label: '不允许人物' },
  { value: 'ALLOW_ADULT', label: '允许成人' }
]

/**
 * 安全过滤级别（Gemini）
 */
export const SAFETY_FILTER_OPTIONS = [
  { value: 'BLOCK_LOW_AND_ABOVE', label: '严格 (屏蔽低风险及以上)' },
  { value: 'BLOCK_MEDIUM_AND_ABOVE', label: '中等 (屏蔽中风险及以上)' },
  { value: 'BLOCK_ONLY_HIGH', label: '宽松 (仅屏蔽高风险)' }
]
