import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type LoginRequest, type RegisterRequest, type User, type UserProfile } from '@/api/auth'
import { onboardingApi } from '@/api/memory'
import i18n from '@/i18n'

const { t } = i18n.global

/**
 * 认证状态管理
 * 使用 Pinia 持久化插件自动管理 Token 和用户信息
 */
export const useAuthStore = defineStore('auth', () => {
    // ==================== 状态 ====================
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const tokenExpiry = ref<number | null>(null)
    const user = ref<User | null>(null)
    const profileVersion = ref(0)

    /** 加载状态 */
    const isLoggingIn = ref(false)
    const isLoggingOut = ref(false)
    const isFetchingUser = ref(false)
    const isRefreshingProfile = ref(false)

    /** Onboarding 是否已完成（Pinia 持久化自动同步 localStorage） */
    const onboardingCompleted = ref(false)

    // ==================== 计算属性 ====================
    const isAuthenticated = computed(() => !!accessToken.value)

    const isTokenExpiring = computed(() => {
        if (!tokenExpiry.value) return true
        return Date.now() >= tokenExpiry.value
    })

    const isOnboardingCompleted = computed(() => onboardingCompleted.value)

    // ==================== 方法 ====================

    /**
     * 设置 Token
     */
    const setTokens = (access: string, refresh: string, expiresIn: number) => {
        accessToken.value = access
        refreshToken.value = refresh
        // 提前 5 分钟标记为即将过期
        tokenExpiry.value = Date.now() + (expiresIn - 300) * 1000
    }

    /**
     * 获取 Access Token
     */
    const getAccessToken = (): string | null => {
        return accessToken.value
    }

    /**
     * 获取 Refresh Token
     */
    const getRefreshToken = (): string | null => {
        return refreshToken.value
    }

    /**
     * 清除认证状态
     */
    const clearAuth = () => {
        accessToken.value = null
        refreshToken.value = null
        tokenExpiry.value = null
        user.value = null
        profileVersion.value = 0
        onboardingCompleted.value = false
    }

    const applyUserProfile = (profile: UserProfile) => {
        const nextUser: User = {
            userId: profile.userId,
            username: profile.username,
            nickname: profile.nickname,
            avatarUrl: profile.avatarUrl,
            email: profile.email,
            phone: profile.phone,
            tier: (profile.subscription?.planId || profile.tier || 'free') as User['tier'],
            credits: profile.credits,
            totalCreditsUsed: profile.totalCreditsUsed,
            subscription: profile.subscription
        }

        user.value = user.value
            ? {
                ...user.value,
                ...nextUser
            }
            : nextUser
        profileVersion.value = Date.now()
    }

    /**
     * 用户登录
     */
    const login = async (credentials: LoginRequest) => {
        if (isLoggingIn.value) return
        isLoggingIn.value = true
        try {
            const response = await authApi.login(credentials)

            // ResponseResult格式: { code, message, data: { accessToken, refreshToken, expiresIn, user } }
            if (response.code !== 200) {
                throw new Error(response.message || t('storeAuth.error.loginFailed'))
            }

            const { accessToken: access, refreshToken: refresh, expiresIn, user: userInfo } = response.data

            // 存储 Token
            setTokens(access, refresh, expiresIn)

            // 存储用户信息
            user.value = userInfo
            profileVersion.value = Date.now()
            // 优先使用登录响应中的 onboardingCompleted 字段
            if (userInfo.onboardingCompleted) {
                onboardingCompleted.value = true
            } else {
                // 兜底：后端未返回时通过独立接口同步
                await syncOnboardingStatus()
            }
            return response
        } catch (error) {
            console.error('登录失败:', error)
            throw error
        } finally {
            isLoggingIn.value = false
        }
    }

    /**
     * 用户注册
     */
    const register = async (data: RegisterRequest) => {
        try {
            const response = await authApi.register(data)

            if (response.code !== 200) {
                throw new Error(response.message || t('storeAuth.error.registerFailed'))
            }

            return response
        } catch (error) {
            console.error('注册失败:', error)
            throw error
        }
    }

    /**
     * 登出
     */
    const logout = async () => {
        if (isLoggingOut.value) return
        isLoggingOut.value = true
        try {
            if (accessToken.value) {
                const response = await authApi.logout(accessToken.value)
                if (response.code !== 200) {
                    console.warn('登出接口返回异常:', response.message)
                }
            }
        } catch (error) {
            console.error('登出接口调用失败:', error)
        } finally {
            // 无论接口是否成功，都清除本地状态
            clearAuth()
            isLoggingOut.value = false
        }
    }

    /**
     * 获取当前用户信息
     */
    const fetchCurrentUser = async () => {
        if (!isAuthenticated.value) {
            user.value = null
            return
        }
        if (isFetchingUser.value) return
        isFetchingUser.value = true

        try {
            const response = await authApi.getCurrentUser(accessToken.value || undefined)

            if (response.code !== 200) {
                throw new Error(response.message || t('storeAuth.error.fetchUserFailed'))
            }

            // user.value = response.data
            console.log('当前用户:', response.data)
        } catch (error) {
            console.error('获取用户信息失败:', error)
            // 如果获取失败，可能是token invalid，清除本地状态
            clearAuth()
        } finally {
            isFetchingUser.value = false
        }
    }

    /**
     * 刷新用户资料（从后端获取最新数据）
     * 用于：对话结束后、订阅变更后、进入 Profile 页面时
     */
    const refreshUserProfile = async () => {
        if (!isAuthenticated.value || !accessToken.value) {
            return
        }
        if (isRefreshingProfile.value) return
        isRefreshingProfile.value = true

        try {
            const response = await authApi.getUserProfile(accessToken.value)

            if (response.code === 200 && response.data) {
                applyUserProfile(response.data)
                return response.data
            }
        } catch (error) {
            console.error('刷新用户资料失败:', error)
        } finally {
            isRefreshingProfile.value = false
        }
    }

    const fetchUserProfile = refreshUserProfile

    /**
     * 邮箱验证码登录
     */
    const loginByEmailCode = async (email: string, code: string) => {
        if (isLoggingIn.value) return
        isLoggingIn.value = true
        try {
            const response = await authApi.loginByEmail(email, code)
            if (response.code !== 200) {
                throw new Error(response.message || t('storeAuth.error.loginFailed'))
            }
            const { accessToken: access, refreshToken: refresh, expiresIn, user: userInfo } = response.data
            setTokens(access, refresh, expiresIn)
            user.value = userInfo
            profileVersion.value = Date.now()
            if (userInfo.onboardingCompleted) {
                onboardingCompleted.value = true
            } else {
                await syncOnboardingStatus()
            }
            return response
        } catch (error) {
            console.error('邮箱验证码登录失败:', error)
            throw error
        } finally {
            isLoggingIn.value = false
        }
    }

    /**
     * 手机号验证码登录
     */
    const loginByPhoneCode = async (phone: string, code: string) => {
        if (isLoggingIn.value) return
        isLoggingIn.value = true
        try {
            const response = await authApi.loginByPhone(phone, code)
            if (response.code !== 200) {
                throw new Error(response.message || t('storeAuth.error.loginFailed'))
            }
            const { accessToken: access, refreshToken: refresh, expiresIn, user: userInfo } = response.data
            setTokens(access, refresh, expiresIn)
            user.value = userInfo
            profileVersion.value = Date.now()
            if (userInfo.onboardingCompleted) {
                onboardingCompleted.value = true
            } else {
                await syncOnboardingStatus()
            }
            return response
        } catch (error) {
            console.error('手机号验证码登录失败:', error)
            throw error
        } finally {
            isLoggingIn.value = false
        }
    }

    /**
     * 标记 Onboarding 已完成
     */
    const markOnboardingCompleted = () => {
        onboardingCompleted.value = true
    }

    /**
     * 同步 Onboarding 状态（SWR 模式）
     * localStorage 快判 + 后端校验，确保跨设备一致
     */
    const syncOnboardingStatus = async () => {
        if (isOnboardingCompleted.value) return
        try {
            const { completed } = await onboardingApi.status()
            if (completed) {
                markOnboardingCompleted()
            }
        } catch {
            // 静默失败，路由守卫会兜底跳转到 onboarding
        }
    }

    /**
     * 初始化（应用启动时调用）
     */
    const init = async () => {
        // 迁移旧版独立 localStorage key → Pinia 状态
        const legacyKey = 'onboarding_completed'
        if (localStorage.getItem(legacyKey) === 'true' && !onboardingCompleted.value) {
            onboardingCompleted.value = true
            localStorage.removeItem(legacyKey)
        }

        if (isAuthenticated.value) {
            await fetchCurrentUser()
            // fetchCurrentUser 失败会 clearAuth()，此时 isAuthenticated 已为 false
            if (isAuthenticated.value) {
                await refreshUserProfile()
                syncOnboardingStatus()
            }
        }
    }

    return {
        // 状态
        accessToken,
        refreshToken,
        tokenExpiry,
        user,
        profileVersion,
        isAuthenticated,
        isTokenExpiring,
        isLoggingIn,
        isLoggingOut,
        isFetchingUser,
        isRefreshingProfile,

        // Onboarding
        onboardingCompleted,
        isOnboardingCompleted,
        markOnboardingCompleted,

        // 方法
        setTokens,
        getAccessToken,
        getRefreshToken,
        clearAuth,
        login,
        loginByEmailCode,
        loginByPhoneCode,
        register,
        logout,
        fetchCurrentUser,
        refreshUserProfile,
        fetchUserProfile,
        init
    }
}, {
    // 配置持久化 — 仅持久化认证凭据与用户数据，排除 loading flag
    persist: {
        pick: [
            'accessToken',
            'refreshToken',
            'tokenExpiry',
            'user',
            'profileVersion',
            'onboardingCompleted',
        ],
    }
})
