<template>
  <ADrawer
    :open="visible"
    :title="t('thesisWriter.batchDraft.title')"
    placement="right"
    :width="drawerWidth"
    :closable="step !== 'generating' && step !== 'saving'"
    :mask-closable="step !== 'generating' && step !== 'saving'"
    @close="handleClose"
  >
    <!-- Step 1: 选择章节 -->
    <div v-if="step === 'select'" class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto space-y-1">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">{{ t('thesisWriter.batchDraft.stepSelectChapters') }}</span>
          <button
            class="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
            @click="toggleSelectAll"
          >
            {{ isAllSelected ? t('thesisWriter.batchDraft.deselectAll') : t('thesisWriter.batchDraft.selectAll') }}
          </button>
        </div>

        <label
          v-for="node in leafNodes"
          :key="node.id"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
          :class="selectedNodeIds.has(node.id)
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700'
            : 'bg-background border border-border hover:border-border/80'"
        >
          <Checkbox
            :checked="selectedNodeIds.has(node.id)"
            class="border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            @update:checked="() => toggleNode(node.id)"
          />
          <div class="flex-1 min-w-0">
            <span class="text-sm text-foreground block truncate">
              <span v-for="i in (node.level - 1)" :key="i" class="text-muted-foreground/50 mr-1">&mdash;</span>
              {{ node.title }}
            </span>
            <span v-if="node.actualWordCount > 0" class="text-xs text-orange-500 font-medium">
              {{ t('thesisWriter.batchDraft.hasContentWarning', { count: node.actualWordCount }) }}
            </span>
          </div>
        </label>

        <div v-if="leafNodes.length === 0" class="text-center py-12 text-muted-foreground text-sm">
          {{ t('thesisWriter.batchDraft.emptyOutline') }}
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-4 border-t border-border flex items-center justify-between shrink-0">
        <span class="text-xs text-muted-foreground">
          {{ t('thesisWriter.batchDraft.selectedCount', { selected: selectedNodeIds.size, total: leafNodes.length }) }}
        </span>
        <button
          class="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg
                 hover:bg-amber-600 active:scale-[0.98] transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="selectedNodeIds.size === 0 || questionsLoading"
          @click="goToQuestions"
        >
          {{ t('thesisWriter.batchDraft.nextStep') }}
        </button>
      </div>
    </div>

    <!-- Step 2: 引导问题 -->
    <div v-else-if="step === 'questions'" class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="questionsLoading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="rounded-xl border border-border bg-background p-5 animate-pulse">
            <div class="flex items-start gap-3 mb-3">
              <div class="w-6 h-6 rounded-full bg-muted-foreground/20" />
              <div class="h-4 bg-muted-foreground/20 rounded w-3/4" />
            </div>
            <div class="ml-9 space-y-2">
              <div class="h-8 bg-muted rounded-lg" />
              <div class="h-8 bg-muted rounded-lg w-2/3" />
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="questionsError" class="text-center py-8">
          <p class="text-sm text-destructive mb-3">{{ questionsError }}</p>
          <button
            class="text-sm text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="questionsLoading"
            @click="loadQuestions"
          >
            {{ t('thesisWriter.batchDraft.retryBtn') }}
          </button>
        </div>

        <!-- Questions -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">{{ t('thesisWriter.batchDraft.guidedQuestions') }}</span>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="p-1.5 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed"
                    :aria-label="t('thesisWriter.batchDraft.refreshQuestionsTooltip')"
                    :disabled="questionsLoading"
                    @click="refreshQuestions"
                  >
                    <RefreshCw :size="14" :class="{ 'animate-spin': questionsLoading }" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" :side-offset="6">{{ t('thesisWriter.batchDraft.refreshQuestionsTooltip') }}</TooltipContent>
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

          <!-- Note -->
          <div class="rounded-xl border border-dashed border-border/70 bg-background/80 p-4">
            <label class="text-xs font-medium text-muted-foreground mb-1.5 block">{{ t('thesisWriter.batchDraft.noteLabel') }}</label>
            <textarea
              v-model="note"
              class="w-full px-3 py-2 text-sm border-0 bg-transparent resize-none
                     focus:outline-none placeholder:text-muted-foreground
                     text-foreground"
              :placeholder="t('thesisWriter.batchDraft.notePlaceholder')"
              rows="2"
            />
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-4 border-t border-border flex items-center gap-3 shrink-0">
        <button
          class="px-4 py-2 text-sm text-foreground/80 bg-background border border-border rounded-lg
                 hover:bg-accent transition-colors"
          @click="step = 'select'"
        >
          {{ t('thesisWriter.batchDraft.prevStep') }}
        </button>
        <button
          class="flex-1 px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg
                 hover:bg-amber-600 active:scale-[0.98] transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2"
          :disabled="!hasAnyAnswer || questionsLoading || isStartingGeneration"
          @click="startGeneration"
        >
          <Sparkles :size="16" />
          {{ t('thesisWriter.batchDraft.startGenerateCount', { count: selectedNodeIds.size }) }}
        </button>
      </div>
    </div>

    <!-- Step 3: 生成进度 -->
    <div v-else-if="step === 'generating'" class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto space-y-4">
        <!-- Progress Bar -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-foreground">
              {{ t('thesisWriter.batchDraft.progressCount', { done: batchDraft.generatedCount.value, total: batchDraft.totalCount.value }) }}
            </span>
            <span class="text-xs text-muted-foreground">{{ batchDraft.progress.value }}%</span>
          </div>
          <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              ref="progressBarRef"
              class="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
              :style="{ width: `${batchDraft.progress.value}%` }"
            />
          </div>
        </div>

        <!-- Current Node -->
        <div v-if="batchDraft.currentNodeTitle.value" class="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 :size="14" class="animate-spin" />
          <span>{{ t('thesisWriter.batchDraft.generatingNode', { name: batchDraft.currentNodeTitle.value }) }}</span>
        </div>

        <!-- Preview -->
        <div v-if="batchDraft.currentPreview.value" class="rounded-lg border border-border bg-muted p-3 max-h-48 overflow-y-auto">
          <p class="text-xs text-muted-foreground mb-1">{{ t('thesisWriter.batchDraft.livePreview') }}</p>
          <div class="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{{ previewText }}</div>
        </div>

        <!-- Generated List -->
        <div v-if="generatedNodes.length > 0" class="space-y-1">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{{ t('thesisWriter.batchDraft.generatedPending') }}</p>
          <div
            v-for="ns in generatedNodes"
            :key="ns.nodeId"
            class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <CheckCircle :size="14" class="text-blue-500 shrink-0" />
            <span class="text-sm text-foreground flex-1 truncate">{{ ns.title }}</span>
            <span class="text-xs text-muted-foreground">{{ ns.wordCount }} {{ t('thesisWriter.batchDraft.wordUnit') }}</span>
          </div>
        </div>

        <!-- Error nodes during generation -->
        <div v-if="batchDraft.failedNodes.value.length > 0" class="space-y-1">
          <p class="text-xs font-medium text-destructive/70 uppercase tracking-wide mb-2">{{ t('thesisWriter.batchDraft.failed') }}</p>
          <div
            v-for="ns in batchDraft.failedNodes.value"
            :key="ns.nodeId"
            class="flex items-center gap-2 px-3 py-2 bg-destructive/5 dark:bg-destructive/10 rounded-lg"
          >
            <AlertCircle :size="14" class="text-destructive shrink-0" />
            <span class="text-sm text-foreground flex-1 truncate">{{ ns.title }}</span>
            <span class="text-xs text-destructive/70">{{ ns.error }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-4 border-t border-border shrink-0">
        <button
          class="w-full px-4 py-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg
                 hover:bg-destructive/10 transition-colors"
          @click="handleCancel"
        >
          {{ t('thesisWriter.batchDraft.cancelGenerate') }}
        </button>
      </div>
    </div>

    <!-- Step 4: 审阅确认 -->
    <div v-else-if="step === 'review'" class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto space-y-3">
        <!-- 提示信息 -->
        <div class="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3">
          <p class="text-base text-amber-800 dark:text-amber-300">
            {{ t('thesisWriter.batchDraft.reviewHint', { count: batchDraft.generatedCount.value }) }}
          </p>
          <p v-if="batchDraft.failedNodes.value.length > 0" class="text-xs text-orange-600 mt-1">
            {{ t('thesisWriter.batchDraft.failedCount', { count: batchDraft.failedNodes.value.length }) }}
          </p>
        </div>

        <!-- 快捷操作 -->
        <div class="flex items-center gap-2">
          <button
            class="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
            @click="batchDraft.acceptAll()"
          >
            {{ t('thesisWriter.batchDraft.acceptAll') }}
          </button>
          <span class="text-slate-300">|</span>
          <button
            class="text-xs text-slate-500 hover:text-slate-600 font-medium transition-colors"
            @click="batchDraft.rejectAll()"
          >
            {{ t('thesisWriter.batchDraft.rejectAll') }}
          </button>
        </div>

        <!-- 节点审阅列表 -->
        <div
          v-for="ns in reviewableNodes"
          :key="ns.nodeId"
          class="rounded-xl border transition-all"
          :class="ns.decision === 'accepted'
            ? 'border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20'
            : ns.decision === 'rejected'
              ? 'border-border bg-slate-50/50 dark:bg-zinc-800/50 opacity-60'
              : 'border-amber-200 dark:border-amber-700 bg-background'"
        >
          <!-- 节点头部 -->
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-foreground block truncate">{{ ns.title }}</span>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-blue-500">{{ t('thesisWriter.batchDraft.generatedWords', { count: ns.wordCount }) }}</span>
                <span v-if="ns.existingWordCount > 0" class="text-xs text-orange-500 font-medium">
                  . {{ t('thesisWriter.batchDraft.overwriteWarning', { count: ns.existingWordCount }) }}
                </span>
              </div>
            </div>
            <!-- 采纳/拒绝按钮 -->
            <button
              v-if="ns.decision !== 'accepted'"
              class="px-3 py-1 text-xs font-medium rounded-md transition-all
                     bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95"
              @click="batchDraft.acceptNode(ns.nodeId)"
            >
              {{ t('thesisWriter.batchDraft.accept') }}
            </button>
            <button
              v-if="ns.decision !== 'rejected'"
              class="px-3 py-1 text-xs font-medium rounded-md transition-all
                     bg-background text-muted-foreground border border-border hover:bg-accent active:scale-95"
              @click="batchDraft.rejectNode(ns.nodeId)"
            >
              {{ ns.decision === 'accepted' ? t('thesisWriter.batchDraft.revoke') : t('thesisWriter.batchDraft.reject') }}
            </button>
          </div>

          <!-- 内容预览（可折叠） -->
          <div
            v-if="expandedPreviews.has(ns.nodeId)"
            class="px-4 pb-3 border-t border-border"
          >
            <div
              class="mt-2 text-sm text-foreground/80 leading-relaxed max-h-48 overflow-y-auto prose prose-sm"
              v-html="batchDraft.getNodeContent(ns.nodeId)"
            />
          </div>
          <button
            class="w-full px-4 py-1.5 text-xs text-muted-foreground hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
            @click="togglePreview(ns.nodeId)"
          >
            {{ expandedPreviews.has(ns.nodeId) ? t('thesisWriter.batchDraft.hidePreview') : t('thesisWriter.batchDraft.showPreview') }}
          </button>
        </div>

        <!-- 生成失败的节点 -->
        <div v-if="batchDraft.failedNodes.value.length > 0" class="space-y-1">
          <p class="text-xs font-medium text-destructive/70 uppercase tracking-wide mb-1">{{ t('thesisWriter.batchDraft.generationFailed') }}</p>
          <div
            v-for="ns in batchDraft.failedNodes.value"
            :key="ns.nodeId"
            class="flex items-center gap-2 px-3 py-2 bg-destructive/5 dark:bg-destructive/10 rounded-lg"
          >
            <AlertCircle :size="14" class="text-destructive shrink-0" />
            <span class="text-sm text-foreground flex-1 truncate">{{ ns.title }}</span>
            <span class="text-xs text-destructive/70">{{ ns.error }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-4 border-t border-border space-y-2 shrink-0">
        <button
          class="w-full px-5 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg
                 hover:bg-amber-600 active:scale-[0.98] transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-2"
          :disabled="batchDraft.acceptedNodes.value.length === 0 || isSavingAccepted"
          @click="handleSaveAccepted"
        >
          <Loader2 v-if="isSavingAccepted" :size="16" class="animate-spin" />
          <Sparkles v-else :size="16" />
          {{ isSavingAccepted
            ? t('thesisWriter.batchDraft.savingBtn')
            : t('thesisWriter.batchDraft.saveAcceptBtn', { count: batchDraft.acceptedNodes.value.length, words: batchDraft.acceptedWordCount.value }) }}
        </button>
        <button
          class="w-full px-4 py-2 text-sm text-muted-foreground bg-background border border-border rounded-lg
                 hover:bg-accent transition-colors"
          :disabled="isSavingAccepted"
          @click="handleDiscardAll"
        >
          {{ t('thesisWriter.batchDraft.discardAll') }}
        </button>
      </div>
    </div>

    <!-- Step 5: 完成汇总 -->
    <div v-else-if="step === 'done'" class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto">
        <!-- Summary -->
        <div class="text-center py-8">
          <div
class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            :class="batchDraft.completedCount.value > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'"
          >
            <CheckCircle v-if="batchDraft.completedCount.value > 0" :size="32" class="text-emerald-500" />
            <AlertCircle v-else :size="32" class="text-muted-foreground/50" />
          </div>
          <h3 class="text-lg font-semibold text-foreground mb-1">
            {{ batchDraft.completedCount.value > 0 ? t('thesisWriter.batchDraft.saveComplete') : t('thesisWriter.batchDraft.noContentSaved') }}
          </h3>
          <p v-if="batchDraft.completedCount.value > 0" class="text-base text-muted-foreground">
            {{ t('thesisWriter.batchDraft.acceptedCount', { count: batchDraft.completedCount.value, words: batchDraft.totalWordCount.value }) }}
          </p>
          <p v-if="batchDraft.rejectedNodes.value.length > 0" class="text-xs text-muted-foreground mt-1">
            {{ t('thesisWriter.batchDraft.rejectedCount', { count: batchDraft.rejectedNodes.value.length }) }}
          </p>
        </div>

        <!-- Node list -->
        <div class="space-y-1">
          <div
            v-for="ns in batchDraft.nodeStatuses.value"
            :key="ns.nodeId"
            class="flex items-center gap-2 px-3 py-2 rounded-lg"
            :class="ns.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20'
              : ns.decision === 'rejected' ? 'bg-muted/50'
              : 'bg-destructive/5 dark:bg-destructive/10'"
          >
            <CheckCircle v-if="ns.status === 'completed'" :size="14" class="text-emerald-500 shrink-0" />
            <X v-else-if="ns.decision === 'rejected'" :size="14" class="text-muted-foreground/50 shrink-0" />
            <AlertCircle v-else :size="14" class="text-destructive shrink-0" />
            <span class="text-sm text-foreground flex-1 truncate">{{ ns.title }}</span>
            <span v-if="ns.status === 'completed'" class="text-xs text-muted-foreground">{{ ns.wordCount }} {{ t('thesisWriter.batchDraft.wordUnit') }}</span>
            <span v-else-if="ns.decision === 'rejected'" class="text-xs text-muted-foreground">{{ t('thesisWriter.batchDraft.rejected') }}</span>
            <span v-else class="text-xs text-destructive/70">{{ ns.error }}</span>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-4 border-t border-border shrink-0">
        <button
          class="w-full px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-lg
                 hover:bg-foreground/90 active:scale-[0.98] transition-all"
          @click="handleComplete"
        >
          {{ t('thesisWriter.batchDraft.completeBtn') }}
        </button>
      </div>
    </div>
  </ADrawer>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Drawer as ADrawer } from 'ant-design-vue'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-vue-next'
import type { GuidedQuestionItem, OutlineNode } from '@/types/thesis-writer'
import { generateGuidedQuestions } from '@/api/thesis-writer'
import { useThesisStore } from '../stores/thesisStore'
import { useBatchDraft } from '../composables/useBatchDraft'
import GuideQuestionCard from './GuideQuestionCard.vue'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'

const props = defineProps<{
  visible: boolean
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'completed'): void
}>()

