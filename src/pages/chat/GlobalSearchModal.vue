<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useRouter } from 'vue-router'
import { Search, Plus, MessageSquare, X, Pin, ChevronRight } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { isToday, subDays, isAfter } from 'date-fns'
import { useChat } from '@/composables/useChat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const chat = useChatStore()
const router = useRouter()
const searchText = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(-1)

const {
  openNewChatDialog,
} = useChat()

// 自动聚焦
watch(() => props.open, (newVal) => {
  if (newVal) {
    searchText.value = ''
    selectedIndex.value = -1
    setTimeout(() => {
      inputRef.value?.focus()
    }, 100)
  }
})

// 搜索过滤逻辑
const filteredSessions = computed(() => {
  const all = chat.sessions.filter(s => !s.id.startsWith('temp-'))
  if (!searchText.value.trim()) return all
  const query = searchText.value.toLowerCase()
  return all.filter(s => s.title.toLowerCase().includes(query))
})

// 分组逻辑
const groupedResults = computed(() => {
  const sorted = [...filteredSessions.value].sort((a, b) =>
    new Date(b.updatedTime).getTime() - new Date(a.updatedTime).getTime()
  )

  const groups: Record<string, { label: string, items: any[] }> = {
    today: { label: t('chat.search.today'), items: [] },
    yesterday: { label: t('chat.search.yesterday'), items: [] },
    last7Days: { label: t('chat.search.last7Days'), items: [] },
    last30Days: { label: t('chat.search.last30Days'), items: [] },
    older: { label: t('chat.search.older'), items: [] }
  }

  const resultGroups: { label: string, items: any[] }[] = []

  sorted.forEach(s => {
    const date = new Date(s.updatedTime)
    if (isToday(date)) {
      groups.today.items.push(s)
    } else if (isAfter(date, subDays(new Date(), 1))) {
      groups.yesterday.items.push(s)
    } else if (isAfter(date, subDays(new Date(), 7))) {
      groups.last7Days.items.push(s)
    } else if (isAfter(date, subDays(new Date(), 30))) {
      groups.last30Days.items.push(s)
    } else {
      groups.older.items.push(s)
    }
  })

  if (groups.today.items.length > 0) resultGroups.push(groups.today)
  if (groups.yesterday.items.length > 0) resultGroups.push(groups.yesterday)
  if (groups.last7Days.items.length > 0) resultGroups.push(groups.last7Days)
  if (groups.last30Days.items.length > 0) resultGroups.push(groups.last30Days)
  if (groups.older.items.length > 0) resultGroups.push(groups.older)

  return resultGroups
})

// 所有可导航项的扁平列表（用于键盘导航）
const flatItems = computed(() => {
  const items: { id: string, type: 'session' | 'new' }[] = []
  if (!searchText.value) {
    items.push({ id: '__new__', type: 'new' })
  }
  groupedResults.value.forEach(group => {
    group.items.forEach(s => {
      items.push({ id: s.id, type: 'session' })
    })
  })
  return items
})

const handleClose = () => {
  emit('update:open', false)
}

const handleNewChat = () => {
  openNewChatDialog()
  handleClose()
}

const handleSessionClick = (sessionId: string) => {
  router.push({ name: 'Chat', params: { sessionId } })
  handleClose()
}

// 键盘导航
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) {
    handleClose()
    return
  }
  if (!props.open) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, flatItems.value.length - 1)
    scrollToSelected()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
    scrollToSelected()
  } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
    e.preventDefault()
    const item = flatItems.value[selectedIndex.value]
    if (item.type === 'new') {
      handleNewChat()
    } else {
      handleSessionClick(item.id)
    }
  }
}

