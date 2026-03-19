/**
 * BFI-44 人格评估 Composable
 *
 * 管理 BFI-44 量表的分页展示、作答收集、进度追踪和计分。
 * 替代原 usePersonaChat（聊天式 10 题）为标准心理学量表形式。
 *
 * 纯客户端计分，无需 AI 逐题评估。
 */

import { ref, computed } from 'vue'
import i18n from '@/i18n'
import { BFI_44_ITEMS, getPages, calculateBfi44 } from '../bfi44'
import type { LikertValue } from '../bfi44'
import { getDominantTraits } from '../types'
import type { BigFiveScores, PersonaProfile } from '../types'

export function usePersonaAssessment() {
  // ── 状态 ──
  const responses = ref<Record<number, LikertValue>>({})
  const currentPage = ref(0)
  const isCompleted = ref(false)
  const personaProfile = ref<PersonaProfile | null>(null)

  // ── 分页数据 ──
  const pages = computed(() => getPages(BFI_44_ITEMS))
  const totalItems = computed(() => BFI_44_ITEMS.length)
  const totalPages = computed(() => pages.value.length)

  // ── 计算属性 ──
  const answeredCount = computed(() => Object.keys(responses.value).length)
  const progress = computed(() => answeredCount.value / totalItems.value)

  const currentPageItems = computed(() => pages.value[currentPage.value] || [])

  const currentPageAnswered = computed(() =>
    currentPageItems.value.every(item => item.id in responses.value),
  )

  const isLastPage = computed(() => currentPage.value >= totalPages.value - 1)
  const isFirstPage = computed(() => currentPage.value === 0)

  // ── 操作 ──

  function setResponse(itemId: number, value: LikertValue) {
    // 触发响应式更新
    responses.value = { ...responses.value, [itemId]: value }
  }

  function nextPage() {
    if (!currentPageAnswered.value) return
    if (isLastPage.value) {
      finish()
    } else {
      currentPage.value++
    }
  }

  function prevPage() {
    if (currentPage.value > 0) {
      currentPage.value--
    }
  }

  function finish() {
    const bigFive = calculateBfi44(responses.value)
    const dominantTraits = getDominantTraits(bigFive)
    const summary = buildSummary(bigFive)

    personaProfile.value = { bigFive, dominantTraits, summary }
    isCompleted.value = true
  }

  // ── 摘要生成 ──

  function buildSummary(scores: BigFiveScores): string {
    const { t } = i18n.global
    const parts: string[] = []

    if (scores.openness >= 65) parts.push(t('onboarding.assessment.curious'))
    else if (scores.openness <= 35) parts.push(t('onboarding.assessment.pragmatic'))

    if (scores.extraversion >= 65) parts.push(t('onboarding.assessment.socialExpressive'))
    else if (scores.extraversion <= 35) parts.push(t('onboarding.assessment.enjoysSolitude'))

    if (scores.agreeableness >= 65) parts.push(t('onboarding.assessment.warmEmpathetic'))
    else if (scores.agreeableness <= 35) parts.push(t('onboarding.assessment.independentMinded'))

    if (scores.conscientiousness >= 65) parts.push(t('onboarding.assessment.organizedExcellent'))
    else if (scores.conscientiousness <= 35) parts.push(t('onboarding.assessment.flexibleUnconventional'))

    if (scores.neuroticism <= 35) parts.push(t('onboarding.assessment.emotionallyStable'))
    else if (scores.neuroticism >= 65) parts.push(t('onboarding.assessment.sensitiveSensible'))

    if (parts.length === 0) parts.push(t('onboarding.assessment.balanced'))

    return `${t('onboarding.assessment.summaryPrefix')}${parts.join('、')}${t('onboarding.assessment.summarySuffix')}`
  }

  return {
    // 状态
    responses,
    currentPage,
    isCompleted,
    personaProfile,

    // 分页数据
    pages,
    totalItems,
    totalPages,
    currentPageItems,

    // 计算属性
    answeredCount,
    progress,
    currentPageAnswered,
    isLastPage,
    isFirstPage,

    // 操作
    setResponse,
    nextPage,
    prevPage,
  }
}
