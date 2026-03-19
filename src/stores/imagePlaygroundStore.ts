/**
 * 图像 Playground Store
 *
 * 管理图像生成页面的状态和缓存
 * - 模型列表缓存
 * - 会话列表缓存
 * - 消息缓存
 * - 参数配置缓存
 *
 * @author Han
 * @since 2026-02-03
 */

import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  ImageModelConfig,
  ImageSession,
  ImageMessage
} from '@/types/playground-image'
import { imagePlaygroundApi } from '@/api/playground-image'

// ==================== 缓存 Key ====================

const CACHE_PREFIX = 'volo_ai_image_playground_'
const MODELS_CACHE_KEY = `${CACHE_PREFIX}models`
const SESSIONS_CACHE_KEY = `${CACHE_PREFIX}sessions`
const MESSAGES_CACHE_KEY = `${CACHE_PREFIX}messages`
const SELECTED_MODEL_CACHE_KEY = `${CACHE_PREFIX}selected_model`
const PARAMS_CACHE_KEY = `${CACHE_PREFIX}params`

// ==================== 响应式状态 ====================

/** 模型列表 */
const imageModels = ref<ImageModelConfig[]>([])

/** 会话列表 */
const sessions = ref<ImageSession[]>([])

/** 按会话 ID 存储的消息 */
const messagesBySession = ref<Record<string, ImageMessage[]>>({})

/** 当前选中的模型 ID */
const selectedModelId = ref<string>('')

/** 当前参数配置 */
const allParams = ref<Record<string, any>>({
  size: '1024x1024',
  n: 1,
  quality: 'standard',
  style: 'vivid'
})

/** 加载状态 */
const isLoadingModels = ref(false)
const isLoadingSessions = ref(false)
const isLoadingMessages = ref(false)

/** 缓存水合标记 */
const modelsCacheHydrated = ref(false)
const sessionsCacheHydrated = ref(false)

// ==================== 缓存操作函数 ====================

/**
 * 从 localStorage 加载模型列表
 */
function loadModelsFromCache(): ImageModelConfig[] {
  try {
    const cached = localStorage.getItem(MODELS_CACHE_KEY)
    if (!cached) return []
    const parsed = JSON.parse(cached)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (error) {
    console.error('[imagePlaygroundStore] 加载模型缓存失败:', error)
    return []
  }
}

/**
 * 保存模型列表到 localStorage
 */
function saveModelsToCache(models: ImageModelConfig[]) {
  try {
    localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(models))
  } catch (error) {
    console.error('[imagePlaygroundStore] 保存模型缓存失败:', error)
  }
}

/**
 * 从 localStorage 加载会话列表
 */
function loadSessionsFromCache(): ImageSession[] {
  try {
    const cached = localStorage.getItem(SESSIONS_CACHE_KEY)
    if (!cached) return []
    const parsed = JSON.parse(cached)
    if (!Array.isArray(parsed)) return []
    return parsed.map((s: any) => ({
      ...s,
      createdTime: s.createdTime,
      updatedTime: s.updatedTime
    }))
  } catch (error) {
    console.error('[imagePlaygroundStore] 加载会话缓存失败:', error)
    return []
  }
}

/**
 * 保存会话列表到 localStorage
 */
function saveSessionsToCache(data: ImageSession[]) {
  try {
    localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('[imagePlaygroundStore] 保存会话缓存失败:', error)
  }
}

/**
 * 从 localStorage 加载消息
 */
