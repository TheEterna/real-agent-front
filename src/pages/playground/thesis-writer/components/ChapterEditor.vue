<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Editor Header (只在编辑模式显示) -->
    <div
      v-if="!showGuide"
      class="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between shrink-0"
    >
      <div>
        <h2 class="text-lg font-semibold text-slate-800 dark:text-zinc-100">{{ currentNode?.title || t('thesisWriter.chapterEditor.unselectedChapter') }}</h2>
        <p class="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          {{ currentNode?.description || t('thesisWriter.chapterEditor.startWriting') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Word Count -->
        <span class="text-xs text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {{ t('thesisWriter.chapterEditor.wordCount', { count: wordCount }) }}
        </span>
        <!-- Save Status -->
        <span
          v-if="isSaving"
          class="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1"
        >
          <Loader2 :size="12" class="animate-spin" />
          {{ t('thesisWriter.chapterEditor.saving') }}
        </span>
        <span
          v-else-if="lastSaved"
          class="text-xs text-green-600 dark:text-emerald-400 flex items-center gap-1"
        >
          <Check :size="12" />
          {{ t('thesisWriter.chapterEditor.saved') }}
        </span>
        <!-- Actions -->
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                :aria-label="t('thesisWriter.chapterEditor.aiPolish')"
                :disabled="isStreaming"
                @click="polishContent"
              >
                <Wand2 :size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('thesisWriter.chapterEditor.aiPolish') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                :aria-label="t('thesisWriter.chapterEditor.formatCheck')"
                :disabled="isStreaming"
                @click="checkFormat"
              >
                <FileCheck :size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('thesisWriter.chapterEditor.formatCheck') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Draft Banner (生成初稿时的提示条) -->
    <DraftBanner
      v-if="draftBannerStatus !== 'hidden'"
      :status="draftBannerStatus"
      :chapter-title="currentNode?.title"
      :batch-progress="batchProgress"
      @dismiss="dismissBanner"
    />

    <!-- 空白章节引导界面 -->
    <ChapterGuide
      v-if="showGuide"
      :project-id="projectId"
      :node-id="nodeId"
      :node-name="currentNode?.title"
      @generate="handleGuideGenerate"
      @skip="handleGuideSkip"
    />

    <!-- 编辑器内容区 -->
    <template v-else>
      <div class="flex-1 overflow-hidden bg-white dark:bg-zinc-900">
        <div class="h-full flex flex-col">
          <!-- Loading -->
          <template v-if="contentLoading">
            <div class="p-6 space-y-4 animate-pulse">
              <div class="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-3/4"></div>
              <div class="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-full"></div>
              <div class="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-5/6"></div>
              <div class="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-4/5"></div>
            </div>
          </template>

          <!-- TipTap Editor -->
          <TipTapEditor
            v-else
            ref="tiptapRef"
            v-model="content"
            class="flex-1 overflow-hidden"
            :placeholder="`${t('thesisWriter.chapterEditor.placeholderLine1')}\n\n${t('thesisWriter.chapterEditor.placeholderLine2')}\n• ${t('thesisWriter.chapterEditor.placeholderTip1')}\n• ${t('thesisWriter.chapterEditor.placeholderTip2')}\n• ${t('thesisWriter.chapterEditor.placeholderTip3')}\n• ${t('thesisWriter.chapterEditor.placeholderTip4')}\n• ${t('thesisWriter.chapterEditor.placeholderTip5')}`"
            @update:model-value="handleContentUpdate"
            @focus="handleEditorFocus"
            @blur="handleEditorBlur"
            @selection-change="handleSelectionChange"
            @ghost-request="handleGhostRequest"
          />
        </div>
      </div>

      <!-- Editor Footer / Toolbar -->
      <div class="px-6 py-3 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <button
            class="text-xs text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :aria-label="t('thesisWriter.chapterEditor.aiExpand')"
            :disabled="isStreaming"
            @click="expandWithAI"
          >
            <Sparkles :size="14" />
            {{ t('thesisWriter.chapterEditor.aiExpand') }}
          </button>
          <button
            class="text-xs text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :aria-label="t('thesisWriter.chapterEditor.citeSuggestion')"
            :disabled="isStreaming"
            @click="suggestCitation"
          >
            <QuoteIcon :size="14" />
            {{ t('thesisWriter.chapterEditor.citeSuggestion') }}
          </button>
          <button
            class="text-xs text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 transition-colors active:scale-95"
            :aria-label="t('thesisWriter.chapterEditor.versionHistoryBtn')"
            @click="emit('showVersionHistory')"
          >
            <History :size="14" />
            {{ t('thesisWriter.chapterEditor.versionHistoryBtn') }}
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400 dark:text-zinc-500">
            {{ t('thesisWriter.chapterEditor.targetWordCount') }} {{ currentNode?.targetWordCount || '-' }} {{ t('thesisWriter.batchDraft.wordUnit') }}
          </span>
          <button
            class="px-4 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSaving || !hasChanges"
            @click="saveContent"
          >
            {{ t('thesisWriter.chapterEditor.saveBtn') }}
          </button>
        </div>
      </div>
    </template>

    <!-- 选区浮动工具栏 -->
    <SelectionToolbar
      :visible="selectionToolbarVisible"
      :position="selectionPosition"
      :selected-text="selectedText"
      @action="handleInlineAction"
    />

    <!-- AI 结果浮层 -->
    <ADrawer
      v-model:open="aiPanelVisible"
      :title="aiPanelAction"
      placement="right"
      :width="aiDrawerWidth"
    >
      <div class="prose prose-sm max-w-none">
        <div v-if="isStreaming" class="flex items-center gap-2 mb-4">
          <Loader2 :size="16" class="animate-spin text-violet-500 dark:text-violet-400" />
          <span class="text-sm text-slate-500 dark:text-zinc-400">{{ t('thesisWriter.chapterEditor.streaming') }}</span>
        </div>
        <div class="whitespace-pre-wrap text-slate-700 dark:text-zinc-300 leading-relaxed">{{ aiPanelContent }}</div>
        <div v-if="!isStreaming && aiPanelContent" class="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-700 flex gap-2">
          <button
            class="px-3 py-1.5 text-xs bg-violet-500 text-white rounded-lg hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-500 transition-colors active:scale-95"
            @click="applyAIContent"
          >
            {{ t('thesisWriter.chapterEditor.applyToEditor') }}
          </button>
          <button
            class="px-3 py-1.5 text-xs bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors active:scale-95"
            @click="aiPanelVisible = false"
          >
            {{ t('thesisWriter.chapterEditor.closePanel') }}
          </button>
        </div>
      </div>
    </ADrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import MarkdownIt from 'markdown-it'
