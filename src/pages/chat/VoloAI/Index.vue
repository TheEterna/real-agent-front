<script setup lang="ts">
import {
  ArrowDownOutlined,
  CodeOutlined,
  CopyOutlined,
  EditOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  RedoOutlined,
  SendOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  AppstoreOutlined
} from '@ant-design/icons-vue'
// 分支选择器组件
import {
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageToolbar,
  MessageActions,
  MessageAction
} from '@/components/ai-elements/message'
import { 
  PanelRightOpen, 
  RefreshCcw, 
  PanelRight, 
  Copy, 
  PenLine,
  ArrowDown, 
  Code, 
  FileText, 
  Loader2, 
  Paperclip, 
  Send, 
  Settings, 
  Zap, 
  Bot, 
  Sparkles, 
  User, 
  Plus, 
  Rocket, 
  Brain, 
  Globe, 
  Database,
  Image as ImageIcon, 
  Mic, 
  ChevronDown, 
  UploadCloud, 
  FilePlus, 
  Link,
  Maximize2,
  X
} from 'lucide-vue-next'
import {Attachment} from '@/types/attachment'
import { uploadFile, uploadFiles, getFileUrl, toAttachmentDTO, type AttachmentDTO } from '@/api/file'
import { uploadFileToCos, type UploadProgress, type UploadResult } from '@/utils/cosUploader'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { ProgressInfo } from '@/types/status'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// GSAP动画库
import {gsap} from 'gsap'
// 样式引入
import {NotificationType} from '@/types/notification'
import Terminal from '@/components/terminal/Terminal.vue'
import {useRoute, useRouter, onBeforeRouteLeave} from "vue-router";
import ToolMessage from "@/components/messages/ToolMessage.vue";
import WebSearchToolMessage from "@/components/messages/WebSearchToolMessage.vue";
import KnowledgeRetrievalMessage from "@/components/messages/KnowledgeRetrievalMessage.vue";
import { listKnowledgeBases, type KnowledgeBase } from '@/api/knowledgeBaseAPI'
import {generateSimplePlan, generateTestPlan} from "@/utils/planTestData";
import PlanWidget from '@/components/PlanWidget.vue'
import { PlanQueue } from '@/components/ai-elements/queue'
import CommonMessage from "@/components/messages/CommonMessage.vue";
import UserMessage from "@/components/messages/UserMessage.vue";
import ModelSelector from "@/components/ModelSelector.vue";
import type { LlmConfig } from "@/types/llm";
import ArtifactPanel from './ArtifactPanel.vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useInputPreferences } from '@/composables/useInputPreferences'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 会话ID（响应式）
// 优先使用 useSSE 的 currentSessionId（SSE 连接的会话 ID）
// 其次使用路由参数，最后使用编辑会话 ID
const sessionId = computed(() =>
  currentSessionId.value ||
  route.params.sessionId as string ||
  chat.currentEditingSession.id
)

// Artifact Panel Logic
const isArtifactOpen = ref(false)
const artifactWidth = ref(45) // percent
const artifactExtraWidthPx = ref(0)
const isArtifactResizing = ref(false)
const artifactResizeStartX = ref(0)
const artifactResizeStartExtra = ref(0)

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const artifactPanelStyle = computed(() => {
  const extra = clamp(artifactExtraWidthPx.value, 0, 200)
  return {
    width: `calc(${artifactWidth.value}% + ${extra}px)`,
    minWidth: '320px',
    maxWidth: 'calc(70% + 200px)',
  } as Record<string, string>
})

const onArtifactResizeMove = (e: MouseEvent) => {
  if (!isArtifactResizing.value) return
  const delta = artifactResizeStartX.value - e.clientX
  artifactExtraWidthPx.value = clamp(artifactResizeStartExtra.value + delta, 0, 200)
}

const stopArtifactResize = () => {
  if (!isArtifactResizing.value) return
  isArtifactResizing.value = false
  window.removeEventListener('mousemove', onArtifactResizeMove)
  window.removeEventListener('mouseup', stopArtifactResize)
}

const startArtifactResize = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isArtifactResizing.value = true
  artifactResizeStartX.value = e.clientX
  artifactResizeStartExtra.value = artifactExtraWidthPx.value
  window.addEventListener('mousemove', onArtifactResizeMove)
  window.addEventListener('mouseup', stopArtifactResize)
}

onBeforeUnmount(() => {
  stopArtifactResize()
})
const currentArtifactContent = ref('')
const currentArtifactTitle = ref('')
const currentArtifactType = ref<'code' | 'preview' | 'document' | 'table' | 'image' | 'pdf' | 'docx'>('code')
const currentArtifactFileBlob = ref<Blob | null>(null)  // 用于 docx 预览

const isEditingPromptInArtifact = ref(false)
const isEditingCodeInArtifact = ref(false)

// const toggleArtifact = () => {
//   isArtifactOpen.value = !isArtifactOpen.value
//   if (isArtifactOpen.value) {
//     currentArtifactType.value = 'code'
//   }
// }

const handleTurnDocumentEdit = (turn: Turn) => {
  const content = getAIContentFromTurn(turn)
  if (!content) {
    antMessage.warning(t('chat.voloai.noEditableContent'))
    return
  }
  currentArtifactContent.value = content
  currentArtifactType.value = 'document'
  isArtifactOpen.value = true
}

const handleAttachmentClick = async (attachment: Attachment) => {
  const file = attachment.file
  const name = file.name.toLowerCase()

  // 清空之前的 fileBlob
  currentArtifactFileBlob.value = null

  if (name.endsWith('.csv') || name.endsWith('.json')) {
     const text = await file.text()
     currentArtifactContent.value = text
     currentArtifactType.value = 'table'
     isArtifactOpen.value = true
  } else if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.webp')) {
     const url = URL.createObjectURL(file)
     currentArtifactContent.value = url
     currentArtifactType.value = 'image'
     isArtifactOpen.value = true
  } else if (name.endsWith('.pdf')) {
     const url = URL.createObjectURL(file)
     currentArtifactContent.value = url
     currentArtifactType.value = 'pdf'
     isArtifactOpen.value = true
  } else if (name.endsWith('.docx')) {
     // 使用 docx-preview 渲染 Word 文档
     currentArtifactContent.value = ''
     currentArtifactFileBlob.value = file
     currentArtifactType.value = 'docx'
     isArtifactOpen.value = true
  } else if (name.endsWith('.doc')) {
     // 旧版 .doc 格式不支持，提示下载
     notification.info({
       message: t('chat.voloai.filePreview'),
       description: t('chat.voloai.docOldFormat', { name: file.name }),
       duration: 4
     })
     const url = URL.createObjectURL(file)
     const link = document.createElement('a')
     link.href = url
     link.download = file.name
     document.body.appendChild(link)
     link.click()
     document.body.removeChild(link)
     URL.revokeObjectURL(url)
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.pptx') || name.endsWith('.ppt')) {
     // Office 文档：浏览器无法直接预览，提示下载
     notification.info({
       message: t('chat.voloai.filePreview'),
       description: t('chat.voloai.officeNoPreview', { name: file.name }),
       duration: 4
     })
     const url = URL.createObjectURL(file)
     const link = document.createElement('a')
     link.href = url
     link.download = file.name
     document.body.appendChild(link)
     link.click()
     document.body.removeChild(link)
     URL.revokeObjectURL(url)
  } else if (name.endsWith('.md') || name.endsWith('.txt')) {
     const text = await file.text()
     currentArtifactContent.value = text
     currentArtifactType.value = 'document'
     isArtifactOpen.value = true
  } else {
     // 尝试作为文本文件读取
     try {
       const text = await file.text()
       // 检查是否为有效文本（非乱码）
       const isValidText = /^[\x00-\x7F\u4e00-\u9fa5\u0080-\u00FF\s]*$/.test(text.slice(0, 1000))
       if (isValidText && text.length > 0) {
         currentArtifactContent.value = text
         currentArtifactType.value = 'code'
         isArtifactOpen.value = true
       } else {
         // 二进制文件，提示下载
         notification.info({
           message: t('chat.voloai.filePreview'),
           description: t('chat.voloai.cannotPreviewDesc', { name: file.name }),
           duration: 3
         })
         const url = URL.createObjectURL(file)
         const link = document.createElement('a')
         link.href = url
         link.download = file.name
         document.body.appendChild(link)
         link.click()
         document.body.removeChild(link)
         URL.revokeObjectURL(url)
       }
     } catch {
       // 读取失败，提示下载
       notification.warning({
         message: t('chat.voloai.cannotPreview'),
         description: t('chat.voloai.cannotReadFile', { name: file.name }),
         duration: 3
       })
     }
  }
}

const handleShowArtifact = (payload: { content: string; type: any; title?: string }) => {
  currentArtifactContent.value = payload.content
  currentArtifactTitle.value = payload.title || ''
  currentArtifactType.value = payload.type || 'document'
  isEditingPromptInArtifact.value = false
  isEditingCodeInArtifact.value = false
  isArtifactOpen.value = true
}

const handleCloseArtifact = () => {
  isArtifactOpen.value = false
  isEditingPromptInArtifact.value = false
  isEditingCodeInArtifact.value = false
}

const handlePromptFullscreenEdit = () => {
  currentArtifactContent.value = inputMessage.value
  currentArtifactTitle.value = t('chat.voloai.promptEdit')
  currentArtifactType.value = 'document'
  isEditingPromptInArtifact.value = true
  isEditingCodeInArtifact.value = false
  isArtifactOpen.value = true
}

const handleOpenCodeArtifact = (payload: { code: string; language?: string }) => {
  currentArtifactContent.value = payload.code || ''
  currentArtifactTitle.value = payload.language ? `Code (${payload.language})` : 'Code'
  currentArtifactType.value = 'code'
  isEditingPromptInArtifact.value = false
  isEditingCodeInArtifact.value = true
  isArtifactOpen.value = true
}

import HanWelcome from '@/components/welcome/HanWelcome.vue'
import StandardWelcome from '@/components/welcome/StandardWelcome.vue'
import { AgentType } from '@/types/session'

import {computed, h, nextTick, onMounted, onUnmounted, ref, watch, onBeforeUnmount} from 'vue'
import {InputMode, useModeSwitch} from '@/composables/useModeSwitch'
import {BaseEventItem, EventType, UIMessage} from '@/types/events'
import {useChatStore} from '@/stores/chatStore'
import { createSession } from '@/api/session'
import {generateMessageId, generateTempId} from '@/utils/idGenerator'
import ThinkingMessage from '@/components/messages/ThinkingMessage.vue'
import ReasoningMessage from '@/components/messages/ReasoningMessage.vue'
import ThoughtMessage from '@/components/messages/ThoughtMessage.vue'
import ToolApprovalMessage from '@/components/messages/ToolApprovalMessage.vue'
import InteractionMessage from '@/components/messages/InteractionMessage.vue'
import {useSSE} from '@/composables/useSSE'
import { notification, message as antMessage, Button as AButton, Tooltip as ATooltip, Skeleton, Textarea as ATextarea } from 'ant-design-vue'
import ErrorMessage from '@/components/messages/ErrorMessage.vue'
import UIEventMessage from '@/components/messages/UIMessage.vue'
import { onClickOutside } from '@vueuse/core'

// 处理建议点击
const handleSuggestionClick = (prompt: string) => {
  inputMessage.value = prompt
  // 聚焦输入框
  nextTick(() => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.focus()
      // 可选：自动发送
      // sendMessage()
    }
  })
}

// 判断当前应该显示哪个欢迎页
const currentWelcomeComponent = computed(() => {

    return HanWelcome
})


// 共享状态（会话/Agent 选择）
const chat = useChatStore()

console.log('Current mode:', chat)
const inputMessage = ref('')
const attachments = ref<Attachment[]>([])

const attachmentPreviewUrlMap = new WeakMap<File, string>()
const getAttachmentPreviewUrl = (file: File): string | null => {
  if (!file.type.startsWith('image/')) return null
  const cached = attachmentPreviewUrlMap.get(file)
  if (cached) return cached
  const url = URL.createObjectURL(file)
  attachmentPreviewUrlMap.set(file, url)
  return url
}
const revokeAttachmentPreviewUrl = (file: File) => {
  const url = attachmentPreviewUrlMap.get(file)
  if (url) {
    URL.revokeObjectURL(url)
    attachmentPreviewUrlMap.delete(file)
  }
}
const router = useRouter()
const route = useRoute()

const {
  currentMode,
  currentModeConfig,
  currentThemeClass,
  isGeekMode,
  isMultimodalMode,
  switchMode
} = useModeSwitch()

// 🖥️ 终端界面状态管理
const terminalRef = ref<InstanceType<typeof Terminal>>()
const terminalReady = ref(false)


// 工具审批状态管理
const pendingApprovals = ref<Map<string, any>>(new Map())
const approvalResults = ref<Map<string, any>>(new Map())

// UI状态管理（只检查 taskStatus，避免连接瞬间就禁用输入）
const isLoading = computed(() => taskStatus.value.is('running'))
const chatContent = ref<HTMLElement>()
const showScrollButton = ref(false)


// DOM引用
const appContainer = ref<HTMLElement>()

// 发送可用状态
const canSend = computed(() => inputMessage.value.trim().length > 0 && !isLoading.value)


// 附件约束（参考 OpenWebUI 风格，按类型区分限制）
const MAX_FILES = 5
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB 总限制

// 按文件类型的大小限制
const FILE_SIZE_LIMITS: Record<string, { limit: number; label: string }> = {
  image: { limit: 4 * 1024 * 1024, label: '5MB' },      // 图片: 4MB
  document: { limit: 5 * 1024 * 1024, label: '10MB' }, // Office/PDF: 5MB
  code: { limit: 1024 * 1024, label: '1MB' },       // 代码/文本: 1MB
}

// 文件类型分类
const documentExts = new Set(['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.odt', '.ods', '.odp', '.rtf'])
const codeExts = new Set([
  '.txt', '.md', '.markdown', '.java', '.kt', '.scala', '.py', '.go', '.js', '.mjs', '.cjs', '.ts', '.tsx',
  '.json', '.yml', '.yaml', '.xml', '.html', '.css', '.scss', '.less', '.vue', '.svelte', '.c', '.cpp', '.h', '.hpp',
  '.cs', '.rs', '.php', '.rb', '.swift', '.m', '.mm', '.sql', '.sh', '.bat', '.ps1', '.ini', '.conf', '.log'
])
const allowedExts = new Set([...documentExts, ...codeExts])

