<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Header bar -->
    <div class="shrink-0 px-6 py-2.5 border-b border-slate-100/50 dark:border-zinc-700/50 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
        <FileText :size="15" class="text-slate-400 dark:text-zinc-600" />
        <span class="font-medium text-slate-700 dark:text-zinc-200 truncate max-w-[240px]">{{ projectTitle }}</span>
        <span class="text-slate-400 dark:text-zinc-500">.</span>
        <span class="text-xs">{{ t('thesisWriter.fullDocument.chapterCount', { count: chapterCount }) }}</span>
      </div>
      <div class="flex items-center gap-3 text-xs text-slate-400 dark:text-zinc-500">
        <span v-if="totalWords > 0" class="tabular-nums">{{ t('thesisWriter.chapterEditor.wordCount', { count: totalWords.toLocaleString() }) }}</span>
        <template v-if="isSaving">
          <span class="flex items-center gap-1 text-amber-500">
            <Loader2 :size="12" class="animate-spin" />
            {{ t('thesisWriter.fullDocument.saving') }}
          </span>
        </template>
        <template v-else-if="lastSaved">
          <span class="flex items-center gap-1 text-emerald-500">
            <Check :size="12" />
            {{ t('thesisWriter.fullDocument.saved') }}
          </span>
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <Loader2 :size="24" class="mx-auto mb-3 animate-spin text-slate-400 dark:text-zinc-500" />
        <p class="text-base text-slate-500 dark:text-zinc-400">{{ t('thesisWriter.fullDocument.loading') }}</p>
        <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1.5 tabular-nums">
          {{ t('thesisWriter.fullDocument.progress', { done: loadedCount, total: totalCount }) }}
        </p>
      </div>
    </div>

    <!-- Editor -->
    <div v-else class="flex-1 overflow-hidden">
      <TipTapEditor
        ref="tiptapRef"
        v-model="fullContent"
        class="h-full"
        :placeholder="t('thesisWriter.fullDocument.placeholder')"
        @update:model-value="handleContentUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileText, Loader2, Check } from 'lucide-vue-next'
import type { OutlineNode } from '@/types/thesis-writer'
import { useFullDocument } from '../composables/useFullDocument'
import TipTapEditor from './TipTapEditor.vue'

const props = defineProps<{
  projectId: string
  projectTitle: string
  outline: OutlineNode[]
}>()

const emit = defineEmits<{
  contentSaved: []
}>()

const { t } = useI18n()

// ==================== Composable ====================
const {
  isLoading,
  isSaving,
  lastSaved,
  loadedCount,
  totalCount,
  loadFullDocument,
  saveChangedChapters,
  scrollToChapter,
  flattenNodes,
} = useFullDocument()

// ==================== State ====================
const tiptapRef = ref<InstanceType<typeof TipTapEditor> | null>(null)
const fullContent = ref('')

const chapterCount = computed(() => flattenNodes(props.outline).length)

const totalWords = computed(() => {
  // 从编辑器纯文本计算字数
  if (tiptapRef.value) {
    const text = tiptapRef.value.getText()
    return text.replace(/\s/g, '').length
  }
  return 0
})

// ==================== Load ====================
async function load() {
  if (!props.projectId || props.outline.length === 0) return
  const html = await loadFullDocument(props.outline)
  fullContent.value = html
}

// 当 projectId 或 outline 变化时重新加载
watch(
  () => [props.projectId, props.outline] as const,
  () => { load() },
  { immediate: true },
)

// ==================== Auto-save ====================
let saveTimer: ReturnType<typeof setTimeout> | null = null

function handleContentUpdate(_newContent: string) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    if (!tiptapRef.value) return
    const html = tiptapRef.value.getHTML()
    const { saved } = await saveChangedChapters(html)
    if (saved > 0) {
      emit('contentSaved')
    }
  }, 3000)
}

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
})

// ==================== Expose ====================

/** 滚动到指定章节 */
function scrollTo(nodeId: string) {
  const editor = tiptapRef.value?.editor
  if (!editor) return
  scrollToChapter(editor.view.dom, nodeId)
}

/** 强制重新加载全文 */
function reload() {
  load()
}

defineExpose({ scrollTo, reload })
</script>
