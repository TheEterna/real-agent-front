<script setup lang="ts">
/**
 * AnalysisReportDrawer - 右侧抽屉容器
 *
 * 包含：情绪走势图 + 沟通模式 + 关键时刻 + 健康度评分 + 综合建议
 */
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, TrendingUp, MessageCircle, Zap, Heart, FileText } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import EmotionTrendChart from './EmotionTrendChart.vue'
import CommunicationPatterns from './CommunicationPatterns.vue'
import KeyMoments from './KeyMoments.vue'
import HealthScoreCard from './HealthScoreCard.vue'
import gsap from 'gsap'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  jumpToRecord: [seqStart: number]
}>()

const { t } = useI18n()
const store = useChatAnalyzerStore()
const drawerRef = ref<HTMLElement | null>(null)
const overlayRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

const report = computed(() => store.activeReport)
const reportData = computed(() => report.value?.reportData ?? null)
const contactName = computed(() => store.activeContact?.name ?? '')

function handleClose() {
  emit('update:open', false)
}

function handleJumpTo(seqStart: number) {
  emit('jumpToRecord', seqStart)
  emit('update:open', false)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// GSAP slide-in/slide-out animation (drawer = heavy element → 300-500ms, ease-spring)
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    isVisible.value = true
    nextTick(() => {
      if (prefersReduced) {
        if (overlayRef.value) gsap.set(overlayRef.value, { opacity: 1 })
        if (drawerRef.value) gsap.set(drawerRef.value, { x: '0%' })
        return
      }
      if (overlayRef.value) {
        gsap.fromTo(overlayRef.value,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' },
        )
      }
      if (drawerRef.value) {
        gsap.fromTo(drawerRef.value,
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: 'back.out(1.2)' },
        )
      }
    })
  } else {
    if (prefersReduced) {
      isVisible.value = false
      return
    }
    // Close animation then unmount
    const tl = gsap.timeline({
      onComplete: () => { isVisible.value = false },
    })
    if (overlayRef.value) {
      tl.to(overlayRef.value, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0)
    }
    if (drawerRef.value) {
      tl.to(drawerRef.value, { x: '100%', duration: 0.3, ease: 'power2.in' }, 0)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (drawerRef.value) gsap.killTweensOf(drawerRef.value)
  if (overlayRef.value) gsap.killTweensOf(overlayRef.value)
})
</script>

<template>
  <Teleport to="body">
    <template v-if="open || isVisible">
      <!-- Overlay -->
      <div
        ref="overlayRef"
        class="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
        @click="handleClose"
      />

      <!-- Drawer -->
      <div
        ref="drawerRef"
        role="dialog"
        aria-modal="true"
        :aria-label="t('chatAnalyzer.reportDrawer.title')"
        class="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-white dark:bg-zinc-900 flex flex-col"
      style="box-shadow: var(--shadow-lg)"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <div class="flex items-center gap-2">
            <FileText :size="16" class="text-zinc-500" />
            <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {{ t('chatAnalyzer.reportDrawer.title') }}
              <span v-if="contactName" class="font-normal text-zinc-500"> — {{ contactName }}</span>
            </h3>
          </div>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="sm"
                class="w-8 h-8 min-w-[44px] min-h-[44px] p-0 active:scale-95 transition-colors duration-150"
                :aria-label="t('chatAnalyzer.reportDrawer.closeReport')"
                @click="handleClose"
              >
                <X :size="16" class="text-zinc-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" :side-offset="4">{{ t('chatAnalyzer.reportDrawer.closeTooltip') }}</TooltipContent>
          </Tooltip>
        </div>

        <!-- Content -->
        <ScrollArea class="flex-1">
          <div class="p-4 space-y-6">
            <template v-if="reportData">
              <!-- Emotion Trend -->
              <section>
                <div class="flex items-center gap-2 mb-3">
                  <TrendingUp :size="16" class="text-zinc-500" />
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ t('chatAnalyzer.reportDrawer.emotionTrend') }}</h4>
                </div>
                <EmotionTrendChart :trend="reportData.emotionTrend" />
              </section>

              <!-- Communication Patterns -->
              <section>
                <div class="flex items-center gap-2 mb-3">
                  <MessageCircle :size="16" class="text-zinc-500" />
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ t('chatAnalyzer.reportDrawer.communicationPatterns') }}</h4>
                </div>
                <CommunicationPatterns :patterns="reportData.communicationPatterns" />
              </section>

              <!-- Key Moments -->
              <section>
                <div class="flex items-center gap-2 mb-3">
                  <Zap :size="16" class="text-zinc-500" />
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ t('chatAnalyzer.reportDrawer.keyMoments') }}</h4>
                </div>
                <KeyMoments
                  :moments="reportData.keyMoments"
                  @jump-to="handleJumpTo"
                />
              </section>

              <!-- Health Score -->
              <section>
                <div class="flex items-center gap-2 mb-3">
                  <Heart :size="16" class="text-zinc-500" />
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ t('chatAnalyzer.reportDrawer.healthScore') }}</h4>
                </div>
                <HealthScoreCard :score="reportData.healthScore" />
              </section>

              <!-- Summary -->
              <section>
                <div class="flex items-center gap-2 mb-3">
                  <FileText :size="16" class="text-zinc-500" />
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ t('chatAnalyzer.reportDrawer.summary') }}</h4>
                </div>
                <div class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                  <p class="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {{ reportData.summary }}
                  </p>
                </div>
              </section>
            </template>

            <!-- No report -->
            <div
              v-else
              class="flex flex-col items-center justify-center py-16"
            >
              <FileText :size="32" class="text-muted-foreground/30 mb-3" />
              <p class="text-base text-muted-foreground">{{ t('chatAnalyzer.reportDrawer.noReport') }}</p>
              <p class="text-xs text-muted-foreground/60 mt-1">
                {{ t('chatAnalyzer.reportDrawer.noReportHint') }}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </template>
  </Teleport>
</template>
