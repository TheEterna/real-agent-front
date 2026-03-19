<script setup lang="ts">
import { Folder, FileText, Image as ImageIcon, Code, File as FileIcon, Video } from 'lucide-vue-next'

interface Props {
  type: 'folder' | 'file'
  fileType?: 'pdf' | 'markdown' | 'image' | 'video' | 'code' | 'excel' | 'web'
  size?: number
}

withDefaults(defineProps<Props>(), {
  size: 18
})
</script>

<template>
  <Folder v-if="type === 'folder'" :size="size" class="text-amber-500 dark:text-amber-400 fill-amber-500/15 dark:fill-amber-400/15" />
  <FileText v-else-if="fileType === 'pdf'" :size="size" class="text-red-500 dark:text-red-400" />
  <ImageIcon v-else-if="fileType === 'image'" :size="size" class="text-purple-500 dark:text-purple-400" />
  <Video v-else-if="fileType === 'video'" :size="size" class="text-indigo-500 dark:text-indigo-400" />
  <Code v-else-if="fileType === 'code'" :size="size" class="text-cyan-600 dark:text-cyan-400" />
  <FileText v-else-if="fileType === 'markdown'" :size="size" class="text-slate-700 dark:text-slate-300" />
  <FileIcon v-else-if="fileType === 'excel'" :size="size" class="text-emerald-600 dark:text-emerald-400" />
  <FileIcon v-else :size="size" class="text-slate-400 dark:text-zinc-500" />
</template>
