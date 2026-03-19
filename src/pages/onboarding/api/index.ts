/**
 * Onboarding 页面专用 API
 *
 * 扩展 memory.ts 中的基础 onboarding 接口，
 * 增加 AI 人格反应和头像生成端点。
 */

import http from '@/services/http'
import type { OnboardingSubmitRequest, PersonaReactRequest, PersonaReactResponse } from '../types'

export const onboardingPageApi = {
  /** AI 评估用户回答 + 温暖回应（自由文本时包含质量判定） */
  getPersonaReaction: (data: PersonaReactRequest): Promise<PersonaReactResponse> =>
    http.post('/memory/onboarding/persona/react', data).then(res => res.data),

  /** 生成 AI 专属头像 */
  generateAvatar: (data: {
    traits: string[]
    style: string
    userName: string
  }): Promise<{ url: string }> =>
    http.post('/memory/onboarding/avatar/generate', data).then(res => res.data),

  /** 提交完整 Onboarding 数据 */
  submit: (data: OnboardingSubmitRequest): Promise<{ success: boolean; message: string }> =>
    http.post('/memory/onboarding', data).then(res => res.data),

  /** 检查 Onboarding 状态 */
  status: (): Promise<{ completed: boolean }> =>
    http.get('/memory/onboarding/status').then(res => res.data),
}
