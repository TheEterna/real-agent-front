import axios from 'axios'
import { NumberFormatResult } from 'vue-i18n'
import { setupMockAdapter } from '@/mock'
import type { ResponseResult } from '@/types/http'

/**
 * 认证API接口封装
 * 注意：使用独立的axios实例，避免与拦截器循环依赖
 */

const authHttp = axios.create({
  baseURL: '/api',
  timeout: 150000
})

// Mock 模式：替换 adapter，拦截所有请求返回 mock 数据
setupMockAdapter(authHttp)

// ==================== 类型定义 ====================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  code: string
  nickname?: string
  avatarUrl?: string
}

export interface RefreshRequest {
  refreshToken: string
}
import type { TierType, BillingCycle, UserSubscription } from '@/types/subscription'

export interface User {
  userId: string
  username: string
  nickname?: string
  avatarUrl?: string
  email?: string
  phone?: string
  /** @deprecated 使用 subscription.planId 代替 */
  tier?: TierType
  /** @deprecated 使用 subscription.billingCycle 代替 */
  billing?: BillingCycle
  credits?: number
  totalCreditsUsed?: number
  /** Onboarding 是否已完成 */
  onboardingCompleted?: boolean
  /** 订阅信息 */
  subscription?: UserSubscription
}

/**
 * 用户资料（从 /api/user/profile 获取）
 */
export interface UserProfile {
  userId: string
  username: string
  nickname?: string
  email?: string
  phone?: string
  avatarUrl?: string
  credits: number
  totalCreditsUsed: number
  tier?: string
  subscription?: UserSubscription
  status: number
  createdTime: string
}

/**
 * 用户统计数据
 */
export interface UserStats {
  conversationCount: number
  memberDays: number
}

/**
 * 用户画像 VO（后端 /user/portrait 返回）
 * 用于克隆分身场景，包含性格特征、兴趣标签及数据充分度
 */
export interface UserPortraitVO {
  nickname: string
  avatarUrl: string | null
  traits: string[]
  interests: string[]
  sufficient: boolean
}


/**
 * 登录响应数据
 */
export interface LoginData {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

/**
 * 登录响应
 */
export type LoginResponse = ResponseResult<LoginData>

/**
 * 刷新Token响应数据
 */
export interface RefreshData {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * 刷新Token响应
 */
export type RefreshResponse = ResponseResult<RefreshData>

/**
 * 注册响应数据
 */
export interface RegisterData {
  userId: string
  username: string
}

/**
 * 注册响应
 */
export type RegisterResponse = ResponseResult<RegisterData>

/**
 * 登出响应
 */
export type LogoutResponse = ResponseResult<void>

/**
 * 当前用户响应数据
 */
export interface CurrentUserData {
  userId: string
}

/**
 * 当前用户响应
 */
export type CurrentUserResponse = ResponseResult<CurrentUserData>

// ==================== API方法 ====================

export const authApi = {
  /**
   * 用户登录（邮箱+密码）
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await authHttp.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  /**
   * 用户注册
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await authHttp.post<RegisterResponse>('/auth/register', data)
    return response.data
  },

  /**
   * 发送短信验证码
   */
  sendSmsCode: async (phone: string): Promise<ResponseResult<void>> => {
    const response = await authHttp.post<ResponseResult<void>>('/auth/sms/send', { phone })
    return response.data
  },

  /**
   * 手机号验证码登录
   */
  loginByPhone: async (phone: string, code: string): Promise<LoginResponse> => {
    const response = await authHttp.post<LoginResponse>('/auth/login/phone', { phone, code })
    return response.data
  },

  /**
   * 发送邮箱验证码
   */
  sendEmailCode: async (email: string): Promise<ResponseResult<void>> => {
    const response = await authHttp.post<ResponseResult<void>>('/auth/email/send', { email })
    return response.data
  },

  /**
   * 邮箱验证码登录
   */
  loginByEmail: async (email: string, code: string): Promise<LoginResponse> => {
    const response = await authHttp.post<LoginResponse>('/auth/login/email', { email, code })
    return response.data
  },

  /**
   * 刷新Token
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await authHttp.post<RefreshResponse>('/auth/refresh', { refreshToken })
    return response.data
  },

  /**
   * 登出
   */
  logout: async (accessToken?: string): Promise<LogoutResponse> => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const response = await authHttp.post<LogoutResponse>('/auth/logout', {}, { headers })
    return response.data
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: async (accessToken?: string): Promise<CurrentUserResponse> => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const response = await authHttp.get<CurrentUserResponse>('/auth/me', { headers })
    return response.data
  },

  /**
   * 获取用户完整资料（实时数据）
   */
  getUserProfile: async (accessToken?: string): Promise<ResponseResult<UserProfile>> => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const response = await authHttp.get<ResponseResult<UserProfile>>('/user/profile', { headers })
    return response.data
  },

  /**
   * 更新用户资料
   */
  updateUserProfile: async (
    data: { nickname?: string; avatarUrl?: string },
    accessToken?: string
  ): Promise<ResponseResult<UserProfile>> => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const response = await authHttp.put<ResponseResult<UserProfile>>('/user/profile', data, { headers })
    return response.data
  },

  /**
   * 上传用户头像（直传 COS）
   */
  uploadAvatar: async (file: File, token?: string): Promise<ResponseResult<{ avatarUrl: string }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await authHttp.post<ResponseResult<{ avatarUrl: string }>>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
    return response.data
  },

  /**
   * 获取用户统计数据
   */
  getUserStats: async (accessToken?: string): Promise<ResponseResult<UserStats>> => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const response = await authHttp.get<ResponseResult<UserStats>>('/user/stats', { headers })
    return response.data
  },

  /**
   * 获取用户画像（克隆分身用）
   * 返回用户的性格特征、兴趣标签及数据充分度
   */
  getUserPortrait: async (accessToken?: string): Promise<ResponseResult<UserPortraitVO>> => {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const response = await authHttp.get<ResponseResult<UserPortraitVO>>('/user/portrait', { headers })
    return response.data
  }
}
