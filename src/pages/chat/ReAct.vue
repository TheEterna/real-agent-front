<!-- 除必要性修改之外（比如 全局session配置支持等），本页面不做改动，不集成最新特性 -->

<script setup lang="ts">
import {ref, onMounted, onUnmounted, nextTick, computed, h, watch} from 'vue'
import { useRoute } from 'vue-router'
import {UIMessage, EventType } from '@/types/events'
import {AgentType} from '@/types/session'
import {useChatStore} from '@/stores/chatStore'
import StatusIndicator from '@/components/StatusIndicator.vue'
import ReActMessageItem from '@/components/ReActMessageItem.vue'
import {useSSE} from '@/composables/useSSE'
import {notification} from 'ant-design-vue'
import {SendOutlined, PaperClipOutlined, FileTextOutlined} from '@ant-design/icons-vue'
import {Attachment} from '@/types/attachment'
import {TemplateItem} from '@/types/template'
import { generateTestPlan, generateSimplePlan } from '@/utils/planTestData'
import StandardWelcome from '@/components/welcome/StandardWelcome.vue'

// 处理建议点击
const handleSuggestionClick = (prompt: string) => {
  inputMessage.value = prompt
  // 聚焦输入框
  nextTick(() => {
    const textarea = document.querySelector('.input-container textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.focus()
    }
  })
}
// Markdown 渲染相关
// @ts-ignore
import MarkdownIt from 'markdown-it'
// @ts-ignore
import hljs from 'highlight.js'
// @ts-ignore
import * as emoji from 'markdown-it-emoji'
// @ts-ignore
import * as taskLists from 'markdown-it-task-lists'
// @ts-ignore
import * as container from 'markdown-it-container'
// @ts-ignore
import * as anchor from 'markdown-it-anchor'
// @ts-ignore
import * as mkatex from 'markdown-it-katex'
// @ts-ignore
import DOMPurify from 'dompurify'
// 样式引入
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'
import '@/styles/themes/theme-react.css'
import {NotificationType} from '@/types/notification'

// 共享状态（会话/Agent 选择）
const chat = useChatStore()
const route = useRoute()
const inputMessage = ref('')
const attachments = ref<Attachment[]>([])

// 附件约束
const MAX_FILES = 4
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_TOTAL_SIZE = 20 * 1024 * 1024 // 20MB
const allowedExts = new Set([
  '.txt', '.md', '.markdown', '.java', '.kt', '.scala', '.py', '.go', '.js', '.mjs', '.cjs', '.ts', '.tsx',
  '.json', '.yml', '.yaml', '.xml', '.html', '.css', '.scss', '.less', '.vue', '.svelte', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.rs', '.php', '.rb', '.swift', '.m', '.mm', '.sql', '.sh', '.bat', '.ps1', '.ini', '.conf', '.log', '.pdf'
])
const isAllowedFile = (f: File) => {
  if (f.type.startsWith('image/')) return true
  if (f.type === 'application/pdf' || f.type === 'text/plain' || f.type === 'application/json' || f.type === 'text/markdown') return true
  const dot = f.name.lastIndexOf('.')
  const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : ''
  return allowedExts.has(ext)
}
const bytes = (n: number) => Math.round(n / 1024)
const totalSize = () => attachments.value.reduce((s, a) => s + a.size, 0)
const pushFilesWithValidation = (files: File[]) => {
  // 数量限制
  if (attachments.value.length + files.length > MAX_FILES) {
    notification.error({message: '超出附件数量上限', description: `最多支持 ${MAX_FILES} 个附件`})
    return
  }
  // 校验每个文件
  let added: Attachment[] = []
  for (const f of files) {
    if (!isAllowedFile(f)) {
      notification.error({message: '不支持的文件类型', description: `${f.name}`})
      continue
    }
    if (f.size > MAX_FILE_SIZE) {
      notification.error({
        message: '文件过大',
        description: `${f.name} 大小 ${bytes(f.size)}KB，单个上限为 ${bytes(MAX_FILE_SIZE)}KB`
      })
      continue
    }
    const after = totalSize() + added.reduce((s, a) => s + a.size, 0) + f.size
    if (after > MAX_TOTAL_SIZE) {
      notification.error({message: '超过总大小限制', description: `当前合计将超过 ${bytes(MAX_TOTAL_SIZE)}KB`})
      continue
    }
    added.push(new Attachment(f.name, f.size, f))
  }
  if (added.length) attachments.value.push(...added)
}
const isLoading = computed(() => taskStatus.value.value === 'running')
const chatContent = ref<HTMLElement>()
const showScrollButton = ref(false)
// 发送可用状态（控制"亮起"）
const canSend = computed(() => inputMessage.value.trim().length > 0 && !isLoading.value)
// 输入区 hover 状态（原子类控制）
const isInputHover = ref(false)