// 获取文件类型分类
const getFileCategory = (f: File): 'image' | 'document' | 'code' => {
  if (f.type.startsWith('image/')) return 'image'
  const dot = f.name.lastIndexOf('.')
  const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : ''
  if (documentExts.has(ext)) return 'document'
  return 'code'
}

// 获取文件大小限制
const getFileSizeLimit = (f: File) => FILE_SIZE_LIMITS[getFileCategory(f)]

const isAllowedFile = (f: File) => {
  if (f.type.startsWith('image/')) return true
  // 文档类型 MIME
  const docMimes = new Set([
    'application/pdf', 'text/plain', 'application/json', 'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // XLSX
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/msword',           // DOC
    'application/vnd.ms-excel',     // XLS
    'application/vnd.ms-powerpoint' // PPT
  ])
  if (docMimes.has(f.type)) return true
  const dot = f.name.lastIndexOf('.')
  const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : ''
  return allowedExts.has(ext)
}

const bytes = (n: number) => Math.round(n / 1024)
const totalSize = () => attachments.value.reduce((s, a) => s + a.size, 0)

/**
 * 上传单个文件到 COS（三段式直传）
 */
const uploadAttachmentToCos = async (attachment: Attachment) => {
  attachment.uploadStatus = 'uploading'
  attachment.uploadProgress = 0

  try {
    // COS 文件路径由后端统一管理（ragflow 分片目录），不需要传 sessionId
    const result = await uploadFileToCos(
      attachment.file,
      undefined,
      (progress: UploadProgress) => {
        attachment.uploadProgress = progress.percent
      }
    )

    // 上传成功，更新附件信息
    attachment.uploadStatus = 'success'
    attachment.uploadProgress = 100
    attachment.fileId = result.fileId
    attachment.url = result.url
    attachment.mimeType = result.mimeType
    attachment.category = result.category

    console.log('[COS上传] 成功:', attachment.name, result)
  } catch (error: any) {
    attachment.uploadStatus = 'error'
    attachment.uploadError = error.message || t('chat.voloai.uploadFailed')
    console.error('[COS上传] 失败:', attachment.name, error)
    notification.error({
      message: t('chat.voloai.fileUploadFailed'),
      description: `${attachment.name}: ${attachment.uploadError}`
    })
  }
}

const pushFilesWithValidation = async (files: File[]) => {
  // 数量限制
  if (attachments.value.length + files.length > MAX_FILES) {
    notification.error({message: t('chat.voloai.maxFilesExceeded'), description: t('chat.voloai.maxFilesDesc', { max: MAX_FILES })})
    return
  }
  // 校验每个文件
  const added: Attachment[] = []
  for (const f of files) {
    if (!isAllowedFile(f)) {
      notification.error({message: t('chat.voloai.unsupportedFileType'), description: `${f.name}`})
      continue
    }
    // 按文件类型检查大小限制
    const sizeLimit = getFileSizeLimit(f)
    if (f.size > sizeLimit.limit) {
      const category = getFileCategory(f)
      const categoryLabels: Record<string, string> = { image: t('chat.voloai.categoryImage'), document: t('chat.voloai.categoryDocument'), code: t('chat.voloai.categoryCode') }
      notification.error({
        message: t('chat.voloai.fileTooLarge'),
        description: t('chat.voloai.fileTooLargeDesc', { name: f.name, category: categoryLabels[category], size: bytes(f.size), limit: sizeLimit.label })
      })
      continue
    }
    const after = totalSize() + added.reduce((s, a) => s + a.size, 0) + f.size
    if (after > MAX_TOTAL_SIZE) {
      notification.error({message: t('chat.voloai.totalSizeExceeded'), description: t('chat.voloai.totalSizeExceededDesc', { size: bytes(MAX_TOTAL_SIZE) })})
      continue
    }
    added.push(new Attachment(f.name, f.size, f))
  }

  // 添加到附件列表
  if (added.length) {
    attachments.value.push(...added)

    // 立即触发 COS 直传（并行上传）
    console.log('[附件] 开始 COS 直传:', added.map(a => a.name))
    await Promise.all(added.map(att => uploadAttachmentToCos(att)))
  }
}

// 滚动相关
// 统一的滚动逻辑（优先使用容器滚动）
const AUTO_SCROLL_THRESHOLD = 30
const shouldFollowOutput = ref(true)

const getDistanceToBottom = (): number => {
  const el = chatContent.value
  if (!el) {
    const doc = document.scrollingElement || document.documentElement
    return doc.scrollHeight - (window.scrollY + window.innerHeight)
  }
  return el.scrollHeight - (el.scrollTop + el.clientHeight)
}

const updateFollowOutputState = () => {
  shouldFollowOutput.value = getDistanceToBottom() <= AUTO_SCROLL_THRESHOLD
}

const scrollToBottom = (behavior: ScrollBehavior | Event = 'smooth') => {
  const safeBehavior: ScrollBehavior = typeof behavior === 'string' ? behavior : 'smooth'
  const container = chatContent.value
  if (container) {
    container.scrollTo({ top: container.scrollHeight, behavior: safeBehavior })
  } else {
    const doc = document.scrollingElement || document.documentElement
    window.scrollTo({ top: doc.scrollHeight, behavior: safeBehavior })
  }

  shouldFollowOutput.value = true

  setTimeout(() => {
    updateScrollButtonVisibility()
    updateFollowOutputState()
  }, 300)
}

const scrollToBottomIfFollowing = async () => {
  await nextTick()
  if (!shouldFollowOutput.value) return
  const container = chatContent.value
  if (container) {
    container.scrollTop = container.scrollHeight
  } else {
    const doc = document.scrollingElement || document.documentElement
    window.scrollTo({ top: doc.scrollHeight, behavior: 'auto' })
  }
  updateScrollButtonVisibility()
}

const updateScrollButtonVisibility = () => {
  if (!chatContent.value) {
    // 兜底：检查窗口滚动
    const threshold = window.innerHeight // 一屏幕高度
    const distance = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)
    showScrollButton.value = distance > threshold
    return
  }
  const el = chatContent.value
  const threshold = el.clientHeight // 一屏幕高度
  const distance = el.scrollHeight - (el.scrollTop + el.clientHeight)
  showScrollButton.value = distance > threshold
}

const handleChatScroll = () => {
  updateScrollButtonVisibility()
  updateFollowOutputState()
}

 const ensureDate = (date: any): Date => {
   if (date instanceof Date) return date
   if (typeof date === 'string' || typeof date === 'number') {
     const parsed = new Date(date)
     return isNaN(parsed.getTime()) ? new Date() : parsed
   }
   return new Date()
 }
 
 const formatTime = (date: any) => {
   const safeDate = ensureDate(date)
   return safeDate.toLocaleTimeString('zh-CN', {
     hour: '2-digit',
     minute: '2-digit',
     second: '2-digit'
   })
 }
 
// 增强的通知处理
const handleDoneNotice = (node: {
  text: string;
  startTime: any;
  title: string;
  messageId?: string,
  type: NotificationType
}) => {
  // 任务完成，清理处理状态（progress 已由 useSSE 的 onDone/onCompleted 清空）
  currentProcessingTurnId.value = null

  const safeDate = ensureDate(node.startTime)
  const key = `done-${safeDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`

  const onClick = () => locateByNode(node.messageId)

  const desc = h('div', {class: 'max-w-[280px]'}, [
    h('div', {class: 'mt-1 text-xs text-[var(--muted-foreground)] flex items-center gap-1.5'}, [
      h('span', formatTime(safeDate)),
      h('span', '·'),
      h('span', {class: 'max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap'}, node.title || '')
    ])
  ])

  const notificationConfig = {
    message: node.text,
    description: desc,
    key,
    duration: 5,
    onClick,
    class: 'rounded-lg backdrop-blur-md'
  }

  switch (node.type) {
    case NotificationType.SUCCESS:
      notification.success({...notificationConfig, message: `✅ ${node.text}`})
      break
    case NotificationType.ERROR:
      notification.error({...notificationConfig, message: `❌ ${node.text}`})
      break
    case NotificationType.WARNING:
      notification.success({...notificationConfig, message: `${node.text}`})
      break
    case NotificationType.INFO:
      notification.info({...notificationConfig, message: `ℹ️ ${node.text}`})
      break
    default:
      notification.info({...notificationConfig, message: `🔔 ${node.text}`})
      break
  }
}

// 当前正在处理的 Turn ID（用于限制 progress 只在当前 turn 显示）
// ⚠️ 必须在 useSSE 之前定义，因为 onTurnStarted 回调会引用它
const currentProcessingTurnId = ref<string | null>(null)

// 使用带自定义处理器的 useSSE
const {
  nodeIndex,
  connectionStatus,
  taskStatus,
  progress,
  currentSessionId,
  executeVoloAI,
  resumeVoloAI,
  closeActiveSource
} = useSSE({
  onDoneNotice: handleDoneNotice,
  onTurnStarted: (turnId: string) => {
    // STARTED 事件携带 turnId 时，立即更新 currentProcessingTurnId
    // 这样 progress 可以正确挂载到新 Turn 上
    console.log('[Index] onTurnStarted:', turnId)
    currentProcessingTurnId.value = turnId
  }
})

// 从 store 中获取消息 - 基于当前会话ID计算
const messages = computed(() => {
  const id = sessionId.value
  return chat.getSessionMessages(id)
})

// ⚠️ 架构重构：移除 watch(sessionId) 加载逻辑
// 原因：遵循"谁的数据谁负责"原则，消息加载已收拢到 chatStore
// ChatGateway 通过 setActiveSessionId() 通知 Store，Store 内部 watch 并处理加载
// View 层只通过 messages computed 读取，不主动命令加载

// 监听 sessionId 变化，仅处理 UI 状态（清空 progress），不处理数据加载
watch(sessionId, async (newSessionId, oldSessionId) => {
  // 编辑会话提升（temp→real）时保持 processing 状态，不清空 progress
  const isPromotion = oldSessionId?.startsWith('temp-') && newSessionId && !newSessionId.startsWith('temp-')
  if (isPromotion) {
    console.log('[Index] 编辑会话提升，保持 processing 状态:', oldSessionId, '->', newSessionId)
    return
  }
  // 切换会话时，清空当前正在处理的 Turn ID，避免 progress 显示在新页面
  currentProcessingTurnId.value = null
}, { immediate: false })

// 定义 Turn 结构类型
interface Turn {
  id: string
  parentTurnId?: string  // 父 turn ID，用于编辑时确定分支点
  messages: UIMessage[]
  children: string[]     // 子 turn IDs（用于分支检测）
}

// 定义树节点结构
interface TurnTreeNode extends Turn {
  depth: number          // 在树中的深度
  siblingIndex: number   // 在兄弟节点中的索引
  siblingCount: number   // 兄弟节点总数
}

// ====== 页面布局状态（仅用于空态 + 输入框定位，不影响既有消息/发送逻辑）======
// 当前会话是否正在加载消息
const isLoadingCurrentSession = computed(() =>
  chat.isLoadingMessages && chat.loadingMessagesForSessionId === sessionId.value
)
// 有消息或正在处理时，视为"聊天已开始"（输入框贴底）
const isChatStarted = computed(() => messages.value.length > 0 || !!currentProcessingTurnId.value)
// 纯空态（无消息、不在处理中、且不在加载中）：展示欢迎区 + 输入框居中 + chips
const isEmptyIdle = computed(() =>
  messages.value.length === 0 &&
  !currentProcessingTurnId.value &&
  !isLoadingCurrentSession.value
)

// AI 刷新标记（用于在 STARTED 事件时自动切换到新分支）
const pendingAIRefresh = ref<{ userTurnId: string; timestamp: number } | null>(null)

// 检查某个 turn 是否正在处理（progress 在所有分支间共享）
// 两处使用：
// 1. 位置 A（AI turn header）：!isUserTurn(turn) && isTurnProcessing(turnIndex)
// 2. showBottomProgress computed：检查是否有 AI turn 在显示 progress
const isTurnProcessing = (turnIndex: number): boolean => {
  if (!progress.value?.text) return false
  if (!currentProcessingTurnId.value) return false

  // 'pending'：后端尚未分配 turnId，显示在最后一个 turn
  if (currentProcessingTurnId.value === 'pending') {
    if (turns.value.length === 0) return turnIndex === 0
    return turnIndex === turns.value.length - 1
  }

  // 具体 turnId：精确匹配
  const turn = turns.value[turnIndex]
  if (turn?.id === currentProcessingTurnId.value) return true

  // turnId 在树中尚未建立（STARTED 已到达但首条消息未到达）→ 回退到最后一个 turn
  // 仅对最后一个 turn 做此检查，避免每个 turn 都遍历
  if (turnIndex === turns.value.length - 1) {
    return !turns.value.some(t => t.id === currentProcessingTurnId.value)
  }

  return false
}

// Progress 兜底显示：当有活跃 progress 但没有 AI turn header 在显示时
// 覆盖场景：pending、turnId 已分配但 AI turn 未创建
const showBottomProgress = computed(() => {
  if (!progress.value?.text) return false
  if (!currentProcessingTurnId.value) return false
  // 检查是否已有 AI turn 在显示 progress（位置 A）
  // 如果有，则不需要兜底
  const hasAITurnShowingProgress = turns.value.some(
    (t, i) => !isUserTurn(t) && isTurnProcessing(i)
  )
  return !hasAITurnShowingProgress
})

// ========== 分支管理状态 ==========
// 使用全局的分支选择状态（从 chatStore 获取）
const activeBranchByParent = computed(() => chat.getActiveBranch(sessionId.value))

// 构建 turn 映射和树结构
const turnTree = computed(() => {
  const turnMap = new Map<string, Turn>()
  const childrenMap = new Map<string, string[]>() // parentId -> childIds
  const rootTurnIds: string[] = []

  // 第一遍：构建基础 turn 映射
  messages.value.forEach((message: UIMessage) => {
    const turnId = message.turnId || ``

    if (!turnMap.has(turnId)) {
      turnMap.set(turnId, {
        id: turnId,
        parentTurnId: message.parentTurnId,
        messages: [],
        children: []
      })
    }

    turnMap.get(turnId)!.messages.push(message)
  })

  // 第二遍：建立父子关系
  turnMap.forEach((turn, turnId) => {
    const parentId = turn.parentTurnId
    if (parentId && turnMap.has(parentId)) {
      // 有父节点，添加到父节点的 children
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, [])
      }
      const children = childrenMap.get(parentId)!
      if (!children.includes(turnId)) {
        children.push(turnId)
      }
    } else {
      // 无父节点或父节点不存在，作为根节点
      if (!rootTurnIds.includes(turnId)) {
        rootTurnIds.push(turnId)
      }
    }
  })

  // 更新每个 turn 的 children
  childrenMap.forEach((children, parentId) => {
    const parent = turnMap.get(parentId)
    if (parent) {
      parent.children = children
    }
  })

  return {
    turnMap,
    childrenMap,
    rootTurnIds
  }
})

