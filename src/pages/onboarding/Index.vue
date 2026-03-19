<!--
  Onboarding 主容器页面

  全屏 standalone 页面，管理 4 个步骤的数据收集与切换动画。
  步骤: welcome → persona → avatar → launch
  完成后提交数据并导航至 /chat
-->

<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { ChevronLeft } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import StepIndicator from './components/StepIndicator.vue'
import OnboardingWelcome from './components/OnboardingWelcome.vue'
import OnboardingPersona from './components/OnboardingPersona.vue'
import OnboardingAvatar from './components/OnboardingAvatar.vue'
import OnboardingLaunch from './components/OnboardingLaunch.vue'
import type { OnboardingStep, WelcomeData, PersonaProfile } from './types'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// ── Reduced motion ──
const prefersReduced =
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── 步骤管理 ──
const STEPS: OnboardingStep[] = ['welcome', 'persona', 'avatar', 'launch']
/** 展示给用户的步骤指示器（4 步全展示） */
const VISIBLE_STEPS: OnboardingStep[] = ['welcome', 'persona', 'avatar', 'launch']
const currentStep = ref<OnboardingStep>('welcome')

// ── 步骤间共享数据 ──
const nickname = ref('')
const useCases = ref<string[]>([])
const occupation = ref('')
const personaProfile = ref<PersonaProfile | null>(null)
const avatarUrl = ref('')

// ── Persona 组件存活标记（v-if 延迟创建 + v-show 保活，防止返回时丢失对话） ──
const personaEverMounted = ref(false)

// ── 动画容器 ref ──
const stepContainerRef = ref<HTMLElement | null>(null)

/**
 * GSAP L2 步骤切换动画
 * 当前步骤 fadeOut + translateY(-20px)，新步骤 fadeIn + translateY(20px → 0)
 * prefers-reduced-motion 时跳过动画
 */
async function transitionToStep(nextStep: OnboardingStep) {
  const container = stepContainerRef.value
  if (!container || prefersReduced) {
    currentStep.value = nextStep
    await nextTick()
    return
  }

  // fadeOut 当前步骤
  await gsap.to(container, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    ease: 'power2.out',
  })

  // 切换步骤
  currentStep.value = nextStep

  // 等待 DOM 更新
  await nextTick()

  // fadeIn 新步骤
  gsap.fromTo(
    container,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
  )
}

// ── 返回上一步 ──

function goBack() {
  const currentIndex = STEPS.indexOf(currentStep.value)
  if (currentIndex <= 0) return
  transitionToStep(STEPS[currentIndex - 1])
}

// ── 步骤完成回调 ──

function onWelcomeComplete(data: WelcomeData) {
  nickname.value = data.nickname
  useCases.value = data.useCases
  occupation.value = data.occupation
  personaEverMounted.value = true
  transitionToStep('persona')
}

function onPersonaComplete(profile: PersonaProfile) {
  personaProfile.value = profile
  transitionToStep('avatar')
}

function onPersonaSkip() {
  personaProfile.value = null
  transitionToStep('avatar')
}

function onAvatarComplete(url: string) {
  avatarUrl.value = url
  transitionToStep('launch')
}

function onAvatarSkip() {
  avatarUrl.value = ''
  transitionToStep('launch')
}

/** Launch 组件内部提交成功后回调 */
function onLaunched() {
  authStore.markOnboardingCompleted()
  router.push('/chat')
}

/** 逃生出口：跳过提交，直接标记完成并进入聊天 */
function skipOnboarding() {
  authStore.markOnboardingCompleted()
  router.push('/chat')
}

// ── 清理 ──
onUnmounted(() => {
  if (stepContainerRef.value) {
    gsap.killTweensOf(stepContainerRef.value)
  }
})
</script>

