<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, Folder } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface FileNode {
  id: string
  name: string
  type: 'folder' | 'file'
  children?: FileNode[]
}

interface Props {
  node: FileNode
  level?: number
  activeId: string | null
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

const emit = defineEmits<{
  select: [id: string]
}>()

const isOpen = ref(true)
const isActive = () => props.activeId === props.node.id
const hasChildren = () => props.node.children && props.node.children.length > 0
const toggleLabel = computed(() => isOpen.value ? t('knowledge.folderTree.collapse') : t('knowledge.folderTree.expand'))

const handleClick = () => {
  emit('select', props.node.id)
  if (hasChildren()) {
    isOpen.value = !isOpen.value
  }
}

const toggleOpen = (e: Event) => {
  e.stopPropagation()
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="select-none">
    <div
      :class="['flex items-center gap-2 py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-200 text-base',
        isActive() ? 'bg-slate-200/60 dark:bg-zinc-800/60 text-slate-900 dark:text-zinc-100 font-medium' : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800']"
      :style="{ paddingLeft: `${level * 12 + 8}px` }"
      role="button"
      tabindex="0"
      @click="handleClick"
      @keydown.enter="handleClick"
    >
      <button
        :class="['p-0.5 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 dark:text-zinc-500 active:scale-95 transition-all duration-200',
          hasChildren() ? '' : 'invisible',
          isOpen ? 'rotate-90' : '']"
        :aria-label="toggleLabel"
        @click="toggleOpen"
      >
        <ChevronRight :size="12" />
      </button>
      <Folder :size="16" :class="isActive() ? 'text-amber-500 dark:text-amber-400 fill-amber-500/15 dark:fill-amber-400/15' : 'text-slate-400 dark:text-zinc-500'" />
      <span class="truncate">{{ node.name }}</span>
    </div>
    
    <div v-if="isOpen && node.children">
      <FolderTreeItem 
        v-for="child in node.children" 
        :key="child.id" 
        :node="child" 
        :level="level + 1" 
        :active-id="activeId" 
        @select="(id) => emit('select', id)" 
      />
    </div>
  </div>
</template>
