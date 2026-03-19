<script setup lang="ts">
/**
 * OnboardingScreen — 首次使用引导（不可跳过）
 *
 * 两步轻量引导：
 * 1. 欢迎 + 给助手起名
 * 2. 选择性格
 *
 * 配置通过 emit('complete', settings) 传出，
 * 由 ChatAssistant 通过 Store 持久化到 localStorage + 后端 DB。
 */
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { ArrowRight, Sparkles } from 'lucide-vue-next'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { Personality } from '../types'

const emit = defineEmits<{
  complete: [settings: { assistantName: string; personality: Personality }]
}>()

const { t } = useI18n()
const { prefersReduced } = useReducedMotion()

// ========== State ==========
const step = ref(0) // 0=命名, 1=性格
const assistantName = ref('')
const selectedPersonality = ref<Personality>('WARM')
const containerRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const isTransitioning = ref(false)

const personalities = computed(() => [
  { value: 'WARM' as Personality, label: t('playgroundChat.onboarding.warm'), desc: t('playgroundChat.onboarding.warmDesc'), example: t('playgroundChat.onboarding.warmExample') },
  { value: 'PROFESSIONAL' as Personality, label: t('playgroundChat.onboarding.professional'), desc: t('playgroundChat.onboarding.professionalDesc'), example: t('playgroundChat.onboarding.professionalExample') },
  { value: 'HUMOROUS' as Personality, label: t('playgroundChat.onboarding.humorous'), desc: t('playgroundChat.onboarding.humorousDesc'), example: t('playgroundChat.onboarding.humorousExample') },
  { value: 'LEARNED' as Personality, label: t('playgroundChat.onboarding.learned'), desc: t('playgroundChat.onboarding.learnedDesc'), example: t('playgroundChat.onboarding.learnedExample') },
])

const canProceed = computed(() => {
  if (step.value === 0) return assistantName.value.trim().length > 0
  return true
})

// ========== GSAP 清理 ==========
let activeTween: gsap.core.Tween | null = null

onUnmounted(() => {
  activeTween?.kill()
  if (containerRef.value) gsap.killTweensOf(containerRef.value)
})

// ========== Actions ==========
function nextStep() {
  if (!canProceed.value || isTransitioning.value) return

  if (step.value === 1) {
    emit('complete', {
      assistantName: assistantName.value.trim() || t('playgroundChat.onboarding.defaultName'),
      personality: selectedPersonality.value,
    })
    return
  }

  // 步骤切换动画（带 isTransitioning guard 防双击）
  const el = containerRef.value
  if (el && !prefersReduced.value) {
    isTransitioning.value = true
    activeTween = gsap.to(el, {
      opacity: 0, y: -10, duration: 0.15, ease: 'power2.in',
      onComplete: () => {
        step.value++
        activeTween = gsap.fromTo(el,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out',
            onComplete: () => { isTransitioning.value = false } },
        )
      },
    })
  } else {
    step.value++
  }
}

/** 空输入时点击按钮 → 输入框抖动提示 */
function handleButtonClick() {
  if (!canProceed.value && step.value === 0) {
    const el = inputRef.value
    if (el && !prefersReduced.value) {
      gsap.to(el, { keyframes: [{ x: -4 }, { x: 4 }, { x: -2 }, { x: 2 }, { x: 0 }], duration: 0.4, ease: 'power2.inOut' })
    }
    inputRef.value?.focus()
    return
  }
  nextStep()
}
</script>

