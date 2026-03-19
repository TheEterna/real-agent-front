<script setup lang="ts">
/**
 * ChatRecordPanel - 微信风格聊天记录滚动区
 *
 * 显示原始聊天记录，支持滚动到指定消息（关键时刻跳转）
 */
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2 } from 'lucide-vue-next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import ChatBubble from './ChatBubble.vue'
import gsap from 'gsap'

const { t } = useI18n()
const store = useChatAnalyzerStore()

const scrollContainerRef = ref<HTMLElement | null>(null)

const records = computed(() => store.activeRecords)
const isLoading = computed(() => store.recordsLoading)
const selfContact = computed(() => store.selfContact)

/**
 * Check if sender is self by comparing senderName
 */
function isSelfSender(senderName: string): boolean {
  return selfContact.value?.name === senderName
}

// 跟踪当前高亮动画以便清理
let highlightTween: gsap.core.Tween | null = null
const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scroll to a specific seq_order (used by KeyMoments jump)
 * H1: 使用 GSAP 高亮动画替代 setTimeout + class 操作
 */
function scrollToSeq(seqOrder: number) {
  nextTick(() => {
    const el = scrollContainerRef.value?.querySelector(`[data-seq="${seqOrder}"]`) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' })
      if (prefersReduced) return
      // 使用 GSAP 实现高亮闪烁效果
      if (highlightTween) highlightTween.kill()
      highlightTween = gsap.fromTo(
        el,
        { boxShadow: '0 0 0 2px var(--color-primary-400), 0 0 12px var(--color-primary-400)' },
        {
          boxShadow: '0 0 0 0px transparent, 0 0 0px transparent',
          duration: 2,
          ease: 'power2.out',
          onComplete: () => { highlightTween = null },
        },
      )
    }
  })
}

onUnmounted(() => {
  if (highlightTween) highlightTween.kill()
})

/**
 * Format date separator
 * H2: 使用用户友好的日期格式（今天/昨天/星期X/完整日期）
 */
function getDateLabel(sentAt: Date | undefined): string {
  if (!sentAt) return ''
  const d = new Date(sentAt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (86400000))

  if (diffDays === 0) return t('chatAnalyzer.chatRecord.today')
  if (diffDays === 1) return t('chatAnalyzer.chatRecord.yesterday')
  if (diffDays < 7) {
    const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
    return t(`chatAnalyzer.chatRecord.weekdays.${weekdayKeys[d.getDay()]}`)
  }
  if (d.getFullYear() === now.getFullYear()) {
    return t('chatAnalyzer.chatRecord.dateMonth', { month: d.getMonth() + 1, day: d.getDate() })
  }
  return t('chatAnalyzer.chatRecord.dateFull', { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() })
}

/**
 * Check if date separator should show
 */
function shouldShowDateSep(index: number): boolean {
  if (index === 0) return true
  const current = records.value[index]
  const prev = records.value[index - 1]
  if (!current.sentAt || !prev.sentAt) return false
  return getDateLabel(current.sentAt) !== getDateLabel(prev.sentAt)
}

defineExpose({ scrollToSeq })
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <!-- Loading: H1 系统状态可见性 -->
    <div
      v-if="isLoading && records.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-2"
      role="status"
      :aria-label="t('chatAnalyzer.chatRecord.loadingAria')"
    >
      <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      <p class="text-xs text-muted-foreground">{{ t('chatAnalyzer.chatRecord.loadingText') }}</p>
    </div>

    <!-- Empty: H6 识别而非回忆 -->
    <div
      v-else-if="records.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-1"
    >
      <p class="text-base text-muted-foreground">{{ t('chatAnalyzer.chatRecord.empty') }}</p>
      <p class="text-xs text-muted-foreground">{{ t('chatAnalyzer.chatRecord.emptyHint') }}</p>
    </div>

    <!-- Records list -->
    <ScrollArea v-else class="flex-1">
      <div ref="scrollContainerRef" class="p-3 sm:p-4" role="log" :aria-label="t('chatAnalyzer.chatRecord.chatRecordAria')">
        <template v-for="(record, idx) in records" :key="record.id">
          <!-- Date separator -->
          <div
            v-if="shouldShowDateSep(idx)"
            class="flex items-center justify-center my-4"
          >
            <span class="px-3 py-1 rounded-full bg-muted text-[10px] text-muted-foreground">
              {{ getDateLabel(record.sentAt) }}
            </span>
          </div>

          <!-- Chat bubble -->
          <div :data-seq="record.seqOrder">
            <ChatBubble
              :record="record"
              :is-self="isSelfSender(record.senderName)"
              :sender-name="isSelfSender(record.senderName) ? undefined : record.senderName"
            />
          </div>
        </template>
      </div>
    </ScrollArea>
  </div>
</template>
