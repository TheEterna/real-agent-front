<script setup lang="ts">
/**
 * OnboardingPersona - BFI-44 大五人格标准量表
 *
 * Onboarding 核心步骤（Step 2）。
 * 44 题 Likert 量表，分 5 页展示，客户端标准化计分。
 *
 * 参照 John et al. (1991) BFI-44 原始量表。
 * GSAP L2 页面切换动画 + L3 PersonaCard 弹入。
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { usePersonaAssessment } from '../composables/usePersonaAssessment'
import PersonaCard from './PersonaCard.vue'
import { BFI_STEM, LIKERT_OPTIONS, getLikertOptions } from '../bfi44'
import type { LikertValue } from '../bfi44'
import type { PersonaProfile } from '../types'

const props = defineProps<{
  nickname: string
}>()

const emit = defineEmits<{
  complete: [profile: PersonaProfile]
  skip: []
}>()

// ── Composable ──
const { t } = useI18n()
const assessment = usePersonaAssessment()
const localizedLikertOptions = computed(() => getLikertOptions())

// ── Animation ──
const { prefersReduced, duration } = useReducedMotion()
const tweenRegistry: gsap.core.Tween[] = []

// ── Refs ──
const pageRef = ref<HTMLElement>()
const personaCardRef = ref<HTMLElement>()
const showSkipConfirm = ref(false)
const isContinuing = ref(false)

// 翻页动画
watch(() => assessment.currentPage.value, (_newPage, oldPage) => {
  nextTick(() => {
    if (!pageRef.value || prefersReduced.value) return
    // 根据翻页方向决定动画方向
    const direction = (_newPage > (oldPage ?? 0)) ? 1 : -1
    const tween = gsap.from(pageRef.value, {
      opacity: 0,
      x: 24 * direction,
      duration: duration.value || 0.3,
      ease: 'power2.out',
      clearProps: 'all',
    })
    tweenRegistry.push(tween)
  })
})

// PersonaCard 弹入动画
watch(() => assessment.isCompleted.value, (completed) => {
  if (!completed) return
  nextTick(() => {
    setTimeout(() => {
      if (personaCardRef.value && !prefersReduced.value) {
        const tween = gsap.from(personaCardRef.value, {
          y: 20,
          opacity: 0,
          scale: 0.95,
          duration: 0.5,
          ease: 'back.out(1.4)',
        })
        tweenRegistry.push(tween)
      }
    }, 100)
  })
})

// ── Handlers ──
function handleSelectOption(itemId: number, value: LikertValue) {
  assessment.setResponse(itemId, value)
}

function handleNext() {
  assessment.nextPage()
}

function handlePrev() {
  assessment.prevPage()
}

function handleSkipClick() {
  showSkipConfirm.value = true
}

function handleSkipConfirm() {
  showSkipConfirm.value = false
  emit('skip')
}

function handleSkipCancel() {
  showSkipConfirm.value = false
}

function handleContinue() {
  if (isContinuing.value) return
  if (assessment.personaProfile.value) {
    isContinuing.value = true
    emit('complete', assessment.personaProfile.value)
  }
}

function isSelected(itemId: number, value: LikertValue): boolean {
  return assessment.responses.value[itemId] === value
}

// ── 清理 ──
onUnmounted(() => {
  tweenRegistry.forEach(t => t.kill())
  if (pageRef.value) gsap.killTweensOf(pageRef.value)
  if (personaCardRef.value) gsap.killTweensOf(personaCardRef.value)
})
</script>

<template>
  <div class="bfi-assessment">
    <!-- Header: 标题 + 引导语 + 进度条 -->
    <div class="bfi-assessment__header">
      <h2 class="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
        {{ t('onboarding.persona.title') }}
      </h2>
      <p class="mb-4 text-base text-muted-foreground leading-relaxed">
        {{ t('onboarding.persona.subtitle', { stem: t('onboarding.bfi.stem') }) }}
      </p>
      <div
        class="mb-4 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-base leading-6 text-foreground/90"
        role="note"
      >
        <span class="font-medium text-foreground">{{ t('onboarding.persona.importantNote') }}</span>
        {{ t('onboarding.persona.importantDesc') }}
      </div>
      <!-- 进度条 -->
      <div class="h-1 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          :style="{ width: `${assessment.progress.value * 100}%` }"
        />
      </div>
      <div class="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ t('onboarding.persona.progress', { answered: assessment.answeredCount.value, total: assessment.totalItems.value }) }}</span>
        <span v-if="!assessment.isCompleted.value">
          {{ t('onboarding.persona.page', { current: assessment.currentPage.value + 1, total: assessment.totalPages.value }) }}
        </span>
        <span v-else>{{ t('onboarding.persona.completed') }}</span>
      </div>
    </div>

    <!-- 评估内容 -->
    <template v-if="!assessment.isCompleted.value">
      <!-- 移动端量表提示 -->
      <div class="bfi-assessment__mobile-hint">
        <span>{{ t('onboarding.persona.mobileHintDisagree') }}</span>
        <span class="mx-2 text-muted-foreground/60">←  1 · 2 · 3 · 4 · 5  →</span>
        <span>{{ t('onboarding.persona.mobileHintAgree') }}</span>
      </div>

      <!-- 当前页题目（标题标签在内部 sticky，确保与按钮列对齐） -->
      <div
        ref="pageRef"
        class="bfi-assessment__items"
        role="group"
        :aria-label="t('onboarding.persona.itemAriaLabel')"
      >
        <!-- Likert 量表列标题（桌面端，sticky 在滚动区顶部） -->
        <div class="bfi-assessment__scale-header">
          <div class="bfi-assessment__item-text" aria-hidden="true" />
          <div class="bfi-assessment__scale-labels">
            <span
              v-for="opt in localizedLikertOptions"
              :key="opt.value"
              class="bfi-assessment__scale-label"
            >
              {{ opt.label }}
            </span>
          </div>
        </div>
        <div
          v-for="item in assessment.currentPageItems.value"
          :key="item.id"
          class="bfi-assessment__item"
          :role="'radiogroup'"
          :aria-label="t('onboarding.persona.questionAriaLabel', { id: item.id, text: item.text })"
        >
          <div class="bfi-assessment__item-text">
            <span class="bfi-assessment__item-num">{{ item.id }}.</span>
            {{ item.text }}
          </div>
          <div class="bfi-assessment__item-options">
            <button
              v-for="opt in localizedLikertOptions"
              :key="opt.value"
              class="bfi-assessment__radio"
              :class="{ 'bfi-assessment__radio--selected': isSelected(item.id, opt.value) }"
              :aria-label="opt.label"
              :aria-checked="isSelected(item.id, opt.value)"
              role="radio"
              @click="handleSelectOption(item.id, opt.value)"
            >
              <span class="bfi-assessment__radio-dot" />
              <span class="bfi-assessment__radio-value">{{ opt.value }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 翻页导航 -->
      <div class="bfi-assessment__nav">
        <button
          v-if="!assessment.isFirstPage.value"
          class="bfi-assessment__nav-btn bfi-assessment__nav-btn--secondary"
          @click="handlePrev"
        >
          <ChevronLeft :size="16" />
          {{ t('onboarding.persona.prevPage') }}
        </button>
        <div v-else />

        <button
          class="bfi-assessment__nav-btn bfi-assessment__nav-btn--primary"
          :disabled="!assessment.currentPageAnswered.value"
          @click="handleNext"
        >
          {{ assessment.isLastPage.value ? t('onboarding.persona.viewResult') : t('onboarding.persona.nextPage') }}
          <ChevronRight v-if="!assessment.isLastPage.value" :size="16" />
        </button>
      </div>
    </template>

    <!-- 结果：PersonaCard -->
    <template v-else>
      <div class="bfi-assessment__result">
        <div ref="personaCardRef">
          <PersonaCard
            v-if="assessment.personaProfile.value"
            :profile="assessment.personaProfile.value"
            :nickname="nickname"
          />
        </div>
        <div class="mt-6 flex justify-center">
          <button
            class="rounded-[var(--radius-md)] bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
            :disabled="isContinuing"
            @click="handleContinue"
          >
            {{ t('onboarding.persona.continueBtn') }}
          </button>
        </div>
      </div>
    </template>

    <!-- 跳过按钮 -->
    <div v-if="!assessment.isCompleted.value" class="bfi-assessment__footer">
      <div class="flex justify-end">
        <button
          v-if="!showSkipConfirm"
          class="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:rounded-sm"
          @click="handleSkipClick"
        >
          {{ t('onboarding.persona.skipStep') }}
        </button>
        <!-- 跳过确认 -->
        <div
          v-else
          class="flex items-center gap-3 text-sm"
        >
          <span class="text-muted-foreground">{{ t('onboarding.persona.skipConfirmText') }}</span>
          <button
            class="rounded-lg border border-border px-3 py-1 text-muted-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            @click="handleSkipCancel"
          >
            {{ t('onboarding.persona.continueQuiz') }}
          </button>
          <button
            class="rounded-lg px-3 py-1 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            @click="handleSkipConfirm"
          >
            {{ t('onboarding.persona.confirmSkip') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ── */
