<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { Upload, X, File as FileIcon } from 'lucide-vue-next'
import type { FileUploadArgs, UIInteractMode, UIEventMeta } from '@/types/ui-event'

const { t } = useI18n()

interface FileInfo {
  name: string
  size: number
  type: string
}

const props = withDefaults(defineProps<{
  args: FileUploadArgs
  interact: UIInteractMode
  meta?: UIEventMeta
  turnId?: string
}>(), {
  interact: 'ui',
})

const emit = defineEmits<{
  submit: [value: FileInfo[]]
}>()

const insideForm = inject<boolean>('uiFormContext', false)
const files = ref<File[]>([])
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const containerRef = ref<HTMLElement>()

const isElicitation = props.interact === 'elicitation'
const isDisabled = props.interact === 'ui' && !insideForm

const canAddMore = computed(() => {
  if (!props.args.multiple) return files.value.length === 0
  if (props.args.maxCount) return files.value.length < props.args.maxCount
  return true
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toFileInfoList(): FileInfo[] {
  return files.value.map((f) => ({
    name: f.name,
    size: f.size,
    type: f.type,
  }))
}

function validateFile(file: File): string | null {
  if (props.args.maxSize && file.size > props.args.maxSize) {
    return t('uiEvent.fileUpload.fileSizeExceed', { name: file.name, size: formatSize(props.args.maxSize) })
  }
  return null
}

function addFiles(newFiles: FileList | null) {
  if (!newFiles || isDisabled) return
  for (const file of Array.from(newFiles)) {
    if (!canAddMore.value) break
    const error = validateFile(file)
    if (error) {
      console.warn(error)
      continue
    }
    files.value.push(file)
  }
}

function removeFile(index: number) {
  if (isDisabled) return
  files.value.splice(index, 1)
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  addFiles(e.dataTransfer?.files ?? null)
}

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(input.files)
  input.value = ''
}

function triggerFileInput() {
  if (isDisabled) return
  fileInputRef.value?.click()
}

watch(files, () => {
  if (insideForm) {
    emit('submit', toFileInfoList())
  }
}, { deep: true })

function handleSubmit() {
  emit('submit', toFileInfoList())
}

function handleCancel() {
  emit('submit', [])
}

const showButtons = isElicitation && !insideForm

onMounted(() => {
  if (containerRef.value) {
    gsap.from(containerRef.value, {
      opacity: 0,
      y: 8,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
  }
})
</script>

<template>
  <div ref="containerRef" class="flex flex-col gap-2 w-full" :class="insideForm ? '' : 'max-w-md'">
    <label class="text-sm font-medium text-foreground/90">
      {{ args.label }}
    </label>

    <input
      ref="fileInputRef"
      type="file"
      :accept="args.accept"
      :multiple="args.multiple"
      class="hidden"
      @change="handleFileInput"
    />

    <div
      v-if="canAddMore"
      class="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 transition-colors cursor-pointer"
      :class="[
        isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50 hover:bg-accent/30',
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <Upload class="size-8 text-muted-foreground" />
      <div class="text-sm text-muted-foreground text-center">
        <span class="font-medium text-foreground">{{ t('uiEvent.fileUpload.clickUpload') }}</span> {{ t('uiEvent.fileUpload.dragHint') }}
      </div>
      <div class="text-xs text-muted-foreground">
        {{ args.accept }}
        <span v-if="args.maxSize">&middot; {{ t('uiEvent.fileUpload.maxSize', { size: formatSize(args.maxSize) }) }}</span>
        <span v-if="args.maxCount">&middot; {{ t('uiEvent.fileUpload.maxCount', { count: args.maxCount }) }}</span>
      </div>
    </div>

    <div v-if="files.length > 0" class="flex flex-col gap-1.5">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
      >
        <FileIcon class="size-4 text-muted-foreground shrink-0" />
        <span class="flex-1 truncate">{{ file.name }}</span>
        <span class="text-xs text-muted-foreground shrink-0">{{ formatSize(file.size) }}</span>
        <button
          v-if="!isDisabled"
          class="shrink-0 rounded p-0.5 hover:bg-accent transition-colors"
          @click="removeFile(index)"
        >
          <X class="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>

    <div v-if="showButtons" class="flex items-center gap-2 mt-1">
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-95"
        @click="handleSubmit"
      >
        {{ t('common.button.submit') }}
      </button>
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-all active:scale-95"
        @click="handleCancel"
      >
        {{ t('common.button.cancel') }}
      </button>
    </div>
  </div>
</template>
