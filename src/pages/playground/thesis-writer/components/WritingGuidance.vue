<script setup lang="ts">
/**
 * 写作指导面板 (Tab 1)
 * 当前章节分析 + AI 建议 + 引导写作折叠区
 */
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import {
  BookOpen,
  Sparkles,
  ChevronDown,
  Loader2,
  Wand2,
  FileText,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Send,
  Copy,
  RefreshCw,
  Check,
  Lightbulb,
  ChevronRight
} from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { message as antMessage } from 'ant-design-vue'
import type { OutlineNode } from '@/types/thesis-writer'

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 本地扩展类型，包含组件内部需要的额外属性
interface LocalGuidedQuestion {
  id: string
  question: string
  hint: string
  examples: string[]
  category: string
}
import { useThesisSSE } from '../composables/useThesisSSE'
import { useThesisStore } from '../stores/thesisStore'

const props = defineProps<{
  projectId: string
  nodeId: string
}>()

const emit = defineEmits<{
  insertContent: [content: string]
}>()

const { t } = useI18n()
const thesisStore = useThesisStore()
const { streamWrite, streamGuidedWrite, isStreaming: suggestLoading, stopStream } = useThesisSSE()
const guidedGenerating = suggestLoading

// ==================== 当前章节信息 ====================
function findNode(nodes: OutlineNode[], id: string): OutlineNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

const currentNode = computed(() => {
  if (!props.nodeId) return null
  return findNode(thesisStore.outline, props.nodeId)
})

const chapterTitle = computed(() => currentNode.value?.title || t('thesisWriter.store.unselectedChapter'))
const currentWords = computed(() => currentNode.value?.actualWordCount || 0)
const targetWords = computed(() => {
  if (currentNode.value?.targetWordCount) return currentNode.value.targetWordCount
  // 动态 fallback：根据全文目标字数和叶子节点数量均摊
  const projectTarget = thesisStore.currentProject?.targetWordCount
  if (projectTarget) {
    const leafCount = thesisStore.getFlatOutline().filter(n => !n.children || n.children.length === 0).length
    if (leafCount > 0) return Math.round(projectTarget / leafCount)
  }
  return 3000
})
const wordPercentage = computed(() => {
  if (targetWords.value === 0) return 0
  return Math.min(100, Math.round((currentWords.value / targetWords.value) * 100))
})
const chapterStatus = computed(() => currentNode.value?.status || 'pending')

const statusMap = computed<Record<string, { label: string; color: string }>>(() => ({
  pending: { label: t('thesisWriter.writingGuidance.statusTodo'), color: 'bg-slate-400' },
  in_progress: { label: t('thesisWriter.writingGuidance.statusWriting'), color: 'bg-blue-500' },
  draft: { label: t('thesisWriter.writingGuidance.statusDraft'), color: 'bg-amber-500' },
  revised: { label: t('thesisWriter.writingGuidance.statusRevised'), color: 'bg-violet-500' },
  completed: { label: t('thesisWriter.writingGuidance.statusDone'), color: 'bg-emerald-500' },
}))

// ==================== AI 建议 ====================
interface Suggestion {
  id: string
  title: string
  description: string
  generating?: boolean
}

const suggestions = ref<Suggestion[]>([])
const suggestionsLoaded = ref(false)

/** 加载建议：缓存优先，无缓存再调 API */
async function loadSuggestions() {
  if (!props.projectId || !props.nodeId) return

  // 优先从 Store 缓存恢复
  const cache = thesisStore.getSuggestionCache(props.nodeId)
  if (cache && cache.suggestions.length > 0) {
    suggestions.value = cache.suggestions
    suggestionsLoaded.value = true
    if (!prefersReduced) {
      await nextTick()
      gsap.fromTo(
        '.suggestion-item',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' }
      )
    }
    return
  }

  await fetchSuggestionsFromAPI()
}

/** 刷新按钮：清缓存，重新调 API */
async function refreshSuggestions() {
  if (!props.projectId || !props.nodeId) return
  if (suggestLoading.value) return
  thesisStore.clearSuggestionCache(props.nodeId)
  suggestions.value = []
  await fetchSuggestionsFromAPI()
}

