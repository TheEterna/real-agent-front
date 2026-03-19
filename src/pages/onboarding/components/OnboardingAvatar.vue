<!--
  Onboarding Step 4: AI 头像揭幕

  三阶段流程:
    1. 生成中 - 呼吸脉冲 + API 调用
    2. 揭幕   - GSAP L3 编排序列 (blur→clear, scale, glow)
    3. 完成   - 头像展示 + 操作按钮

  这是整个 Onboarding 的仪式感高潮,
  揭幕动画必须精心编排。
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { RefreshCw, Upload, ShieldAlert } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/auth'
import { onboardingPageApi } from '../api'
import type { PersonaProfile } from '../types'

const props = defineProps<{
  persona: PersonaProfile | null
  nickname: string
}>()

const emit = defineEmits<{
  complete: [avatarUrl: string]
  skip: []
}>()

const { t } = useI18n()

// -- State --
type Phase = 'generating' | 'revealing' | 'done'
const phase = ref<Phase>('generating')
const avatarUrl = ref('')
const isRegenerating = ref(false)
let seedSuffix = 0              // 重新生成时递增，产生不同 seed

// -- DOM refs --
const pulseCircleRef = ref<HTMLElement | null>(null)
const avatarImageRef = ref<HTMLElement | null>(null)
const revealTitleRef = ref<HTMLElement | null>(null)
const actionsRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// -- GSAP instances --
let breathingTween: gsap.core.Tween | null = null
let revealTimeline: gsap.core.Timeline | null = null

/**
 * Start the breathing pulse animation on the circle placeholder.
 * Respects prefers-reduced-motion.
 */
function startBreathingPulse() {
  if (!pulseCircleRef.value) return

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  breathingTween = gsap.to(pulseCircleRef.value, {
    scale: 1.06,
    duration: 1.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  })
}

function stopBreathingPulse() {
  if (breathingTween) {
    breathingTween.kill()
    breathingTween = null
  }
}

/**
 * Generate the avatar via API.
 * Returns empty string on failure so the UI can gracefully degrade.
 */
async function generateAvatar(): Promise<string> {
  try {
    const userName = seedSuffix > 0
      ? `${props.nickname}${seedSuffix}`
      : props.nickname
    const result = await onboardingPageApi.generateAvatar({
      traits: props.persona?.dominantTraits ?? [],
      style: 'adventurer',
      userName,
    })
    return result.url
  } catch {
    return ''
  }
}

/**
 * GSAP L3 reveal choreography -- the signature moment.
 *
 * Timeline:
 *   1. Stop breathing pulse
 *   2. Circle blur 20px → 0 + scale 0.8 → 1 (back.out)
 *   3. Image fades in
 *   4. Glow expansion
 *   5. Title "这是 AI 眼中的你" fadeIn + translateY
 *   6. Action buttons fadeIn
 */
async function playRevealAnimation() {
  phase.value = 'revealing'
  await nextTick()

  revealTimeline = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => {
      phase.value = 'done'
    },
  })

  const circle = pulseCircleRef.value
  const img = avatarImageRef.value
  const title = revealTitleRef.value
  const actions = actionsRef.value

  if (!circle) {
    phase.value = 'done'
    return
  }

  // 1. Stop breathing pulse
  stopBreathingPulse()
  gsap.set(circle, { scale: 1 })

  // 2. Blur clear + scale bounce
  revealTimeline.fromTo(
    circle,
    { filter: 'blur(20px)', scale: 0.8 },
    { filter: 'blur(0px)', scale: 1, duration: 0.6, ease: 'back.out(1.4)' },
  )

  // 3. Image opacity
  if (img) {
    gsap.set(img, { opacity: 0 })
    revealTimeline.to(img, { opacity: 1, duration: 0.5 }, '-=0.3')
  }

  // 4. Glow expansion
  revealTimeline.to(
    circle,
    {
      boxShadow: 'var(--glow-subtle)',
      duration: 0.4,
    },
    '-=0.2',
  )

  // 5. Title fadeIn + translateY
  if (title) {
    gsap.set(title, { opacity: 0, y: -10 })
    revealTimeline.to(title, { opacity: 1, y: 0, duration: 0.3 }, '-=0.1')
  }

  // 6. Actions fadeIn
  if (actions) {
    gsap.set(actions, { opacity: 0, y: 8 })
    revealTimeline.to(actions, { opacity: 1, y: 0, duration: 0.2 })
  }
}

/**
 * Regenerate the avatar with a fresh API call
 */
async function handleRegenerate() {
  if (isRegenerating.value) return
  isRegenerating.value = true
  seedSuffix++

  phase.value = 'generating'
  await nextTick()
  startBreathingPulse()

  try {
    const url = await generateAvatar()
    avatarUrl.value = url
    await playRevealAnimation()
  } finally {
    isRegenerating.value = false
  }
}

/**
 * Trigger the hidden file input for manual upload
 */
function handleUploadClick() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 上传到 COS，获取持久化 URL
  try {
    const res = await authApi.uploadAvatar(file)
    if (res.code === 200 && res.data?.avatarUrl) {
      avatarUrl.value = res.data.avatarUrl
      phase.value = 'done'
    } else {
      // 降级：使用 blob URL
      avatarUrl.value = URL.createObjectURL(file)
      phase.value = 'done'
    }
  } catch {
    avatarUrl.value = URL.createObjectURL(file)
    phase.value = 'done'
  }
}

function handleUseAvatar() {
  emit('complete', avatarUrl.value)
}

