<template>
  <div
    ref="bannerRef"
    class="px-4 py-2.5 flex items-center justify-between text-sm shrink-0 transition-colors"
    :class="statusClass"
  >
    <div class="flex items-center gap-2">
      <Loader2 v-if="status === 'generating'" :size="14" class="animate-spin" />
      <Sparkles v-else-if="status === 'done'" :size="14" />
      <component :is="statusIcon" v-else :size="14" />
      <span>{{ statusText }}</span>
    </div>
    <button
      v-if="status === 'done'"
      class="text-xs opacity-70 hover:opacity-100 transition-opacity"
      @click="emit('dismiss')"
    >
      {{ t('thesisWriter.draftBanner.closeBtn') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, Sparkles, CheckCircle } from 'lucide-vue-next'
import gsap from 'gsap'

const props = defineProps<{
  status: 'generating' | 'done' | 'hidden'
  chapterTitle?: string
  batchProgress?: { current: number; total: number }
}>()

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const { t } = useI18n()
const bannerRef = ref<HTMLElement | null>(null)

const statusIcon = computed(() => {
  if (props.status === 'done') return CheckCircle
  return Sparkles
})

const statusText = computed(() => {
  if (props.status === 'generating') {
    if (props.batchProgress && props.batchProgress.total > 1) {
      return t('thesisWriter.draftBanner.generatingBatch', { name: props.chapterTitle || '', current: props.batchProgress.current, total: props.batchProgress.total })
    }
    return t('thesisWriter.draftBanner.generatingSingle', { name: props.chapterTitle || t('thesisWriter.chapterGuide.defaultChapterTitle') })
  }
  if (props.status === 'done') {
    return t('thesisWriter.draftBanner.draftReady')
  }
  return ''
})

const statusClass = computed(() => {
  if (props.status === 'generating') return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b border-blue-100 dark:border-blue-800/30'
  if (props.status === 'done') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-800/30'
  return ''
})

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// GSAP 入场动画 (respects prefers-reduced-motion)
onMounted(() => {
  if (bannerRef.value && props.status !== 'hidden') {
    if (prefersReduced) return
    gsap.fromTo(bannerRef.value, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' })
  }
})

// 状态切换动画
watch(() => props.status, (newStatus, oldStatus) => {
  if (!bannerRef.value) return
  if (newStatus === 'hidden' && oldStatus !== 'hidden') {
    if (prefersReduced) return
    gsap.to(bannerRef.value, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' })
  }
})

onUnmounted(() => {
  if (bannerRef.value) gsap.killTweensOf(bannerRef.value)
})
</script>
