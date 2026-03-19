<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Eye, Code2, X, Copy, RotateCcw, ThumbsUp, ThumbsDown, Sparkles, Download, Share2, Table, FileText, Image as ImageIcon } from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'

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
  type?: 'code' | 'preview' | 'document' | 'table' | 'image' | 'pdf'
}>(), {
  type: 'code',
  content: ''
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:content', val: string): void
}>()

const activeTab = ref('code') // Default to code for editing
const codeContent = ref(props.content || '')

// Watch for changes in prop to update local content
watch(() => props.content, (newVal) => {
  if (newVal !== undefined) {
    codeContent.value = newVal
  }
}, { immediate: true })

// Watch type change to reset tabs or state
watch(() => props.type, (newType) => {
  if (newType === 'document' || newType === 'table' || newType === 'image' || newType === 'pdf') {
    // For document/table/image/pdf, we default to a "read" view
  } else {
    activeTab.value = 'code'
  }
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
</script>

<template>
  <div class="flex flex-col h-full bg-white border-l border-gray-200 shadow-xl artifact-panel transition-all duration-300">
    
    <!-- 1. Header Logic -->
    <div class="panel-item h-14 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50/80 backdrop-blur-md shrink-0 z-10">
      
      <!-- Left: Title or Tabs -->
      <div class="flex items-center gap-2 overflow-hidden">
        <!-- Document Mode Title -->
        <template v-if="props.type === 'document'">
           <div class="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <div class="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                <Sparkles :size="14" />
              </div>
              <span class="truncate">AI 写作助手</span>
           </div>
        </template>
        
        <!-- Table Mode Title -->
        <template v-else-if="props.type === 'table'">
           <div class="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <div class="w-6 h-6 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
                <Table :size="14" />
              </div>
              <span class="truncate">数据表格</span>
           </div>
        </template>

        <!-- Image Mode Title -->
        <template v-else-if="props.type === 'image'">
           <div class="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <div class="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                <ImageIcon :size="14" />
              </div>
              <span class="truncate">图片预览</span>
           </div>
        </template>

        <!-- PDF Mode Title -->
        <template v-else-if="props.type === 'pdf'">
           <div class="flex items-center gap-2 text-sm font-semibold text-gray-700 select-none">
              <div class="w-6 h-6 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                <FileText :size="14" />
              </div>
              <span class="truncate">PDF 预览</span>
           </div>
        </template>

        <!-- Code/Preview Mode Tabs -->
        <template v-else>
          <div class="flex items-center gap-1 bg-gray-200/50 p-1 rounded-lg">
            <button 
              @click="activeTab = 'preview'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2"
              :class="activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            >
              <Eye :size="12" /> Preview
            </button>
            <button 
              @click="activeTab = 'code'"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2"
              :class="activeTab === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            >
              <Code2 :size="12" /> Code
            </button>
          </div>
        </template>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-1">
         <template v-if="['document', 'table', 'image', 'pdf'].includes(props.type)">
            <button @click="copyContent" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1" title="Copy" v-if="props.type !== 'image' && props.type !== 'pdf'">
              <Copy :size="16" /> <span class="hidden sm:inline text-xs font-medium">复制</span>
            </button>
            <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1" title="Download">
              <Download :size="16" /> <span class="hidden sm:inline text-xs font-medium">下载</span>
            </button>
            <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1" title="Share">
              <Share2 :size="16" /> <span class="hidden sm:inline text-xs font-medium">分享</span>
            </button>
            <div class="w-px h-4 bg-gray-200 mx-1"></div>
         </template>
         
         <template v-else>
            <button @click="copyContent" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" title="Copy">
              <Copy :size="16" />
            </button>
         </template>

        <button @click="emit('close')" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Close">
          <X :size="18" />
        </button>
      </div>
    </div>

    <!-- 2. Content Logic -->
    <div class="panel-item flex-1 overflow-hidden relative bg-white">
      
      <!-- A. Document Mode View -->
      <template v-if="props.type === 'document'">
        <div class="w-full h-full overflow-y-auto p-8 md:p-12 scroll-smooth">
           <div class="max-w-3xl mx-auto">
              <!-- Rendered Markdown Content -->
              <div class="prose prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-gray-600 prose-a:text-blue-600 max-w-none" v-html="renderedMarkdown"></div>
              
              <!-- Fallback/Empty State -->
              <div v-if="!codeContent" class="text-center text-gray-400 py-20">
                 <div class="mb-4"><Sparkles :size="48" class="mx-auto opacity-20" /></div>
                 <p>暂无内容，请在左侧对话中生成文档</p>
              </div>
           </div>
        </div>
      </template>

      <!-- B. Table Mode View -->
      <template v-else-if="props.type === 'table'">
        <div class="w-full h-full overflow-hidden p-6 bg-gray-50 flex flex-col">
           <div class="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
              <!-- Table Controls (Optional) -->
              <div class="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 class="font-medium text-gray-700">数据预览</h3>
                <!-- Simple stats or filter could go here -->
                <span class="text-xs text-gray-400">{{ parsedTableData.dataSource.length }} rows</span>
              </div>
              
              <div class="flex-1 overflow-auto">
                 <a-table 
                    :dataSource="parsedTableData.dataSource" 
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
         <div class="w-full h-full bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
             <!-- Background Blur -->
             <div class="absolute inset-0 bg-center bg-cover opacity-20 blur-xl" :style="{ backgroundImage: `url(${codeContent})` }"></div>
             
             <!-- Image Container -->
             <img :src="codeContent" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl relative z-10" alt="Preview" />
         </div>
      </template>

      <!-- D. PDF Mode View -->
      <template v-else-if="props.type === 'pdf'">
         <div class="w-full h-full bg-gray-100 flex flex-col">
            <iframe :src="codeContent" class="w-full h-full border-none" title="PDF Preview"></iframe>
         </div>
      </template>

      <!-- E. Code/Preview Mode View -->
      <template v-else>
        <!-- Preview Tab -->
        <div v-if="activeTab === 'preview'" class="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
          <div class="bg-white w-full max-w-md shadow-lg rounded-xl overflow-hidden border border-gray-100 transform transition-all hover:scale-[1.02] duration-300">
            <div class="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
              Hello AI
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-2">Split View Demo</h3>
              <p class="text-gray-500 text-sm mb-4">
                这是一个模拟的预览界面。
              </p>
              <div class="flex gap-2">
                <div class="h-2 w-full bg-gray-100 rounded"></div>
                <div class="h-2 w-2/3 bg-gray-100 rounded"></div>
              </div>
              <div class="mt-4 flex justify-end">
                 <button class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">Action</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Code Tab (Editor) -->
        <div v-else class="w-full h-full bg-[#1e1e1e] flex flex-col">
          <textarea 
            class="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
            :value="codeContent"
            @input="updateContent"
            spellcheck="false"
          ></textarea>
        </div>
      </template>

    </div>
    
    <!-- 3. Footer (Optional, mostly for Code mode or general feedback) -->
    <div v-if="!['document', 'table', 'image', 'pdf'].includes(props.type)" class="panel-item h-10 border-t border-gray-100 flex items-center justify-between px-4 bg-white text-xs text-gray-400 shrink-0">
      <div class="flex items-center gap-2">
        <Sparkles :size="12" />
        <span>Generated by AI</span>
      </div>
      <div class="flex items-center gap-3">
        <button class="hover:text-blue-600 transition-colors"><ThumbsUp :size="14" /></button>
        <button class="hover:text-red-500 transition-colors"><ThumbsDown :size="14" /></button>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Custom Scrollbar for the panel */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
}
.overflow-y-auto:hover::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
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
  background-color: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
  border: 1px solid #e2e8f0;
}
:deep(.prose code) {
  color: #0f172a;
  background-color: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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
  animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.panel-item:nth-child(1) { animation-delay: 0.1s; }
.panel-item:nth-child(2) { animation-delay: 0.2s; }
.panel-item:nth-child(3) { animation-delay: 0.3s; }
</style>