const { t } = useI18n()
const thesisStore = useThesisStore()
const batchDraft = useBatchDraft()

// 响应式 Drawer 宽度：小屏自适应，大屏最大 560px
const drawerWidth = computed(() => {
  if (typeof window === 'undefined') return 560
  return Math.min(560, window.innerWidth * 0.92)
})

// ==================== Step 管理 ====================
const step = ref<'select' | 'questions' | 'generating' | 'review' | 'saving' | 'done'>('select')
const isStartingGeneration = ref(false)
const isSavingAccepted = ref(false)
const expandedPreviews = ref<Set<string>>(new Set())

// ==================== Step 1: 选择章节 ====================
const selectedNodeIds = ref<Set<string>>(new Set())

/** 获取所有叶子节点（无 children 或 children 为空的节点） */
const leafNodes = computed<OutlineNode[]>(() => {
  const flat = thesisStore.getFlatOutline()
  return flat.filter(n => !n.children || n.children.length === 0)
})

const isAllSelected = computed(() =>
  leafNodes.value.length > 0 && leafNodes.value.every(n => selectedNodeIds.value.has(n.id)),
)

function toggleNode(nodeId: string) {
  const s = new Set(selectedNodeIds.value)
  if (s.has(nodeId)) {
    s.delete(nodeId)
  } else {
    s.add(nodeId)
  }
  selectedNodeIds.value = s
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedNodeIds.value = new Set()
  } else {
    selectedNodeIds.value = new Set(leafNodes.value.map(n => n.id))
  }
}

