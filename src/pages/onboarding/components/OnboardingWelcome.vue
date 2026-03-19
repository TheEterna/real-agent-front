<!--
  Onboarding Step 1: Welcome

  品牌问候 + 基本信息采集（昵称、使用场景、职业）。
  GSAP timeline 编排入场动画，Lucide 图标，设计令牌驱动。
  按压反馈使用 GSAP pointerdown/pointerup 双阶段模式。
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { Input } from '@/components/ui/input'
import {
  Briefcase, BookOpen, Sparkles, Coffee, FlaskConical,
  GraduationCap, Code2, Palette, LayoutDashboard, Microscope,
  PenLine, Rocket, Laptop, User, ChevronRight,
} from 'lucide-vue-next'
import type { WelcomeData, UseCase, Occupation } from '../types'
import { USE_CASE_OPTIONS, OCCUPATION_OPTIONS } from '../types'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  initialNickname?: string
  initialUseCases?: string[]
  initialOccupation?: string
}>(), {
  initialNickname: '',
  initialUseCases: () => [],
  initialOccupation: '',
})

const emit = defineEmits<{
  complete: [data: WelcomeData]
}>()

// ── Lucide 图标映射 ──

const iconMap: Record<string, Component> = {
  'briefcase': Briefcase,
  'book-open': BookOpen,
  'sparkles': Sparkles,
  'coffee': Coffee,
  'flask-conical': FlaskConical,
  'graduation-cap': GraduationCap,
  'code-2': Code2,
  'palette': Palette,
  'layout-dashboard': LayoutDashboard,
  'microscope': Microscope,
  'pen-line': PenLine,
  'rocket': Rocket,
  'laptop': Laptop,
  'user': User,
}

// ── Reduced motion ──

const prefersReduced = ref(
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
)

// ── 表单状态（从 props 恢复） ──

const nickname = ref(props.initialNickname)
const selectedUseCases = ref<UseCase[]>(props.initialUseCases as UseCase[])
const selectedOccupation = ref<Occupation | null>(
  (props.initialOccupation as Occupation) || null,
)
const MAX_USE_CASES = 3

// i18n labels for use case and occupation options
const useCaseLabels: Record<string, string> = {
  work: 'onboarding.welcome.useCaseWork',
  study: 'onboarding.welcome.useCaseStudy',
  creation: 'onboarding.welcome.useCaseCreation',
  life: 'onboarding.welcome.useCaseLife',
  research: 'onboarding.welcome.useCaseResearch',
}
const occupationLabels: Record<string, string> = {
  student: 'onboarding.welcome.occStudent',
  engineer: 'onboarding.welcome.occEngineer',
  designer: 'onboarding.welcome.occDesigner',
  product_manager: 'onboarding.welcome.occProductManager',
  researcher: 'onboarding.welcome.occResearcher',
  writer: 'onboarding.welcome.occWriter',
  entrepreneur: 'onboarding.welcome.occEntrepreneur',
  freelancer: 'onboarding.welcome.occFreelancer',
  teacher: 'onboarding.welcome.occTeacher',
  other: 'onboarding.welcome.occOther',
}
const localizedUseCaseOptions = computed(() =>
  USE_CASE_OPTIONS.map(o => ({ ...o, label: t(useCaseLabels[o.value] ?? o.label) })),
)
const localizedOccupationOptions = computed(() =>
  OCCUPATION_OPTIONS.map(o => ({ ...o, label: t(occupationLabels[o.value] ?? o.label) })),
)

// ── 响应式校验（computed 代替手动 validate） ──

const isValid = computed(() =>
  nickname.value.trim().length > 0
  && selectedUseCases.value.length > 0
  && selectedOccupation.value !== null,
)

const isUseCaseMaxed = computed(() =>
  selectedUseCases.value.length >= MAX_USE_CASES,
)

// ── 交互逻辑 ──

function toggleUseCase(useCase: UseCase) {
  const index = selectedUseCases.value.indexOf(useCase)
  if (index === -1) {
    if (isUseCaseMaxed.value) return
    selectedUseCases.value = [...selectedUseCases.value, useCase]
  } else {
    selectedUseCases.value = selectedUseCases.value.filter(uc => uc !== useCase)
  }
}

function selectOccupation(occ: Occupation) {
  selectedOccupation.value = occ
}

function handleSubmit() {
  if (!isValid.value) return
  emit('complete', {
    nickname: nickname.value.trim(),
    useCases: [...selectedUseCases.value],
    occupation: selectedOccupation.value!,
  })
}