/** 调用 LLM 生成建议 */
async function fetchSuggestionsFromAPI() {
  suggestions.value = []
  suggestionsLoaded.value = false
  let buffer = ''

  await streamWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'write_chapter',
      prompt: t('thesisWriter.writingGuidancePrompt.analyzeChapter'),
    },
    {
      onContent(chunk) {
        buffer += chunk
        // 尝试按行解析建议
        const lines = buffer.split('\n')
        const parsed: Suggestion[] = []
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          // 支持中文冒号 `：` 和英文冒号 `:` 两种格式
          const cleaned = trimmed.replace(/^\d+[\.\、\)）]\s*/, '')
          const colonMatch = cleaned.match(/^(.{2,30}?)[：:](.+)/)
          if (colonMatch) {
            parsed.push({
              id: `sug-${parsed.length}`,
              title: colonMatch[1].trim(),
              description: colonMatch[2].trim(),
            })
          } else if (cleaned.length > 5) {
            // 纯文本行：取第一个句号/逗号前的内容作为标题
            const sentenceEnd = cleaned.search(/[。，,.；;]/)
            const title = sentenceEnd > 2 && sentenceEnd <= 30
              ? cleaned.substring(0, sentenceEnd)
              : cleaned.substring(0, 20)
            parsed.push({
              id: `sug-${parsed.length}`,
              title,
              description: cleaned,
            })
          }
        }
        if (parsed.length > 0) {
          suggestions.value = parsed
        }
      },
      onDone() {
        suggestionsLoaded.value = true
        // 写入缓存
        if (suggestions.value.length > 0) {
          thesisStore.saveSuggestionCache(props.nodeId, {
            suggestions: suggestions.value.map(s => ({ id: s.id, title: s.title, description: s.description })),
          })
        }
        if (!prefersReduced) {
          nextTick(() => {
            gsap.fromTo(
              '.suggestion-item',
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'power2.out' }
            )
          })
        }
      },
      onError() {
        suggestionsLoaded.value = true
      },
    }
  )
}

function handleGenerate(suggestion: Suggestion) {
  // 如果已有流式请求正在进行，先重置之前建议的 generating 状态
  if (suggestLoading.value) {
    for (const s of suggestions.value) {
      if (s.generating) s.generating = false
    }
    stopStream()
  }
  suggestion.generating = true
  streamWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'write_chapter',
      prompt: suggestion.description,
    },
    {
      onContent() { /* 累积中 */ },
      onDone(fullContent) {
        suggestion.generating = false
        if (fullContent && fullContent.trim()) {
          emit('insertContent', fullContent)
        } else {
          antMessage.warning(t('thesisWriter.writingGuidance.noValidContent'))
        }
      },
      onError(err) {
        suggestion.generating = false
        antMessage.error(t('thesisWriter.writingGuidance.generateFailed', { error: err || '' }))
      },
    }
  )
}

// ==================== 引导写作折叠区 ====================
const guidedExpanded = ref(false)
const guidedContainerRef = ref<HTMLElement | null>(null)

function toggleGuided() {
  guidedExpanded.value = !guidedExpanded.value
  if (guidedExpanded.value && guidedQuestions.value.length === 0) {
    loadGuidedQuestions()
  }
  nextTick(() => {
    if (guidedContainerRef.value) {
      if (prefersReduced) {
        guidedContainerRef.value.style.height = guidedExpanded.value ? 'auto' : '0'
        guidedContainerRef.value.style.opacity = guidedExpanded.value ? '1' : '0'
        return
      }
      if (guidedExpanded.value) {
        gsap.fromTo(
          guidedContainerRef.value,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out' }
        )
      } else {
        gsap.to(guidedContainerRef.value, {
          height: 0,
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',
        })
      }
    }
  })
}

const guidedQuestions = ref<LocalGuidedQuestion[]>([])
const guidedQuestionsLoading = ref(false)

