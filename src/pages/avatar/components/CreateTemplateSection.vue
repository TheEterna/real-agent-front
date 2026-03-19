<!-- ================================================
  CreateTemplateSection — 创建分身：模版选择区
  职责：水平滚动卡片行，选择分身风格模版
  Props: selectedId
  Emits: select
================================================ -->
<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Check } from 'lucide-vue-next'
import gsap from 'gsap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useI18n } from 'vue-i18n'
import { AVATAR_TEMPLATES } from '../constants/templates'

// ==================== Props & Emits ====================

const props = defineProps<{
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

// ==================== Reduced motion ====================

const { t } = useI18n()
const { prefersReduced, duration } = useReducedMotion()

// ==================== Refs ====================

const cardRefs = ref<HTMLElement[]>([])
const checkRefs = ref<Record<string, HTMLElement | null>>({})

// ==================== Handlers ====================

function handleSelect(id: string) {
  emit('select', id)
}

// ==================== GSAP: check 弹入 ====================

watch(
  () => props.selectedId,
  async (newId, oldId) => {
    if (!newId || newId === oldId) return
    await nextTick()
    const checkEl = checkRefs.value[newId]
    if (!checkEl || prefersReduced.value) return
    gsap.fromTo(
      checkEl,
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.5)' },
    )
  },
)

// ==================== GSAP: 入场 stagger ====================

onMounted(() => {
  if (!cardRefs.value.length) return
  gsap.from(cardRefs.value, {
    y: 12,
    opacity: 0,
    scale: 0.97,
    duration: duration.value,
    ease: 'back.out(1.4)',
    stagger: 0.05,
    clearProps: 'opacity,transform',
  })
})

// ==================== GSAP 清理 ====================

onUnmounted(() => {
  cardRefs.value.forEach((el) => {
    if (el) gsap.killTweensOf(el)
  })
  Object.values(checkRefs.value).forEach((el) => {
    if (el) gsap.killTweensOf(el)
  })
})
</script>

<template>
  <section class="space-y-3">
    <!-- Section 标题 -->
    <div>
      <h3 class="text-lg font-semibold text-foreground">
        {{ t('avatar.template.selectTitle') }}
      </h3>
      <p class="text-sm text-muted-foreground mt-0.5">
        {{ t('avatar.template.selectSubtitle') }}
      </p>
    </div>

    <!-- 网格容器（对齐设计稿 3 列） -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="(tpl, idx) in AVATAR_TEMPLATES"
          :key="tpl.id"
          :ref="(el) => { if (el) cardRefs[idx] = el as HTMLElement }"
          class="template-card group relative flex flex-col items-center rounded-lg border p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]"
          :class="[
            selectedId === tpl.id
              ? 'border-primary bg-card shadow-sm scale-[1.02]'
              : selectedId !== null
                ? 'opacity-50 bg-card border-border hover:opacity-80 hover:border-foreground/20 hover:scale-[1.01]'
                : 'bg-card border-border hover:border-foreground/20 hover:shadow-sm hover:scale-[1.01]',
            tpl.highlight && selectedId !== tpl.id ? 'template-card--highlight' : '',
          ]"
          @click="handleSelect(tpl.id)"
        >
          <!-- 推荐标签（highlight 卡片） -->
          <span
            v-if="tpl.highlight"
            class="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
          >
            {{ t('avatar.template.recommend') }}
          </span>

          <!-- 选中 check 圆圈 -->
          <div
            v-if="selectedId === tpl.id"
            :ref="(el) => { checkRefs[tpl.id] = el as HTMLElement | null }"
            class="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check :size="14" :stroke-width="3" />
          </div>

          <!-- 圆形图标区 -->
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            :class="[
              selectedId === tpl.id
                ? 'bg-primary/10'
                : 'bg-muted group-hover:bg-muted/80',
            ]"
          >
            {{ tpl.icon }}
          </div>

          <!-- 名称 -->
          <span class="mt-3 text-sm font-semibold text-foreground text-center leading-snug">
            {{ tpl.name }}
          </span>

          <!-- 描述（最多2行） -->
          <span
            class="mt-1 text-xs text-muted-foreground text-center leading-relaxed line-clamp-2"
          >
            {{ tpl.description }}
          </span>

          <!-- 能力示例 -->
          <div
            v-if="tpl.examples && tpl.examples.length > 0"
            class="mt-2 flex flex-wrap justify-center gap-1"
          >
            <span
              v-for="(example, exIdx) in tpl.examples.slice(0, 2)"
              :key="exIdx"
              class="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs text-primary/80"
            >
              {{ example }}
            </span>
          </div>
        </button>
    </div>
  </section>
</template>

<style scoped>
/* 卡片过渡（仅 transform + opacity，GPU 加速） */
.template-card {
  transition:
    transform 200ms var(--ease-fluid),
    border-color 200ms var(--ease-fluid),
    box-shadow 200ms var(--ease-fluid),
    opacity 200ms var(--ease-fluid);
}

/* highlight 金色渐变边框（伪元素实现，兼容 border-radius） */
.template-card--highlight {
  border-color: transparent;
  position: relative;
}
.template-card--highlight::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--color-amber-500, #f59e0b), var(--color-amber-400, #fbbf24));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}

/* prefers-reduced-motion 降级 */
@media (prefers-reduced-motion: reduce) {
  .template-card {
    transition: none;
  }
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  /* 选中卡片 glow 暗色降低 */
  .template-card.shadow-\[var\(--glow-subtle\)\] {
    --tw-shadow-color: rgba(99, 102, 241, 0.12);
  }

  /* highlight 金色渐变边框暗色适配 */
  .template-card--highlight::before {
    background: linear-gradient(135deg, var(--color-amber-600, #d97706), var(--color-amber-500, #f59e0b));
    opacity: 0.8;
  }

  /* 推荐标签暗色适配 */
  .template-card .bg-gradient-to-r.from-amber-500.to-amber-400 {
    opacity: 0.9;
  }
}
</style>