// ── GSAP 按压反馈：pointerdown 立即缩小，pointerup 弹簧恢复 ──

function onPressDown(event: PointerEvent) {
  if (prefersReduced.value) return
  const el = event.currentTarget as HTMLElement
  if (el.hasAttribute('disabled')) return
  gsap.killTweensOf(el)
  gsap.to(el, { scale: 0.93, duration: 0.1, ease: 'power2.out', overwrite: true })
}

function onPressUp(event: PointerEvent) {
  if (prefersReduced.value) return
  const el = event.currentTarget as HTMLElement
  gsap.to(el, { scale: 1, duration: 0.4, ease: 'back.out(2)', clearProps: 'all' })
}

function onCtaPressDown(event: PointerEvent) {
  if (prefersReduced.value) return
  const el = event.currentTarget as HTMLElement
  if (el.hasAttribute('disabled')) return
  gsap.killTweensOf(el)
  gsap.to(el, { scale: 0.97, duration: 0.1, ease: 'power2.out', overwrite: true })
}

function onCtaPressUp(event: PointerEvent) {
  if (prefersReduced.value) return
  const el = event.currentTarget as HTMLElement
  gsap.to(el, { scale: 1, duration: 0.4, ease: 'back.out(2)', clearProps: 'all' })
}

// ── GSAP 入场动画 ──

const titleRef = ref<HTMLElement | null>(null)
const subtitleRef = ref<HTMLElement | null>(null)
const nicknameRef = ref<HTMLElement | null>(null)
const useCaseRef = ref<HTMLElement | null>(null)
const occupationRef = ref<HTMLElement | null>(null)
const ctaRef = ref<HTMLElement | null>(null)

let timeline: gsap.core.Timeline | null = null

function focusNicknameInput() {
  const inputEl = nicknameRef.value?.querySelector('input')
  inputEl?.focus()
}

onMounted(() => {
  const targets = [
    titleRef.value,
    subtitleRef.value,
    nicknameRef.value,
    useCaseRef.value,
    occupationRef.value,
    ctaRef.value,
  ].filter(Boolean)

  if (prefersReduced.value) {
    gsap.set(targets, { opacity: 1, y: 0 })
    focusNicknameInput()
    return
  }

  gsap.set(targets, { opacity: 0, y: 24 })

  timeline = gsap.timeline({ delay: 0.15 })
  timeline.to(targets, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.1,
    clearProps: 'all',
  })
  timeline.call(() => focusNicknameInput())
})

onUnmounted(() => {
  timeline?.kill()
  timeline = null
  const targets = [
    titleRef.value, subtitleRef.value, nicknameRef.value,
    useCaseRef.value, occupationRef.value, ctaRef.value,
  ].filter(Boolean)
  targets.forEach(t => gsap.killTweensOf(t!))
})
</script>

