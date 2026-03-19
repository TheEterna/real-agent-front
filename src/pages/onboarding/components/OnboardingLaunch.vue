<!--
  Onboarding Step 5: 启程 — 仪式感揭幕

  三阶段 GSAP L3 编排序列：
    Phase 1 (0-2s):   头像 blur→clear + scale 弹入 + 粒子散射 + 昵称 typewriter
    Phase 2 (2-3.2s): 特质标签四角飘散 + 星座连接线 strokeDashoffset 绘制
    Phase 3 (3.2-4.2s): 收缩 + 主文案入场 + CTA 呼吸光晕

  空仪式降级：无 persona + 无 avatar 时跳过标签/星座，只保留头像+昵称+CTA

  Dan Saffer "签名时刻"：Onboarding 的最后一帧，也是用户与 AI 关系的第一帧。
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { Rocket } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { PersonaProfile, OnboardingSubmitRequest } from '../types'
import { USE_CASE_OPTIONS, OCCUPATION_OPTIONS } from '../types'
import { onboardingPageApi } from '../api'

const props = defineProps<{
  nickname: string
  avatarUrl: string
  persona: PersonaProfile | null
  occupation: string
  useCases: string[]
}>()

const emit = defineEmits<{
  /** 提交成功，导航至 /chat */
  launched: []
}>()

const { t } = useI18n()

// ── Reduced motion ──
const prefersReduced =
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── State ──
type Phase = 'idle' | 'animating' | 'ready' | 'launching' | 'submitting' | 'submitFailed'
const phase = ref<Phase>('idle')
const isLaunching = ref(false)

/**
 * 空仪式降级判断
 * 无人格特质 + 无真实头像 → 简洁模式（跳过标签/星座动画）
 */
const hasRichContent = computed(() => {
  return !!(props.persona?.dominantTraits?.length || props.avatarUrl)
})

// ── DOM refs ──
const sceneRef = ref<HTMLElement | null>(null)
const identityRef = ref<HTMLElement | null>(null)
const avatarRef = ref<HTMLElement | null>(null)
const nicknameRef = ref<HTMLElement | null>(null)
const headlineRef = ref<HTMLElement | null>(null)
const ctaRef = ref<HTMLElement | null>(null)
const flashRef = ref<HTMLElement | null>(null)
const fadeTextRef = ref<HTMLElement | null>(null)
const particleRefs = ref<HTMLElement[]>([])
const tagRefs = ref<HTMLElement[]>([])
const lineRefs = ref<SVGLineElement[]>([])
const constellationRef = ref<SVGSVGElement | null>(null)

// ── GSAP timeline ──
let mainTimeline: gsap.core.Timeline | null = null
let ctaBreathTween: gsap.core.Tween | null = null

// ── 特质标签数据 ──
const traitTags = computed(() => {
  const tags: string[] = []
  if (props.persona?.dominantTraits) {
    tags.push(...props.persona.dominantTraits.slice(0, 2))
  }
  if (props.occupation && tags.length < 4) {
    const label = OCCUPATION_OPTIONS.find(o => o.value === props.occupation)?.label ?? props.occupation
    tags.push(label)
  }
  if (props.useCases?.length && tags.length < 4) {
    const caseLabels = props.useCases
      .map(uc => USE_CASE_OPTIONS.find(o => o.value === uc)?.label ?? uc)
      .slice(0, 4 - tags.length)
    tags.push(...caseLabels)
  }
  while (tags.length < 4) {
    tags.push([t('onboarding.launch.defaultTagExplorer'), t('onboarding.launch.defaultTagThinker'), t('onboarding.launch.defaultTagCreator'), t('onboarding.launch.defaultTagDoer')][tags.length])
  }
  return tags.slice(0, 4)
})

// ── 标签四角目标位置 ──
const TAG_POSITIONS = [
  { left: '20%', top: '20%' },
  { left: '80%', top: '20%' },
  { left: '18%', top: '78%' },
  { left: '82%', top: '78%' },
]

// ── 粒子扩散方向 ──
const PARTICLE_OFFSETS = [
  { x: -80, y: -100 },
  { x: 100, y: -70 },
  { x: -110, y: 60 },
  { x: 90, y: 80 },
  { x: 20, y: -120 },
  { x: -60, y: 110 },
]

