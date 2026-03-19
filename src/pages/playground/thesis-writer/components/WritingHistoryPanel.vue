<template>
  <ADrawer
    :open="visible"
    :title="t('thesisWriter.writingHistory.title')"
    placement="right"
    :width="drawerWidth"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 4" :key="i" class="animate-pulse">
          <div class="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="history.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <History :size="32" class="mb-3 text-muted-foreground/50" />
        <p class="text-base text-muted-foreground">{{ t('thesisWriter.writingHistory.empty') }}</p>
      </div>

      <div
        v-for="item in history"
        :key="item.id"
        class="p-3 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 transition-all bg-white dark:bg-zinc-900"
      >
        <div class="flex items-center justify-between mb-2">
          <span
class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="actionClass(item.action)">
            {{ actionLabel(item.action) }}
          </span>
          <span class="text-xs text-slate-400 dark:text-zinc-500">{{ formatTime(item.createdTime) }}</span>
        </div>
        <p v-if="item.prompt" class="text-base text-slate-600 dark:text-zinc-300 line-clamp-2 mb-2">{{ item.prompt }}</p>
        <Collapse :bordered="false" class="bg-transparent">
          <CollapsePanel :header="t('thesisWriter.writingHistory.viewResponse')" class="text-xs">
            <p class="text-base text-slate-700 dark:text-zinc-200 whitespace-pre-wrap max-h-40 overflow-y-auto">{{ item.response }}</p>
          </CollapsePanel>
        </Collapse>
      </div>
    </div>
  </ADrawer>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Drawer as ADrawer, Collapse, CollapsePanel } from 'ant-design-vue'
import { History } from 'lucide-vue-next'
import { getWritingHistory } from '@/api/thesis-writer'
import type { WritingHistory } from '@/types/thesis-writer'

const props = defineProps<{
  visible: boolean
  projectId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

// 响应式 Drawer 宽度：小屏自适应，大屏最大 480px
const drawerWidth = computed(() => {
  if (typeof window === 'undefined') return 480
  return Math.min(480, window.innerWidth * 0.92)
})

const history = ref<WritingHistory[]>([])
const loading = ref(false)

async function loadHistory() {
  if (!props.projectId) return
  loading.value = true
  try {
    const res = await getWritingHistory(props.projectId)
    if (res.code === 200) {
      history.value = res.data || []
    }
  } catch (e) {
    console.error('Failed to load writing history:', e)
  } finally {
    loading.value = false
  }
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    generate_outline: t('thesisWriter.writingHistory.actionGenerateOutline'),
    write_chapter: t('thesisWriter.writingHistory.actionWriteChapter'),
    expand_content: t('thesisWriter.writingHistory.actionExpandContent'),
    polish: t('thesisWriter.writingHistory.actionPolish'),
    format_check: t('thesisWriter.writingHistory.actionFormatCheck'),
    cite_suggestion: t('thesisWriter.writingHistory.actionCiteSuggestion'),
    inline_polish: t('thesisWriter.writingHistory.actionInlinePolish'),
    inline_expand: t('thesisWriter.writingHistory.actionInlineExpand'),
    inline_condense: t('thesisWriter.writingHistory.actionInlineCondense'),
    inline_academize: t('thesisWriter.writingHistory.actionInlineAcademize'),
    inline_cite: t('thesisWriter.writingHistory.actionInlineCite'),
    inline_custom: t('thesisWriter.writingHistory.actionInlineCustom'),
  }
  return map[action] || action
}

function actionClass(action: string): string {
  if (action.startsWith('inline_')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
  const map: Record<string, string> = {
    generate_outline: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    write_chapter: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
    polish: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    expand_content: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    cite_suggestion: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    format_check: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  }
  return map[action] || 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
}

function formatTime(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return t('thesisWriter.writingHistory.justNow')
  if (diff < 3600000) return t('thesisWriter.writingHistory.minutesAgo', { count: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('thesisWriter.writingHistory.hoursAgo', { count: Math.floor(diff / 3600000) })
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

watch(() => props.visible, (visible) => {
  if (visible) loadHistory()
})
</script>
