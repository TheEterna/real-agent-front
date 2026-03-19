<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AgentType } from '@/types/session'
import gsap from 'gsap'
import { ArrowRight, Infinity as InfinityIcon, Sparkles, X } from 'lucide-vue-next'

interface AgentOption {
  type: AgentType
  name: string
  tagline: string
  description: string
  capabilities: string[]
  isFlagship: boolean
  theme: {
    bg: string
    iconColor: string
    glow: string
  }
  Logo: any
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  select: [agentType: AgentType]
  close: []
}>()

const { t } = useI18n()

const Cube2x2 = defineComponent({
  name: 'Cube2x2',
  props: {
    size: { type: Number, default: 40 },
    color: { type: String, default: '#10b981' },
    className: { type: String, default: '' },
  },
  setup(p) {
    const strokeWidth = 10
    const radius = 38
    const circumference = 2 * Math.PI * radius

    return () =>
      h(
        'div',
        {
          class: `inline-flex items-center justify-center ${p.className}`,
          style: { width: `${p.size}px`, height: `${p.size}px`, color: p.color },
        },
        [
          h(
            'svg',
            {
              viewBox: '0 0 100 100',
              class: 'w-full h-full overflow-visible',
              xmlns: 'http://www.w3.org/2000/svg',
            },
            [
              h('g', { transform: 'translate(50, 50) rotate(195)' }, [
                h('circle', {
                  cx: '0',
                  cy: '0',
                  r: radius,
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': strokeWidth,
                  'stroke-dasharray': `${circumference * 0.98} ${circumference * 0.02}`,
                  'stroke-dashoffset': 0,
                  class: 'opacity-20',
                  'stroke-linecap': 'round',
                }),
                h('path', {
                  d: `M ${radius} 0 A ${radius} ${radius} 0 0 0 0 ${-radius}`,
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': strokeWidth,
                  'stroke-linecap': 'round',
                  class: 'opacity-90',
                }),
                h('circle', { cx: '0', cy: '0', r: '3', fill: 'currentColor', class: 'opacity-30' }),
              ]),
            ],
          ),
        ],
      )
  },
})

const VoloLogo = defineComponent({
  name: 'VoloLogo',
  setup() {
    return () =>
      h('div', { class: 'w-full h-full flex items-center justify-center p-1 relative' }, [
        h('div', { class: 'absolute inset-0 bg-current opacity-5 blur-3xl rounded-full scale-50' }),
        h(Cube2x2, { size: 80, color: 'currentColor' }),
      ])
  },
})

const agents = computed<AgentOption[]>(() => [
  {
    type: AgentType.VoloAI,
    name: 'VoloAI',
    tagline: t('compTool.agentSelector.voloTagline'),
    description: t('compTool.agentSelector.voloDescription'),
    capabilities: [t('compTool.agentSelector.capMultiModal'), t('compTool.agentSelector.capHumanInLoop'), t('compTool.agentSelector.capFullAgent')],
    isFlagship: true,
    Logo: VoloLogo,
    theme: {
      bg: 'bg-emerald-50/40',
      iconColor: 'text-emerald-600',
      glow: 'group-hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)]',
    },
  },
])

const overlayRef = ref<HTMLElement>()
const modalRef = ref<HTMLElement>()
const cardsRef = ref<HTMLElement[]>([])
const deco = ref<Array<{ top: string; left: string; scale: number; rotate: number }>>([])

const buildDecorations = () => {
  deco.value = Array.from({ length: 6 }).map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    scale: 1 + Math.random() * 2,
    rotate: Math.random() * 360,
  }))
}

const runExit = (onDone: () => void) => {
  const tl = gsap.timeline({ onComplete: onDone })

  if (cardsRef.value.length > 0) {
    tl.to(cardsRef.value, {
      scale: 0.92,
      opacity: 0,
      y: 30,
      duration: 0.25,
      stagger: 0.03,
      ease: 'power2.in',
    })
  }

  if (modalRef.value) {
    tl.to(
      modalRef.value,
      {
        opacity: 0,
        y: 30,
        scale: 0.98,
        duration: 0.25,
        ease: 'power2.in',
      },
      '-=0.2',
    )
  }

  if (overlayRef.value) {
    tl.to(
      overlayRef.value,
      {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      },
      '-=0.2',
    )
  }
}