function setParticleRef(el: any, index: number) {
  if (el) particleRefs.value[index] = el
}
function setTagRef(el: any, index: number) {
  if (el) tagRefs.value[index] = el
}
function setLineRef(el: any, index: number) {
  if (el) lineRefs.value[index] = el as unknown as SVGLineElement
}

/**
 * GSAP L3 编排序列
 */
async function runAnimation() {
  if (phase.value !== 'idle') return
  phase.value = 'animating'

  await nextTick()

  const identity = identityRef.value
  const avatar = avatarRef.value
  const nickname = nicknameRef.value
  const headline = headlineRef.value
  const tags = tagRefs.value
  const particles = particleRefs.value
  const lines = lineRefs.value

  if (!identity || !avatar || !nickname || !headline) return

  if (prefersReduced) {
    skipToReady()
    return
  }

  mainTimeline = gsap.timeline({
    onComplete: () => {
      phase.value = 'ready'
      startCtaBreath()
    },
  })

  // ═══ Phase 1: Avatar Reveal (0-2s) ═══
  mainTimeline.to(avatar, {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    duration: 0.8,
    ease: 'back.out(1.4)',
  })

  // 粒子散射 (0.8s)
  particles.forEach((p, i) => {
    mainTimeline!.to(p, { opacity: 0.8, duration: 0.01 }, 0.8)
    mainTimeline!.to(p, {
      x: PARTICLE_OFFSETS[i].x,
      y: PARTICLE_OFFSETS[i].y,
      opacity: 0,
      scale: 0.2,
      duration: 1.2,
      ease: 'power2.out',
    }, 0.81)
  })

  // 昵称 typewriter (1.2s)
  mainTimeline.call(() => { typewriterNickname() }, [], 1.2)

  if (hasRichContent.value) {
    // ═══ Phase 2: Trait Tags (2.0s) — 仅完整模式 ═══
    tags.forEach((tag, i) => {
      mainTimeline!.to(tag, {
        left: TAG_POSITIONS[i].left,
        top: TAG_POSITIONS[i].top,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
      }, 2.0 + i * 0.15)
    })

    mainTimeline.call(() => { drawConstellationLines() }, [], 2.6)

    // ═══ Phase 3: 身份上移 + Headline 入场 (3.2s) ═══
    // 身份组整体上移缩小，为 headline 腾出空间
    mainTimeline.to(identity, {
      y: -50, scale: 0.7, opacity: 0.25, duration: 0.6, ease: 'power2.inOut',
    }, 3.2)

    tags.forEach((tag) => {
      mainTimeline!.to(tag, {
        opacity: 0, scale: 0.6, duration: 0.4, ease: 'power2.inOut',
      }, 3.2)
    })
    lines.forEach((line) => {
      mainTimeline!.to(line, {
        opacity: 0, duration: 0.4, ease: 'power2.inOut',
      }, 3.2)
    })

    // Headline 从下方滑入
    mainTimeline.to(headline, {
      opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.2)',
    }, 3.5)
  } else {
    // ═══ 简洁模式：身份上移 + headline 滑入 ═══
    mainTimeline.to(identity, {
      y: -50, scale: 0.7, opacity: 0.25, duration: 0.5, ease: 'power2.inOut',
    }, 1.8)

    mainTimeline.to(headline, {
      opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.2)',
    }, 2.1)
  }
}

function typewriterNickname() {
  const el = nicknameRef.value
  if (!el) return

  const name = props.nickname || 'Explorer'
  let index = 0
  el.style.opacity = '1'

  const interval = setInterval(() => {
    index++
    el.textContent = name.slice(0, index) + (index < name.length ? '|' : '')
    if (index >= name.length) {
      clearInterval(interval)
      el.textContent = name
    }
  }, 80)
}

