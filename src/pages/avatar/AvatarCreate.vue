<!-- ================================================
  AvatarCreate -- 数字分身沉浸式创建页
  职责：薄编排层，组合模版选择、内核选择、
        模版专属配置、底部栏
  路由：/avatar/create
================================================ -->
<template>
  <div class="min-h-full bg-background relative">
    <!-- 环境光 -->
    <div
      ref="ambienceRef"
      class="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      style="background: radial-gradient(ellipse 80% 50% at 50% 30%, hsl(var(--primary) / 0.07), hsl(var(--primary) / 0.025), transparent 70%)"
    />

    <!-- 返回按钮（绝对定位左上角，毛玻璃） -->
    <div class="absolute left-4 top-4 z-30 sm:left-6 sm:top-6">
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="flex h-11 w-11 items-center justify-center rounded-xl backdrop-blur-md bg-background/60 border border-border transition-all hover:bg-background/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              :aria-label="t('avatar.create.backToList')"
              @click="handleBack"
            >
              <ArrowLeft :size="18" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            :side-offset="6"
            class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {{ t('avatar.list.back') }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- 主内容 -->
    <div class="relative z-10 mx-auto max-w-[960px] px-4 pb-44 sm:px-8">
      <!-- Hero -->
      <div ref="heroRef" class="pt-24 pb-16 text-center">
        <h1 class="text-3xl font-extralight tracking-tight text-foreground sm:text-4xl">
          {{ t('avatar.create.heroTitle') }}
        </h1>
        <p class="mt-3 text-base text-muted-foreground">
          {{ t('avatar.create.heroSubtitle') }}
        </p>
      </div>

      <!-- Section 1: 模版选择 -->
      <div ref="section1Ref" class="mb-12">
        <CreateTemplateSection
          :selected-id="ctx.selectedTemplateId.value"
          @select="ctx.selectTemplate"
        />
      </div>

      <!-- Section 2: 内核选择（折叠面板 - 渐进式披露） -->
      <div ref="section2Ref" class="mb-12">
        <div class="rounded-lg border bg-card/50 overflow-hidden">
          <!-- 折叠触发器 -->
          <button
            class="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
            :aria-expanded="isCoreTierExpanded"
            @click="isCoreTierExpanded = !isCoreTierExpanded"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap :size="18" class="text-primary" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-foreground">{{ t('avatar.create.coreTitle') }}</h3>
                <p class="text-xs text-muted-foreground">
                  {{ isCoreTierExpanded ? t('avatar.create.coreExpandedDesc') : t('avatar.create.coreCollapsedDesc', { tier: getTierLabel(ctx.selectedCoreTier.value ?? '') }) }}
                </p>
              </div>
            </div>
            <ChevronDown
              :size="20"
              class="text-muted-foreground transition-transform duration-200"
              :class="{ 'rotate-180': isCoreTierExpanded }"
            />
          </button>

          <!-- 折叠内容 -->
          <div
            v-show="isCoreTierExpanded"
            class="border-t px-4 pb-4"
          >
            <CreateCoreTierSection
              :selected-tier="ctx.selectedCoreTier.value"
              :user-tier="ctx.userTier.value"
              @select="ctx.selectCoreTier"
              @upgrade="openPricing"
            />
          </div>
        </div>
      </div>

      <!-- Section 3: 模版专属配置 -->
      <div ref="section3Ref" class="mb-12">
        <CreateExtraStep
          :template-id="ctx.selectedTemplateId.value"
          :portrait="ctx.portrait.value"
          :is-loading-portrait="ctx.isLoadingPortrait.value"
          :model-value="ctx.extraData.value"
          @update:model-value="handleExtraData"
        />
      </div>
    </div>

    <!-- 底部栏 -->
    <CreateBottomBar
      :avatar-name="ctx.avatarName.value"
      :can-create="ctx.canCreate.value"
      :is-creating="ctx.isCreating.value"
      :create-success="ctx.createSuccess.value"
      :quota-current="avatarStore.avatarQuota.current"
      :quota-max="avatarStore.avatarQuota.max"
      :quota-is-ultra="avatarStore.avatarQuota.isUltra"
      :template-id="ctx.selectedTemplateId.value"
      @update:avatar-name="ctx.avatarName.value = $event"
      @create="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronDown, Zap } from 'lucide-vue-next'
import gsap from 'gsap'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useModalRoute } from '@/composables/useModalRoute'
import { useAvatarStore } from '@/stores/avatarStore'
import { useAvatarCreate } from './composables/useAvatarCreate'
import CreateTemplateSection from './components/CreateTemplateSection.vue'
import CreateCoreTierSection from './components/CreateCoreTierSection.vue'
import CreateExtraStep from './components/CreateExtraStep.vue'
import CreateBottomBar from './components/CreateBottomBar.vue'
import { useI18n } from 'vue-i18n'

