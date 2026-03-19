<template>
  <DialogRoot :open="visible" @update:open="handleOpenChange">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent
        class="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-2xl shadow-slate-300/30 dark:shadow-black/40 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-200"
        @escape-key-down="emit('close')"
      >
        <!-- Search Input -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-100/80 dark:border-slate-700/50">
          <Search :size="18" class="text-muted-foreground shrink-0" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            :placeholder="t('thesisWriter.commandPalette.inputPlaceholder')"
            @keydown.enter="handleEnter"
            @keydown.up.prevent="navigateUp"
            @keydown.down.prevent="navigateDown"
            @keydown.escape="emit('close')"
          />
          <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
            ESC
          </kbd>
        </div>

        <!-- Command List -->
        <div class="max-h-72 overflow-y-auto py-1.5" role="listbox" :aria-label="t('thesisWriter.commandPalette.commandListLabel')">
          <template v-if="filteredCommands.length > 0">
            <button
              v-for="(cmd, index) in filteredCommands"
              :key="cmd.action"
              class="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors duration-100"
              :class="index === activeIndex
                ? 'bg-accent'
                : 'hover:bg-accent/50'"
              role="option"
              :aria-selected="index === activeIndex"
              @click="executeCommand(cmd)"
              @mouseenter="activeIndex = index"
            >
              <component
                :is="cmd.icon"
                :size="16"
                class="shrink-0"
                :class="cmd.iconColor"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-foreground truncate">{{ cmd.label }}</div>
                <div class="text-xs text-muted-foreground truncate">{{ cmd.description }}</div>
              </div>
              <ChevronRight :size="14" class="text-muted-foreground/50 shrink-0" />
            </button>
          </template>

          <!-- Custom Command -->
          <template v-if="query.trim() && !exactMatch">
            <div class="px-4 py-1.5">
              <div class="border-t border-border/50"></div>
            </div>
            <button
              class="w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors duration-100"
              :class="activeIndex === filteredCommands.length
                ? 'bg-accent'
                : 'hover:bg-accent/50'"
              role="option"
              :aria-selected="activeIndex === filteredCommands.length"
              @click="executeCustom"
              @mouseenter="activeIndex = filteredCommands.length"
            >
              <Sparkles :size="16" class="text-violet-500 shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-foreground truncate">
                  {{ t('thesisWriter.commandPalette.customCommand') }} "{{ query.trim() }}"
                </div>
                <div class="text-xs text-muted-foreground">按 Enter 发送到 AI 执行</div>
              </div>
              <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                Enter
              </kbd>
            </button>
          </template>

          <!-- Empty state -->
          <div v-if="filteredCommands.length === 0 && !query.trim()" class="px-4 py-8 text-center">
            <Terminal :size="24" class="mx-auto mb-2 text-muted-foreground/50" />
            <p class="text-xs text-muted-foreground">{{ t('thesisWriter.commandPalette.noResults') }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 border-t border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono border border-slate-200 dark:border-slate-600">Up</kbd>
            <kbd class="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono border border-slate-200 dark:border-slate-600">Down</kbd>
            {{ t('thesisWriter.commandPalette.navigationHint') }}
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono border border-slate-200 dark:border-slate-600">Enter</kbd>
            {{ t('thesisWriter.commandPalette.executeHint') }}
          </span>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from 'reka-ui'
import {
  Search,
  ChevronRight,
  Sparkles,
  Terminal,
  PenTool,
  Wand2,
  FileCheck,
  Maximize2,
  BookOpen,
} from 'lucide-vue-next'

interface CommandItem {
  action: string
  label: string
  description: string
  icon: Component
  iconColor: string
  keywords: string[]
}

const props = defineProps<{
  visible: boolean
  projectId: string
  nodeId: string
}>()

const emit = defineEmits<{
  close: []
  execute: [command: string]
}>()

const { t } = useI18n()
const inputRef = ref<HTMLInputElement>()
const query = ref('')
const activeIndex = ref(0)

const presetCommands = computed<CommandItem[]>(() => [
  {
    action: 'write_chapter',
    label: t('thesisWriter.commandPalette.generateDraft'),
    description: t('thesisWriter.commandPalette.generateDraftDesc'),
    icon: PenTool,
    iconColor: 'text-amber-500',
    keywords: ['生成', '初稿', '写作', 'write', 'chapter', 'draft'],
  },
  {
    action: 'polish',
    label: t('thesisWriter.commandPalette.polishChapter'),
    description: t('thesisWriter.commandPalette.polishChapterDesc'),
    icon: Wand2,
    iconColor: 'text-violet-500',
    keywords: ['润色', '优化', '修改', 'polish', 'refine'],
  },
  {
    action: 'format_check',
    label: t('thesisWriter.commandPalette.formatCheck'),
    description: t('thesisWriter.commandPalette.formatCheckDesc'),
    icon: FileCheck,
    iconColor: 'text-blue-500',
    keywords: ['格式', '检查', '规范', 'format', 'check'],
  },
  {
    action: 'expand_content',
    label: t('thesisWriter.commandPalette.expandContent'),
    description: t('thesisWriter.commandPalette.expandContentDesc'),
    icon: Maximize2,
    iconColor: 'text-emerald-500',
    keywords: ['扩写', '扩展', '补充', 'expand', 'content'],
  },
  {
    action: 'cite_suggestion',
    label: t('thesisWriter.commandPalette.citeSuggestion'),
    description: t('thesisWriter.commandPalette.citeSuggestionDesc'),
    icon: BookOpen,
    iconColor: 'text-orange-500',
    keywords: ['引用', '参考文献', '文献', 'cite', 'reference'],
  },
])

const filteredCommands = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return presetCommands.value

  return presetCommands.value.filter(cmd =>
    cmd.label.toLowerCase().includes(q) ||
    cmd.description.toLowerCase().includes(q) ||
    cmd.keywords.some(k => k.includes(q))
  )
})

const exactMatch = computed(() => {
  const q = query.value.trim().toLowerCase()
  return presetCommands.value.some(cmd => cmd.label.toLowerCase() === q || cmd.action === q)
})

function handleOpenChange(open: boolean) {
  if (!open) emit('close')
}

function navigateUp() {
  const total = filteredCommands.value.length + (query.value.trim() && !exactMatch.value ? 1 : 0)
  if (total > 0) {
    activeIndex.value = (activeIndex.value - 1 + total) % total
  }
}

function navigateDown() {
  const total = filteredCommands.value.length + (query.value.trim() && !exactMatch.value ? 1 : 0)
  if (total > 0) {
    activeIndex.value = (activeIndex.value + 1) % total
  }
}

function handleEnter() {
  if (activeIndex.value < filteredCommands.value.length) {
    executeCommand(filteredCommands.value[activeIndex.value])
  } else if (query.value.trim()) {
    executeCustom()
  }
}

function executeCommand(cmd: CommandItem) {
  emit('execute', cmd.action)
  query.value = ''
  activeIndex.value = 0
  emit('close')
}

function executeCustom() {
  const text = query.value.trim()
  if (!text) return
  emit('execute', text)
  query.value = ''
  activeIndex.value = 0
  emit('close')
}

// Auto-focus input when opened
watch(() => props.visible, (val) => {
  if (val) {
    query.value = ''
    activeIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

// Reset activeIndex when filter changes
watch(filteredCommands, () => {
  activeIndex.value = 0
})
</script>
