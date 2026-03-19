<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Eye, Code2, X, Copy, RotateCcw, ThumbsUp, ThumbsDown, Sparkles, Download, Share2, Table, FileText, Image as ImageIcon, Search, Save, Sun, Moon, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import MarkdownIt from 'markdown-it'
import { useMonaco } from 'stream-monaco'
import { renderAsync } from 'docx-preview'
import { Table as ATable } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 定义全局 Monaco 配置，用于修复 shiki 路径加载报错
if (typeof window !== 'undefined') {
  (window as any).MonacoEnvironment = {
    getWorkerUrl: function () {
      return `data:text/javascript;base64,${btoa(`self.onmessage = function () { postMessage({ error: 'Worker not supported in this environment' }); };`)}`
    }
  }
}

// Initialize MarkdownIt
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const props = withDefaults(defineProps<{
  isOpen: boolean
  width?: number // Width in percentage or pixels if needed
  content?: string
  type?: 'code' | 'preview' | 'document' | 'table' | 'image' | 'pdf' | 'docx'
  title?: string
  editable?: boolean
  fileBlob?: Blob | null  // 用于 docx 预览的原始文件
}>(), {
  type: 'code',
  content: '',
  title: '',
  editable: false,
  fileBlob: null
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:content', val: string): void
  (e: 'save', payload: { content: string; title?: string; type?: string }): void
}>()

const viewMode = ref<'code' | 'preview'>('code')
const codeContent = ref(props.content || '')

const currentTheme = ref<'light-plus' | 'dark-plus'>('light-plus')

const editorEl = ref<HTMLElement | null>(null)
const isEditorReady = ref(false)

const monacoLanguage = computed(() => {
  if (props.type !== 'code') return 'markdown'
  const title = (props.title || '').toLowerCase()
  const m = title.match(/\(([^)]+)\)/)
  return m?.[1] || 'plaintext'
})

const { createEditor, updateCode, setLanguage, setTheme, cleanupEditor } = useMonaco({
  languages: ['javascript', 'python', 'rust', 'shell', 'typescript', 'json', 'markdown'],
  themes: ['light-plus', 'dark-plus'],
  MAX_HEIGHT: 1000000,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  padding: { top: 12, bottom: 12 },
})

const ensureEditor = async () => {
  if (isEditorReady.value) return
  if (!props.isOpen) return
  if (viewMode.value !== 'code') return
  await nextTick()
  if (!editorEl.value) return
  if (!createEditor) return
  await createEditor(editorEl.value, codeContent.value || '', monacoLanguage.value)
  if (setTheme) {
    await setTheme(currentTheme.value, true)
  }
  isEditorReady.value = true
}

const showPreview = async () => {
  viewMode.value = 'preview'
}

const showCode = async () => {
  viewMode.value = 'code'
  // 确保编辑器容器已渲染
  await ensureEditor()
  
  // 关键修复：切换回 code 态时，Monaco 可能因为之前的 display: none 导致状态异常。
  // 这里强制刷新内容并确保 layout 触发。
  await nextTick()
  if (editorEl.value && editorEl.value.childElementCount === 0) {
    cleanupEditor?.()
    isEditorReady.value = false
    await ensureEditor()
    await nextTick()
  }
  if (isEditorReady.value) {
    updateCode?.(codeContent.value, monacoLanguage.value)
    // 触发 layout 以确保内容显示
    // stream-monaco 导出的 monacoApi (即 useMonaco 的返回值) 
    // 并没有直接提供 getEditor，但在 updateCode 内部会调用 layout。
    // 我们再次触发一次 updateCode 配合 nextTick 通常能解决容器显示问题。
    await nextTick()
    updateCode?.(codeContent.value, monacoLanguage.value)
  }
}



const toggleTheme = async () => {
  currentTheme.value = currentTheme.value === 'light-plus' ? 'dark-plus' : 'light-plus'
  if (isEditorReady.value && setTheme) {
    await setTheme(currentTheme.value, true)
  }
}

onMounted(async () => {
  await ensureEditor()
})

onBeforeUnmount(() => {
  cleanupEditor?.()
})

watch(
  () => props.isOpen,
  async (open) => {
    if (!open) {
      cleanupEditor?.()
      isEditorReady.value = false
      return
    }
    await ensureEditor()
    if (isEditorReady.value) {
      updateCode?.(codeContent.value, monacoLanguage.value)
    }
  },
)

watch(viewMode, async (mode) => {
  if (mode === 'code') {
    await showCode()
  }
})

