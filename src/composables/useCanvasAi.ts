/**
 * Canvas AI 生成 Composable
 *
 * 统一封装 4 种 AI 生成能力，连接到现有 Playground API：
 * - AI Chat: 调用 playground basic chat SSE API
 * - AI Image: 调用 playground basic image API（非流式）
 * - AI Video: 调用 playground basic video API（非流式）
 * - AI Audio: 调用 playground basic speech TTS API（非流式）
 *
 * 所有函数使用统一的回调接口：
 * - onProgress(progress: number, message: string)
 * - onComplete(result: T)
 * - onError(error: Error)
 *
 * 返回 AbortController 用于取消操作。
 * 当真实 API 调用失败时，自动降级到 mock 实现。
 *
 * @author Han
 * @since 2026-02-19
 */

import type { AiImageNodeData, AiVideoNodeData, AiAudioNodeData } from '@/types/canvas'
import type { BasicChatEvent } from '@/types/playground-basic'
import { chatApi, imageApi, videoApi, speechApi } from '@/api/playground-basic'
import i18n from '@/i18n'

const t = i18n.global.t
import {
  mockAiChatGenerate,
  mockAiImageGenerate,
  mockAiVideoGenerate,
  mockAiAudioGenerate
} from '@/__mocks__/useCanvasMock'

// ==================== 内部工具 ====================

const LOG_PREFIX = '[CanvasAI]'

/** 延迟函数 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 模拟进度推进（用于非流式 API）
 * 在 API 调用期间平滑推进进度，到达 maxProgress 后停止等待完成
 */
function simulateProgress(
  onProgress: (progress: number, message: string) => void,
  steps: Array<{ progress: number; message: string; delay: number }>,
  signal: AbortSignal
): Promise<void> {
  return new Promise(async (resolve) => {
    for (const step of steps) {
      if (signal.aborted) {
        resolve()
        return
      }
      await delay(step.delay)
      if (signal.aborted) {
        resolve()
        return
      }
      onProgress(step.progress, step.message)
    }
    resolve()
  })
}

// ==================== AI Chat 生成 ====================

/**
 * AI Chat 生成 - 调用真实 chat SSE API
 *
 * 使用 SSE 流式接口获取聊天回复，实时更新进度。
 * 失败时降级到 mock 实现。
 */
export function aiChatGenerate(
  prompt: string,
  context: string[],
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: string) => void,
  onError?: (error: Error) => void
): AbortController {
  const controller = new AbortController()

  const run = async () => {
    try {
      onProgress(10, t('composable.canvasAi.connectingAiService'))

      // 构建上下文 system prompt（如果有连接的节点内容）
      const systemPrompt = context.length > 0
        ? `以下是相关的上下文信息：\n${context.join('\n---\n')}\n\n请基于以上上下文回答用户的问题。`
        : undefined

      const url = chatApi.getStreamUrl()
      const headers = chatApi.getStreamHeaders()

      const body = JSON.stringify({
        modelId: 'gpt-4o-mini',
        message: prompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2048
      })

      onProgress(20, t('composable.canvasAi.sendingRequest'))

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let sessionId: string | undefined

      onProgress(30, t('composable.canvasAi.generating'))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = line.slice(5).trim()
              if (!data) continue

              const event: BasicChatEvent = JSON.parse(data)

              switch (event.type) {
                case 'STARTED':
                  sessionId = event.sessionId
                  onProgress(35, t('composable.canvasAi.startGeneratingReply'))
                  break

                case 'CONTENT':
                  if (event.content) {
                    fullContent += event.content
                    // 根据内容长度计算进度，在 35%-90% 之间
                    const contentProgress = Math.min(90, 35 + Math.floor(fullContent.length / 20))
                    onProgress(contentProgress, t('composable.canvasAi.outputting'))
                  }
                  break

                case 'DONE':
                  onProgress(95, t('composable.canvasAi.generationComplete'))
                  break

                case 'ERROR':
                  throw new Error(event.error || t('composable.canvasAi.aiGenerationFailed'))
              }
            } catch (e) {
              // 如果是我们自己抛出的 Error，继续抛出
              if (e instanceof Error && e.message !== t('composable.canvasAi.aiGenerationFailed')) {
                console.warn(`${LOG_PREFIX} 解析 Chat SSE 事件失败:`, line, e)
              } else {
                throw e
              }
            }
          }
        }
      }

      if (controller.signal.aborted) return

      if (fullContent) {
        onProgress(100, t('composable.canvasAi.complete'))
        onComplete(fullContent)
      } else {
        throw new Error(t('composable.canvasAi.noValidReply'))
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log(`${LOG_PREFIX} Chat 请求已取消`)
        return
      }

      console.warn(`${LOG_PREFIX} Chat 真实 API 调用失败，降级到 mock:`, error)

      // 降级到 mock
      const mockController = mockAiChatGenerate(prompt, context, onProgress, onComplete, onError)

      // 同步取消行为
      controller.signal.addEventListener('abort', () => mockController.abort())
    }
  }

  run()
  return controller
}

