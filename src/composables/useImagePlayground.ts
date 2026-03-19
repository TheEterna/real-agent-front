/**
 * Image Playground Composable
 *
 * 封装图像生成页面的核心逻辑：
 * - 模型加载与选择（使用 Pinia Store 作为单一数据源）
 * - 参数管理（allParams + activeParamSchema）
 * - 会话与消息管理
 * - SSE 流式图像生成
 *
 * 对应后端 `/playground/basic/image` 接口。
 *
 * @author Han
 * @since 2026-02-03
 */

import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useImagePlaygroundStore } from '@/stores/imagePlaygroundStore'
import { streamGenerateImage } from '@/api/playground-image'
import type {
  ImageModelConfig,
  ImageSession,
  ImageMessage,
  GeneratedImage,
  ImageStreamEvent
} from '@/types/playground-image'
import type { ParamSchemaItem } from '@/types/playground-basic'

export function useImagePlayground() {
  const { t } = useI18n()

  // =====================================================
  // Store 接入：单一数据源
  // =====================================================
  const store = useImagePlaygroundStore()

  const imageModels = computed(() => store.imageModels)
  const sessions = computed(() => store.sessions)
  const allParams = computed(() => store.allParams)
  const selectedModelId = computed(() => store.selectedModelId)

  const loadingModels = computed(() => store.isLoadingModels)
  const loadingSessions = computed(() => store.isLoadingSessions)

  const selectedModel = computed(() => store.getSelectedModel())

  // =====================================================
  // 会话与消息状态（依赖 Store 的 messagesBySession）
  // =====================================================
  const currentSessionId = ref<string | null>(null)
  const selectedMessageId = ref<string | null>(null)

  const currentMessages = computed<ImageMessage[]>(() => {
    if (!currentSessionId.value) return []
    return store.messagesBySession[currentSessionId.value] || []
  })

  const assistantMessages = computed(() =>
    currentMessages.value.filter(m => m.role === 'assistant' && m.content.images?.length)
  )

  const selectedMessage = computed<ImageMessage | undefined>(() =>
    currentMessages.value.find(m => m.id === selectedMessageId.value)
  )

  // =====================================================
  // 统一参数 Schema（基于模型能力）
  // =====================================================
  const activeParamSchema = computed<Record<string, ParamSchemaItem>>(() => {
    const model = selectedModel.value
    if (!model?.capabilities) return {}

    const schema: Record<string, ParamSchemaItem> = {}
    const caps = model.capabilities

    // 1. 尺寸参数 (OpenAI)
    if (caps.supportedSizes?.length) {
      schema.size = {
        type: 'select',
        label: t('composable.imagePlayground.sizeLabel'),
        default: caps.supportedSizes[0],
        options: caps.supportedSizes.map(size => ({
          value: size,
          label: formatSizeLabel(size)
        }))
      }
    }

    // 2. 宽高比参数 (Gemini)
    if (caps.supportedAspectRatios?.length) {
      schema.aspectRatio = {
        type: 'select',
        label: t('composable.imagePlayground.aspectRatioLabel'),
        default: caps.supportedAspectRatios[0],
        options: caps.supportedAspectRatios.map(ratio => ({
          value: ratio,
          label: ratio
        }))
      }
    }

    // 3. 数量参数
    if (caps.maxImages && caps.maxImages > 1) {
      const opts = [1, 2, 4].filter(c => c <= caps.maxImages!)
      schema.n = {
        type: 'select',
        label: t('composable.imagePlayground.countLabel'),
        default: 1,
        options: opts.map(v => ({ value: v, label: t('composable.imagePlayground.countUnit', { n: v }) }))
      }
    }

    // 4. 质量参数 (OpenAI)
    if (caps.supportedQualities?.length) {
      schema.quality = {
        type: 'select',
        label: t('composable.imagePlayground.qualityLabel'),
        default: caps.supportedQualities[0],
        options: caps.supportedQualities.map(q => ({
          value: q,
          label: q === 'hd' ? t('composable.imagePlayground.qualityHd') : q === 'standard' ? t('composable.imagePlayground.qualityStandard') : q
        }))
      }
    }

    // 5. 风格参数 (OpenAI DALL-E 3)
    if (caps.supportedStyles?.length) {
      schema.style = {
        type: 'select',
        label: t('composable.imagePlayground.styleLabel'),
        default: caps.supportedStyles[0],
        options: caps.supportedStyles.map(s => ({
          value: s,
          label: s === 'vivid' ? t('composable.imagePlayground.styleVivid') : s === 'natural' ? t('composable.imagePlayground.styleNatural') : s
        }))
      }
    }

    return schema
  })

  // =====================================================
  // 生成状态（SSE 流）
  // =====================================================
  const prompt = ref('')
  const generating = ref(false)
  const generatingImages = ref<GeneratedImage[]>([])
  const generationProgress = ref(0)
  const progressMessage = ref('')

  // =====================================================
  // 工具函数
  // =====================================================
  function formatSizeLabel(size: string): string {
    const [w, h] = size.split('x').map(Number)
    if (!w || !h) return size
    if (w === h) return '1:1'
    const ratio = w / h
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9'
    if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16'
    if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3'
    if (Math.abs(ratio - 3 / 4) < 0.1) return '3:4'
    return `${w}:${h}`
  }

  // =====================================================
  // 数据加载
  // =====================================================
  async function loadModels(force = false) {
    await store.fetchModels(force)
  }

  async function loadSessions(force = false) {
    await store.fetchSessions(force)
  }

  async function selectSession(session: ImageSession) {
    currentSessionId.value = session.id
    try {
      const messages = await store.fetchMessages(session.id)
      const lastAiMsg = messages.filter(m => m.role === 'assistant' && m.content.images?.length).pop()
      if (lastAiMsg) {
        selectedMessageId.value = lastAiMsg.id
      }
    } catch (e) {
      console.error('[useImagePlayground] 加载会话消息失败:', e)
    }
  }

  function selectMessage(msg: ImageMessage) {
    selectedMessageId.value = msg.id
  }

  async function deleteSession(sessionId: string): Promise<boolean> {
    const ok = await store.deleteSession(sessionId)
    if (ok) {
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
        selectedMessageId.value = null
      }
    }
    return ok
  }

  function createNewTask() {
    currentSessionId.value = null
    selectedMessageId.value = null
    generatingImages.value = []
    prompt.value = ''
  }

  function selectModel(model: ImageModelConfig) {
    store.selectModel(model)
  }

  function updateParam(key: string, value: unknown) {
    store.updateParam(key as string, value)
  }

  // =====================================================
  // 请求构建与生成
  // =====================================================
  function buildGenerateRequest() {
    const model = selectedModel.value
    if (!model) return null

    return {
      modelId: model.id,
      sessionId: currentSessionId.value || undefined,
      prompt: prompt.value.trim(),
      params: {
        numberOfImages: (allParams.value as any).n || 1,
        size: (allParams.value as any).size,
        quality: (allParams.value as any).quality,
        style: (allParams.value as any).style
      }
    }
  }

  function generateImage() {
    if (!prompt.value.trim() || !selectedModelId.value || generating.value) return

    const request = buildGenerateRequest()
    if (!request) return

    generating.value = true
    generatingImages.value = []
    generationProgress.value = 0
    progressMessage.value = t('composable.imagePlayground.preparingProgress')

    const currentPrompt = prompt.value
    prompt.value = ''

    streamGenerateImage(
      request,
      (event: ImageStreamEvent) => {
        switch (event.type) {
          case 'STARTED':
            if (event.sessionId) {
              currentSessionId.value = event.sessionId
            }
            progressMessage.value = t('composable.imagePlayground.startGenerating')
            break
          case 'PROGRESS':
            generationProgress.value = event.progress || 0
            progressMessage.value = event.progressMessage || t('composable.imagePlayground.generatingProgress')
            break
          case 'IMAGE':
            if (event.image) {
              generatingImages.value = [...generatingImages.value, event.image]
            }
            break
          case 'DONE':
            generating.value = false
            generationProgress.value = 100
            progressMessage.value = t('composable.imagePlayground.completeProgress')
            // 刷新会话列表及当前会话消息
            loadSessions(true)
            if (currentSessionId.value) {
              store.fetchMessages(currentSessionId.value, true).catch(() => {})
            }
            message.success(t('composable.imagePlayground.imageGenComplete'))
            break
          case 'ERROR':
            generating.value = false
            progressMessage.value = ''
            message.error(event.errorMessage || t('composable.imagePlayground.generationFailed'))
            break
        }
      },
      (error) => {
        generating.value = false
        progressMessage.value = ''
        message.error(error.message || t('composable.imagePlayground.generationFailed'))
        console.error('[useImagePlayground] 流式生成失败:', error)
        // 如果请求一开始就失败，还原 prompt 方便用户修改重试
        if (!currentSessionId.value) {
          prompt.value = currentPrompt
        }
      }
    )
  }

  return {
    // State
    loadingModels,
    loadingSessions,
    imageModels,
    sessions,
    allParams,
    selectedModelId,
    selectedModel,
    currentSessionId,
    currentMessages,
    assistantMessages,
    selectedMessageId,
    selectedMessage,
    activeParamSchema,
    prompt,
    generating,
    generatingImages,
    generationProgress,
    progressMessage,
    // Actions
    loadModels,
    loadSessions,
    selectSession,
    selectMessage,
    deleteSession,
    createNewTask,
    selectModel,
    updateParam,
    generateImage,
    // Utils
    formatSizeLabel
  }
}

