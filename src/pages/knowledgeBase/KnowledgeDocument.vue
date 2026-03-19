<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Database, RefreshCw, Search, FileText, ChevronRight } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from 'vue-i18n'

import { listKnowledgeBases, type KnowledgeBase } from '@/api/knowledgeBaseAPI'
import { listChunks, type ChunkVO } from '@/api/knowledge'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const knowledgeBases = ref<KnowledgeBase[]>([])
const activeKbId = ref<string | null>(null)

const docId = computed(() => (route.query.docId as string | undefined) || '')
const docName = computed(() => (route.query.name as string | undefined) || '')

const chunks = ref<ChunkVO[]>([])
const isLoadingChunks = ref(false)
const chunksSkeletonRows = computed(() => Array.from({ length: 7 }, (_, i) => i))

const activeKnowledgeBase = computed(() => knowledgeBases.value.find(kb => kb.id === activeKbId.value) || null)
const activeDatasetId = computed(() => activeKnowledgeBase.value?.ragflowDatasetId || null)

const goBack = () => {
  router.push({ path: '/knowledge', query: activeKbId.value ? { kbId: activeKbId.value } : {} })
}

const refreshKnowledgeBases = async () => {
  const resp = await listKnowledgeBases()
  if (resp.code !== 200) return
  knowledgeBases.value = resp.data || []
}

const loadFromRoute = () => {
  const kbId = (route.query.kbId as string | undefined) || null
  activeKbId.value = kbId
}

const syncKbIdToRoute = async () => {
  const current = (route.query.kbId as string | undefined) || undefined
  const next = activeKbId.value || undefined
  if (current === next) return
  await router.replace({ query: { ...route.query, kbId: next } })
}

const refreshChunks = async () => {
  if (!docId.value) {
    chunks.value = []
    return
  }
  if (!activeDatasetId.value) {
    chunks.value = []
    message.warning(t('knowledge.common.selectKb'))
    return
  }

  if (isLoadingChunks.value) return
  isLoadingChunks.value = true
  try {
    const resp = await listChunks(activeDatasetId.value, docId.value, { page: 1, pageSize: 200 })
    if (resp.code === 200) {
      chunks.value = resp.data || []
    } else {
      message.error(resp.message || t('knowledge.document.loadChunksFailed'))
    }
  } finally {
    isLoadingChunks.value = false
  }
}

onMounted(async () => {
  await refreshKnowledgeBases()
  loadFromRoute()

  if (!activeKbId.value && knowledgeBases.value.length > 0) {
    activeKbId.value = knowledgeBases.value[0].id
  }

  await syncKbIdToRoute()
  await refreshChunks()
})

watch(
  () => route.query,
  async () => {
    loadFromRoute()
    await refreshChunks()
  }
)

watch(activeKbId, async () => {
  await syncKbIdToRoute()
  await refreshChunks()
})
</script>

