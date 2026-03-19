<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { SearchIcon, Trash2Icon, Edit2Icon, StarIcon, BrainCircuitIcon, PinIcon, PinOffIcon } from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import type { MemoryItem } from '@/types/memory'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  memories: MemoryItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'search', query: string): void
  (e: 'edit', id: string, content: string): void
  (e: 'delete', id: string): void
  (e: 'pin', id: string, pinned: boolean): void
}>()

const searchQuery = ref('')
const editingMemory = ref<MemoryItem | null>(null)
const editContent = ref('')

const filteredMemories = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.memories
  }
  const query = searchQuery.value.toLowerCase()
  return props.memories.filter(m =>
    m.content.toLowerCase().includes(query) ||
    m.summary.toLowerCase().includes(query)
  )
})

const coreMemories = computed(() => filteredMemories.value.filter(m => m.tier === 'CORE'))
const semanticMemories = computed(() => filteredMemories.value.filter(m => m.tier === 'SEMANTIC'))
const episodicMemories = computed(() => filteredMemories.value.filter(m => m.tier === 'EPISODIC'))

const totalCount = computed(() => props.memories.length)

function getTierLabel(tier: string) {
  const labels: Record<string, string> = {
    CORE: t('memoryPanel.tierCore'),
    SEMANTIC: t('memoryPanel.tierSemantic'),
    EPISODIC: t('memoryPanel.tierEpisodic')
  }
  return labels[tier] || tier
}

function getTierColor(tier: string) {
  const colors: Record<string, string> = {
    CORE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    SEMANTIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
    EPISODIC: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
  }
  return colors[tier] || colors.EPISODIC
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleEdit(memory: MemoryItem) {
  editingMemory.value = memory
  editContent.value = memory.content
}

function saveEdit() {
  if (editingMemory.value && editContent.value.trim()) {
    emit('edit', editingMemory.value.id, editContent.value.trim())
    message.success(t('memoryPanel.updateSuccess'))
    editingMemory.value = null
  }
}

function cancelEdit() {
  editingMemory.value = null
  editContent.value = ''
}

function handleDelete(id: string) {
  emit('delete', id)
  message.success(t('memoryPanel.deleteSuccess'))
}

function handlePin(id: string, currentPinned: boolean) {
  emit('pin', id, !currentPinned)
  message.success(currentPinned ? t('memoryPanel.unpinned') : t('memoryPanel.pinned'))
}

// 搜索防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emit('search', searchQuery.value), 300)
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-2xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <BrainCircuitIcon class="size-5 text-primary" />
          {{ t('memoryPanel.title') }}
          <Badge variant="secondary" class="ml-2">
            {{ t('memoryPanel.countSuffix', { count: totalCount }) }}
          </Badge>
        </DialogTitle>
      </DialogHeader>

      <!-- 搜索框 -->
      <div class="relative">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <Input
          v-model="searchQuery"
          :placeholder="t('memoryPanel.searchPlaceholder')"
          class="pl-9"
        />
      </div>

      <!-- 记忆列表 -->
      <ScrollArea class="flex-1 -mx-6 px-6">
        <div v-if="filteredMemories.length === 0" class="py-12 text-center">
          <BrainCircuitIcon class="size-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
          <p class="text-sm text-zinc-500 dark:text-zinc-400">
            {{ searchQuery ? t('memoryPanel.noMatch') : t('memoryPanel.noMemory') }}
          </p>
        </div>

        <div v-else class="space-y-4 py-2">
          <!-- 核心记忆 -->
          <div v-if="coreMemories.length > 0">
            <div class="flex items-center gap-2 mb-2">
              <StarIcon class="size-4 text-amber-500" />
              <span class="text-sm font-medium text-amber-700 dark:text-amber-400">{{ t('memoryPanel.coreMemory') }}</span>
              <Badge variant="outline" class="text-xs">{{ coreMemories.length }}</Badge>
            </div>
            <div class="space-y-2">
              <div
                v-for="memory in coreMemories"
                :key="memory.id"
                class="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
              >
                <MemoryCard :memory="memory" @edit="handleEdit" @delete="handleDelete" @pin="handlePin" />
              </div>
            </div>
          </div>

          <!-- 语义记忆 -->
          <div v-if="semanticMemories.length > 0">
            <div class="flex items-center gap-2 mb-2">
              <BrainCircuitIcon class="size-4 text-blue-500" />
              <span class="text-sm font-medium text-blue-700 dark:text-blue-400">{{ t('memoryPanel.semanticMemory') }}</span>
              <Badge variant="outline" class="text-xs">{{ semanticMemories.length }}</Badge>
            </div>
            <div class="space-y-2">
              <div
                v-for="memory in semanticMemories"
                :key="memory.id"
                class="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
              >
                <MemoryCard :memory="memory" @edit="handleEdit" @delete="handleDelete" @pin="handlePin" />
              </div>
            </div>
          </div>

          <!-- 情景记忆 -->
          <div v-if="episodicMemories.length > 0">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-green-700 dark:text-green-400">{{ t('memoryPanel.episodicMemory') }}</span>
              <Badge variant="outline" class="text-xs">{{ episodicMemories.length }}</Badge>
            </div>
            <div class="space-y-2">
              <div
                v-for="memory in episodicMemories"
                :key="memory.id"
                class="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
              >
                <MemoryCard :memory="memory" @edit="handleEdit" @delete="handleDelete" @pin="handlePin" />
              </div>
            </div>
          </div>

        </div>
      </ScrollArea>
    </DialogContent>

    <!-- 编辑对话框 -->
    <Dialog :open="!!editingMemory" @update:open="cancelEdit">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ t('memoryPanel.editTitle') }}</DialogTitle>
        </DialogHeader>
        <Textarea
          v-model="editContent"
          :rows="5"
          :placeholder="t('memoryPanel.editPlaceholder')"
          class="mt-4"
        />
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="cancelEdit">{{ t('common.button.cancel') }}</Button>
          <Button @click="saveEdit">{{ t('common.button.save') }}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { useI18n as useI18nGlobal } from 'vue-i18n'
