import http from '@/services/http'
import type { LlmConfig } from '@/types/llm'

/**
 * 响应结果类型
 */
interface ResponseResult<T> {
    code: number
    message: string
    data: T
}

/**
 * 获取当前用户可用的模型列表
 */
export function getAvailableModels(): Promise<ResponseResult<LlmConfig[]>> {
    return http.get('/llm/models')
}

/**
 * 获取所有模型列表（带可用性标记）
 */
export function getAllModels(): Promise<ResponseResult<LlmConfig[]>> {
    return http.get('/llm/models/all')
}

/**
 * 获取默认模型
 */
export function getDefaultModel(): Promise<ResponseResult<LlmConfig>> {
    return http.get('/llm/models/default')
}

/**
 * 根据模型 ID 获取配置
 */
export function getModelById(modelId: string): Promise<ResponseResult<LlmConfig>> {
    return http.get(`/llm/models/${modelId}`)
}

/**
 * 检查用户是否可以使用指定模型
 */
export function checkModelAccess(modelId: string): Promise<ResponseResult<boolean>> {
    return http.get(`/llm/models/${modelId}/check-access`)
}

/**
 * 刷新模型缓存（管理员权限）
 */
export function refreshModelCache(): Promise<ResponseResult<string>> {
    return http.post('/llm/models/refresh-cache')
}