// ==================== Step 2: 引导问题 ====================
const questionsLoading = ref(false)
const questionsError = ref<string | null>(null)
const questions = ref<GuidedQuestionItem[]>([])
const answers = reactive<Record<string, string>>({})
const note = ref('')

const hasAnyAnswer = computed(() =>
  Object.values(answers).some(v => v && v.trim()),
)

/** 进入问题步骤 */
function goToQuestions() {
  step.value = 'questions'
  loadQuestions()
}

/** 加载引导问题 */
async function loadQuestions() {
  // 优先从缓存恢复
  const cache = thesisStore.getBatchGuideCache()
  if (cache && cache.questions.length > 0) {
    questions.value = cache.questions
    for (const q of cache.questions) {
      answers[q.id] = cache.answers[q.id] || ''
    }
    note.value = cache.note || ''
    return
  }

  await fetchQuestionsFromAPI()
}

async function refreshQuestions() {
  if (questionsLoading.value) return
  thesisStore.clearBatchGuideCache()
  for (const key of Object.keys(answers)) {
    delete answers[key]
  }
  note.value = ''
  questions.value = []
  await fetchQuestionsFromAPI()
}

async function fetchQuestionsFromAPI() {
  const nodeIds = Array.from(selectedNodeIds.value)
  if (nodeIds.length === 0) return
  if (questionsLoading.value) return

  questionsLoading.value = true
  questionsError.value = null
  try {
    // TODO: 后端 API 仅支持单 nodeId，批量场景下只能用第一个节点生成问题
    // 理想方案：后端支持传入多个 nodeId，生成覆盖所有章节的引导问题
    const res = await generateGuidedQuestions({
      projectId: props.projectId,
      nodeId: nodeIds[0],
    })
    if (res.code === 200 && res.data) {
      questions.value = res.data.questions || []
      for (const q of questions.value) {
        answers[q.id] = ''
      }
      persistCache()
    } else {
      questionsError.value = res.message || t('thesisWriter.batchDraft.loadQuestionsFailed')
    }
  } catch (e) {
    console.error('[BatchDraftModal] 加载引导问题失败:', e)
    questionsError.value = t('thesisWriter.batchDraft.networkError')
  } finally {
    questionsLoading.value = false
  }
}

