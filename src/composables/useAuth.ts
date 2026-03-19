/**
 * 认证相关组合式函数
 * 
 * 提供认证状态管理、表单验证、错误处理等功能
 * 封装认证相关的业务逻辑，供组件使用
 */

import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import type { 
  AuthMode, 
  AuthMethod,
  LoginFormData, 
  RegisterFormData,
  ValidationRules,
  ValidationError,
  LoginSuccessData,
  RegisterSuccessData
} from '@/types/auth'
import { AUTH_CONSTANTS } from '@/types/auth'

/**
 * 认证组合式函数
 */
export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()
  const { t } = useI18n()

  // ==================== 响应式状态 ====================

  const isLoginMode = ref(true)
  const loading = ref(false)
  const authMethod = ref<AuthMethod>('password')
  const errors = reactive<Record<string, string>>({})

  // ==================== 计算属性 ====================

  /**
   * 当前认证模式
   */
  const currentMode = computed<AuthMode>(() => 
    isLoginMode.value ? 'login' : 'register'
  )

  /**
   * 是否已认证
   */
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  // ==================== 表单验证 ====================

  /**
   * 验证邮箱格式
   */
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return t('composable.auth.emailRequired')
    }
    if (!AUTH_CONSTANTS.EMAIL_REGEX.test(email)) {
      return t('composable.auth.emailInvalid')
    }
    return null
  }

  /**
   * 验证密码强度
   */
  const validatePassword = (password: string): string | null => {
    if (!password) {
      return t('composable.auth.passwordRequired')
    }
    if (password.length < AUTH_CONSTANTS.MIN_PASSWORD_LENGTH) {
      return t('composable.auth.passwordMinLength', { min: AUTH_CONSTANTS.MIN_PASSWORD_LENGTH })
    }
    // 可选：检查密码强度
    // if (!AUTH_CONSTANTS.PASSWORD_STRENGTH_REGEX.test(password)) {
    //   return '密码必须包含字母和数字'
    // }
    return null
  }

  /**
   * 验证确认密码
   */
  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) {
      return t('composable.auth.confirmPasswordRequired')
    }
    if (password !== confirmPassword) {
      return t('composable.auth.passwordMismatch')
    }
    return null
  }

  /**
   * 验证表单字段
   */
  const validateField = (field: string, value: string, formData?: any): string | null => {
    switch (field) {
      case 'email':
        return validateEmail(value)
      case 'password':
        return validatePassword(value)
      case 'confirmPassword':
        return formData ? validateConfirmPassword(formData.password, value) : null
      case 'nickname':
        // 昵称是可选的，只需要检查长度
        if (value && value.length > 50) {
          return t('composable.auth.nicknameTooLong')
        }
        return null
      default:
        return null
    }
  }

  /**
   * 验证整个表单
   */
  const validateForm = (formData: LoginFormData | RegisterFormData): ValidationError[] => {
    const validationErrors: ValidationError[] = []

    // 验证邮箱
    const emailError = validateField('email', formData.email)
    if (emailError) {
      validationErrors.push({ field: 'email', message: emailError })
    }

    // 验证密码
    const passwordError = validateField('password', formData.password)
    if (passwordError) {
      validationErrors.push({ field: 'password', message: passwordError })
    }

    // 注册模式额外验证
    if (!isLoginMode.value) {
      const registerData = formData as RegisterFormData
      
      // 验证确认密码
      const confirmPasswordError = validateField('confirmPassword', registerData.confirmPassword, registerData)
      if (confirmPasswordError) {
        validationErrors.push({ field: 'confirmPassword', message: confirmPasswordError })
      }

      // 验证昵称
      if (registerData.nickname) {
        const nicknameError = validateField('nickname', registerData.nickname)
        if (nicknameError) {
          validationErrors.push({ field: 'nickname', message: nicknameError })
        }
      }
    }

    return validationErrors
  }

  // ==================== 认证方法 ====================

  /**
   * 登录
   */
  const login = async (formData: LoginFormData): Promise<LoginSuccessData> => {
    loading.value = true
    
    try {
      // 验证表单
      const validationErrors = validateForm(formData)
      if (validationErrors.length > 0) {
        // 设置错误状态
        validationErrors.forEach(error => {
          errors[error.field] = error.message
        })
        throw new Error(t('composable.auth.formValidationFailed'))
      }

      // 调用登录API（使用邮箱登录）
      const response = await authStore.login({
        email: formData.email,
        password: formData.password
      })

      if (!response || response.code !== 200) {
        throw new Error(response?.message || t('composable.auth.loginFailed'))
      }

      // 清除错误状态
      Object.keys(errors).forEach(key => delete errors[key])

      return response.data as LoginSuccessData
    } catch (error: any) {
      console.error('登录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 注册
   */
  const register = async (formData: RegisterFormData): Promise<RegisterSuccessData> => {
    loading.value = true
    
    try {
      // 验证表单
      const validationErrors = validateForm(formData)
      if (validationErrors.length > 0) {
        // 设置错误状态
        validationErrors.forEach(error => {
          errors[error.field] = error.message
        })
        throw new Error(t('composable.auth.formValidationFailed'))
      }

      // 调用注册API（使用邮箱注册）
      const response = await authStore.register({
        email: formData.email,
        password: formData.password,
        code: formData.code,
        nickname: formData.nickname || formData.email.split('@')[0] // 默认使用邮箱前缀作为昵称
      })

      if (!response || response.code !== 200) {
        throw new Error(response?.message || t('composable.auth.registerFailed'))
      }

      // 清除错误状态
      Object.keys(errors).forEach(key => delete errors[key])

      return { ...response.data, email: formData.email } as RegisterSuccessData
    } catch (error: any) {
      console.error('注册失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  const logout = async () => {
    loading.value = true
    
    try {
      await authStore.logout()
      await router.push('/')
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 社交登录
   */
  const socialLogin = async (provider: string) => {
    loading.value = true
    
    try {
      // 这里将在后续任务中实现具体的社交登录逻辑
      console.log(`${provider} 登录`)
      
      switch (provider) {
        case 'google':
          // Google OAuth 登录
          throw new Error(t('composable.auth.googleLoginDeveloping'))
        case 'phone':
          // 手机号登录
          throw new Error(t('composable.auth.phoneLoginDeveloping'))
        default:
          throw new Error(t('composable.auth.unsupportedLoginMethod'))
      }
    } catch (error: any) {
      console.error('社交登录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 切换认证模式
   */
  const toggleMode = () => {
    isLoginMode.value = !isLoginMode.value
    // 清除错误状态
    Object.keys(errors).forEach(key => delete errors[key])
  }

  /**
   * 设置认证方式
   */
  const setAuthMethod = (method: AuthMethod) => {
    authMethod.value = method
  }

  /**
   * 设置字段错误
   */
  const setFieldError = (field: string, message: string) => {
    errors[field] = message
  }

  /**
   * 清除字段错误
   */
  const clearFieldError = (field: string) => {
    delete errors[field]
  }

  /**
   * 清除所有错误
   */
  const clearAllErrors = () => {
    Object.keys(errors).forEach(key => delete errors[key])
  }

  /**
   * 检查是否需要重定向
   */
  const checkAuthRedirect = async () => {
    if (isAuthenticated.value) {
      await router.push('/chat')
      return true
    }
    return false
  }

  // ==================== 返回接口 ====================

  return {
    // 状态
    isLoginMode,
    loading,
    authMethod,
    errors,
    
    // 计算属性
    currentMode,
    isAuthenticated,
    
    // 验证方法
    validateField,
    validateForm,
    
    // 认证方法
    login,
    register,
    logout,
    socialLogin,
    
    // 工具方法
    toggleMode,
    setAuthMethod,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    checkAuthRedirect
  }
}

/**
 * 表单验证组合式函数
 */
export function useFormValidation() {
  const errors = reactive<Record<string, string>>({})
  const touched = reactive<Record<string, boolean>>({})

  /**
   * 验证字段并设置错误状态
   */
  const validateAndSetError = (field: string, value: string, validator: (value: string) => string | null) => {
    const error = validator(value)
    if (error) {
      errors[field] = error
    } else {
      delete errors[field]
    }
    touched[field] = true
    return !error
  }

  /**
   * 清除字段状态
   */
  const clearField = (field: string) => {
    delete errors[field]
    delete touched[field]
  }

  /**
   * 重置所有状态
   */
  const reset = () => {
    Object.keys(errors).forEach(key => delete errors[key])
    Object.keys(touched).forEach(key => delete touched[key])
  }

  /**
   * 检查是否有错误
   */
  const hasErrors = computed(() => Object.keys(errors).length > 0)

  /**
   * 检查字段是否被触摸过
   */
  const isFieldTouched = (field: string) => touched[field] || false

  /**
   * 获取字段错误
   */
  const getFieldError = (field: string) => errors[field] || null

  return {
    errors,
    touched,
    hasErrors,
    validateAndSetError,
    clearField,
    reset,
    isFieldTouched,
    getFieldError
  }
}