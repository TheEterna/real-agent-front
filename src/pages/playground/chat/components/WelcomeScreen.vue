<script setup lang="ts">
/**
 * WelcomeScreen — 空状态
 *
 * 话题建议：流动文字方案（v-html + 事件委托）
 * 整段 HTML 由 TextConfig 配置，运营可热更新。
 * 格式: <a data-prompt="填入输入框的文字">显示的短语</a>
 * 点击通过事件委托捕获 data-prompt，填入输入框。
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { ArrowUp, Loader2 } from 'lucide-vue-next'
import { useTextConfig } from '@/composables/useTextConfig'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { Greeting } from '../types'

const props = defineProps<{
  greeting: Greeting
  topicFlowHtml: string
  assistantName?: string
  hasOlderMessages?: boolean
  soulMemories?: readonly string[]
  soulGreeting?: string
  isGreetingStreaming?: boolean
  milestone?: string
}>()

const emit = defineEmits<{
  selectTopic: [prompt: string]
  revealOlder: []
}>()

const { t } = useI18n()
const { getText } = useTextConfig()
const { prefersReduced } = useReducedMotion()

// ========== Refs ==========
const rootRef = ref<HTMLElement>()
const heroRef = ref<HTMLElement>()
const subRef = ref<HTMLElement>()
const flowRef = ref<HTMLElement>()
const chipsRef = ref<HTMLElement>()
const revealRef = ref<HTMLElement>()

// ========== State ==========
const isRevealing = ref(false)
const entrancePending = ref(true)
const entranceDone = ref(false)
const hasReceivedFirstToken = ref(false)

// ========== Computed ==========
const isReunion = computed(() => !!props.hasOlderMessages)
const name = computed(() => props.assistantName || t('playgroundChat.onboarding.defaultName'))

/** 建议芯片 — 时段感知的快捷话题 */
const suggestionChips = computed(() => [
  { icon: '💬', label: t('playgroundChat.welcome.chipChat', '聊聊天'), prompt: t('playgroundChat.welcome.chipChatPrompt', '想和你聊聊最近的生活') },
  { icon: '🎬', label: t('playgroundChat.welcome.chipMovie', '看电影'), prompt: t('playgroundChat.welcome.chipMoviePrompt', '推荐一部今晚适合看的电影') },
  { icon: '🎮', label: t('playgroundChat.welcome.chipGame', '玩游戏'), prompt: t('playgroundChat.welcome.chipGamePrompt', '推荐一个有趣的小游戏') },
  { icon: '🧘', label: t('playgroundChat.welcome.chipRelax', '放松一下'), prompt: t('playgroundChat.welcome.chipRelaxPrompt', '帮我做一个简短的放松练习') },
])

const targetSubtitle = computed(() => {
  if (props.soulGreeting) return props.soulGreeting
  if (isReunion.value) return getText('reunion_sub', t('playgroundChat.welcome.reunionSub'))
  return getText('welcome_sub', t('playgroundChat.welcome.welcomeSub', { name: name.value }))
})

const isAiGreeting = computed(() => !!props.soulGreeting)
const displaySubtitle = ref(targetSubtitle.value)

// ========== 副标题过渡 ==========
let swapTween: gsap.core.Tween | null = null

watch(() => props.isGreetingStreaming, (streaming) => {
  if (!streaming) hasReceivedFirstToken.value = false
})