function drawConstellationLines() {
  const tags = tagRefs.value
  const lines = lineRefs.value
  const svg = constellationRef.value
  if (!svg || tags.length < 4 || lines.length < 4) return

  const svgRect = svg.getBoundingClientRect()

  function getCenter(tag: HTMLElement) {
    const r = tag.getBoundingClientRect()
    return {
      x: r.left - svgRect.left + r.width / 2,
      y: r.top - svgRect.top + r.height / 2,
    }
  }

  const centers = tags.map(getCenter)
  const connections = [[0, 1], [1, 3], [3, 2], [2, 0]]

  connections.forEach(([a, b], i) => {
    const line = lines[i]
    if (!line) return

    line.setAttribute('x1', String(centers[a].x))
    line.setAttribute('y1', String(centers[a].y))
    line.setAttribute('x2', String(centers[b].x))
    line.setAttribute('y2', String(centers[b].y))

    const len = Math.sqrt(
      (centers[b].x - centers[a].x) ** 2 + (centers[b].y - centers[a].y) ** 2,
    )
    line.setAttribute('stroke-dasharray', String(len))
    line.setAttribute('stroke-dashoffset', String(len))

    gsap.to(line, {
      attr: { 'stroke-dashoffset': 0 },
      duration: 0.4,
      delay: i * 0.08,
      ease: 'power2.out',
    })
  })
}

function startCtaBreath() {
  const cta = ctaRef.value
  if (!cta || prefersReduced) return

  ctaBreathTween = gsap.to(cta.querySelector('.launch-cta-glow'), {
    opacity: 0.6,
    scale: 1.08,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  })
}

function skipToReady() {
  if (mainTimeline) {
    mainTimeline.kill()
    mainTimeline = null
  }

  const identity = identityRef.value
  const avatar = avatarRef.value
  const nickname = nicknameRef.value
  const headline = headlineRef.value
  const tags = tagRefs.value
  const lines = lineRefs.value

  // 身份组：上移缩小 — 与 Phase 3 最终态一致
  if (identity) gsap.set(identity, { y: -50, scale: 0.7, opacity: 0.25 })
  if (avatar) gsap.set(avatar, { opacity: 1, filter: 'blur(0px)', scale: 1 })
  if (nickname) {
    nickname.textContent = props.nickname || 'Explorer'
    nickname.style.opacity = '1'
  }

  tags.forEach((tag, i) => {
    gsap.set(tag, {
      left: TAG_POSITIONS[i].left,
      top: TAG_POSITIONS[i].top,
      opacity: 0,
      scale: 0.6,
    })
  })
  lines.forEach(l => gsap.set(l, { opacity: 0 }))
  if (headline) gsap.set(headline, { opacity: 1, y: 0, scale: 1 })

  phase.value = 'ready'
  startCtaBreath()
}

// ── 提交逻辑 ──

function buildSubmitRequest(): OnboardingSubmitRequest {
  const interestsLabels = props.useCases
    .map(uc => USE_CASE_OPTIONS.find(o => o.value === uc)?.label ?? uc)
    .join('、')

  return {
    userName: props.nickname,
    occupation: props.occupation,
    useCases: props.useCases,
    interests: interestsLabels,
    communicationStyle: props.persona
      ? props.persona.dominantTraits.join(', ')
      : '',
    bigFive: props.persona?.bigFive ?? null,
    dominantTraits: props.persona?.dominantTraits ?? [],
    personaSummary: props.persona?.summary ?? '',
    avatarUrl: props.avatarUrl,
  }
}

async function handleLaunch() {
  if (isLaunching.value) return
  isLaunching.value = true
  phase.value = 'launching'

  const cta = ctaRef.value
  const flash = flashRef.value
  const fadeText = fadeTextRef.value

  if (cta) gsap.to(cta, { scale: 1.1, duration: 0.15, ease: 'power2.out' })
  await delay(150)

  if (flash) gsap.to(flash, { opacity: 1, duration: 0.12, ease: 'power2.out' })
  await delay(120)

  if (flash) gsap.to(flash, { opacity: 0, duration: 0.5, ease: 'power2.out' })
  await delay(200)

  if (fadeText) gsap.to(fadeText, { opacity: 1, duration: 0.6, ease: 'power2.out' })

  try {
    phase.value = 'submitting'
    await onboardingPageApi.submit(buildSubmitRequest())
    await delay(800)
    emit('launched')
  } catch (e) {
    console.warn('[Onboarding] 提交失败', e)
    if (fadeText) gsap.to(fadeText, { opacity: 0, duration: 0.4, ease: 'power2.out' })
    await delay(400)
    phase.value = 'submitFailed'
    isLaunching.value = false
  }
}