// 用于根节点分支的特殊 key（必须在 turns computed 之前定义）
const ROOT_BRANCH_KEY = '__ROOT__'

// 计算当前激活路径上的 turns（考虑分支选择）
const turns = computed(() => {
  const { turnMap, childrenMap, rootTurnIds } = turnTree.value
  const result: TurnTreeNode[] = []

  // 递归遍历树，构建激活路径
  const traverse = (turnId: string, depth: number, siblingIndex: number, siblingCount: number, parentKey: string) => {
    const turn = turnMap.get(turnId)
    if (!turn) return

    // 添加当前节点到结果
    result.push({
      ...turn,
      depth,
      siblingIndex,
      siblingCount
    })

    // 获取子节点
    const children = turn.children
    if (children.length > 0) {
      // 获取当前选中的分支索引
      const selectedIndex = activeBranchByParent.value.get(turnId) ?? 0
      const validIndex = Math.min(selectedIndex, children.length - 1)

      // 只遍历选中的分支
      const selectedChildId = children[validIndex]
      if (selectedChildId) {
        traverse(selectedChildId, depth + 1, validIndex, children.length, turnId)
      }
    }
  }

  // 从根节点开始遍历（只遍历选中的根分支）
  if (rootTurnIds.length > 0) {
    const selectedRootIndex = activeBranchByParent.value.get(ROOT_BRANCH_KEY) ?? 0
    const validRootIndex = Math.min(selectedRootIndex, rootTurnIds.length - 1)
    const selectedRootId = rootTurnIds[validRootIndex]

    if (selectedRootId) {
      traverse(selectedRootId, 0, validRootIndex, rootTurnIds.length, ROOT_BRANCH_KEY)
    }
  }

  return result
})

// 检查某个 turn 是否有兄弟分支（用于显示分支选择器）
const hasSiblingBranches = (turn: TurnTreeNode): boolean => {
  const result = turn.siblingCount > 1
  return result
}

// 获取某个 turn 的分支信息（基于兄弟节点）
const getBranchInfo = (turn: TurnTreeNode) => {
  if (turn.siblingCount <= 1) {
    return null
  }

  return {
    total: turn.siblingCount,
    current: turn.siblingIndex + 1, // 1-based for display
    parentTurnId: turn.parentTurnId  // 用于切换分支时定位父节点
  }
}

/**
 * 获取某个 turn 的所有兄弟 turns（包括自己）
 * 用于 MessageBranch 组件渲染多版本内容
 */
const getSiblingTurns = (turn: TurnTreeNode): Turn[] => {
  if (turn.siblingCount <= 1) {
    return [turn]
  }

  let siblingIds: string[]

  if (turn.parentTurnId) {
    const parent = turnTree.value.turnMap.get(turn.parentTurnId)
    siblingIds = parent?.children || [turn.id]
  } else {
    // 根节点的兄弟
    siblingIds = turnTree.value.rootTurnIds
  }

  return siblingIds
    .map(id => turnTree.value.turnMap.get(id))
    .filter((t): t is Turn => !!t)
}

/**
 * 处理 MessageBranch 组件的分支切换事件
 */
const handleBranchChange = (turn: TurnTreeNode, newIndex: number) => {
  const key = turn.parentTurnId ?? ROOT_BRANCH_KEY
  // 使用全局的更新方法
  chat.updateActiveBranch(sessionId.value, key, newIndex)
}

/**
 * 计算当前显示的路径（基于 activeBranchByParent）
 * 🎯 只读计算属性，用于对话树高亮显示
 * ⚠️ 不触发状态更新，避免循环
 */
const currentDisplayPath = computed(() => {
  const path: string[] = []
  const { turnMap, rootTurnIds } = turnTree.value

  // 从根节点开始
  const rootIndex = activeBranchByParent.value.get(ROOT_BRANCH_KEY) ?? 0
  if (rootTurnIds.length === 0) return path

  let currentTurnId = rootTurnIds[Math.min(rootIndex, rootTurnIds.length - 1)]

  // 遍历到叶子节点
  while (currentTurnId) {
    path.push(currentTurnId)
    const turn = turnMap.get(currentTurnId)
    if (!turn || turn.children.length === 0) break

    const childIndex = activeBranchByParent.value.get(currentTurnId) ?? 0
    currentTurnId = turn.children[Math.min(childIndex, turn.children.length - 1)]
  }

  return path
})

// 将 currentDisplayPath 同步到 chatStore（仅用于对话树高亮）
watch(currentDisplayPath, (newPath) => {
  chat.updateDisplayPath(sessionId.value, newPath)
}, { immediate: true })


// 切换到上一个分支
const goToPreviousBranch = (parentTurnId: string | undefined) => {
  const key = parentTurnId ?? ROOT_BRANCH_KEY

  // 获取兄弟节点列表
  let siblings: string[]
  if (parentTurnId) {
    const parent = turnTree.value.turnMap.get(parentTurnId)
    if (!parent || parent.children.length <= 1) return
    siblings = parent.children
  } else {
    // 根节点的情况
    siblings = turnTree.value.rootTurnIds
    if (siblings.length <= 1) return
  }

  const currentIndex = activeBranchByParent.value.get(key) ?? 0
  const newIndex = currentIndex > 0 ? currentIndex - 1 : siblings.length - 1
  // 使用全局的更新方法
  chat.updateActiveBranch(sessionId.value, key, newIndex)
}

// 切换到下一个分支
const goToNextBranch = (parentTurnId: string | undefined) => {
  const key = parentTurnId ?? ROOT_BRANCH_KEY

  // 获取兄弟节点列表
  let siblings: string[]
  if (parentTurnId) {
    const parent = turnTree.value.turnMap.get(parentTurnId)
    if (!parent || parent.children.length <= 1) return
    siblings = parent.children
  } else {
    // 根节点的情况
    siblings = turnTree.value.rootTurnIds
    if (siblings.length <= 1) return
  }

  const currentIndex = activeBranchByParent.value.get(key) ?? 0
  const newIndex = currentIndex < siblings.length - 1 ? currentIndex + 1 : 0
  // 使用全局的更新方法
  chat.updateActiveBranch(sessionId.value, key, newIndex)
}


// UI Event elicitation 提交处理
const handleUIEventSubmit = async (turnId: string, data: Record<string, any>) => {
  try {
    console.log('[UI Event] 提交 elicitation, turnId:', turnId, 'data:', data)
    await resumeVoloAI(turnId, {
      selectedOptionId: 'submit',
      data
    })
  } catch (error: any) {
    console.error('[UI Event] 提交失败:', error)
    notification.error({
      message: t('chat.voloai.submitFailed'),
      description: error?.message || t('chat.voloai.submitRetryHint'),
      duration: 5
    })
  }
}

// 工具审批处理函数
const handleToolApproved = async (approvalId: string, result: any) => {
  try {
    // 从消息中提取 turnId 用于恢复执行
    const allMessages = chat.getSessionMessages(sessionId.value)
    const approvalMessage = allMessages.find(m => m.messageId === approvalId)

    // 优先从 data 中获取 turnId，其次从消息本身获取
    const turnId = approvalMessage?.data?.turnId || approvalMessage?.turnId

    if (!turnId) {
      console.error('[HITL] 无法找到 turnId 用于恢复执行, approvalId:', approvalId)
      notification.error({
        message: t('chat.voloai.resumeFailed'),
        description: t('chat.voloai.resumeNoTaskId'),
        duration: 5
      })
      return
    }

    console.log('[HITL] 调用 resumeVoloAI, turnId:', turnId, 'result:', result)

    // 更新本地状态
    approvalResults.value.set(approvalId, {status: 'approved', result, startTime: new Date()})
    pendingApprovals.value.delete(approvalId)

    notification.success({
      message: t('chat.voloai.toolApproved'),
      description: t('chat.voloai.toolApprovedDesc'),
      duration: 3
    })

    // 调用后端恢复接口
    await resumeVoloAI(turnId, {
      approved: true,
      ...result
    })

  } catch (error: any) {
    console.error('[HITL] 恢复执行失败:', error)
    notification.error({
      message: t('chat.voloai.resumeFailed'),
      description: error?.message || t('chat.voloai.submitRetryHint'),
      duration: 5
    })
  }
}

const handleToolRejected = async (approvalId: string, reason: string) => {
  try {
    // 从消息中提取 turnId
    const allMessages = chat.getSessionMessages(sessionId.value)
    const approvalMessage = allMessages.find(m => m.messageId === approvalId)
    const turnId = approvalMessage?.data?.turnId || approvalMessage?.turnId

    // 更新本地状态
    approvalResults.value.set(approvalId, {status: 'rejected', reason, startTime: new Date()})
    pendingApprovals.value.delete(approvalId)

    notification.warning({
      message: t('chat.voloai.toolRejected'),
      description: reason,
      duration: 3
    })

    // 如果有 turnId，通知后端拒绝
    if (turnId) {
      console.log('[HITL] 调用 resumeVoloAI (rejected), turnId:', turnId)
      await resumeVoloAI(turnId, {
        approved: false,
        rejected: true,
        reason: reason
      })
    }

  } catch (error: any) {
    console.error('[HITL] 拒绝处理失败:', error)
    // 拒绝失败不需要特别提示，因为用户已经看到了拒绝通知
  }
}

const handleToolError = (approvalId: string, error: Error) => {
  approvalResults.value.set(approvalId, {status: 'error', error: error.message, startTime: new Date()})

  notification.error({
    message: t('chat.voloai.toolFailed'),
    description: error.message,
    duration: 5
  })

}


const handleToolTerminateRequested = (approvalId: string, reason: string) => {
  approvalResults.value.set(approvalId, {status: 'terminated', reason, startTime: new Date()})
  pendingApprovals.value.delete(approvalId)

  notification.warning({
    message: t('chat.voloai.conversationTerminated'),
    description: reason,
    duration: 6
  })

  // 终止当前任务和连接
  if (taskStatus.value.is('running')) {
    taskStatus.value.set('completed')
  }
  connectionStatus.value.set('disconnected')

  // 添加系统消息通知用户对话已终止（通过 store，不能直接 push computed 副本）
  const terminateMsg: UIMessage = {
    messageId: generateMessageId(),
    type: EventType.SYSTEM,
    sender: 'System',
    message: t('chat.voloai.terminatedMessage', { reason }),
    startTime: new Date()
  }
  const currentMsgs = chat.getSessionMessages(sessionId.value)
  currentMsgs.push(terminateMsg)
  chat.setSessionMessages(sessionId.value, currentMsgs)

  // 滚动到底部显示终止消息
  nextTick(() => {
    scrollToBottom()
  })
}


const handleErrorRetry = async (errorMessage: UIMessage) => {
  const turnId = errorMessage.turnId

  // 无 turnId 时（首次会话连接失败），尝试用保存的原始消息重新发送
  if (!turnId) {
    const originalMessage = (errorMessage.meta as any)?.originalMessage
    if (originalMessage) {
      // 移除错误消息
      const msgs = chat.getSessionMessages(sessionId.value)
      const filtered = msgs.filter(m => m.messageId !== errorMessage.messageId)
      chat.setSessionMessages(sessionId.value, filtered)
      // 恢复输入框内容，让用户可以直接重新发送
      inputMessage.value = originalMessage
      taskStatus.value.set('idle')
      notification.info({ message: t('chat.voloai.restoredMessage'), duration: 3 })
    } else {
      notification.info({ message: t('chat.voloai.retryInputHint'), duration: 3 })
      taskStatus.value.set('idle')
    }
    return
  }

  // 有 turnId 时，从错误节点继续（resumeVoloAI）
  // 1. 移除错误消息
  const messages = chat.getSessionMessages(sessionId.value)
  const filtered = messages.filter(m => m.messageId !== errorMessage.messageId)
  chat.setSessionMessages(sessionId.value, filtered)

  // 2. 重置状态
  taskStatus.value.set('running')
  progress.value = new ProgressInfo(t('chat.voloai.retrying'), new Date(), 'Han')

  // 3. 调用 resumeVoloAI 从错误节点继续
  try {
    await resumeVoloAI(turnId)
  } catch (error) {
    console.error('重试失败:', error)
    const retryErrorMessage: UIMessage = {
      messageId: generateMessageId(),
      type: EventType.ERROR,
      sender: 'System',
      message: (error as Error)?.message || t('chat.voloai.retryFailed'),
      turnId: turnId,
      startTime: new Date()
    }
    const currentMessages = chat.getSessionMessages(sessionId.value)
    currentMessages.push(retryErrorMessage)
    chat.setSessionMessages(sessionId.value, currentMessages)
    taskStatus.value.set('error')
    progress.value = null
  }
}

const locateByNode = (messageId?: string) => {
  if (messageId && chatContent.value) {
    const target = document.getElementById('msg-' + messageId)
    if (target) {
      const container = chatContent.value
      const top = (target as HTMLElement).offsetTop
      container.scrollTo({top: Math.max(0, top - 12), behavior: 'smooth'})
      return
    }
  }
  scrollToBottom()
}