async function loadGuidedQuestions() {
  if (!props.projectId || !props.nodeId) return
  if (guidedQuestionsLoading.value) return
  guidedQuestionsLoading.value = true
  guidedQuestions.value = []

  let buffer = ''
  await streamWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'write_chapter',
      prompt: `请为论文章节「${chapterTitle.value}」生成3-5个引导写作的问题。
每个问题单独一行，格式为：问题内容 | 提示信息 | 示例回答
例如：你的研究领域面临哪些主要挑战？ | 描述研究背景和存在的问题 | 在人工智能领域，模型可解释性一直是挑战`,
    },
    {
      onContent(chunk) {
        buffer += chunk
        const lines = buffer.split('\n').filter(l => l.includes('|'))
        const parsed: LocalGuidedQuestion[] = []
        for (const line of lines) {
          const parts = line.split('|').map(s => s.trim())
          if (parts.length >= 2 && parts[0].length > 5) {
            parsed.push({
              id: `gq-${parsed.length}`,
              question: parts[0].replace(/^\d+[\.\、]\s*/, ''),
              hint: parts[1] || '',
              examples: parts[2] ? [parts[2]] : [],
              category: 'background',
            })
          }
        }
        if (parsed.length > 0) guidedQuestions.value = parsed
      },
      onDone() { guidedQuestionsLoading.value = false },
      onError() { guidedQuestionsLoading.value = false },
    }
  )
}

const guidedAnswers = ref<Map<string, string>>(new Map())
const currentGuidedAnswer = ref('')
const currentGuidedIndex = ref(0)
const guidedResult = ref('')
const showGuidedResult = ref(false)

function submitGuidedAnswer() {
  const q = guidedQuestions.value[currentGuidedIndex.value]
  if (!q || !currentGuidedAnswer.value.trim()) return
  guidedAnswers.value.set(q.id, currentGuidedAnswer.value.trim())
  currentGuidedAnswer.value = ''
  currentGuidedIndex.value++

  if (currentGuidedIndex.value >= guidedQuestions.value.length) {
    generateGuidedContent()
  }
}

async function generateGuidedContent() {
  if (!props.projectId) return
  if (guidedGenerating.value) return
  guidedResult.value = ''
  showGuidedResult.value = true

  // 将 answers 的 key 从 q.id 替换为问题文本，让 LLM 能理解上下文
  const semanticAnswers: Record<string, string> = {}
  for (const q of guidedQuestions.value) {
    const val = guidedAnswers.value.get(q.id)
    if (val && val.trim()) {
      semanticAnswers[q.question] = val
    }
  }

  await streamGuidedWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      chapterType: chapterTitle.value,
      answers: semanticAnswers,
    },
    {
      onContent(chunk) { guidedResult.value += chunk },
      onDone() {
        if (!prefersReduced) {
          nextTick(() => {
            gsap.fromTo('.guided-result', { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.2)' })
          })
        }
      },
      onError(error) { guidedResult.value = t('thesisWriter.writingGuidance.guidedGenerateFailed', { error }) },
    }
  )
}

function insertGuidedResult() {
  emit('insertContent', guidedResult.value)
}

function resetGuided() {
  guidedAnswers.value.clear()
  currentGuidedIndex.value = 0
  currentGuidedAnswer.value = ''
  guidedResult.value = ''
  showGuidedResult.value = false
}

