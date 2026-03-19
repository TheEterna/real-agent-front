<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Database, Search } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from 'vue-i18n'

import { listKnowledgeBases, type KnowledgeBase } from '@/api/knowledgeBaseAPI'
import { retrieve, type RetrievalChunk } from '@/api/knowledge'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const knowledgeBases = ref<KnowledgeBase[]>([])
const activeKbId = ref<string | null>(null)

const retrievalQuery = ref('')
const retrievalResults = ref<RetrievalChunk[]>([])
const isRetrieving = ref(false)

const activeKnowledgeBase = computed(() => knowledgeBases.value.find(kb => kb.id === activeKbId.value) || null)
const activeDatasetId = computed(() => activeKnowledgeBase.value?.ragflowDatasetId || null)

const goBack = () => {
  router.push({
    path: '/knowledge',
    query: activeKbId.value ? { kbId: activeKbId.value } : {}
  })
}

const refreshKnowledgeBases = async () => {
  const resp = await listKnowledgeBases()
  if (resp.code !== 200) return
  knowledgeBases.value = resp.data || []
}

const loadFromRoute = () => {
  const kbId = (route.query.kbId as string | undefined) || null
  activeKbId.value = kbId

  const q = (route.query.q as string | undefined) || ''
  retrievalQuery.value = q
}

const runRetrieval = async () => {
  const q = retrievalQuery.value.trim()
  if (!q) return
  if (!activeDatasetId.value) {
    message.warning(t('knowledge.common.selectKb'))
    return
  }

  if (isRetrieving.value) return
  isRetrieving.value = true
  try {
    const resp = await retrieve({ question: q, datasetIds: [activeDatasetId.value], topK: 5, highlight: true })
    if (resp.code === 200) {
      retrievalResults.value = resp.data || []
    } else {
      message.error(resp.message || t('knowledge.retrieve.retrievalFailed'))
    }
  } finally {
    isRetrieving.value = false
  }
}

onMounted(async () => {
  await refreshKnowledgeBases()
  loadFromRoute()

  if (!activeKbId.value && knowledgeBases.value.length > 0) {
    activeKbId.value = knowledgeBases.value[0].id
  }
})

watch(
  () => route.query,
  () => {
    loadFromRoute()
  }
)
</script>