<template>
  <div
    class="onboarding-page"
    :class="{ 'onboarding-page--fixed': currentStep === 'persona' || currentStep === 'launch' }"
  >
    <!-- 左上角 Logo（launch 步骤隐藏） -->
    <div v-if="currentStep !== 'launch'" class="onboarding-page__logo">
      <img src="/logo.png" alt="VOLO AI" class="onboarding-page__logo-img" />
      <span class="onboarding-page__logo-text">VOLO AI</span>
    </div>

    <!-- 顶部栏：步骤指示器 + 返回按钮（launch 步骤隐藏指示器） -->
    <div class="onboarding-page__header">
      <div v-if="currentStep !== 'launch'" class="onboarding-page__indicator">
        <StepIndicator :current-step="currentStep" :steps="VISIBLE_STEPS" />
      </div>

      <!-- 返回按钮（launch 步骤隐藏） -->
      <div v-if="currentStep !== 'launch'" class="onboarding-page__nav">
        <button
          v-if="currentStep !== 'welcome'"
          class="onboarding-page__back"
          type="button"
          :aria-label="t('onboarding.nav.goBack')"
          @click="goBack"
        >
          <ChevronLeft :size="16" />
          <span>{{ t('onboarding.nav.previousStep') }}</span>
        </button>
      </div>
    </div>

    <!-- 步骤内容区域 -->
    <div
      ref="stepContainerRef"
      class="onboarding-page__content"
      :class="{
        'onboarding-page__content--chat': currentStep === 'persona',
        'onboarding-page__content--launch': currentStep === 'launch',
      }"
    >
      <OnboardingWelcome
        v-if="currentStep === 'welcome'"
        :initial-nickname="nickname"
        :initial-use-cases="useCases"
        :initial-occupation="occupation"
        @complete="onWelcomeComplete"
      />
      <OnboardingPersona
        v-if="personaEverMounted"
        v-show="currentStep === 'persona'"
        :nickname="nickname"
        @complete="onPersonaComplete"
        @skip="onPersonaSkip"
      />
      <OnboardingAvatar
        v-if="currentStep === 'avatar'"
        :persona="personaProfile"
        :nickname="nickname"
        @complete="onAvatarComplete"
        @skip="onAvatarSkip"
      />
      <OnboardingLaunch
        v-if="currentStep === 'launch'"
        :nickname="nickname"
        :avatar-url="avatarUrl"
        :persona="personaProfile"
        :occupation="occupation"
        :use-cases="useCases"
        @launched="onLaunched"
      />
    </div>

    <!-- 底部品牌标识（launch 步骤隐藏） -->
    <div v-if="currentStep !== 'launch'" class="onboarding-page__brand">
      {{ t('onboarding.brand') }}
    </div>
  </div>
</template>

<style scoped>
.onboarding-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100vw;
  background: var(--background);
  position: relative;
  overflow-x: hidden;
}

/* persona 步骤：定高锁定视口，让 flex 子项产生真实高度约束 */
.onboarding-page--fixed {
  height: 100vh;
  height: 100dvh;
  min-height: auto;
  overflow: hidden;
}

/* 左上角 Logo：绝对定位，不占据文档流 */
.onboarding-page__logo {
  position: absolute;
  top: 1.5rem;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 20;
}

.onboarding-page__logo-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.onboarding-page__logo-text {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--foreground);
  letter-spacing: -0.01em;
}

@media (max-width: 640px) {
  .onboarding-page__logo {
    top: 1rem;
    left: 1.25rem;
  }
}

/* 顶部区域：统一容器限宽，包含 indicator + nav */
.onboarding-page__header {
  width: 100%;
  max-width: 640px;
  padding: 2.5rem 3rem 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .onboarding-page__header {
    padding: 1.5rem 1.25rem 0;
  }
}

.onboarding-page__indicator {
  width: 100%;
}

.onboarding-page__nav {
  width: 100%;
  min-height: 2rem;
}

.onboarding-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  min-height: 44px;
  margin-left: -0.75rem;
  border-radius: var(--radius-sm);
  transition:
    color var(--duration-normal) var(--ease-fluid),
    transform var(--duration-fast) var(--ease-snap);
}

.onboarding-page__back:active {
  transform: scale(0.95);
}

.onboarding-page__back:hover {
  color: var(--foreground);
}

.onboarding-page__back:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.onboarding-page__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 640px;
  padding: 2rem 3rem 2rem;
  min-height: 0;
  overflow: visible;
}

@media (max-width: 640px) {
  .onboarding-page__content {
    padding: 1.5rem 1.25rem 1.5rem;
  }
}

.onboarding-page__content--chat {
  justify-content: flex-start;
  align-items: stretch;
  overflow: hidden;
}

.onboarding-page__content--launch {
  max-width: 100%;
  padding: 0;
  overflow: hidden;
}

.onboarding-page__brand {
  padding-bottom: 1.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: var(--muted-foreground);
  opacity: 0.4;
  user-select: none;
}
</style>

<!-- background 已通过 var(--background) 自动适配暗色模式，无需额外 .dark 块 -->
