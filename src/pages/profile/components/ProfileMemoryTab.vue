<script setup lang="ts">
/**
 * ProfileMemoryTab - "个人记忆" 标签页
 *
 * 展示 MemoryX 系统中 AI 对用户的对话记忆
 * 按 tier 分类：CORE(核心身份) / SEMANTIC(学习事实) / EPISODIC(事件片段)
 * 自包含组件，独立加载数据
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { memoryPanelApi } from '@/api/memory'
import type { MemoryItem, MemoryStats } from '@/types/memory'
import { Brain, Trash2, Pin } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { message } from 'ant-design-vue'

const { t } = useI18n()

const memories = ref<MemoryItem[]>([])
const stats = ref<MemoryStats | null>(null)
const loading = ref(true)
const activeTier = ref<string | null>(null)
const deletingId = ref<string | null>(null)

onMounted(async () => {
  try {
    const [memoriesRes, statsRes] = await Promise.all([
      memoryPanelApi.list(),
      memoryPanelApi.stats()
    ])
    memories.value = memoriesRes
    stats.value = statsRes
  } catch {
    // show empty state
  } finally {
    loading.value = false
  }
})

const tierConfig = computed<Record<string, { label: string; dotClass: string }>>(() => ({
  CORE: { label: t('profile.memory.tierCore'), dotClass: 'bg-violet-500' },
  SEMANTIC: { label: t('profile.memory.tierSemantic'), dotClass: 'bg-teal-500' },
  EPISODIC: { label: t('profile.memory.tierEpisodic'), dotClass: 'bg-amber-500' }
}))

const tierFilters = computed(() => {
  return (['CORE', 'SEMANTIC', 'EPISODIC'] as const).map(tier => ({
    key: tier,
    ...tierConfig.value[tier],
    count: stats.value?.tiers.find(t => t.tier === tier)?.count ?? 0
  }))
})

const filteredMemories = computed(() => {
  if (activeTier.value) return memories.value.filter(m => m.tier === activeTier.value)
  return memories.value
})

function formatTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return t('profile.memory.justNow')
  if (hours < 24) return t('profile.memory.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days === 1) return t('profile.memory.yesterday')
  if (days < 7) return t('profile.memory.daysAgo', { n: days })
  if (days < 30) return t('profile.memory.weeksAgo', { n: Math.floor(days / 7) })
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

async function handleDelete(id: string) {
  if (deletingId.value) return
  const memory = memories.value.find(m => m.id === id)
  deletingId.value = id
  try {
    await memoryPanelApi.remove(id)
    memories.value = memories.value.filter(m => m.id !== id)
    if (stats.value && memory) {
      stats.value.total--
      const entry = stats.value.tiers.find(t => t.tier === memory.tier)
      if (entry) entry.count--
    }
    message.success(t('profile.memory.deleteSuccess'))
  } catch {
    message.error(t('profile.memory.deleteFailed'))
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div>
    <!-- 加载态 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>

    <!-- 空状态 -->
    <div v-else-if="memories.length === 0" class="flex flex-col items-center justify-center py-16">
      <div class="flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-muted text-muted-foreground mb-4">
        <Brain :size="28" />
      </div>
      <p class="text-sm font-medium text-foreground mb-1">{{ t('profile.memory.emptyTitle') }}</p>
      <p class="text-[0.8125rem] text-muted-foreground max-w-xs text-center">{{ t('profile.memory.emptyDesc') }}</p>
    </div>

    <!-- 有数据 -->
    <div v-else class="space-y-4">
      <!-- Tier 过滤器 -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          class="rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-[var(--ease-snap)]"
          :class="!activeTier
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-muted'"
          @click="activeTier = null"
        >
          {{ t('profile.memory.filterAll') }} {{ stats?.total ?? 0 }}
        </button>
        <button
          v-for="tier in tierFilters"
          :key="tier.key"
          class="flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-[var(--ease-snap)]"
          :class="activeTier === tier.key
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:bg-muted'"
          @click="activeTier = activeTier === tier.key ? null : tier.key"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="tier.dotClass" />
          {{ tier.label }} {{ tier.count }}
        </button>
      </div>

      <!-- 记忆列表 -->
      <div
        v-if="filteredMemories.length > 0"
        class="rounded-xl border border-border/40 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm divide-y divide-border/30"
      >
        <div
          v-for="memory in filteredMemories"
          :key="memory.id"
          class="group flex items-start gap-3 px-4 py-3 transition-colors duration-150 ease-[var(--ease-snap)] hover:bg-muted/50"
        >
          <!-- Tier 色点 -->
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="tierConfig[memory.tier]?.dotClass ?? 'bg-slate-300'" />

          <!-- 内容 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <Pin v-if="memory.isPinned" :size="12" class="shrink-0 text-amber-500" />
              <p class="text-base text-foreground leading-relaxed line-clamp-2">{{ memory.content }}</p>
            </div>
            <div class="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{{ tierConfig[memory.tier]?.label ?? memory.tier }}</span>
              <span class="h-0.5 w-0.5 rounded-full bg-current" />
              <span>{{ formatTime(memory.createdTime) }}</span>
              <template v-if="memory.accessCount">
                <span class="h-0.5 w-0.5 rounded-full bg-current" />
                <span>{{ t('profile.memory.accessCount', { count: memory.accessCount }) }}</span>
              </template>
            </div>
          </div>

          <!-- 删除 -->
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  :aria-label="t('profile.memory.deleteMemory')"
                  class="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground/50 opacity-0 transition-all duration-150 ease-[var(--ease-snap)] group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 active:scale-95"
                  :disabled="deletingId === memory.id"
                  @click="handleDelete(memory.id)"
                >
                  <Trash2 :size="14" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">{{ t('profile.memory.deleteMemory') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <!-- 过滤无结果 -->
      <div v-else class="flex flex-col items-center justify-center py-12 text-center">
        <Brain :size="28" class="mb-3 text-muted-foreground/30" />
        <p class="text-base text-muted-foreground">{{ t('profile.memory.noFilterResult') }}</p>
      </div>
    </div>
  </div>
</template>