<template>
  <div class="welcome" role="form" :aria-label="t('onboarding.welcome.formAriaLabel')">
    <!-- 欢迎标题区 — 居中，大字号 -->
    <div class="welcome__hero">
      <h1 ref="titleRef" class="welcome__title">
        {{ t('onboarding.welcome.title') }}
      </h1>
      <p ref="subtitleRef" class="welcome__subtitle">
        {{ t('onboarding.welcome.subtitle') }}
      </p>
    </div>

    <!-- 昵称输入 -->
    <div ref="nicknameRef" class="welcome__section">
      <label class="welcome__label" for="onboarding-nickname">{{ t('onboarding.welcome.nicknameLabel') }}</label>
      <Input
        id="onboarding-nickname"
        :model-value="nickname"
        :placeholder="t('onboarding.welcome.nicknamePlaceholder')"
        class="welcome__input"
        @update:model-value="nickname = ($event as string)"
        @keydown.enter="handleSubmit"
      />
    </div>

    <!-- 使用场景多选（限 3） -->
    <div ref="useCaseRef" class="welcome__section">
      <label class="welcome__label">
        {{ t('onboarding.welcome.useCaseLabel') }}
        <span class="welcome__hint">{{ t('onboarding.welcome.maxItems', { max: MAX_USE_CASES }) }}</span>
      </label>
      <div class="welcome__pills" role="group" :aria-label="t('onboarding.welcome.useCaseAriaLabel')">
        <button
          v-for="option in localizedUseCaseOptions"
          :key="option.value"
          class="welcome__pill"
          :class="{
            'welcome__pill--selected': selectedUseCases.includes(option.value),
            'welcome__pill--disabled': !selectedUseCases.includes(option.value) && isUseCaseMaxed,
          }"
          :aria-pressed="selectedUseCases.includes(option.value)"
          :disabled="!selectedUseCases.includes(option.value) && isUseCaseMaxed"
          type="button"
          @pointerdown="onPressDown"
          @pointerup="onPressUp"
          @pointerleave="onPressUp"
          @click="toggleUseCase(option.value)"
        >
          <component :is="iconMap[option.icon]" :size="16" class="shrink-0" />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- 职业选择 -->
    <div ref="occupationRef" class="welcome__section">
      <label class="welcome__label">{{ t('onboarding.welcome.occupationLabel') }}</label>
      <div class="welcome__pills" role="group" :aria-label="t('onboarding.welcome.occupationAriaLabel')">
        <button
          v-for="option in localizedOccupationOptions"
          :key="option.value"
          class="welcome__pill welcome__pill--compact"
          :class="{ 'welcome__pill--selected': selectedOccupation === option.value }"
          :aria-pressed="selectedOccupation === option.value"
          type="button"
          @pointerdown="onPressDown"
          @pointerup="onPressUp"
          @pointerleave="onPressUp"
          @click="selectOccupation(option.value)"
        >
          <component :is="iconMap[option.icon]" :size="14" class="shrink-0" />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- CTA — 右对齐 Continue 按钮 -->
    <div ref="ctaRef" class="welcome__cta">
      <button
        class="welcome__next-btn"
        :class="{ 'welcome__next-btn--ready': isValid }"
        :disabled="!isValid"
        type="button"
        @pointerdown="onCtaPressDown"
        @pointerup="onCtaPressUp"
        @pointerleave="onCtaPressUp"
        @click="handleSubmit"
      >
        <span>{{ t('onboarding.welcome.continueBtn') }}</span>
        <ChevronRight :size="16" />
      </button>
      <!-- 过渡引导文案 -->
      <p
        v-if="isValid"
        class="mt-2 text-center text-xs text-muted-foreground/70 transition-opacity duration-300"
      >
        {{ t('onboarding.welcome.nextStepHint') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow: visible;
}

/* Hero 区：居中标题 + 副标题 */
.welcome__hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
}

.welcome__title {
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--foreground);
  line-height: 1.2;
}

@media (min-width: 640px) {
  .welcome__title {
    font-size: 2.5rem;
  }
}

.welcome__subtitle {
  font-size: 0.9375rem;
  color: var(--muted-foreground);
  line-height: 1.5;
  max-width: 420px;
}

.welcome__section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.welcome__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.welcome__hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--muted-foreground);
}

.welcome__input {
  font-size: 1rem;
}

.welcome__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.welcome__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  border: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  cursor: pointer;
  transition:
    background-color var(--duration-normal) var(--ease-fluid),
    border-color var(--duration-normal) var(--ease-fluid),
    color var(--duration-normal) var(--ease-fluid),
    opacity var(--duration-normal) var(--ease-fluid);
  user-select: none;
}

.welcome__pill--compact {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.welcome__pill:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--primary) 50%, transparent);
  background: color-mix(in srgb, var(--primary) 4%, transparent);
}

.welcome__pill:focus-visible {
  outline: none;
  box-shadow: var(--glow-focus);
}

.welcome__pill--selected {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.welcome__pill--selected:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary) 90%, transparent);
  border-color: color-mix(in srgb, var(--primary) 90%, transparent);
}

.welcome__pill--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.welcome__cta {
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: flex-end;
  padding-top: 0.25rem;
}

.welcome__next-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.5rem;
  min-height: 44px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted-foreground);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    color var(--duration-normal) var(--ease-fluid),
    background-color var(--duration-normal) var(--ease-fluid),
    border-color var(--duration-normal) var(--ease-fluid),
    box-shadow var(--duration-normal) var(--ease-fluid),
    opacity var(--duration-normal) var(--ease-fluid);
}

.welcome__next-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.welcome__next-btn--ready {
  color: var(--primary-foreground);
  background: var(--primary);
  border-color: var(--primary);
}

.welcome__next-btn--ready:hover:not(:disabled) {
  box-shadow: var(--glow-subtle);
}

.welcome__next-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .welcome__pill {
    border-color: rgba(255, 255, 255, 0.1);

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--primary) 50%, transparent);
    }
  }

  .welcome__pill--selected {
    border-color: var(--primary);
  }

  .welcome__next-btn {
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
