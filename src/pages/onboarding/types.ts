/**
 * Onboarding 类型定义
 *
 * 大五人格测评 + 用户画像构建 + AI 头像生成
 */

import i18n from '@/i18n'

// ==================== 基础类型 ====================

/** 大五人格维度分数（0-100） */
export interface BigFiveScores {
  openness: number           // 开放性
  conscientiousness: number  // 尽责性
  extraversion: number       // 外向性
  agreeableness: number      // 宜人性
  neuroticism: number        // 神经质性
}

/** Onboarding 步骤 */
export type OnboardingStep = 'welcome' | 'persona' | 'avatar' | 'launch'

/** 使用场景 */
export type UseCase = 'work' | 'study' | 'creation' | 'life' | 'research'

/** 职业身份 */
export type Occupation =
  | 'student' | 'engineer' | 'designer' | 'product_manager'
  | 'researcher' | 'writer' | 'entrepreneur' | 'freelancer'
  | 'teacher' | 'other'

// ==================== 问题与对话 ====================

/** 人格问题选项 */
export interface PersonaQuestionOption {
  id: string
  text: string
  emoji: string
  scores: Partial<BigFiveScores>
}

/** 人格问题 */
export interface PersonaQuestion {
  id: string
  dimension: keyof BigFiveScores
  question: string
  options: PersonaQuestionOption[]
}

/** AI 对话消息 */
export interface PersonaChatMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  questionId?: string
  options?: PersonaQuestionOption[]
}

// ==================== 数据模型 ====================

/** 用户画像结果 */
export interface PersonaProfile {
  bigFive: BigFiveScores
  dominantTraits: string[]
  summary: string
}

/** Welcome 步骤数据 */
export interface WelcomeData {
  nickname: string
  useCases: UseCase[]
  occupation: Occupation
}

// ==================== API 请求/响应 ====================

/** 提交完整 Onboarding 数据 */
export interface OnboardingSubmitRequest {
  userName: string
  occupation: string
  useCases: string[]
  interests: string
  communicationStyle: string
  bigFive: BigFiveScores | null
  dominantTraits: string[]
  personaSummary: string
  avatarUrl: string
}

/** Persona 反应请求 */
export interface PersonaReactRequest {
  questionIndex: number
  questionText: string
  dimension: string
  userAnswer: string
  answerType: 'option' | 'freetext'
  attempt: number
  userName: string
  previousContext?: string
}

/** Persona 反应响应（后端 AI 评估 + 回应） */
export interface PersonaReactResponse {
  reaction: string
  status: 'accepted' | 'retry'
  inferredScores?: Partial<BigFiveScores>
  retryHint?: string
}

// ==================== 配置数据 ====================

/** Lucide 图标键名（映射在组件中解析） */
export const USE_CASE_OPTIONS: { value: UseCase; label: string; icon: string }[] = [
  { value: 'work', label: '工作效率', icon: 'briefcase' },
  { value: 'study', label: '学习成长', icon: 'book-open' },
  { value: 'creation', label: '内容创作', icon: 'sparkles' },
  { value: 'life', label: '日常生活', icon: 'coffee' },
  { value: 'research', label: '学术研究', icon: 'flask-conical' },
]

export const OCCUPATION_OPTIONS: { value: Occupation; label: string; icon: string }[] = [
  { value: 'student', label: '学生', icon: 'graduation-cap' },
  { value: 'engineer', label: '工程师', icon: 'code-2' },
  { value: 'designer', label: '设计师', icon: 'palette' },
  { value: 'product_manager', label: '产品经理', icon: 'layout-dashboard' },
  { value: 'researcher', label: '研究员', icon: 'microscope' },
  { value: 'writer', label: '写作者', icon: 'pen-line' },
  { value: 'entrepreneur', label: '创业者', icon: 'rocket' },
  { value: 'freelancer', label: '自由职业', icon: 'laptop' },
  { value: 'teacher', label: '教育者', icon: 'book-open' },
  { value: 'other', label: '其他', icon: 'user' },
]


// ==================== 大五人格问题集 ====================
//
// 设计原则（参照 BFI-10 / Rammstedt & John 2007）：
// - 每维度 2 题，共 10 题
// - 对称计分：高特质 +15，低特质 -15，中性 0
// - 每选项只测 1 个维度（消除交叉污染）
// - 基准 50 分，理论得分范围 [20, 80]

