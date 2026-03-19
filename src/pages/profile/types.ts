/**
 * Profile 页面本地类型定义
 */
import type { Component } from 'vue'
import type { TierType } from '@/types/subscription'

/**
 * Profile 标签页 Key
 */
export type ProfileTabKey = 'published' | 'liked' | 'inspiration' | 'clips' | 'memory' | 'usage'

/**
 * Profile 标签页定义
 */
export interface ProfileTab {
  key: ProfileTabKey
  label: string
  icon: string
}

/**
 * 统计卡片数据
 */
export interface ProfileStat {
  label: string
  value: string | number
  icon: Component
  color: 'teal' | 'amber' | 'rose' | 'purple'
}

/**
 * MAX 模式信息
 */
export interface MaxModeInfo {
  remaining: number
  limit: number | null
  isUnlimited: boolean
}

/**
 * 设置快捷入口
 */
export interface SettingsShortcut {
  icon: Component
  label: string
  tab: 'account' | 'preferences' | 'help'
}

/**
 * Tier 颜色配置
 */
export const TIER_COLORS: Record<TierType, {
  ring: string
  badge: string
  badgeText: string
  accent: string
}> = {
  free: {
    ring: 'bg-gradient-to-br from-slate-200 to-slate-300',
    badge: 'bg-slate-100 text-slate-600',
    badgeText: 'Free',
    accent: 'text-slate-500'
  },
  pro: {
    ring: 'bg-gradient-to-br from-emerald-400 to-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
    badgeText: 'PRO',
    accent: 'text-emerald-600'
  },
  turbo: {
    ring: 'bg-gradient-to-br from-amber-400 to-amber-500',
    badge: 'bg-amber-50 text-amber-700',
    badgeText: 'TURBO',
    accent: 'text-amber-600'
  },
  ultra: {
    ring: '', // Ultra uses custom animated gradient
    badge: 'bg-gradient-to-r from-pink-100 to-sky-100 text-violet-700',
    badgeText: 'ULTRA',
    accent: 'text-violet-600'
  }
}