import {
  Loader2,
  Check,
  Wand2,
  FileCheck,
  Sparkles,
  Quote as QuoteIcon,
  History,
} from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { OutlineNode, InlineAction } from '@/types/thesis-writer'
import { getChapterContent } from '@/api/thesis-writer'
import { message, Drawer as ADrawer } from 'ant-design-vue'
import { useThesisSSE } from '../composables/useThesisSSE'
import { useThesisStore } from '../stores/thesisStore'
import TipTapEditor from './TipTapEditor.vue'
import SelectionToolbar from './SelectionToolbar.vue'
import ChapterGuide from './ChapterGuide.vue'
import DraftBanner from './DraftBanner.vue'

const props = defineProps<{
  nodeId: string
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'contentSaved'): void
  (e: 'contentChange', content: string): void
  (e: 'showVersionHistory'): void
}>()

// ==================== 状态 ====================
const { t } = useI18n()
const md = new MarkdownIt({ html: true })
const thesisStore = useThesisStore()
const tiptapRef = ref<InstanceType<typeof TipTapEditor> | null>(null)
const content = ref('')
const originalContent = ref('')
const currentNode = ref<OutlineNode | null>(null)
const contentLoading = ref(false)
const isSaving = ref(false)
const lastSaved = ref(false)

// ==================== 空白章节引导状态 ====================
/** 是否显示引导界面（章节为空且未跳过） */
const showGuide = ref(false)
/** 用户已跳过引导的节点 ID 集合 */
const skippedNodes = ref<Set<string>>(new Set())
/** 初稿生成提示条状态 */
const draftBannerStatus = ref<'generating' | 'done' | 'hidden'>('hidden')
/** 批量生成进度 */
const batchProgress = ref<{ current: number; total: number } | undefined>(undefined)

