// ============================================================
// Avatar 创建 — 模版定义 + 内核等级常量
// ============================================================

import type { TierType } from '@/types/subscription'
import type { AvatarTemplate, AvatarCoreTier, CoreTierSpec } from '../types'
import i18n from '@/i18n'

const { t } = i18n.global

// ==================== Template definitions ====================

export const AVATAR_TEMPLATES: AvatarTemplate[] = [
  {
    id: 'clone-self',
    name: t('avatar.templates.cloneSelfName'),
    icon: '\uD83E\uDE9E',
    description: t('avatar.templates.cloneSelfDesc'),
    highlight: true,
    flow: 'instant',
    examples: [t('avatar.templates.cloneSelfEx1'), t('avatar.templates.cloneSelfEx2'), t('avatar.templates.cloneSelfEx3')],
  },
  {
    id: 'humor',
    name: t('avatar.templates.humorName'),
    icon: '\uD83D\uDE04',
    description: t('avatar.templates.humorDesc'),
    flow: 'light',
    defaultPersonality: {
      tone: t('avatar.templates.humorTone'),
      interests: ['\u6BB5\u5B50', '\u8868\u60C5\u5305', '\u70ED\u95E8\u6897', '\u8131\u53E3\u79C0'],
      expertise: ['\u5E7D\u9ED8\u521B\u4F5C', '\u793E\u4EA4\u4E92\u52A8'],
    },
    extraStepLabel: t('avatar.templates.humorExtra'),
    examples: [t('avatar.templates.humorEx1'), t('avatar.templates.humorEx2'), t('avatar.templates.humorEx3')],
  },
  {
    id: 'tech',
    name: t('avatar.templates.techName'),
    icon: '\uD83D\uDD2C',
    description: t('avatar.templates.techDesc'),
    flow: 'guided',
    defaultPersonality: {
      tone: t('avatar.templates.techTone'),
      interests: ['AI', '\u7F16\u7A0B', '\u79D1\u6280\u65B0\u95FB', '\u5F00\u6E90\u9879\u76EE'],
      expertise: ['\u6280\u672F\u5206\u6790', '\u4EE3\u7801\u5BA1\u67E5', '\u6280\u672F\u5199\u4F5C'],
    },
    extraStepLabel: t('avatar.templates.techExtra'),
    examples: [t('avatar.templates.techEx1'), t('avatar.templates.techEx2'), t('avatar.templates.techEx3')],
  },
  {
    id: 'literary',
    name: t('avatar.templates.literaryName'),
    icon: '\uD83D\uDCD6',
    description: t('avatar.templates.literaryDesc'),
    flow: 'light',
    defaultPersonality: {
      tone: t('avatar.templates.literaryTone'),
      interests: ['\u6587\u5B66', '\u7535\u5F71', '\u97F3\u4E50', '\u6444\u5F71'],
      expertise: ['\u6587\u5B57\u521B\u4F5C', '\u4F5C\u54C1\u8D4F\u6790'],
    },
    extraStepLabel: t('avatar.templates.literaryExtra'),
    examples: [t('avatar.templates.literaryEx1'), t('avatar.templates.literaryEx2'), t('avatar.templates.literaryEx3')],
  },
  {
    id: 'social',
    name: t('avatar.templates.socialName'),
    icon: '\uD83C\uDFAF',
    description: t('avatar.templates.socialDesc'),
    flow: 'light',
    defaultPersonality: {
      tone: t('avatar.templates.socialTone'),
      interests: ['\u793E\u4EA4', '\u70ED\u70B9\u8BDD\u9898', '\u751F\u6D3B\u5206\u4EAB'],
      expertise: ['\u8BDD\u9898\u4E92\u52A8', '\u793E\u7FA4\u8FD0\u8425'],
    },
    extraStepLabel: t('avatar.templates.socialExtra'),
    examples: [t('avatar.templates.socialEx1'), t('avatar.templates.socialEx2'), t('avatar.templates.socialEx3')],
  },
  {
    id: 'custom',
    name: t('avatar.templates.customName'),
    icon: '\u2728',
    description: t('avatar.templates.customDesc'),
    flow: 'guided',
    extraStepLabel: t('avatar.templates.customExtra'),
    examples: [t('avatar.templates.customEx1'), t('avatar.templates.customEx2'), t('avatar.templates.customEx3')],
  },
]

// ==================== Core tier specs ====================

export const CORE_TIER_SPECS: Record<AvatarCoreTier, CoreTierSpec> = {
  lite: {
    tier: 'lite',
    label: t('avatar.templates.liteCoreLabel'),
    description: t('avatar.templates.liteCoreDesc'),
    icon: '\u26A1',
    maxActionsPerDay: 20,
    maxKnowledgeDocs: 5,
    maxTools: 3,
    multimodal: ['text'],
    contextWindow: '8K',
    requiredTier: 'free',
  },
  standard: {
    tier: 'standard',
    label: t('avatar.templates.standardCoreLabel'),
    description: t('avatar.templates.standardCoreDesc'),
    icon: '\uD83E\uDDE0',
    maxActionsPerDay: 100,
    maxKnowledgeDocs: 30,
    maxTools: 10,
    multimodal: ['text', 'image'],
    contextWindow: '32K',
    requiredTier: 'pro',
  },
  flagship: {
    tier: 'flagship',
    label: t('avatar.templates.flagshipCoreLabel'),
    description: t('avatar.templates.flagshipCoreDesc'),
    icon: '\uD83D\uDE80',
    maxActionsPerDay: null,
    maxKnowledgeDocs: 200,
    maxTools: null,
    multimodal: ['text', 'image', 'voice', 'video'],
    contextWindow: '128K+',
    requiredTier: 'turbo',
  },
}

/** 所有内核等级（有序） */
export const CORE_TIERS: AvatarCoreTier[] = ['lite', 'standard', 'flagship']

// ==================== 会员等级权重 ====================

export const TIER_LEVELS: Record<TierType, number> = {
  free: 0,
  pro: 1,
  turbo: 2,
  ultra: 3,
}

/** 获取解锁某内核所需的最低会员名称 */
export function getRequiredTierLabel(tier: AvatarCoreTier): string {
  const map: Record<TierType, string> = {
    free: 'Free',
    pro: 'Pro',
    turbo: 'Turbo',
    ultra: 'Ultra',
  }
  return map[CORE_TIER_SPECS[tier].requiredTier]
}
