// ============================================================
// Avatar — 分身类型定义
// ============================================================

import type { TierType } from '@/types/subscription'

/** 分身主页 Tab 类型 */
export type AvatarProfileTab = 'feed' | 'settings' | 'capability'

/** 人设预设数据 */
export interface PersonalityPresetData {
  name: string
  tone: string
  interests: string[]
  expertise: string[]
}

// ============================================================
// 创建流程相关类型
// ============================================================

/** 分身内核等级 */
export type AvatarCoreTier = 'lite' | 'standard' | 'flagship'

/** 内核能力规格（前端展示用，硬编码） */
export interface CoreTierSpec {
  tier: AvatarCoreTier
  label: string
  description: string
  icon: string
  maxActionsPerDay: number | null
  maxKnowledgeDocs: number | null
  maxTools: number | null
  multimodal: string[]
  contextWindow: string
  requiredTier: TierType
}

/** 创建流程类型 */
export type AvatarCreateFlow = 'instant' | 'light' | 'guided'

/** 模版定义 */
export interface AvatarTemplate {
  id: string
  name: string
  icon: string
  description: string
  highlight?: boolean
  flow: AvatarCreateFlow
  defaultPersonality?: {
    tone?: string
    interests?: string[]
    expertise?: string[]
  }
  extraStepLabel?: string
  /** 能力示例（用于展示这个分身能做什么） */
  examples?: string[]
}

/** 用户画像（克隆自己用） */
export interface UserPortrait {
  nickname: string
  avatarUrl: string | null
  traits: string[]
  interests: string[]
  sufficient: boolean
}

// ============================================================
// 能力插件系统相关类型
// ============================================================

/** 工具分类 */
export type ToolCategory = 'web' | 'data' | 'ai' | 'document' | 'code' | 'chat'

/** 技能分类 */
export type SkillCategory = 'writing' | 'code' | 'analysis' | 'research' | 'productivity' | 'creative'

/** 分身绑定的工具 */
export interface AvatarTool {
  id: string
  toolId: string
  toolName: string
  description: string
  category: ToolCategory
  isEnabled: boolean
  config: Record<string, unknown>
  createdTime: string
}

/** 分身绑定的技能 */
export interface AvatarSkill {
  id: string
  skillId: string
  skillName: string
  description: string
  category: SkillCategory
  isEnabled: boolean
  config: Record<string, unknown>
  createdTime: string
}

/** 可用工具（供选择） */
export interface AvailableTool {
  id: string
  name: string
  description: string
  category: ToolCategory
  type: 'SYSTEM' | 'MCP'
  isBound: boolean
}

/** 可用技能（供选择） */
export interface AvailableSkill {
  id: string
  name: string
  description: string
  category: SkillCategory
  isOfficial: boolean
  isBound: boolean
}

/** 能力配额 */
export interface CapabilityQuota {
  usedTools: number
  maxTools: number
  usedSkills: number
  maxSkills: number
}

/** 绑定工具请求 */
export interface BindToolRequest {
  toolId: string
  config?: Record<string, unknown>
}

/** 绑定技能请求 */
export interface BindSkillRequest {
  skillId: string
  config?: Record<string, unknown>
}

// ============================================================
// 细粒度行为权限系统（从全局类型 re-export）
// ============================================================

export type {
  PermissionMode,
  BasePermissions,
  McpCapabilityPermission,
  AvatarPermissions,
} from '@/types/avatar'
