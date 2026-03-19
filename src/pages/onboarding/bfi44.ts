/**
 * BFI-44 大五人格量表
 *
 * John, O. P., Donahue, E. M., & Kentle, R. L. (1991).
 * The Big Five Inventory—Versions 4a and 54.
 * Berkeley, CA: University of California, Berkeley.
 *
 * 44 题，5 点 Likert 量表，16 道反向计分题。
 * 中文翻译参考 MedSci.cn 发布版本。
 */

import i18n from '@/i18n'
import type { BigFiveScores } from './types'

// ==================== 类型 ====================

export interface BfiItem {
  id: number                    // 1-44，原始编号
  text: string                  // 中文描述（完成引导语的补语）
  dimension: keyof BigFiveScores
  reversed: boolean             // 是否反向计分
}

export type LikertValue = 1 | 2 | 3 | 4 | 5

export function getLikertOptions(): { value: LikertValue; label: string; short: string }[] {
  const { t } = i18n.global
  return [
    { value: 1, label: t('onboarding.bfi.likert1'), short: '1' },
    { value: 2, label: t('onboarding.bfi.likert2'), short: '2' },
    { value: 3, label: t('onboarding.bfi.likert3'), short: '3' },
    { value: 4, label: t('onboarding.bfi.likert4'), short: '4' },
    { value: 5, label: t('onboarding.bfi.likert5'), short: '5' },
  ]
}

/** @deprecated Use getLikertOptions() for i18n support */
export const LIKERT_OPTIONS = getLikertOptions()

/** BFI-44 引导语 */
export const BFI_STEM = '我认为自己是一个...'

export function getBfiStem(): string {
  const { t } = i18n.global
  return t('onboarding.bfi.stem')
}

// ==================== 44 道题目 ====================
//
// 原始编号 1-44，跨维度穿插排列（BFI-44 标准顺序）
// E=外向性  A=宜人性  C=尽责性  N=神经质  O=开放性
// R=反向计分

export const BFI_44_ITEMS: BfiItem[] = [
  { id: 1,  text: '健谈的',                           dimension: 'extraversion',       reversed: false },
  { id: 2,  text: '倾向于挑别人毛病的',               dimension: 'agreeableness',      reversed: true },
  { id: 3,  text: '工作做得很彻底的',                 dimension: 'conscientiousness',  reversed: false },
  { id: 4,  text: '情绪低落、忧郁的',                 dimension: 'neuroticism',        reversed: false },
  { id: 5,  text: '有独创性、能想出新点子的',         dimension: 'openness',           reversed: false },
  { id: 6,  text: '沉默寡言的',                       dimension: 'extraversion',       reversed: true },
  { id: 7,  text: '乐于助人、对人无私的',             dimension: 'agreeableness',      reversed: false },
  { id: 8,  text: '有时可能比较粗心的',               dimension: 'conscientiousness',  reversed: true },
  { id: 9,  text: '放松的、能很好地应对压力的',       dimension: 'neuroticism',        reversed: true },
  { id: 10, text: '对很多不同的事物感到好奇的',       dimension: 'openness',           reversed: false },
  { id: 11, text: '精力充沛的',                       dimension: 'extraversion',       reversed: false },
  { id: 12, text: '容易与别人发生争吵的',             dimension: 'agreeableness',      reversed: true },
  { id: 13, text: '可靠、值得信赖的',                 dimension: 'conscientiousness',  reversed: false },
  { id: 14, text: '可能会感到紧张的',                 dimension: 'neuroticism',        reversed: false },
  { id: 15, text: '善于思考、有深度的',               dimension: 'openness',           reversed: false },
  { id: 16, text: '充满热情的',                       dimension: 'extraversion',       reversed: false },
  { id: 17, text: '宽容大度的',                       dimension: 'agreeableness',      reversed: false },
  { id: 18, text: '做事缺乏条理的',                   dimension: 'conscientiousness',  reversed: true },
  { id: 19, text: '担忧很多事情的',                   dimension: 'neuroticism',        reversed: false },
  { id: 20, text: '想象力丰富的',                     dimension: 'openness',           reversed: false },
  { id: 21, text: '比较安静的',                       dimension: 'extraversion',       reversed: true },
  { id: 22, text: '通常信任他人的',                   dimension: 'agreeableness',      reversed: false },
  { id: 23, text: '做事比较懒散的',                   dimension: 'conscientiousness',  reversed: true },
  { id: 24, text: '情绪稳定、不容易沮丧的',           dimension: 'neuroticism',        reversed: true },
  { id: 25, text: '富有创造力的',                     dimension: 'openness',           reversed: false },
  { id: 26, text: '性格果断的',                       dimension: 'extraversion',       reversed: false },
  { id: 27, text: '有时冷淡、不太热情的',             dimension: 'agreeableness',      reversed: true },
  { id: 28, text: '坚持不懈直到任务完成的',           dimension: 'conscientiousness',  reversed: false },
  { id: 29, text: '情绪容易波动的',                   dimension: 'neuroticism',        reversed: false },
  { id: 30, text: '重视艺术和审美体验的',             dimension: 'openness',           reversed: false },
  { id: 31, text: '有时害羞、拘束的',                 dimension: 'extraversion',       reversed: true },
  { id: 32, text: '体贴、对几乎所有人都很友善的',     dimension: 'agreeableness',      reversed: false },
  { id: 33, text: '做事有效率的',                     dimension: 'conscientiousness',  reversed: false },
  { id: 34, text: '在紧张情境中保持镇定的',           dimension: 'neuroticism',        reversed: true },
  { id: 35, text: '喜欢有固定规律的工作的',           dimension: 'openness',           reversed: true },
  { id: 36, text: '性格外向、善于社交的',             dimension: 'extraversion',       reversed: false },
  { id: 37, text: '有时对别人不太礼貌的',             dimension: 'agreeableness',      reversed: true },
  { id: 38, text: '善于制定计划并执行的',             dimension: 'conscientiousness',  reversed: false },
  { id: 39, text: '容易感到紧张的',                   dimension: 'neuroticism',        reversed: false },
  { id: 40, text: '喜欢反思、玩味各种想法的',         dimension: 'openness',           reversed: false },
  { id: 41, text: '对艺术兴趣不大的',                 dimension: 'openness',           reversed: true },
  { id: 42, text: '喜欢与他人合作的',                 dimension: 'agreeableness',      reversed: false },
  { id: 43, text: '容易分心的',                       dimension: 'conscientiousness',  reversed: true },
  { id: 44, text: '在艺术、音乐或文学方面有造诣的',   dimension: 'openness',           reversed: false },
]

