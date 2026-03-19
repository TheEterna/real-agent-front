/**
 * Soul 灵魂状态 composable
 * 管理 AI 的环境情绪、内心世界、关系里程碑
 * 支持从后端 Soul API 加载初始状态
 *
 * AI 动态问候：
 * - loadStreamingGreeting() 流式加载 AI 生成的个性化问候
 * - 首次调用：LLM 流式生成（逐字浮现）
 * - 后续调用：缓存直返（瞬间显示）
 * - isGreetingStreaming 标识流式进行中（用于 WelcomeScreen 区分动画策略）
 */
import { ref, readonly, computed } from 'vue'
import i18n from '@/i18n'
import type { MoodType } from '../types'
import { soulApi } from '../api/mock'

const { t } = i18n.global

// 模块级共享状态，多组件调用 useSoul() 共享同一份数据
const mood = ref<MoodType>('calm')
const feeling = ref(t('playgroundChat.composables.soul.defaultFeeling'))
const isThinking = ref(false)
const milestone = ref(t('playgroundChat.composables.soul.defaultMilestone'))
const memories = ref<string[]>([])
const daysSinceFirst = ref(0)
const totalMessages = ref(0)
const soulGreeting = ref<string | undefined>(undefined)
const isGreetingStreaming = ref(false)
const moodClass = computed(() => `mood-${mood.value}`)
const moods: MoodType[] = ['calm', 'happy', 'tender', 'focused']
let moodIdx = 0

export function useSoul() {

  /** 从后端加载 Soul 状态（初始化时调用） */
  async function loadSoulState() {
    try {
      const state = await soulApi.getState()
      mood.value = state.mood
      feeling.value = state.feeling
      milestone.value = state.milestone
      memories.value = state.memories || []
      // 不再从 REST API 设置 soulGreeting — 由 loadStreamingGreeting 接管
      daysSinceFirst.value = state.daysSinceFirst
      totalMessages.value = state.totalMessages
    } catch (err) {
      console.error('[useSoul] 加载 Soul 状态失败:', err)
    }
  }

  /**
   * 流式加载 AI 动态问候语。
   * 首次：LLM 逐 token 生成，soulGreeting 逐字增长（WelcomeScreen 实现打字效果）。
   * 缓存命中：一次性返回完整文案，soulGreeting 直接设为完整值。
   */
  async function loadStreamingGreeting(signal?: AbortSignal) {
    try {
      isGreetingStreaming.value = true
      soulGreeting.value = undefined

      let accumulated = ''
      for await (const chunk of soulApi.streamGreeting(signal)) {
        if (chunk.type === 'text' && chunk.content) {
          accumulated += chunk.content
          soulGreeting.value = accumulated
        }
      }

      // 流结束后，如果没有收到任何内容，保持 undefined
      if (!accumulated) {
        soulGreeting.value = undefined
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.error('[useSoul] AI 问候加载失败:', err)
      }
    } finally {
      isGreetingStreaming.value = false
    }
  }

  /** 根据对话内容推断情绪（实时，不走后端） */
  function inferMood(content: string) {
    const lower = content.toLowerCase()
    if (/开心|高兴|太好了|哈哈|兴奋|成就/.test(lower)) {
      mood.value = 'happy'
      feeling.value = t('playgroundChat.composables.soul.moodHappy')
    } else if (/想你|温暖|感谢|陪伴|喜欢/.test(lower)) {
      mood.value = 'tender'
      feeling.value = t('playgroundChat.composables.soul.moodTender')
    } else if (/代码|架构|技术|设计|开发|框架/.test(lower)) {
      mood.value = 'focused'
      feeling.value = t('playgroundChat.composables.soul.moodFocused')
    } else {
      mood.value = 'calm'
      feeling.value = t('playgroundChat.composables.soul.moodCalm')
    }
  }

  /** 设置思考状态 */
  function setThinking(value: boolean) {
    isThinking.value = value
  }

  /** 循环切换情绪（demo 用） */
  function cycleMood() {
    moodIdx = (moodIdx + 1) % moods.length
    mood.value = moods[moodIdx]
  }

  return {
    mood: readonly(mood),
    feeling: readonly(feeling),
    isThinking: readonly(isThinking),
    milestone: readonly(milestone),
    memories: readonly(memories),
    daysSinceFirst: readonly(daysSinceFirst),
    totalMessages: readonly(totalMessages),
    soulGreeting: readonly(soulGreeting),
    isGreetingStreaming: readonly(isGreetingStreaming),
    moodClass,
    loadSoulState,
    loadStreamingGreeting,
    inferMood,
    setThinking,
    cycleMood,
  }
}