function persistCache() {
  thesisStore.saveBatchGuideCache({
    questions: questions.value,
    chapterTitle: '',
    chapterDescription: '',
    answers: { ...answers },
    note: note.value,
  })
}

// 监听回答变化，写入缓存
watch([() => ({ ...answers }), note], () => {
  if (questions.value.length > 0) {
    persistCache()
  }
}, { deep: true })

// ==================== Step 3: 生成 ====================
const progressBarRef = ref<HTMLElement | null>(null)

/** 生成阶段：已生成的节点（待审阅） */
const generatedNodes = computed(() =>
  batchDraft.nodeStatuses.value.filter(n => n.status === 'generated' || n.status === 'completed'),
)

/** 审阅阶段：可审阅的节点（generated 状态） */
const reviewableNodes = computed(() =>
  batchDraft.nodeStatuses.value.filter(n => n.status === 'generated'),
)

const previewText = computed(() => {
  const text = batchDraft.currentPreview.value
  // 限制预览长度
  return text.length > 500 ? text.slice(-500) : text
})

async function startGeneration() {
  if (isStartingGeneration.value) return
  isStartingGeneration.value = true
  try {
    // 构建 semantic answers
    const semanticAnswers: Record<string, string> = {}
    for (const q of questions.value) {
      const val = answers[q.id]
      if (val && val.trim()) {
        semanticAnswers[q.question] = val
      }
    }

    // 清除缓存
    thesisStore.clearBatchGuideCache()

    step.value = 'generating'

    const nodeIds = Array.from(selectedNodeIds.value)
    const firstNode = thesisStore.getNode(nodeIds[0])

    await batchDraft.startBatchGeneration({
      projectId: props.projectId,
      selectedNodeIds: nodeIds,
      chapterType: firstNode?.title || '',
      answers: semanticAnswers,
      note: note.value || undefined,
    })

    // 生成结束后跳转：有已生成节点→审阅，否则→完成
    if (batchDraft.state.value === 'review') {
      step.value = 'review'
    } else if (batchDraft.state.value === 'done' || batchDraft.state.value === 'error') {
      step.value = 'done'
    }
  } finally {
    isStartingGeneration.value = false
  }
}