/** 每页题目数量 */
export const ITEMS_PER_PAGE = 9

/** 按页拆分题目（保持原始顺序） */
export function getPages(items?: BfiItem[]): BfiItem[][] {
  const source = items ?? BFI_44_ITEMS
  const pages: BfiItem[][] = []
  for (let i = 0; i < source.length; i += ITEMS_PER_PAGE) {
    pages.push(source.slice(i, i + ITEMS_PER_PAGE))
  }
  return pages
}

// ==================== 计分 ====================
//
// BFI-44 标准计分流程（John et al., 1991）：
//
// 1. 反向计分：R 题 → reversed = 6 - original
// 2. 维度分 = 该维度所有题目的均值（范围 1.0 ~ 5.0）
// 3. POMP 映射至 0-100：score = 100 × (mean - 1) / 4
//
// 维度题目分配（含反向）：
// E 外向性 (8题): 1, 6R, 11, 16, 21R, 26, 31R, 36
// A 宜人性 (9题): 2R, 7, 12R, 17, 22, 27R, 32, 37R, 42
// C 尽责性 (9题): 3, 8R, 13, 18R, 23R, 28, 33, 38, 43R
// N 神经质 (8题): 4, 9R, 14, 19, 24R, 29, 34R, 39
// O 开放性 (10题): 5, 10, 15, 20, 25, 30, 35R, 40, 41R, 44

/** 计算 BFI-44 大五人格分数（POMP 标准化至 0-100） */
export function calculateBfi44(responses: Record<number, LikertValue>): BigFiveScores {
  const dimensions: (keyof BigFiveScores)[] = [
    'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
  ]

  const dimValues: Record<keyof BigFiveScores, number[]> = {
    openness: [],
    conscientiousness: [],
    extraversion: [],
    agreeableness: [],
    neuroticism: [],
  }

  for (const item of BFI_44_ITEMS) {
    const raw = responses[item.id]
    if (raw == null) continue

    const value = item.reversed ? (6 - raw) : raw
    dimValues[item.dimension].push(value)
  }

  const scores = {} as BigFiveScores
  for (const dim of dimensions) {
    const values = dimValues[dim]
    if (values.length === 0) {
      scores[dim] = 50 // 无数据 → 理论中点
      continue
    }
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    scores[dim] = Math.round(100 * (mean - 1) / 4)
  }

  return scores
}
