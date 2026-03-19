/**
 * 问候语 + 时间感知话题 composable
 *
 * 全部使用 computed 消费 getText()：
 * - i18n 消息变化（fetchAndMerge 完成）→ computed 自动重算 → 立即反映 DB 文案
 * - 时段变化（setInterval 更新 currentSlot）→ computed 自动重算 → 切换话题集
 *
 * topicFlowHtml: 流动文字 HTML，整段从 TextConfig 获取。
 * HTML 格式: <a data-prompt="填入输入框的文字">显示的短语</a>
 */
import { ref, computed, onUnmounted } from 'vue'
import i18n from '@/i18n'
import { useTextConfig } from '@/composables/useTextConfig'
import { useTextConfigStore } from '@/stores/textConfigStore'
import type { Greeting } from '../types'

const { t } = i18n.global

type TimeSlot = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'

function resolveTimeSlot(): TimeSlot {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 14) return 'noon'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

function greetingMeta(slot: TimeSlot): { fallback: string; emoji: string } {
  const map: Record<TimeSlot, { key: string; emoji: string }> = {
    morning: { key: 'playgroundChat.composables.greeting.morning', emoji: '☀️' },
    noon: { key: 'playgroundChat.composables.greeting.noon', emoji: '🌤️' },
    afternoon: { key: 'playgroundChat.composables.greeting.afternoon', emoji: '☕' },
    evening: { key: 'playgroundChat.composables.greeting.evening', emoji: '🌙' },
    night: { key: 'playgroundChat.composables.greeting.night', emoji: '🌟' },
  }
  const meta = map[slot]
  return { fallback: t(meta.key), emoji: meta.emoji }
}

/** 每个时段的 placeholder fallback */
function placeholderFallback(slot: TimeSlot): string {
  const key = `playgroundChat.composables.placeholder.${slot}`
  return t(key)
}

/** 每个时段的 fallback HTML（DB 无值时兜底，自然语句，至少 2 个交互点） */
const flowFallbacks: Record<TimeSlot, string> = {
  morning: '想先<a data-prompt="帮我规划一下今天要做的事">理一理今天的计划</a>，还是<a data-prompt="推荐一篇适合早上读的短文或名言">看篇短文</a>慢慢进入状态？',
  noon: '忙了一上午，可以<a data-prompt="上午忙了半天，想和你聊聊">歇会儿聊几句</a>，也可以让我<a data-prompt="帮我写一段有感染力的朋友圈文案">帮你写点什么</a>',
  afternoon: '<a data-prompt="今天心情有点复杂，想和你聊聊">聊聊最近的感受</a>也好，帮你<a data-prompt="推荐一本书或一部电影吧">找点好看的</a>也行',
  evening: '今天辛苦了，可以<a data-prompt="今天有点累，想和你说说话">说说今天的事</a>，也可以<a data-prompt="推荐一部今晚适合看的电影吧">找个片子</a>安静待一会儿',
  night: '睡不着的话，可以<a data-prompt="睡不着觉，陪我聊聊天吧">聊几句</a>，也可以让我<a data-prompt="给我讲一个温暖的睡前故事吧">讲个睡前故事</a>',
}

export function useGreeting() {
  const { getText, getHtml } = useTextConfig()
  const textConfigStore = useTextConfigStore()

  /** 响应式时段 — setInterval 驱动，computed 依赖 */
  const currentSlot = ref<TimeSlot>(resolveTimeSlot())

  /**
   * 问候语 — computed 追踪三个响应式源：
   * 1. currentSlot（时段变化）
   * 2. textConfigStore.loadedTypes（fetchAndMerge 完成时触发）
   * 3. getText → t()（i18n 消息）
   *
   * 单独依赖 t() 的响应式追踪在 composable 的 computed 中不可靠，
   * 所以显式引用 loadedTypes 作为额外触发器。
   */
  const greeting = computed<Greeting>(() => {
    void textConfigStore.loadedTypes.size // 响应式触发器
    const slot = currentSlot.value
    const meta = greetingMeta(slot)
    return {
      text: getText(`greeting_${slot}`, meta.fallback),
      emoji: meta.emoji,
    }
  })

  /** 流动文字 HTML — 直接从 store.rawTexts 读，绕过 vue-i18n 编译器 */
  const topicFlowHtml = computed<string>(() => {
    const slot = currentSlot.value
    const key = `topic_flow_${slot}`
    const raw = textConfigStore.rawTexts?.['chatassistant']?.[key]
    return (typeof raw === 'string' && raw) ? raw : flowFallbacks[slot]
  })

  /** 输入框动态 placeholder — 按时段切换 */
  const placeholderText = computed<string>(() => {
    void textConfigStore.loadedTypes.size
    const slot = currentSlot.value
    return getText(`placeholder_${slot}`, placeholderFallback(slot))
  })

  /** 每分钟检查时段变化（new Date() 不是响应式源） */
  const timer = setInterval(() => {
    currentSlot.value = resolveTimeSlot()
  }, 60_000)

  onUnmounted(() => clearInterval(timer))

  return { greeting, topicFlowHtml, placeholderText }
}