<template>
  <div class="h-full w-full flex bg-slate-50/50 dark:bg-[#0a0a0a] relative overflow-hidden font-sans">
    <!-- Document Content Area (main) -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Breadcrumb -->
      <div class="px-12 pt-8 pb-0 shrink-0">
        <div class="flex items-center gap-1.5 text-[0.8125rem]">
          <button class="text-slate-400 dark:text-[#a3a3a3] hover:text-slate-600 dark:hover:text-[#fafafa] transition-colors" @click="goBack">
            {{ t('knowledge.common.knowledgeBase', '知识库') }}
          </button>
          <ChevronRight :size="14" class="text-slate-300 dark:text-[#a3a3a3]" />
          <button class="text-slate-400 dark:text-[#a3a3a3] hover:text-slate-600 dark:hover:text-[#fafafa] transition-colors" @click="goBack">
            {{ t('knowledge.document.subtitle') }}
          </button>
          <ChevronRight :size="14" class="text-slate-300 dark:text-[#a3a3a3]" />
          <span class="text-slate-800 dark:text-[#fafafa] font-medium truncate max-w-md">{{ docName || t('knowledge.document.title') }}</span>
        </div>
      </div>

      <!-- Document body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar px-12 pt-6 pb-10">
        <!-- Title block -->
        <div class="mb-6">
          <h1 class="text-xl font-semibold text-slate-900 dark:text-[#fafafa] leading-tight">{{ docName || t('knowledge.document.title') }}</h1>
          <div class="flex items-center gap-4 mt-3 text-[0.8125rem] text-slate-400 dark:text-[#a3a3a3]">
            <span>{{ t('knowledge.common.currentKb') }} {{ activeKnowledgeBase?.name || '—' }}</span>
          </div>
        </div>

        <div class="h-px bg-slate-200/60 dark:bg-white/10 mb-6"></div>

        <!-- Chunks as document content -->
        <div v-if="!docId" class="h-[200px] flex items-center justify-center text-base text-slate-400 dark:text-[#737373]">
          {{ t('knowledge.document.missingDocId') }}
        </div>

        <div v-else-if="isLoadingChunks" class="space-y-5">
          <div
            v-for="i in chunksSkeletonRows"
            :key="`sk-${i}`"
            class="space-y-2 overflow-hidden relative"
          >
            <div class="h-4 w-full rounded bg-slate-100/80 dark:bg-zinc-800/80"></div>
            <div class="h-4 w-[92%] rounded bg-slate-100/80 dark:bg-zinc-800/80"></div>
            <div class="h-4 w-[80%] rounded bg-slate-100/80 dark:bg-zinc-800/80"></div>
            <div class="absolute inset-0 bg-linear-to-r from-transparent via-white/60 dark:via-zinc-700/60 to-transparent animate-pulse"></div>
          </div>
        </div>

        <div v-else-if="chunks.length === 0" class="h-[200px] flex flex-col items-center justify-center text-center">
          <FileText :size="32" class="text-slate-300 dark:text-zinc-700 mb-3" />
          <p class="text-base text-muted-foreground">{{ t('knowledge.document.noChunks') }}</p>
        </div>

        <div v-else class="space-y-6" role="list" :aria-label="t('knowledge.document.chunkList')">
          <article
            v-for="c in chunks"
            :key="c.id"
            role="listitem"
            class="doc-chunk-article"
          >
            <div class="text-base text-slate-700 dark:text-[#a3a3a3] leading-[1.7] whitespace-pre-wrap">{{ c.content }}</div>
          </article>
        </div>
      </div>
    </div>

    <!-- Right Metadata Panel -->
    <aside class="w-[300px] shrink-0 border-l border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#171717] overflow-y-auto custom-scrollbar flex flex-col">
      <!-- File info -->
      <div class="p-5 space-y-4">
        <h3 class="text-base font-semibold text-slate-800 dark:text-[#fafafa]">{{ t('knowledge.document.fileInfo', '文件信息') }}</h3>
        <div class="space-y-3 text-[0.8125rem]">
          <div class="flex justify-between">
            <span class="text-slate-400 dark:text-[#737373]">{{ t('knowledge.common.selectKbLabel') }}</span>
            <span class="text-slate-700 dark:text-[#a3a3a3] truncate max-w-[140px]">{{ activeKnowledgeBase?.name || '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400 dark:text-[#737373]">{{ t('knowledge.document.docIdLabel', 'ID') }}</span>
            <span class="text-slate-700 dark:text-[#a3a3a3] font-mono text-xs truncate max-w-[140px]">{{ docId || '—' }}</span>
          </div>
        </div>
      </div>

      <div class="h-px bg-slate-100 dark:bg-white/10"></div>

      <!-- Chunks section -->
      <div class="p-5 flex-1 overflow-hidden flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold text-slate-800 dark:text-[#fafafa]">{{ t('knowledge.document.chunks') }}</h3>
          <span class="text-xs text-slate-400 dark:text-[#737373] font-mono">{{ chunks.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          <div
            v-for="(c, idx) in chunks"
            :key="c.id"
            class="px-3 py-2 rounded-md bg-slate-50 dark:bg-[#0a0a0a] border border-slate-100 dark:border-white/10 text-xs text-slate-600 dark:text-[#a3a3a3] truncate cursor-default hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors"
          >
            Chunk {{ idx + 1 }}
          </div>
        </div>
      </div>

      <div class="h-px bg-slate-100 dark:bg-white/10"></div>

      <!-- Actions -->
      <div class="p-5 space-y-3">
        <!-- KB selector -->
        <div class="space-y-2">
          <label class="text-[0.8125rem] font-medium text-slate-700 dark:text-[#fafafa]">{{ t('knowledge.common.selectKbLabel') }}</label>
          <Select v-model="activeKbId" :aria-label="t('knowledge.common.selectKbLabel')">
            <SelectTrigger class="w-full rounded-lg text-[0.8125rem] bg-slate-50 dark:bg-[#0a0a0a] border-slate-200/60 dark:border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">{{ kb.name }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Refresh button -->
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                :disabled="isLoadingChunks"
                :aria-label="t('knowledge.document.refreshChunks')"
                class="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-600 dark:text-[#a3a3a3] text-[0.8125rem] font-medium transition-all active:scale-95 disabled:opacity-50"
                @click="refreshChunks"
              >
                <RefreshCw :size="14" :class="{ 'animate-pulse': isLoadingChunks }" />
                {{ t('knowledge.common.refresh') }}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" :side-offset="6">{{ t('knowledge.document.refreshChunks') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <!-- Back button -->
        <button
          class="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-slate-900 dark:bg-[#fafafa] hover:bg-slate-800 dark:hover:bg-[#e5e5e5] text-white! dark:text-[#0a0a0a]! text-[0.8125rem] font-medium transition-all active:scale-95"
          :aria-label="t('knowledge.common.back')"
          @click="goBack"
        >
          <ArrowLeft :size="16" />
          {{ t('knowledge.common.back') }}
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.doc-chunk-article {
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  background: white;
  transition: border-color 200ms;
}
.doc-chunk-article:hover {
  border-color: rgba(148, 163, 184, 0.5);
}
</style>

<!-- Dark mode overrides -->
<style lang="scss">
.dark {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .doc-chunk-article {
    background: #171717;
    border-color: rgba(255, 255, 255, 0.1);
  }
  .doc-chunk-article:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }
}
</style>
