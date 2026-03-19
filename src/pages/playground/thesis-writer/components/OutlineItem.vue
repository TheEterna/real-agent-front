<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChevronRight,
  Circle,
  Loader2,
  FileEdit,
  CheckCircle2,
  CircleDot,
  Pencil,
  Plus,
  Trash2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
} from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { OutlineNode, ChapterStatus } from '@/types/thesis-writer'

const props = defineProps<{
  node: OutlineNode
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  rename: [nodeId: string, newTitle: string]
  addChild: [parentId: string, level: number]
  delete: [nodeId: string]
  move: [nodeId: string, direction: 'up' | 'down']
}>()

const { t } = useI18n()
const isExpanded = ref(true)

// ==================== Inline Edit ====================
const isEditing = ref(false)
const editTitle = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

// ==================== Context Menu ====================
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

const hasChildren = computed(() =>
  props.node.children && props.node.children.length > 0
)

const isSelected = computed(() => props.selectedId === props.node.id)

// ==================== 状态样式映射 ====================
const statusConfig: Record<ChapterStatus, { icon: typeof Circle; bg: string; iconClass: string }> = {
  pending: { icon: Circle, bg: 'bg-slate-100 dark:bg-slate-800', iconClass: 'text-slate-400 dark:text-slate-500' },
  in_progress: { icon: Loader2, bg: 'bg-slate-100 dark:bg-slate-800', iconClass: 'text-slate-500 dark:text-slate-400 animate-spin-slow' },
  draft: { icon: FileEdit, bg: 'bg-slate-100 dark:bg-slate-800', iconClass: 'text-slate-500 dark:text-slate-400' },
  revised: { icon: CircleDot, bg: 'bg-slate-100 dark:bg-slate-800', iconClass: 'text-slate-500 dark:text-slate-400' },
  completed: { icon: CheckCircle2, bg: 'bg-emerald-100 dark:bg-emerald-900/30', iconClass: 'text-emerald-600 dark:text-emerald-400' }
}

// ==================== 父节点状态聚合 ====================
/** 收集所有叶子节点 */
function collectLeaves(node: OutlineNode): OutlineNode[] {
  if (!node.children?.length) return [node]
  return node.children.flatMap(child => collectLeaves(child))
}

/** 聚合计算父节点的有效状态 */
const effectiveStatus = computed<ChapterStatus>(() => {
  if (!props.node.children?.length) return props.node.status

  const leaves = collectLeaves(props.node)
  if (leaves.length === 0) return props.node.status

  const allCompleted = leaves.every(l => l.status === 'completed')
  if (allCompleted) return 'completed'

  const anyHasContent = leaves.some(l =>
    l.status === 'draft' || l.status === 'revised' || l.status === 'completed' || l.status === 'in_progress',
  )
  if (anyHasContent) return 'draft'

  return 'pending'
})

const currentStatus = computed(() => statusConfig[effectiveStatus.value] || statusConfig.pending)
const statusIcon = computed(() => currentStatus.value.icon)
const statusBgClass = computed(() => currentStatus.value.bg)
const statusIconClass = computed(() => currentStatus.value.iconClass)

// ==================== 操作 ====================
function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleSelect() {
  if (!isEditing.value) {
    emit('select', props.node.id)
  }
}

function formatWordCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return String(count)
}

// ==================== Inline 编辑 ====================
function startEdit() {
  showMenu.value = false
  editTitle.value = props.node.title
  isEditing.value = true
  nextTick(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  })
}

function confirmEdit() {
  const trimmed = editTitle.value.trim()
  if (trimmed && trimmed !== props.node.title) {
    emit('rename', props.node.id, trimmed)
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function handleEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    confirmEdit()
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}

// ==================== 右键菜单 ====================
function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  menuPosition.value = { x: e.clientX, y: e.clientY }
  showMenu.value = true
  // 点击任意位置关闭菜单
  setTimeout(() => {
    document.addEventListener('click', closeMenu, { once: true })
    document.addEventListener('contextmenu', closeMenu, { once: true })
  }, 0)
}

function closeMenu() {
  showMenu.value = false
}

function handleAddChild() {
  showMenu.value = false
  emit('addChild', props.node.id, props.node.level + 1)
}

function handleDelete() {
  showMenu.value = false
  emit('delete', props.node.id)
}

function handleMoveUp() {
  showMenu.value = false
  emit('move', props.node.id, 'up')
}

function handleMoveDown() {
  showMenu.value = false
  emit('move', props.node.id, 'down')
}

// 双击进入编辑
function handleDblClick() {
  startEdit()
}
</script>

