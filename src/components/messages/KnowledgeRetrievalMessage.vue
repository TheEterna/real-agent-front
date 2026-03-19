<script setup lang="ts">
import { computed } from 'vue'
import { UIMessage } from '@/types/events.js'
import { Database, FileText, ChevronRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ message: UIMessage }>()
const emit = defineEmits(['show-details'])

const chunks = computed(() => {
  const data = props.message.data
  if (!data) return []
  if (Array.isArray(data)) return data
  if ('chunks' in data && Array.isArray((data as any).chunks)) return (data as any).chunks
  return []
})

const chunksView = computed(() => {
  return chunks.value.map((chunk: any, idx: number) => {
    const docName = chunk?.documentName || chunk?.doc_name || chunk?.source || t('messages.knowledge.source', { index: idx + 1 })
    const similarity = chunk?.similarity ?? chunk?.score ?? null
    const content = chunk?.content || chunk?.text || ''
    const preview = typeof content === 'string'
      ? content.length > 200 ? content.slice(0, 200) + '...' : content
      : ''
    return { docName, similarity, content, preview, raw: chunk }
  })
})

const handleShowDetails = () => {
  let md = `# ${t('messages.knowledge.title')}\n\n`
  chunksView.value.forEach((c: any, idx: number) => {
    md += `## ${idx + 1}. ${c.docName}\n\n`
    if (c.similarity != null) {
      md += `**${t('messages.knowledge.similarity')}**: ${(c.similarity * 100).toFixed(1)}%\n\n`
    }
    md += `${c.content}\n\n---\n\n`
  })
  emit('show-details', {
    content: md,
    type: 'document',
    title: 'Knowledge Retrieval'
  })
}
</script>

<template>
  <div class="tool-message-container">
    <div class="kb-retrieval-container w-full mx-auto font-sans">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2 px-1 w-full">
        <div class="flex items-center gap-1.5">
          <div class="p-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Database :size="9" stroke-width="3" />
          </div>
          <span class="text-[10px] text-slate-800 dark:text-zinc-200 tracking-tight">Knowledge Sources</span>
          <span
            class="text-[8.5px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded-full border border-blue-100/30 dark:border-blue-800/30 leading-none"
          >{{ chunksView.length }}</span>
        </div>
        <button
          v-if="chunksView.length > 0"
          :aria-label="t('messages.knowledge.viewFullResults')"
          class="flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-[9px] uppercase tracking-wide"
          @click="handleShowDetails"
        >
          <FileText :size="9" aria-hidden="true" />
          <span>Full View</span>
        </button>
      </div>

      <!-- Chunks List -->
      <div v-if="chunksView.length" class="space-y-1.5 px-1">
        <div
          v-for="(chunk, idx) in chunksView"
          :key="idx"
          role="button"
          tabindex="0"
          :aria-label="t('messages.knowledge.viewSource', { name: chunk.docName })"
          class="kb-chunk-card flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md cursor-pointer"
          @click="handleShowDetails"
          @keydown.enter="handleShowDetails"
          @keydown.space.prevent="handleShowDetails"
        >
          <!-- Index Badge -->
          <div class="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">
            {{ idx + 1 }}
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[11px] font-medium text-slate-700 dark:text-zinc-200 truncate">{{ chunk.docName }}</span>
              <span
                v-if="chunk.similarity != null"
                class="text-[8px] bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 px-1 py-0.5 rounded leading-none shrink-0"
              >{{ (chunk.similarity * 100).toFixed(0) }}%</span>
            </div>
            <p class="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed line-clamp-2 m-0">{{ chunk.preview }}</p>
          </div>

          <ChevronRight :size="10" class="text-slate-300 dark:text-zinc-500 shrink-0 mt-1" aria-hidden="true" />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-3 text-center">
        <span class="text-[10px] text-slate-400 dark:text-zinc-500">{{ t('messages.knowledge.emptyState') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-message-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  width: 100%;
}

.kb-retrieval-container {
  animation: kbAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes kbAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kb-retrieval-container {
    animation: none;
  }
}

.kb-chunk-card {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
