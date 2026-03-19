/**
 * 情绪追踪 composable
 * 对接后端情绪日历 API，管理日历数据和摘要
 */
import { ref, computed } from 'vue'
import i18n from '@/i18n'
import type { EmotionType, EmotionDay, EmotionSummary } from '../types'
import { emotionCalendarApi } from '../api/mock'

const { t } = i18n.global

function getEmotionLabel(type: EmotionType): string {
  return t(`playgroundChat.composables.emotion.${type}`)
}

const EMOTION_META_COLORS: Record<EmotionType, string> = {
  happy: '#10b981',
  sad: '#6366f1',
  angry: '#ef4444',
  anxious: '#f59e0b',
  calm: '#06b6d4',
  excited: '#ec4899',
  tired: '#8b5cf6',
  neutral: '#94a3b8',
}

const EMOTION_META: Record<EmotionType, { label: string; color: string }> = Object.fromEntries(
  (Object.keys(EMOTION_META_COLORS) as EmotionType[]).map(key => [
    key,
    { label: getEmotionLabel(key), color: EMOTION_META_COLORS[key] },
  ]),
) as Record<EmotionType, { label: string; color: string }>

function getDefaultSummary(): EmotionSummary {
  return {
    mainMood: t('playgroundChat.composables.emotion.calm'), mainMoodEmoji: '😌',
    topEmotion: '—', topEmotionEmoji: '—',
    streak: 0, streakEmoji: '🔥',
    avgScore: 0, avgLabel: '—',
  }
}

// 模块级状态（所有实例共享）
const selectedEmotion = ref<EmotionType>('neutral')
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth()) // 0-indexed
const isLoading = ref(false)
const emotionDays = ref<EmotionDay[]>([])
const summary = ref<EmotionSummary>(getDefaultSummary())

export function useEmotion() {

  /** 从后端加载当月情绪日历 */
  async function loadCalendar() {
    isLoading.value = true
    try {
      // 后端 month 参数是 1-12，前端 currentMonth 是 0-indexed
      const result = await emotionCalendarApi.getCalendar(
        currentYear.value,
        currentMonth.value + 1,
      )
      emotionDays.value = result.days
      summary.value = result.summary
    } catch (err) {
      console.error('[useEmotion] 加载情绪日历失败:', err)
      // 失败时生成空日历骨架
      generateEmptyDays()
      summary.value = getDefaultSummary()
    } finally {
      isLoading.value = false
    }
  }

  /** 生成空日历骨架（API 失败时的降级） */
  function generateEmptyDays() {
    const year = currentYear.value
    const month = currentMonth.value
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: EmotionDay[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: dateStr, day: d })
    }
    emotionDays.value = days
  }

  /** 兼容旧调用：generateCalendarDays 改为调用 loadCalendar */
  async function generateCalendarDays() {
    await loadCalendar()
  }

  /** 当月第一天是星期几（0=周日） */
  const firstDayOfWeek = computed(() => {
    return new Date(currentYear.value, currentMonth.value, 1).getDay()
  })

  /** 月份标签 */
  const monthLabel = computed(() => {
    const locale = i18n.global.locale.value || 'zh-CN'
    const date = new Date(currentYear.value, currentMonth.value)
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'long' })
  })

  /** 切换月份 */
  function prevMonth() {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
    loadCalendar()
  }

  function nextMonth() {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
    loadCalendar()
  }

  /** 获取情绪元信息 */
  function getEmotionMeta(type: EmotionType) {
    return EMOTION_META[type] || EMOTION_META.neutral
  }

  return {
    selectedEmotion,
    emotionDays,
    isLoading,
    firstDayOfWeek,
    monthLabel,
    summary,
    currentYear,
    currentMonth,
    generateCalendarDays,
    loadCalendar,
    prevMonth,
    nextMonth,
    getEmotionMeta,
    EMOTION_META,
  }
}
