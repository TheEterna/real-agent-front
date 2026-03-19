<template>
  <!-- 外层容器：沉浸式充满视口，截断溢出以保障粒子效果不出圈 -->
  <main
    class="not-found-bg relative flex h-screen w-full flex-col items-center justify-center overflow-hidden text-slate-600 dark:text-zinc-300"
    @mousemove="handleMouseMove"
    @click="spawnParticle"
  >
    <!-- 背景弥散光（高级视觉纵深，对应设计准则：流体美学与毛玻璃） -->
    <div
      ref="ambientGlowRef"
      class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-300/25 dark:bg-violet-600/20 opacity-60 blur-[120px] will-change-transform"
    ></div>

    <!-- 粒子小游戏容器 -->
    <div ref="particleContainerRef" class="absolute inset-0 z-0 pointer-events-none"></div>

    <!-- 核心内容区 (Content-First，确保 A11y 对比度与阅读体验) -->
    <div ref="contentRef" class="relative z-10 flex flex-col items-center text-center">
      <!-- 动态 404 数字：大排版，微交互 -->
      <h1 class="flex items-center text-[clamp(6rem,15vw,12rem)] font-light leading-none tracking-tighter">
        <span class="digit">4</span>
        <!-- "0" 被替换为会盯人的眼睛 -->
        <div
          ref="eyeContainerRef"
          class="relative mx-3 flex h-[0.8em] w-[0.55em] items-center justify-center rounded-full bg-white dark:bg-zinc-800 shadow-[inset_0_6px_8px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.05)]"
        >
          <div ref="pupilRef" class="absolute h-[30%] w-[40%] rounded-full bg-slate-800 dark:bg-slate-200">
            <div class="absolute right-[18%] top-[14%] h-[28%] w-[28%] rounded-full bg-white"></div>
          </div>
        </div>
        <span class="digit">4</span>
      </h1>

      <!-- 高级幽默的文案层 -->
      <div class="mt-8 space-y-3">
        <h2 class="text-2xl font-semibold tracking-tight text-slate-800 dark:text-zinc-200">{{ t('notFound.title') }}</h2>
        <div class="flex flex-col space-y-1 text-slate-500 dark:text-zinc-400" aria-live="polite">
          <p>{{ dynamicStatusMsg }}</p>
          <p class="text-sm">{{ t('notFound.clickHint') }}</p>
        </div>
      </div>

      <!-- 操作区：遵循 Saffer 微交互，支持 hover 和 active -->
      <div class="mt-12 flex items-center gap-4">
        <!-- 主按钮：返回安全地带 -->
        <button
          ref="backBtnRef"
          :disabled="isReturning"
          class="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white dark:bg-zinc-900 px-6 py-3 text-slate-600 dark:text-zinc-200 font-medium shadow-[0_8px_15px_rgba(100,110,140,0.1)] dark:shadow-[0_8px_15px_rgba(0,0,0,0.3)] border-2 border-transparent dark:border-white/10 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_rgba(143,177,203,0.25)] dark:hover:shadow-[0_12px_20px_rgba(0,0,0,0.4)] hover:border-indigo-300/60 dark:hover:border-indigo-500/40 active:scale-95 disabled:opacity-50"
          :aria-label="t('notFound.returnBtn')"
          @click="navigateHome"
        >
          <Loader2 v-if="isReturning" class="animate-spin h-4 w-4" />
          <Rocket v-else class="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          <span>{{ isReturning ? t('notFound.returning') : t('notFound.returnBtn') }}</span>
        </button>

        <!-- 工具按钮（包裹在 Tooltip 中，满足规范 2.3） -->
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 text-slate-400 dark:text-zinc-500 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                :aria-label="t('notFound.searchTooltip')"
                @click="openCommandPalette"
              >
                <Search class="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="8" class="animate-in fade-in-0 zoom-in-95">
              <span>{{ t('notFound.searchTooltip') }}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- 无障碍屏幕阅读器公告 -->
    <div class="sr-only" aria-live="assertive">
      {{ t('notFound.srAnnounce') }}
    </div>

    <!-- 辅助/彩蛋信息（Caption 字体级） -->
    <div class="absolute bottom-6 flex w-full items-center justify-center px-6 text-center text-xs text-slate-500 dark:text-zinc-400">
      <span class="flex items-center gap-1 opacity-70">
        <Ghost class="h-3 w-3" />
        {{ t('notFound.pressKey') }}
        <kbd class="pointer-events-none rounded border border-white/60 dark:border-white/20 bg-white/50 dark:bg-zinc-900/50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:text-zinc-300">ESC</kbd>
        {{ t('notFound.escHint') }}
      </span>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Rocket, Loader2, Search, Ghost } from 'lucide-vue-next'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import gsap from 'gsap'

