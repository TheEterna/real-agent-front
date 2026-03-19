import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { notification } from 'ant-design-vue'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

const instance = axios.create({
  baseURL: '/api',
  timeout: 1500000
})

// ==================== Token刷新相关变量 ====================

// 正在刷新Token的标志
let isRefreshing = false

// 刷新Token期间待重试的请求队列
interface QueuedRequest {
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}
let failedQueue: QueuedRequest[] = []

/**
 * 处理队列中的请求
 */
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

// ==================== 请求拦截器 ====================

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 如果是认证相关接口，不添加token (避免循环依赖)
    if (config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh')) {
      return config
    }

    // 自动添加 Access Token
    const authStore = useAuthStore()
    const accessToken = authStore.accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  error => Promise.reject(error)
)

// ==================== 响应拦截器 ====================

instance.interceptors.response.use(
  response => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 如果不是401错误，显示错误提示并 reject
    if (error.response?.status !== 401) {
      // 获取错误信息
      let errorMessage = '请求失败'
      const statusCode = error.response?.status
      const data = error.response?.data as any

      // 优先使用后端返回的 message
      if (data?.message) {
        errorMessage = data.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (statusCode) {
        // 根据 HTTP 状态码生成错误信息
        const errorMap: Record<number, string> = {
          400: '请求参数错误',
          403: '无权限访问',
          404: '请求资源不存在',
          408: '请求超时',
          429: 'API 请求过于频繁，请稍后再试',
          500: '服务器错误',
          502: '网关错误',
          503: '服务暂时不可用',
          504: '网关超时'
        }
        errorMessage = errorMap[statusCode] || `请求失败 (${statusCode})`
      }

      // 显示错误通知
      notification.error({
        message: '接口错误',
        description: errorMessage,
        duration: 5
      })

      return Promise.reject(error)
    }

    // 如果没有originalRequest，无法重试
    if (!originalRequest) {
      return Promise.reject(error)
    }

    // 如果是刷新接口本身失败，直接清除token并跳转登录
    if (originalRequest.url?.includes('/auth/refresh')) {
      console.warn('刷新Token失败，清除本地Token并跳转登录页')
      const authStore = useAuthStore()
      authStore.clearAuth()
      return Promise.reject(error)
    }

    // 如果已经重试过，不再重试
    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    // 标记此请求已重试
    originalRequest._retry = true

    // 如果正在刷新Token，将请求加入队列
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return instance(originalRequest)
        })
        .catch(err => Promise.reject(err))
    }

    // 开始刷新Token流程
    isRefreshing = true

    const authStore = useAuthStore()
    const refreshToken = authStore.refreshToken
    if (!refreshToken) {
      console.warn('没有Refresh Token，清除本地Token')
      authStore.clearAuth()
      isRefreshing = false
      return Promise.reject(error)
    }

    try {
      // 调用刷新接口
      const response = await authApi.refresh(refreshToken)

      // ResponseResult格式: { code, message, data: { accessToken, refreshToken, expiresIn } }
      if (response.code !== 200) {
        throw new Error(response.message || '刷新Token失败')
      }

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data

      // 更新本地Token
      authStore.setTokens(accessToken, newRefreshToken, expiresIn)

      // 处理队列中的请求
      processQueue(null, accessToken)

      // 更新原始请求的Authorization header
      originalRequest.headers.Authorization = `Bearer ${accessToken}`

      // 重试原始请求
      return instance(originalRequest)
    } catch (refreshError) {
      // 刷新失败，清除Token并跳转登录
      console.error('刷新Token失败:', refreshError)
      processQueue(refreshError, null)
      authStore.clearAuth()
      
      // 显示 Token 刷新失败提示
      notification.error({
        message: '身份验证过期',
        description: '登录状态已过期，请重新登录',
        duration: 5
      })
      
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default instance