<template>
  <div class="onboarding-screen flex flex-col items-center justify-center flex-1 relative select-none px-6">
    <div ref="containerRef" class="flex flex-col items-center w-full max-w-sm">

      <!-- ═══ Step 0: 欢迎 + 命名 ═══ -->
      <template v-if="step === 0">
        <!-- AI Avatar -->
        <div class="onboarding-avatar mb-5">
          <img src="/logo.png" alt="AI" class="onboarding-avatar-img" />
        </div>

        <div class="flex items-center gap-2 mb-3">
          <Sparkles :size="18" :stroke-width="1.5" class="text-primary-500/60" />
          <span class="text-xs font-medium tracking-wider text-primary-500/50 uppercase">{{ t('playgroundChat.onboarding.firstMeet') }}</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-light tracking-tight text-center leading-snug greeting-gradient mb-2">
          {{ t('playgroundChat.onboarding.welcome') }}
        </h1>

        <p class="text-base text-zinc-400 dark:text-zinc-500 text-center mb-10 max-w-[300px] leading-relaxed">
          {{ t('playgroundChat.onboarding.nameYourAssistant') }}
        </p>

        <div class="w-full max-w-[280px] mb-8">
          <input
            ref="inputRef"
            v-model="assistantName"
            type="text"
            :aria-label="t('playgroundChat.onboarding.assistantNameLabel')"
            class="
              w-full text-center text-lg font-medium
              px-5 py-3.5 rounded-2xl
              bg-white dark:bg-white/5
              border border-border/60
              text-zinc-800 dark:text-zinc-100
              outline-none
              transition-all duration-200
              focus:border-primary-500/50 focus:shadow-[var(--glow-focus)]
              placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            "
            :placeholder="t('playgroundChat.onboarding.defaultName')"
            maxlength="10"
            @keydown.enter="nextStep"
          />
          <p class="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-2.5">
            {{ t('playgroundChat.onboarding.nameChangeLater') }}
          </p>
        </div>
      </template>

      <!-- ═══ Step 1: 性格选择 ═══ -->
      <template v-if="step === 1">
        <!-- AI Avatar -->
        <div class="onboarding-avatar mb-4">
          <img src="/logo.png" alt="AI" class="onboarding-avatar-img" />
        </div>

        <h2 class="text-xl sm:text-2xl font-light tracking-tight text-center greeting-gradient mb-2">
          {{ assistantName || t('playgroundChat.onboarding.defaultName') }}{{ t('playgroundChat.onboarding.personalityTitle') }}
        </h2>
        <p class="text-base text-zinc-400 dark:text-zinc-500 text-center mb-8 leading-relaxed">
          {{ t('playgroundChat.onboarding.personalityDesc') }}
        </p>

        <div class="grid grid-cols-2 gap-3 w-full mb-8" role="radiogroup" :aria-label="t('playgroundChat.onboarding.personalityAriaLabel')">
          <button
            v-for="p in personalities"
            :key="p.value"
            role="radio"
            :aria-checked="selectedPersonality === p.value"
            class="
              flex flex-col items-start gap-2 p-4
              rounded-2xl border
              text-left cursor-pointer
              transition-all duration-200
            "
            :class="selectedPersonality === p.value
              ? 'border-primary-500/50 bg-primary-500/[0.06] dark:bg-primary-500/[0.08] shadow-sm'
              : 'border-border/60 bg-white/60 dark:bg-white/[0.03] hover:border-border/80 hover:shadow-sm'
            "
            @click="selectedPersonality = p.value"
          >
            <span
              class="text-sm font-semibold"
              :class="selectedPersonality === p.value
                ? 'text-primary-700 dark:text-primary-400'
                : 'text-zinc-700 dark:text-zinc-300'
              "
            >
              {{ p.label }}
            </span>
            <span class="text-xs leading-snug text-zinc-400 dark:text-zinc-500">
              {{ p.desc }}
            </span>
            <span class="text-xs leading-snug text-zinc-300 dark:text-zinc-600 italic mt-0.5">
              {{ p.example }}
            </span>
          </button>
        </div>
      </template>

      <!-- ═══ 步骤指示 + 操作按钮 ═══ -->
      <div class="flex flex-col items-center gap-3 w-full max-w-[260px]">
        <!-- 两点指示器 -->
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full transition-colors duration-200"
            :class="step === 0 ? 'bg-primary-500' : 'bg-zinc-200 dark:bg-zinc-700'" />
          <span class="w-1.5 h-1.5 rounded-full transition-colors duration-200"
            :class="step === 1 ? 'bg-primary-500' : 'bg-zinc-200 dark:bg-zinc-700'" />
        </div>

        <button
          class="
            w-full inline-flex items-center justify-center gap-2
            h-11 rounded-full
            text-sm font-medium
            transition-all duration-200
          "
          :class="canProceed
            ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-400 active:scale-[0.97] shadow-sm'
            : 'bg-zinc-100 dark:bg-white/5 text-zinc-300 dark:text-zinc-600 cursor-default'
          "
          :aria-label="step === 1 ? t('playgroundChat.onboarding.startChat') : t('playgroundChat.onboarding.nextStep')"
          @click="handleButtonClick"
        >
          <span>{{ step === 1 ? t('playgroundChat.onboarding.startChat') : t('playgroundChat.onboarding.nextStep') }}</span>
          <ArrowRight :size="15" :stroke-width="2" />
        </button>
      </div>
    </div>
  </div>
</template>

<!-- 亮色+暗色模式统一在非 scoped 块，避免 scoped 特异性覆盖问题 -->
<style>
.onboarding-avatar {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: rgba(107,154,152,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.onboarding-avatar-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}
.dark .onboarding-avatar {
  background: rgba(124,183,180,0.12);
}

.onboarding-screen .greeting-gradient {
  background: linear-gradient(135deg, var(--color-primary-600, #5a8d8b), var(--color-primary-800, #3d6a68));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark .onboarding-screen .greeting-gradient {
  background: linear-gradient(135deg, var(--color-primary-400, #7cb7b4), var(--color-primary-300, #a0d0cd));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