.bfi-assessment {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.bfi-assessment__header {
  flex-shrink: 0;
  padding: 0.5rem 0 1rem;
}

/* ── Likert 列标题（桌面端，sticky 在滚动区顶部） ── */
.bfi-assessment__scale-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--background);
  padding: 0 0 0.25rem;
  /* 镜像 __item 的 flex 布局 */
  display: none;
  align-items: flex-end;
  gap: 1rem;
}

@media (min-width: 640px) {
  .bfi-assessment__scale-header {
    display: flex;
  }
}

.bfi-assessment__scale-labels {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.bfi-assessment__scale-label {
  width: 2.75rem; /* 与 __radio 的 width 完全一致 */
  text-align: center;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  white-space: nowrap;
}

/* ── 移动端量表提示 ── */
.bfi-assessment__mobile-hint {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0 0.5rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

@media (min-width: 640px) {
  .bfi-assessment__mobile-hint {
    display: none;
  }
}

/* ── 题目列表 ── */
.bfi-assessment__items {
  flex: 1;
  overflow-y: auto;
  overflow-y: overlay;
  min-height: 0;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.bfi-assessment__items:hover {
  scrollbar-color: color-mix(in srgb, var(--foreground) 15%, transparent) transparent;
}

.bfi-assessment__items::-webkit-scrollbar {
  width: 4px;
}

.bfi-assessment__items::-webkit-scrollbar-track {
  background: transparent;
}

.bfi-assessment__items::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.bfi-assessment__items:hover::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--foreground) 15%, transparent);
}