// ---- Dependencies ----
const { t } = useI18n()
const router = useRouter()
const avatarStore = useAvatarStore()
const ctx = useAvatarCreate()
const { openPricing } = useModalRoute()
const { prefersReduced, duration } = useReducedMotion()

// ---- Template Refs ----
const heroRef = ref<HTMLElement>()
const ambienceRef = ref<HTMLElement>()
const section1Ref = ref<HTMLElement>()
const section2Ref = ref<HTMLElement>()
const section3Ref = ref<HTMLElement>()

// ---- GSAP Tweens for cleanup ----
const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = []
let observer: IntersectionObserver | null = null

// ---- UI State ----
const isCoreTierExpanded = ref(false)

// ---- Navigation ----
function handleBack() {
  router.push('/avatar')
}

// ---- Helpers ----
function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    lite: t('avatar.create.tierLite'),
    standard: t('avatar.create.tierStandard'),
    flagship: t('avatar.create.tierFlagship'),
  }
  return labels[tier] || t('avatar.create.tierLite')
}

// ---- Extra Data ----
function handleExtraData(data: Record<string, unknown>) {
  ctx.extraData.value = data
}

// ---- Create ----
async function handleCreate() {
  if (ctx.isCreating.value || !ctx.canCreate.value) return

  const avatarId = await ctx.create()
  if (avatarId) {
    // 300ms delay for success animation, then navigate
    setTimeout(() => {
      router.push(`/avatar/${avatarId}`)
    }, 300)
  }
}

// ---- Hero Entrance Animation ----
function animateHero() {
  if (prefersReduced.value || !heroRef.value) return

  const t = gsap.from(heroRef.value, {
    opacity: 0,
    scale: 0.95,
    duration: 0.6,
    ease: 'power2.out',
  })
  tweens.push(t)
}

// ---- Ambience Pulse Animation ----
function animateAmbience() {
  if (prefersReduced.value || !ambienceRef.value) return

  const t = gsap.to(ambienceRef.value, {
    opacity: 0.7,
    duration: 3,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true,
  })
  tweens.push(t)
}

// ---- Scroll-based Section Reveal (IntersectionObserver + GSAP springIn) ----
function setupScrollReveal() {
  const sections = [section1Ref.value, section2Ref.value, section3Ref.value].filter(Boolean) as HTMLElement[]
  if (!sections.length) return

  // Set initial hidden state (only if motion not reduced)
  if (!prefersReduced.value) {
    sections.forEach((el) => {
      gsap.set(el, { opacity: 0, y: 12, scale: 0.97 })
    })
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          if (prefersReduced.value) {
            gsap.set(el, { opacity: 1, y: 0, scale: 1 })
          } else {
            const t = gsap.to(el, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: duration.value || 0.3,
              ease: 'back.out(1.4)',
            })
            tweens.push(t)
          }
          observer?.unobserve(el)
        }
      })
    },
    { threshold: 0.15 },
  )

  sections.forEach((el) => observer?.observe(el))
}

// ---- Lifecycle ----
onMounted(() => {
  // Load avatar list for quota checks
  avatarStore.loadAvatars()

  nextTick(() => {
    animateHero()
    animateAmbience()
    setupScrollReveal()
  })
})

onUnmounted(() => {
  // Kill all GSAP tweens
  tweens.forEach((t) => t.kill())
  if (heroRef.value) gsap.killTweensOf(heroRef.value)
  if (ambienceRef.value) gsap.killTweensOf(ambienceRef.value)
  ;[section1Ref.value, section2Ref.value, section3Ref.value].forEach((el) => {
    if (el) gsap.killTweensOf(el)
  })

  // Cleanup observer
  observer?.disconnect()
  observer = null
})
</script>