// Ant Design Vue 通知：8s 自动关闭 + 悬停暂停 + 点击定位
const AUTOCLOSE_MS = 8000

// 滚动到底部（供 composable 回调使用）
const scrollToBottom = () => {
  if (!chatContent.value) return
  chatContent.value.scrollTo({top: chatContent.value.scrollHeight, behavior: 'smooth'})
  // 滚动完成后更新按钮显示状态
  setTimeout(() => {
    updateScrollButtonVisibility()
  }, 300)
}

const updateScrollButtonVisibility = () => {
  if (!chatContent.value) return
  const el = chatContent.value
  const threshold = el.clientHeight // 一屏幕高度
  const distance = el.scrollHeight - (el.scrollTop + el.clientHeight)
  showScrollButton.value = distance > threshold
}

// 使用可复用的 SSE 组合式函数（取消自动滚动，仅按钮手动触发）
const handleDoneNotice = (node: {
  text: string;
  startTime: any; // 改为 any 类型，支持字符串、Date等
  title: string;
  messageId?: string,
  type: NotificationType
}) => {
  const safeDate = ensureDate(node.startTime)
  const key = `done-${safeDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`

  const onClick = () => locateByNode(node.messageId)

  const desc = h('div', {style: 'max-width: 280px;'}, [
    h('div', {style: 'margin-top:4px; font-size:12px; color:#888; display:flex; align-items:center; gap:6px;'}, [
      h('span', formatTime(node.startTime)),
      h('span', '·'),
      h('span', {style: 'max-width: 180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'}, node.title || '')
    ])
  ])

  switch (node.type) {
    case NotificationType.SUCCESS:
      notification.success({
        message: node.text,
        description: desc,
        key,
        duration: 8,
        onClick,
      })
      break;
    case NotificationType.ERROR:
      notification.error({
        message: node.text,
        description: desc,
        key,
        duration: 8,
        onClick,
      })
      break;
    case NotificationType.WARNING:
      notification.warning({
        message: node.text,
        description: desc,
        key,
        duration: 8,
        onClick,
      })
      break;
    case NotificationType.INFO:
      notification.info({
        message: node.text,
        description: desc,
        key,
        duration: 8,
        onClick,
      })
      break;
    default:
      notification.info({
        message: node.text,
        description: desc,
        key,
        duration: 8,
        onClick,
      })
      break;
  }
}

const {
  messages,
  taskStatus,
  progress,
  executeReAct
} = useSSE({onDoneNotice: handleDoneNotice})

const locateNotice = (n: { messageId?: string }) => {
  if (n?.messageId && chatContent.value) {
    const target = document.getElementById('msg-' + n.messageId)
    if (target) {
      const container = chatContent.value
      const top = (target as HTMLElement).offsetTop
      container.scrollTo({top: Math.max(0, top - 12), behavior: 'smooth'})
      return
    }
  }
  // 兜底：滚动到底部
  scrollToBottom()
}

const locateByNode = (messageId?: string) => locateNotice({messageId})

onMounted(() => {
  // 初始化时滚到底部并隐藏按钮
  nextTick(() => {
    scrollToBottom()
    showScrollButton.value = false
    // 监听滚动，控制下滑按钮显隐
    chatContent.value?.addEventListener('scroll', updateScrollButtonVisibility)
  })
})