async function handleRetry() {
  if (isLaunching.value) return
  isLaunching.value = true

  const fadeText = fadeTextRef.value
  if (fadeText) gsap.to(fadeText, { opacity: 1, duration: 0.4, ease: 'power2.out' })

  try {
    phase.value = 'submitting'
    await onboardingPageApi.submit(buildSubmitRequest())
    await delay(600)
    emit('launched')
  } catch (e) {
    console.warn('[Onboarding] 重试提交失败', e)
    if (fadeText) gsap.to(fadeText, { opacity: 0, duration: 0.4, ease: 'power2.out' })
    await delay(400)
    phase.value = 'submitFailed'
    isLaunching.value = false
  }
}

function handleSkipAnimation() {
  if (phase.value === 'animating') {
    skipToReady()
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Lifecycle ──
onMounted(() => {
  nextTick(() => { runAnimation() })
})

onUnmounted(() => {
  mainTimeline?.kill()
  ctaBreathTween?.kill()
  if (sceneRef.value) gsap.killTweensOf(sceneRef.value)
  if (identityRef.value) gsap.killTweensOf(identityRef.value)
  tagRefs.value.forEach(t => gsap.killTweensOf(t))
  particleRefs.value.forEach(p => gsap.killTweensOf(p))
  lineRefs.value.forEach(l => gsap.killTweensOf(l))
})
</script>

<template>
  <div
    ref="sceneRef"
    class="relative w-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden"
  >
    <!-- 背景氛围光 -->
    <div class="launch-ambience" />

    <!-- 场景容器 -->
    <div class="relative w-full max-w-[640px] h-[360px] sm:h-[420px] flex flex-col items-center justify-center z-[1]">
      <!-- 粒子（仅完整模式） -->
      <template v-if="hasRichContent">
        <div
          v-for="i in 6"
          :key="'p' + i"
          :ref="(el) => setParticleRef(el, i - 1)"
          class="launch-particle"
        />
      </template>

      <!-- 星座连接线 SVG（仅完整模式） -->
      <svg
        v-if="hasRichContent"
        ref="constellationRef"
        class="absolute inset-0 z-[1] pointer-events-none"
      >
        <line
          v-for="i in 4"
          :key="'l' + i"
          :ref="(el) => setLineRef(el, i - 1)"
          class="launch-constellation-line"
          x1="0" y1="0" x2="0" y2="0"
          stroke-dasharray="200"
          stroke-dashoffset="200"
        />
      </svg>

      <!-- 身份组（Phase 3 整体上移缩小） -->
      <div ref="identityRef" class="launch-identity flex flex-col items-center z-[2]">
        <!-- 头像 -->
        <div
          ref="avatarRef"
          class="launch-avatar"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="nickname"
            class="w-full h-full object-cover rounded-full"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center rounded-full launch-avatar-placeholder text-primary-foreground text-[2.5rem] font-semibold"
          >
            {{ nickname?.charAt(0)?.toUpperCase() || '?' }}
          </div>
        </div>

        <!-- 昵称 -->
        <div
          ref="nicknameRef"
          class="launch-nickname mt-5 text-2xl font-semibold tracking-wider text-foreground min-h-8"
        />
      </div>

      <!-- 特质标签（仅完整模式） -->
      <template v-if="hasRichContent">
        <div
          v-for="(tag, i) in traitTags"
          :key="'tag' + i"
          :ref="(el) => setTagRef(el, i)"
          class="launch-tag"
        >
          {{ tag }}
        </div>
      </template>

      <!-- 主文案 + CTA（定位在下半区域，Phase 3 从下方滑入） -->
      <div
        ref="headlineRef"
        class="launch-headline absolute left-0 right-0 bottom-[8%] sm:bottom-[12%] text-center z-[5] flex flex-col items-center gap-6"
      >
        <h2 class="launch-title text-[1.3rem] sm:text-[1.6rem] font-semibold -tracking-wide px-4">
          {{ t('onboarding.launch.title') }}
        </h2>
        <p class="launch-subtitle text-[0.8125rem] sm:text-[0.8125rem] text-muted-foreground/70 tracking-wide -mt-2 px-8">
          {{ t('onboarding.launch.subtitle') }}
        </p>
        <button
          ref="ctaRef"
          class="launch-cta"
          type="button"
          :disabled="phase !== 'ready'"
          @click="handleLaunch"
        >
          <span class="launch-cta-glow" />
          <Rocket :size="18" />
          <span>{{ t('onboarding.launch.launchBtn') }}</span>
        </button>
      </div>

      <!-- 白色闪屏遮罩 -->
      <div
        ref="flashRef"
        class="absolute inset-0 bg-white opacity-0 z-10 pointer-events-none rounded-[inherit]"
      />

      <!-- 渐入文字遮罩 -->
      <div
        ref="fadeTextRef"
        class="absolute inset-0 flex items-center justify-center bg-background opacity-0 z-[11] pointer-events-none"
      >
        <span class="text-lg text-primary tracking-[0.15em] font-medium">{{ t('onboarding.launch.enterVolo') }}</span>
      </div>
    </div>

    <!-- 提交失败 UI -->
    <div
      v-if="phase === 'submitFailed'"
      class="absolute bottom-15 z-[12] flex flex-col items-center gap-3 px-6 py-4 rounded-[var(--radius-md)] border border-destructive/25 bg-destructive/5 backdrop-blur-md"
    >
      <p class="text-[0.8125rem] text-destructive text-center">
        {{ t('onboarding.launch.submitFailed') }}
      </p>
      <Button
        variant="destructive"
        size="sm"
        class="active:scale-95 transition-transform duration-100"
        @click="handleRetry"
      >
        {{ t('common.button.retry') }}
      </Button>
    </div>

    <!-- 跳过按钮（动画播放中） -->
    <button
      v-if="phase === 'animating'"
      class="absolute bottom-6 right-6 z-[8] px-4 py-2.5 min-h-[44px] bg-muted/30 border border-border/30 rounded-full text-muted-foreground text-xs cursor-pointer font-[inherit] hover:text-foreground hover:border-border/50 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-colors duration-200"
      type="button"
      @click="handleSkipAnimation"
    >
      {{ t('onboarding.launch.skipAnimation') }}
    </button>
  </div>
</template>

<style scoped>
/*
 * 仅保留 GSAP 动画初始态 + 伪元素 + keyframes + 渐变文字等
 * Tailwind 无法表达的部分
 */

/* ── 背景氛围光（双色大气：青色顶部 + 琥珀暖光右下） ── */
.launch-ambience {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* 主光源：青色（品牌色），顶部偏左 */
.launch-ambience::before {
  content: '';
  position: absolute;
  top: -25%;
  left: 40%;
  transform: translateX(-50%);
  width: 600px;
  height: 500px;
  background: radial-gradient(
    ellipse,
    color-mix(in srgb, var(--primary) 12%, transparent) 0%,
    color-mix(in srgb, var(--primary) 5%, transparent) 40%,
    transparent 70%
  );
  animation: ambience-pulse 8s ease-in-out infinite;
}

/* 辅光源：琥珀暖色，右下，制造温暖张力 */
.launch-ambience::after {
  content: '';
  position: absolute;
  bottom: -15%;
  right: -5%;
  width: 450px;
  height: 400px;
  background: radial-gradient(
    ellipse,
    color-mix(in srgb, var(--color-accent-warm-500) 9%, transparent) 0%,
    color-mix(in srgb, var(--color-accent-warm-400) 4%, transparent) 40%,
    transparent 65%
  );
  animation: ambience-warm 10s ease-in-out infinite 1s;
}

@keyframes ambience-pulse {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}

@keyframes ambience-warm {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.06); }
}

/* ── 头像 GSAP 初始态 + 光环伪元素 ── */
.launch-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  z-index: 2;
  /* GSAP 初始态 */
  opacity: 0;
  filter: blur(30px);
  transform: scale(0.6);
}

