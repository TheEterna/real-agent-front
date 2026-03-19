/**
 * Playground Basic API 封装
 *
 * @author Han
 * @since 2026-01-27
 */

import http from '@/services/http'
import type {
  ResponseResult,
  ChatModelConfig,
  BasicChatSession,
  BasicChatMessage,
  ImageModelConfig,
  ImageGeneration,
  ImageGenerateRequest,
  ImageMessageVO,
  VideoModelConfig,
  VideoGeneration,
  VideoGenerateRequest,
  SpeechModelConfig,
  SpeechGeneration,
  TtsRequest,
  AsrRequest
} from '@/types/playground-basic'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = '/playground/basic'

// ==================== 文本对话 API ====================

export const chatApi = {
  /**
   * 获取文本模型列表
   */
  getModels: async (): Promise<ResponseResult<ChatModelConfig[]>> => {
    return http.get(`${BASE_URL}/chat/models`)
  },

  /**
   * 获取会话列表
   */
  getSessions: async (page = 0, pageSize = 20): Promise<ResponseResult<BasicChatSession[]>> => {
    return http.get(`${BASE_URL}/chat/sessions`, {
      params: { page, pageSize }
    })
  },

  /**
   * 获取会话详情
   */
  getSession: async (sessionId: string): Promise<ResponseResult<BasicChatSession>> => {
    return http.get(`${BASE_URL}/chat/sessions/${sessionId}`)
  },

  /**
   * 获取会话消息
   */
  getMessages: async (sessionId: string): Promise<ResponseResult<BasicChatMessage[]>> => {
    return http.get(`${BASE_URL}/chat/sessions/${sessionId}/messages`)
  },

  /**
   * 删除会话
   */
  deleteSession: async (sessionId: string): Promise<ResponseResult<void>> => {
    return http.delete(`${BASE_URL}/chat/sessions/${sessionId}`)
  },

  /**
   * 更新会话标题
   */
  updateSessionTitle: async (sessionId: string, title: string): Promise<ResponseResult<void>> => {
    return http.put(`${BASE_URL}/chat/sessions/${sessionId}/title`, { title })
  },

  /**
   * 获取流式对话的请求头（包含认证）
   */
  getStreamHeaders: () => {
    const authStore = useAuthStore()
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.accessToken}`
    }
  },

  /**
   * 流式对话 URL
   */
  getStreamUrl: () => '/api/playground/basic/chat/stream'
}

// ==================== 图像生成 API ====================

export const imageApi = {
  /**
   * 获取图像模型列表
   */
  getModels: async (): Promise<ResponseResult<ImageModelConfig[]>> => {
    return http.get(`${BASE_URL}/image/models`)
  },

  /**
   * 生成图像（非流式）
   */
  generate: async (request: ImageGenerateRequest): Promise<ResponseResult<ImageMessageVO>> => {
    return http.post(`${BASE_URL}/image/generate`, request)
  },

  /**
   * 获取生成历史
   */
  getHistory: async (page = 0, pageSize = 20): Promise<ResponseResult<ImageMessageVO[]>> => {
    return http.get(`${BASE_URL}/image/history`, {
      params: { page, pageSize }
    })
  },

  /**
   * 删除历史记录
   */
  deleteHistory: async (messageId: string): Promise<ResponseResult<boolean>> => {
    return http.delete(`${BASE_URL}/image/history/${messageId}`)
  }
}

// ==================== 视频生成 API ====================

export const videoApi = {
  /**
   * 获取视频模型列表
   */
  getModels: async (): Promise<ResponseResult<VideoModelConfig[]>> => {
    return http.get(`${BASE_URL}/video/models`)
  },

  /**
   * 生成视频
   */
  generate: async (request: VideoGenerateRequest): Promise<ResponseResult<VideoGeneration>> => {
    return http.post(`${BASE_URL}/video/generate`, request)
  },

  /**
   * 获取生成历史
   */
  getHistory: async (page = 0, pageSize = 20): Promise<ResponseResult<VideoGeneration[]>> => {
    return http.get(`${BASE_URL}/video/history`, {
      params: { page, pageSize }
    })
  },

  /**
   * 获取生成状态
   */
  getStatus: async (id: string): Promise<ResponseResult<VideoGeneration>> => {
    return http.get(`${BASE_URL}/video/${id}/status`)
  }
}

// ==================== 语音服务 API ====================

export const speechApi = {
  /**
   * 获取所有语音模型列表
   */
  getModels: async (): Promise<ResponseResult<SpeechModelConfig[]>> => {
    return http.get(`${BASE_URL}/speech/models`)
  },

  /**
   * 获取 TTS 模型列表
   */
  getTtsModels: async (): Promise<ResponseResult<SpeechModelConfig[]>> => {
    return http.get(`${BASE_URL}/speech/models/tts`)
  },

  /**
   * 获取 ASR 模型列表
   */
  getAsrModels: async (): Promise<ResponseResult<SpeechModelConfig[]>> => {
    return http.get(`${BASE_URL}/speech/models/asr`)
  },

  /**
   * 文本转语音
   */
  textToSpeech: async (request: TtsRequest): Promise<ResponseResult<SpeechGeneration>> => {
    return http.post(`${BASE_URL}/speech/tts`, request)
  },

  /**
   * 语音转文本
   */
  speechToText: async (request: AsrRequest): Promise<ResponseResult<SpeechGeneration>> => {
    return http.post(`${BASE_URL}/speech/asr`, request)
  },

  /**
   * 获取生成历史
   */
  getHistory: async (modelType?: string, page = 0, pageSize = 20): Promise<ResponseResult<SpeechGeneration[]>> => {
    return http.get(`${BASE_URL}/speech/history`, {
      params: { modelType, page, pageSize }
    })
  }
}

// ==================== 导出 ====================

export const playgroundBasicApi = {
  chat: chatApi,
  image: imageApi,
  video: videoApi,
  speech: speechApi
}

export default playgroundBasicApi

// ==================== 工具函数 ====================

/**
 * 根据 modelId 从图像模型列表中取显示名
 */
export function getImageModelDisplayName(models: ImageModelConfig[], modelId: string): string {
  const m = models.find(x => x.id === modelId)
  return m?.displayName ?? modelId
}

/**
 * 根据 modelId 从图像模型列表中取 provider（用于 ProviderIcon 等）
 */
export function getImageModelProvider(models: ImageModelConfig[], modelId: string): string {
  const m = models.find(x => x.id === modelId)
  return m?.provider ?? 'ai'
}

