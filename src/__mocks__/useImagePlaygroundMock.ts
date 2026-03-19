/**
 * 图像 Playground Mock 数据层
 *
 * 开发调试用，提供模拟的会话、消息和流式生成
 *
 * @author Han
 * @since 2026-02-03
 */

import type {
  ImageModelConfig,
  ImageSession,
  ImageMessage,
  GeneratedImage,
  ImageStreamEvent,
  ImageGenerateRequest
} from '@/types/playground-image'

// ==================== 配置 ====================

/** 是否启用 Mock 模式 */
export const USE_MOCK = false

// ==================== Mock 数据 ====================

/** Mock 模型列表 */
export const MOCK_MODELS: ImageModelConfig[] = [
  {
    id: 'gpt-image-1',
    provider: 'openai',
    displayName: 'GPT Image 1',
    description: 'OpenAI 最新图像生成模型，支持编辑和变体',
    capabilities: {
      supportsEditing: true,
      supportsVariation: true,
      supportsMultiTurn: true,
      supportedSizes: ['1024x1024', '1024x1792', '1792x1024', 'auto'],
      supportedQualities: ['low', 'medium', 'high', 'auto'],
      supportedBackgrounds: ['opaque', 'transparent', 'auto'],
      maxImages: 4
    },
    creditPrice: 0.04,
    minTier: 'free'
  },
  {
    id: 'dall-e-3',
    provider: 'openai',
    displayName: 'DALL-E 3',
    description: '高质量艺术创作，支持 HD 模式',
    capabilities: {
      supportsEditing: false,
      supportsVariation: false,
      supportsMultiTurn: false,
      supportedSizes: ['1024x1024', '1024x1792', '1792x1024'],
      supportedQualities: ['standard', 'hd'],
      supportedStyles: ['vivid', 'natural'],
      maxImages: 1
    },
    creditPrice: 0.08,
    minTier: 'pro'
  },
  {
    id: 'imagen-3',
    provider: 'google',
    displayName: 'Imagen 3',
    description: 'Google 最新图像生成模型',
    capabilities: {
      supportsEditing: false,
      supportsVariation: false,
      supportsMultiTurn: false,
      supportedAspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
      personGenerationOptions: ['DONT_ALLOW', 'ALLOW_ADULT'],
      safetyFilterLevels: ['BLOCK_LOW_AND_ABOVE', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_ONLY_HIGH'],
      maxImages: 4
    },
    creditPrice: 0.03,
    minTier: 'free'
  }
]

/** Mock 图像 URL（使用 picsum） */
const MOCK_IMAGE_URLS = [
  'https://picsum.photos/seed/img1/1024/1024',
  'https://picsum.photos/seed/img2/1024/1024',
  'https://picsum.photos/seed/img3/1024/1024',
  'https://picsum.photos/seed/img4/1024/1024',
  'https://picsum.photos/seed/img5/1024/1024',
  'https://picsum.photos/seed/img6/1024/1024'
]

/** 生成 Mock 会话列表 */
export function generateMockSessions(count = 5): ImageSession[] {
  const sessions: ImageSession[] = []
  const prompts = [
    '赛博朋克城市夜景',
    '水彩风格的樱花树',
    '未来科技感办公室',
    '中国山水画风格的现代建筑',
    '梵高星空风格的上海外滩'
  ]

  for (let i = 0; i < count; i++) {
    const createdTime = new Date(Date.now() - i * 3600000).toISOString()
    sessions.push({
      id: `session-${i + 1}`,
      modelId: MOCK_MODELS[i % MOCK_MODELS.length].id,
      title: prompts[i % prompts.length],
      messageCount: 2,
      thumbnailUrl: MOCK_IMAGE_URLS[i % MOCK_IMAGE_URLS.length],
      creditsCharged: 0.04,
      createdTime,
      updatedTime: createdTime
    })
  }

  return sessions
}

/** 生成 Mock 消息列表 */
export function generateMockMessages(sessionId: string): ImageMessage[] {
  const now = new Date().toISOString()
  const session = generateMockSessions().find(s => s.id === sessionId)
  const prompt = session?.title || '测试图像生成'
  const sessionIndex = parseInt(sessionId.split('-')[1]) || 1

  // 根据 session 选择不同的参数配置
  const paramsVariants = [
    { numberOfImages: 1, size: '1024x1024', quality: 'standard', style: 'vivid' },
    { numberOfImages: 2, size: '1024x1792', quality: 'hd', style: 'natural' },
    { numberOfImages: 1, size: '1792x1024', quality: 'standard', style: 'vivid' },
    { numberOfImages: 4, aspectRatio: '16:9' },
    { numberOfImages: 1, size: '1024x1024', quality: 'hd', style: 'vivid' }
  ]

  const params = paramsVariants[(sessionIndex - 1) % paramsVariants.length]

  return [
    {
      id: `${sessionId}-msg-1`,
      sessionId,
      role: 'user',
      type: 'image_request',
      content: {
        prompt,
        params
      },
      creditsCharged: 0,
      createdTime: now
    },
    {
      id: `${sessionId}-msg-2`,
      sessionId,
      role: 'assistant',
      type: 'image_result',
      content: {
        prompt,
        params,
        images: [
          {
            id: `${sessionId}-img-1`,
            url: MOCK_IMAGE_URLS[sessionIndex % MOCK_IMAGE_URLS.length],
            thumbnailUrl: MOCK_IMAGE_URLS[sessionIndex % MOCK_IMAGE_URLS.length],
            width: 1024,
            height: 1024,
            revisedPrompt: `${prompt}，高清细节，专业摄影，8K分辨率`
          }
        ],
        revisedPrompt: `${prompt}，高清细节，专业摄影，8K分辨率`
      },
      creditsCharged: 0.04,
      createdTime: now
    }
  ]
}

/** 生成 Mock 图像 */
function generateMockImage(index: number): GeneratedImage {
  const url = `https://picsum.photos/seed/gen${Date.now()}-${index}/1024/1024`
  return {
    id: `gen-img-${Date.now()}-${index}`,
    url,
    thumbnailUrl: url,
    width: 1024,
    height: 1024,
    revisedPrompt: '生成的图像'
  }
}

// ==================== Mock API ====================

/** Mock 获取模型列表 */
export async function mockGetModels(): Promise<ImageModelConfig[]> {
  await delay(300)
  return MOCK_MODELS
}

/** Mock 获取会话列表 */
export async function mockGetSessions(): Promise<ImageSession[]> {
  await delay(500)
  return generateMockSessions()
}

/** Mock 获取会话消息 */
export async function mockGetMessages(sessionId: string): Promise<ImageMessage[]> {
  await delay(300)
  return generateMockMessages(sessionId)
}

/** Mock 删除会话 */
export async function mockDeleteSession(sessionId: string): Promise<boolean> {
  await delay(200)
  console.log('[Mock] 删除会话:', sessionId)
  return true
}

/**
 * Mock 流式生成图像
 *
 * @param request 生成请求
 * @param onEvent 事件回调
 * @param onError 错误回调
 * @param onComplete 完成回调
 * @returns AbortController
 */
export function mockStreamGenerateImage(
  request: ImageGenerateRequest,
  onEvent: (event: ImageStreamEvent) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): AbortController {
  const controller = new AbortController()
  const sessionId = request.sessionId || `session-${Date.now()}`
  const messageId = `msg-${Date.now()}`
  const numberOfImages = request.params?.numberOfImages || 1

  let aborted = false
  controller.signal.addEventListener('abort', () => {
    aborted = true
  })

  const runStream = async () => {
    try {
      // STARTED
      await delay(200)
      if (aborted) return
      onEvent({
        type: 'STARTED',
        sessionId,
        messageId
      })

      // PROGRESS 0% -> 30%
      for (let p = 0; p <= 30; p += 10) {
        await delay(300)
        if (aborted) return
        onEvent({
          type: 'PROGRESS',
          progress: p,
          progressMessage: '正在理解您的描述...'
        })
      }

      // PROGRESS 30% -> 80%
      for (let p = 40; p <= 80; p += 20) {
        await delay(500)
        if (aborted) return
        onEvent({
          type: 'PROGRESS',
          progress: p,
          progressMessage: '正在生成图像...'
        })
      }

      // IMAGE events
      for (let i = 0; i < numberOfImages; i++) {
        await delay(400)
        if (aborted) return
        onEvent({
          type: 'IMAGE',
          image: generateMockImage(i),
          revisedPrompt: request.prompt
        })
      }

      // PROGRESS 100%
      await delay(200)
      if (aborted) return
      onEvent({
        type: 'PROGRESS',
        progress: 100,
        progressMessage: '生成完成'
      })

      // DONE
      await delay(100)
      if (aborted) return
      onEvent({
        type: 'DONE',
        creditsCharged: 0.04 * numberOfImages
      })

      onComplete?.()
    } catch (error) {
      if (!aborted) {
        onError?.(error as Error)
      }
    }
  }

  runStream()

  return controller
}

// ==================== 工具函数 ====================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
