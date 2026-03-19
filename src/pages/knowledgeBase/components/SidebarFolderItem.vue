<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-vue-next'
import type { KbFolder, KnowledgeBase } from '@/api/knowledgeBaseAPI'
import DatasetItem from './DatasetItem.vue'

interface Props {
  folder: KbFolder
  allFolders: KbFolder[]
  allDatasets: KnowledgeBase[]
  level: number
  activeDatasetId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectDataset: [id: string]
  editDataset: [ds: KnowledgeBase]
  deleteDataset: [ds: KnowledgeBase]
}>()

const isOpen = ref(true)

// 查找当前文件夹下的子文件夹（响应式）
const childFolders = computed(() => props.allFolders.filter(f => f.parentId === props.folder.id))

// 查找当前文件夹下的数据集（响应式）
const childDatasets = computed(() => props.allDatasets.filter(ds => ds.folderId === props.folder.id))

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const handleSelectDataset = (id: string) => {
  emit('selectDataset', id)
}

const handleEditDataset = (ds: KnowledgeBase) => {
  emit('editDataset', ds)
}

const handleDeleteDataset = (ds: KnowledgeBase) => {
  emit('deleteDataset', ds)
}
</script>

<template>
  <div class="select-none">
    <!-- 文件夹标题行 -->
    <div
      class="group flex items-center gap-2 py-1.5 px-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-slate-600 dark:text-zinc-300 transition-all duration-200"
      :style="{ paddingLeft: `${level * 12 + 8}px` }"
      role="button"
      tabindex="0"
      @click="toggleOpen"
      @keydown.enter="toggleOpen"
    >
      <span class="text-slate-400 dark:text-zinc-500 w-4 h-4 flex items-center justify-center transition-all duration-200">
        <ChevronDown v-if="isOpen" :size="14" />
        <ChevronRight v-else :size="14" />
      </span>
      <span class="text-slate-400 dark:text-zinc-500">
        <FolderOpen v-if="isOpen" :size="16" />
        <Folder v-else :size="16" />
      </span>
      <span class="text-[0.8125rem] font-medium truncate flex-1">{{ folder.name }}</span>
    </div>

    <!-- 子内容区域 -->
    <div v-if="isOpen" class="flex flex-col">
      <!-- 递归渲染子文件夹 -->
      <SidebarFolderItem
        v-for="childFolder in childFolders"
        :key="childFolder.id ?? childFolder.name"
        :folder="childFolder"
        :all-folders="allFolders"
        :all-datasets="allDatasets"
        :level="level + 1"
        :active-dataset-id="activeDatasetId"
        @select-dataset="handleSelectDataset"
        @edit-dataset="handleEditDataset"
        @delete-dataset="handleDeleteDataset"
      />

      <!-- 渲染当前文件夹下的数据集 -->
      <DatasetItem
        v-for="ds in childDatasets"
        :key="ds.id"
        :data="ds"
        :level="level + 1"
        :is-active="activeDatasetId === ds.id"
        @click="handleSelectDataset(ds.id)"
        @edit="handleEditDataset(ds)"
        @delete="handleDeleteDataset(ds)"
      />
    </div>
  </div>
</template>
