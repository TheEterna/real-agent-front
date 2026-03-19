<script setup lang="ts">
/**
 * MemoryBoard — V3 记忆面板 Overlay
 * 全屏浮层：记忆统计 + 卡片网格
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Lock, Coffee, Briefcase, Clock, Star, Heart, Search, Pencil, Trash2, Check, RotateCcw } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMemory } from '../composables/useMemory'
import { useSoul } from '../composables/useSoul'
import type { MemoryCategory } from '../types'

const { t } = useI18n()

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { memories, stats, isLoading, loadMemories, loadStats, searchMemories, updateMemory, deleteMemory } = useMemory()
const { daysSinceFirst } = useSoul()
const query = ref('')
const editingId = ref<string | null>(null)
const draftContent = ref('')
const isSavingEdit = ref(false)
const deletingMemoryId = ref<string | null>(null)
const isSearching = ref(false)

onMounted(() => {
  loadMemories()
  loadStats()
})

async function handleSearch() {
  if (isSearching.value) return
  isSearching.value = true
  try {
    await searchMemories(query.value)
  } finally {
    isSearching.value = false
  }
}

function startEdit(memoryId: string, content: string) {
  editingId.value = memoryId
  draftContent.value = content
}

function cancelEdit() {
  editingId.value = null
  draftContent.value = ''
}

async function saveEdit(memoryId: string) {
  const nextContent = draftContent.value.trim()
  if (!nextContent || isSavingEdit.value) return
  isSavingEdit.value = true
  try {
    await updateMemory(memoryId, nextContent, nextContent)
    cancelEdit()
  } finally {
    isSavingEdit.value = false
  }
}

async function removeMemory(memoryId: string) {
  if (deletingMemoryId.value === memoryId) return
  deletingMemoryId.value = memoryId
  try {
    await deleteMemory(memoryId)
  } finally {
    deletingMemoryId.value = null
  }
}

async function resetSearch() {
  if (isSearching.value) return
  isSearching.value = true
  query.value = ''
  try {
    await loadMemories()
  } finally {
    isSearching.value = false
  }
}

/** 分类图标映射 — key 与 inferCategory 返回的翻译值对应 */
const categoryIcons = computed<Record<string, typeof Coffee>>(() => ({
  [t('playgroundChat.api.categories.preference')]: Coffee,
  [t('playgroundChat.api.categories.work')]: Briefcase,
  [t('playgroundChat.api.categories.habit')]: Clock,
  [t('playgroundChat.api.categories.interest')]: Star,
  [t('playgroundChat.api.categories.tech')]: Briefcase,
  [t('playgroundChat.api.categories.emotion')]: Heart,
}))
</script>

<template>
  <Teleport to="body">
    <div class="overlay-panel" :class="{ open: visible }">
      <div class="overlay-header">
        <h2><Lock :size="18" :stroke-width="1.5" /> {{ t('playgroundChat.memoryBoard.title') }}</h2>
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="overlay-close" :aria-label="t('common.button.close')" @click="emit('close')">
                <X :size="18" :stroke-width="1.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('common.button.close') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div class="overlay-body">
        <!-- 统计 -->
        <div class="memory-stats">
          <div class="memory-stat">
            <span class="ms-num">{{ stats.total }}</span>
            <span class="ms-label">{{ t('playgroundChat.memoryBoard.memoryCount') }}</span>
          </div>
          <div class="memory-stat">
            <span class="ms-num">{{ daysSinceFirst || '—' }}</span>
            <span class="ms-label">{{ t('playgroundChat.memoryBoard.daysKnown') }}</span>
          </div>
          <div class="memory-stat">
            <span class="ms-num">{{ stats.categoryCount ?? '—' }}</span>
            <span class="ms-label">{{ t('playgroundChat.memoryBoard.categoriesCount') }}</span>
          </div>
        </div>

        <div class="memory-toolbar">
          <div class="search-box">
            <Search :size="14" :stroke-width="1.8" />
            <input
              v-model="query"
              type="text"
              :placeholder="t('playgroundChat.memoryBoard.searchPlaceholder')"
              @input="handleSearch"
            >
          </div>
          <button class="toolbar-btn" @click="resetSearch">
            <RotateCcw :size="14" :stroke-width="1.8" />
            {{ t('playgroundChat.memoryBoard.all') }}
          </button>
        </div>

        <!-- 加载态 -->
        <div v-if="isLoading" class="memory-loading">{{ t('playgroundChat.memoryBoard.loading') }}</div>

        <!-- 卡片网格 -->
        <div v-else class="memory-grid">
          <div
            v-for="mem in memories"
            :key="mem.id"
            class="memory-card"
          >
            <div class="mc-category">
              <component
                :is="categoryIcons[mem.category as string] || Star"
                :size="12"
                :stroke-width="2"
              />
              {{ mem.category }}
            </div>
            <textarea
              v-if="editingId === mem.id"
              v-model="draftContent"
              class="mc-editor"
              rows="4"
            />
            <div v-else class="mc-text">{{ mem.summary || mem.content }}</div>
            <div class="mc-when">{{ mem.when || mem.createdTime }}</div>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <div class="mc-actions">
                <template v-if="editingId === mem.id">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button class="icon-btn save" :aria-label="t('playgroundChat.memoryBoard.saveMemory')" @click="saveEdit(mem.id)">
                        <Check :size="14" :stroke-width="2" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" :side-offset="6">{{ t('playgroundChat.memoryBoard.save') }}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button class="icon-btn" :aria-label="t('playgroundChat.memoryBoard.cancelEdit')" @click="cancelEdit">
                        <X :size="14" :stroke-width="2" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" :side-offset="6">{{ t('playgroundChat.memoryBoard.cancel') }}</TooltipContent>
                  </Tooltip>
                </template>
                <template v-else>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button class="icon-btn" :aria-label="t('playgroundChat.memoryBoard.editMemory')" @click="startEdit(mem.id, mem.summary || mem.content)">
                        <Pencil :size="14" :stroke-width="1.8" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" :side-offset="6">{{ t('playgroundChat.memoryBoard.edit') }}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button class="icon-btn danger" :aria-label="t('playgroundChat.memoryBoard.deleteMemory')" @click="removeMemory(mem.id)">
                        <Trash2 :size="14" :stroke-width="1.8" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" :side-offset="6">{{ t('playgroundChat.memoryBoard.delete') }}</TooltipContent>
                  </Tooltip>
                </template>
              </div>
            </TooltipProvider>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!isLoading && memories.length === 0" class="memory-empty">
          {{ t('playgroundChat.memoryBoard.empty') }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay-panel {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(250, 250, 247, 0.88);
  backdrop-filter: blur(var(--blur-md, 20px));
  opacity: 0; pointer-events: none;
  transition: opacity 0.35s var(--ease-fluid);
  overflow-y: auto;
  display: flex; flex-direction: column;
}
.overlay-panel.open { opacity: 1; pointer-events: auto; }

.overlay-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 40px; flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}
.overlay-header h2 {
  font-size: 1.5rem; font-weight: 600; color: var(--foreground);
  display: flex; align-items: center; gap: 10px;
}

