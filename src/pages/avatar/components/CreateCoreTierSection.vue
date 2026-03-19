<!-- ================================================
  CreateCoreTierSection — 创建分身：内核选择区
  职责：三列网格展示内核等级，根据用户会员锁定不可用等级
  Props: selectedTier, userTier
  Emits: select, upgrade
================================================ -->
<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Check, Lock } from 'lucide-vue-next'
import gsap from 'gsap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useI18n } from 'vue-i18n'
import type { AvatarCoreTier } from '../types'
import type { TierType } from '@/types/subscription'
import {
  CORE_TIERS,
  CORE_TIER_SPECS,
  TIER_LEVELS,
  getRequiredTierLabel,
} from '../constants/templates'

// ==================== Props & Emits ====================

const props = defineProps<{
  selectedTier: AvatarCoreTier | null
  userTier: TierType
}>()

const emit = defineEmits<{
  select: [tier: AvatarCoreTier]
  upgrade: []
}>()

// ==================== Reduced motion ====================

const { t } = useI18n()
const { prefersReduced, duration } = useReducedMotion()

// ==================== Refs ====================

const cardRefs = ref<HTMLElement[]>([])
const upgradePromptRefs = ref<Record<string, HTMLElement | null>>({})

/** 点击锁定卡片后显示升级提示的 tier */
const showUpgradePrompt = ref<AvatarCoreTier | null>(null)

// ==================== Computed ====================

function isLocked(tier: AvatarCoreTier): boolean {
  const spec = CORE_TIER_SPECS[tier]
  return TIER_LEVELS[props.userTier] < TIER_LEVELS[spec.requiredTier]
}

/** 格式化能力值 */
function formatCapValue(val: number | null): string {
  return val === null ? t('avatar.coreTier.unlimited') : String(val)
}

/** 多模态能力标签 */
const multimodalLabels = computed<Record<string, string>>(() => ({
  text: t('avatar.coreTier.multimodalText'),
  image: t('avatar.coreTier.multimodalImage'),
  voice: t('avatar.coreTier.multimodalVoice'),
  video: t('avatar.coreTier.multimodalVideo'),
}))

function formatMultimodal(arr: string[]): string {
  return arr.map((m) => multimodalLabels.value[m] || m).join(' / ')
}

// ==================== Handlers ====================

function handleCardClick(tier: AvatarCoreTier) {
  if (isLocked(tier)) {
    showUpgradePrompt.value = tier
    return
  }
  showUpgradePrompt.value = null
  emit('select', tier)
}

function handleUpgradeClick() {
  emit('upgrade')
}

// ==================== GSAP: 升级提示条 slide-in ====================

watch(showUpgradePrompt, async (newTier) => {
  if (!newTier) return
  await nextTick()
  const el = upgradePromptRefs.value[newTier]
  if (!el || prefersReduced.value) return
  gsap.fromTo(
    el,
    { y: -8, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.25, ease: 'power2.out' },
  )
})

// ==================== GSAP: 入场 stagger ====================

onMounted(() => {
  if (!cardRefs.value.length) return
  gsap.from(cardRefs.value, {
    y: 12,
    opacity: 0,
    scale: 0.97,
    duration: duration.value,
    ease: 'back.out(1.4)',
    stagger: 0.08,
    clearProps: 'opacity,transform',
  })
})

// ==================== GSAP 清理 ====================

onUnmounted(() => {
  cardRefs.value.forEach((el) => {
    if (el) gsap.killTweensOf(el)
  })
  Object.values(upgradePromptRefs.value).forEach((el) => {
    if (el) gsap.killTweensOf(el)
  })
})
</script>