watch(targetSubtitle, (newText, oldText) => {
  if (newText === oldText) return

  if (props.isGreetingStreaming) {
    if (!hasReceivedFirstToken.value && entranceDone.value && subRef.value) {
      hasReceivedFirstToken.value = true
      swapTween?.kill()
      swapTween = gsap.to(subRef.value, {
        opacity: 0, y: -3, duration: 0.15, ease: 'power2.in',
        onComplete: () => {
          displaySubtitle.value = newText
          gsap.set(subRef.value!, { y: 0 })
          swapTween = gsap.to(subRef.value!, {
            opacity: 1, duration: 0.12, ease: 'power2.out',
          })
        },
      })
      return
    }
    if (!hasReceivedFirstToken.value) hasReceivedFirstToken.value = true
    displaySubtitle.value = newText
    return
  }

  if (!entranceDone.value) { displaySubtitle.value = newText; return }
  if (prefersReduced.value || !subRef.value) { displaySubtitle.value = newText; return }

  swapTween?.kill()
  const el = subRef.value
  swapTween = gsap.to(el, {
    opacity: 0, y: -3, duration: 0.18, ease: 'power2.in',
    onComplete: () => {
      displaySubtitle.value = newText
      gsap.set(el, { y: 3 })
      swapTween = gsap.to(el, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' })
    },
  })
})

// ========== GSAP 入场 ==========
let entranceTl: gsap.core.Timeline | null = null

function forceVisible() {
  entrancePending.value = false
  const els = [heroRef, subRef, revealRef, flowRef, chipsRef]
    .map(r => r.value).filter(Boolean) as Element[]
  for (const el of els) gsap.set(el, { clearProps: 'all' })
}

function playEntrance() {
  if (prefersReduced.value) {
    entrancePending.value = false
    entranceDone.value = true
    return
  }

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => { forceVisible(); entranceDone.value = true },
  })
  entranceTl = tl

  if (heroRef.value) {
    tl.fromTo(heroRef.value, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 })
  }
  if (subRef.value) {
    tl.fromTo(subRef.value, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.2')
  }
  if (revealRef.value) {
    tl.fromTo(revealRef.value, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.15')
  }
  if (flowRef.value) {
    tl.fromTo(flowRef.value, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, '-=0.2')
  }
  if (chipsRef.value) {
    tl.fromTo(chipsRef.value, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, '-=0.15')
  }
}

// ========== 事件委托：捕获流动文字中的 <a data-prompt> 点击 ==========
function handleFlowClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('a[data-prompt]')
  if (!target) return
  e.preventDefault()
  const prompt = target.getAttribute('data-prompt')
  if (prompt) emit('selectTopic', prompt)
}

function handleRevealOlder() {
  if (isRevealing.value) return
  isRevealing.value = true
  emit('revealOlder')
}

// ========== Lifecycle ==========
onMounted(() => playEntrance())

onUnmounted(() => {
  entranceTl?.kill()
  swapTween?.kill()
  forceVisible()
})
</script>