.overlay-close {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); border: none; background: none;
  color: var(--muted-foreground); cursor: pointer;
  transition: all var(--duration-fast);
}
.overlay-close:hover { color: var(--foreground); background: var(--muted); }
.overlay-close:active { transform: scale(0.95); }

.overlay-body {
  flex: 1; padding: 40px;
  max-width: 720px; width: 100%; margin: 0 auto;
}

.memory-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--muted-foreground);
  transition: border-color var(--duration-fast);
}
.search-box:focus-within {
  border-color: var(--color-primary-500);
  box-shadow: var(--glow-focus);
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--foreground);
  font-size: 1rem;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  cursor: pointer;
  transition: all var(--duration-fast);
}
.toolbar-btn:hover { background: var(--muted); }
.toolbar-btn:active { transform: scale(0.97); }

/* 统计 */
.memory-stats {
  display: flex; gap: 24px; margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.memory-stat {
  display: flex; flex-direction: column; gap: 2px;
}
.ms-num {
  font-size: 1.5rem; font-weight: 700;
  color: var(--color-primary-700);
}
.ms-label {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

/* 卡片网格 */
.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.memory-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: default;
  transition: all var(--duration-normal) var(--ease-fluid);
}
.memory-card:hover {
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.mc-category {
  font-size: 0.75rem; font-weight: 600;
  color: var(--color-primary-700);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: flex; align-items: center; gap: 4px;
}
.mc-category :deep(svg) { opacity: 0.5; }

.mc-text {
  font-size: 0.8125rem;
  color: var(--foreground);
  line-height: 1.5;
  margin-bottom: 8px;
}
.mc-when {
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.mc-editor {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--foreground);
  padding: 10px 12px;
  resize: vertical;
  min-height: 88px;
  font-size: 0.8125rem;
  line-height: 1.5;
  margin-bottom: 8px;
  outline: none;
  transition: border-color var(--duration-fast);
}
.mc-editor:focus {
  border-color: var(--color-primary-500);
  box-shadow: var(--glow-focus);
}

.mc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--muted);
  color: var(--muted-foreground);
  cursor: pointer;
  transition: all var(--duration-fast);
}
.icon-btn:hover { color: var(--foreground); }
.icon-btn:active { transform: scale(0.95); }

.icon-btn.save {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}
.icon-btn.save:hover { color: var(--color-primary-800); }

.icon-btn.danger {
  background: rgba(185, 89, 89, 0.12);
  color: var(--destructive);
}
.icon-btn.danger:hover { background: rgba(185, 89, 89, 0.2); }

/* 加载 & 空状态 */
.memory-loading, .memory-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .overlay-panel {
    background: rgba(20, 20, 20, 0.92);
  }

  .search-box {
    background: rgba(255, 255, 255, 0.04);
  }

  .toolbar-btn {
    background: rgba(255, 255, 255, 0.04);
  }

  .memory-card {
    background: rgba(255, 255, 255, 0.04);
  }
  .memory-card:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .ms-num {
    color: var(--color-primary-400);
  }

  .mc-category {
    color: var(--color-primary-400);
  }

  .mc-editor {
    background: rgba(255, 255, 255, 0.04);
  }

  .icon-btn.save {
    background: var(--color-primary-100);
    color: var(--color-primary-400);
  }

  .icon-btn.danger {
    background: rgba(248, 113, 113, 0.12);
  }
}
</style>
