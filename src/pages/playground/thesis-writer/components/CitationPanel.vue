<script setup lang="ts">
/**
 * 引用管理面板 (Tab 3)
 * 搜索学术文献 + 管理已添加引用 + 插入引用标注
 */
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import {
  Search,
  Plus,
  Trash2,
  Quote,
  Loader2,
  BookOpen,
  ExternalLink,
  ArrowDownToLine,
  X
} from 'lucide-vue-next'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { message } from 'ant-design-vue'
import type { Citation } from '@/types/thesis-writer'
import {
  getCitations,
  addCitation,
  deleteCitation,
  searchScholar,
} from '@/api/thesis-writer'
import { useThesisStore } from '../stores/thesisStore'

const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const thesisStore = useThesisStore()

const emit = defineEmits<{
  insertCitation: [text: string]
}>()

// ==================== 状态 ====================
const citations = ref<Citation[]>([])
const citationsLoading = ref(false)
const searchQuery = ref('')
const searchResults = ref<Citation[]>([])
const searching = ref(false)
const addingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

// ==================== 加载已有引用 ====================
async function loadCitations() {
  if (!props.projectId) return
  citationsLoading.value = true
  try {
    const res = await getCitations(props.projectId)
    if (res.code === 200) {
      citations.value = res.data || []
      // 同步到 store，驱动 HealthDashboard 引用计数更新
      thesisStore.citations = [...citations.value]
    }
  } catch (e) {
    console.error('Failed to load citations:', e)
  } finally {
    citationsLoading.value = false
  }
}

// ==================== 搜索 ====================
async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q || searching.value) return
  searching.value = true
  searchResults.value = []
  try {
    const res = await searchScholar(q, 10)
    if (res.code === 200) {
      searchResults.value = res.data || []
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (!prefersReduced) {
        nextTick(() => {
          gsap.fromTo(
            '.search-result-item',
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.25, stagger: 0.05, ease: 'power2.out' }
          )
        })
      }
    }
  } catch (e) {
    console.error('Scholar search failed:', e)
    message.error(t('thesisWriter.citation.searchFailed'))
  } finally {
    searching.value = false
  }
}

// ==================== 添加引用 ====================
async function handleAddCitation(result: Citation) {
  if (!props.projectId) return
  const citationKey = result.id || result.title
  if (addingId.value === citationKey) return
  addingId.value = citationKey
  try {
    const { id, formattedText, ...citationData } = result
    const res = await addCitation(props.projectId, citationData)
    if (res.code === 200 && res.data) {
      citations.value.push(res.data)
      // 同步到 store，驱动 HealthDashboard 引用计数更新
      thesisStore.citations = [...citations.value]
      // 从搜索结果中移除已添加的
      searchResults.value = searchResults.value.filter(r => r.title !== result.title)
      message.success(t('thesisWriter.citation.addSuccess'))
    }
  } catch (e) {
    console.error('Failed to add citation:', e)
    message.error(t('common.error.generic'))
  } finally {
    addingId.value = null
  }
}

// ==================== 删除引用 ====================
async function handleDeleteCitation(citation: Citation) {
  if (deletingId.value === citation.id) return
  deletingId.value = citation.id
  try {
    const res = await deleteCitation(citation.id)
    if (res.code === 200) {
      citations.value = citations.value.filter(c => c.id !== citation.id)
      // 同步到 store，驱动 HealthDashboard 引用计数更新
      thesisStore.citations = [...citations.value]
      message.success(t('thesisWriter.citation.deleteSuccess'))
    }
  } catch (e) {
    console.error('Failed to delete citation:', e)
    message.error(t('common.error.deleteFailed'))
  } finally {
    deletingId.value = null
  }
}

// ==================== 插入引用标注 ====================
function handleInsertCitation(index: number) {
  emit('insertCitation', `[${index + 1}]`)
}

// ==================== 格式化作者 ====================
function formatAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return t('thesisWriter.citation.unknownAuthor')
  if (authors.length <= 2) return authors.join(', ')
  return `${authors[0]} 等`
}

// ==================== 监听项目变化 ====================
watch(() => props.projectId, () => {
  if (props.projectId) loadCitations()
}, { immediate: true })