function loadMessagesFromCache(): Record<string, ImageMessage[]> {
  try {
    const cached = localStorage.getItem(MESSAGES_CACHE_KEY)
    if (!cached) return {}
    const parsed = JSON.parse(cached)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch (error) {
    console.error('[imagePlaygroundStore] 加载消息缓存失败:', error)
    return {}
  }
}

/**
 * 保存消息到 localStorage
 */
function saveMessagesToCache(data: Record<string, ImageMessage[]>) {
  try {
    // 只保存最近 10 个会话的消息，避免缓存过大
    const sessionIds = Object.keys(data).slice(0, 10)
    const trimmed: Record<string, ImageMessage[]> = {}
    sessionIds.forEach(id => {
      trimmed[id] = data[id]
    })
    localStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('[imagePlaygroundStore] 保存消息缓存失败:', error)
  }
}

/**
 * 从 localStorage 加载选中的模型 ID
 */
function loadSelectedModelFromCache(): string {
  try {
    return localStorage.getItem(SELECTED_MODEL_CACHE_KEY) || ''
  } catch (error) {
    console.error('[imagePlaygroundStore] 加载选中模型缓存失败:', error)
    return ''
  }
}

/**
 * 保存选中的模型 ID 到 localStorage
 */
function saveSelectedModelToCache(modelId: string) {
  try {
    localStorage.setItem(SELECTED_MODEL_CACHE_KEY, modelId)
  } catch (error) {
    console.error('[imagePlaygroundStore] 保存选中模型缓存失败:', error)
  }
}

/**
 * 从 localStorage 加载参数配置
 */
function loadParamsFromCache(): Record<string, any> {
  try {
    const cached = localStorage.getItem(PARAMS_CACHE_KEY)
    if (!cached) return {}
    return JSON.parse(cached)
  } catch (error) {
    console.error('[imagePlaygroundStore] 加载参数缓存失败:', error)
    return {}
  }
}

/**
 * 保存参数配置到 localStorage
 */
function saveParamsToCache(params: Record<string, any>) {
  try {
    localStorage.setItem(PARAMS_CACHE_KEY, JSON.stringify(params))
  } catch (error) {
    console.error('[imagePlaygroundStore] 保存参数缓存失败:', error)
  }
}

// ==================== Watch 自动保存 ====================

watch(sessions, (next) => {
  saveSessionsToCache(next)
}, { deep: true })

watch(messagesBySession, (next) => {
  saveMessagesToCache(next)
}, { deep: true })

watch(selectedModelId, (next) => {
  if (next) {
    saveSelectedModelToCache(next)
  }
})

watch(allParams, (next) => {
  saveParamsToCache(next)
}, { deep: true })

// ==================== Store 对象 ====================

const store = {
  // 响应式状态
  imageModels,
  sessions,
  messagesBySession,
  selectedModelId,
  allParams,
  isLoadingModels,
  isLoadingSessions,
  isLoadingMessages,

  // ==================== 模型管理 ====================

  /**
   * 获取模型列表（优先缓存，后台刷新）
   */
  async fetchModels(force = false): Promise<ImageModelConfig[]> {
    // 防并发
    if (isLoadingModels.value) return imageModels.value

    // 1. 先水合缓存
    if (!modelsCacheHydrated.value) {
      const cached = loadModelsFromCache()
      if (cached.length > 0) {
        imageModels.value = cached
        console.log('[imagePlaygroundStore] 从缓存加载模型:', cached.length, '个')
      }
      // 同时加载选中的模型 ID
      const cachedModelId = loadSelectedModelFromCache()
      if (cachedModelId) {
        selectedModelId.value = cachedModelId
      }
      // 加载参数配置
      const cachedParams = loadParamsFromCache()
      if (Object.keys(cachedParams).length > 0) {
        allParams.value = { ...allParams.value, ...cachedParams }
      }
      modelsCacheHydrated.value = true
    }

    // 2. 如果有缓存且不是强制刷新，直接返回
    if (!force && imageModels.value.length > 0) {
      return imageModels.value
    }

    // 3. 从后端获取最新数据
    isLoadingModels.value = true
    try {
      const res = await imagePlaygroundApi.getModels()
      if (res.code === 200 && Array.isArray(res.data)) {
        imageModels.value = res.data
        saveModelsToCache(res.data)
        console.log('[imagePlaygroundStore] 从后端加载模型:', res.data.length, '个')

        // 如果没有选中的模型，选择第一个
        if (!selectedModelId.value && res.data.length > 0) {
          store.selectModel(res.data[0])
        }

        return res.data
      }
      return imageModels.value
    } catch (error) {
      console.error('[imagePlaygroundStore] 获取模型列表失败:', error)
      return imageModels.value
    } finally {
      isLoadingModels.value = false
    }
  },

  /**
   * 选择模型并初始化参数
   */
  selectModel(model: ImageModelConfig) {
    selectedModelId.value = model.id
    store.initializeParamsForModel(model)
  },

  /**
   * 根据模型能力初始化参数
   */
  initializeParamsForModel(model: ImageModelConfig) {
    const newParams: Record<string, any> = {}
    const caps = model.capabilities

    if (!caps) {
      allParams.value = { size: '1024x1024', n: 1, quality: 'standard', style: 'vivid' }
      return
    }

    if (caps.supportedSizes?.length) {
      newParams.size = caps.supportedSizes[0]
    }
    if (caps.supportedAspectRatios?.length) {
      newParams.aspectRatio = caps.supportedAspectRatios[0]
    }
    if (caps.supportedQualities?.length) {
      newParams.quality = caps.supportedQualities[0]
    }
    if (caps.supportedStyles?.length) {
      newParams.style = caps.supportedStyles[0]
    }
    newParams.n = 1

    allParams.value = newParams
  },

  /**
   * 获取当前选中的模型
   */
  getSelectedModel(): ImageModelConfig | undefined {
    return imageModels.value.find(m => m.id === selectedModelId.value)
  },

  // ==================== 会话管理 ====================

  /**
   * 获取会话列表（优先缓存，后台刷新）
   */
  async fetchSessions(force = false): Promise<ImageSession[]> {
    // 防并发
    if (isLoadingSessions.value) return sessions.value

    // 1. 先水合缓存
    if (!sessionsCacheHydrated.value) {
      const cached = loadSessionsFromCache()
      if (cached.length > 0) {
        sessions.value = cached
        console.log('[imagePlaygroundStore] 从缓存加载会话:', cached.length, '个')
      }
      // 同时加载消息缓存
      const cachedMessages = loadMessagesFromCache()
      if (Object.keys(cachedMessages).length > 0) {
        messagesBySession.value = cachedMessages
        console.log('[imagePlaygroundStore] 从缓存加载消息:', Object.keys(cachedMessages).length, '个会话')
      }
      sessionsCacheHydrated.value = true
    }

    // 2. 如果有缓存且不是强制刷新，直接返回
    if (!force && sessions.value.length > 0) {
      return sessions.value
    }

    // 3. 从后端获取最新数据
    isLoadingSessions.value = true
    try {
      const res = await imagePlaygroundApi.getSessions(0, 50)
      if (res.code === 200 && Array.isArray(res.data)) {
        sessions.value = res.data
        saveSessionsToCache(res.data)
        console.log('[imagePlaygroundStore] 从后端加载会话:', res.data.length, '个')
        return res.data
      }
      return sessions.value
    } catch (error) {
      console.error('[imagePlaygroundStore] 获取会话列表失败:', error)
      return sessions.value
    } finally {
      isLoadingSessions.value = false
    }
  },

  /**
   * 获取会话消息（优先缓存）
   */
  async fetchMessages(sessionId: string, force = false): Promise<ImageMessage[]> {
    // 防并发
    if (isLoadingMessages.value) return messagesBySession.value[sessionId] || []

    // 1. 如果有缓存且不是强制刷新，直接返回
    if (!force && messagesBySession.value[sessionId]?.length > 0) {
      console.log('[imagePlaygroundStore] 使用缓存的消息:', sessionId)
      return messagesBySession.value[sessionId]
    }

    // 2. 从后端获取
    isLoadingMessages.value = true
    try {
      const res = await imagePlaygroundApi.getMessages(sessionId)
      if (res.code === 200 && Array.isArray(res.data)) {
        messagesBySession.value[sessionId] = res.data
        console.log('[imagePlaygroundStore] 从后端加载消息:', sessionId, res.data.length, '条')
        return res.data
      }
      return messagesBySession.value[sessionId] || []
    } catch (error) {
      console.error('[imagePlaygroundStore] 获取消息失败:', error)
      return messagesBySession.value[sessionId] || []
    } finally {
      isLoadingMessages.value = false
    }
  },

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const res = await imagePlaygroundApi.deleteSession(sessionId)
      if (res.code === 200) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId)
        delete messagesBySession.value[sessionId]
        return true
      }
      return false
    } catch (error) {
      console.error('[imagePlaygroundStore] 删除会话失败:', error)
      return false
    }
  },

  /**
   * 添加新会话到列表头部
   */
  addSession(session: ImageSession) {
    // 检查是否已存在
    const exists = sessions.value.some(s => s.id === session.id)
    if (!exists) {
      sessions.value.unshift(session)
    }
  },

  /**
   * 更新会话
   */
  updateSession(sessionId: string, updates: Partial<ImageSession>) {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index >= 0) {
      sessions.value[index] = { ...sessions.value[index], ...updates }
    }
  },

  /**
   * 设置会话消息
   */
  setSessionMessages(sessionId: string, messages: ImageMessage[]) {
    messagesBySession.value[sessionId] = messages
  },

  /**
   * 追加消息到会话
   */
  appendMessage(sessionId: string, message: ImageMessage) {
    if (!messagesBySession.value[sessionId]) {
      messagesBySession.value[sessionId] = []
    }
    messagesBySession.value[sessionId].push(message)
  },

  // ==================== 参数管理 ====================

  /**
   * 更新参数
   */
  updateParam(key: string, value: any) {
    allParams.value[key] = value
  },

  /**
   * 重置参数为默认值
   */
  resetParams() {
    const model = store.getSelectedModel()
    if (model) {
      store.initializeParamsForModel(model)
    } else {
      allParams.value = { size: '1024x1024', n: 1, quality: 'standard', style: 'vivid' }
    }
  },

  // ==================== 清理 ====================

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    localStorage.removeItem(MODELS_CACHE_KEY)
    localStorage.removeItem(SESSIONS_CACHE_KEY)
    localStorage.removeItem(MESSAGES_CACHE_KEY)
    localStorage.removeItem(SELECTED_MODEL_CACHE_KEY)
    localStorage.removeItem(PARAMS_CACHE_KEY)

    imageModels.value = []
    sessions.value = []
    messagesBySession.value = {}
    selectedModelId.value = ''
    allParams.value = { size: '1024x1024', n: 1, quality: 'standard', style: 'vivid' }

    modelsCacheHydrated.value = false
    sessionsCacheHydrated.value = false

    console.log('[imagePlaygroundStore] 已清除所有缓存')
  }
}

// ==================== 导出 ====================

export const useImagePlaygroundStore = defineStore('imagePlayground', () => store)

export default store