// ==================== SSE 流式 AI ====================
const { isStreaming, streamContent, streamWrite, streamGuidedWrite, streamInlineWrite, stopStream } = useThesisSSE()
const aiPanelVisible = ref(false)
const aiPanelContent = ref('')
const aiPanelAction = ref('')

// 响应式 Drawer 宽度：小屏自适应，大屏最大 400px
const aiDrawerWidth = computed(() => {
  if (typeof window === 'undefined') return 400
  return Math.min(400, window.innerWidth * 0.92)
})

// ==================== 选区工具栏 ====================
const selectionToolbarVisible = ref(false)
const selectionPosition = ref({ top: 0, left: 0 })
const selectedText = ref('')

// ==================== 计算属性 ====================
const wordCount = computed(() => {
  const text = tiptapRef.value?.getText() ?? content.value
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  return chineseChars + englishWords
})

const hasChanges = computed(() => content.value !== originalContent.value)

// ==================== 父节点聚合模式 ====================
/** 当前选中的是否为父节点（有子节点） */
const isParentNode = computed(() => {
  return !!(currentNode.value?.children && currentNode.value.children.length > 0)
})

/** 父节点模式下各子节点的原始内容快照（用于 diff 检测变更） */
const parentOriginalContents = new Map<string, string>()

/** 收集节点的所有后代节点（不含自身） */
function flattenDescendants(node: OutlineNode): OutlineNode[] {
  const result: OutlineNode[] = []
  for (const child of (node.children || [])) {
    result.push(child)
    if (child.children?.length) {
      result.push(...flattenDescendants(child))
    }
  }
  return result
}

/** 拼装聚合 HTML：[章节分隔符][内容]... */
function buildParentHTML(chapters: { nodeId: string; title: string; level: number; content: string }[]): string {
  let html = ''
  for (const ch of chapters) {
    const safeTitle = ch.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const safeAttrTitle = ch.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html += `<div data-type="chapter-divider" data-node-id="${ch.nodeId}" data-title="${safeAttrTitle}" data-level="${ch.level}" class="chapter-divider chapter-divider-level-${ch.level}">${safeTitle}</div>`
    html += ch.content || '<p></p>'
  }
  return html
}