onUnmounted(() => {
  chatContent.value?.removeEventListener('scroll', updateScrollButtonVisibility)
})


// 根据所选 Agent 获取 UI 配置（主题/渲染/交互）
// 会话ID（响应式）
const sessionId = computed(() => route.params.sessionId as string || chat.currentEditingSession.id)

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage: UIMessage = {
    type: EventType.USER,
    sender: '用户',
    message: inputMessage.value,
    startTime: new Date()
  }

  messages.value.push(userMessage)
  const currentMessage = inputMessage.value
  inputMessage.value = ''

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    await executeReAct(currentMessage, sessionId.value)
  } catch (error) {
    console.error('发送消息失败:', error)
    messages.value.push({
      type: EventType.ERROR,
      sender: 'System',
      message: '发送失败: ' + (error as Error).message,
      startTime: new Date()
    })
    // 出错时手动设置任务状态
    taskStatus.value.set('error')
  } finally {
    // 清空已发送的附件
    attachments.value = []
  }
}

// 会话切换：保存旧会话消息并加载新会话消息
// 🔑 数据保证: switchConversation 已确保在更新 sessionId 前完成 fetch
watch(() => route.params.sessionId, (newId, oldId) => {
  if (oldId) {
    // 保存旧会话的运行时消息(包含SSE流式追加的消息)
    chat.setSessionMessages(oldId as string, messages.value)
  }
  // switchConversation 保证fetch完成后才更新sessionId,这里读取的是最新数据
  const id = newId as string || chat.currentEditingSession.id
  const next = chat.getSessionMessages(id)
  messages.value = next && next.length ? [...next] : []
}, { immediate: true })

// 消息变化时，更新当前会话的消息，并触碰更新时间
watch(messages, (val) => {
  chat.setSessionMessages(sessionId.value, val)
  chat.touchSession(sessionId.value)
}, {deep: true})

// 输入区工具栏
const fileInput = ref<HTMLInputElement | null>(null)
const handleUploadClick = () => fileInput.value?.click()
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return
  pushFilesWithValidation(Array.from(files))
  input.value = ''
}
const insertCodeBlock = () => {
  const snippet = '\n```java\npublic class Demo {\n  public static void main(String[] args) {\n    System.out.println("Hello Agent");\n  }\n}\n```\n'
  inputMessage.value += snippet
}

const removeAttachment = (name: string) => {
  attachments.value = attachments.value.filter(a => a.name !== name)
}

const onDropFiles = (e: DragEvent) => {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  pushFilesWithValidation(Array.from(files))
}

const onPressEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return
  e.preventDefault()
  sendMessage()
}
const onPaste = (e: ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return
  const files: File[] = []
  for (const it of items as any) {
    if (it.kind === 'file') {
      const f = it.getAsFile()
      if (f) files.push(f)
    }
  }
  if (files.length) {
    pushFilesWithValidation(files)
  }
}
const templatesOpen = ref(false)
const templates: TemplateItem[] = [
  new TemplateItem('分析并列出问题清单', '请分析以下需求并输出一份可执行的问题清单：\n- 背景：\n- 目标：\n- 约束：\n- 风险：'),
  new TemplateItem('生成单元测试', '为以下代码生成JUnit5单元测试，包含边界与异常用例：\n``java\n// 粘贴代码\n```'),
  new TemplateItem('优化说明文档', '请根据以下变更生成简洁明了的更新说明（变更点/影响范围/回滚方式）：\n- 变更点：\n- 影响范围：\n- 回滚方式：'),
]
const insertTemplate = (t: string) => {
  inputMessage.value = (inputMessage.value ? inputMessage.value + '\n' : '') + t
  templatesOpen.value = false
}

const handleTemplateClick = ({ key }: { key: string }) => {
  const template = templates.find(t => t.label === key)
  if (template) {
    insertTemplate(template.text)
  }
}