<template>
  <div
    ref="rootRef"
    class="
      flex flex-col items-center justify-center flex-1
      relative select-none px-4 sm:px-6
    "
    :class="{ 'entrance-pending': entrancePending }"
  >
    <!-- ═══ Reveal Older ═══ -->
    <button
      v-if="isReunion"
      ref="revealRef"
      data-anim
      class="
        absolute top-4 left-1/2 -translate-x-1/2 z-10
        inline-flex items-center gap-1.5 h-8 px-4
        rounded-full
        bg-white/70 dark:bg-white/[0.06]
        border border-primary-300/30 dark:border-primary-500/20
        text-primary-700 dark:text-primary-300
        text-xs font-medium tracking-wide
        backdrop-blur-sm
        transition-all duration-200
        hover:not-disabled:bg-white/90 hover:not-disabled:border-primary-400/50
        hover:not-disabled:shadow-[var(--shadow-md)]
        hover:not-disabled:-translate-y-0.5
        active:not-disabled:scale-[0.97]
        focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2
        disabled:opacity-50 disabled:cursor-default
      "
      :disabled="isRevealing"
      :aria-label="t('playgroundChat.welcome.revealOlder')"
      @click="handleRevealOlder"
    >
      <Loader2 v-if="isRevealing" :size="13" :stroke-width="1.8" class="animate-spin" />
      <ArrowUp v-else :size="13" :stroke-width="1.8" />
      <span>{{ isRevealing ? t('playgroundChat.welcome.loadingText') : getText('reveal_older', t('playgroundChat.welcome.revealOlder')) }}</span>
    </button>

    <!-- ═══ Greeting ═══ -->
    <div class="flex flex-col items-center text-center">
      <h1
        ref="heroRef"
        data-anim
        class="
          text-[2rem] sm:text-[2.6rem] font-light tracking-tight leading-[1.2]
          greeting-gradient
          mb-2.5 sm:mb-3
        "
      >
        {{ greeting.text }}
      </h1>

      <p
        ref="subRef"
        data-anim
        class="text-base leading-relaxed max-w-[340px]"
        :class="isAiGreeting
          ? 'text-primary-600 dark:text-primary-400 font-medium'
          : isReunion
            ? 'text-primary-600 dark:text-primary-400 italic font-medium'
            : 'text-zinc-400 dark:text-zinc-500'
        "
      >
        {{ displaySubtitle }}
      </p>
    </div>

    <!-- ═══ 流动文字 — 一句自然语言，v-html + 事件委托 ═══ -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <p
      ref="flowRef"
      data-anim
      class="flow-text mt-8 sm:mt-10"
      @click="handleFlowClick"
      v-html="topicFlowHtml"
    />

    <!-- ═══ Suggestion Chips — 设计稿对齐 ═══ -->
    <div ref="chipsRef" data-anim class="suggestion-chips mt-6">
      <button
        v-for="(chip, idx) in suggestionChips"
        :key="idx"
        class="suggestion-chip"
        @click="emit('selectTopic', chip.prompt)"
      >
        <span class="chip-icon">{{ chip.icon }}</span>
        <span class="chip-label">{{ chip.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ═══ 入场预隐藏 ═══ */
.entrance-pending [data-anim] {
  opacity: 0;
}

/* ═══ 问候语品牌色渐变 ═══ */
.greeting-gradient {
  background: linear-gradient(135deg, var(--color-primary-600, #5a8d8b), var(--color-primary-800, #3d6a68));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ═══ 流动文字容器 ═══ */
.flow-text {
  text-align: center;
  font-size: 1rem;
  line-height: 2.2;
  max-width: 420px;
  color: var(--muted-foreground);
  opacity: 0.6;
}

/* ═══ 可点击短语（v-html 内的 <a>，需要 :deep 穿透 scoped） ═══ */
.flow-text :deep(a[data-prompt]) {
  color: var(--foreground);
  opacity: 0.6;
  text-decoration: none;
  border-bottom: 1px dashed var(--color-primary-300);
  padding-bottom: 1px;
  cursor: pointer;
  font-weight: 500;
  transition: color var(--duration-fast), border-color var(--duration-fast), opacity var(--duration-fast);
}

.flow-text :deep(a[data-prompt]:hover) {
  color: var(--color-primary-700);
  opacity: 1;
  border-bottom-color: var(--color-primary-500);
  border-bottom-style: solid;
}

.flow-text :deep(a[data-prompt]:focus-visible) {
  outline: 2px solid var(--color-primary-500, #6B9A98);
  outline-offset: 2px;
  border-radius: 2px;
}

.flow-text :deep(a[data-prompt]:active) {
  opacity: 0.7;
}

/* ═══ 建议芯片 ═══ */
.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 500px;
}
.suggestion-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  background: var(--paper-warm, #F5F3EE);
  border: 1px solid var(--ink-whisper, rgba(45,43,41,0.08));
  color: var(--ink, #2D2B29);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
  white-space: nowrap;
}
.suggestion-chip:hover {
  background: var(--paper, #FAFAF7);
  border-color: var(--ink-ghost, rgba(45,43,41,0.25));
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
  transform: translateY(-1px);
}
.suggestion-chip:active {
  transform: scale(0.97);
}
.chip-icon {
  font-size: 1rem;
  line-height: 1;
}
.chip-label {
  line-height: 1;
}

/* ═══ 响应式 ═══ */
@media (max-width: 640px) {
  .flow-text {
    font-size: 0.8125rem;
    max-width: 300px;
  }
  .suggestion-chips {
    max-width: 320px;
  }
  .suggestion-chip {
    font-size: 0.75rem;
    padding: 7px 12px;
  }
}
</style>

<!-- ═══ 暗色模式（非 scoped，匹配特异性） ═══ -->
<style>
.dark .greeting-gradient {
  background: linear-gradient(135deg, var(--color-primary-400, #7cb7b4), var(--color-primary-300, #a0d0cd));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.dark .flow-text {
  color: var(--muted-foreground);
}
.dark .flow-text a[data-prompt] {
  color: var(--foreground);
  opacity: 0.5;
  border-bottom-color: var(--color-primary-400);
}
.dark .flow-text a[data-prompt]:hover {
  color: var(--color-primary-400);
  opacity: 0.9;
  border-bottom-color: var(--color-primary-500);
}
.dark .suggestion-chip {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.08);
  color: rgba(224,231,235,0.8);
}
.dark .suggestion-chip:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
}
</style>