// ==================== 生命周期 ====================
watch([() => props.projectId, () => props.nodeId], () => {
  if (props.projectId && props.nodeId) {
    loadSuggestions()
    resetGuided()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  stopStream()
  // GSAP 清理：kill 所有动画目标防止内存泄漏
  gsap.killTweensOf('.suggestion-item')
  gsap.killTweensOf('.guided-result')
  if (guidedContainerRef.value) gsap.killTweensOf(guidedContainerRef.value)
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- 章节分析区 -->
    <div class="shrink-0 p-4 border-b border-slate-100/50 dark:border-slate-700/50 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <BookOpen :size="16" class="text-slate-500 shrink-0" />
          <span class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{{ chapterTitle }}</span>
        </div>
        <span
          class="shrink-0 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          :class="statusMap[chapterStatus]?.color || 'bg-slate-400'"
        >
          {{ statusMap[chapterStatus]?.label || t('thesisWriter.writingGuidance.statusUnknown') }}
        </span>
      </div>

      <!-- 字数进度 -->
      <div>
        <div class="flex justify-between text-xs text-slate-500 mb-1">
          <span>{{ t('thesisWriter.writingGuidance.wordProgress') }}</span>
          <span>{{ currentWords.toLocaleString() }} / {{ targetWords.toLocaleString() }}</span>
        </div>
        <div class="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-violet-500 rounded-full transition-all duration-500"
            :style="{ width: `${wordPercentage}%` }"
          />
        </div>
      </div>
    </div>

    <!-- 可滚动内容区 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- AI 建议列表 -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5">
            <Sparkles :size="14" class="text-violet-500" />
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{{ t('thesisWriter.writingGuidance.aiSuggestions') }}</span>
          </div>
          <TooltipProvider v-if="suggestionsLoaded" :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  :aria-label="t('thesisWriter.writingGuidance.refreshTooltip')"
                  class="p-1 text-slate-400 hover:text-violet-500 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :disabled="suggestLoading"
                  @click="refreshSuggestions"
                >
                  <RefreshCw :size="12" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.writingGuidance.refreshTooltip') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- 加载态 -->
        <div v-if="suggestLoading && suggestions.length === 0" class="space-y-2">
          <div v-for="i in 3" :key="i" class="p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50">
            <div class="h-3.5 bg-slate-200 dark:bg-zinc-700 rounded w-2/3 animate-pulse mb-2"></div>
            <div class="h-3 bg-slate-100 dark:bg-zinc-700/50 rounded w-full animate-pulse"></div>
          </div>
        </div>

        <!-- 空态 -->
        <div v-else-if="suggestionsLoaded && suggestions.length === 0" class="text-center py-6">
          <FileText :size="24" class="mx-auto text-muted-foreground/50 mb-2" />
          <p class="text-xs text-muted-foreground">{{ t('thesisWriter.writingGuidance.emptySuggestion') }}</p>
        </div>

        <!-- 建议卡片 -->
        <div v-else class="space-y-2">
          <div
            v-for="sug in suggestions"
            :key="sug.id"
            class="suggestion-item group p-3 rounded-lg bg-slate-50/80 dark:bg-zinc-800/50 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-base font-medium text-slate-700 dark:text-zinc-200 mb-0.5 truncate">{{ sug.title }}</p>
                <p class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">{{ sug.description }}</p>
              </div>
              <button
                class="shrink-0 px-2.5 py-1 rounded-md text-xs font-medium bg-violet-500 text-white hover:bg-violet-600 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                :disabled="sug.generating || suggestLoading"
                @click="handleGenerate(sug)"
              >
                <Loader2 v-if="sug.generating" :size="12" class="animate-spin" />
                <Wand2 v-else :size="12" />
                {{ t('thesisWriter.writingGuidance.generateBtn') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 引导写作折叠区 -->
      <div class="border-t border-slate-100/50 dark:border-slate-700/50 pt-4">
        <button
          class="w-full flex items-center justify-between py-2 px-1 text-left"
          @click="toggleGuided"
        >
          <div class="flex items-center gap-2">
            <HelpCircle :size="14" class="text-amber-500" />
            <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{{ t('thesisWriter.writingGuidance.guidedWriting') }}</span>
          </div>
          <ChevronDown
            :size="14"
            class="text-slate-400 transition-transform duration-200"
            :class="{ 'rotate-180': guidedExpanded }"
          />
        </button>

        <!-- 折叠内容 -->
        <div ref="guidedContainerRef" class="overflow-hidden" :style="{ height: guidedExpanded ? 'auto' : '0px', opacity: guidedExpanded ? 1 : 0 }">
          <div class="pt-2 space-y-3">
            <!-- 引导问题加载中 -->
            <div v-if="guidedQuestionsLoading" class="py-4 text-center">
              <Loader2 :size="16" class="animate-spin text-amber-500 mx-auto mb-2" />
              <p class="text-xs text-slate-400">{{ t('thesisWriter.writingGuidance.generatingQuestions') }}</p>
            </div>

            <!-- 已回答的 -->
            <div v-for="(q, idx) in guidedQuestions.slice(0, currentGuidedIndex)" :key="q.id" class="space-y-1">
              <p class="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle2 :size="12" class="text-emerald-500" />
                {{ q.question }}
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-400 pl-4 bg-slate-50 dark:bg-slate-800/50 rounded p-2">
                {{ guidedAnswers.get(q.id) }}
              </p>
            </div>

            <!-- 当前问题 -->
            <div v-if="!showGuidedResult && currentGuidedIndex < guidedQuestions.length" class="space-y-2">
              <p class="text-base text-slate-700 dark:text-zinc-200 font-medium">
                {{ guidedQuestions[currentGuidedIndex].question }}
              </p>
              <p class="text-xs text-slate-400 dark:text-zinc-500">
                {{ guidedQuestions[currentGuidedIndex].hint }}
              </p>
              <!-- 示例 -->
              <div v-if="guidedQuestions[currentGuidedIndex].examples.length" class="space-y-1">
                <button
                  v-for="(ex, i) in guidedQuestions[currentGuidedIndex].examples"
                  :key="i"
                  class="w-full text-left p-2 rounded text-xs text-slate-500 bg-slate-50 dark:bg-zinc-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  @click="currentGuidedAnswer = ex"
                >
                  <ChevronRight :size="10" class="inline mr-1 text-violet-400" />
                  {{ ex }}
                </button>
              </div>
              <!-- 输入 -->
              <div class="flex gap-2">
                <textarea
                  v-model="currentGuidedAnswer"
                  rows="2"
                  class="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:focus:border-violet-400 transition-all
                           text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  :placeholder="t('thesisWriter.writingGuidance.answerPlaceholder')"
                  @keydown.enter.ctrl="submitGuidedAnswer"
                />
                <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        :aria-label="t('thesisWriter.writingGuidance.submitAnswer')"
                        class="self-end p-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50 active:scale-95"
                        :disabled="!currentGuidedAnswer.trim()"
                        @click="submitGuidedAnswer"
                      >
                        <Send :size="14" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.writingGuidance.submitAnswerShortcut') }}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <!-- 生成结果 -->
            <div v-if="showGuidedResult" class="guided-result space-y-2">
              <div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div class="flex items-center gap-1.5 mb-2">
                  <Sparkles :size="12" class="text-emerald-500" />
                  <span class="text-xs font-medium text-emerald-700 dark:text-emerald-300">{{ t('thesisWriter.writingGuidance.guidedResult') }}</span>
                </div>
                <p class="text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{{ guidedResult }}</p>
                <div v-if="guidedGenerating" class="flex items-center gap-1 mt-2">
                  <Loader2 :size="12" class="animate-spin text-emerald-500" />
                  <span class="text-xs text-slate-400">{{ t('thesisWriter.writingGuidance.streamingHint') }}</span>
                </div>
                <div v-else class="flex gap-2 mt-3 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                  <button
                    class="flex-1 py-1.5 text-xs font-medium rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="guidedGenerating"
                    @click="insertGuidedResult"
                  >
                    <ArrowRight :size="12" />
                    {{ t('thesisWriter.writingGuidance.insertToEditor') }}
                  </button>
                  <button
                    class="px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="guidedGenerating"
                    @click="resetGuided"
                  >
                    <RefreshCw :size="12" />
                    {{ t('thesisWriter.writingGuidance.restartGuide') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 引导进度 -->
            <div v-if="!showGuidedResult" class="flex items-center gap-2 text-xs text-slate-400">
              <span>{{ t('thesisWriter.writingGuidance.progressLabel') }}</span>
              <div class="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-amber-500 rounded-full transition-all duration-300"
                  :style="{ width: `${guidedQuestions.length > 0 ? (currentGuidedIndex / guidedQuestions.length) * 100 : 0}%` }"
                />
              </div>
              <span>{{ currentGuidedIndex }}/{{ guidedQuestions.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