function handleCancel() {
  batchDraft.cancelGeneration()
  // cancelGeneration 内部会判断：有已生成节点→review，否则→done
  step.value = batchDraft.state.value === 'review' ? 'review' : 'done'
}

// 监听 batchDraft 状态变化
watch(() => batchDraft.state.value, (newState) => {
  if (step.value === 'generating') {
    if (newState === 'review') {
      step.value = 'review'
    } else if (newState === 'done' || newState === 'error') {
      step.value = 'done'
    }
  }
})

// ==================== Step 4: 审阅确认 ====================

function togglePreview(nodeId: string) {
  const s = new Set(expandedPreviews.value)
  if (s.has(nodeId)) {
    s.delete(nodeId)
  } else {
    s.add(nodeId)
  }
  expandedPreviews.value = s
}

async function handleSaveAccepted() {
  if (isSavingAccepted.value) return
  isSavingAccepted.value = true
  step.value = 'saving'
  try {
    await batchDraft.saveAcceptedNodes()
    step.value = 'done'
  } finally {
    isSavingAccepted.value = false
  }
}

function handleDiscardAll() {
  batchDraft.discardAll()
  step.value = 'done'
}

// ==================== Step 5: 完成 ====================
function handleComplete() {
  emit('completed')
  handleClose()
}

// ==================== Close ====================
function handleClose() {
  if (step.value === 'generating' || step.value === 'saving') {
    // 生成中/保存中不允许直接关闭
    return
  }
  batchDraft.reset()
  step.value = 'select'
  selectedNodeIds.value = new Set()
  expandedPreviews.value = new Set()
  questions.value = []
  for (const key of Object.keys(answers)) {
    delete answers[key]
  }
  note.value = ''
  emit('close')
}

// 打开时默认全选
watch(() => props.visible, (v) => {
  if (v) {
    selectedNodeIds.value = new Set(leafNodes.value.map(n => n.id))
    step.value = 'select'
    batchDraft.reset()
  }
})
</script>