// 监听消息变化，自动切换到新 AI 分支（AI 刷新场景）
watch(() => [messages.value.length, pendingAIRefresh.value], async ([newLength], [oldLength]) => {
  if (!pendingAIRefresh.value) return

  // 等待 DOM 更新
  await nextTick()
  
  const { userTurnId, timestamp } = pendingAIRefresh.value
  
  // 检查是否有新的 ASSISTANT turn 且 parentTurnId 指向 userTurnId
  const newAssistantTurn = messages.value.find(msg => {
    // 基本条件检查
    if (msg.type === EventType.USER) return false
    if (msg.parentTurnId !== userTurnId) return false
    
    // 时间检查（兼容 Date 对象和字符串）
    if (!msg.startTime) return false
    const msgTime = msg.startTime instanceof Date ? msg.startTime.getTime() : new Date(msg.startTime).getTime()
    return msgTime >= timestamp
  })
  
  if (newAssistantTurn && newAssistantTurn.turnId) {
    console.log('[AI 刷新] 检测到新 ASSISTANT turn，自动切换分支:', newAssistantTurn.turnId)
    
    // 等待树更新
    await nextTick()
    
    // 获取 userTurn 的所有子节点
    const parent = turnTree.value.turnMap.get(userTurnId)
    const siblings = parent?.children || []
    
    // 找到新 turn 的索引
    const newTurnIndex = siblings.indexOf(newAssistantTurn.turnId)
    
    if (newTurnIndex >= 0) {
      activeBranchByParent.value.set(userTurnId, newTurnIndex)
      console.log('[AI 刷新] 已切换到新消息分支:', userTurnId, '索引:', newTurnIndex)
      
      // 滚动到底部
      await nextTick()
      scrollToBottom()
    }
    
    // 清除标记
    pendingAIRefresh.value = null
  }
})

//  sending消息
const sendMessage = async () => {
  if (isLoading.value || !canSend.value) return

  // 获取当前激活路径上最后一个 turn 的 ID 作为 parentTurnId
  // 这样新消息会接在当前对话分支的末尾
  const lastTurn = turns.value.length > 0 ? turns.value[turns.value.length - 1] : null
  const parentTurnId = lastTurn?.id

  // 获取当前选中的模型 ID
  const currentModelId = chat.getSessionModelId(sessionId.value)

  // 生成消息 ID
  const messageId = generateMessageId()

  // 生成临时的 turnId，确保用户消息能立即在界面上正确显示
  // 后端返回真正的 turnId 后会通过 tryUpdateUserMessageTurnId 更新
  const tempTurnId = `temp-turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const userMessage: UIMessage = {
    messageId: messageId,
    turnId: tempTurnId,  // 使用临时 turnId，立即显示在界面上
    type: EventType.USER,
    sender: '用户',
    message: inputMessage.value,
    parentTurnId: parentTurnId,
    startTime: new Date()
  }

  // 直接写入 store
  const currentMessages = chat.getSessionMessages(sessionId.value)
  currentMessages.push(userMessage)
  chat.setSessionMessages(sessionId.value, currentMessages)

  const currentMessage = inputMessage.value
  inputMessage.value = ''

  // 立即设置 loading 和 progress 状态（请求发送前就显示）
  taskStatus.value.set('running')  // 立即显示 loading 效果
  progress.value = new ProgressInfo(t('chat.voloai.sendingMessage'), new Date(), 'Han')
  // 标记当前正在处理的是新 turn（暂时使用 'pending' 表示等待后端分配）
  currentProcessingTurnId.value = 'pending'

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // Phase 2: 发送前预创建会话（消除 temp→real 转换）
    let backendSessionId = sessionId.value
    if (sessionId.value.startsWith('temp-')) {
      try {
        const sessionTitle = currentMessage.slice(0, 50).trim() || '新对话'
        const res = await createSession('voloai', sessionTitle)
        if (res.code === 200 && res.data?.id) {
          const realSessionId = res.data.id
          console.log('[sendMessage] 预创建会话成功:', realSessionId)

          // 提升编辑会话为真实会话
          chat.promoteEditingSession(realSessionId, AgentType.VoloAI, res.data.title || sessionTitle)

          // 仅更新浏览器 URL，不走 Vue Router 导航（避免触发路由守卫关闭 SSE）
          // currentSessionId.value 已保证 sessionId computed 指向 realSessionId
          window.history.replaceState(history.state, '', `/chat/${realSessionId}`)

          // 使用真实会话 ID 发送 SSE
          backendSessionId = realSessionId
        } else {
          console.warn('[sendMessage] 预创建会话失败，回退到空 sessionId:', res)
          backendSessionId = ''
        }
      } catch (e) {
        console.warn('[sendMessage] 预创建会话异常，回退到空 sessionId:', e)
        backendSessionId = ''
      }
    }

    // 设置当前会话ID到 useSSE
    currentSessionId.value = backendSessionId || sessionId.value

    // 处理附件：使用已上传的附件信息（COS 直传模式）
    let uploadedAttachments: AttachmentDTO[] | undefined
    if (attachments.value.length > 0) {
      // 检查是否所有附件都已上传成功
      const pendingOrUploading = attachments.value.filter(a => a.uploadStatus === 'pending' || a.uploadStatus === 'uploading')
      if (pendingOrUploading.length > 0) {
        progress.value = new ProgressInfo(t('chat.voloai.waitingUpload'), new Date(), 'Han')
        // 等待所有附件上传完成（30s 超时）
        const UPLOAD_TIMEOUT = 30000
        await Promise.all(pendingOrUploading.map(att => {
          return new Promise<void>((resolve) => {
            const startTime = Date.now()
            const checkInterval = setInterval(() => {
              if (att.uploadStatus === 'success' || att.uploadStatus === 'error') {
                clearInterval(checkInterval)
                resolve()
              } else if (Date.now() - startTime > UPLOAD_TIMEOUT) {
                clearInterval(checkInterval)
                att.uploadStatus = 'error'
                att.uploadError = t('chat.voloai.uploadTimeout')
                resolve()
              }
            }, 100)
          })
        }))
      }

      // 过滤出上传成功的附件
      const successAttachments = attachments.value.filter(a => a.uploadStatus === 'success' && a.fileId)
      if (successAttachments.length > 0) {
        uploadedAttachments = successAttachments.map(a => ({
          fileId: a.fileId!,
          fileName: a.name,
          mimeType: a.mimeType || a.file.type,
          size: a.size,
          category: a.category || 'document',
          url: a.url  // 传递 COS 公开 URL
        }))
        console.log('[sendMessage] 使用已上传的附件:', uploadedAttachments)
      }

      // 提示上传失败的附件
      const failedAttachments = attachments.value.filter(a => a.uploadStatus === 'error')
      if (failedAttachments.length > 0) {
        notification.warning({
          message: t('chat.voloai.partialUploadFailed'),
          description: t('chat.voloai.partialUploadDesc', { names: failedAttachments.map(a => a.name).join(', ') }),
          duration: 3
        })
      }

      progress.value = new ProgressInfo(t('chat.voloai.sendingMessage'), new Date(), 'Han')
    }

    // 获取当前执行模式
    const executionMode = currentUiMode.value.executionMode

    const config = modeConfigs.value[currentUiMode.value.id] || { useWebSearch: false, useKnowledgeBase: false, useMemoryEnhancement: false }

    await executeVoloAI(currentMessage, backendSessionId, parentTurnId, currentModelId, uploadedAttachments, executionMode,
      config.useWebSearch,
      config.useKnowledgeBase,
      config.useMemoryEnhancement,
      config.useKnowledgeBase ? chat.selectedKnowledgeBaseIds : undefined)
  } catch (error) {
    console.error('发送消息失败:', error)
    const errorMessage: UIMessage = {
      messageId: generateMessageId(),
      type: EventType.ERROR,
      sender: 'System',
      message: (error as Error)?.message || t('chat.voloai.sendFailed'),
      startTime: new Date(),
      // 保存原始输入，handleErrorRetry 可以用它重新发送
      meta: { originalMessage: currentMessage }
    }
    const currentMessages = chat.getSessionMessages(sessionId.value)
    currentMessages.push(errorMessage)
    chat.setSessionMessages(sessionId.value, currentMessages)
    taskStatus.value.set('error')
    currentProcessingTurnId.value = null
    progress.value = null
  }
  // 仅在成功发出请求后清空附件（错误时保留，方便重试）
  if (!taskStatus.value.is('error')) {
    attachments.value = []
  }
}

// ========== Turn 级别操作状态 ==========
const editingTurnId = ref<string | null>(null)  // 当前正在编辑的 Turn ID
const editingContent = ref('')                   // 编辑中的内容

/**
 * 判断 Turn 是否为用户 Turn（第一条消息是 USER 类型）
 */
const isUserTurn = (turn: Turn) => {
  return turn.messages.length > 0 && turn.messages[0].type === EventType.USER
}

/**
 * 获取 Turn 中用户消息的内容（用于编辑和复制）
 */
const getUserMessageFromTurn = (turn: Turn): string => {
  const userMsg = turn.messages.find(m => m.type === EventType.USER)
  return userMsg?.message || ''
}

/**
 * 获取 Turn 中所有 AI 消息的内容（用于复制）
 */
const getAIContentFromTurn = (turn: Turn): string => {
  return turn.messages
    .filter(m => m.type === EventType.ASSISTANT || m.type === EventType.ACTING)
    .map(m => m.message || '')
    .join('\n\n')
}

/**
 * 获取 Turn 的显示时间（取第一条消息的 startTime）
 */
const getTurnDisplayTime = (turn: Turn): Date => {
  const firstMsg = turn.messages[0]
  if (!firstMsg?.startTime) return new Date()
  return firstMsg.startTime instanceof Date ? firstMsg.startTime : new Date(firstMsg.startTime)
}

/**
 * 复制 Turn 内容到剪贴板
 */
const handleTurnCopy = async (turn: Turn) => {
  try {
    let content: string
    if (isUserTurn(turn)) {
      content = getUserMessageFromTurn(turn)
    } else {
      content = getAIContentFromTurn(turn)
    }

    if (!content) {
      antMessage.warning(t('chat.voloai.noCopyContent'))
      return
    }

    await navigator.clipboard.writeText(content)
    antMessage.success(t('common.message.copySuccess'))
  } catch (error) {
    antMessage.error(t('common.message.copyFailed'))
  }
}

/**
 * 进入 Turn 编辑模式（仅适用于用户 Turn）
 */
const handleTurnEditStart = (turn: Turn) => {
  if (!isUserTurn(turn)) return

  editingTurnId.value = turn.id
  editingContent.value = getUserMessageFromTurn(turn)
}

/**
 * 取消编辑
 */
const handleTurnEditCancel = () => {
  editingTurnId.value = null
  editingContent.value = ''
}

/**
 * 确认编辑并发送（用户 Turn 编辑后重新发送）
 * @param turn 被编辑的 Turn
 */
const handleTurnEditConfirm = async (turn: Turn) => {
  if (!editingContent.value.trim() || isLoading.value) {
    antMessage.warning(t('chat.voloai.editEmptyError'))
    return
  }

  // 调试日志
  console.log('[编辑确认] turn:', turn)
  console.log('[编辑确认] turn.id:', turn.id)
  console.log('[编辑确认] turn.parentTurnId:', turn.parentTurnId)

  // 立即退出编辑模式，避免 UI 卡住
  const contentToSend = editingContent.value.trim()
  const parentTurnIdToUse = turn.parentTurnId
  editingTurnId.value = null
  editingContent.value = ''

  // === 关键修改：先创建新的 USER turn 并添加到消息列表 ===
  // 生成新的消息 ID
  const messageId = generateMessageId()

  // 生成临时的 turnId，确保用户消息能立即在界面上正确显示
  // 后端返回真正的 turnId 后会通过 tryUpdateUserMessageTurnId 更新
  const tempTurnId = `temp-turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const userMessage: UIMessage = {
    messageId: messageId,
    turnId: tempTurnId,  // 使用临时 turnId，确保消息在对话树中可见
    type: EventType.USER,
    sender: '用户',
    message: contentToSend,
    parentTurnId: parentTurnIdToUse,  // 使用被编辑 Turn 的 parentTurnId
    startTime: new Date()
  }

  // 直接写入 store，触发树的更新
  const currentMessages = chat.getSessionMessages(sessionId.value)
  currentMessages.push(userMessage)
  chat.setSessionMessages(sessionId.value, currentMessages)
  console.log('[编辑确认] 已添加新 USER 消息到 store:', userMessage)

  // === 关键：自动切换到新分支（最后一个兄弟节点） ===
  // 等待下一帧，确保 turnTree 已更新
  await nextTick()
  
  // 获取新 USER turn 的父节点 key
  const branchKey = parentTurnIdToUse ?? ROOT_BRANCH_KEY
  
  // 获取该父节点的所有子节点
  let siblings: string[]
  if (parentTurnIdToUse) {
    const parent = turnTree.value.turnMap.get(parentTurnIdToUse)
    siblings = parent?.children || []
  } else {
    siblings = turnTree.value.rootTurnIds
  }
  
  // 切换到最后一个分支（新创建的分支）
  if (siblings.length > 0) {
    const lastIndex = siblings.length - 1
    activeBranchByParent.value.set(branchKey, lastIndex)
    console.log('[编辑确认] 自动切换到新分支:', branchKey, '索引:', lastIndex)
  }

  // 立即设置 loading 和 progress 状态
  taskStatus.value.set('running')  // 立即显示 loading 效果
  progress.value = new ProgressInfo(t('chat.voloai.sendingMessage'), new Date(), 'Han')
  currentProcessingTurnId.value = 'pending'

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // Phase 2: 发送前预创建会话（消除 temp→real 转换）
    let backendSessionId = sessionId.value
    if (sessionId.value.startsWith('temp-')) {
      try {
        const editTitle = contentToSend.slice(0, 50).trim() || '新对话'
        const res = await createSession('voloai', editTitle)
        if (res.code === 200 && res.data?.id) {
          const realSessionId = res.data.id
          console.log('[编辑确认] 预创建会话成功:', realSessionId)
          chat.promoteEditingSession(realSessionId, AgentType.VoloAI, res.data.title || editTitle)
          window.history.replaceState(history.state, '', `/chat/${realSessionId}`)
          backendSessionId = realSessionId
        } else {
          console.warn('[编辑确认] 预创建会话失败，回退到空 sessionId:', res)
          backendSessionId = ''
        }
      } catch (e) {
        console.warn('[编辑确认] 预创建会话异常，回退到空 sessionId:', e)
        backendSessionId = ''
      }
    }

    // 设置当前会话ID
    currentSessionId.value = backendSessionId || sessionId.value
    const currentModelId = chat.getSessionModelId(sessionId.value)

    console.log('[编辑确认] 调用 executeVoloAI:', {
      content: contentToSend,
      backendSessionId,
      parentTurnId: parentTurnIdToUse
    })

    // 获取当前执行模式
    const executionMode = currentUiMode.value.executionMode

    const config = modeConfigs.value[currentUiMode.value.id] || { useWebSearch: false, useKnowledgeBase: false, useMemoryEnhancement: false }

    // 使用被编辑 Turn 的 parentTurnId，从上一轮对话分叉创建新分支
    // 例如：编辑 Turn 3 (USER)，则新分支从 Turn 2 (ASSISTANT) 之后分叉
    await executeVoloAI(contentToSend, backendSessionId, parentTurnIdToUse, currentModelId, undefined, executionMode,
      config.useWebSearch,
      config.useKnowledgeBase,
      config.useMemoryEnhancement,
      config.useKnowledgeBase ? chat.selectedKnowledgeBaseIds : undefined)

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('编辑消息失败:', error)
    notification.error({
      message: t('chat.voloai.editFailed'),
      description: t('chat.voloai.editFailedDesc', { error: (error as Error).message }),
      duration: 5
    })
    taskStatus.value.set('error')
    currentProcessingTurnId.value = null
    progress.value = null
  }
  // ⚠️ 修复：移除 finally 块，状态清理由 SSE 事件触发
}