export const PERSONA_QUESTIONS: PersonaQuestion[] = [
  // ── 外向性 (Extraversion) ──
  {
    id: 'e1',
    dimension: 'extraversion',
    question: '周末到了，你更倾向于？',
    options: [
      { id: 'e1a', text: '约上朋友一起出去玩', emoji: '🎉', scores: { extraversion: 15 } },
      { id: 'e1b', text: '待在家享受独处时光', emoji: '🏠', scores: { extraversion: -15 } },
      { id: 'e1c', text: '看心情，两种都不错', emoji: '🔄', scores: { extraversion: 0 } },
    ],
  },
  {
    id: 'e2',
    dimension: 'extraversion',
    question: '加入一个新团队时，你通常会？',
    options: [
      { id: 'e2a', text: '主动认识大家，打开话题', emoji: '👋', scores: { extraversion: 15 } },
      { id: 'e2b', text: '先观察，慢慢找机会融入', emoji: '👀', scores: { extraversion: -5 } },
      { id: 'e2c', text: '安静做好自己的事，等别人来找我', emoji: '🎧', scores: { extraversion: -15 } },
    ],
  },
  // ── 开放性 (Openness) ──
  {
    id: 'o1',
    dimension: 'openness',
    question: '面对一个完全陌生的领域，你的第一反应是？',
    options: [
      { id: 'o1a', text: '兴奋——未知就是可能性', emoji: '🚀', scores: { openness: 15 } },
      { id: 'o1b', text: '先了解一下，再决定要不要深入', emoji: '📋', scores: { openness: 0 } },
      { id: 'o1c', text: '更喜欢在熟悉的领域深耕', emoji: '🌱', scores: { openness: -15 } },
    ],
  },
  {
    id: 'o2',
    dimension: 'openness',
    question: '如果有一整天完全自由的时间，你最可能？',
    options: [
      { id: 'o2a', text: '尝试一些从没做过的新事物', emoji: '✨', scores: { openness: 15 } },
      { id: 'o2b', text: '做自己一直想做但没空做的事', emoji: '📝', scores: { openness: 5 } },
      { id: 'o2c', text: '按最舒服的方式放松休息', emoji: '☕', scores: { openness: -15 } },
    ],
  },
  // ── 尽责性 (Conscientiousness) ──
  {
    id: 'c1',
    dimension: 'conscientiousness',
    question: '你的工作或学习空间通常是什么样？',
    options: [
      { id: 'c1a', text: '整洁有序，每样东西都有固定位置', emoji: '📱', scores: { conscientiousness: 15 } },
      { id: 'c1b', text: '有点乱但我知道什么在哪', emoji: '🔍', scores: { conscientiousness: 0 } },
      { id: 'c1c', text: '比较随性，整理不是我的优先级', emoji: '🎨', scores: { conscientiousness: -15 } },
    ],
  },
  {
    id: 'c2',
    dimension: 'conscientiousness',
    question: '面对一个截止日期还很远的重要任务，你会？',
    options: [
      { id: 'c2a', text: '尽早规划，按步骤推进', emoji: '📆', scores: { conscientiousness: 15 } },
      { id: 'c2b', text: '有个大概计划，但执行比较灵活', emoji: '🔄', scores: { conscientiousness: 0 } },
      { id: 'c2c', text: '等快到了再集中精力搞定', emoji: '🔥', scores: { conscientiousness: -15 } },
    ],
  },
  // ── 宜人性 (Agreeableness) ──
  {
    id: 'a1',
    dimension: 'agreeableness',
    question: '朋友之间发生了争执，你会？',
    options: [
      { id: 'a1a', text: '主动调和，帮大家找到共识', emoji: '🤝', scores: { agreeableness: 15 } },
      { id: 'a1b', text: '客观分析，直说自己的看法', emoji: '💡', scores: { agreeableness: -15 } },
      { id: 'a1c', text: '不太想介入，给他们空间自己解决', emoji: '🌙', scores: { agreeableness: -5 } },
    ],
  },
  {
    id: 'a2',
    dimension: 'agreeableness',
    question: '在合作中遇到意见分歧，你更倾向于？',
    options: [
      { id: 'a2a', text: '尊重对方，寻求双方都能接受的方案', emoji: '🤲', scores: { agreeableness: 15 } },
      { id: 'a2b', text: '用事实和逻辑说服对方', emoji: '🧩', scores: { agreeableness: -15 } },
      { id: 'a2c', text: '看情况，重要的事坚持，小事让步', emoji: '⚖️', scores: { agreeableness: 0 } },
    ],
  },
  // ── 神经质性 (Neuroticism) ──
  {
    id: 'n1',
    dimension: 'neuroticism',
    question: '收到一条模糊的消息「明天聊聊」，你会？',
    options: [
      { id: 'n1a', text: '有点紧张，忍不住反复琢磨', emoji: '😰', scores: { neuroticism: 15 } },
      { id: 'n1b', text: '好奇是什么事，但不会多想', emoji: '😊', scores: { neuroticism: -15 } },
      { id: 'n1c', text: '无所谓，到时候再说', emoji: '😌', scores: { neuroticism: -10 } },
    ],
  },
  {
    id: 'n2',
    dimension: 'neuroticism',
    question: '当事情没有按计划进行时，你通常？',
    options: [
      { id: 'n2a', text: '会反复想为什么出了问题，比较在意', emoji: '🌀', scores: { neuroticism: 15 } },
      { id: 'n2b', text: '不太开心，但很快能调整过来', emoji: '💪', scores: { neuroticism: -5 } },
      { id: 'n2c', text: '不太在意，计划本来就是用来变的', emoji: '🍃', scores: { neuroticism: -15 } },
    ],
  },
]

