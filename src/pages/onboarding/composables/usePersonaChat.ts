/**
 * AI 人格画像对话 Composable
 *
 * 管理 10 题大五人格测评的 AI 对话流。
 * AI 逐题提问（带选项）→ 用户选择/自由文本 → AI 评估+回应 → 下一题 → 生成画像。
 *
 * 自由文本回答经 AI 评估：
 * - accepted → 使用 AI 推断分数，推进下一题
 * - retry → 展示引导提示，复显选项，用户重新作答（最多 2 次）
 */

import { ref, computed } from 'vue'
import i18n from '@/i18n'
import { PERSONA_QUESTIONS, calculateBigFive, getDominantTraits } from '../types'
import type {
  PersonaChatMessage,
  PersonaQuestionOption,
  PersonaProfile,
  BigFiveScores,
  PersonaReactResponse,
} from '../types'
import { onboardingPageApi } from '../api'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function usePersonaChat(userName: string) {
  const messages = ref<PersonaChatMessage[]>([])
  const currentQuestionIndex = ref(-1)
  const selectedOptions = ref<PersonaQuestionOption[]>([])
  const isAITyping = ref(false)
  const isCompleted = ref(false)
  const personaProfile = ref<PersonaProfile | null>(null)

  /** 每题当前已尝试次数（key = questionIndex） */
  const attemptCounts = ref<Record<number, number>>({})

  const totalQuestions = PERSONA_QUESTIONS.length
  const progress = computed(() =>
    currentQuestionIndex.value < 0
      ? 0
      : currentQuestionIndex.value / totalQuestions,
  )

  let msgCounter = 0
  function addMessage(msg: Omit<PersonaChatMessage, 'id'>): string {
    const id = `persona-msg-${++msgCounter}`
    messages.value.push({ ...msg, id })
    return id
  }

  /** 构建 previousContext 用于 AI 上下文 */
  function buildPreviousContext(): string | undefined {
    const ctx = selectedOptions.value
      .map((o, i) => `Q: ${PERSONA_QUESTIONS[i].question} A: ${o.text}`)
      .join('\n')
    return ctx || undefined
  }

  const { t } = i18n.global

  /** 开始对话 */
  async function start() {
    addMessage({
      role: 'ai',
      content: t('onboarding.chat.greeting', { name: userName }),
    })

    await delay(1000)
    currentQuestionIndex.value = 0
    attemptCounts.value[0] = 1
    showCurrentQuestion()
  }

  function showCurrentQuestion() {
    const q = PERSONA_QUESTIONS[currentQuestionIndex.value]
    if (!q) return

    addMessage({
      role: 'ai',
      content: q.question,
      questionId: q.id,
      options: q.options,
    })
  }

  /** 推进到下一题或完成评估 */
  async function advanceToNext() {
    currentQuestionIndex.value++

    if (currentQuestionIndex.value >= totalQuestions) {
      await finishAssessment()
    } else {
      attemptCounts.value[currentQuestionIndex.value] = 1
      await delay(600)
      showCurrentQuestion()
    }
  }

  /** 记录选项分数 */
  function recordAnswer(option: PersonaQuestionOption) {
    selectedOptions.value.push(option)
  }

  /** 用户选择预设选项 — 始终有效，直接计分 */
  async function selectOption(option: PersonaQuestionOption) {
    addMessage({ role: 'user', content: option.text })
    recordAnswer(option)

    // 获取 AI 温暖回应（选项始终 accepted，不需评估）
    isAITyping.value = true
    try {
      const q = PERSONA_QUESTIONS[currentQuestionIndex.value]
      const result = await onboardingPageApi.getPersonaReaction({
        questionIndex: currentQuestionIndex.value,
        questionText: q.question,
        dimension: q.dimension,
        userAnswer: option.text,
        answerType: 'option',
        attempt: 1,
        userName,
        previousContext: buildPreviousContext(),
      })
      isAITyping.value = false
      addMessage({ role: 'ai', content: result.reaction })
    } catch {
      isAITyping.value = false
      addMessage({ role: 'ai', content: getFallbackReaction() })
    }

    await advanceToNext()
  }

  /** 用户自由文本作答 — 需 AI 评估质量 */
  async function sendFreeText(text: string) {
    if (!text.trim() || isAITyping.value || isCompleted.value) return
    if (currentQuestionIndex.value < 0) return

    const trimmed = text.trim()
    addMessage({ role: 'user', content: trimmed })

    const qIdx = currentQuestionIndex.value
    const q = PERSONA_QUESTIONS[qIdx]
    const attempt = attemptCounts.value[qIdx] ?? 1

    isAITyping.value = true

    let result: PersonaReactResponse
    try {
      result = await onboardingPageApi.getPersonaReaction({
        questionIndex: qIdx,
        questionText: q.question,
        dimension: q.dimension,
        userAnswer: trimmed,
        answerType: 'freetext',
        attempt,
        userName,
        previousContext: buildPreviousContext(),
      })
    } catch {
      // 网络失败 → 降级为 accepted + 中性分数
      result = { reaction: getFallbackReaction(), status: 'accepted' }
    }

    isAITyping.value = false

    if (result.status === 'accepted') {
      // 使用 AI 推断分数（若有），否则中性
      recordAnswer({
        id: `free-${qIdx}-${attempt}`,
        text: trimmed,
        emoji: '',
        scores: result.inferredScores ?? {},
      })
      addMessage({ role: 'ai', content: result.reaction })
      await advanceToNext()
    } else {
      // retry
      if (attempt >= 2) {
        // 第二次仍然 retry → 强制接受，中性分数
        recordAnswer({
          id: `free-${qIdx}-forced`,
          text: trimmed,
          emoji: '',
          scores: {},
        })
        addMessage({ role: 'ai', content: result.reaction || t('onboarding.chat.forcedAccept') })
        await advanceToNext()
      } else {
        // 第一次 retry → 展示引导提示 + 复显选项
        attemptCounts.value[qIdx] = 2
        addMessage({
          role: 'ai',
          content: result.retryHint || t('onboarding.chat.retryHint'),
          questionId: q.id,
          options: q.options,
        })
        // 不推进，等用户重新回答
      }
    }
  }

  /** 降级静态回应 */
  function getFallbackReaction(): string {
    const fallbacks = [
      t('onboarding.chat.fallback1'),
      t('onboarding.chat.fallback2'),
      t('onboarding.chat.fallback3'),
      t('onboarding.chat.fallback4'),
      t('onboarding.chat.fallback5'),
      t('onboarding.chat.fallback6'),
      t('onboarding.chat.fallback7'),
      t('onboarding.chat.fallback8'),
      t('onboarding.chat.fallback9'),
      t('onboarding.chat.fallback10'),
    ]
    return fallbacks[currentQuestionIndex.value % fallbacks.length]
  }

  async function finishAssessment() {
    await delay(500)
    isAITyping.value = true

    const bigFive = calculateBigFive(selectedOptions.value)
    const dominantTraits = getDominantTraits(bigFive)
    const summary = buildSummary(bigFive)

    personaProfile.value = { bigFive, dominantTraits, summary }

    await delay(800)
    isAITyping.value = false

    addMessage({
      role: 'ai',
      content: t('onboarding.chat.summaryIntro'),
    })

    isCompleted.value = true
  }

  function buildSummary(scores: BigFiveScores): string {
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
    messages,
    currentQuestionIndex,
    totalQuestions,
    progress,
    isAITyping,
    isCompleted,
    personaProfile,
    start,
    selectOption,
    sendFreeText,
  }
}
