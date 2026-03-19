<!-- ================================================
  AvatarCapabilityTab — 分身能力配置 Tab
  职责：工具/技能绑定配置面板，配额展示
  状态：后端 API 未实现，暂显示"即将上线"占位
================================================ -->
<template>
  <div ref="panelRef" class="mx-auto max-w-5xl px-6 py-8">
    <!-- 即将上线占位 -->
    <div class="cap-section flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/30 py-20 text-center">
      <div class="mb-4 flex items-center gap-2 text-muted-foreground/60">
        <Wrench :size="20" />
        <span class="text-lg">+</span>
        <Sparkles :size="20" />
      </div>
      <h3 class="mb-2 text-lg font-semibold text-foreground/80">{{ t('avatar.capability.comingSoonTitle') }}</h3>
      <p class="max-w-sm text-base leading-relaxed text-muted-foreground">
        {{ t('avatar.capability.comingSoonDesc') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Wrench, Sparkles } from 'lucide-vue-next'
import gsap from 'gsap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useI18n } from 'vue-i18n'

defineProps<{ avatarId: string }>()
const { t } = useI18n()
const { prefersReduced } = useReducedMotion()

// ---- 入场动画 ----
const panelRef = ref<HTMLElement>()
let entryAnims: gsap.core.Tween[] = []

onMounted(() => {
  if (prefersReduced.value || !panelRef.value) return
  nextTick(() => {
    const sections = panelRef.value?.querySelectorAll('.cap-section')
    if (!sections) return
    sections.forEach((section, i) => {
      entryAnims.push(gsap.from(section, {
        y: 16, opacity: 0, scale: 0.98,
        duration: 0.35, delay: i * 0.06,
        ease: 'back.out(1.2)',
      }))
    })
  })
})

onUnmounted(() => {
  entryAnims.forEach((t) => t.kill())
  entryAnims = []
  if (panelRef.value) {
    gsap.killTweensOf(panelRef.value.querySelectorAll('.cap-section'))
  }
})
</script>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .cap-section {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
  }
}
</style>
