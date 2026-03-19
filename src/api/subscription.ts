import http from '@/services/http'
import type {
  SubscriptionPlan,
  UserSubscription,
  SubscribeRequest,
  SubscriptionResult,
  MaxModeCheckResult,
  SubscriptionLog,
  BillingCycle
} from '@/types/subscription'

/**
 * 订阅 API 接口封装
 *
 * @author Han
 * @since 2026-01-26
 */

// ==================== 响应类型 ====================

interface ResponseResult<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

// ==================== API 方法 ====================

export const subscriptionApi = {
  /**
   * 获取公开套餐列表
   */
  getPlans: async (): Promise<ResponseResult<SubscriptionPlan[]>> => {
    return http.get('/public/subscription/plans')
  },

  /**
   * 获取套餐详情
   */
  getPlanById: async (planId: string): Promise<ResponseResult<SubscriptionPlan>> => {
    return http.get(`/public/subscription/plans/${planId}`)
  },

  /**
   * 获取当前用户订阅状态
   */
  getCurrentSubscription: async (): Promise<ResponseResult<UserSubscription>> => {
    return http.get('/public/subscription/current')
  },

  /**
   * 订阅/升级/降级套餐
   */
  subscribe: async (request: SubscribeRequest): Promise<ResponseResult<SubscriptionResult>> => {
    return http.post('/public/subscription/subscribe', request)
  },

  /**
   * 取消订阅（降级为 Free）
   */
  cancel: async (): Promise<ResponseResult<SubscriptionResult>> => {
    return http.post('/public/subscription/cancel')
  },

  /**
   * 续费当前套餐
   */
  renew: async (billingCycle: BillingCycle = 'monthly'): Promise<ResponseResult<SubscriptionResult>> => {
    return http.post('/public/subscription/renew', { billingCycle })
  },

  /**
   * 更新自动续费状态
   */
  updateAutoRenew: async (autoRenew: boolean): Promise<ResponseResult<boolean>> => {
    return http.put('/public/subscription/auto-renew', { autoRenew })
  },

  /**
   * 获取订阅变更日志
   */
  getLogs: async (page: number = 0, pageSize: number = 20): Promise<ResponseResult<SubscriptionLog[]>> => {
    return http.get('/public/subscription/logs', {
      params: { page, pageSize }
    })
  },

  /**
   * 检查 MAX 模式使用权限
   */
  checkMaxMode: async (): Promise<ResponseResult<MaxModeCheckResult>> => {
    return http.get('/public/subscription/max-mode/check')
  },

  /**
   * 记录 MAX 模式使用
   */
  recordMaxModeUse: async (): Promise<ResponseResult<MaxModeCheckResult>> => {
    return http.post('/public/subscription/max-mode/use')
  }
}

export default subscriptionApi