// ==================== AI Image 生成 ====================

/**
 * AI Image 生成 - 调用真实 image API（非流式）
 *
 * 使用 playground basic image generate API 生成图像。
 * 失败时降级到 mock 实现。
 */
export function aiImageGenerate(
  prompt: string,
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: AiImageNodeData['result']) => void,
  onError?: (error: Error) => void
): AbortController {
  const controller = new AbortController()

  const progressSteps = [
    { progress: 15, message: t('composable.canvasAi.analyzingPrompt'), delay: 300 },
    { progress: 30, message: t('composable.canvasAi.connectingImageService'), delay: 500 },
    { progress: 50, message: t('composable.canvasAi.generatingImage'), delay: 2000 },
    { progress: 70, message: t('composable.canvasAi.renderingDetails'), delay: 2000 },
    { progress: 85, message: t('composable.canvasAi.optimizingOutput'), delay: 1500 }
  ]

  const run = async () => {
    try {
      onProgress(10, t('composable.canvasAi.preparing'))

      // 并行启动进度模拟和实际 API 调用
      const progressPromise = simulateProgress(onProgress, progressSteps, controller.signal)

      const apiPromise = imageApi.generate({
        modelId: 'gpt-image-1',
        prompt,
        params: {
          size: '1024x1024',
          quality: 'auto'
        }
      })

      // 等待 API 返回（进度模拟在后台运行）
      const response = await apiPromise

      if (controller.signal.aborted) return

      // 停止进度模拟，跳到完成
      onProgress(95, t('composable.canvasAi.processingResult'))

      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || t('composable.canvasAi.imageGenerationFailed'))
      }

      const imageMessage = response.data
      const images = imageMessage.content?.images
      const firstImage = images?.[0]

      if (!firstImage?.url) {
        throw new Error(t('composable.canvasAi.noValidImage'))
      }

      onProgress(100, t('composable.canvasAi.complete'))
      onComplete({
        url: firstImage.url,
        thumbnailUrl: firstImage.thumbnailUrl || firstImage.url,
        revisedPrompt: firstImage.revisedPrompt || imageMessage.content?.revisedPrompt
      })
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log(`${LOG_PREFIX} Image 请求已取消`)
        return
      }

      console.warn(`${LOG_PREFIX} Image 真实 API 调用失败，降级到 mock:`, error)

      const mockController = mockAiImageGenerate(prompt, onProgress, onComplete, onError)
      controller.signal.addEventListener('abort', () => mockController.abort())
    }
  }

  run()
  return controller
}

// ==================== AI Video 生成 ====================

/**
 * AI Video 生成 - 调用真实 video API（非流式 + 轮询）
 *
 * 使用 playground basic video generate API 生成视频。
 * 视频生成通常是异步的：先提交生成请求，然后轮询状态直到完成。
 * 失败时降级到 mock 实现。
 */