// Watch for changes in prop to update local content
watch(() => props.content, (newVal) => {
  if (newVal !== undefined) {
    codeContent.value = newVal
    if (isEditorReady.value) {
      updateCode?.(codeContent.value, monacoLanguage.value)
    }
  }
}, { immediate: true })

// Watch type change to reset tabs or state
watch(() => props.type, (newType) => {
  if (newType === 'document' || newType === 'table' || newType === 'image' || newType === 'pdf' || newType === 'docx') {
    // For document/table/image/pdf/docx, we default to a "read" view
  } else {
    viewMode.value = 'code'
  }
})

watch(monacoLanguage, async (lang) => {
  if (!isEditorReady.value) return
  setLanguage?.(lang as any)
  if (setTheme) {
    await setTheme(currentTheme.value, true)
  }
  updateCode?.(codeContent.value, lang)
})

const isHtmlPreview = computed(() => {
  const lang = String(monacoLanguage.value || '').toLowerCase()
  return lang === 'html' || lang === 'vue-html' || lang === 'angular-html' || lang === 'html-derivative'
})

const previewSrcdoc = computed(() => {
  if (!isHtmlPreview.value) return ''
  return codeContent.value || ''
})

// Emit changes (optional, if we want two-way binding or save functionality)
const updateContent = (e: Event) => {
  const val = (e.target as HTMLTextAreaElement).value
  codeContent.value = val
  emit('update:content', val)
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(codeContent.value)
    // You might want to emit a notification event here or handle it in parent
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

const saveContent = () => {
  emit('save', {
    content: codeContent.value,
    title: props.title,
    type: props.type,
  })
}

const renderedMarkdown = computed(() => {
  return md.render(codeContent.value)
})

// Table Data Parser (Simple CSV/JSON)
const parsedTableData = computed(() => {
  if (props.type !== 'table') return { columns: [], dataSource: [] }
  
  try {
    // Try JSON first
    const json = JSON.parse(codeContent.value)
    if (Array.isArray(json) && json.length > 0) {
      const keys = Object.keys(json[0])
      const columns = keys.map(key => ({ title: key, dataIndex: key, key }))
      return { columns, dataSource: json }
    }
  } catch (e) {
    // Ignore JSON error, try CSV
  }

  // Simple CSV Parser
  const lines = codeContent.value.trim().split('\n')
  if (lines.length < 1) return { columns: [], dataSource: [] }

  const headers = lines[0].split(',').map(h => h.trim())
  const columns = headers.map((h, i) => ({ title: h, dataIndex: `col${i}`, key: `col${i}` }))
  
  const dataSource = lines.slice(1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim())
    const row: any = { key: idx }
    headers.forEach((_, i) => {
      row[`col${i}`] = values[i] || ''
    })
    return row
  })

  return { columns, dataSource }
})

// DOCX 预览相关
const docxContainerEl = ref<HTMLElement | null>(null)
const docxLoading = ref(false)
const docxError = ref('')

// 渲染 DOCX 文件
const renderDocx = async () => {
  if (props.type !== 'docx' || !props.fileBlob || !docxContainerEl.value) return

  docxLoading.value = true
  docxError.value = ''

  try {
    // 清空容器
    docxContainerEl.value.innerHTML = ''

    // 使用 docx-preview 渲染
    await renderAsync(props.fileBlob, docxContainerEl.value, undefined, {
      className: 'docx-wrapper',
      inWrapper: true,
      ignoreWidth: true,   // 忽略文档原始宽度，自适应容器
      ignoreHeight: true,  // 忽略文档原始高度
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: false,
      trimXmlDeclaration: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
    })
  } catch (err) {
    console.error('DOCX 渲染失败:', err)
    docxError.value = t('chat.voloai.docLoadFailed')
  } finally {
    docxLoading.value = false
  }
}