<template>
  <div class="h-full w-full flex bg-slate-50/50 dark:bg-[#0a0a0a] relative overflow-hidden font-sans">
    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header with title and search -->
      <div class="px-10 pt-8 pb-0 shrink-0 space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-[#fafafa]">{{ t('knowledge.retrieve.title') }}</h1>
          <p class="text-base text-slate-500 dark:text-[#a3a3a3] mt-1">{{ t('knowledge.retrieve.subtitle') }}</p>
        </div>

        <!-- KB Selector + Search Box -->
        <div class="flex items-center gap-3">
          <Select v-model="activeKbId" :aria-label="t('knowledge.common.selectKbLabel')">
            <SelectTrigger class="w-[180px] shrink-0 rounded-xl text-xs font-bold bg-white/80 dark:bg-zinc-800/80 border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
              <Database class="mr-2 text-slate-400 dark:text-zinc-500" :size="16" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">{{ kb.name }}</SelectItem>
            </SelectContent>
          </Select>
          <div class="flex-1 flex items-center gap-3 h-12 px-4 rounded-lg bg-white dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-white/10 focus-within:border-slate-400 dark:focus-within:border-white/25 transition-colors">
            <Search :size="20" class="text-slate-400 dark:text-[#a3a3a3] shrink-0" />
            <input
              v-model="retrievalQuery"
              type="text"
              :aria-label="t('knowledge.retrieve.queryLabel')"
              :placeholder="t('knowledge.retrieve.queryPlaceholder')"
              class="flex-1 bg-transparent text-base outline-none text-slate-800 dark:text-[#fafafa] placeholder:text-slate-400 dark:placeholder:text-[#a3a3a3]"
              @keydown.enter.prevent="runRetrieval"
            />
            <button
              :disabled="isRetrieving"
              :aria-label="t('knowledge.retrieve.executeRetrieval')"
              class="min-h-[36px] px-4 py-1.5 bg-slate-900 dark:bg-[#fafafa] hover:bg-slate-800 dark:hover:bg-[#e5e5e5] text-white! dark:text-[#0a0a0a]! rounded-md text-[0.8125rem] font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="runRetrieval"
            >
              {{ isRetrieving ? t('knowledge.retrieve.retrieving') : t('knowledge.retrieve.retrieve') }}
            </button>
          </div>
        </div>

        <!-- Results header -->
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold text-slate-800 dark:text-[#fafafa]">{{ t('knowledge.retrieve.resultsTitle') }}</span>
          <span class="text-[0.8125rem] text-slate-400 dark:text-[#a3a3a3]">{{ t('knowledge.retrieve.resultCount', { count: retrievalResults.length }) }}</span>
        </div>
      </div>

      <!-- Results -->
      <div class="flex-1 overflow-y-auto custom-scrollbar px-10 pt-4 pb-8">
        <div v-if="retrievalResults.length === 0" class="h-[200px] flex flex-col items-center justify-center text-center">
          <Search :size="32" class="text-slate-300 dark:text-zinc-700 mb-3" />
          <p class="text-base text-muted-foreground">{{ t('knowledge.retrieve.noResults') }}</p>
        </div>

        <div v-else class="space-y-3" role="list" :aria-label="t('knowledge.retrieve.resultList')">
          <div
            v-for="r in retrievalResults"
            :key="r.id"
            role="listitem"
            class="p-4 rounded-lg bg-white dark:bg-[#171717] border border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
          >
            <!-- Card header: title + relevance badge -->
            <div class="flex items-center justify-between gap-3 mb-2.5">
              <span class="text-base font-semibold text-slate-800 dark:text-[#fafafa] truncate">
                {{ r.documentName || r.documentId || r.id }}
              </span>
              <span
                v-if="r.similarity != null"
                class="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                {{ Math.round(r.similarity * 100) }}%
              </span>
            </div>

            <!-- Content snippet -->
            <div class="text-[0.8125rem] text-slate-600 dark:text-[#a3a3a3] leading-relaxed retrieve-snippet-content whitespace-pre-wrap" v-html="r.highlightContent || r.content"></div>

            <!-- Source info -->
            <div class="flex items-center gap-2 mt-3 text-xs text-slate-400 dark:text-[#737373]">
              <Search :size="12" />
              <span class="truncate">{{ r.documentId || r.id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Filter Panel -->
    <aside class="w-60 shrink-0 border-l border-slate-200/60 dark:border-white/10 bg-white dark:bg-[#171717] overflow-y-auto custom-scrollbar">
      <div class="p-5 space-y-5">
        <h3 class="text-base font-semibold text-slate-800 dark:text-[#fafafa]">{{ t('knowledge.retrieve.filterTitle', '筛选条件') }}</h3>

        <!-- Knowledge base selector -->
        <div class="space-y-2.5">
          <label class="text-[0.8125rem] font-medium text-slate-700 dark:text-[#fafafa]">{{ t('knowledge.common.selectKbLabel') }}</label>
          <select
            v-model="activeKbId"
            :aria-label="t('knowledge.common.selectKbLabel')"
            class="w-full px-3 py-2 bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-white/10 rounded-md text-[0.8125rem] appearance-none outline-none hover:border-slate-300 dark:hover:border-white/20 focus:border-slate-400 dark:focus:border-white/30 transition-colors cursor-pointer text-slate-700 dark:text-[#fafafa]"
          >
            <option v-for="kb in knowledgeBases" :key="kb.id" :value="kb.id">{{ kb.name }}</option>
          </select>
        </div>

        <div class="h-px bg-slate-100 dark:bg-white/10"></div>

        <!-- Current KB info -->
        <div class="space-y-2">
          <span class="text-[0.8125rem] font-medium text-slate-700 dark:text-[#fafafa]">{{ t('knowledge.common.currentKb') }}</span>
          <div class="px-3 py-2 rounded-md bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200/60 dark:border-white/10 text-[0.8125rem] text-slate-600 dark:text-[#a3a3a3] truncate">
            {{ activeKnowledgeBase?.name || '—' }}
          </div>
        </div>

        <div class="h-px bg-slate-100 dark:bg-white/10"></div>

        <!-- Back button -->
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-slate-100 dark:bg-[#262626] hover:bg-slate-200 dark:hover:bg-[#333] text-slate-600 dark:text-[#a3a3a3] text-[0.8125rem] font-medium transition-all active:scale-95"
                :aria-label="t('knowledge.common.back')"
                @click="goBack"
              >
                <ArrowLeft :size="16" />
                {{ t('knowledge.common.back') }}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" :side-offset="6">{{ t('knowledge.common.back') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
</style>

<!-- Dark mode overrides + highlight styling -->
<style lang="scss">
.dark {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

/* Retrieval highlight styling for server-returned HTML */
.retrieve-snippet-content {
  em, mark, b {
    background: rgba(254, 243, 199, 0.9);
    color: #92400e;
    font-style: normal;
    font-weight: 500;
    padding: 1px 3px;
    border-radius: 2px;
  }
}

.dark .retrieve-snippet-content {
  em, mark, b {
    background: rgba(254, 243, 199, 0.15);
    color: #fbbf24;
  }
}
</style>