// 安全的日期转换函数
const ensureDate = (date: any): Date => {
  if (date instanceof Date) return date
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  }
  return new Date()
}

// 格式化时间
const formatTime = (date: any) => {
  const safeDate = ensureDate(date)
  return safeDate.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}


// 兼容 Vite 对 CommonJS/ESM 插件的导入：有的为 default，有的为命名空间对象
const resolvePlugin = (p: any) => {
  if (!p) return p
  // 优先 default
  const cand = (p as any).default ?? p
  if (typeof cand === 'function') return cand
  // 若仍为对象，尝试在其键里找到函数导出
  for (const key of Object.keys(p)) {
    const v = (p as any)[key]
    if (typeof v === 'function') return v
  }
  return cand
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code: string, lang?: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const out = hljs.highlight(code, {language: lang}).value
        return `<pre class="hljs"><code>${out}</code></pre>`
      } catch {
      }
    }
    const escaped = md.utils.escapeHtml(code)
    return `<pre class="hljs"><code>${escaped}</code></pre>`
  }
})
    .use(resolvePlugin(emoji))
    .use(resolvePlugin(taskLists), {label: true, labelAfter: true})
    .use(resolvePlugin(container), 'info')
    .use(resolvePlugin(container), 'warning')
    .use(resolvePlugin(container), 'success')
    .use(resolvePlugin(anchor))
    .use(resolvePlugin(mkatex))


</script>

<template>
  <div class="chat-container theme-react">
    <!-- 主对话区域（滚动） -->
    <div class="chat-content flex-1 overflow-y-auto relative p-0" ref="chatContent">
      <!-- 状态指示器 -->
      <StatusIndicator :status="taskStatus.value"/>
      <!-- 全局唯一进度显示器 -->
      <div v-if="progress" class="global-progress sticky top-0 z-10 mx-4 mt-2">
        <div class="gp-icon" aria-hidden></div>
        <div class="gp-text">{{ progress.text }}</div>
        <div class="gp-time">{{ formatTime(progress.startTime) }}</div>
      </div>

      <!-- 消息列表加载骨架屏 -->
      <div v-if="chat.isLoadingMessages" class="p-8 space-y-6 max-w-4xl mx-auto">
        <div v-for="i in 3" :key="i" class="flex flex-col gap-3">
           <div class="flex justify-end">
             <a-skeleton active :paragraph="{ rows: 1, width: '30%' }" :title="false" class="w-1/3" />
           </div>
           <div class="flex justify-start">
             <a-skeleton active avatar :paragraph="{ rows: 2, width: '60%' }" :title="false" class="w-2/3" />
           </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="messages-container pb-4">
        <!-- Welcome Screen -->
        <div v-if="messages.length === 0" class="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
          <StandardWelcome @suggestion-click="handleSuggestionClick" />
        </div>

        <div v-else>
          <div v-for="(message, index) in messages" :key="index"
               :id="message.turnId ? message.turnId : (message.messageId ? 'msg-' + message.messageId : undefined)">
            <ReActMessageItem :message="message"/>
          </div>

          <!-- 加载状态 (AI思考中) -->
          <div v-if="isLoading" class="loading-message mx-auto max-w-4xl mt-4">
            <div class="loading-spinner"></div>
            <span>AI正在思考中...</span>
          </div>
        </div>
      </div>

      <!-- 内联一键下滑按钮（非固定，随内容滚动） -->
      <div v-show="showScrollButton" class="scroll-bottom-inline">
        <button class="scroll-bottom-btn" @click="scrollToBottom" title="滚动到底部">
          <span class="icon-arrow-down"></span>
          滚动到底部
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <div class="input-toolbar">
        <a-button size="middle" class="toolbar-btn" @click="handleUploadClick">
          <template #icon>
            <PaperClipOutlined/>
          </template>
          上传
        </a-button>
        <a-button size="middle" class="toolbar-btn" @click="insertCodeBlock">🧩 代码块</a-button>
        <a-dropdown placement="topLeft">
          <a-button size="middle" class="toolbar-btn">🧰 模板</a-button>
          <template #overlay>
            <a-menu @click="handleTemplateClick">
              <a-menu-item v-for="t in templates" :key="t.label">{{ t.label }}</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

      </div>

      <div
          class="input-surface"
          :class="{ 'input-surface--light': canSend, 'input-surface--hover': isInputHover }"
          @dragover.prevent
          @drop="onDropFiles"
          @mouseenter="isInputHover = true"
          @mouseleave="isInputHover = false"
      >
        <!-- 附件预览 -->
        <div v-if="attachments.length" class="attachments">
          <div class="att-chip" v-for="a in attachments" :key="a.name" :title="a.name">
            <FileTextOutlined/>
            <span class="att-name">{{ a.name }}</span>
            <span class="att-size">{{ Math.round(a.size / 1024) }} KB</span>
            <button class="att-remove" @click="removeAttachment(a.name)">✕</button>
          </div>
        </div>

        <div class="input-container">
          <a-textarea
              style="flex: 1;"
              v-model:value="inputMessage"
              :auto-size="{ minRows: 3, maxRows: 10 }"
              :maxlength="4000"
              :show-count="true"
              placeholder="请输入您的问题...（Enter 发送，Shift+Enter 换行，支持拖拽文件、粘贴图片/文本）"
              :disabled="isLoading"
              :bordered="false"
              @pressEnter="onPressEnter"
              @paste="onPaste"
          />
          <a-button
              type="primary"
              :disabled="!canSend"
              :class="['send-btn', { 'send-btn--light': canSend }]"
              @click="sendMessage"
          >
            <template #icon>
              <SendOutlined/>
            </template>
            发送
          </a-button>
          <input
              ref="fileInput"
              type="file"
              style="display:none"
              multiple
              accept=".txt,.md,.markdown,.java,.kt,.scala,.py,.go,.js,.mjs,.cjs,.ts,.tsx,.json,.yml,.yaml,.xml,.html,.css,.scss,.less,.vue,.svelte,.c,.cpp,.h,.hpp,.cs,.rs,.php,.rb,.swift,.m,.mm,.sql,.sh,.bat,.ps1,.ini,.conf,.log,.pdf,image/*"
              @change="onFileChange"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">