const scrollToSelected = () => {
  nextTick(() => {
    const el = document.querySelector('[data-search-selected="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

// 搜索文本变化时重置选中项
watch(searchText, () => {
  selectedIndex.value = -1
})

const isItemSelected = (itemId: string) => {
  if (selectedIndex.value < 0) return false
  const item = flatItems.value[selectedIndex.value]
  return item?.id === itemId
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <Transition name="search-modal">
    <div v-if="open" class="fixed inset-0 z-100 flex items-start justify-center pt-[20vh] px-4 sm:px-6">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[3px]"
        aria-hidden="true"
        @click="handleClose"
      />

      <!-- Modal Panel -->
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="t('chat.search.dialogAriaLabel')"
        class="gsm-panel relative w-full max-w-[560px] flex flex-col max-h-[56vh]
               bg-[var(--popover)] border border-[var(--border)]
               rounded-xl shadow-lg overflow-hidden"
      >
        <!-- Search Input Row -->
        <div class="gsm-search-row flex items-center gap-2 p-1.5 border-b border-[var(--border)]">
          <div class="gsm-input-wrap flex-1 flex items-center gap-2 rounded-md
                      bg-[var(--background)] border border-[var(--input)]
                      px-2.5 py-2 transition-colors
                      focus-within:border-[var(--ring)] focus-within:ring-1 focus-within:ring-[var(--ring)]">
            <Search class="shrink-0 text-[var(--muted-foreground)]" :size="16" />
            <input
              ref="inputRef"
              v-model="searchText"
              type="text"
              :aria-label="t('chat.search.inputAriaLabel')"
              :placeholder="t('chat.search.inputPlaceholder')"
              class="flex-1 bg-transparent border-0 outline-none text-base
                     text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
            />
            <button
              v-if="searchText"
              :aria-label="t('chat.search.closeAriaLabel')"
              class="shrink-0 p-0.5 rounded text-[var(--muted-foreground)]
                     hover:text-[var(--foreground)] hover:bg-[var(--accent)]
                     transition-colors active:scale-95"
              @click="searchText = ''"
            >
              <X :size="14" />
            </button>
          </div>
          <!-- New Chat Button -->
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  :aria-label="t('chat.search.newChat')"
                  class="gsm-new-btn shrink-0 flex items-center justify-center
                         w-9 h-9 rounded-md
                         bg-[var(--primary)] text-[var(--primary-foreground)]
                         hover:opacity-90 transition-all active:scale-95"
                  @click="handleNewChat"
                >
                  <Plus :size="16" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" :side-offset="6">
                <p>{{ t('chat.search.newChat') }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- Scrollable Results Area -->
        <div class="gsm-results flex-1 overflow-y-auto py-1 gsm-scrollbar">
          <!-- Empty State (no search results) -->
          <div v-if="filteredSessions.length === 0 && searchText" class="py-10 flex flex-col items-center justify-center gap-2">
            <Search class="text-[var(--muted-foreground)] opacity-40" :size="36" stroke-width="1.5" />
            <p class="text-base font-medium text-[var(--muted-foreground)]">{{ t('chat.search.noMatch') }}</p>
            <p class="text-xs text-[var(--muted-foreground)] opacity-70">{{ t('chat.search.tryOtherKeyword') }}</p>
          </div>

          <!-- Grouped Sessions -->
          <template v-if="groupedResults.length > 0">
            <div v-for="group in groupedResults" :key="group.label" class="gsm-group">
              <!-- Section Title -->
              <div class="gsm-section-title px-3 py-1.5">
                <span class="text-xs font-medium text-[var(--muted-foreground)] select-none">
                  {{ group.label }}
                </span>
              </div>

              <!-- Session Items -->
              <div class="px-1">
                <button
                  v-for="session in group.items"
                  :key="session.id"
                  :data-search-selected="isItemSelected(session.id)"
                  class="gsm-item w-full flex items-center gap-2 px-2 py-1.5
                         rounded-md text-left transition-colors group"
                  :class="{
                    'bg-[var(--accent)]': isItemSelected(session.id)
                  }"
                  @click="handleSessionClick(session.id)"
                  @mouseenter="selectedIndex = -1"
                >
                  <!-- Leading Icon -->
                  <div class="gsm-item-icon shrink-0 flex items-center justify-center
                              w-4 h-4 text-[var(--foreground)] opacity-70">
                    <Pin v-if="session.isPin" :size="14" />
                    <MessageSquare v-else :size="14" />
                  </div>

                  <!-- Title -->
                  <span class="gsm-item-label flex-1 min-w-0 text-sm truncate
                               text-[var(--foreground)]">
                    {{ session.title }}
                  </span>

                  <!-- Trailing Chevron -->
                  <ChevronRight
                    :size="14"
                    class="gsm-item-chevron shrink-0 text-[var(--muted-foreground)] opacity-0
                           group-hover:opacity-60 transition-opacity"
                    :class="{ '!opacity-60': isItemSelected(session.id) }"
                  />
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="gsm-footer flex items-center justify-between
                    px-3 py-1.5 border-t border-[var(--border)]
                    bg-[var(--muted)] text-[10px] text-[var(--muted-foreground)] select-none">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1">
              <kbd class="gsm-kbd">ESC</kbd>
              {{ t('chat.search.closeTooltip').replace('(ESC)', '').replace('ESC', '').trim() || 'close' }}
            </span>
            <span class="flex items-center gap-1">
              <kbd class="gsm-kbd">&uarr;&darr;</kbd>
              {{ t('chat.search.navigate', 'navigate') }}
            </span>
            <span class="flex items-center gap-1">
              <kbd class="gsm-kbd">&crarr;</kbd>
              {{ t('chat.search.open', 'open') }}
            </span>
          </div>
          <span>{{ t('chat.search.sessionCount', { count: filteredSessions.length }) }}</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* === Transition === */
.search-modal-enter-active,
.search-modal-leave-active {
  transition: opacity var(--duration-normal, 200ms) var(--ease-snap, ease);
}
.search-modal-enter-active .gsm-panel,
.search-modal-leave-active .gsm-panel {
  transition: transform var(--duration-normal, 200ms) var(--ease-fluid, ease),
              opacity var(--duration-normal, 200ms) var(--ease-snap, ease);
}
.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
}
.search-modal-enter-from .gsm-panel,
.search-modal-leave-to .gsm-panel {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .search-modal-enter-active,
  .search-modal-leave-active {
    transition: opacity 0.1s ease;
  }
  .search-modal-enter-active .gsm-panel,
  .search-modal-leave-active .gsm-panel {
    transition: none;
  }
  .search-modal-enter-from .gsm-panel,
  .search-modal-leave-to .gsm-panel {
    transform: none;
  }
}

/* === Input === */
.gsm-input-wrap input {
  font-family: Inter, system-ui, -apple-system, sans-serif;
}

.gsm-input-wrap input::selection {
  background-color: var(--color-primary-100, #e0f2f1);
  color: var(--color-primary-900, #004d40);
}

/* === Item hover === */
.gsm-item:hover {
  background-color: var(--accent, #f5f5f5);
}

.gsm-item:active {
  transform: scale(0.995);
}

/* === Scrollbar === */
.gsm-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.gsm-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.gsm-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border, #e5e5e5);
  border-radius: 10px;
}
.gsm-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground, #737373);
}

/* === Kbd tags === */
.gsm-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 16px;
  padding: 0 3px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-family: inherit;
  line-height: 1;
  background: var(--muted, #f5f5f5);
  border: 1px solid var(--border, #e5e5e5);
  color: var(--muted-foreground, #737373);
}
</style>

<style lang="scss">
/* Dark mode overrides (non-scoped to reach .dark on <html>) */
.dark {
  .gsm-scrollbar::-webkit-scrollbar-thumb {
    background: var(--border, rgba(255, 255, 255, 0.1));
  }
  .gsm-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--muted-foreground, #a3a3a3);
  }

  .gsm-input-wrap input::selection {
    background-color: rgba(124, 183, 180, 0.3);
    color: var(--foreground, #fafafa);
  }
}
</style>