<template>
  <section class="space-y-3">
    <!-- Section 标题 -->
    <div>
      <h3 class="text-lg font-semibold text-foreground">
        {{ t('avatar.coreTier.selectTitle') }}
      </h3>
      <p class="text-sm text-muted-foreground mt-0.5">
        {{ t('avatar.coreTier.selectSubtitle') }}
      </p>
    </div>

    <!-- 三列网格 -->
    <div class="grid grid-cols-1 gap-4 min-[375px]:grid-cols-3">
      <div
        v-for="(tier, idx) in CORE_TIERS"
        :key="tier"
        class="flex flex-col gap-2"
      >
        <!-- 内核卡片 -->
        <button
          :ref="(el) => { if (el) cardRefs[idx] = el as HTMLElement }"
          class="core-tier-card group relative flex flex-col rounded-lg border p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98]"
          :class="[
            isLocked(tier)
              ? 'cursor-not-allowed bg-card border-border'
              : selectedTier === tier
                ? 'border-primary bg-card shadow-[var(--glow-subtle)]'
                : selectedTier !== null
                  ? 'opacity-50 bg-card border-border hover:opacity-80 hover:border-foreground/20 hover:shadow-sm'
                  : 'bg-card border-border hover:border-foreground/20 hover:shadow-sm',
          ]"
          :aria-label="`${CORE_TIER_SPECS[tier].label}${isLocked(tier) ? t('avatar.coreTier.unlockRequired') : ''}`"
          @click="handleCardClick(tier)"
        >
          <!-- 锁定覆盖层 -->
          <div
            v-if="isLocked(tier)"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-background/60"
          >
            <Lock :size="24" class="text-muted-foreground mb-1.5" />
            <span class="text-xs font-medium text-muted-foreground">
              {{ t('avatar.coreTier.upgradeToUnlock', { tier: getRequiredTierLabel(tier) }) }}
            </span>
          </div>

          <!-- 顶部：icon + 名称 + 描述 -->
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
              :class="[
                selectedTier === tier && !isLocked(tier)
                  ? 'bg-primary/10'
                  : 'bg-muted',
              ]"
            >
              {{ CORE_TIER_SPECS[tier].icon }}
            </div>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-foreground leading-snug">
                {{ CORE_TIER_SPECS[tier].label }}
              </div>
              <div class="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {{ CORE_TIER_SPECS[tier].description }}
              </div>
            </div>
          </div>

          <!-- 中部：能力列表 -->
          <ul class="mt-4 space-y-2">
            <li class="flex items-center gap-2 text-xs text-foreground/80">
              <Check :size="14" class="shrink-0 text-primary" />
              <span>{{ t('avatar.coreTier.dailyActions') }}<strong>{{ formatCapValue(CORE_TIER_SPECS[tier].maxActionsPerDay) }}</strong></span>
            </li>
            <li class="flex items-center gap-2 text-xs text-foreground/80">
              <Check :size="14" class="shrink-0 text-primary" />
              <span>{{ t('avatar.coreTier.knowledgeBase') }}<strong>{{ formatCapValue(CORE_TIER_SPECS[tier].maxKnowledgeDocs) }}</strong>{{ t('avatar.coreTier.knowledgeUnit') }}</span>
            </li>
            <li class="flex items-center gap-2 text-xs text-foreground/80">
              <Check :size="14" class="shrink-0 text-primary" />
              <span>{{ t('avatar.coreTier.toolCount') }}<strong>{{ formatCapValue(CORE_TIER_SPECS[tier].maxTools) }}</strong>{{ t('avatar.coreTier.toolUnit') }}</span>
            </li>
            <li class="flex items-center gap-2 text-xs text-foreground/80">
              <Check :size="14" class="shrink-0 text-primary" />
              <span>{{ t('avatar.coreTier.multimodal') }}<strong>{{ formatMultimodal(CORE_TIER_SPECS[tier].multimodal) }}</strong></span>
            </li>
            <li class="flex items-center gap-2 text-xs text-foreground/80">
              <Check :size="14" class="shrink-0 text-primary" />
              <span>{{ t('avatar.coreTier.contextWindow') }}<strong>{{ CORE_TIER_SPECS[tier].contextWindow }}</strong></span>
            </li>
          </ul>

          <!-- 底部：会员要求标签 -->
          <div class="mt-auto pt-4">
            <span
              class="inline-block rounded-full px-2.5 py-1 text-xs font-medium"
              :class="[
                CORE_TIER_SPECS[tier].requiredTier === 'free'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : CORE_TIER_SPECS[tier].requiredTier === 'pro'
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-purple-500/10 text-purple-600',
              ]"
            >
              {{ t('avatar.coreTier.available', { tier: getRequiredTierLabel(tier) }) }}
            </span>
          </div>

          <!-- 选中指示器 -->
          <div
            v-if="selectedTier === tier && !isLocked(tier)"
            class="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check :size="12" :stroke-width="3" />
          </div>
        </button>

        <!-- 升级提示条（点击锁定卡片后显示） -->
        <div
          v-if="showUpgradePrompt === tier && isLocked(tier)"
          :ref="(el) => { upgradePromptRefs[tier] = el as HTMLElement | null }"
          class="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 cursor-pointer hover:bg-amber-500/15 active:scale-[0.98]"
          role="button"
          tabindex="0"
          @click="handleUpgradeClick"
          @keydown.enter="handleUpgradeClick"
          @keydown.space.prevent="handleUpgradeClick"
        >
          <span class="text-xs font-medium text-amber-700 dark:text-amber-400">
            {{ t('avatar.coreTier.upgradePrompt', { tier: getRequiredTierLabel(tier) }) }}
          </span>
          <span class="text-xs font-semibold text-amber-600 dark:text-amber-300">
            {{ t('avatar.coreTier.goUpgrade') }} &rarr;
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 卡片过渡（仅 transform + opacity + border + shadow，GPU 加速） */
.core-tier-card {
  transition:
    transform 200ms var(--ease-fluid),
    border-color 200ms var(--ease-fluid),
    box-shadow 200ms var(--ease-fluid),
    opacity 200ms var(--ease-fluid);
}

/* prefers-reduced-motion 降级 */
@media (prefers-reduced-motion: reduce) {
  .core-tier-card {
    transition: none;
  }
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .core-tier-card {
    &[class*='shadow-'] {
      --tw-shadow-color: rgba(99, 102, 241, 0.15);
    }
  }

  /* 锁定覆盖层 */
  .core-tier-card .absolute.bg-background\/60 {
    background: rgba(0, 0, 0, 0.65);
  }

  /* 会员标签暗色适配 */
  .bg-emerald-500\/10 {
    background: rgba(16, 185, 129, 0.15);
    &.text-emerald-600 {
      color: var(--color-emerald-300, #6ee7b7);
    }
  }
  .bg-blue-500\/10 {
    background: rgba(59, 130, 246, 0.15);
    &.text-blue-600 {
      color: var(--color-blue-300, #93c5fd);
    }
  }
  .bg-purple-500\/10 {
    background: rgba(139, 92, 246, 0.15);
    &.text-purple-600 {
      color: var(--color-purple-300, #c4b5fd);
    }
  }
}
</style>
