/**
 * Video Playground Mock Composable
 *
 * 使用 Mock 数据验证全流程逻辑：
 * - 模型加载与选择
 * - 参数管理
 * - 视频生成模拟（带进度）
 * - 历史记录管理
 *
 * @author Han
 * @since 2026-02-03
 */

import { ref, computed } from 'vue'
import type { VideoModelConfig, VideoGeneration, ParamSchemaItem } from '@/types/playground-basic'

// =====================================================
// Mock 数据
// =====================================================
const MOCK_MODELS: VideoModelConfig[] = [
  {
    id: 'sora-1',
    provider: 'openai',
    displayName: 'Sora',
    description: 'OpenAI 最强视频生成模型，支持长达 60 秒的高质量视频',
    modelType: 'text2video',
    supportedResolutions: ['720p', '1080p', '4k'],
    maxDurationSec: 60,
    creditPrice: 100,
    minTier: 'pro',
    iconUrl: '',
    sortOrder: 1,
    defaultParams: { resolution: '1080p', durationSec: 5 },
    paramSchema: {
      fps: {
        type: 'select',
        label: '帧率 (FPS)',
        default: 24,
        options: [
          { value: 24, label: '24 fps (电影)' },
          { value: 30, label: '30 fps (标准)' },
          { value: 60, label: '60 fps (流畅)' }
        ]
      },
      style: {
        type: 'select',
        label: '风格',
        default: 'cinematic',
        options: [
          { value: 'cinematic', label: '电影感' },
          { value: 'anime', label: '动漫' },
          { value: 'realistic', label: '写实' },
          { value: 'abstract', label: '抽象' }
        ]
      }
    }
  },
  {
    id: 'runway-gen3',
    provider: 'runway',
    displayName: 'Gen-3 Alpha',
    description: 'Runway 最新一代模型，擅长运动一致性',
    modelType: 'text2video',
    supportedResolutions: ['720p', '1080p'],
    maxDurationSec: 10,
    creditPrice: 50,
    minTier: 'standard',
    iconUrl: '',
    sortOrder: 2,
    defaultParams: { resolution: '1080p', durationSec: 5 },
    paramSchema: {
      motionAmount: {
        type: 'slider',
        label: '运动幅度',
        default: 5,
        min: 1,
        max: 10,
        step: 1
      }
    }
  },
  {
    id: 'pika-1.5',
    provider: 'pika',
    displayName: 'Pika 1.5',
    description: '专注短视频创作，快速生成',
    modelType: 'text2video',
    supportedResolutions: ['720p', '1080p'],
    maxDurationSec: 4,
    creditPrice: 20,
    minTier: 'free',
    iconUrl: '',
    sortOrder: 3,
    defaultParams: { resolution: '720p', durationSec: 3 }
  },
  {
    id: 'kling-1',
    provider: 'kuaishou',
    displayName: 'Kling',
    description: '快手可灵，中文提示词优化',
    modelType: 'text2video',
    supportedResolutions: ['720p', '1080p'],
    maxDurationSec: 5,
    creditPrice: 30,
    minTier: 'standard',
    iconUrl: '',
    sortOrder: 4,
    defaultParams: { resolution: '1080p', durationSec: 5 }
  }
]

const MOCK_HISTORY: VideoGeneration[] = [
  {
    id: 'v-001',
    modelId: 'sora-1',
    prompt: 'A cinematic shot of a futuristic city at sunset, flying cars and neon lights, dramatic atmosphere',
    resolution: '1080p',
    durationSec: 10,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/v1/400/225',
    creditsCharged: 100,
    status: 'completed',
    progress: 100,
    createdTime: new Date(Date.now() - 3600000).toISOString(),
    completedTime: new Date(Date.now() - 3500000).toISOString()
  },
  {
    id: 'v-002',
    modelId: 'runway-gen3',
    prompt: 'A cat walking through a magical forest with glowing mushrooms',
    resolution: '720p',
    durationSec: 5,
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/v2/400/225',
    creditsCharged: 50,
    status: 'completed',
    progress: 100,
    createdTime: new Date(Date.now() - 7200000).toISOString(),
    completedTime: new Date(Date.now() - 7000000).toISOString()
  },
  {
    id: 'v-003',
    modelId: 'pika-1.5',
    prompt: 'Abstract liquid metal morphing into geometric shapes',
    resolution: '720p',
    durationSec: 3,
    videoUrl: '',
    thumbnailUrl: '',
    creditsCharged: 0,
    status: 'failed',
    progress: 0,
    errorMessage: 'Content policy violation detected',
    createdTime: new Date(Date.now() - 86400000).toISOString()
  }
]