function handleSkip() {
  emit('skip')
}

// -- Lifecycle --

onMounted(async () => {
  await nextTick()
  startBreathingPulse()

  const url = await generateAvatar()
  avatarUrl.value = url

  await playRevealAnimation()
})

onUnmounted(() => {
  stopBreathingPulse()
  if (revealTimeline) {
    revealTimeline.kill()
    revealTimeline = null
  }
  if (avatarUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarUrl.value)
  }
})
</script>

<template>
  <div class="onboarding-avatar">
    <!-- Phase 1: Generating -->
    <template v-if="phase === 'generating'">
      <h2 class="onboarding-avatar__title">
        {{ t('onboarding.avatar.generatingTitle') }}
      </h2>

      <!-- Breathing pulse circle -->
      <div
        ref="pulseCircleRef"
        class="avatar-circle bg-gradient-to-br from-teal-300 to-cyan-500"
      />

      <!-- 生成阶段也允许跳过 -->
      <button
        class="onboarding-avatar__skip"
        type="button"
        @click="handleSkip"
      >
        {{ t('onboarding.avatar.skipAvatar') }}
      </button>
    </template>

    <!-- Phase 2 & 3: Revealing / Done -->
    <template v-else>
      <h2
        ref="revealTitleRef"
        class="onboarding-avatar__title"
      >
        {{ t('onboarding.avatar.revealTitle') }}
      </h2>

      <!-- Avatar display -->
      <div
        ref="pulseCircleRef"
        class="avatar-circle avatar-circle--revealed"
      >
        <img
          v-if="avatarUrl"
          ref="avatarImageRef"
          :src="avatarUrl"
          :alt="nickname"
          class="avatar-circle__image"
        />
        <div
          v-else
          class="avatar-circle__fallback bg-gradient-to-br from-teal-300 to-cyan-500"
        >
          <span class="avatar-circle__initial">{{ nickname.charAt(0) || 'V' }}</span>
        </div>
      </div>

      <!-- Nickname -->
      <p class="onboarding-avatar__nickname">
        {{ nickname }}
      </p>

      <!-- Actions -->
      <div ref="actionsRef" class="onboarding-avatar__actions">
        <Button
          variant="outline"
          :disabled="isRegenerating"
          class="active:scale-95 transition-transform duration-100"
          @click="handleRegenerate"
        >
          <RefreshCw class="w-4 h-4 mr-1.5" :class="{ 'animate-spin': isRegenerating }" />
          {{ t('onboarding.avatar.regenerate') }}
        </Button>
        <Button
          variant="outline"
          class="active:scale-95 transition-transform duration-100"
          @click="handleUploadClick"
        >
          <Upload class="w-4 h-4 mr-1.5" />
          {{ t('onboarding.avatar.uploadAvatar') }}
        </Button>
        <Button
          class="active:scale-95 transition-transform duration-100"
          @click="handleUseAvatar"
        >
          {{ t('onboarding.avatar.useThisAvatar') }}
        </Button>
      </div>

      <!-- 隐私提醒 -->
      <p class="onboarding-avatar__privacy">
        <ShieldAlert :size="13" class="shrink-0" />
        <span>{{ t('onboarding.avatar.privacyHint') }}</span>
      </p>

      <!-- 暂不设置 -->
      <button
        class="onboarding-avatar__skip"
        type="button"
        @click="handleSkip"
      >
        {{ t('onboarding.avatar.skipAvatar') }}
      </button>
    </template>

    <!-- Hidden file input for manual upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped>
.onboarding-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 1.5rem;
}

.onboarding-avatar__header {
  text-align: center;
}

.onboarding-avatar__title {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--foreground);
  text-align: center;
  margin-bottom: 0.5rem;
}

.onboarding-avatar__subtitle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-size: 0.813rem;
  color: var(--muted-foreground);
}

.onboarding-avatar__trait-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  color: var(--primary);
}

.onboarding-avatar__style-label {
  color: var(--muted-foreground);
}

/* Circle: breathing pulse state + avatar display */
.avatar-circle {
  width: 12rem;
  height: 12rem;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.avatar-circle--revealed {
  border: 4px solid color-mix(in srgb, var(--primary) 20%, transparent);
  background: var(--card);
}

.avatar-circle__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-full);
}

.avatar-circle__fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
}

.avatar-circle__initial {
  font-size: 3rem;
  font-weight: 300;
  color: var(--primary-foreground);
  text-transform: uppercase;
}

.onboarding-avatar__nickname {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  text-align: center;
}

.onboarding-avatar__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.onboarding-avatar__privacy {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  opacity: 0.7;
  text-align: center;
}

.onboarding-avatar__skip {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--muted-foreground) 50%, transparent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 1rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  transition: color var(--duration-normal) var(--ease-fluid);
}

.onboarding-avatar__skip:hover {
  color: var(--muted-foreground);
}

.onboarding-avatar__skip:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}
</style>

<style lang="scss">
/* Dark mode (non-scoped, .dark on <html>) */
.dark {
  .avatar-circle--revealed {
    background: rgba(255, 255, 255, 0.04);
    border-color: color-mix(in srgb, var(--primary) 15%, transparent);
  }

  .onboarding-avatar__trait-tag {
    background: color-mix(in srgb, var(--primary) 15%, transparent);
  }

  .onboarding-avatar__skip {
    color: color-mix(in srgb, var(--muted-foreground) 40%, transparent);

    &:hover {
      color: var(--muted-foreground);
    }
  }
}
</style>