/**
 * 重新生成 AI Turn（找到对应的用户消息，使用相同内容重新生成）
 */
const handleTurnRegenerate = async (turn: Turn, turnIndex: number) => {
  if (isUserTurn(turn) || isLoading.value) return

  // 向前查找最近的用户 Turn
  let userTurn: Turn | null = null
  for (let i = turnIndex - 1; i >= 0; i--) {
    if (isUserTurn(turns.value[i])) {
      userTurn = turns.value[i]
      break
    }
  }

  if (!userTurn) {
    notification.warning({
      message: t('chat.voloai.regenFailed'),
      description: t('chat.voloai.regenNoUserMsg'),
      duration: 3
    })
    return
  }

  // 获取用户消息内容
  const userContent = getUserMessageFromTurn(userTurn)
  if (!userContent) {
    notification.warning({
      message: t('chat.voloai.regenFailed'),
      description: t('chat.voloai.regenEmptyUserMsg'),
      duration: 3
    })
    return
  }

  console.log('[重新生成] AI 刷新场景，parentTurnId:', userTurn.id, '用户消息:', userContent)

  // 立即设置 loading 和 progress 状态
  taskStatus.value.set('running')  // 立即显示 loading 效果
  progress.value = new ProgressInfo(t('chat.voloai.sendingMessage'), new Date(), 'Han')
  currentProcessingTurnId.value = 'pending'
  
  // 标记当前是 AI 刷新操作（用于后端返回时自动切换分支）
  pendingAIRefresh.value = {
    userTurnId: userTurn.id,
    timestamp: Date.now()
  }

  try {
    // Phase 2: 发送前预创建会话（消除 temp→real 转换）
    let backendSessionId = sessionId.value
    if (sessionId.value.startsWith('temp-')) {
      try {
        const regenTitle = userContent.slice(0, 50).trim() || '新对话'
        const res = await createSession('voloai', regenTitle)
        if (res.code === 200 && res.data?.id) {
          const realSessionId = res.data.id
          console.log('[重新生成] 预创建会话成功:', realSessionId)
          chat.promoteEditingSession(realSessionId, AgentType.VoloAI, res.data.title || regenTitle)
          window.history.replaceState(history.state, '', `/chat/${realSessionId}`)
          backendSessionId = realSessionId
        } else {
          console.warn('[重新生成] 预创建会话失败，回退到空 sessionId:', res)
          backendSessionId = ''
        }
      } catch (e) {
        console.warn('[重新生成] 预创建会话异常，回退到空 sessionId:', e)
        backendSessionId = ''
      }
    }

    currentSessionId.value = backendSessionId || sessionId.value
    const currentModelId = chat.getSessionModelId(sessionId.value)

    // 获取当前执行模式
    const executionMode = currentUiMode.value.executionMode

    const config = modeConfigs.value[currentUiMode.value.id] || { useWebSearch: false, useKnowledgeBase: false, useMemoryEnhancement: false }

    // 使用用户 Turn 的 ID 作为 parentTurnId，实现分支重新生成
    await executeVoloAI(userContent, backendSessionId, userTurn.id, currentModelId, undefined, executionMode,
      config.useWebSearch,
      config.useKnowledgeBase,
      config.useMemoryEnhancement,
      config.useKnowledgeBase ? chat.selectedKnowledgeBaseIds : undefined)

    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('重新生成失败:', error)

    notification.error({
      message: t('chat.voloai.editFailed'),
      description: t('chat.voloai.regenFailedDesc', { error: (error as Error).message }),
      duration: 5
    })
    taskStatus.value.set('error')
    currentProcessingTurnId.value = null
    pendingAIRefresh.value = null
    progress.value = null
  }
}

// 根据当前路由设置模式状态
const syncModeFromRoute = () => {
  const path = route.path
  const queryMode = route.query.mode as InputMode

  // 优先使用 URL 查询参数中的模式
  if (queryMode && ['geek', 'multimodal', 'command'].includes(queryMode)) {
    currentMode.value = queryMode
    return
  }

  // fixme 根据路径推断模式
  if (path === '/chat/geek') {
    currentMode.value = 'geek'
  } else if (path === '/chat') {
    currentMode.value = 'multimodal'
  } else {
    currentMode.value = 'multimodal' // 默认
  }
}

// 监听路由变化同步模式
watch(route, () => {
  syncModeFromRoute()
}, {immediate: true})


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
  const snippet = '\n``javascript\n// 请输入代码\nconsole.log("Hello VoloAI");\n```\n'
  inputMessage.value += snippet
}

const removeAttachment = (att: Attachment) => {
  revokeAttachmentPreviewUrl(att.file)
  attachments.value = attachments.value.filter(a => a !== att)
}

// 模型选择相关处理函数
const handleModelChange = (modelId: string) => {
  chat.setSelectedModel(modelId)
}

const handleModelSelect = (model: LlmConfig) => {
  console.log('[模型选择] 已选择模型:', model.displayName, model.id)
  chat.setSelectedModel(model.id)
}

const onDropFiles = (e: DragEvent) => {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  pushFilesWithValidation(Array.from(files))
}

const { preferences: inputPreferences } = useInputPreferences()

const onPressEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) return

  if (inputPreferences.value.requireCommandEnterToSubmit && !(e.metaKey || e.ctrlKey)) {
    return
  }

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

// NEW UI LOGIC
const uiModes = computed(() => [
  { id: 'auto', label: t('chat.voloai.modeAuto'), icon: Rocket, desc: t('chat.voloai.modeAutoDesc'), value: 'multimodal', executionMode: 'auto' },
  { id: 'fast', label: t('chat.voloai.modeFast'), icon: Zap, desc: t('chat.voloai.modeFastDesc'), value: 'multimodal', executionMode: 'direct' },
  { id: 'agent', label: t('chat.voloai.modeAgent'), icon: Bot, desc: t('chat.voloai.modeAgentDesc'), value: 'multimodal', executionMode: 'simple' },
  { id: 'thought', label: t('chat.voloai.modeThought'), icon: Brain, desc: t('chat.voloai.modeThoughtDesc'), value: 'multimodal', executionMode: 'thought' },
  { id: 'max', label: t('chat.voloai.modeMax'), icon: Sparkles, desc: t('chat.voloai.modeMaxDesc'), value: 'multimodal', executionMode: 'complex' },
])
const persistedExecutionUiModeId = chat.getExecutionUiModeId()
const currentUiMode = ref(uiModes.value.find(m => m.id === persistedExecutionUiModeId) || uiModes.value[0])
const uiModeIconColorClassMap: Record<string, string> = {
  auto: 'text-orange-500',
  fast: 'text-emerald-500',
  agent: 'text-blue-500',
  thought: 'text-purple-500',
  max: 'text-[var(--mode-max-accent-dark)]'
}
const getUiModeIconColorClass = (modeId: string) => uiModeIconColorClassMap[modeId] || 'text-slate-700'
const showLeftMenu = ref(false)
const showRightMenu = ref(false)
const leftMenuRef = ref(null)
const rightMenuRef = ref(null)

const modeConfigs = computed(() => chat.getExecutionModeConfigs())

const updateModeConfig = (modeId: string, updates: Partial<{ useWebSearch: boolean; useKnowledgeBase: boolean; useMemoryEnhancement: boolean }>) => {
  chat.updateExecutionModeConfig(modeId, updates)
}

const isAdvancedConfigEnabled = computed(() => true)
const isConfigInteractive = computed(() => true)

// === 知识库选择器 ===
const showKbSelector = ref(false)
const kbList = ref<KnowledgeBase[]>([])
const isLoadingKbList = ref(false)

const selectedKbIds = computed(() => chat.selectedKnowledgeBaseIds)
const selectedKbCount = computed(() => selectedKbIds.value.length)

const loadKbList = async () => {
  if (isLoadingKbList.value) return
  isLoadingKbList.value = true
  try {
    const res = await listKnowledgeBases()
    if (res.code === 200 && Array.isArray(res.data)) {
      kbList.value = res.data
    }
  } catch (e) {
    console.error('[VoloAI] 加载知识库列表失败:', e)
  } finally {
    isLoadingKbList.value = false
  }
}

const toggleKbSelector = () => {
  showKbSelector.value = !showKbSelector.value
  if (showKbSelector.value && kbList.value.length === 0) {
    loadKbList()
  }
}

const isKbSelected = (id: string) => selectedKbIds.value.includes(id)

const toggleKbSelection = (id: string) => {
  chat.toggleKnowledgeBaseId(id)
}

const maxModeEnterPulse = ref(false)
let maxModeEnterPulseTimer: number | null = null
const triggerMaxModeEnterPulse = () => {
  maxModeEnterPulse.value = true
  if (maxModeEnterPulseTimer) {
    window.clearTimeout(maxModeEnterPulseTimer)
  }
  maxModeEnterPulseTimer = window.setTimeout(() => {
    maxModeEnterPulse.value = false
    maxModeEnterPulseTimer = null
  }, 650)
}

// Sync UI mode with actual mode
watch(currentUiMode, (newMode, oldMode) => {
    if (newMode?.id === 'max' && oldMode?.id !== 'max') {
      triggerMaxModeEnterPulse()
    }
    switchMode(newMode.value as any)
})

const handleModeSelect = (mode: any) => {
    currentUiMode.value = mode
    chat.setExecutionUiModeId(mode.id)
}

onClickOutside(leftMenuRef, () => showLeftMenu.value = false)
onClickOutside(rightMenuRef, () => showRightMenu.value = false)

onBeforeUnmount(() => {
  if (maxModeEnterPulseTimer) {
    window.clearTimeout(maxModeEnterPulseTimer)
    maxModeEnterPulseTimer = null
  }
})

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isMultiline = ref(false)
const isInputOverflow = ref(false)