import type { MemoryItem as MemoryPanelItem } from '@/types/memory'

// 记忆卡片子组件
const MemoryCard = defineComponent({
  props: {
    memory: {
      type: Object as PropType<MemoryPanelItem>,
      required: true
    }
  },
  emits: ['edit', 'delete', 'pin'],
  setup(props, { emit }) {
    const { t } = useI18nGlobal()
    function handleEdit() {
      emit('edit', props.memory)
    }
    function handleDelete() {
      emit('delete', props.memory.id)
    }
    function handlePin() {
      emit('pin', props.memory.id, !!props.memory.isPinned)
    }
    return { handleEdit, handleDelete, handlePin, t }
  },
  computed: {
    tierLabel() {
      const labels: Record<string, string> = {
        CORE: this.t('memoryPanel.tierCore'),
        SEMANTIC: this.t('memoryPanel.tierSemantic'),
        EPISODIC: this.t('memoryPanel.tierEpisodic')
      }
      return labels[this.memory.tier] || this.memory.tier
    },
    tierColor() {
      const colors: Record<string, string> = {
        CORE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-300',
        SEMANTIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border-blue-300',
        EPISODIC: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border-green-300'
      }
      return colors[this.memory.tier] || colors.EPISODIC
    },
    importanceLabel() {
      const score = this.memory.importanceScore || 0
      if (score >= 0.8) return this.t('memoryPanel.importanceHigh')
      if (score >= 0.5) return this.t('memoryPanel.importanceMedium')
      return this.t('memoryPanel.importanceLow')
    }
  },
  methods: {
    formatTime(timestamp: string) {
      return new Date(timestamp).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },
  template: `
    <div class="memory-content">
      <div class="flex items-start justify-between gap-2">
        <p class="flex-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {{ memory.content }}
        </p>
        <div class="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon-sm" class="h-7 w-7" :class="memory.isPinned ? 'text-amber-500' : ''" @click="handlePin">
            <PinIcon v-if="!memory.isPinned" class="size-3.5" />
            <PinOffIcon v-else class="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" class="h-7 w-7" @click="handleEdit">
            <Edit2Icon class="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" class="h-7 w-7 text-zinc-400 hover:text-red-500" @click="handleDelete">
            <Trash2Icon class="size-3.5" />
          </Button>
        </div>
      </div>
      <div class="flex items-center gap-2 mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        <Badge :class="['text-xs px-1.5 py-0', tierColor]" variant="outline">
          {{ tierLabel }}
        </Badge>
        <span>{{ formatTime(memory.createdTime) }}</span>
        <span v-if="memory.importanceScore">{{ t('memoryPanel.importanceLabel', { level: importanceLabel }) }}</span>
        <span v-if="memory.accessCount">{{ t('memoryPanel.accessCount', { count: memory.accessCount }) }}</span>
        <span v-if="memory.isPinned" class="text-amber-500">{{ t('memoryPanel.pinnedLabel') }}</span>
      </div>
    </div>
  `
})

export { MemoryCard }
</script>
