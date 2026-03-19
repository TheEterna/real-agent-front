<script setup lang="ts">
/**
 * PersonaCard - AI 人格画像结果卡片
 *
 * 展示大五人格条形图、特质标签、AI 总结。
 * GSAP L2/L3 入场动画：条形柱交错增长 + 标签交错淡入。
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { PersonaProfile } from '../types'

const props = defineProps<{
  profile: PersonaProfile
  nickname: string
}>()

const { prefersReduced, duration } = useReducedMotion()
const { t } = useI18n()

const cardRef = ref<HTMLElement>()
const barRefs = ref<HTMLElement[]>([])
const traitRefs = ref<HTMLElement[]>([])
const summaryRef = ref<HTMLElement>()

let tweens: gsap.core.Tween[] = []
let tl: gsap.core.Timeline | null = null

const dimensions = computed(() => [
  { key: 'openness' as const, label: t('onboarding.personaCard.dimOpenness'), color: 'from-violet-400 to-purple-500' },
  { key: 'conscientiousness' as const, label: t('onboarding.personaCard.dimConscientiousness'), color: 'from-blue-400 to-cyan-500' },
  { key: 'extraversion' as const, label: t('onboarding.personaCard.dimExtraversion'), color: 'from-amber-400 to-orange-500' },
  { key: 'agreeableness' as const, label: t('onboarding.personaCard.dimAgreeableness'), color: 'from-emerald-400 to-teal-500' },
  { key: 'neuroticism' as const, label: t('onboarding.personaCard.dimNeuroticism'), color: 'from-rose-400 to-pink-500' },
])

function setBarRef(el: any, index: number) {
  if (el) barRefs.value[index] = el
}

function setTraitRef(el: any, index: number) {
  if (el) traitRefs.value[index] = el
}

onMounted(async () => {
  await nextTick()
  if (!cardRef.value) return

  if (prefersReduced.value) {
    // No animation; just show everything
    barRefs.value.forEach((bar, i) => {
      const key = dimensions.value[i].key
      bar.style.width = `${props.profile.bigFive[key]}%`
      bar.style.opacity = '1'
    })
    traitRefs.value.forEach((t) => {
      t.style.opacity = '1'
    })
    if (summaryRef.value) summaryRef.value.style.opacity = '1'
    return
  }

  tl = gsap.timeline({ delay: 0.2 })

  // Card entrance
  tl.from(cardRef.value, {
    y: 16,
    opacity: 0,
    scale: 0.97,
    duration: duration.value || 0.4,
    ease: 'back.out(1.4)',
  })

  // Bar chart stagger
  barRefs.value.forEach((bar, i) => {
    const key = dimensions.value[i].key
    const targetWidth = props.profile.bigFive[key]

    bar.style.width = '0%'
    bar.style.opacity = '1'

    tl!.to(bar, {
      width: `${targetWidth}%`,
      duration: 0.5,
      ease: 'power2.out',
    }, `-=${i === 0 ? 0 : 0.44}`) // stagger ~60ms
  })

  // Trait badges stagger
  traitRefs.value.forEach((el, i) => {
    tl!.from(el, {
      opacity: 0,
      y: 8,
      scale: 0.9,
      duration: 0.3,
      ease: 'back.out(1.2)',
    }, `-=${i === 0 ? 0.1 : 0.24}`)
  })

  // Summary fade in
  if (summaryRef.value) {
    tl.from(summaryRef.value, {
      opacity: 0,
      y: 6,
      duration: 0.35,
      ease: 'power2.out',
    }, '-=0.15')
  }
})

onUnmounted(() => {
  tl?.kill()
  tweens.forEach((t) => t.kill())
  if (cardRef.value) gsap.killTweensOf(cardRef.value)
  barRefs.value.forEach((el) => gsap.killTweensOf(el))
  traitRefs.value.forEach((el) => gsap.killTweensOf(el))
  if (summaryRef.value) gsap.killTweensOf(summaryRef.value)
})
</script>

<template>
  <div
    ref="cardRef"
    class="persona-card rounded-xl border border-border/50 bg-card p-6 shadow-sm"
  >
    <!-- Title -->
    <h3 class="mb-5 text-lg font-semibold tracking-tight text-foreground">
      {{ t('onboarding.personaCard.title', { nickname }) }}
    </h3>

    <!-- Big Five bar chart -->
    <div class="mb-5 space-y-3">
      <div
        v-for="(dim, index) in dimensions"
        :key="dim.key"
        class="flex items-center gap-3"
      >
        <span class="w-16 shrink-0 text-right text-sm text-muted-foreground">
          {{ dim.label }}
        </span>
        <div class="relative h-5 flex-1 overflow-hidden rounded-full bg-muted/50">
          <div
            :ref="(el) => setBarRef(el, index)"
            class="persona-bar absolute inset-y-0 left-0 rounded-full bg-gradient-to-r opacity-0"
            :class="dim.color"
            :style="{ width: `${profile.bigFive[dim.key]}%` }"
          />
        </div>
        <span class="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
          {{ profile.bigFive[dim.key] }}
        </span>
      </div>
    </div>

    <!-- Dominant traits -->
    <div class="mb-4 flex flex-wrap gap-2">
      <span
        v-for="(trait, index) in profile.dominantTraits"
        :key="trait"
        :ref="(el) => setTraitRef(el, index)"
        class="persona-trait inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
      >
        {{ trait }}
      </span>
    </div>

    <!-- AI Summary -->
    <p
      ref="summaryRef"
      class="text-base italic text-muted-foreground"
    >
      {{ profile.summary }}
    </p>
  </div>
</template>

<style lang="scss">
/* Dark mode (non-scoped for .dark on <html>) */
.dark {
  .persona-card {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .persona-bar {
    filter: saturate(0.85);
  }

  .persona-trait {
    background: color-mix(in srgb, var(--primary) 15%, transparent);
  }
}
</style>
