import http from '@/services/http'

/**
 * 会话 DTO（与后端 SessionDTO 对应）
 */
export interface SessionVO {
    id: string
    title: string
    type: string
    createdTime: string
    updatedTime: string
    isPin?: boolean
}

/**
 * 响应结果类型
 */
export interface ResponseResult<T> {
    code: number
    message: string
    data: T
}

/**
 * 获取当前用户的所有会话
 * 注意：axios 响应拦截器已经返回了 response.data，所以这里直接返回 ResponseResult 类型
 */
export function getSessions(): Promise<ResponseResult<SessionVO[]>> {
    return http.get('/sessions')
}

/**
 * 删除会话
 */
export function deleteSession(sessionId: string): Promise<ResponseResult<any>> {
    return http.delete(`/sessions/${sessionId}`)
}

/**
 * 重命名会话
 */
export function renameSession(sessionId: string, title: string): Promise<ResponseResult<SessionVO>> {
    return http.put(`/sessions/${sessionId}/rename`, { title })
}

/**
 * 置顶会话
 */
export function pinSession(sessionId: string): Promise<ResponseResult<SessionVO>> {
    return http.put(`/sessions/${sessionId}/pin`, {})
}

/**
 * 取消置顶会话
 */
export function unpinSession(sessionId: string): Promise<ResponseResult<SessionVO>> {
    return http.put(`/sessions/${sessionId}/unpin`, {})
}
