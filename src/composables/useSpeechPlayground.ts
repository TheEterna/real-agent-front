/**
 * Speech Playground Composable
 *
 * 封装语音服务页面的核心逻辑：
 * - TTS（文本转语音）和 ASR（语音转文本）双模式
 * - 模型过滤（ttsModels/asrModels）
 * - 参数管理
 * - 文件上传处理
 *
 * @author Han
 * @since 2026-02-03
 */

import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { speechApi } from '@/api/playground-basic'
import type { SpeechModelConfig, SpeechGeneration, ParamSchemaItem } from '@/types/playground-basic'

export function useSpeechPlayground() {
  const { t } = useI18n()

  // =====================================================
  // State
  // =====================================================
  const loadingModels = ref(false)
  const loadingHistory = ref(false)
  const generatingTts = ref(false)
  const generatingAsr = ref(false)
  const models = ref<SpeechModelConfig[]>([])
  const history = ref<SpeechGeneration[]>([])
  const activeTab = ref<'tts' | 'asr'>('tts')

  // =====================================================
  // TTS State
  // =====================================================
  const selectedTtsModelId = ref<string>()
  const ttsText = ref('')
  const ttsParams = ref<Record<string, unknown>>({
    voice: 'alloy',
    format: 'mp3',
    speed: 1.0
  })
  const ttsResult = ref<SpeechGeneration | null>(null)

  // =====================================================
  // ASR State
  // =====================================================
  const selectedAsrModelId = ref<string>()
  const audioFile = ref<File | null>(null)
  const asrParams = ref<Record<string, unknown>>({
    language: 'zh'
  })
  const asrResult = ref<SpeechGeneration | null>(null)

  // =====================================================
  // Computed - 模型过滤
  // =====================================================
  const ttsModels = computed(() =>
    models.value.filter(m => m.modelType === 'tts')
  )

  const asrModels = computed(() =>
    models.value.filter(m => m.modelType === 'asr')
  )

  const selectedTtsModel = computed(() =>
    models.value.find(m => m.id === selectedTtsModelId.value)
  )

  const selectedAsrModel = computed(() =>
    models.value.find(m => m.id === selectedAsrModelId.value)
  )

  // =====================================================
  // TTS 参数 Schema
  // =====================================================
  const activeTtsParamSchema = computed<Record<string, ParamSchemaItem>>(() => {
    const model = selectedTtsModel.value
    if (!model) return {}

    const schema: Record<string, ParamSchemaItem> = {}

    // 1. 音色参数
    if (model.supportedVoices?.length) {
      schema.voice = {
        type: 'select',
        label: 'Voice',
        default: model.supportedVoices[0],
        options: model.supportedVoices.map(v => ({ value: v, label: v }))
      }
    }

    // 2. 格式参数
    if (model.supportedFormats?.length) {
      schema.format = {
        type: 'select',
        label: 'Format',
        default: 'mp3',
        options: model.supportedFormats.map(f => ({ value: f, label: f.toUpperCase() }))
      }
    }

    // 3. 语速参数
    schema.speed = {
      type: 'slider',
      label: 'Speed',
      default: 1.0,
      min: 0.5,
      max: 2.0,
      step: 0.1
    }

    // 4. 模型定义的动态参数
    if (model.paramSchema) {
      for (const [key, item] of Object.entries(model.paramSchema)) {
        schema[key] = {
          ...item,
          label: item.label || key,
          default: ttsParams.value[key] ?? (item as ParamSchemaItem & { defaultValue?: unknown }).defaultValue ?? item.default
        }
      }
    }

    return schema
  })

  // =====================================================
  // ASR 参数 Schema
  // =====================================================
  const activeAsrParamSchema = computed<Record<string, ParamSchemaItem>>(() => {
    const model = selectedAsrModel.value
    if (!model) return {}

    const schema: Record<string, ParamSchemaItem> = {
      language: {
        type: 'select',
        label: 'Language',
        default: 'zh',
        options: [
          { value: 'zh', label: 'Chinese' },
          { value: 'en', label: 'English' },
          { value: 'ja', label: 'Japanese' },
          { value: 'ko', label: 'Korean' },
          { value: 'auto', label: 'Auto Detect' }
        ]
      }
    }

    // 模型定义的动态参数
    if (model.paramSchema) {
      for (const [key, item] of Object.entries(model.paramSchema)) {
        schema[key] = {
          ...item,
          label: item.label || key,
          default: asrParams.value[key] ?? (item as ParamSchemaItem & { defaultValue?: unknown }).defaultValue ?? item.default
        }
      }
    }

    return schema
  })

  // =====================================================
  // 模型选择
  // =====================================================
  const selectTtsModel = (model: SpeechModelConfig) => {
    selectedTtsModelId.value = model.id
    initializeTtsParams(model)
  }

  const selectAsrModel = (model: SpeechModelConfig) => {
    selectedAsrModelId.value = model.id
    initializeAsrParams(model)
  }

  const initializeTtsParams = (model: SpeechModelConfig) => {
    const newParams: Record<string, unknown> = {}

    // 动态参数默认值
    if (model.paramSchema) {
      for (const [key, schema] of Object.entries(model.paramSchema)) {
        const defaultValue = (schema as ParamSchemaItem & { defaultValue?: unknown }).defaultValue ?? schema.default
        if (defaultValue !== undefined) newParams[key] = defaultValue
      }
    }

    // 基础参数默认值
    newParams.voice = model.supportedVoices?.[0] || 'alloy'
    newParams.format = 'mp3'
    newParams.speed = 1.0

    ttsParams.value = newParams
  }

  const initializeAsrParams = (model: SpeechModelConfig) => {
    const newParams: Record<string, unknown> = {}

    // 动态参数默认值
    if (model.paramSchema) {
      for (const [key, schema] of Object.entries(model.paramSchema)) {
        const defaultValue = (schema as ParamSchemaItem & { defaultValue?: unknown }).defaultValue ?? schema.default
        if (defaultValue !== undefined) newParams[key] = defaultValue
      }
    }

    // 基础参数默认值
    newParams.language = 'zh'

    asrParams.value = newParams
  }

  // =====================================================
  // 参数更新
  // =====================================================
  const updateTtsParam = (key: string, value: unknown) => {
    ttsParams.value[key] = value
  }

  const updateAsrParam = (key: string, value: unknown) => {
    asrParams.value[key] = value
  }

  // =====================================================
  // 数据加载
  // =====================================================
  const loadModels = async () => {
    loadingModels.value = true
    try {
      const res = await speechApi.getModels()
      if (res.code === 200) {
        models.value = res.data
        // 自动选择第一个 TTS 和 ASR 模型
        const tts = res.data.find(m => m.modelType === 'tts')
        const asr = res.data.find(m => m.modelType === 'asr')
        if (tts) selectTtsModel(tts)
        if (asr) selectAsrModel(asr)
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
      const res = await speechApi.getHistory()
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
  // TTS 生成
  // =====================================================
  const generateTts = async () => {
    if (!ttsText.value.trim() || !selectedTtsModelId.value || generatingTts.value) return

    generatingTts.value = true
    ttsResult.value = null

    try {
      const res = await speechApi.textToSpeech({
        modelId: selectedTtsModelId.value,
        text: ttsText.value,
        voice: String(ttsParams.value.voice),
        format: String(ttsParams.value.format),
        speed: Number(ttsParams.value.speed)
      })

      if (res.code === 200) {
        ttsResult.value = res.data
        loadHistory()
      } else {
        ttsResult.value = {
          id: '',
          modelId: selectedTtsModelId.value,
          modelType: 'tts',
          inputText: ttsText.value,
          creditsCharged: 0,
          status: 'failed',
          errorMessage: res.message,
          createdTime: new Date().toISOString()
        }
      }
    } catch {
      message.error('Generation failed')
    } finally {
      generatingTts.value = false
    }
  }

  // =====================================================
  // ASR 识别
  // =====================================================
  const recognizeSpeech = async () => {
    if (!audioFile.value || !selectedAsrModelId.value || generatingAsr.value) return

    generatingAsr.value = true
    asrResult.value = null

    try {
      const audioUrl = URL.createObjectURL(audioFile.value)

      const res = await speechApi.speechToText({
        modelId: selectedAsrModelId.value,
        audioUrl: audioUrl,
        language: String(asrParams.value.language)
      })

      if (res.code === 200) {
        asrResult.value = res.data
        loadHistory()
      } else {
        // FIX: 使用 selectedAsrModelId.value 而不是 selectedAsrModel.value
        asrResult.value = {
          id: '',
          modelId: selectedAsrModelId.value,
          modelType: 'asr',
          creditsCharged: 0,
          status: 'failed',
          errorMessage: res.message,
          createdTime: new Date().toISOString()
        }
      }
    } catch {
      message.error('Transcription failed')
    } finally {
      generatingAsr.value = false
    }
  }

  // =====================================================
  // 工具函数
  // =====================================================
  const downloadAudio = (url: string) => {
    const link = document.createElement('a')
    link.href = url
    // FIX: 使用 ttsParams.value.format 而不是 format.value
    link.download = `audio-${Date.now()}.${ttsParams.value.format || 'mp3'}`
    link.click()
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success(t('composable.speechPlayground.copiedToClipboard'))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatTime = (time: string) => {
    const date = new Date(time)
    return t('composable.speechPlayground.formatMonth', { month: date.getMonth() + 1, day: date.getDate() })
  }

  const clearAudioFile = () => {
    audioFile.value = null
  }

  return {
    // State
    loadingModels,
    loadingHistory,
    generatingTts,
    generatingAsr,
    models,
    history,
    activeTab,
    // TTS
    selectedTtsModelId,
    selectedTtsModel,
    ttsModels,
    ttsText,
    ttsParams,
    ttsResult,
    activeTtsParamSchema,
    // ASR
    selectedAsrModelId,
    selectedAsrModel,
    asrModels,
    audioFile,
    asrParams,
    asrResult,
    activeAsrParamSchema,
    // Actions
    loadModels,
    loadHistory,
    selectTtsModel,
    selectAsrModel,
    generateTts,
    recognizeSpeech,
    updateTtsParam,
    updateAsrParam,
    clearAudioFile,
    // Utils
    downloadAudio,
    copyText,
    formatFileSize,
    formatTime
  }
}