const { t } = useI18n()

const router = useRouter()
const authStore = useAuthStore()

// ========================
// 状态管理与高级幽默逻辑
// ========================
const isReturning = ref(false)
const humorMessages = computed(() => [
  t('notFound.humor1'),
  t('notFound.humor2'),
  t('notFound.humor3'),
  t('notFound.humor4'),
])
const dynamicStatusMsg = ref(t('notFound.humor1'))

// 异步操作双重防护（架构红线 2.5 规范）
const navigateHome = async () => {
  if (isReturning.value) return
  isReturning.value = true

  // 修改按钮形态并触发 GSAP 反馈
  if (backBtnRef.value) {
    gsap.to(backBtnRef.value, { scale: 0.95, duration: 0.3, ease: 'power2.inOut' })
  }

  // 模拟物理时延感后使用 vue-router 导航
  setTimeout(() => {
    isReturning.value = false
    if (authStore.isAuthenticated) {
      router.push('/chat')
    } else {
      router.push('/')
    }
  }, 1000)
}

// 唤出命令面板 (Cmd + K 兜底设计)
const openCommandPalette = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
}

// ========================
// DOM 引用
// ========================
const contentRef = ref<HTMLElement | null>(null)
const pupilRef = ref<HTMLElement | null>(null)
const eyeContainerRef = ref<HTMLElement | null>(null)
const ambientGlowRef = ref<HTMLElement | null>(null)
const backBtnRef = ref<HTMLElement | null>(null)
const particleContainerRef = ref<HTMLElement | null>(null)

// 检测无障碍选项以跳过动画
const prefersReducedMotion =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false

// ========================
// GSAP 微交互与动画编排 (第四节：动画与性能规范)
// ========================