.launch-avatar::after {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--primary) 40%, transparent),
    color-mix(in srgb, var(--color-accent-warm-500) 30%, transparent),
    color-mix(in srgb, var(--primary) 40%, transparent)
  );
  mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 2px));
  pointer-events: none;
  animation: avatar-ring-rotate 6s linear infinite;
}

@keyframes avatar-ring-rotate {
  to { transform: rotate(360deg); }
}

/* 头像 placeholder 渐变（无图片时） */
.launch-avatar-placeholder {
  background: linear-gradient(135deg, var(--primary), var(--color-primary-600), color-mix(in srgb, var(--color-accent-warm-500) 80%, transparent));
}

/* ── 昵称 GSAP 初始态 ── */
.launch-nickname {
  opacity: 0;
}

/* ── 粒子 GSAP 初始态（交替青色/暖色） ── */
.launch-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0;
  z-index: 1;
  pointer-events: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.launch-particle:nth-child(odd) {
  background: var(--color-accent-warm-400);
}

/* ── 特质标签 GSAP 初始态 + 毛玻璃 ── */
.launch-tag {
  position: absolute;
  padding: 8px 18px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  color: var(--muted-foreground);
  white-space: nowrap;
  z-index: 3;
  box-shadow: 0 0 20px color-mix(in srgb, var(--primary) 5%, transparent);
  /* GSAP 初始态 */
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
  left: 50%;
  top: 50%;
}