const handleSelect = (agent: AgentOption) => {
  // 退出动画
  runExit(() => emit('select', agent.type))
}

const handleClose = () => {
  // 退出动画
  runExit(() => emit('close'))
}

// 入场动画
const playEnterAnimation = () => {
  nextTick(() => {
    buildDecorations()

    const tl = gsap.timeline()

    if (overlayRef.value) {
      gsap.set(overlayRef.value, { opacity: 0 })
      tl.to(overlayRef.value, {
        opacity: 1,
        duration: 0.25,
        ease: 'power2.out',
      })
    }

    if (modalRef.value) {
      gsap.set(modalRef.value, { opacity: 0, y: 30, scale: 0.98 })
      tl.to(
        modalRef.value,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          ease: 'power2.out',
        },
        '-=0.1',
      )
    }

    if (cardsRef.value.length > 0) {
      gsap.set(cardsRef.value, { opacity: 0, y: 24, scale: 0.98 })
      tl.to(
        cardsRef.value,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.25,
          stagger: 0.05,
          ease: 'power2.out',
        },
        '-=0.1',
      )
    }
  })
}

const setCardRef = (index: number, el: unknown) => {
  const dom = (el as any)?.$el ?? el
  if (!dom) return
  cardsRef.value[index] = dom as HTMLElement
}

const setCardTilt = (el: HTMLElement, rx: number, ry: number) => {
  el.style.setProperty('--rx', `${rx}deg`)
  el.style.setProperty('--ry', `${ry}deg`)
}

const handleCardMouseMove = (index: number, event: MouseEvent) => {
  const el = cardsRef.value[index]
  if (!el) return

  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const dx = (event.clientX - centerX) / (rect.width / 2)
  const dy = (event.clientY - centerY) / (rect.height / 2)

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
  const ry = clamp(dx * 8, -8, 8)
  const rx = clamp(-dy * 8, -8, 8)
  setCardTilt(el, rx, ry)
}

const handleCardMouseLeave = (index: number) => {
  const el = cardsRef.value[index]
  if (!el) return
  setCardTilt(el, 0, 0)
}

// 监听visible变化
onMounted(() => {
  if (props.visible) playEnterAnimation()
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) playEnterAnimation()
  },
)

