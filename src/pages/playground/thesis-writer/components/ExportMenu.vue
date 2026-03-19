<template>
  <div ref="menuRef" class="relative">
    <button
      class="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="disabled || isExporting"
      :aria-label="t('thesisWriter.export.exportBtn')"
      @click="toggleMenu"
    >
      <Download :size="16" class="transition-transform duration-200" :class="{ 'animate-bounce': isExporting }" />
      <span v-if="isExporting">{{ t('thesisWriter.export.exporting') }}</span>
      <span v-else>{{ t('thesisWriter.export.exportBtn') }}</span>
      <ChevronDown :size="14" class="transition-transform duration-200" :class="{ 'rotate-180': menuOpen }" />
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="menuOpen"
        class="absolute right-0 top-full mt-1.5 w-48 backdrop-blur-md bg-background/90 border border-border/50 rounded-lg shadow-lg py-1 z-50"
        role="menu"
      >
        <button
          class="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-accent transition-colors flex items-center gap-2.5 disabled:opacity-50"
          :disabled="isExporting"
          role="menuitem"
          @click="handleExport('word')"
        >
          <FileText :size="15" class="text-blue-500" />
          {{ t('thesisWriter.export.exportWord') }}
        </button>
        <button
          class="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-accent transition-colors flex items-center gap-2.5 disabled:opacity-50"
          :disabled="isExporting"
          role="menuitem"
          @click="handleExport('pdf')"
        >
          <FileDown :size="15" class="text-red-500" />
          {{ t('thesisWriter.export.exportPdf') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, ChevronDown, FileText, FileDown } from 'lucide-vue-next'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { exportToWord, exportToPdf } from '@/api/thesis-writer'
import { message } from 'ant-design-vue'

const { t } = useI18n()

const props = defineProps<{
  projectId: string
  projectTitle?: string
  disabled?: boolean
}>()

const menuRef = ref<HTMLElement>()
const menuOpen = ref(false)
const isExporting = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function formatTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

async function handleExport(type: 'word' | 'pdf') {
  if (isExporting.value) return
  closeMenu()
  isExporting.value = true

  const titlePart = props.projectTitle || t('thesisWriter.export.defaultTitle')
  const timestamp = formatTimestamp()
  const ext = type === 'word' ? 'docx' : 'pdf'
  const filename = `${titlePart}_${timestamp}.${ext}`

  try {
    const blob = type === 'word'
      ? await exportToWord(props.projectId)
      : await exportToPdf(props.projectId)

    downloadBlob(blob, filename)
    message.success(t('thesisWriter.export.exportSuccess'))
  } catch (e) {
    console.error(`Export ${type} failed:`, e)
    message.error(t('thesisWriter.export.exportFailed'))
  } finally {
    isExporting.value = false
  }
}
</script>
