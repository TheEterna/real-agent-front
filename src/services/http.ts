import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { notification } from 'ant-design-vue'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { showErrorNotification } from '@/utils/errorNotification'
import { setupMockAdapter } from '@/mock'
import i18n from '@/i18n'

const { t } = i18n.global

const instance = axios.create({
  baseURL: '/api',
  timeout: 1500000
})

// Mock 模式：替换 adapter，拦截所有请求返回 mock 数据
setupMockAdapter(instance)

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

const redirectToLogin = async (redirect?: string) => {
  try {
    const router = (await import('@/router')).default
    await router.push({ path: '/', query: redirect ? { redirect } : undefined })
  } catch (e) {
    window.location.href = '/'
  }
}

const handleUnauthorized = async (originalRequest: (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined, data?: any) => {
  // 如果没有originalRequest，无法重试
  if (!originalRequest) {
    return Promise.reject(new Error(t('http.unauthenticated')))
  }

  // 如果是刷新接口本身失败，直接清除token并跳转登录
  if (originalRequest.url?.includes('/auth/refresh')) {
    console.warn('刷新Token失败，清除本地Token并跳转登录页')
    const authStore = useAuthStore()
    authStore.clearAuth()
    await redirectToLogin()
    return Promise.reject(new Error(data?.message || t('http.refreshTokenFailed')))
  }

  // 如果已经重试过，不再重试
  if (originalRequest._retry) {
    const authStore = useAuthStore()
    authStore.clearAuth()
    await redirectToLogin()
    return Promise.reject(new Error(data?.message || t('http.sessionExpired')))
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
    await redirectToLogin()
    return Promise.reject(new Error(t('http.sessionExpired')))
  }

  try {
    // 调用刷新接口
    const response = await authApi.refresh(refreshToken)

    // ResponseResult格式: { code, message, data: { accessToken, refreshToken, expiresIn } }
    if (response.code !== 200) {
      throw new Error(response.message || t('http.refreshTokenFailed'))
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
      message: t('http.authExpiredTitle'),
      description: t('http.authExpiredDesc'),
      duration: 5
    })

    await redirectToLogin()

    return Promise.reject(refreshError)
  } finally {
    isRefreshing = false
  }
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

    // 路径正常化：移除路径末尾可能存在的 '.'，防止 404
    if (config.url) {
      const urlObj = new URL(config.url, window.location.origin)
      if (urlObj.pathname.endsWith('.')) {
        urlObj.pathname = urlObj.pathname.replace(/\.+$/, '')
        config.url = urlObj.pathname + urlObj.search
      }
    }

    return config
  },
  error => Promise.reject(error)
)

// ==================== 响应拦截器 ====================

instance.interceptors.response.use(
  async response => {
    const data: any = response.data
    if (data?.code === 401) {
      const originalRequest = response.config as InternalAxiosRequestConfig & { _retry?: boolean }
      return handleUnauthorized(originalRequest, data)
    }
    return data
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 如果不是401错误，显示错误提示并 reject
    if (error.response?.status !== 401) {
      // 获取错误信息
      let errorMessage = t('http.requestFailed')
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
          400: t('http.error400'),
          403: t('http.error403'),
          404: t('http.error404'),
          408: t('http.error408'),
          429: t('http.error429'),
          500: t('http.error500'),
          502: t('http.error502'),
          503: t('http.error503'),
          504: t('http.error504')
        }
        errorMessage = errorMap[statusCode] || t('http.errorWithCode', { code: statusCode })
      }

      // 显示错误通知（自动去重）
      showErrorNotification(t('http.apiError'), errorMessage, 5)

      return Promise.reject(error)
    }

    return handleUnauthorized(originalRequest, error.response?.data)
  }
)

/**
 * 类型安全的 HTTP 客户端
 *
 * 响应拦截器已将 AxiosResponse 解包为 response.data，
 * 因此实际返回的是后端 ResponseResult 或原始数据（text/blob），
 * 而非 AxiosResponse 包装对象。
 */
interface HttpClient {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  request<T = any>(config: AxiosRequestConfig): Promise<T>
  defaults: typeof instance.defaults
  interceptors: typeof instance.interceptors
}

export default instance as unknown as HttpClient