onUnmounted(() => {
  if (overlayRef.value) gsap.killTweensOf(overlayRef.value)
  if (modalRef.value) gsap.killTweensOf(modalRef.value)
  if (cardsRef.value.length > 0) {
    cardsRef.value.forEach(el => {
      if (el) gsap.killTweensOf(el)
    })
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-9999 flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="t('compTool.agentSelector.dialogTitle')">
      <div
        ref="overlayRef"
        class="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl"
        @click.self="handleClose"
      />

      <div class="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div
          v-for="(d, i) in deco"
          :key="i"
          class="absolute"
          :style="{ top: d.top, left: d.left, transform: `scale(${d.scale}) rotate(${d.rotate}deg)` }"
        >
          <Cube2x2 :size="240" color="#10b981" />
        </div>
      </div>

      <div
        ref="modalRef"
        class="relative w-full max-w-6xl bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden z-10 flex flex-col max-h-[95vh]"
      >
        <div class="flex items-center justify-between px-10 md:px-14 pt-12 pb-8">
          <div class="space-y-1.5">
            <h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{{ t('compTool.agentSelector.dialogTitle') }}</h2>
            <p class="text-slate-500 dark:text-zinc-400 text-sm md:text-base font-medium">{{ t('compTool.agentSelector.dialogSubtitle') }}</p>
          </div>
          <button
            type="button"
            :aria-label="t('compTool.agentSelector.closeLabel')"
            class="p-3.5 rounded-full bg-slate-50 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90 hover:bg-slate-100 dark:hover:bg-zinc-700"
            @click="handleClose"
          >
            <X :size="24" />
          </button>
        </div>

        <div class="px-10 md:px-14 pb-14 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto agent-selector-scroll" role="listbox" :aria-label="t('compTool.agentSelector.agentList')">
          <button
            v-for="(agent, index) in agents"
            :key="agent.type"
            :ref="(el) => setCardRef(index, el)"
            type="button"
            role="option"
            :aria-label="t('compTool.agentSelector.selectAgent', { name: agent.name, desc: agent.description })"
            class="group relative flex flex-col h-full text-left p-10 rounded-[40px] border border-slate-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 transition-all duration-500 ease-out hover:border-transparent hover:shadow-2xl agent-tilt-card"
            :class="agent.theme.glow"
            @click="handleSelect(agent)"
            @mousemove="(e) => handleCardMouseMove(index, e)"
            @mouseleave="() => handleCardMouseLeave(index)"
          >
            <div class="absolute inset-0 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-linear-to-br from-transparent to-slate-50/30 dark:to-zinc-700/30 pointer-events-none" />

            <div
              v-if="agent.isFlagship"
              class="absolute top-10 right-10 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm z-20"
            >
              <Sparkles :size="12" class="text-emerald-400" />
              {{ t('compTool.agentSelector.flagship') }}
            </div>

            <div
              class="w-20 h-20 md:w-24 md:h-24 rounded-[32px] flex items-center justify-center mb-12 transition-all duration-700 group-hover:scale-110"
              :class="[agent.theme.bg, agent.theme.iconColor]"
              style="transform: translateZ(50px)"
            >
              <div class="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                <component :is="agent.Logo" />
              </div>
            </div>

            <div class="space-y-4 mb-12 relative z-10" style="transform: translateZ(30px)">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-zinc-500 mb-2.5 block">{{ agent.tagline }}</span>
                <h3 class="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-zinc-200">{{ agent.name }}</h3>
              </div>
              <p class="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed font-normal min-h-[60px]">{{ agent.description }}</p>
            </div>

            <div class="mt-auto space-y-6 relative z-10" style="transform: translateZ(20px)">
              <div class="flex flex-wrap gap-2.5">
                <div
                  v-for="cap in agent.capabilities"
                  :key="cap"
                  class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-zinc-700/80 border border-slate-100 dark:border-zinc-600 text-slate-600 dark:text-zinc-300 text-[11px] font-bold group-hover:bg-white dark:group-hover:bg-zinc-600 group-hover:border-slate-200 dark:group-hover:border-zinc-500 transition-colors"
                >
                  <Infinity :size="10" class="opacity-30" />
                  {{ cap }}
                </div>
              </div>

              <div class="flex items-center text-xs font-black text-slate-400 dark:text-zinc-500 group-hover:text-slate-950 dark:group-hover:text-zinc-300 transition-colors pt-2 uppercase tracking-[0.15em]">
                {{ t('compTool.agentSelector.deployLogic') }}
                <ArrowRight :size="16" class="ml-2 transition-transform duration-500 group-hover:translate-x-3" />
              </div>
            </div>
          </button>
        </div>

        <div class="hidden md:flex px-14 py-8 bg-slate-50/30 dark:bg-zinc-800/30 border-t border-slate-100 dark:border-zinc-700 items-center justify-between">
          <div class="flex items-center gap-4 text-xs font-semibold text-slate-400 dark:text-zinc-500">
            <Infinity :size="18" class="text-slate-300 dark:text-zinc-600" />
            <span>{{ t('compTool.agentSelector.engineNote') }}</span>
          </div>
          <div class="flex items-center gap-8">
            <button type="button" class="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors">{{ t('compTool.agentSelector.archDocs') }}</button>
            <button type="button" class="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors">{{ t('compTool.agentSelector.logicPreview') }}</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.agent-tilt-card {
  transform-style: preserve-3d;
  transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
}

.agent-tilt-card {
  transition-property: transform, box-shadow, border-color;
}

.agent-selector-scroll {
  scrollbar-width: thin;
}
</style>
