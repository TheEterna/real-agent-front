// ============================================================
// 数字分身类型定义
// VO = 后端返回原始数据（string 时间），Model = 前端使用（Date 时间）
// ============================================================

/**
 * 数字分身 Value Object（后端返回）
 * 注意：后端 jsonb 字段可能为 null（新建分身、旧数据迁移等场景）
 */
export interface AvatarVO {
  id: string
  userId: string
  name: string | null
  bio: string | null
  avatarUrl: string | null
  personality: AvatarPersonality | null
  autonomy: 'auto' | 'approval' | 'off' | null
  active: boolean | null
  agentConfig: AvatarAgentConfig | null
  permissions: AvatarPermissions | null
  createdTime: string
  updatedTime: string
}

/**
 * 数字分身 Model（前端使用）
 */
export interface Avatar {
  id: string
  userId: string
  name: string
  bio: string
  avatarUrl: string
  personality: AvatarPersonality
  autonomy: 'auto' | 'approval' | 'off'
  active: boolean
  agentConfig: AvatarAgentConfig
  permissions: AvatarPermissions
  createdTime: Date
  updatedTime: Date
}

/**
 * 数字分身人设配置
 */
export interface AvatarPersonality {
  tone: string
  interests: readonly string[]
  expertise: readonly string[]
  quirks: readonly string[]
}

/**
 * 数字分身 Agent 配置
 */
export interface AvatarAgentConfig {
  modelTier: string
  memoryCapacity: number
  maxActionsPerDay: number
}

// ============================================================
// 细粒度行为权限
// ============================================================

/** 权限模式 */
export type PermissionMode = 'auto' | 'approval' | 'off'

/** 基础行为权限 */
export interface BasePermissions {
  /** 发帖/写文章 */
  post: PermissionMode
  /** 评论/回复 */
  comment: PermissionMode
  /** 点赞/喜欢 */
  like: PermissionMode
  /** 关注/加好友 */
  follow: PermissionMode
}

/** 扩展 MCP 能力权限 */
export interface McpCapabilityPermission {
  /** 能力 ID */
  capabilityId: string
  /** 能力名称 */
  name: string
  /** 能力描述 */
  description: string
  /** 能力分类 */
  category: string
  /** 权限模式 */
  mode: PermissionMode
  /** 每日上限（可选） */
  dailyLimit?: number
}

/** 完整行为权限配置 */
export interface AvatarPermissions {
  /** 基础权限 */
  base: BasePermissions
  /** MCP 扩展能力权限 */
  mcpCapabilities: McpCapabilityPermission[]
  /** 全局每日操作上限 */
  globalDailyLimit: number
  /** 单条内容最大长度 */
  maxContentLength: number
}

/** 默认权限配置 */
export const DEFAULT_PERMISSIONS: AvatarPermissions = {
  base: { post: 'approval', comment: 'approval', like: 'approval', follow: 'approval' },
  mcpCapabilities: [],
  globalDailyLimit: 100,
  maxContentLength: 500,
}

/**
 * AvatarPersonality 默认值（用于 null safety）
 */
export const DEFAULT_PERSONALITY: AvatarPersonality = {
  tone: '',
  interests: [],
  expertise: [],
  quirks: [],
}

/**
 * AvatarAgentConfig 默认值（用于 null safety）
 */
export const DEFAULT_AGENT_CONFIG: AvatarAgentConfig = {
  modelTier: 'standard',
  memoryCapacity: 100,
  maxActionsPerDay: 10,
}

/**
 * 分身基本配置请求（创建 / 更新共用）
 *
 * 创建时 personality 可选传入（省去二次 updatePersonality 调用）；
 * 更新基本配置时 personality 字段被忽略，人设通过专用接口更新。
 */
export interface AvatarConfigRequest {
  name: string
  bio: string
  avatarUrl: string
  /** 创建时可选：初始人设配置 */
  personality?: AvatarPersonality
}

/**
 * 更新分身自主行为请求
 */
export interface AvatarAutonomyRequest {
  autonomy: 'auto' | 'approval' | 'off'
  active: boolean
}

/**
 * 待审批行为 Value Object（后端返回）
 * 注意：payload 为 jsonb，可能为 null；status 可能缺失
 */
export interface PendingActionVO {
  id: string
  avatarId: string
  actionType: string
  payload: Record<string, unknown> | null
  status: 'pending' | 'approved' | 'rejected' | 'expired' | null
  expiresTime: string
  createdTime: string
}

/**
 * 待审批行为 Model（前端使用）
 */
export interface PendingAction {
  id: string
  avatarId: string
  actionType: string
  payload: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  expiresTime: Date
  createdTime: Date
}

/**
 * 行为日志 Value Object（后端返回）
 */
export interface AvatarActionLogVO {
  id: string
  avatarId: string
  actionType: string
  targetId: string | null
  status: string
  content: string | null
  createdTime: string
}

/**
 * 行为日志 Model（前端使用）
 */
export interface AvatarActionLog {
  id: string
  avatarId: string
  actionType: string
  targetId: string | null
  status: string
  content: string | null
  createdTime: Date
}

/**
 * 分身记忆 Value Object（后端返回）
 * 注意：content 为 jsonb，可能为 null
 */
export interface AvatarMemoryVO {
  id: string
  avatarId: string
  type: 'style' | 'knowledge' | 'preference' | 'behavior'
  content: Record<string, unknown> | null
  weight: number | null
  source: 'chat_history' | 'manual' | 'feed_activity' | null
  createdTime: string
}

/**
 * 分身记忆 Model（前端使用）
 */
export interface AvatarMemory {
  id: string
  avatarId: string
  type: 'style' | 'knowledge' | 'preference' | 'behavior'
  content: Record<string, unknown>
  weight: number
  source: 'chat_history' | 'manual' | 'feed_activity'
  createdTime: Date
}

/**
 * 添加记忆请求
 */
export interface AddMemoryRequest {
  type: string
  content: Record<string, unknown>
  source: string
}

/**
 * 分身配额信息（前端计算，用于 UI 展示）
 */
export interface AvatarQuota {
  current: number
  max: number
  isUltra: boolean
}

// ============================================================
// 分身聊天类型定义
// ============================================================

/** 分身聊天会话 VO（后端返回） */
export interface AvatarConversationVO {
  id: string
  avatarId: string
  avatarName: string
  avatarUrl: string | null
  title: string | null
  lastMessageTime: string | null
  createdTime: string
}

/** 分身聊天会话 Model */
export interface AvatarConversation {
  id: string
  avatarId: string
  avatarName: string
  avatarUrl: string | null
  title: string | null
  lastMessageTime: Date | null
  createdTime: Date
}

/** 分身聊天消息 VO（后端返回） */
export interface AvatarChatMessageVO {
  id: string
  role: 'user' | 'assistant'
  content: string
  model: string | null
  createdTime: string
}

/** 分身聊天消息 Model */
export interface AvatarChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model: string | null
  createdTime: Date
  /** 标记此消息是否为错误提示（前端 appendErrorMessage 产生） */
  isError?: boolean
}
