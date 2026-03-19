<template>
  <div ref="guideRef" class="flex-1 overflow-y-auto bg-muted/50">
    <div class="w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-12 min-h-full flex flex-col justify-center">
      <!-- Header -->
      <div class="text-center mb-6 sm:mb-8">
        <h3 class="text-base sm:text-lg font-semibold text-foreground">
          {{ chapterTitle }}
        </h3>
        <p v-if="chapterDescription" class="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md mx-auto">
          {{ chapterDescription }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-3 sm:space-y-4">
        <div v-for="i in 3" :key="i" class="rounded-xl border border-border bg-background p-4 sm:p-5 animate-pulse">
          <div class="flex items-start gap-2 sm:gap-3 mb-3">
            <div class="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-muted-foreground/20" />
            <div class="h-4 bg-muted-foreground/20 rounded w-3/4" />
          </div>
          <div class="ml-8 sm:ml-9 space-y-2">
            <div class="h-8 bg-muted rounded-lg" />
            <div class="h-8 bg-muted rounded-lg w-2/3" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-8">
        <p class="text-sm text-destructive mb-3">{{ error }}</p>
        <button
          class="text-sm text-amber-600 hover:text-amber-700 font-medium"
          @click="loadQuestions()"
        >
          {{ t('thesisWriter.chapterGuide.retryBtn') }}
        </button>
      </div>

      <!-- Questions -->
      <div v-else-if="questions.length > 0" class="space-y-3 sm:space-y-4">
        <!-- 问题列表标题 + 刷新按钮 -->
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{{ t('thesisWriter.chapterGuide.sectionTitle') }}</span>
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
                  :aria-label="t('thesisWriter.chapterGuide.refreshQuestions')"
                  :disabled="loading"
                  @click="refreshQuestions"
                >
                  <RefreshCw :size="16" :class="{ 'animate-spin': loading }" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" :side-offset="6">{{ t('thesisWriter.chapterGuide.refreshQuestions') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <GuideQuestionCard
          v-for="(q, idx) in questions"
          :key="q.id"
          v-model="answers[q.id]"
          :question="q"
          :index="idx"
        />

        <!-- Note Input -->
        <div class="rounded-xl border border-dashed border-border/70 bg-background/80 p-3 sm:p-4">
          <label class="text-xs font-medium text-muted-foreground mb-1.5 block">
            {{ t('thesisWriter.chapterGuide.noteLabel') }}
          </label>
          <textarea
            v-model="note"
            class="w-full px-3 py-2 text-sm border-0 bg-transparent resize-none
                   focus:outline-none placeholder:text-muted-foreground
                   text-foreground"
            :placeholder="t('thesisWriter.chapterGuide.notePlaceholder')"
            rows="2"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
          <button
            class="flex-1 px-4 sm:px-5 py-3 sm:py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl
                   hover:bg-amber-600 active:scale-[0.98] transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
            :disabled="!hasAnyAnswer"
            @click="handleGenerate"
          >
            <Sparkles :size="16" />
            <span class="hidden sm:inline">{{ t('thesisWriter.chapterGuide.aiGenerateDraft') }}</span>
            <span class="sm:hidden">{{ t('thesisWriter.chapterGuide.aiGenerate') }}</span>
          </button>
          <button
            class="px-4 sm:px-5 py-3 sm:py-2.5 text-sm font-medium text-muted-foreground bg-background border border-border rounded-xl
                   hover:bg-accent active:scale-[0.98] transition-all"
            @click="handleSkip"
          >
            {{ t('thesisWriter.chapterGuide.writeMyself') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles, RefreshCw } from 'lucide-vue-next'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import gsap from 'gsap'
import { generateGuidedQuestions } from '@/api/thesis-writer'
import type { GuidedQuestionItem } from '@/types/thesis-writer'
import { useThesisStore } from '../stores/thesisStore'
import GuideQuestionCard from './GuideQuestionCard.vue'

const props = defineProps<{
  projectId: string
  nodeId: string
  /** 当前节点标题（兜底显示） */
  nodeName?: string
}>()

const emit = defineEmits<{
  (e: 'generate', payload: { answers: Record<string, string>; note: string }): void
  (e: 'skip'): void
}>()

const { t } = useI18n()
const thesisStore = useThesisStore()

const guideRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const questions = ref<GuidedQuestionItem[]>([])
const answers = reactive<Record<string, string>>({})
const note = ref('')
const chapterTitle = ref(props.nodeName || t('thesisWriter.chapterGuide.defaultChapterTitle'))
const chapterDescription = ref('')

const hasAnyAnswer = computed(() => {
  return Object.values(answers).some(v => v && v.trim())
})

/** 将当前状态写入 Store 缓存 */
function persistToStore() {
  thesisStore.saveGuideCache(props.nodeId, {
    questions: questions.value,
    chapterTitle: chapterTitle.value,
    chapterDescription: chapterDescription.value,
    answers: { ...answers },
    note: note.value,
  })
}

// 监听回答和备注变化，实时写入 Store 缓存
watch([() => ({ ...answers }), note], () => {
  if (questions.value.length > 0) {
    persistToStore()
  }
}, { deep: true })

// ==================== 加载逻辑 ====================

/** 从缓存或 API 加载问题（挂载时调用） */
async function loadQuestions() {
  // 优先从 Store 缓存恢复
  const cache = thesisStore.getGuideCache(props.nodeId)
  if (cache && cache.questions.length > 0) {
    questions.value = cache.questions
    chapterTitle.value = cache.chapterTitle || props.nodeName || t('thesisWriter.chapterGuide.defaultChapterTitle')
    chapterDescription.value = cache.chapterDescription || ''
    for (const q of cache.questions) {
      answers[q.id] = cache.answers[q.id] || ''
    }
    note.value = cache.note || ''
    await new Promise(resolve => setTimeout(resolve, 50))
    animateCards()
    return
  }

  // 首次无缓存，调用 API
  await fetchFromAPI()
}

/** 刷新按钮：清空缓存和回答，重新调 API */
async function refreshQuestions() {
  thesisStore.clearGuideCache(props.nodeId)
  // 重置回答
  for (const key of Object.keys(answers)) {
    delete answers[key]
  }
  note.value = ''
  questions.value = []
  await fetchFromAPI()
}

/** 调用后端 API 生成引导问题 */
async function fetchFromAPI() {
  loading.value = true
  error.value = null
  try {
    const res = await generateGuidedQuestions({
      projectId: props.projectId,
      nodeId: props.nodeId,
    })
    if (res.code === 200 && res.data) {
      questions.value = res.data.questions || []
      chapterTitle.value = res.data.chapterTitle || props.nodeName || t('thesisWriter.chapterGuide.defaultChapterTitle')
      chapterDescription.value = res.data.chapterDescription || ''
      for (const q of questions.value) {
        answers[q.id] = ''
      }
      persistToStore()
      await new Promise(resolve => setTimeout(resolve, 50))
      animateCards()
    } else {
      error.value = res.message || t('thesisWriter.batchDraft.loadQuestionsFailed')
    }
  } catch (e) {
    console.error('[ChapterGuide] 加载引导问题失败:', e)
    error.value = t('thesisWriter.batchDraft.networkError')
  } finally {
    loading.value = false
  }
}

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function animateCards() {
  if (guideRef.value && !prefersReduced) {
    const cards = guideRef.value.querySelectorAll('.rounded-xl')
    gsap.fromTo(cards,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
    )
  }
}

function handleGenerate() {
  thesisStore.clearGuideCache(props.nodeId)
  // 将 answers 的 key 从 q.id 替换为问题文本，让 LLM 能理解上下文
  const semanticAnswers: Record<string, string> = {}
  for (const q of questions.value) {
    const val = answers[q.id]
    if (val && val.trim()) {
      semanticAnswers[q.question] = val
    }
  }
  emit('generate', {
    answers: semanticAnswers,
    note: note.value,
  })
}

function handleSkip() {
  thesisStore.clearGuideCache(props.nodeId)
  emit('skip')
}

onMounted(() => {
  loadQuestions()
})

onUnmounted(() => {
  if (guideRef.value) {
    gsap.killTweensOf(guideRef.value.querySelectorAll('.rounded-xl'))
  }
})
</script>