// 灵感提示词
const INSPIRATION_PROMPTS = [
  'A breathtaking drone shot flying through a cherry blossom forest in Japan, petals falling in slow motion, golden hour lighting',
  'An astronaut floating in zero gravity inside a space station, Earth visible through the window, cinematic lighting',
  'A time-lapse of a massive storm forming over the ocean, lightning strikes, dramatic clouds swirling',
  'A close-up of a hummingbird hovering near a flower, wings in slow motion, macro photography style',
  'A cyberpunk street market at night, holographic advertisements, steam rising from food stalls, neon reflections on wet pavement',
  'An underwater scene of a coral reef coming to life at dawn, schools of colorful fish, rays of sunlight penetrating the water',
  'A cinematic shot of a lone samurai walking through a bamboo forest, mist in the air, autumn leaves falling',
  'A magical library where books float and pages turn by themselves, golden dust particles in the air',
  'A futuristic sports car driving through a mountain road at sunset, reflections on the body, motion blur',
  'An ancient dragon waking up in a crystal cave, scales glittering, smoke from nostrils, epic fantasy style'
]

export function useVideoPlaygroundMock() {
  // =====================================================
  // State
  // =====================================================
  const loadingModels = ref(false)
  const loadingHistory = ref(false)
  const generating = ref(false)
  const models = ref<VideoModelConfig[]>([])
  const history = ref<VideoGeneration[]>([])
  const feedItems = ref<VideoGeneration[]>([])
  const selectedModelId = ref<string>('')
  const prompt = ref('')
  const currentTaskId = ref<string | null>(null)

  // 模拟轮询
  let pollTimer: ReturnType<typeof setInterval> | null = null
  const isPolling = ref(false)

  // =====================================================
  // 统一参数管理
  // =====================================================
  const allParams = ref<Record<string, unknown>>({
    resolution: '1080p',
    durationSec: 5
  })

  // =====================================================
  // Computed
  // =====================================================
  const selectedModel = computed(() =>
    models.value.find(m => m.id === selectedModelId.value)
  )

  const currentTask = computed(() => {
    if (!currentTaskId.value) return null
    return [...feedItems.value, ...history.value].find(t => t.id === currentTaskId.value)
  })

  // 合并 Feed 和历史
  const allItems = computed(() => {
    const feedIds = new Set(feedItems.value.map(t => t.id))
    const historyFiltered = history.value.filter(t => !feedIds.has(t.id))
    return [...feedItems.value, ...historyFiltered]
  })

  /**
   * 动态参数 Schema
   */
  const activeParamSchema = computed<Record<string, ParamSchemaItem>>(() => {
    const model = selectedModel.value
    if (!model) return {}

    const schema: Record<string, ParamSchemaItem> = {}

    // 1. 分辨率参数
    schema.resolution = {
      type: 'select',
      label: '分辨率',
      default: model.supportedResolutions?.[0] || '1080p',
      options: (model.supportedResolutions || ['720p', '1080p', '4k']).map(r => ({
        value: r,
        label: r
      }))
    }

    // 2. 时长参数
    schema.durationSec = {
      type: 'slider',
      label: '时长 (秒)',
      default: 5,
      min: 3,
      max: model.maxDurationSec || 15,
      step: 1
    }

    // 3. 模型定义的动态参数
    if (model.paramSchema) {
      for (const [key, item] of Object.entries(model.paramSchema)) {
        schema[key] = {
          ...item,
          label: item.label || key,
          default: allParams.value[key] ?? (item as ParamSchemaItem & { defaultValue?: unknown }).defaultValue ?? item.default
        }
      }
    }

    return schema
  })

  /**
   * Feed 模式快捷参数
   */
  const quickParams = computed(() => {
    const schema = activeParamSchema.value
    const params: Array<{ key: string; label: string; options: Array<{ value: unknown; label: string }> }> = []

    if (schema.resolution?.options) {
      params.push({
        key: 'resolution',
        label: '分辨率',
        options: schema.resolution.options
      })
    }

    // 时长快捷选项
    const model = selectedModel.value
    if (model) {
      const durations = [3, 5, 10].filter(d => d <= (model.maxDurationSec || 15))
      params.push({
        key: 'durationSec',
        label: '时长',
        options: durations.map(d => ({ value: d, label: `${d}s` }))
      })
    }

    // 动态参数快捷按钮
    for (const [key, item] of Object.entries(schema)) {
      if (key !== 'resolution' && key !== 'durationSec' && item.type === 'select' && item.options) {
        if (params.length < 4) {
          params.push({ key, label: item.label, options: item.options })
        }
      }
    }

    return params
  })

  // =====================================================
  // 模型选择
  // =====================================================
  const selectModel = (model: VideoModelConfig) => {
    selectedModelId.value = model.id
    initializeParamsForModel(model)
  }

  const initializeParamsForModel = (model: VideoModelConfig) => {
    const newParams: Record<string, unknown> = {}

    // 1. 动态参数默认值
    if (model.paramSchema) {
      for (const [key, schema] of Object.entries(model.paramSchema)) {
        const defaultValue = (schema as ParamSchemaItem & { defaultValue?: unknown }).defaultValue ?? schema.default
        if (defaultValue !== undefined) newParams[key] = defaultValue
      }
    }

    // 2. 基础参数默认值
    if (model.defaultParams) {
      Object.assign(newParams, model.defaultParams)
    }
    newParams.resolution = newParams.resolution || model.supportedResolutions?.[0] || '1080p'
    newParams.durationSec = newParams.durationSec || 5

    allParams.value = newParams
  }

  // =====================================================
  // 参数更新
  // =====================================================
  const updateParam = (key: string, value: unknown) => {
    allParams.value = { ...allParams.value, [key]: value }
  }

  // =====================================================
  // 数据加载（Mock）
  // =====================================================
  const loadModels = async () => {
    loadingModels.value = true
    // 模拟网络延迟
    await new Promise(r => setTimeout(r, 500))
    models.value = MOCK_MODELS
    if (MOCK_MODELS.length > 0) {
      selectModel(MOCK_MODELS[0])
    }
    loadingModels.value = false
  }

  const loadHistory = async () => {
    loadingHistory.value = true
    await new Promise(r => setTimeout(r, 300))
    history.value = [...MOCK_HISTORY]
    loadingHistory.value = false
  }

  // =====================================================
  // 视频生成（Mock 带进度模拟）
  // =====================================================
  const generateVideo = async () => {
    if (!prompt.value.trim() || !selectedModelId.value || generating.value) return

    generating.value = true
    const currentPrompt = prompt.value
    prompt.value = ''

    const tempId = `temp-${Date.now()}`
    const tempTask: VideoGeneration = {
      id: tempId,
      modelId: selectedModelId.value,
      prompt: currentPrompt,
      resolution: String(allParams.value.resolution) || '1080p',
      durationSec: Number(allParams.value.durationSec) || 5,
      creditsCharged: 0,
      status: 'processing',
      progress: 0,
      createdTime: new Date().toISOString()
    }

    feedItems.value = [tempTask, ...feedItems.value]
    currentTaskId.value = tempId

    // 模拟进度更新
    let progress = 0
    pollTimer = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null

        // 完成
        const completedTask: VideoGeneration = {
          ...tempTask,
          id: `v-${Date.now()}`,
          status: 'completed',
          progress: 100,
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnailUrl: `https://picsum.photos/seed/${Date.now()}/400/225`,
          creditsCharged: selectedModel.value?.creditPrice || 50,
          completedTime: new Date().toISOString()
        }

        feedItems.value = feedItems.value.map(item =>
          item.id === tempId ? completedTask : item
        )
        currentTaskId.value = completedTask.id
        history.value = [completedTask, ...history.value.filter(h => h.id !== completedTask.id)]
        generating.value = false
      } else {
        feedItems.value = feedItems.value.map(item =>
          item.id === tempId ? { ...item, progress: Math.floor(progress) } : item
        )
      }
    }, 500)
  }

  // =====================================================
  // 查看历史记录
  // =====================================================
  const viewGeneration = (item: VideoGeneration) => {
    currentTaskId.value = item.id
  }

  // =====================================================
  // 停止轮询
  // =====================================================
  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    isPolling.value = false
  }

  // =====================================================
  // 重试生成
  // =====================================================
  const retryGenerate = (item: VideoGeneration) => {
    prompt.value = item.prompt
    selectedModelId.value = item.modelId

    const paramsToRestore: Record<string, unknown> = {
      resolution: item.resolution,
      durationSec: item.durationSec
    }
    Object.assign(allParams.value, paramsToRestore)
    generateVideo()
  }

  // =====================================================
  // 移除项目
  // =====================================================
  const removeItem = (id: string) => {
    feedItems.value = feedItems.value.filter(t => t.id !== id)
    history.value = history.value.filter(t => t.id !== id)
    if (currentTaskId.value === id) {
      currentTaskId.value = allItems.value[0]?.id ?? null
    }
  }

  // =====================================================
  // 获取随机灵感
  // =====================================================
  const getRandomInspiration = () => {
    const randomIndex = Math.floor(Math.random() * INSPIRATION_PROMPTS.length)
    prompt.value = INSPIRATION_PROMPTS[randomIndex]
  }

  // =====================================================
  // 工具函数
  // =====================================================
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'processing': return 'Rendering'
      case 'pending': return 'Queued'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/30'
      default: return ''
    }
  }

  const formatTime = (time: string) => {
    const date = new Date(time)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`
  }

  const getModelDisplayName = (modelId: string): string => {
    return models.value.find(m => m.id === modelId)?.displayName || modelId
  }

  const getModelProvider = (modelId: string): string => {
    return models.value.find(m => m.id === modelId)?.provider || 'openai'
  }

  return {
    // State
    loadingModels,
    loadingHistory,
    generating,
    models,
    history,
    feedItems,
    selectedModelId,
    selectedModel,
    prompt,
    currentTaskId,
    currentTask,
    allItems,
    allParams,
    activeParamSchema,
    quickParams,
    isPolling,
    // Actions
    loadModels,
    loadHistory,
    generateVideo,
    viewGeneration,
    selectModel,
    updateParam,
    stopPolling,
    retryGenerate,
    removeItem,
    getRandomInspiration,
    // Utils
    getStatusText,
    getStatusClass,
    formatTime,
    formatDuration,
    getModelDisplayName,
    getModelProvider
  }
}
