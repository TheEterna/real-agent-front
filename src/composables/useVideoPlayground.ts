/**
 * Video Playground Composable
 *
 * 封装视频生成页面的核心逻辑：
 * - 模型加载与选择
 * - 参数管理（allParams + activeParamSchema）
 * - 视频生成与轮询
 * - 历史记录管理
 *
 * @author Han
 * @since 2026-02-03
 */

import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { videoApi } from '@/api/playground-basic'
import type { VideoModelConfig, VideoGeneration, ParamSchemaItem } from '@/types/playground-basic'
import { usePolling } from './usePolling'

export function useVideoPlayground() {
  const { t } = useI18n()

  // =====================================================
  // State
  // =====================================================
  const loadingModels = ref(false)
  const loadingHistory = ref(false)
  const generating = ref(false)
  const models = ref<VideoModelConfig[]>([])
  const history = ref<VideoGeneration[]>([])
  const selectedModelId = ref<string>()
  const prompt = ref('')
  const currentGeneration = ref<VideoGeneration | null>(null)

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

  /**
   * 动态参数 Schema（基于模型能力构建）
   */
  const activeParamSchema = computed<Record<string, ParamSchemaItem>>(() => {
    const model = selectedModel.value
    if (!model) return {}

    const schema: Record<string, ParamSchemaItem> = {}

    // 1. 分辨率参数
    schema.resolution = {
      type: 'select',
      label: 'Resolution',
      default: model.supportedResolutions?.[0] || '1080p',
      options: (model.supportedResolutions || ['720p', '1080p', '4k']).map(r => ({
        value: r,
        label: r
      }))
    }

    // 2. 时长参数
    schema.durationSec = {
      type: 'slider',
      label: 'Duration (seconds)',
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

  // =====================================================
  // 轮询
  // =====================================================
  const { start: startPolling, stop: stopPolling, isPolling } = usePolling(
    async () => {
      if (!currentGeneration.value?.id) return null
      try {
        const res = await videoApi.getStatus(currentGeneration.value.id)
        if (res.code === 200) {
          currentGeneration.value = res.data
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            stopPolling()
            loadHistory()
          }
        }
        return res.data
      } catch {
        return null
      }
    },
    { interval: 3000 }
  )

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
    newParams.resolution = model.supportedResolutions?.[0] || '1080p'
    newParams.durationSec = 5

    allParams.value = newParams
  }

  // =====================================================
  // 参数更新
  // =====================================================
  const updateParam = (key: string, value: unknown) => {
    allParams.value[key] = value
  }

  const buildExtraParams = () => {
    const extra: Record<string, unknown> = {}
    const baseKeys = new Set(['resolution', 'durationSec'])
    for (const [key, value] of Object.entries(allParams.value)) {
      if (!baseKeys.has(key) && value !== undefined && value !== '') {
        extra[key] = value
      }
    }
    return Object.keys(extra).length > 0 ? extra : undefined
  }

  // =====================================================
  // 数据加载
  // =====================================================
  const loadModels = async () => {
    loadingModels.value = true
    try {
      const res = await videoApi.getModels()
      if (res.code === 200) {
        models.value = res.data
        if (res.data.length > 0) {
          selectModel(res.data[0])
        }
      }
    } catch {
      message.error('Failed to load models')
    } finally {
      loadingModels.value = false
    }
  }

  const loadHistory = async () => {
    loadingHistory.value = true
    try {
      const res = await videoApi.getHistory()
      if (res.code === 200) {
        history.value = res.data
      }
    } catch {
      // 静默失败
    } finally {
      loadingHistory.value = false
    }
  }

  // =====================================================
  // 视频生成
  // =====================================================
  const generateVideo = async () => {
    if (!prompt.value.trim() || !selectedModelId.value || generating.value) return

    generating.value = true
    currentGeneration.value = {
      id: '',
      modelId: selectedModelId.value,
      prompt: prompt.value,
      resolution: String(allParams.value.resolution) || '1080p',
      durationSec: Number(allParams.value.durationSec) || 5,
      creditsCharged: 0,
      status: 'pending',
      progress: 0,
      createdTime: new Date().toISOString()
    }

    try {
      const res = await videoApi.generate({
        modelId: selectedModelId.value,
        prompt: prompt.value,
        resolution: String(allParams.value.resolution),
        durationSec: Number(allParams.value.durationSec),
        extraParams: buildExtraParams()
      })

      if (res.code === 200) {
        currentGeneration.value = res.data
        startPolling()
        loadHistory()
      } else {
        currentGeneration.value.status = 'failed'
        currentGeneration.value.errorMessage = res.message
      }
    } catch {
      if (currentGeneration.value) {
        currentGeneration.value.status = 'failed'
        currentGeneration.value.errorMessage = 'Generation request failed'
      }
      message.error('Generation failed')
    } finally {
      generating.value = false
    }
  }

  // =====================================================
  // 查看历史记录
  // =====================================================
  const viewGeneration = (item: VideoGeneration) => {
    currentGeneration.value = item
    if (item.status === 'processing' || item.status === 'pending') {
      startPolling()
    }
  }

  // =====================================================
  // 工具函数
  // =====================================================
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'processing': return 'Processing'
      case 'pending': return 'Queued'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'processing': return 'text-cyan-400 border-cyan-800 bg-cyan-900/20'
      case 'pending': return 'text-yellow-400 border-yellow-800 bg-yellow-900/20'
      case 'failed': return 'text-red-400 border-red-800 bg-red-900/20'
      case 'completed': return 'text-green-400 border-green-800 bg-green-900/20'
      default: return ''
    }
  }

  const formatTime = (time: string) => {
    const date = new Date(time)
    return t('composable.videoPlayground.formatMonth', { month: date.getMonth() + 1, day: date.getDate() })
  }

  return {
    // State
    loadingModels,
    loadingHistory,
    generating,
    models,
    history,
    selectedModelId,
    selectedModel,
    prompt,
    currentGeneration,
    allParams,
    activeParamSchema,
    isPolling,
    // Actions
    loadModels,
    loadHistory,
    generateVideo,
    viewGeneration,
    selectModel,
    updateParam,
    stopPolling,
    // Utils
    getStatusText,
    getStatusClass,
    formatTime
  }
}
