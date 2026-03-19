import http from '@/services/http'

/**
 * 消费记录
 */
export interface UsageLogVO {
  id: string
  source: string
  businessType: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  creditsCharged: number
  callTime: string
  elapsedMs: number
}

/**
 * 每日签到
 */
export interface ClaimResult {
  success: boolean
  message: string
}

export interface ClaimStatus {
  claimed: boolean
  message: string
}

export const billingApi = {
  getUserUsageLogs: (): Promise<UsageLogVO[]> => http.get('/billing/usage-logs').then(res => res.data),
  claimDailyCredits: (): Promise<ClaimResult> => http.post('/billing/daily-credits/claim').then(res => res.data),
  getDailyCreditsStatus: (): Promise<ClaimStatus> => http.get('/billing/daily-credits/status').then(res => res.data)
}
