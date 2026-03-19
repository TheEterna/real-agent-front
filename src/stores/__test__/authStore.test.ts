import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/auth', () => ({
  authApi: {
    getUserProfile: vi.fn()
  }
}))

vi.mock('@/api/memory', () => ({
  onboardingApi: {
    status: vi.fn().mockResolvedValue({ completed: false })
  }
}))

import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

const mockedGetUserProfile = vi.mocked(authApi.getUserProfile)

describe('authStore.refreshUserProfile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('hydrates user from profile when persisted user snapshot is missing', async () => {
    const store = useAuthStore()
    store.setTokens('access-token', 'refresh-token', 3600)

    mockedGetUserProfile.mockResolvedValue({
      code: 200,
      message: 'ok',
      data: {
        userId: 'user-1',
        username: 'alice@example.com',
        nickname: 'Alice',
        email: 'alice@example.com',
        phone: '13800000000',
        avatarUrl: 'https://cdn.example.com/avatar-new.png',
        credits: 12,
        totalCreditsUsed: 5,
        tier: 'pro',
        subscription: {
          planId: 'pro'
        },
        status: 0,
        createdTime: '2026-03-10T10:00:00Z'
      },
      timestamp: Date.now()
    })

    await store.refreshUserProfile()

    expect(store.user).toMatchObject({
      userId: 'user-1',
      username: 'alice@example.com',
      nickname: 'Alice',
      email: 'alice@example.com',
      phone: '13800000000',
      avatarUrl: 'https://cdn.example.com/avatar-new.png',
      credits: 12,
      totalCreditsUsed: 5,
      tier: 'pro',
      subscription: {
        planId: 'pro'
      }
    })
  })

  it('merges latest profile fields into existing user and bumps profile version', async () => {
    const store = useAuthStore()
    store.setTokens('access-token', 'refresh-token', 3600)
    store.user = {
      userId: 'user-1',
      username: 'alice@example.com',
      nickname: 'Old Alice',
      avatarUrl: 'https://cdn.example.com/avatar-old.png',
      tier: 'free',
      credits: 1,
      totalCreditsUsed: 1
    }

    mockedGetUserProfile.mockResolvedValue({
      code: 200,
      message: 'ok',
      data: {
        userId: 'user-1',
        username: 'alice@example.com',
        nickname: 'Alice',
        email: 'alice@example.com',
        phone: '13800000000',
        avatarUrl: 'https://cdn.example.com/avatar-new.png',
        credits: 18,
        totalCreditsUsed: 7,
        tier: 'ultra',
        subscription: {
          planId: 'ultra'
        },
        status: 0,
        createdTime: '2026-03-10T10:00:00Z'
      },
      timestamp: Date.now()
    })

    await store.refreshUserProfile()

    expect(store.user).toMatchObject({
      nickname: 'Alice',
      avatarUrl: 'https://cdn.example.com/avatar-new.png',
      credits: 18,
      totalCreditsUsed: 7,
      tier: 'ultra',
      subscription: {
        planId: 'ultra'
      }
    })
    expect(store.profileVersion).toBeGreaterThan(0)
  })
})