// 1. 入场编舞 (Choreography - 交错进场、spring物理反馈)
const playEntranceAnimation = () => {
  if (prefersReducedMotion || !contentRef.value) return

  const tl = gsap.timeline()

  // 背景光晕淡入与扩张
  tl.from(ambientGlowRef.value, { scale: 0.5, opacity: 0, duration: 2, ease: 'power3.out' }, 0)

  // 核心数字带有质感（L3 级别）弹射进入
  tl.from('.digit', { y: 80, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.5)' }, 0.2)

  // 眼睛的涌现
  tl.from(eyeContainerRef.value, {
    scale: 0,
    rotation: -90,
    duration: 1,
    ease: 'elastic.out(1, 0.5)',
  }, 0.4)

  // 文案与操作区的水流感平滑过渡入场 (fluid ease)
  tl.from(contentRef.value.children[1], { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.6)
  tl.from(contentRef.value.children[2], { y: 10, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.8)
}

// 2. 环境呼吸反馈 (Idle Breathing State)
const playIdleAnimation = () => {
  if (prefersReducedMotion || !ambientGlowRef.value) return
  gsap.to(ambientGlowRef.value, {
    scale: 1.1,
    opacity: 0.6,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut', // L4持续循环必须平滑且不能过猛
  })
}

// 3. 眼球注视跟踪 (基于眼眶中心的角度与距离映射)
const handleMouseMove = (e: MouseEvent) => {
  if (prefersReducedMotion || !pupilRef.value || !eyeContainerRef.value) return

  const eyeRect = eyeContainerRef.value.getBoundingClientRect()
  const eyeCx = eyeRect.left + eyeRect.width / 2
  const eyeCy = eyeRect.top + eyeRect.height / 2

  const angle = Math.atan2(e.clientY - eyeCy, e.clientX - eyeCx)
  const maxDist = eyeRect.width / 4
  const distance = Math.min(maxDist, Math.hypot(e.clientX - eyeCx, e.clientY - eyeCy) / 10)

  // 使用 GSAP 保障性能 (性能红线：只改 transform)
  gsap.to(pupilRef.value, {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    duration: 0.15,
    ease: 'power2.out',
    overwrite: 'auto',
  })
}

// 4. 治愈小游戏：触控生光 (Triggering data packets)
const spawnParticle = (e: MouseEvent) => {
  if (prefersReducedMotion || !particleContainerRef.value) return

  // 若点在按钮或文本区则跳过产生粒子
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('.digit')) return

  // 创建"数据粒子"
  const particle = document.createElement('div')
  particle.className =
    'absolute h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-300 shadow-sm'
  gsap.set(particle, { left: e.clientX, top: e.clientY, xPercent: -50, yPercent: -50, opacity: 0, scale: 0 })
  particleContainerRef.value.appendChild(particle)

  // Saffer微交互四柱: 反馈(绽放与上浮) -> 循环(自然消亡)
  const anim = gsap.timeline({
    onComplete: () => {
      particle.remove()
    },
  })

  // 出现质感：短、锐
  anim
    .to(particle, { opacity: 1, scale: 1.5, duration: 0.2, ease: 'back.out(2)' })
    // 消散与向上的阻力漂浮（反重力/真空感）
    .to(
      particle,
      {
        y: '-=150',
        x: `+=${Math.random() * 60 - 30}`,
        opacity: 0,
        scale: 0.5,
        duration: Math.random() * 2 + 1.5,
        ease: 'power1.out',
      },
      0.2,
    )

  // 随机变更幽默文案（提升页面可重复互动的探索性）
  if (Math.random() > 0.8) {
    dynamicStatusMsg.value = humorMessages.value[Math.floor(Math.random() * humorMessages.value.length)]
  }
}

// 注册与注销全局键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    navigateHome()
  }
}

onMounted(() => {
  playEntranceAnimation()
  playIdleAnimation()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)

  // 性能铁律：严查与杀死此作用域相关的所有缓动，防止 Vue 热重载内存泄露
  if (ambientGlowRef.value) gsap.killTweensOf(ambientGlowRef.value)
  if (pupilRef.value) gsap.killTweensOf(pupilRef.value)
  if (eyeContainerRef.value) gsap.killTweensOf(eyeContainerRef.value)
  if (backBtnRef.value) gsap.killTweensOf(backBtnRef.value)
  gsap.killTweensOf('.digit')

  // 清理粒子容器内可能残留的 tween
  if (particleContainerRef.value) {
    particleContainerRef.value.querySelectorAll('div').forEach((el) => gsap.killTweensOf(el))
    particleContainerRef.value.innerHTML = ''
  }
})
</script>

<style scoped>
.will-change-transform {
  will-change: transform, opacity;
}

/* 404 独立配色：淡紫 → 天蓝呼吸渐变 */
.not-found-bg {
  background: linear-gradient(135deg, var(--color-purple-100, #ede0f8) 0%, var(--color-blue-100, #c2d9f7) 50%, var(--color-sky-100, #dff2fb) 100%);
  background-size: 300% 300%;
  animation: breatheGradient 18s ease infinite;
}

/* 暗色模式已移至下方非 scoped 块 */

@keyframes breatheGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .not-found-bg {
    animation: none;
    background-size: 100% 100%;
  }
}
</style>

<style lang="scss">
.dark {
  .not-found-bg {
    background: linear-gradient(135deg, var(--color-zinc-900, #1a1a2e) 0%, var(--color-slate-900, #16213e) 50%, var(--color-blue-950, #0f3460) 100%);
    background-size: 300% 300%;
  }

  /* 匹配 scoped 块嵌套深度以确保特异性足够 */
  main.not-found-bg {
    background: linear-gradient(135deg, var(--color-zinc-900, #1a1a2e) 0%, var(--color-slate-900, #16213e) 50%, var(--color-blue-950, #0f3460) 100%);
    background-size: 300% 300%;
  }
}
</style>