/** 从聚合 HTML 中拆分各节点内容 */
function splitParentHTML(fullHTML: string): Map<string, string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${fullHTML}</div>`, 'text/html')
  const container = doc.body.firstElementChild!
  const result = new Map<string, string>()
  let currentNodeId: string | null = null
  let fragments: string[] = []
  for (const child of Array.from(container.children)) {
    if (child.getAttribute('data-type') === 'chapter-divider') {
      if (currentNodeId !== null) {
        result.set(currentNodeId, fragments.join(''))
      }
      currentNodeId = child.getAttribute('data-node-id')
      fragments = []
    } else {
      fragments.push(child.outerHTML)
    }
  }
  if (currentNodeId !== null) {
    result.set(currentNodeId, fragments.join(''))
  }
  return result
}

function normalizeHTMLForDiff(html: string): string {
  return html.replace(/\s+/g, ' ').trim()
}

/** 加载父节点下所有后代内容 */
async function loadParentContent(): Promise<string> {
  if (!currentNode.value) return ''
  const descendants = flattenDescendants(currentNode.value)
  parentOriginalContents.clear()

  const results = await Promise.all(
    descendants.map(async (node) => {
      try {
        const res = await getChapterContent(node.id)
        const nodeContent = res.code === 200 && res.data ? (res.data.content || '') : ''
        return { nodeId: node.id, title: node.title, level: node.level, content: nodeContent }
      } catch {
        return { nodeId: node.id, title: node.title, level: node.level, content: '' }
      }
    }),
  )

  for (const r of results) {
    parentOriginalContents.set(r.nodeId, r.content)
    // 缓存每个子节点内容，供后续章节切换使用
    thesisStore.cacheChapterContent(r.nodeId, r.content)
  }

  return buildParentHTML(results)
}

// ==================== 加载内容 ====================
async function loadContent() {
  if (!props.nodeId) return

  draftBannerStatus.value = 'hidden'
  batchProgress.value = undefined

  // SWR: 叶子节点优先使用内存缓存，立即显示内容（无 loading skeleton）
  if (!isParentNode.value) {
    const cached = thesisStore.getCachedChapterContent(props.nodeId)
    if (cached !== null) {
      content.value = cached
      originalContent.value = cached
      contentLoading.value = false
      updateGuideVisibility()

      // 后台静默 revalidate（捕获当前 nodeId 防止竞态）
      const revalidateNodeId = props.nodeId
      try {
        const res = await getChapterContent(revalidateNodeId)
        // 节点已切换，丢弃过期结果
        if (props.nodeId !== revalidateNodeId) return
        if (res.code === 200 && res.data) {
          const freshContent = res.data.content || ''
          thesisStore.cacheChapterContent(revalidateNodeId, freshContent)
          // 仅在用户未编辑时更新编辑器内容
          if (!hasChanges.value) {
            content.value = freshContent
            originalContent.value = freshContent
            updateGuideVisibility()
          }
        }
      } catch { /* 静默失败，已有缓存兜底 */ }
      return
    }
  }

  // 无缓存或父节点模式：常规加载（显示 skeleton）
  contentLoading.value = true

  try {
    if (isParentNode.value && currentNode.value) {
      // 父节点模式：加载所有后代内容并聚合
      const html = await loadParentContent()
      content.value = html
      originalContent.value = html
    } else {
      // 叶子节点：加载单节点内容
      const res = await getChapterContent(props.nodeId)
      if (res.code === 200 && res.data) {
        content.value = res.data.content || ''
        originalContent.value = content.value
        // 首次加载成功，写入缓存
        thesisStore.cacheChapterContent(props.nodeId, content.value)
      } else {
        content.value = ''
        originalContent.value = ''
      }
    }
  } catch (e) {
    // 404 或其他错误：视为空内容
    content.value = ''
    originalContent.value = ''
  } finally {
    contentLoading.value = false
    // 判断是否应显示引导界面
    updateGuideVisibility()
  }
}

/** 根据内容是否为空来决定是否显示引导 */
function updateGuideVisibility() {
  // 父节点永远不显示引导界面（展示聚合内容）
  if (isParentNode.value) {
    showGuide.value = false
    return
  }
  const isEmpty = !content.value || !content.value.trim()
  const isSkipped = skippedNodes.value.has(props.nodeId)
  showGuide.value = isEmpty && !isSkipped
}

// ==================== 引导界面事件处理 ====================
async function handleGuideGenerate(payload: { answers: Record<string, string>; note: string }) {
  if (isStreaming.value) return
  // 切换到编辑器视图
  showGuide.value = false
  draftBannerStatus.value = 'generating'

  // 等待编辑器挂载
  await nextTick()

  // 使用 streamGuidedWrite 流式生成初稿
  let accumulated = ''

  await streamGuidedWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      chapterType: currentNode.value?.title || '',
      answers: payload.answers,
      note: payload.note || undefined,
    },
    {
      onContent(chunk) {
        accumulated += chunk
        // 流式预览：每次收到内容都实时渲染 Markdown 到编辑器
        if (tiptapRef.value) {
          const html = md.render(accumulated)
          tiptapRef.value.setContent(html)
          content.value = tiptapRef.value.getHTML()
        }
      },
      onNodeComplete(nodeId) {
        // 批量生成：当前节点完成，保存内容
        saveContent()
      },
      onDone() {
        draftBannerStatus.value = 'done'
        // 最终确保内容正确
        if (tiptapRef.value) {
          const html = md.render(accumulated)
          tiptapRef.value.setContent(html)
          content.value = tiptapRef.value.getHTML()
        }
        // 自动保存
        saveContent()
        // 5 秒后自动隐藏提示条
        setTimeout(() => {
          draftBannerStatus.value = 'hidden'
        }, 5000)
      },
      onError(err) {
        draftBannerStatus.value = 'hidden'
        message.error(t('thesisWriter.chapterEditor.draftGenerateFailed', { error: err }))
      },
    }
  )
}

function handleGuideSkip() {
  skippedNodes.value.add(props.nodeId)
  showGuide.value = false
}

function dismissBanner() {
  draftBannerStatus.value = 'hidden'
}

// ==================== 保存内容 ====================
async function saveContent(): Promise<boolean> {
  if (!props.nodeId || !hasChanges.value) return false
  if (isSaving.value) return false

  // 检查节点是否被AI锁定
  if (thesisStore.isNodeLocked(props.nodeId)) {
    message.warning(t('thesisWriter.chapterEditor.aiLockedSave'))
    return false
  }

  isSaving.value = true
  lastSaved.value = false
  let success = false

  try {
    const textToSave = tiptapRef.value?.getHTML() ?? content.value

    if (isParentNode.value) {
      // 父节点模式：拆分 HTML 并逐节点保存变更部分
      const chapterContents = splitParentHTML(textToSave)
      const changedContents = new Map<string, string>()

      // 筛选有变更的章节
      for (const [nodeId, nodeContent] of chapterContents) {
        const original = parentOriginalContents.get(nodeId) ?? ''
        if (normalizeHTMLForDiff(nodeContent) !== normalizeHTMLForDiff(original)) {
          changedContents.set(nodeId, nodeContent)
        }
      }

      if (changedContents.size === 0) {
        isSaving.value = false
        return false
      }

      // 使用Store的批量保存方法（串行执行，保证顺序）
      const result = await thesisStore.batchSaveContents(changedContents)

      // 更新本地缓存
      for (const [nodeId, saved] of result.results) {
        if (saved) {
          const content = changedContents.get(nodeId)
          if (content !== undefined) {
            parentOriginalContents.set(nodeId, content)
          }
        }
      }

      if (result.saved > 0) {
        originalContent.value = content.value
        lastSaved.value = true
        success = true
        emit('contentSaved')
        setTimeout(() => { lastSaved.value = false }, 3000)

        // 如果有部分失败，显示提示
        if (result.errors > 0) {
          const failedNodes = Array.from(result.results.entries())
            .filter(([, saved]) => !saved)
            .map(([id]) => thesisStore.getNode(id)?.title || id)
          message.warning(t('thesisWriter.chapterEditor.partialSaveFailed', { names: failedNodes.join(', ') }))
        }
      }
    } else {
      // 叶子节点：保存单节点内容（使用Store的带锁保存）
      const result = await thesisStore.saveContent(props.nodeId, textToSave)

      if (result.success) {
        originalContent.value = content.value
        lastSaved.value = true
        success = true
        emit('contentSaved')
        setTimeout(() => { lastSaved.value = false }, 3000)
      } else {
        message.error(result.error || t('thesisWriter.chapterEditor.saveFailed'))
      }
    }
  } catch (e) {
    console.error('Failed to save content:', e)
    message.error(t('thesisWriter.chapterEditor.saveFailed'))
  } finally {
    isSaving.value = false
  }

  return success
}

// ==================== 输入处理 ====================
let saveTimeout: ReturnType<typeof setTimeout> | null = null

function handleContentUpdate(newContent: string) {
  // Auto-save: 3 seconds after stop typing
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    // 防抖保存前再次检查锁定状态
    if (hasChanges.value && !thesisStore.isNodeLocked(props.nodeId)) {
      saveContent()
    }
  }, 3000)

  emit('contentChange', newContent)
}

function handleEditorFocus() {
  // Could be used for future focus-related UI
}

function handleEditorBlur() {
  // Could be used for future blur-related UI
}

function handleSelectionChange(payload: { text: string; rect: { top: number; left: number; bottom: number } } | null) {
  if (!payload) {
    setTimeout(() => {
      selectionToolbarVisible.value = false
    }, 200)
    return
  }
  selectedText.value = payload.text
  selectionPosition.value = { top: payload.rect.top, left: payload.rect.left }
  selectionToolbarVisible.value = true
}

async function handleGhostRequest(context: { cursorPos: number; textBefore: string }) {
  // 父节点聚合模式下禁用 ghost text
  if (isParentNode.value) return
  // 使用 streamInlineWrite 获取续写建议，然后设为 ghost text
  let ghostResult = ''
  await streamInlineWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'continue' as InlineAction,
      selectedText: '',
      cursorContext: context.textBefore,
    },
    {
      onContent(chunk) { ghostResult += chunk },
      onDone() {
        if (ghostResult.trim()) {
          tiptapRef.value?.setGhostText(ghostResult.trim())
        }
      },
      onError() { /* 静默失败，不打断用户 */ },
    }
  )
}

async function handleInlineAction(action: InlineAction, text: string) {
  selectionToolbarVisible.value = false

  let customPrompt: string | undefined
  if (action === 'custom') {
    const input = window.prompt(t('thesisWriter.chapterEditor.customPrompt'))
    if (!input) return
    customPrompt = input
  }

  const fullText = tiptapRef.value?.getText() ?? ''
  const selIdx = fullText.indexOf(text)
  const contextStart = Math.max(0, selIdx - 200)
  const contextEnd = Math.min(fullText.length, selIdx + text.length + 200)
  const cursorContext = fullText.substring(contextStart, contextEnd)

  // 获取选区范围用于 InlineDiff
  const range = tiptapRef.value?.getSelectionRange()

  let inlineResult = ''

  await streamInlineWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action,
      selectedText: text,
      cursorContext,
      customPrompt,
    },
    {
      onContent(chunk) { inlineResult += chunk },
      onDone() {
        // 使用 InlineDiff 在编辑器内展示对比
        if (range && inlineResult.trim() && tiptapRef.value) {
          tiptapRef.value.showDiff(range.from, range.to, text, inlineResult.trim())
        } else if (inlineResult.trim()) {
          // 降级：无选区范围时使用 Drawer
          aiPanelAction.value = action === 'polish' ? t('thesisWriter.chapterEditor.inlinePolish') : action === 'expand' ? t('thesisWriter.chapterEditor.inlineExpand') : action === 'condense' ? t('thesisWriter.chapterEditor.inlineCondense') : action === 'academize' ? t('thesisWriter.chapterEditor.inlineAcademize') : action === 'cite' ? t('thesisWriter.chapterEditor.inlineCite') : t('thesisWriter.chapterEditor.inlineCustom')
          aiPanelContent.value = inlineResult
          aiPanelVisible.value = true
        }
      },
      onError(err) { message.error(t('thesisWriter.chapterEditor.operationFailed', { error: err })) },
    }
  )
}

// ==================== Keyboard shortcut: Ctrl+S ====================
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveContent()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (saveTimeout) clearTimeout(saveTimeout)
  stopStream()
})

// ==================== AI 辅助功能 ====================
async function polishContent() {
  if (isStreaming.value) return
  const text = tiptapRef.value?.getText() ?? ''
  if (!text.trim()) {
    message.warning(t('thesisWriter.chapterEditor.contentEmptyPolish'))
    return
  }
  aiPanelAction.value = t('thesisWriter.chapterEditor.panelTitlePolish')
  aiPanelContent.value = ''
  aiPanelVisible.value = true

  await streamWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'polish',
      prompt: t('thesisWriter.chapterEditor.promptPolish'),
    },
    {
      onContent(chunk) { aiPanelContent.value += chunk },
      onDone() { message.success(t('thesisWriter.chapterEditor.polishSuccess')) },
      onError(err) { message.error(t('thesisWriter.chapterEditor.polishFailed', { error: err })) },
    }
  )
}

async function checkFormat() {
  if (isStreaming.value) return
  const text = tiptapRef.value?.getText() ?? ''
  if (!text.trim()) {
    message.warning(t('thesisWriter.chapterEditor.contentEmptyFormat'))
    return
  }
  aiPanelAction.value = t('thesisWriter.chapterEditor.panelTitleFormat')
  aiPanelContent.value = ''
  aiPanelVisible.value = true

  await streamWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'format_check',
      prompt: t('thesisWriter.chapterEditor.promptFormatCheck'),
    },
    {
      onContent(chunk) { aiPanelContent.value += chunk },
      onDone() { message.success(t('thesisWriter.chapterEditor.formatCheckSuccess')) },
      onError(err) { message.error(t('thesisWriter.chapterEditor.formatCheckFailed', { error: err })) },
    }
  )
}

async function expandWithAI() {
  if (isStreaming.value) return
  const text = tiptapRef.value?.getText() ?? ''
  if (!text.trim()) {
    message.warning(t('thesisWriter.chapterEditor.contentEmptyExpand'))
    return
  }
  aiPanelAction.value = t('thesisWriter.chapterEditor.panelTitleExpand')
  aiPanelContent.value = ''
  aiPanelVisible.value = true

  await streamWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'expand_content',
      prompt: t('thesisWriter.chapterEditor.promptExpand'),
    },
    {
      onContent(chunk) { aiPanelContent.value += chunk },
      onDone() { message.success(t('thesisWriter.chapterEditor.expandSuccess')) },
      onError(err) { message.error(t('thesisWriter.chapterEditor.expandFailed', { error: err })) },
    }
  )
}

async function suggestCitation() {
  if (isStreaming.value) return
  aiPanelAction.value = t('thesisWriter.chapterEditor.panelTitleCite')
  aiPanelContent.value = ''
  aiPanelVisible.value = true

  await streamWrite(
    {
      projectId: props.projectId,
      nodeId: props.nodeId,
      action: 'cite_suggestion',
      prompt: t('thesisWriter.chapterEditor.promptCiteSuggestion'),
    },
    {
      onContent(chunk) { aiPanelContent.value += chunk },
      onDone() { message.success(t('thesisWriter.chapterEditor.citeSuggestionSuccess')) },
      onError(err) { message.error(t('thesisWriter.chapterEditor.citeSuggestionFailed', { error: err })) },
    }
  )
}

function applyAIContent() {
  if (aiPanelContent.value && tiptapRef.value) {
    tiptapRef.value.setContent(aiPanelContent.value)
    content.value = tiptapRef.value.getHTML()
    aiPanelVisible.value = false
    emit('contentChange', content.value)
    message.success(t('thesisWriter.chapterEditor.aiApplied'))
  }
}

// ==================== 暴露方法给父组件 ====================
function insertText(text: string) {
  if (!text) return
  // 如果当前在引导界面，先切换到编辑器
  if (showGuide.value) {
    showGuide.value = false
    nextTick(() => {
      if (tiptapRef.value) {
        tiptapRef.value.insertContent(text)
        content.value = tiptapRef.value.getHTML()
        emit('contentChange', content.value)
        handleContentUpdate(content.value)
      }
    })
    return
  }
  if (tiptapRef.value) {
    tiptapRef.value.insertContent(text)
    content.value = tiptapRef.value.getHTML()
    emit('contentChange', content.value)
    handleContentUpdate(content.value)
  }
}

defineExpose({ insertText, reloadContent: loadContent })

// ==================== 监听节点变化 ====================
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

watch(() => props.nodeId, (newId) => {
  if (newId) {
    currentNode.value = findNode(thesisStore.outline, newId) || null
  } else {
    currentNode.value = null
  }
  loadContent()
}, { immediate: false })

// ==================== 初始化 ====================
onMounted(() => {
  if (props.nodeId) {
    currentNode.value = findNode(thesisStore.outline, props.nodeId) || null
  }
  loadContent()
})
</script>

<style scoped>
textarea {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.8;
}

textarea::placeholder {
  line-height: 1.6;
}
</style>