/* Page layout */
.chat-container {
  display: flex;
  flex-direction: column;
  padding: 16px;
  flex: 1;
  background: linear-gradient(180deg, #f7f9fc, #f5f5f5);
  position: relative;
  transition: margin-right 0.3s ease;
}

/* 当计划侧边栏显示时，调整主内容区域 */
.chat-container:has(+ .plan-sidebar) {
  margin-right: 380px;
}

@media (max-width: 768px) {
  .chat-container:has(+ .plan-sidebar) {
    margin-right: 0;
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #eceff3;
  box-shadow: 0 6px 24px rgba(15,23,42,0.04);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.agent-tags { display: flex; gap: 0.5rem; }
.tag-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}
.tag-btn:hover { border-color: #007bff; }
.tag-btn.active { background: #007bff; color: white; border-color: #007bff; }
.tag-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.header-right { display: flex; align-items: center; }
.render-mode-selector { display: flex; align-items: center; gap: 0.5rem; }
.render-mode-selector label { font-weight: 500; color: #666; }
.render-mode-selector select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; background: white; }

.chat-content { flex: 1; overflow-y: auto; padding: 0; position: relative; }

/* Three-column layout inside content */
.chat-body {
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  gap: 0;
  height: 100%;
}
.sidebar-left, .sidebar-right { background: #fff; border-right: 1px solid #eceff3; display: flex; flex-direction: column; }
.sidebar-right { border-right: none; border-left: 1px solid #eceff3; }
.chat-center { overflow-y: auto; padding: 1.25rem; }


/* Right sidebar content */
.sr-header { padding: 12px 14px; border-bottom: 1px solid #f0f3f7; }
.sr-section { padding: 12px 14px; border-bottom: 1px solid #f5f7fb; }
.sr-title { font-weight: 600; font-size: 13px; color: #445; margin-bottom: 8px; }
.sr-box { background: #fafbff; border: 1px dashed #e1e6f0; padding: 10px; border-radius: 10px; font-size: 13px; color: #555; }

/* Global progress indicator (sticky chat status) */
.global-progress {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 0 0 10px 0;
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-left: 4px solid #f6c342;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.global-progress .gp-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: spin 1s linear infinite;
}
.global-progress .gp-icon::before { content: '⏳'; }
.global-progress .gp-text { flex: 1; color: #5d4037; white-space: pre-wrap; }
.global-progress .gp-time { font-size: 12px; color: #8d6e63; }

.scroll-bottom-inline { display:flex; justify-content:center; padding: 12px 0 20px; }
.scroll-bottom-btn {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #333;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.scroll-bottom-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); background: #f9fafb; }
.scroll-bottom-btn:active { transform: translateY(0); box-shadow: 0 3px 10px rgba(0,0,0,0.08); }
.icon-arrow-down::before { content: '⬇️'; }

.messages-container { max-width: 960px; margin: 0 auto; }

/* Loading state */
.loading-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Input area */
.chat-input { padding: 0.75rem 1rem; min-width: 1080px; margin: 0 auto; border-top: 1px solid #eceff3; backdrop-filter: blur(4px); }
.input-toolbar {
  max-width: 960px;
  margin: 0.25rem auto 0.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-toggle-btn {
  margin-left: auto; /* 将计划按钮推到右侧 */
}

.dev-test-btn {
  font-size: 11px;
  height: 28px;
  border-color: #faad14;
  color: #faad14;
}

.dev-test-btn:hover {
  border-color: #ffc53d;
  color: #ffc53d;
  background: rgba(255, 197, 61, 0.1);
}
.input-surface { max-width: 960px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; box-shadow: 0 2px 12px rgba(15,23,42,0.06); transition: border-color .18s ease, box-shadow .18s ease, background-color .18s ease; }
.input-surface--hover { border-color: #8cb8ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.08), 0 2px 12px rgba(22,119,255,0.12); }
.input-surface.input-surface--light { border-color: #1677ff; box-shadow: 0 0 0 3px rgba(22,119,255,0.12), 0 4px 16px rgba(22,119,255,0.15); }
.attachments { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
.att-chip { display: inline-flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 999px; border: 1px solid #e6eaf0; background: #f6f9ff; color: #334155; font-size: 12px; }
.att-chip .att-name { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.att-chip .att-size { color: #94a3b8; }
.att-chip .att-remove { margin-left: 2px; border: none; background: transparent; cursor: pointer; color: #94a3b8; line-height: 1; }
.att-chip .att-remove:hover { color: #ef4444; }
.input-container { display: flex; gap: 1rem; margin-bottom: 0.25rem; max-width: 960px; margin-inline: auto; }
.input-container textarea {
  /* flex: 1; */
  padding: 4px;
  /* border: 1px solid #e2e8f0; */
  /* border-radius: 12px; */
  resize: vertical;
  font-family: inherit;
  background: #fff;
  min-height: 54px;
  line-height: 1.5;
}
.send-btn {
  padding: 0.75rem 1.25rem;
  /* 由 antd 按钮接管主色，这里仅处理形状与阴影 */
  background: transparent;
  color: inherit;
  border: none; /* 外观统一交给 antd */
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background .18s ease, box-shadow .18s ease, transform .18s ease;
}
.send-btn--light { box-shadow: 0 4px 14px rgba(22,119,255,0.35); }
.send-btn:hover:not(:disabled) { background: #145ddc; }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.quick-actions { display: flex; gap: 0.5rem; }
.action-btn {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: background 0.3s;
}
.action-btn:hover { background: #e9ecef; }

/* Keep icons here if you want page-level icons; otherwise rely on component-scoped icons */
.icon-send::before { content: '📤'; }
.icon-clear::before { content: '🗑️'; }
.icon-export::before { content: '📥'; }

</style>