export function aiVideoGenerate(
  prompt: string,
  inputImages: string[],
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: AiVideoNodeData['result']) => void,
  onError?: (error: Error) => void
): AbortController {
  const controller = new AbortController()

  const run = async () => {
    try {
      onProgress(10, t('composable.canvasAi.preparing'))

      // 提交视频生成请求
      onProgress(15, t('composable.canvasAi.submittingRequest'))

      const generateResponse = await videoApi.generate({
        modelId: 'video-gen-1',
        prompt,
        inputImageUrl: inputImages.length > 0 ? inputImages[0] : undefined,
        resolution: '720p',
        durationSec: 5
      })

      if (controller.signal.aborted) return

      if (generateResponse.code !== 200 || !generateResponse.data) {
        throw new Error(generateResponse.message || t('composable.canvasAi.videoRequestFailed'))
      }

      const generation = generateResponse.data
      const generationId = generation.id

      onProgress(25, t('composable.canvasAi.videoGenerationStarted'))

      // 轮询状态
      const POLL_INTERVAL = 3000
      const MAX_POLLS = 120 // 最多轮询 6 分钟

      for (let i = 0; i < MAX_POLLS; i++) {
        if (controller.signal.aborted) return

        await delay(POLL_INTERVAL)

        if (controller.signal.aborted) return

        const statusResponse = await videoApi.getStatus(generationId)

        if (controller.signal.aborted) return

        if (statusResponse.code !== 200 || !statusResponse.data) {
          continue // 状态查询失败时继续轮询
        }

        const status = statusResponse.data

        // 更新进度（25% 到 90% 之间）
        const pollProgress = Math.min(90, 25 + Math.floor(status.progress * 0.65))
        const statusMessages: Record<string, string> = {
          pending: t('composable.canvasAi.statusPending'),
          processing: t('composable.canvasAi.statusProcessing'),
          completed: t('composable.canvasAi.statusCompleted'),
          failed: t('composable.canvasAi.statusFailed')
        }
        onProgress(pollProgress, statusMessages[status.status] || t('composable.canvasAi.processing'))

        if (status.status === 'completed') {
          if (!status.videoUrl) {
            throw new Error(t('composable.canvasAi.videoNoUrl'))
          }

          onProgress(100, t('composable.canvasAi.complete'))
          onComplete({
            url: status.videoUrl,
            thumbnailUrl: status.thumbnailUrl,
            duration: status.durationSec
          })
          return
        }

        if (status.status === 'failed') {
          throw new Error(status.errorMessage || t('composable.canvasAi.statusFailed'))
        }
      }

      throw new Error(t('composable.canvasAi.videoTimeout'))
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log(`${LOG_PREFIX} Video 请求已取消`)
        return
      }

      console.warn(`${LOG_PREFIX} Video 真实 API 调用失败，降级到 mock:`, error)

      const mockController = mockAiVideoGenerate(prompt, inputImages, onProgress, onComplete, onError)
      controller.signal.addEventListener('abort', () => mockController.abort())
    }
  }

  run()
  return controller
}

// ==================== AI Audio 生成 ====================

/**
 * AI Audio 生成 - 调用真实 speech TTS API（非流式）
 *
 * 使用 playground basic speech TTS API 将文本转换为语音。
 * 对于 music 和 sfx 类型，目前直接降级到 mock（后端暂无对应 API）。
 * 失败时降级到 mock 实现。
 */
export function aiAudioGenerate(
  prompt: string,
  type: 'tts' | 'music' | 'sfx',
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: AiAudioNodeData['result']) => void,
  onError?: (error: Error) => void
): AbortController {
  const controller = new AbortController()

  // music 和 sfx 类型目前无真实 API，直接使用 mock
  if (type !== 'tts') {
    console.log(`${LOG_PREFIX} Audio type "${type}" 暂无真实 API，使用 mock`)
    return mockAiAudioGenerate(prompt, type, onProgress, onComplete, onError)
  }

  const progressSteps = [
    { progress: 15, message: t('composable.canvasAi.analyzingText'), delay: 300 },
    { progress: 30, message: t('composable.canvasAi.connectingSpeechService'), delay: 500 },
    { progress: 55, message: t('composable.canvasAi.synthesizingSpeech'), delay: 1500 },
    { progress: 75, message: t('composable.canvasAi.optimizingAudio'), delay: 1000 }
  ]

  const run = async () => {
    try {
      onProgress(10, t('composable.canvasAi.preparing'))

      // 并行启动进度模拟和实际 API 调用
      const progressPromise = simulateProgress(onProgress, progressSteps, controller.signal)

      const apiPromise = speechApi.textToSpeech({
        modelId: 'tts-1',
        text: prompt,
        voice: 'alloy',
        speed: 1.0
      })

      const response = await apiPromise

      if (controller.signal.aborted) return

      onProgress(90, t('composable.canvasAi.processingResult'))

      if (response.code !== 200 || !response.data) {
        throw new Error(response.message || t('composable.canvasAi.speechSynthesisFailed'))
      }

      const speechGeneration = response.data

      if (speechGeneration.status === 'failed') {
        throw new Error(speechGeneration.errorMessage || t('composable.canvasAi.speechSynthesisFailed'))
      }

      if (!speechGeneration.outputUrl) {
        throw new Error(t('composable.canvasAi.noValidAudio'))
      }

      onProgress(100, t('composable.canvasAi.complete'))
      onComplete({
        url: speechGeneration.outputUrl,
        duration: speechGeneration.durationSec
      })
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log(`${LOG_PREFIX} Audio 请求已取消`)
        return
      }

      console.warn(`${LOG_PREFIX} Audio 真实 API 调用失败，降级到 mock:`, error)

      const mockController = mockAiAudioGenerate(prompt, type, onProgress, onComplete, onError)
      controller.signal.addEventListener('abort', () => mockController.abort())
    }
  }

  run()
  return controller
}