<template>
  <div class="outline-item">
    <!-- Node Header -->
    <div
      class="group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 active:scale-[0.98] pl-[calc(0.5rem+var(--indent-level)*0.75rem)] sm:pl-[calc(0.5rem+var(--indent-level)*1rem)]"
      :class="{
        'bg-slate-100/80 dark:bg-slate-700/50': isSelected,
      }"
      :style="{ '--indent-level': node.level - 1 }"
      @click="handleSelect"
      @dblclick.stop="handleDblClick"
      @contextmenu="handleContextMenu"
    >
      <!-- Expand/Collapse Toggle -->
      <button
        v-if="hasChildren"
        class="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        :class="{ 'rotate-90': isExpanded }"
        @click.stop="toggleExpand"
      >
        <ChevronRight
          :size="14"
          class="transition-transform duration-200 ease-out"
        />
      </button>
      <div v-else class="w-4"></div>

      <!-- Status Icon -->
      <div
        class="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200"
        :class="statusBgClass"
      >
        <component :is="statusIcon" :size="12" :class="statusIconClass" />
      </div>

      <!-- Title (显示模式) -->
      <span
        v-if="!isEditing"
        class="flex-1 text-sm truncate transition-colors duration-200 group-hover:pr-16"
        :class="{
          'font-semibold text-slate-800 dark:text-slate-100': node.level === 1,
          'font-medium text-slate-600 dark:text-slate-300': node.level === 2,
          'text-slate-500 dark:text-slate-400': node.level === 3,
          'text-slate-700 dark:text-slate-200': node.level > 3,
        }"
      >
        {{ node.title }}
      </span>

      <!-- Title (编辑模式) -->
      <input
        v-else
        ref="editInputRef"
        v-model="editTitle"
        class="flex-1 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 dark:focus:border-slate-500 text-slate-800 dark:text-slate-100"
        @keydown="handleEditKeydown"
        @blur="confirmEdit"
        @click.stop
      />

      <!-- Hover Action Buttons (absolute 定位，不占流式空间) -->
      <div
        v-if="!isEditing"
        class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                :aria-label="t('thesisWriter.outlineItem.rename')"
                class="w-11 h-11 sm:w-9 sm:h-9 md:w-7 md:h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-600/50 rounded transition-all duration-150"
                @click.stop="startEdit"
              >
                <Pencil :size="14" class="sm:w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.outlineItem.rename') }}</TooltipContent>
          </Tooltip>
          <Tooltip v-if="node.level < 3">
            <TooltipTrigger as-child>
              <button
                :aria-label="t('thesisWriter.outlineItem.addSubChapter')"
                class="w-11 h-11 sm:w-9 sm:h-9 md:w-7 md:h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-600/50 rounded transition-all duration-150"
                @click.stop="handleAddChild"
              >
                <Plus :size="14" class="sm:w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">{{ t('thesisWriter.outlineItem.addSubChapter') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                :aria-label="t('common.button.delete')"
                class="w-11 h-11 sm:w-9 sm:h-9 md:w-7 md:h-7 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-150"
                @click.stop="handleDelete"
              >
                <Trash2 :size="14" class="sm:w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">{{ t('common.button.delete') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <!-- Word Count Badge -->
      <span
        v-if="node.actualWordCount > 0 && !isEditing"
        class="text-xs font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        {{ formatWordCount(node.actualWordCount) }}
      </span>
    </div>

    <!-- Children (Recursive with expand animation) -->
    <div
      v-if="hasChildren"
      class="overflow-hidden transition-all duration-200 ease-out"
      :class="isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'"
    >
      <div class="children">
        <OutlineItem
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :selected-id="selectedId"
          @select="(id: string) => emit('select', id)"
          @rename="(nodeId: string, newTitle: string) => emit('rename', nodeId, newTitle)"
          @add-child="(parentId: string, level: number) => emit('addChild', parentId, level)"
          @delete="(nodeId: string) => emit('delete', nodeId)"
          @move="(nodeId: string, dir: 'up' | 'down') => emit('move', nodeId, dir)"
        />
      </div>
    </div>

    <!-- 右键上下文菜单 -->
    <Teleport to="body">
      <div
        v-if="showMenu"
        class="fixed z-[9999] min-w-[160px] py-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-lg shadow-lg shadow-slate-200/30 dark:shadow-black/30"
        :style="{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }"
      >
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
          @click="startEdit"
        >
          <Pencil :size="14" class="text-slate-400" />
          {{ t('thesisWriter.outlineItem.rename') }}
        </button>
        <button
          v-if="node.level < 3"
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
          @click="handleAddChild"
        >
          <Plus :size="14" class="text-slate-400" />
          {{ t('thesisWriter.outlineItem.addSubChapter') }}
        </button>
        <div class="my-1 border-t border-slate-100 dark:border-slate-700"></div>
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
          @click="handleMoveUp"
        >
          <ArrowUp :size="14" class="text-slate-400" />
          {{ t('thesisWriter.outlineItem.moveUp') }}
        </button>
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
          @click="handleMoveDown"
        >
          <ArrowDown :size="14" class="text-slate-400" />
          {{ t('thesisWriter.outlineItem.moveDown') }}
        </button>
        <div class="my-1 border-t border-slate-100 dark:border-slate-700"></div>
        <button
          class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          @click="handleDelete"
        >
          <Trash2 :size="14" />
          {{ t('common.button.delete') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.outline-item {
  user-select: none;
}

/* Slow spin animation for in_progress status */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}

/* Respect user's motion preference */
@media (prefers-reduced-motion: reduce) {
  .animate-spin-slow {
    animation: none !important;
  }
}
</style>