.bfi-assessment__item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}

.bfi-assessment__item-text {
  flex: 1;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--foreground);
  min-width: 0;
}

.bfi-assessment__item-num {
  color: var(--muted-foreground);
  font-size: 0.8125rem;
  margin-right: 0.25rem;
  font-variant-numeric: tabular-nums;
}

/* ── Likert 单选按钮 ── */
.bfi-assessment__item-options {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.bfi-assessment__radio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border);
  background: transparent;
  cursor: pointer;
  transition: all 200ms var(--ease-fluid);
}

.bfi-assessment__radio:hover {
  border-color: var(--primary);
  background: var(--muted);
}

.bfi-assessment__radio:focus-visible {
  outline: none;
  box-shadow: var(--glow-focus);
}

.bfi-assessment__radio:active {
  transform: scale(0.93);
}

.bfi-assessment__radio--selected {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}

.bfi-assessment__radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--border);
  transition: all 200ms var(--ease-fluid);
}

.bfi-assessment__radio--selected .bfi-assessment__radio-dot {
  background: var(--primary);
  width: 0.625rem;
  height: 0.625rem;
}

.bfi-assessment__radio-value {
  font-size: 0.625rem;
  color: var(--muted-foreground);
  line-height: 1;
}

.bfi-assessment__radio--selected .bfi-assessment__radio-value {
  color: var(--primary);
  font-weight: 500;
}

/* ── 翻页导航 ── */
.bfi-assessment__nav {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  gap: 1rem;
}

.bfi-assessment__nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.25rem;
  min-height: 44px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-fluid);
  border: none;
}

.bfi-assessment__nav-btn:focus-visible {
  outline: none;
  box-shadow: var(--glow-focus);
}

.bfi-assessment__nav-btn:active {
  transform: scale(0.95);
}

.bfi-assessment__nav-btn--primary {
  background: var(--primary);
  color: var(--primary-foreground);
}

.bfi-assessment__nav-btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.bfi-assessment__nav-btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bfi-assessment__nav-btn--secondary {
  background: transparent;
  color: var(--muted-foreground);
  border: 1px solid var(--border);
}

.bfi-assessment__nav-btn--secondary:hover {
  background: var(--muted);
  color: var(--foreground);
}

/* ── 结果区域 ── */
.bfi-assessment__result {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 1rem 0;
}

/* ── 底部 ── */
.bfi-assessment__footer {
  flex-shrink: 0;
  padding: 0.5rem 0 0.25rem;
}

/* ── 移动端：题目纵向堆叠 ── */
@media (max-width: 639px) {
  .bfi-assessment__item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .bfi-assessment__item-options {
    justify-content: space-between;
  }

  .bfi-assessment__radio {
    flex: 1;
    min-width: 0;
  }
}
</style>

<style lang="scss">
/* Dark mode (non-scoped, .dark on <html>) */
.dark {
  .bfi-assessment__item {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .bfi-assessment__radio {
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      border-color: var(--primary);
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .bfi-assessment__radio--selected {
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.08);
  }

  .bfi-assessment__radio-dot {
    background: rgba(255, 255, 255, 0.15);
  }

  .bfi-assessment__radio--selected .bfi-assessment__radio-dot {
    background: var(--primary);
  }

  .bfi-assessment__nav-btn--secondary {
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .bfi-assessment__items:hover {
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  }

  .bfi-assessment__items:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
  }
}
</style>
