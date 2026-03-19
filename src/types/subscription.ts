/**
 * 订阅系统类型定义
 *
 * @author Han
 * @since 2026-01-26
 */

// ==================== 基础类型 ====================

/**
 * 套餐等级类型（新增 ultra）
 */
export type TierType = 'free' | 'pro' | 'turbo' | 'ultra'

/**
 * 计费周期
 */
export type BillingCycle = 'monthly' | 'yearly'

/**
 * 订阅操作类型
 */
export type SubscriptionOperationType =
  | 'subscribe'
  | 'upgrade'
  | 'downgrade'
  | 'renew'
  | 'cancel'
  | 'expire'
  | 'admin_set'

/**
 * 操作来源
 */
export type OperationSource = 'user' | 'admin' | 'system'

// ==================== 套餐配置 ====================

/**
 * 套餐配置 VO
 */
export interface SubscriptionPlan {
  /** 套餐代码（free, pro, turbo, ultra） */
  id: TierType
  /** 套餐名称 */
  name: string
  /** 套餐描述 */
  description: string
  /** 月付价格 */
  monthlyPrice: number
  /** 年付价格 */
  yearlyPrice: number
  /** 年付折算月价 */
  yearlyMonthlyPrice: number
  /** 年付节省金额 */
  yearlySaving: number
  /** 每月 Credit 额度 */
  monthlyCredits: number
  /** 深度推理每月使用次数（null 表示无限） */
  maxModeUsesPerMonth: number | null
  /** 充值加成比率 */
  rechargeBonusRate: number
  /** 透支限额 */
  overdraftLimit: number
  /** 可用模型列表 */
  accessibleModels: string[]
  /** 特性列表（旧字段，向后兼容） */
  features: string[]
  /** 核心亮点特性（卡片默认显示 5-6 条） */
  highlightFeatures?: string[]
  /** 完整对比特性（"查看完整对比"展开后显示） */
  expandedFeatures?: string[]
  /** Credits 对话换算锚点（如"约 200 次对话/月"） */
  creditsAnchor?: string
  /** 每日成本锚点（如"每天不到 ¥3.3"） */
  dailyCostAnchor?: string
  /** 场景描述（紧随模型名称显示，如"深度分析、长文写作"） */
  sceneDescription?: string
  /** 是否对外公开 */
  isPublic: boolean
  /** 排序顺序 */
  sortOrder: number
  /** 徽章样式类名 */
  badgeStyle: string
  /** 卡片样式类名 */
  cardStyle: string
  /** 等级权重 */
  tierLevel: number
  /** 标签（如 "推荐"） */
  tag?: string
}

// ==================== 用户订阅状态 ====================

/**
 * 用户订阅 VO
 */
export interface UserSubscription {
  /** 用户 ID */
  userId: string
  /** 当前套餐 ID */
  planId: TierType
  /** 计费周期 */
  billingCycle: BillingCycle
  /** 套餐开始时间 */
  subscriptionStartTime: string | null
  /** 套餐到期时间 */
  subscriptionEndTime: string | null
  /** 是否自动续费 */
  autoRenew: boolean
  /** 累计订阅金额 */
  totalSubscriptionAmount: number
  /** 本月 MAX 模式使用次数 */
  maxModeUsesThisMonth: number
  /** MAX 模式剩余次数（-1 表示无限） */
  maxModeRemaining: number
  /** 订阅是否有效 */
  isActive: boolean
  /** 套餐详情 */
  plan: SubscriptionPlan
}

// ==================== 订阅操作 ====================

/**
 * 订阅请求
 */
export interface SubscribeRequest {
  /** 目标套餐 ID */
  planId: TierType
  /** 计费周期 */
  billingCycle: BillingCycle
}

/**
 * 订阅操作结果
 */
export interface SubscriptionResult {
  /** 是否成功 */
  success: boolean
  /** 错误消息 */
  errorMessage?: string
  /** 操作类型 */
  operationType?: SubscriptionOperationType
  /** 原套餐 ID */
  fromPlanId?: string
  /** 新套餐 ID */
  toPlanId?: string
  /** 计费周期 */
  billingCycle?: BillingCycle
  /** 支付金额 */
  paymentAmount?: number
  /** 套餐开始时间 */
  subscriptionStartTime?: string
  /** 套餐到期时间 */
  subscriptionEndTime?: string
}

// ==================== MAX 模式 ====================

/**
 * MAX 模式检查结果
 */
export interface MaxModeCheckResult {
  /** 是否允许使用 */
  allowed: boolean
  /** 本月已使用次数 */
  usedCount: number
  /** 本月限制次数（null 表示无限） */
  limitCount: number | null
  /** 剩余次数（-1 表示无限） */
  remainingCount: number
  /** 提示消息 */
  message: string
  /** 用户套餐 ID */
  planId?: TierType
}

// ==================== 订阅日志 ====================

/**
 * 订阅变更日志 VO
 */
export interface SubscriptionLog {
  /** 日志 ID */
  id: string
  /** 用户 ID */
  userId: string
  /** 操作类型 */
  operationType: SubscriptionOperationType
  /** 原套餐 ID */
  fromPlanId?: string
  /** 新套餐 ID */
  toPlanId: string
  /** 原计费周期 */
  fromBillingCycle?: BillingCycle
  /** 新计费周期 */
  toBillingCycle?: BillingCycle
  /** 支付金额 */
  paymentAmount: number
  /** 支付方式 */
  paymentMethod?: string
  /** 交易 ID */
  paymentTransactionId?: string
  /** 操作来源 */
  operationSource: OperationSource
  /** 操作人 ID */
  operatorId?: string
  /** 备注 */
  remark?: string
  /** 创建时间 */
  createdTime: string
}

// ==================== 套餐样式配置 ====================

/**
 * 套餐徽章样式映射
 */
export const TIER_BADGE_STYLES: Record<TierType, string> = {
  free: 'tier-badge-free',
  pro: 'tier-badge-pro',
  turbo: 'tier-badge-turbo',
  ultra: 'tier-badge-ultra'
}

/**
 * 套餐卡片样式映射
 */
export const TIER_CARD_STYLES: Record<TierType, string> = {
  free: 'tier-card-free',
  pro: 'tier-card-pro',
  turbo: 'tier-card-turbo',
  ultra: 'tier-card-ultra'
}

/**
 * 套餐显示名称映射
 */
export const TIER_DISPLAY_NAMES: Record<TierType, string> = {
  free: 'Free',
  pro: 'Pro',
  turbo: 'Turbo',
  ultra: 'Ultra'
}

/**
 * 计费周期显示名称映射
 * 注意：此常量仅用于非响应式场景的静态映射。
 * 在 Vue 组件中应使用 t('common.billingCycle.monthly') / t('common.billingCycle.yearly')
 */
export const BILLING_CYCLE_NAMES: Record<BillingCycle, string> = {
  monthly: '月付',
  yearly: '年付'
}

/**
 * 获取计费周期的 i18n key
 */
export const BILLING_CYCLE_I18N_KEYS: Record<BillingCycle, string> = {
  monthly: 'common.billingCycle.monthly',
  yearly: 'common.billingCycle.yearly'
}