// 监听 fileBlob 变化，触发渲染
watch(() => [props.fileBlob, props.type, props.isOpen], async ([blob, type, open]) => {
  if (open && type === 'docx' && blob) {
    await nextTick()
    await renderDocx()
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full bg-card border-l border-border shadow-xl artifact-panel transition-all duration-300">
    <!-- 1. Header Logic -->
    <div class="panel-item h-14 border-b border-border flex items-center justify-between px-4 bg-muted/80 backdrop-blur-md shrink-0 z-10">
      
      <!-- Left: Title or Tabs -->
      <div class="flex items-center gap-2 overflow-hidden">
        <!-- Document Mode Title -->
        <template v-if="props.type === 'document'">
           <div class="flex items-center gap-2 text-sm font-semibold text-foreground select-none min-w-0">
              <div class="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                <Search v-if="props.title?.toLowerCase().includes('search')" :size="14" />
                <Sparkles v-else :size="14" />
              </div>
              <span class="truncate max-w-[80%]">{{ props.title || t('chat.artifact.aiWriter') }}</span>
           </div>
        </template>
        
        <!-- Table Mode Title -->
        <template v-else-if="props.type === 'table'">
           <div class="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
              <div class="w-6 h-6 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
                <Table :size="14" />
              </div>
              <span class="truncate">{{ t('chat.artifact.dataTable') }}</span>
           </div>
        </template>

        <!-- Image Mode Title -->
        <template v-else-if="props.type === 'image'">
           <div class="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
              <div class="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                <ImageIcon :size="14" />
              </div>
              <span class="truncate">{{ t('chat.artifact.imagePreview') }}</span>
           </div>
        </template>

        <!-- PDF Mode Title -->
        <template v-else-if="props.type === 'pdf'">
           <div class="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
              <div class="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                <FileText :size="14" />
              </div>
              <span class="truncate">{{ t('chat.artifact.pdfPreview') }}</span>
           </div>
        </template>

        <!-- DOCX Mode Title -->
        <template v-else-if="props.type === 'docx'">
           <div class="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
              <div class="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText :size="14" />
              </div>
              <span class="truncate">{{ t('chat.artifact.docxPreview') }}</span>
           </div>
        </template>

        <!-- Code/Preview Mode Title -->
        <template v-else>
          <div class="flex items-center gap-2 text-sm font-semibold text-foreground select-none">
            <div class="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
              <Code2 :size="14" />
            </div>
            <span class="truncate">{{ props.title || 'Code' }}</span>
          </div>
        </template>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1 shrink-0">
         <template v-if="['document', 'table', 'image', 'pdf', 'docx'].includes(props.type)">
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button v-if="props.type !== 'image' && props.type !== 'pdf'" :aria-label="t('common.button.copy')" class="p-2 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg active:scale-95 transition-all flex items-center gap-1 shrink-0 min-h-11 sm:min-h-0" @click="copyContent">
                    <Copy :size="16" /> <span class="hidden md:inline text-xs font-medium whitespace-nowrap">{{ t('common.button.copy') }}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">{{ t('common.button.copy') }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    v-if="props.type === 'document'"
                    :aria-label="t('common.button.save')"
                    class="p-2 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg active:scale-95 transition-all flex items-center gap-1 shrink-0 min-h-11 sm:min-h-0"
                    @click="saveContent"
                  >
                    <Save :size="16" /> <span class="hidden md:inline text-xs font-medium whitespace-nowrap">{{ t('common.button.save') }}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">{{ t('common.button.save') }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button :aria-label="t('common.button.download')" class="p-2 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg active:scale-95 transition-all flex items-center gap-1 shrink-0 min-h-11 sm:min-h-0">
                    <Download :size="16" /> <span class="hidden md:inline text-xs font-medium whitespace-nowrap">{{ t('common.button.download') }}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">{{ t('common.button.download') }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button :aria-label="t('chat.sider.share')" class="p-2 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg active:scale-95 transition-all flex items-center gap-1 shrink-0 min-h-11 sm:min-h-0">
                    <Share2 :size="16" /> <span class="hidden md:inline text-xs font-medium whitespace-nowrap">{{ t('chat.sider.share') }}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">{{ t('chat.sider.share') }}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div class="w-px h-4 bg-border mx-1"></div>
         </template>

         <template v-else>
           <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
             <Tooltip>
               <TooltipTrigger as-child>
                 <button
                   v-if="viewMode === 'code'"
                   :aria-label="t('chat.artifact.preview')"
                   class="p-2 sm:p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full active:scale-95 transition-all min-h-11 sm:min-h-0"
                   @click="showPreview"
                 >
                   <Eye :size="16" />
                 </button>
                 <button
                   v-else
                   :aria-label="t('chat.artifact.code')"
                   class="p-2 sm:p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full active:scale-95 transition-all min-h-11 sm:min-h-0"
                   @click="showCode"
                 >
                   <Code2 :size="16" />
                 </button>
               </TooltipTrigger>
               <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                 {{ viewMode === 'code' ? t('chat.artifact.preview') : t('chat.artifact.code') }}
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>

           <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
             <Tooltip>
               <TooltipTrigger as-child>
                 <button
                   v-if="props.type === 'code'"
                   :aria-label="currentTheme === 'light-plus' ? t('chat.artifact.darkTheme') : t('chat.artifact.lightTheme')"
                   class="p-2 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full active:scale-95 transition-all min-h-11 sm:min-h-0"
                   @click="toggleTheme"
                 >
                   <Moon v-if="currentTheme === 'light-plus'" :size="16" />
                   <Sun v-else :size="16" />
                 </button>
               </TooltipTrigger>
               <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                 {{ currentTheme === 'light-plus' ? t('chat.artifact.darkTheme') : t('chat.artifact.lightTheme') }}
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>

           <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
             <Tooltip>
               <TooltipTrigger as-child>
                 <button :aria-label="t('common.button.copy')" class="p-2 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full active:scale-95 transition-all min-h-11 sm:min-h-0" @click="copyContent">
                   <Copy :size="16" />
                 </button>
               </TooltipTrigger>
               <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                 {{ t('common.button.copy') }}
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>

           <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
             <Tooltip>
               <TooltipTrigger as-child>
                 <button
                   v-if="props.type === 'code'"
                   :aria-label="t('common.button.save')"
                   class="p-2 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full active:scale-95 transition-all min-h-11 sm:min-h-0"
                   @click="saveContent"
                 >
                   <Save :size="16" />
                 </button>
               </TooltipTrigger>
               <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                 {{ t('common.button.save') }}
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
         </template>

        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('chat.artifact.closePanel')" class="p-2 sm:p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full active:scale-95 transition-all min-h-11 sm:min-h-0" @click="emit('close')">
                <X :size="18" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
              {{ t('chat.artifact.closePanel') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- 2. Content Logic -->
    <div class="panel-item flex-1 overflow-hidden relative bg-card">
      
      <!-- A. Document Mode View -->
      <template v-if="props.type === 'document'">
        <template v-if="props.editable">
          <div class="w-full h-full bg-card flex flex-col">
            <textarea
              class="w-full h-full bg-card text-foreground text-base p-6 md:p-8 resize-none focus:outline-none leading-relaxed"
              :value="codeContent"
              spellcheck="false"
              @input="updateContent"
            ></textarea>
          </div>
        </template>
        <template v-else>
          <div class="w-full h-full overflow-y-auto p-8 md:p-12 scroll-smooth">
             <div class="max-w-3xl mx-auto">
                <!-- Rendered Markdown Content -->
                <div class="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-muted-foreground prose-a:text-blue-600 max-w-none" v-html="renderedMarkdown"></div>

                <!-- Fallback/Empty State -->
                <div v-if="!codeContent" class="text-center text-muted-foreground py-20">
                   <div class="mb-4"><Sparkles :size="48" class="mx-auto opacity-20" /></div>
                   <p>{{ t('chat.artifact.noContentYet') }}</p>
                </div>
             </div>
          </div>
        </template>
      </template>

      <!-- B. Table Mode View -->
      <template v-else-if="props.type === 'table'">
        <div class="w-full h-full overflow-hidden p-6 bg-muted flex flex-col">
           <div class="bg-card rounded-lg shadow-sm border border-border flex-1 overflow-hidden flex flex-col">
              <!-- Table Controls (Optional) -->
              <div class="p-4 border-b border-border flex items-center justify-between">
                <h3 class="font-medium text-foreground">{{ t('chat.artifact.dataPreviewTitle') }}</h3>
                <!-- Simple stats or filter could go here -->
                <span class="text-xs text-muted-foreground">{{ parsedTableData.dataSource.length }} rows</span>
              </div>
              
              <div class="flex-1 overflow-auto">
                 <ATable 
                    :data-source="parsedTableData.dataSource" 
                    :columns="parsedTableData.columns" 
                    :pagination="{ pageSize: 20 }"
                    size="middle"
                 />
              </div>
           </div>
        </div>
      </template>

      <!-- C. Image Mode View -->
      <template v-else-if="props.type === 'image'">
         <div class="w-full h-full bg-muted flex items-center justify-center p-4 relative overflow-hidden">
             <!-- Background Blur -->
             <div class="absolute inset-0 bg-center bg-cover opacity-80 blur-2xl" :style="{ backgroundImage: `url(${codeContent})` }"></div>
             
             <!-- Image Container -->
             <img :src="codeContent" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10" alt="Preview" />
         </div>
      </template>

      <!-- D. PDF Mode View -->
      <template v-else-if="props.type === 'pdf'">
         <div class="w-full h-full bg-muted flex flex-col">
            <iframe :src="codeContent" class="w-full h-full border-none" title="PDF Preview"></iframe>
         </div>
      </template>

      <!-- E. DOCX Mode View -->
      <template v-else-if="props.type === 'docx'">
         <div class="w-full h-full bg-card overflow-auto">
            <div ref="docxContainerEl" class="docx-container w-full min-h-full p-4">
              <div v-if="docxLoading" class="flex items-center justify-center h-64 text-muted-foreground">
                <div class="text-center">
                  <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p class="text-sm">{{ t('chat.artifact.loadingDoc') }}</p>
                </div>
              </div>
              <div v-if="docxError" class="flex items-center justify-center h-64 text-destructive">
                <div class="text-center">
                  <FileText :size="48" class="mx-auto mb-3 opacity-50" />
                  <p class="text-sm">{{ docxError }}</p>
                </div>
              </div>
            </div>
         </div>
      </template>

      <!-- F. Code/Preview Mode View -->
      <template v-else>
        <div class="w-full h-full bg-card overflow-hidden">
          <!-- Preview -->
          <div v-show="viewMode === 'preview'" class="w-full h-full bg-card overflow-hidden">
            <iframe
              v-if="isHtmlPreview"
              class="w-full h-full border-none bg-card"
              :srcdoc="previewSrcdoc"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              title="HTML Preview"
            ></iframe>
            <div v-else class="w-full h-full overflow-y-auto p-6">
              <div class="prose prose-slate max-w-none" v-html="renderedMarkdown"></div>
            </div>
          </div>

          <!-- Code (Editor) -->
          <div v-show="viewMode === 'code'" ref="editorEl" class="artifact-editor w-full h-full"></div>
        </div>
      </template>

    </div>
    
    <!-- 3. Footer (Optional, mostly for Code mode or general feedback) -->
    <div v-if="!['document', 'table', 'image', 'pdf', 'docx'].includes(props.type)" class="panel-item h-10 border-t border-border flex items-center justify-between px-4 bg-card text-xs text-muted-foreground shrink-0">
      <div class="flex items-center gap-2">
        <Sparkles :size="12" />
        <span>Generated by AI</span>
      </div>
      <div class="flex items-center gap-3">
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('chat.artifact.helpful')" class="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all"><ThumbsUp :size="14" /></button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
              {{ t('chat.artifact.helpful') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('chat.artifact.notHelpful')" class="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 transition-all"><ThumbsDown :size="14" /></button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
              {{ t('chat.artifact.notHelpful') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

  </div>
</template>

<style scoped>
.artifact-panel :deep(.artifact-editor) {
  height: 100% !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.artifact-panel :deep(.artifact-editor .monaco-editor),
.artifact-panel :deep(.artifact-editor .overflow-guard),
.artifact-panel :deep(.artifact-editor .monaco-scrollable-element.editor-scrollable) {
  height: 100% !important;
}

/* Custom Scrollbar for the panel */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: var(--border);
  border-radius: 20px;
}
.overflow-y-auto:hover::-webkit-scrollbar-thumb {
  background-color: var(--muted-foreground);
}

/* Typography Overrides if tailwind typography plugin isn't enough */
:deep(.prose h1) {
  margin-bottom: 1.5rem;
  line-height: 1.2;
}
:deep(.prose h2) {
  margin-top: 2rem;
  margin-bottom: 1rem;
}
:deep(.prose p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
}
:deep(.prose pre) {
  background-color: var(--muted);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  border: 1px solid var(--border);
}
:deep(.prose code) {
  color: var(--foreground);
  background-color: var(--muted);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: var(--font-mono);
}
:deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.9em;
}

@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-item {
  opacity: 0;
  animation: slideUpFade 0.5s var(--ease-fluid, cubic-bezier(0.23, 1, 0.32, 1)) forwards;
}

.panel-item:nth-child(1) { animation-delay: 0.1s; }
.panel-item:nth-child(2) { animation-delay: 0.2s; }
.panel-item:nth-child(3) { animation-delay: 0.3s; }

/* DOCX Preview Styles */
.docx-container {
  background: var(--muted);
}

.docx-container :deep(.docx-wrapper) {
  background: var(--muted);
  padding: 1.5rem;
  width: 100% !important;
  max-width: 100% !important;
}

.docx-container :deep(.docx-wrapper > section.docx) {
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.08));
  margin: 0 auto 1.5rem;
  padding: 2.5rem 3rem;
  background: var(--card);
  border-radius: var(--radius-md, 8px);
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box;
}

.docx-container :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.docx-container :deep(td),
.docx-container :deep(th) {
  border: 1px solid var(--border);
  padding: 8px;
}

.docx-container :deep(img) {
  max-width: 100%;
  height: auto;
}

.docx-container :deep(p) {
  margin-bottom: 0.75em;
  line-height: 1.6;
}
</style>




