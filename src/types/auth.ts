/**
 * 登录页面重塑 - 认证相关类型定义
 * 
 * 定义新登录页面所需的所有TypeScript接口和类型
 * 遵循项目现有的类型定义规范
 */

// ==================== 基础认证类型 ====================

/**
 * 登录表单数据
 */
export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

/**
 * 注册表单数据
 */
export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  code: string
  nickname?: string
}

/**
 * 认证方式类型
 */
export type AuthMethod = 'password' | 'code' | 'google' | 'phone'

/**
 * 认证模式
 */
export type AuthMode = 'login' | 'register'

// ==================== 组件Props接口 ====================

/**
 * 登录页面主组件Props
 */
export interface LoginPageProps {
  // 作为路由页面组件，无外部props
}

/**
 * 登录页面状态
 */
export interface LoginPageState {
  isLoginMode: boolean
  loading: boolean
  authMethod: AuthMethod
}

/**
 * 品牌展示组件Props
 */
export interface BrandShowcaseProps {
  isLoginMode: boolean
}

/**
 * 品牌内容数据
 */
export interface BrandContent {
  title: string
  subtitle: string
  description: string
  stats: {
    userCount: string
    rating: number
    reviewCount: string
  }
  testimonials: Array<{
    content: string
    author: string
    role: string
    avatar?: string
  }>
}

/**
 * 认证表单组件Props
 */
export interface AuthFormProps {
  // 无外部props，内部管理状态
}

/**
 * 认证表单状态
 */
export interface AuthFormState {
  isLoginMode: boolean
  formData: LoginFormData | RegisterFormData
  loading: boolean
  errors: Record<string, string>
  authMethod: AuthMethod
}

/**
 * 社交登录组件Props
 */
export interface SocialLoginProps {
  loading?: boolean
  disabled?: boolean
}

/**
 * 动画背景组件Props
 */
export interface AnimatedBackgroundProps {
  variant?: 'grid' | 'gradient' | 'particles'
  intensity?: 'low' | 'medium' | 'high'
}

// ==================== 表单验证相关 ====================

/**
 * 表单验证规则
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  message: string
  validator?: (value: string) => boolean | string
}

/**
 * 表单验证规则集合
 */
export interface ValidationRules {
  email: ValidationRule[]
  password: ValidationRule[]
  confirmPassword?: ValidationRule[]
  nickname?: ValidationRule[]
}

/**
 * 表单验证错误
 */
export interface ValidationError {
  field: string
  message: string
}

// ==================== API响应类型 ====================

/**
 * 认证响应基础结构
 */
export interface AuthResponse<T = any> {
  code: number
  message: string
  data?: T
  timestamp?: number
}

/**
 * 登录成功响应数据
 */
export interface LoginSuccessData {
  user: {
    userId: string
    username: string
    nickname?: string
    email?: string
    avatarUrl?: string
  }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * 注册成功响应数据
 */
export interface RegisterSuccessData {
  userId: string
  username: string
  email: string
}

// ==================== 事件类型 ====================

/**
 * 认证表单事件
 */
export interface AuthFormEvents {
  'mode-change': [mode: AuthMode]
  'auth-success': [data: LoginSuccessData | RegisterSuccessData]
  'auth-error': [error: string]
  'loading-change': [loading: boolean]
}

/**
 * 社交登录事件
 */
export interface SocialLoginEvents {
  'google-login': []
  'phone-login': []
}

// ==================== 工具类型 ====================

/**
 * 响应式断点
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * 主题模式
 */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 动画状态
 */
export type AnimationState = 'idle' | 'loading' | 'success' | 'error'

/**
 * 组件尺寸
 */
export type ComponentSize = 'small' | 'medium' | 'large'

// ==================== 常量定义 ====================

/**
 * 认证相关常量
 */
export const AUTH_CONSTANTS = {
  // 密码最小长度
  MIN_PASSWORD_LENGTH: 6,
  // 用户名最小长度
  MIN_USERNAME_LENGTH: 3,
  // 邮箱正则表达式
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // 密码强度正则（至少包含字母和数字）
  PASSWORD_STRENGTH_REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  // 记住我默认过期时间（天）
  REMEMBER_ME_DAYS: 30,
  // 动画持续时间（毫秒）
  ANIMATION_DURATION: 300,
  // 表单验证防抖时间（毫秒）
  VALIDATION_DEBOUNCE: 300
} as const

/**
 * 品牌展示内容常量
 * 注意：title/subtitle/description 文案已迁移至 i18n (common.brand.*)。
 * 在 Vue 组件中应使用 t('common.brand.loginTitle') 等来获取本地化文案。
 * 此处保留静态值作为 fallback / 非组件场景使用。
 */
export const BRAND_CONTENT = {
  login: {
    title: '欢迎回来',
    subtitle: '继续您的 AI 之旅',
    description: '与 VOLO AI 一起探索无限可能，让智能助手成为您最得力的伙伴。',
    stats: {
      userCount: '10,000+',
      rating: 4.9,
      reviewCount: '2,000+'
    }
  },
  register: {
    title: '开启 AI 新体验',
    subtitle: '加入 VOLO AI 社区',
    description: '体验下一代智能助手，让 AI 成为您工作和生活的得力助手。',
    stats: {
      userCount: '10,000+',
      rating: 4.9,
      reviewCount: '2,000+'
    }
  }
} as const

/**
 * BRAND_CONTENT 的 i18n key 映射
 * 在 Vue 组件中使用: t(BRAND_CONTENT_I18N_KEYS.login.title)
 */
export const BRAND_CONTENT_I18N_KEYS = {
  login: {
    title: 'common.brand.loginTitle',
    subtitle: 'common.brand.loginSubtitle',
    description: 'common.brand.loginDescription',
  },
  register: {
    title: 'common.brand.registerTitle',
    subtitle: 'common.brand.registerSubtitle',
    description: 'common.brand.registerDescription',
  },
} as const