onUnmounted(() => {
  gsap.killTweensOf('.search-result-item')
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- 搜索栏 -->
    <div class="shrink-0 p-3 sm:p-4 border-b border-border/50">
      <div class="relative">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          class="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-muted/80 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-foreground placeholder:text-muted-foreground"
          :placeholder="t('thesisWriter.citation.searchPlaceholder')"
          @keydown.enter="handleSearch"
        />
      </div>
    </div>

    <!-- 可滚动内容区 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 搜索结果 -->
      <div v-if="searching || searchResults.length > 0" class="p-3 sm:p-4 border-b border-border/50">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ t('thesisWriter.citation.searchResults') }}</span>
          <TooltipProvider v-if="searchResults.length > 0" :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                  :aria-label="t('thesisWriter.citation.clearResults')"
                  @click="searchResults = []"
                >
                  <X :size="14" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" :side-offset="6">{{ t('thesisWriter.citation.clearResults') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- 加载态 -->
        <div v-if="searching" class="flex items-center justify-center py-6">
          <Loader2 :size="20" class="animate-spin text-violet-500" />
          <span class="text-sm text-muted-foreground ml-2">{{ t('thesisWriter.citation.searching') }}</span>
        </div>

        <!-- 结果列表 -->
        <div v-else class="space-y-2">
          <div
            v-for="result in searchResults"
            :key="result.id || result.title"
            class="search-result-item p-3 rounded-lg bg-muted/80 border border-transparent hover:border-border transition-all group"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-base font-medium text-foreground line-clamp-2 mb-1">{{ result.title }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatAuthors(result.authors) }} · {{ result.year }}
                  <span v-if="result.source" class="text-muted-foreground/70"> · {{ result.source }}</span>
                </p>
              </div>
              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="shrink-0 w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      :disabled="addingId === (result.id || result.title)"
                      :aria-label="t('thesisWriter.citation.addToCitation')"
                      @click="handleAddCitation(result)"
                    >
                      <Loader2 v-if="addingId === (result.id || result.title)" :size="16" class="animate-spin" />
                      <Plus v-else :size="16" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" :side-offset="6">{{ t('thesisWriter.citation.addToCitation') }}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <!-- 已添加引用列表 -->
      <div class="p-3 sm:p-4">
        <div class="flex items-center gap-1.5 mb-3">
          <Quote :size="14" class="text-amber-500" />
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ t('thesisWriter.citation.addedCitations') }}</span>
          <span class="text-xs text-muted-foreground/70 ml-auto">{{ citations.length }} 篇</span>
        </div>

        <!-- 加载态 -->
        <div v-if="citationsLoading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="p-3 rounded-lg bg-muted">
            <div class="h-3.5 bg-muted-foreground/20 rounded w-3/4 animate-pulse mb-2"></div>
            <div class="h-3 bg-muted-foreground/10 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>

        <!-- 空态 -->
        <div v-else-if="citations.length === 0" class="text-center py-8">
          <BookOpen :size="28" class="mx-auto text-muted-foreground/50 mb-2" />
          <p class="text-base text-muted-foreground">{{ t('thesisWriter.citation.noCitation') }}</p>
          <p class="text-xs text-muted-foreground/70 mt-1">{{ t('thesisWriter.citation.noCitationHint') }}</p>
        </div>

        <!-- 引用列表 -->
        <div v-else class="space-y-1.5">
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <div
              v-for="(citation, idx) in citations"
              :key="citation.id"
              class="group flex items-start gap-2 p-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <!-- 序号 -->
              <span class="shrink-0 w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-mono font-medium text-muted-foreground">
                {{ idx + 1 }}
              </span>

              <!-- 内容 -->
              <div class="min-w-0 flex-1">
                <p class="text-base text-foreground line-clamp-1">{{ citation.title }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">{{ formatAuthors(citation.authors) }} · {{ citation.year }}</p>
              </div>

              <!-- 操作 -->
              <div class="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                      :aria-label="t('thesisWriter.citation.insertCitation')"
                      @click="handleInsertCitation(idx)"
                    >
                      <ArrowDownToLine :size="16" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.citation.insertCitation') }}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      class="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      :aria-label="t('thesisWriter.citation.deleteCitation')"
                      :disabled="deletingId === citation.id"
                      @click="handleDeleteCitation(citation)"
                    >
                      <Loader2 v-if="deletingId === citation.id" :size="16" class="animate-spin" />
                      <Trash2 v-else :size="16" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.citation.deleteCitation') }}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </div>
</template>