// flush: 'post' 确保 DOM 已更新后再测量 scrollHeight
// 否则 inputMessage.value = '' 时 watch 先于 DOM patch 触发，scrollHeight 还是旧值
watch(inputMessage, () => {
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`

        const style = window.getComputedStyle(textareaRef.value)
        const lineHeight = Number.parseFloat(style.lineHeight || '0') || 0
        const paddingTop = Number.parseFloat(style.paddingTop || '0') || 0
        const paddingBottom = Number.parseFloat(style.paddingBottom || '0') || 0
        const contentHeight = textareaRef.value.scrollHeight - paddingTop - paddingBottom
        const rows = lineHeight > 0 ? Math.round(contentHeight / lineHeight) : 1
        isMultiline.value = rows > 1
    }
}, { flush: 'post' })

watch(currentArtifactContent, (val) => {
  if (isEditingPromptInArtifact.value) {
    inputMessage.value = val || ''
  }
})

const handleArtifactSave = async (payload: { content: string; title?: string; type?: string }) => {
  try {
    const type = payload.type || 'document'
    const baseName = (payload.title || (type === 'code' ? 'code' : 'prompt')).trim() || (type === 'code' ? 'code' : 'prompt')
    const safeBaseName = baseName.replace(/[\\/:*?"<>|]+/g, '_')
    const ext = type === 'code' ? 'txt' : 'md'
    const fileName = safeBaseName.endsWith(`.${ext}`) ? safeBaseName : `${safeBaseName}.${ext}`
    const file = new File([payload.content || ''], fileName, { type: 'text/plain' })

    const res = await uploadFile(file)
    if (res.code !== 200 || !res.data) {
      throw new Error(res.message || t('chat.voloai.saveFailed'))
    }

    const url = getFileUrl(res.data.fileId)
    antMessage.success(t('chat.voloai.savedToDrive'))

    // 最小侵入：将文件链接写入输入框（作为会话内容的一部分，从而自然与 session 绑定）
    inputMessage.value = `${inputMessage.value || ''}\n\n[${t('chat.voloai.driveFileLink', { name: res.data.fileName })}](${url})\n`
  } catch (e) {
    console.error('[ArtifactPanel] 保存失败:', e)
    antMessage.error(t('chat.voloai.saveFailedDesc', { error: (e as Error).message }))
  }
}


let gsapContext: gsap.Context | null = null
// 统一管理 GSAP 动画相关事件监听器的生命周期
let animationAbortController: AbortController | null = null

const initGSAPAnimations = () => {
  // 使用 GSAP Context 管理所有动画，避免内存泄漏
  if (gsapContext) {
    gsapContext.revert() // 清理旧的动画
  }

  gsapContext = gsap.context(() => {
    // ========== 1. 页面初始化动画 ==========
    if (appContainer.value) {
      // 页面淡入效果 - 只在初始化时执行一次
      gsap.fromTo(appContainer.value,
          {opacity: 0, y: 20},
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "opacity,y" // 动画完成后清除属性
          }
      )
    }


  })
}




/**
 * 输入容器简化动画
 * 移除复杂的背景位置动画，保留基本的聚焦效果
 */
const setupInputContainerAdvancedAnimations = (signal: AbortSignal) => {
  const inputContainer = document.querySelector('.input-container')
  if (!inputContainer) return

  const textarea = inputContainer.querySelector('textarea')
  if (textarea) {
    let focusAnimation: gsap.core.Tween | null = null

    textarea.addEventListener('focus', () => {
      focusAnimation = gsap.to(inputContainer, {
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--input-focus-border').trim(),
        y: -1,
        duration: 0.3,
        ease: 'power2.out'
      })
    }, { signal })

    textarea.addEventListener('blur', () => {
      if (focusAnimation) {
        focusAnimation.kill()
      }

      gsap.to(inputContainer, {
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--input-focus-border-subtle').trim(),
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    }, { signal })
  }
}

/**
 * Textarea 简化动画
 * 移除复杂的光晕效果，保留基本交互反馈
 */
const setupTextareaAdvancedAnimations = (signal: AbortSignal) => {
  const textarea = document.querySelector('.input-area textarea')
  if (!textarea) return

  let focusAnimation: gsap.core.Tween | null = null

  textarea.addEventListener('focus', () => {
    focusAnimation = gsap.to(textarea, {
      scale: 1.001,
      duration: 0.2,
      ease: 'power2.out'
    })
  }, { signal })

  textarea.addEventListener('blur', () => {
    if (focusAnimation) {
      focusAnimation.kill()
    }

    gsap.to(textarea, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out'
    })
  }, { signal })
}

/**
 * 发送按钮简化动画 - 添加防抖优化
 * 移除复杂的呼吸和流光效果，保持简洁的交互反馈
 */
const setupSendButtonAdvancedAnimations = (signal: AbortSignal) => {
  const sendButton = document.querySelector('.send-button')
  if (!sendButton) return

  let hoverAnimation: gsap.core.Tween | null = null
  let isAnimating = false

  sendButton.addEventListener('mouseenter', () => {
    if (isAnimating) return

    isAnimating = true
    hoverAnimation = gsap.to(sendButton, {
      y: -1,
      duration: 0.2,
      ease: 'power2.out',
      onComplete: () => {
        isAnimating = false
      }
    })
  }, { signal })

  sendButton.addEventListener('mouseleave', () => {
    if (hoverAnimation) hoverAnimation.kill()

    gsap.to(sendButton, {
      y: 0,
      duration: 0.2,
      ease: 'power2.out',
      onComplete: () => {
        isAnimating = false
      }
    })
  }, { signal })
}

/**
 * 工具栏按钮简化动画 - 添加防抖优化
 * 移除复杂的涟漪创建，使用简单的缩放效果
 */
const setupToolbarAdvancedAnimations = (signal: AbortSignal) => {
  const toolbarButtons = document.querySelectorAll('.input-toolbar button')

  toolbarButtons.forEach(button => {
    let isAnimating = false

    button.addEventListener('mouseenter', () => {
      if (isAnimating) return

      isAnimating = true
      gsap.to(button, {
        scale: 1.05,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          isAnimating = false
        }
      })
    }, { signal })

    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          isAnimating = false
        }
      })
    }, { signal })

    button.addEventListener('click', () => {
      if (!isAnimating) {
        isAnimating = true
        gsap.to(button, {
          scale: 0.95,
          duration: 0.1,
          ease: 'power2.in',
          onComplete: () => {
            gsap.to(button, {
              scale: 1.05,
              duration: 0.1,
              ease: 'power2.out',
              onComplete: () => {
                isAnimating = false
              }
            })
          }
        })
      }
    }, { signal })
  })
}


const testInitPlan = () => {
  const plan = generateTestPlan()
  chat.setSessionPlan(sessionId.value, plan)
  chat.setPlanWidgetMode('ball')
  notification.success({
    message: t('chat.voloai.testPlanCreated'),
    description: t('chat.voloai.testPlanDesc')
  })
}

const testSimplePlan = () => {
  const plan = generateSimplePlan()
  chat.setSessionPlan(sessionId.value, plan)
  chat.setPlanWidgetMode('ball')
  notification.success({
    message: t('chat.voloai.simplePlanCreated'),
    description: t('chat.voloai.simplePlanDesc')
  })
}


// 路由离开前清理资源
onBeforeRouteLeave(() => {
  console.log('[Index] 路由离开，清理 SSE 连接和动画')
  closeActiveSource()
  if (gsapContext) {
    gsapContext.revert()
    gsapContext = null
  }
})

// 组件挂载
onMounted(() => {
  // 消息已通过 computed 自动从 store 加载，无需手动赋值

  // 初始化 GSAP 动画系统 - 简化版
  nextTick(() => {
    // 创建 AbortController 统一管理动画事件监听器
    animationAbortController?.abort()
    animationAbortController = new AbortController()
    const signal = animationAbortController.signal

    // 1. 页面初始化 + 进度指示器
    initGSAPAnimations()


    // 2. 输入相关动画（合并基础和高级动画）
    setupInputContainerAdvancedAnimations(signal)

    setupTextareaAdvancedAnimations(signal)

    // 3. 发送按钮动画（只使用高级版本，避免重复）
    setupSendButtonAdvancedAnimations(signal)

    // 4. 工具栏和附件动画
    setupToolbarAdvancedAnimations(signal)


    // 监听滚动，控制下滑按钮显隐
    chatContent.value?.addEventListener('scroll', handleChatScroll)
    // 同时监听窗口滚动作为兜底
    window.addEventListener('scroll', handleChatScroll)

    // 初始化时滚到底部并隐藏按钮
    scrollToBottom()
    showScrollButton.value = false

    updateFollowOutputState()

  })
})

// 组件卸载前清理资源
onBeforeUnmount(() => {
  console.log('[Index] 组件卸载，清理资源')
  closeActiveSource()
  // 通过 AbortController 一次性移除所有 GSAP 动画事件监听器
  if (animationAbortController) {
    animationAbortController.abort()
    animationAbortController = null
  }
  if (gsapContext) {
    gsapContext.revert()
    gsapContext = null
  }
})

// 组件卸载
onUnmounted(() => {
  chatContent.value?.removeEventListener('scroll', handleChatScroll)
  window.removeEventListener('scroll', handleChatScroll)

  // 清理所有 GSAP 动画，避免内存泄漏
  if (gsapContext) {
    gsapContext.revert()
    gsapContext = null
  }

  // 清理全局 GSAP 动画
  gsap.killTweensOf('*')

  // 清理附件预览 URL
  for (const a of attachments.value) {
    revokeAttachmentPreviewUrl(a.file)
  }
})

watch(
  () => [turns.value, progress.value?.text],
  async () => {
    await scrollToBottomIfFollowing()
  },
  { deep: true, flush: 'post' }
)
</script>

<template>
  <div ref="appContainer" :class="['volo-ai-app', currentThemeClass]" class="relative flex flex-col h-[100dvh] sm:h-screen overflow-hidden bg-[var(--page-bg)] text-slate-800 dark:text-zinc-100 font-sans selection:bg-orange-100 selection:text-orange-900">
    <!-- Plan 状态侧边栏 - 仅在 reactPlus 页面显示 -->
    <PlanWidget/>
    <!-- 🖥️ 极客模式：终端界面 -->
    <template v-if="isGeekMode">

      <div class="geek-mode-wrapper">
        <!-- 快速模式切换栏 -->
        <div class="geek-mode-header">
          <div class="mode-info">
            <span class="mode-label">Geek Mode</span>
            <span class="session-info">Session: {{ sessionId }}</span>
          </div>
          <div class="mode-actions">
            <button
                class="exit-geek-btn"
                :title="t('chat.voloai.exitGeekMode')"
                @click="() => switchMode('multimodal')"
            >
              {{ t('chat.voloai.exitGeekMode') }}
            </button>
          </div>
        </div>

        <Terminal
            ref="terminalRef"
            :session-id="sessionId"
            class="geek-terminal-interface"
        />
      </div>
    </template>

    <!-- 正常界面 -->
    <template v-else>
      <!-- 模型选择器 - 组件左上角，避开侧边栏 -->
      <div class="absolute top-4 left-16 md:left-5 z-50">
        <ModelSelector
          :model-value="chat.selectedModelId"
          :disabled="isLoading"
          @update:model-value="handleModelChange"
          @change="handleModelSelect"
        />
      </div>


      <!-- 主要内容区域 (Flex Row Wrapper) -->
      <div class="main-flex-container flex-1 flex min-w-0 overflow-hidden relative w-full h-full">

        <!-- 左侧/中间：Chat Area -->
        <div class="flex-1 flex flex-col min-w-0 relative h-full transition-all duration-300">
            
            <div class="main-content relative flex flex-col flex-1 min-h-0">
              <!-- 对话区域 -->
              <div
                ref="chatContent"
                role="log"
                aria-live="polite"
                :aria-label="t('chat.voloai.chatAriaLabel')"
                class="chat-container relative flex-1 min-h-0"
                :class="isChatStarted ? 'overflow-y-auto scroll-smooth' : 'flex flex-col items-center justify-center'"
                data-chat-content
              >

                <!-- Loading 骨架屏 -->
                <div v-if="isLoadingCurrentSession" class="absolute inset-x-0 top-[15%] px-4">
                  <div class="max-w-[770px] mx-auto space-y-6">
                    <!-- 用户消息骨架 -->
                    <div class="flex justify-end">
                      <div class="max-w-[70%]">
                        <Skeleton
                            active
                            :paragraph="{ rows: 1, width: '200px' }"
                            :title="false"
                        />
                      </div>
                    </div>
                    <!-- AI 消息骨架 -->
                    <div class="flex justify-start">
                      <div class="w-full">
                        <Skeleton
                            active
                            :paragraph="{ rows: 3, width: ['100%', '90%', '60%'] }"
                            :title="{ width: '120px' }"
                        />
                      </div>
                    </div>
                    <!-- 用户消息骨架 -->
                    <div class="flex justify-end">
                      <div class="max-w-[70%]">
                        <Skeleton
                            active
                            :paragraph="{ rows: 1, width: '160px' }"
                            :title="false"
                        />
                      </div>
                    </div>
                    <!-- AI 消息骨架 -->
                    <div class="flex justify-start">
                      <div class="w-full">
                        <Skeleton
                            active
                            :paragraph="{ rows: 4, width: ['100%', '95%', '80%', '40%'] }"
                            :title="{ width: '100px' }"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Welcome Screen -->
                <div v-else-if="isEmptyIdle" class="w-full px-4 transition-all duration-500 ease-in-out">
                  <div class="flex flex-col items-center justify-center pointer-events-auto">
                    <component
                        :is="currentWelcomeComponent"
                        @suggestion-click="handleSuggestionClick"
                    />
                    <!-- 注意：空会话发消息时，用户消息先入 store → isEmptyIdle 变 false → 走消息列表路径 -->
                    <!-- Progress 由消息列表内的 isTurnProcessing 机制处理，此处无需额外显示 -->
                  </div>
                </div>

                <!-- 消息列表 -->
                <!-- TODO: 启用虚拟列表 @tanstack/vue-virtual — 当 turns 数量 > 100 时性能优化必需 -->
                <div v-else>
                  <div
                      v-for="(turn, turnIndex) in turns"
                      :id="turn.id ? turn.id : undefined"
                      :key="turn.id"
                      class="turn-wrapper group relative flex items-start justify-center"
                  >
                     <!-- Turn Content (Same as before) -->
                     <div class="w-full">
                        <!-- Turn Header Shimmer - AI turn 正在处理时显示 -->
                        <div v-if="!isUserTurn(turn) && isTurnProcessing(turnIndex)" class="w-full max-w-[770px] ml-auto mr-auto relative mb-2">
                          <Shimmer>
                            <span>{{ progress?.text }}</span>
                          </Shimmer>
                        </div>

                        <!-- Edit Box -->
                        <div v-if="editingTurnId === turn.id && isUserTurn(turn)" class="w-full max-w-[770px] ml-auto mr-auto mb-4">
                           <!-- ... Edit Box Content ... -->
                             <div class="edit-box-glass flex flex-col gap-3 p-4 rounded-xl border border-white/20 shadow-lg backdrop-blur-md">
                                <ATextarea v-model:value="editingContent" :auto-size="{ minRows: 2, maxRows: 8 }" class="glass-input rounded-lg text-slate-700 dark:text-zinc-300" :placeholder="t('chat.voloai.editPlaceholder')" @keydown.ctrl.enter="handleTurnEditConfirm(turn)" @keydown.esc="handleTurnEditCancel" />
                                <div class="flex gap-2 justify-end">
                                  <AButton size="small" class="glass-btn-cancel" @click="handleTurnEditCancel">{{ t('common.button.cancel') }}</AButton>
                                  <AButton size="small" type="primary" class="glass-btn-primary" @click="handleTurnEditConfirm(turn)">{{ t('common.button.confirm') }}</AButton>
                                </div>
                              </div>
                        </div>

                        <!-- Messages -->
                        <div v-else class="message-wrapper">
                           <template v-for="(message, messageIndex) in turn.messages" :id="message.messageId ? 'msg-' + message.messageId : undefined" :key="message.messageId || ``">
                              <!-- 消息类型分发链（完整的 v-if/v-else-if 链，禁止在中间插入独立 v-if） -->
                              <UserMessage v-if="message.type === EventType.USER" :message="message" class="message-item " />
                              <ThinkingMessage v-else-if="message.type === EventType.THINKING" :message="message" :is-thinking="!message.endTime" class="message-item " />
                              <ReasoningMessage v-else-if="message.type === EventType.REASONING" :message="message" :is-reasoning="!message.endTime" class="message-item " />
                              <ThoughtMessage v-else-if="message.type === EventType.THOUGHT" :message="message" class="message-item " />
                              <WebSearchToolMessage v-else-if="message.type === EventType.WEB_SEARCH" :message="message" class="message-item" @show-details="handleShowArtifact" />
                              <KnowledgeRetrievalMessage v-else-if="message.type === EventType.KNOWLEDGE_RETRIEVAL" :message="message" class="message-item" @show-details="handleShowArtifact" />
                              <ToolMessage v-else-if="message.type === EventType.TOOL" :message="message" class="message-item" @show-details="handleShowArtifact"></ToolMessage>
                              <ToolApprovalMessage v-else-if="message.type === EventType.TOOL_APPROVAL" :message="message" class="message-item" @approved="handleToolApproved(message.messageId!, $event)" @rejected="handleToolRejected(message.messageId!, $event)" @error="handleToolError(message.messageId!, $event)" @terminate-requested="handleToolTerminateRequested(message.messageId!, $event)"/>
                              <InteractionMessage v-else-if="message.type === EventType.INTERACTION" :message="message" class="message-item" />
                              <UIEventMessage v-else-if="message.type === EventType.UI" :message="message" class="message-item" @submit="handleUIEventSubmit" />
                              <ErrorMessage v-else-if="message.type === EventType.ERROR" :message="message" class="message-item" @retry="handleErrorRetry(message)"/>
                              <CommonMessage
                                v-else-if="message.type === EventType.ASSISTANT || message.type === EventType.ACTING"
                                :message="message"
                                class="message-item "
                                :is-artifact-open="isArtifactOpen"
                                @open-code-artifact="handleOpenCodeArtifact"
                                @close-code-artifact="handleCloseArtifact"
                              />

                           </template>


                           <!-- Turn 时间显示 -->
                           <p class="w-full max-w-[780px] ml-auto mr-auto text-xs text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none mb-1" :class="isUserTurn(turn) ? 'text-right' : 'text-left'">
                             {{ formatDistanceToNow(getTurnDisplayTime(turn), { locale: zhCN, addSuffix: true }) }}
                           </p>
                          <!-- Message Branch & Toolbar -->
                          <MessageBranch v-if="hasSiblingBranches(turn)" :default-branch="turn.siblingIndex" :total-branches="turn.siblingCount" class="w-full max-w-[780px] ml-auto mr-auto" @branch-change="(index: number) => handleBranchChange(turn, index)">
                            <MessageToolbar class="-mt-3! py-1 opacity-0 group-hover:opacity-100! hover:opacity-100! transition-opacity duration-200 justify-start" :class="isUserTurn(turn) ? 'flex-row-reverse' : ''">
                              <MessageBranchSelector :from="isUserTurn(turn) ? 'user' : 'assistant'">
                                <MessageBranchPrevious />
                                <MessageBranchPage />
                                <MessageBranchNext />
                              </MessageBranchSelector>
                              <MessageActions>
                                <template v-if="isUserTurn(turn)">
                                  <ATooltip :title="t('common.button.copy')">
                                    <MessageAction type="text"  shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-green-500" @click="handleTurnCopy(turn)"><Copy class="size-4 m-auto" /></MessageAction>
                                  </ATooltip>
                                  <ATooltip :title="t('common.button.edit')">
                                    <MessageAction type="text"  shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-green-500" @click="handleTurnEditStart(turn)"><PenLine class="size-4 m-auto" /></MessageAction>
                                  </ATooltip>
                                </template>
                                <template v-else>
                                  <ATooltip :title="t('common.button.copy')">
                                    <AButton type="text"  shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-blue-500" @click="handleTurnCopy(turn)">
                                      <template #icon><Copy class="size-4 m-auto" /></template>
                                    </AButton>
                                  </ATooltip>
                                  <ATooltip :title="t('common.button.regenerate')">
                                    <AButton  type="text" shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-blue-500" @click="handleTurnRegenerate(turn, turnIndex)">
                                      <template #icon><RefreshCcw  class="size-4 m-auto" /></template>
                                    </AButton>
                                  </ATooltip>
                                  <ATooltip :title="t('chat.voloai.promptEdit')">
                                    <AButton type="text"  shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-blue-500" @click="handleTurnDocumentEdit(turn)">
                                      <template #icon><PenLine class="size-4 m-auto" /></template>
                                    </AButton>
                                  </ATooltip>
                                </template>
                              </MessageActions>
                            </MessageToolbar>
                          </MessageBranch>

                          <!-- No Branch Toolbar -->
<!--                           <div v-else-if="!turnTree.turnMap.get(turn.id)?.children?.length" class="-mt-2 turn-actions w-full max-w-[780px] ml-auto mr-auto flex gap-1 py-1 opacity-0 group-hover:opacity-100! hover:opacity-100! transition-opacity duration-200" :class="isUserTurn(turn) ? 'justify-end' : 'justify-start'">-->
                           <div v-else class="-mt-2 turn-actions w-full max-w-[780px] ml-auto mr-auto flex gap-1 py-1 opacity-0 group-hover:opacity-100! hover:opacity-100! transition-opacity duration-200" :class="isUserTurn(turn) ? 'justify-end' : 'justify-start'">

                              <template v-if="isUserTurn(turn)">
                                <ATooltip :title="t('common.button.copy')">
                                <AButton type="text" shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-green-500" @click="handleTurnCopy(turn)"><template #icon><Copy class="size-4 m-auto" /></template></AButton>
                                </ATooltip>
                                <ATooltip :title="t('common.button.edit')">
                                  <AButton type="text" shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-green-500" @click="handleTurnEditStart(turn)"><template #icon><EditOutlined /></template></AButton>
                                </ATooltip>
                              </template>
                              <template v-else>
                                <ATooltip :title="t('common.button.copy')">
                                  <AButton type="text" shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-blue-500" @click="handleTurnCopy(turn)"><template #icon><Copy class="size-4 m-auto" /></template></AButton>
                                </ATooltip>
                                <ATooltip :title="t('common.button.regenerate')">
                                  <AButton type="text" shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-blue-500" :loading="isLoading" @click="handleTurnRegenerate(turn, turnIndex)"><template #icon><RefreshCcw  class="size-4 m-auto" /></template></AButton>
                                </ATooltip>
                                <ATooltip :title="t('chat.voloai.promptEdit')">
                                  <AButton type="text" shape="circle" class="!text-slate-500 dark:!text-zinc-400 hover:!text-blue-500" @click="handleTurnDocumentEdit(turn)"><template #icon><PenLine class="size-4 m-auto" /></template></AButton>
                                </ATooltip>
                              </template>
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Progress 兜底：当有活跃任务但 AI turn 尚未创建时显示 -->
                  <!-- 覆盖：pending 状态、STARTED 后 AI turn 未建立 -->
                  <div v-if="showBottomProgress" class="w-full max-w-[770px] ml-auto mr-auto relative mt-4 mb-4">
                    <Shimmer>
                      <span>{{ progress?.text }}</span>
                    </Shimmer>
                  </div>
                </div>

              </div>

              <!-- 屏幕阅读器：AI 思考状态通知 -->
              <div aria-live="assertive" class="sr-only">
                <span v-if="isLoading">{{ t('chat.avatarChat.thinkingAriaLive') }}</span>
              </div>

              <!-- 滚动到底部按钮 -->
              <Transition name="fade">
                <div v-show="showScrollButton" class="scroll-to-bottom" role="button" tabindex="0" :aria-label="t('chat.voloai.scrollToBottom')" @click="scrollToBottom" @keydown.enter="scrollToBottom" @keydown.space.prevent="scrollToBottom">
                  <AButton type="primary" shape="circle" :icon="h(ArrowDownOutlined)"/>
                </div>
              </Transition>
            </div>

            <!-- 输入区域（空态居中 / 聊天态贴底） -->
            <div
              class="relative shrink-0 left-0 right-0 z-40 p-4 flex flex-col items-center justify-end pointer-events-none transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) min-h-[60px] box-border"
              :class="isChatStarted ? 'pb-6' : 'pb-2'"
            >
               <!-- PlanQueue（仅聊天态展示，避免空态挤压输入框居中布局） -->
               <div v-if="isChatStarted" class="w-full max-w-[830px] mx-auto px-2 md:px-0 pointer-events-auto mb-1">
                 <PlanQueue />
               </div>

               <!-- Input Container -->
               <div class="w-full max-w-[830px] px-2 md:px-0 mx-auto pointer-events-auto">
                   <div 
                      class="input-container input-area relative flex bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl rounded-4xl border border-slate-200/80 dark:border-zinc-700/80 ring-1 ring-transparent shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-500 ease-in-out group pl-3 pr-4 min-h-[60px] hover:border-slate-300/70 dark:hover:border-zinc-600/70 focus-within:border-[var(--mode-max-accent)]/55 focus-within:ring-[var(--mode-max-dark)]/18 focus-within:shadow-[0_16px_52px_-22px_var(--mode-max-shadow),0_0_28px_var(--mode-max-glow)]"
                      :style="{ 
                        alignItems: (isMultiline || attachments.length > 0) ? 'flex-end !important' : 'center !important',
                        paddingBottom: (isMultiline || attachments.length > 0) ? '12px' : '0'
                      }"
                      @dragover.prevent
                      @drop="onDropFiles"
                   >
                      
                      <!-- 1. Left Action Button (+) -->
                      <div ref="leftMenuRef" class="relative" :class="(isMultiline || attachments.length > 0) ? 'mb-2' : 'mb-1'">
                          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <button
                                    :aria-label="t('chat.voloai.addAttachment')"
                                    class="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:text-slate-700 dark:hover:text-zinc-200 active:scale-95 transition-all"
                                    :class="{'bg-slate-100 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200': showLeftMenu}"
                                    @click="showLeftMenu = !showLeftMenu"
                                >
                                    <Plus :size="22" class="transition-transform duration-200" :class="showLeftMenu ? 'rotate-45' : 'rotate-0'" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                                {{ t('chat.voloai.addAttachment') }}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <!-- Context Fill Menu -->
                          <div v-if="showLeftMenu" class="absolute bottom-12 left-0 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-xl w-56 p-2 animate-fade-in-up origin-bottom-left flex flex-col gap-1 z-50">
                              <button class="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl text-left active:scale-[0.98] transition-colors" @click="fileInput?.click()">
                                  <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><UploadCloud :size="16"/></div>
                                  <div>
                                      <div class="text-sm font-medium text-slate-700 dark:text-zinc-200">{{ t('chat.voloai.uploadFile') }}</div>
                                      <div class="text-xs text-slate-400 dark:text-zinc-500">PDF, Excel, Images</div>
                                  </div>
                              </button>
                              <button class="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl text-left active:scale-[0.98] transition-colors" @click="insertCodeBlock">
                                  <div class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><FilePlus :size="16"/></div>
                                  <div>
                                      <div class="text-sm font-medium text-slate-700 dark:text-zinc-200">{{ t('chat.voloai.addAttachment') }}</div>
                                      <div class="text-xs text-slate-400 dark:text-zinc-500">{{ t('chat.voloai.inputAriaLabel') }}</div>
                                  </div>
                              </button>
                              <div class="h-px bg-slate-100 dark:bg-zinc-700 my-1"></div>
                              <button class="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl text-left active:scale-[0.98] transition-colors">
                                  <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500"><Link :size="16"/></div>
                                  <div>
                                      <div class="text-sm font-medium text-slate-700 dark:text-zinc-200">Google Drive</div>
                                      <div class="text-xs text-slate-400 dark:text-zinc-500">{{ t('common.button.import') }}</div>
                                  </div>
                              </button>
                          </div>
                      </div>

                      <!-- 2. Input Field (Centered & Auto-Resizing) -->
                      <div class="flex-1 flex flex-col min-w-0" :style="{ justifyContent: (isMultiline || attachments.length > 0) ? 'flex-end' : 'center' }">
                        <div
                          v-show="attachments.length > 0"
                          class="px-2 pt-1"
                        >
                          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <div
                              v-for="att in attachments"
                              :key="att.name + '-' + att.size"
                              class="group/1 flex items-center gap-2 bg-slate-50 dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-xl px-2 sm:px-2 py-2 sm:py-1.5 shrink-0 hover:border-teal-300/60 hover:bg-teal-50/40 hover:shadow-md transition-all duration-300 cursor-pointer"
                              :title="att.file.type.startsWith('image/') ? t('chat.voloai.clickToPreview') : att.name"
                              @click="handleAttachmentClick(att)"
                            >
                              <!-- 图片附件：显示缩略图 -->
                              <div
                                v-if="att.file.type.startsWith('image/')"
                                class="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-600 border border-slate-200 dark:border-zinc-500 shrink-0 relative  transition-all"
                              >
                                <img
                                  :src="getAttachmentPreviewUrl(att.file) || ''"
                                  :alt="att.name"
                                  class="w-full h-full object-cover"
                                />
                                <!-- 预览提示遮罩 -->
                                <div class="absolute inset-0 bg-black/0 group-hover/1:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover/1:opacity-100">
                                </div>
                              </div>
                              <!-- 非图片附件：显示文件图标 -->
                              <div
                                v-else
                                class="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-600 border border-slate-200 dark:border-zinc-500 text-slate-500 dark:text-zinc-300 shrink-0 group-hover/1:bg-teal-50 group-hover/1:text-teal-600 transition-colors"
                              >
                                <FileText :size="16" />
                              </div>

                              <!-- 文件名（非图片时显示） -->
                              <div
                                v-if="!att.file.type.startsWith('image/')"
                                class="max-w-[200px] truncate text-xs font-medium text-slate-700 dark:text-zinc-200"
                              >
                                {{ att.name }}
                              </div>

                              <!-- 文件大小 -->
                              <div
                                v-if="!att.file.type.startsWith('image/')"
                                class="text-xs text-slate-400 dark:text-zinc-500"
                              >
                                {{ att.sizeKB }} KB
                              </div>

                              <!-- 删除按钮（阻止冒泡） -->
                              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                                <Tooltip>
                                  <TooltipTrigger as-child>
                                    <button
                                      type="button"
                                      :aria-label="t('chat.voloai.removeAttachment')"
                                      class="w-11 h-11 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 transition-all"
                                      @click.stop="removeAttachment(att)"
                                    >
                                      <X :size="18" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                                    {{ t('chat.voloai.removeAttachment') }}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>

                        <textarea
                          ref="textareaRef"
                          v-model="inputMessage"
                          :aria-label="t('chat.voloai.inputAriaLabel')"
                          placeholder="Ask anything..."
                          class="hover bg-transparent border-0 text-slate-700 dark:text-zinc-200 text-base leading-relaxed placeholder:text-slate-400 dark:placeholder:text-zinc-500 py-3 px-2 min-h-[56px] max-h-[240px] resize-none focus:ring-0 outline-none"
                          rows="1"
                          @keydown.enter="onPressEnter"
                          @paste="onPaste"
                        />

                        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <button
                                v-if="isInputOverflow"
                                type="button"
                                :aria-label="t('chat.voloai.fullscreenEdit')"
                                class="absolute top-3 right-[92px] w-11 h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 active:scale-95 transition-colors"
                                @click="handlePromptFullscreenEdit"
                              >
                                <Maximize2 :size="18" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                              {{ t('chat.voloai.fullscreenEdit') }}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <!-- 3. Right Action Area (Mode + Send) -->
                      <div class="flex items-center" :class="(isMultiline || attachments.length > 0) ? 'mb-2' : 'mb-0'">

                          <!-- Execution Function Selector -->
                          <div ref="rightMenuRef" class="relative">
                              <button
                                  :aria-label="t('chat.voloai.selectMode')"
                                  class="flex items-center gap-1.5 shrink-0 whitespace-nowrap min-h-11 sm:min-h-0 px-3 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-sm font-semibold active:scale-95 transition-all duration-300"
                                  :class="showRightMenu
                                    ? (currentUiMode.id === 'max'
                                        ? 'bg-white/90 dark:bg-zinc-800/90 text-slate-900 dark:text-white border border-[var(--mode-max-accent)]/35 shadow-sm ring-1 ring-[var(--mode-max-dark)]/10 backdrop-blur-md'
                                        : 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700 shadow-sm ring-1 ring-black/5')
                                    : (currentUiMode.id === 'max'
                                        ? 'text-slate-700 dark:text-zinc-300 border border-transparent hover:border-[var(--mode-max-accent)]/30 hover:bg-[var(--mode-max-accent)]/6 hover:text-slate-900 dark:hover:text-white'
                                        : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white border border-transparent')"
                                  :data-max-enter="currentUiMode.id === 'max' && maxModeEnterPulse"
                                  @click="showRightMenu = !showRightMenu"
                              >
                                  <component
                                    :is="currentUiMode.icon"
                                    :size="18"
                                    :class="showRightMenu ? 'text-slate-900 dark:text-white' : getUiModeIconColorClass(currentUiMode.id)"
                                  />
                                  <span v-if="!isMultiline" class="text-[11px] font-bold tracking-wide hidden md:inline whitespace-nowrap">{{ currentUiMode.id.toUpperCase() }}</span>
                                  <ChevronDown :size="14" class="opacity-50 transition-transform duration-300" :class="showRightMenu ? 'rotate-180' : 'rotate-0'" />
                              </button>

                              <!-- Mode Selection Menu -->
                              <Transition
                                enter-active-class="transition-all duration-300 ease-out"
                                enter-from-class="opacity-0 scale-95 translate-y-2 blur-sm"
                                enter-to-class="opacity-100 scale-100 translate-y-0 blur-0"
                                leave-active-class="transition-all duration-200 ease-in"
                                leave-from-class="opacity-100 scale-100 translate-y-0 blur-0"
                                leave-to-class="opacity-0 scale-95 translate-y-2 blur-sm"
                              >
                                <div
                                  v-if="showRightMenu"
                                  class="absolute bottom-12 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-700/60 shadow-lg rounded-2xl w-[calc(100vw-24px)] max-w-[260px] z-50 origin-bottom-right ring-1 ring-black/5 overflow-hidden"
                                >
                                  <!-- Mode list -->
                                  <div class="py-1.5">
                                    <button
                                      v-for="mode in uiModes"
                                      :key="mode.id"
                                      class="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all duration-150 rounded-lg mx-auto group/mode"
                                      :class="currentUiMode.id === mode.id
                                        ? (mode.id === 'max'
                                            ? 'bg-[var(--mode-max-accent)]/8'
                                            : 'bg-slate-100 dark:bg-zinc-800')
                                        : 'hover:bg-slate-50 dark:hover:bg-zinc-800/60'"
                                      :data-max-enter="mode.id === 'max' && currentUiMode.id === 'max' && maxModeEnterPulse"
                                      @click="handleModeSelect(mode)"
                                    >
                                      <component
                                        :is="mode.icon"
                                        :size="16"
                                        class="shrink-0"
                                        :class="currentUiMode.id === mode.id
                                          ? getUiModeIconColorClass(mode.id)
                                          : 'text-slate-400 dark:text-zinc-500 group-hover/mode:text-slate-600 dark:group-hover/mode:text-zinc-400'"
                                      />
                                      <span
                                        class="text-xs font-semibold flex-1"
                                        :class="currentUiMode.id === mode.id
                                          ? 'text-slate-900 dark:text-white'
                                          : 'text-slate-600 dark:text-zinc-400 group-hover/mode:text-slate-800 dark:group-hover/mode:text-zinc-200'"
                                      >{{ mode.label }}</span>
                                      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                                        <Tooltip>
                                          <TooltipTrigger as-child>
                                            <span
                                              class="text-[10px] text-slate-400 dark:text-zinc-500 inline-block truncate max-w-[80px] align-middle cursor-default"
                                            >{{ mode.desc }}</span>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top" :side-offset="6"
                                            class="text-[11px] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                                          >{{ mode.desc }}</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <div
                                        v-if="currentUiMode.id === mode.id"
                                        class="w-1.5 h-1.5 rounded-full shrink-0"
                                        :class="getUiModeIconColorClass(mode.id)?.replace('text-', 'bg-')"
                                      />
                                    </button>
                                  </div>

                                  <!-- Divider -->
                                  <div class="h-px bg-slate-100 dark:bg-zinc-700/60 mx-3" />

                                  <!-- Config toggles — compact pill row -->
                                  <div class="flex items-center flex-wrap gap-1.5 px-3 py-2.5">
                                    <!-- Web Search pill -->
                                    <button
                                      class="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95"
                                      :class="modeConfigs[currentUiMode.id]?.useWebSearch
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400'"
                                      :title="isAdvancedConfigEnabled ? t('chat.voloai.webSearch') : t('chat.voloai.webSearchPreview')"
                                      @click="() => { if (!isConfigInteractive) return; updateModeConfig(currentUiMode.id, { useWebSearch: !modeConfigs[currentUiMode.id]?.useWebSearch }) }"
                                    >
                                      <Globe :size="13" />
                                      <span>{{ t('chat.voloai.webSearch') }}</span>
                                    </button>

                                    <!-- Knowledge Base pill -->
                                    <button
                                      class="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95"
                                      :class="modeConfigs[currentUiMode.id]?.useKnowledgeBase
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400'"
                                      @click="() => { if (!isConfigInteractive) return; updateModeConfig(currentUiMode.id, { useKnowledgeBase: !modeConfigs[currentUiMode.id]?.useKnowledgeBase }) }"
                                    >
                                      <Database :size="13" />
                                      <span>{{ t('chat.voloai.selectKb') }}</span>
                                      <span
                                        v-if="modeConfigs[currentUiMode.id]?.useKnowledgeBase && selectedKbCount > 0"
                                        class="text-[9px] bg-blue-500 text-white min-w-[16px] h-4 rounded-full flex items-center justify-center leading-none"
                                      >{{ selectedKbCount }}</span>
                                    </button>
                                    <!-- KB expand -->
                                    <button
                                      v-if="modeConfigs[currentUiMode.id]?.useKnowledgeBase"
                                      class="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all"
                                      :aria-label="t('chat.voloai.selectKb')"
                                      @click.stop="toggleKbSelector"
                                    >
                                      <ChevronDown :size="12" :class="showKbSelector ? 'rotate-180' : ''" class="transition-transform" />
                                    </button>

                                    <div class="flex-1" />

                                    <!-- Memory pill -->
                                    <button
                                      class="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 active:scale-95"
                                      :class="modeConfigs[currentUiMode.id]?.useMemoryEnhancement
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-400'"
                                      @click="() => { if (!isConfigInteractive) return; updateModeConfig(currentUiMode.id, { useMemoryEnhancement: !modeConfigs[currentUiMode.id]?.useMemoryEnhancement }) }"
                                    >
                                      <Brain :size="13" />
                                      <span>{{ t('chat.voloai.memory') }}</span>
                                    </button>
                                  </div>

                                  <!-- KB selector dropdown -->
                                  <Transition name="fade">
                                    <div
                                      v-if="showKbSelector && modeConfigs[currentUiMode.id]?.useKnowledgeBase"
                                      class="border-t border-slate-100 dark:border-zinc-700/60"
                                    >
                                      <div v-if="isLoadingKbList" class="flex items-center justify-center py-3">
                                        <Loader2 :size="14" class="animate-spin text-blue-400" />
                                        <span class="ml-2 text-[11px] text-slate-400 dark:text-zinc-500">{{ t('common.status.loading') }}</span>
                                      </div>
                                      <div v-else-if="kbList.length === 0" class="py-3 text-center">
                                        <span class="text-[11px] text-slate-400 dark:text-zinc-500">{{ t('common.status.empty') }}</span>
                                      </div>
                                      <div v-else class="max-h-32 overflow-y-auto">
                                        <div
                                          v-for="kb in kbList" :key="kb.id"
                                          class="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/30"
                                          @click="toggleKbSelection(kb.id)"
                                        >
                                          <div
                                            class="w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center transition-colors shrink-0"
                                            :class="isKbSelected(kb.id)
                                              ? 'bg-blue-500 border-blue-500'
                                              : 'border-slate-300 dark:border-zinc-600'"
                                          >
                                            <svg v-if="isKbSelected(kb.id)" class="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                                              <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                          </div>
                                          <span class="text-[11px] text-slate-600 dark:text-zinc-300 truncate">{{ kb.name }}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </Transition>
                                </div>
                              </Transition>
                          </div>

                          <!-- Separator -->
                          <div class="w-px h-5 bg-slate-200 dark:bg-zinc-700 ml-1 mr-3"></div>

                          <!-- Send Button (Grok Style - Black Circle) -->
                          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                            <Tooltip>
                              <TooltipTrigger as-child>
                                <button
                                  :aria-label="t('chat.voloai.sendMessage')"
                                  class="send-button w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full active:scale-95 transition-all duration-200 shadow-sm"
                                  :class="(canSend || isLoading) ? 'bg-slate-900 dark:bg-zinc-100 text-white! dark:text-zinc-900! hover:bg-slate-800 dark:hover:bg-zinc-200 hover:scale-105' : 'bg-slate-100 dark:bg-zinc-700 text-slate-400 dark:text-zinc-500 cursor-not-allowed'"
                                  :disabled="isLoading || !canSend"
                                  @click="sendMessage"
                                >
                                  <Loader2 v-if="isLoading" :size="18" class="animate-spin text-white" />
                                  <Send v-else :size="18" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" :side-offset="6" class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
                                {{ t('chat.voloai.sendMessage') }}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      </div>
                   </div>
                   
                   <!-- Bottom hint text -->
                   <div class="text-center mt-3 transition-opacity duration-500" :class="isChatStarted ? 'opacity-100' : 'opacity-0 h-0'">
                       <p class="text-[10px] text-slate-400 dark:text-zinc-500 font-medium tracking-wide opacity-60">
                          AI generated content may be inaccurate.
                       </p>
                   </div>
               </div>

               <!-- Suggestion Chips（仅空态展示） -->
               <div
                 v-if="!isChatStarted"
                 class="flex flex-wrap justify-center gap-3 w-full max-w-2xl mt-6 pointer-events-auto transition-all duration-500 delay-100"
                 :class="isChatStarted ? 'opacity-0 translate-y-4 pointer-events-none scale-95 h-0' : 'opacity-100 translate-y-0 scale-100'"
               >
                 <button
                   class="group px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full text-slate-600 dark:text-zinc-300 text-sm font-medium hover:border-orange-400 hover:text-orange-600 hover:shadow-md active:scale-95 transition-all duration-200 flex items-center gap-2"
                   @click="handleSuggestionClick('请帮我分析一下这个项目的目录结构，并给出优化建议。')"
                 >
                   <span class="p-1 bg-orange-50 rounded-full text-orange-500 group-hover:bg-orange-100 transition-colors">
                     <Zap :size="14" />
                   </span>
                   {{ t('chat.voloai.chipAnalyze') }}
                 </button>
                 <button
                   class="group px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full text-slate-600 dark:text-zinc-300 text-sm font-medium hover:border-blue-400 hover:text-blue-600 hover:shadow-md active:scale-95 transition-all duration-200 flex items-center gap-2"
                   @click="handleSuggestionClick('请帮我写一个 Vue 3 的计数器组件，使用 Composition API。')"
                 >
                   <span class="p-1 bg-blue-50 rounded-full text-blue-500 group-hover:bg-blue-100 transition-colors">
                     <Code :size="14" />
                   </span>
                   {{ t('chat.voloai.chipGenerate') }}
                 </button>
                 <button
                   class="group px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full text-slate-600 dark:text-zinc-300 text-sm font-medium hover:border-green-400 hover:text-green-600 hover:shadow-md active:scale-95 transition-all duration-200 flex items-center gap-2"
                   @click="handleSuggestionClick('请解释一下什么是 React Hooks，以及常用的 Hooks 有哪些？')"
                 >
                   <span class="p-1 bg-green-50 rounded-full text-green-500 group-hover:bg-green-100 transition-colors">
                     <FileText :size="14" />
                   </span>
                   {{ t('chat.voloai.chipExplain') }}
                 </button>
               </div>
            </div>

        </div>

        <!-- Right: Artifact Panel - Fixed overlay on mobile, sidebar on larger screens -->
        <Transition name="panel-slide">
        <div
          v-if="isArtifactOpen"
          class="h-full bg-white dark:bg-zinc-900 shadow-xl z-20 flex-shrink-0 border-l border-gray-100 dark:border-zinc-800 relative fixed md:relative inset-0 md:inset-auto z-40 md:z-20"
          :style="artifactPanelStyle"
        >
             <div class="artifact-resize-handle hidden md:block" @mousedown="startArtifactResize"></div>
             <ArtifactPanel
      :is-open="isArtifactOpen"
      :width="artifactWidth"
      :content="currentArtifactContent"
      :type="currentArtifactType"
      :title="currentArtifactTitle"
      :file-blob="currentArtifactFileBlob"
      :editable="isEditingPromptInArtifact"
      @close="handleCloseArtifact"
      @update:content="(v) => (currentArtifactContent = v)"
      @save="handleArtifactSave"
    />
        </div>
        </Transition>

      </div>

      <!-- 隐藏文件输入 -->
      <input
          ref="fileInput"
          type="file"
          :aria-label="t('chat.voloai.uploadFile')"
          class="hidden"
          multiple
          accept=".txt,.md,.markdown,.java,.kt,.scala,.py,.go,.js,.mjs,.cjs,.ts,.tsx,.json,.yml,.yaml,.xml,.html,.css,.scss,.less,.vue,.svelte,.c,.cpp,.h,.hpp,.cs,.rs,.php,.rb,.swift,.m,.mm,.sql,.sh,.bat,.ps1,.ini,.conf,.log,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.odt,.ods,.odp,.rtf,image/*"
          @change="onFileChange"
      />

    </template>

  </div>
</template>

<style scoped lang="scss">
@use './Index.scss' as *;
@use './EditBox.scss' as *;

.artifact-resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
  z-index: 30;
  background: transparent;
}

.artifact-resize-handle:hover {
  background: rgba(0, 0, 0, 0.06);
}

.artifact-resize-handle:active {
  background: rgba(0, 0, 0, 0.1);
}

.strategy-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--muted-foreground);
  }
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

<!-- Dark mode overrides for scoped styles -->
<style lang="scss">
.dark {
  .artifact-resize-handle:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  .artifact-resize-handle:active {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