/* ── 星座连接线 SVG ── */
.launch-constellation-line {
  stroke: color-mix(in srgb, var(--primary) 8%, transparent);
  stroke-width: 1;
}

/* ── 主文案 GSAP 初始态（从下方 30px 滑入） ── */
.launch-headline {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

/* ── 渐变标题（三色渐变：前景色 → 品牌青 → 琥珀暖） ── */
.launch-title {
  background: linear-gradient(135deg, var(--foreground) 15%, var(--primary) 55%, var(--color-accent-warm-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── 副标题 ── */
.launch-subtitle {
  letter-spacing: 0.08em;
}

/* ── CTA 按钮（青-暖渐变 + 呼吸光晕） ── */
.launch-cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 48px;
  background: linear-gradient(135deg, var(--primary), var(--color-primary-600), var(--color-accent-warm-600));
  border: none;
  border-radius: var(--radius-full);
  color: var(--primary-foreground);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  cursor: pointer;
  overflow: visible;
  font-family: inherit;
  transition: transform 0.15s var(--ease-fluid);
  box-shadow: var(--shadow-glow), 0 2px 10px color-mix(in srgb, var(--color-accent-warm-500) 15%, transparent);
}

.launch-cta:hover:not(:disabled) {
  transform: translateY(-1px);
}

.launch-cta:active:not(:disabled) {
  transform: scale(0.95);
}

.launch-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.launch-cta:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.launch-cta-glow {
  position: absolute;
  inset: -6px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--primary), var(--color-primary-600), var(--color-accent-warm-600));
  opacity: 0.35;
  filter: blur(20px);
  z-index: -1;
  pointer-events: none;
}

/* ── 响应式 ── */
@media (max-width: 640px) {
  .launch-avatar {
    width: 96px;
    height: 96px;
  }

  .launch-cta {
    padding: 12px 36px;
    font-size: 0.95rem;
  }

  .launch-tag {
    font-size: 0.75rem;
    padding: 6px 14px;
  }
}

/* ── prefers-reduced-motion ── */
@media (prefers-reduced-motion: reduce) {
  .launch-ambience::before,
  .launch-ambience::after {
    animation: none;
  }

  .launch-avatar::after {
    animation: none;
  }
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .launch-ambience::before {
    background: radial-gradient(
      ellipse,
      color-mix(in srgb, var(--primary) 8%, transparent) 0%,
      color-mix(in srgb, var(--primary) 3%, transparent) 40%,
      transparent 70%
    );
  }

  .launch-ambience::after {
    background: radial-gradient(
      ellipse,
      color-mix(in srgb, var(--color-accent-warm-500) 6%, transparent) 0%,
      color-mix(in srgb, var(--color-accent-warm-400) 2%, transparent) 40%,
      transparent 65%
    );
  }

  .launch-tag {
    background: rgba(255, 255, 255, 0.06);
    border-color: color-mix(in srgb, var(--primary) 12%, transparent);
  }

  .launch-cta {
    box-shadow: var(--shadow-glow), 0 2px 10px color-mix(in srgb, var(--color-accent-warm-500) 8%, transparent);
  }
}
</style>