// ==================== 计算工具 ====================
//
// 计分方法：POMP (Percentage of Maximum Possible)
// 参照 BFI-10 / TIPI 标准做法：维度内取均值 → 线性映射至 0-100
//
// 步骤：
// 1. 每个 raw score（±15）转为有序量表 [1, 3]：ordinal = clamp(raw/15 + 2, 1, 3)
// 2. 同维度取均值 mean_ordinal
// 3. POMP = 100 * (mean_ordinal - 1) / (3 - 1) → [0, 100]
//
// 优势（相比旧方案 base50 + 线性累加）：
// - 得分范围 [0, 100]，语义清晰（0=最低 50=中性 100=最高）
// - 维度内均值化：自由文本多贡献一个分数不会导致权重偏大
// - 与 BFI-10/TIPI 的均值+POMP 方法论一致
// - 无需人群常模（POMP 是 norm-free 标准化）

/** 将 raw score（±15 尺度）转为有序量表值 [1, 3] */
function rawToOrdinal(raw: number): number {
  return Math.max(1, Math.min(3, raw / 15 + 2))
}

/** 根据选项计算大五人格分数（POMP 方法） */
export function calculateBigFive(selectedOptions: PersonaQuestionOption[]): BigFiveScores {
  const DIMENSIONS: (keyof BigFiveScores)[] = [
    'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
  ]

  // 收集每个维度的有序量表值
  const dimOrdinals: Record<keyof BigFiveScores, number[]> = {
    openness: [],
    conscientiousness: [],
    extraversion: [],
    agreeableness: [],
    neuroticism: [],
  }

  for (const option of selectedOptions) {
    for (const [dim, val] of Object.entries(option.scores)) {
      if (dim in dimOrdinals) {
        dimOrdinals[dim as keyof BigFiveScores].push(rawToOrdinal(val as number))
      }
    }
  }

  // 计算 POMP 分数
  const scores = {} as BigFiveScores
  for (const dim of DIMENSIONS) {
    const ordinals = dimOrdinals[dim]
    if (ordinals.length === 0) {
      scores[dim] = 50 // 无数据，使用理论中点
      continue
    }
    const mean = ordinals.reduce((a, b) => a + b, 0) / ordinals.length
    scores[dim] = Math.round(100 * (mean - 1) / 2)
  }

  return scores
}

/** 从大五分数推导突出特质标签 */
export function getDominantTraits(scores: BigFiveScores): string[] {
  const { t } = i18n.global
  const traitMap: Record<keyof BigFiveScores, [string, string]> = {
    openness: [t('onboarding.traits.creative'), t('onboarding.traits.practical')],
    conscientiousness: [t('onboarding.traits.organized'), t('onboarding.traits.flexible')],
    extraversion: [t('onboarding.traits.social'), t('onboarding.traits.deepThinker')],
    agreeableness: [t('onboarding.traits.empathetic'), t('onboarding.traits.independent')],
    neuroticism: [t('onboarding.traits.sensitive'), t('onboarding.traits.calm')],
  }

  // POMP 分数下的阈值：≥67 为高，≤33 为低（将 0-100 三等分）
  const HIGH_THRESHOLD = 67
  const LOW_THRESHOLD = 33

  const traits: string[] = []
  for (const [dim, [high, low]] of Object.entries(traitMap)) {
    const score = scores[dim as keyof BigFiveScores]
    if (score >= HIGH_THRESHOLD) traits.push(high)
    else if (score <= LOW_THRESHOLD) traits.push(low)
  }

  // 若所有维度都在中间区域，取最高和最低两个维度的标签
  if (traits.length === 0) {
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a)
    traits.push(traitMap[sorted[0][0] as keyof BigFiveScores][0])
    traits.push(traitMap[sorted[sorted.length - 1][0] as keyof BigFiveScores][1])
  }

  return traits.slice(0, 4)
}
