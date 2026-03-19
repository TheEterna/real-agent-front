<!-- ================================================
  CreateExtraSocial — 社交偏好单选
  职责：3 档社交频率芯片单选，emit socialFrequency
================================================ -->
<template>
  <div ref="rootRef" class="space-y-3">
    <h4 class="text-sm font-medium text-foreground">{{ t('avatar.social.title') }}</h4>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 min-h-[44px]"
        :class="[
          selected === option.value
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-muted border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground hover:bg-accent/50',
        ]"
        @click="select(option.value)"
      >
        <span class="mr-1.5">{{ option.emoji }}</span>
        <span>{{ option.label }}</span>
        <span
          class="ml-1.5 text-xs opacity-60"
        >{{ option.description }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import gsap from "gsap"
import { useReducedMotion } from "@/composables/useReducedMotion"
import { useI18n } from 'vue-i18n'

type SocialFrequency = "low" | "moderate" | "high"

interface SocialOption {
  value: SocialFrequency
  emoji: string
  label: string
  description: string
}

const emit = defineEmits<{
  "update:data": [data: { socialFrequency: SocialFrequency }]
}>()

const { t } = useI18n()
const { prefersReduced } = useReducedMotion()
const rootRef = ref<HTMLElement>()
const selected = ref<SocialFrequency | null>(null)

const options = computed<SocialOption[]>(() => [
  {
    value: "low",
    emoji: "\uD83D\uDD0D",
    label: t('avatar.social.low'),
    description: t('avatar.social.lowDesc'),
  },
  {
    value: "moderate",
    emoji: "\uD83D\uDCAC",
    label: t('avatar.social.moderate'),
    description: t('avatar.social.moderateDesc'),
  },
  {
    value: "high",
    emoji: "\uD83D\uDD25",
    label: t('avatar.social.high'),
    description: t('avatar.social.highDesc'),
  },
])

function select(value: SocialFrequency) {
  selected.value = value
  emit("update:data", { socialFrequency: value })
}

// --- GSAP ---
onMounted(() => {
  if (prefersReduced.value || !rootRef.value) return
  gsap.from(rootRef.value, {
    opacity: 0,
    y: 8,
    duration: 0.25,
    ease: "power2.out",
  })
})

onUnmounted(() => {
  if (rootRef.value) gsap.killTweensOf(rootRef.value)
})
</script>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  /* Social buttons use semantic Tailwind tokens (bg-primary/10, text-primary, bg-muted, etc.)
     which adapt via CSS variables. No additional dark overrides needed. */
}
</style>
