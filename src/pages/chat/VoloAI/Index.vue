<script setup lang="ts">
import {
  ArrowDownOutlined,
  CodeOutlined,
  CopyOutlined,
  EditOutlined,
  FileTextOutlined,
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
  Image as ImageIcon, 
  Mic, 
  ChevronDown, 
  UploadCloud, 
  FilePlus, 
  Link
} from 'lucide-vue-next'
import {Attachment} from '@/types/attachment'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { ProgressInfo } from '@/types/status'

// GSAP动画库
import {gsap} from 'gsap'
// 样式引入
import {NotificationType} from '@/types/notification'
import Terminal from '@/components/terminal/Terminal.vue'
import {useRoute, useRouter, onBeforeRouteLeave} from "vue-router";
import ToolMessage from "@/components/messages/ToolMessage.vue";
import {generateSimplePlan, generateTestPlan} from "@/utils/planTestData";
import PlanWidget from '@/components/PlanWidget.vue'
import { PlanQueue } from '@/components/ai-elements/queue'
import CommonMessage from "@/components/messages/CommonMessage.vue";
import UserMessage from "@/components/messages/UserMessage.vue";
import ModelSelector from "@/components/ModelSelector.vue";
import type { LlmConfig } from "@/types/llm";
import ArtifactPanel from './ArtifactPanel.vue'

// 会话ID（响应式）
const sessionId = computed(() => route.params.sessionId as string || chat.currentEditingSession.id)

// Artifact Panel Logic
const isArtifactOpen = ref(false)
const artifactWidth = ref(45) // percent
const currentArtifactContent = ref('')
const currentArtifactType = ref<'code' | 'preview' | 'document' | 'table' | 'image' | 'pdf'>('code')

const toggleArtifact = () => {
  isArtifactOpen.value = !isArtifactOpen.value
  if (isArtifactOpen.value) {
    currentArtifactType.value = 'code'
  }
}

const handleTurnDocumentEdit = (turn: Turn) => {
  const content = getAIContentFromTurn(turn)
  if (!content) {
    antMessage.warning('没有可编辑的内容')
    return
  }
  currentArtifactContent.value = content
  currentArtifactType.value = 'document'
  isArtifactOpen.value = true
}

const handleAttachmentClick = async (attachment: Attachment) => {
  const file = attachment.file
  const name = file.name.toLowerCase()
  
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
  } else if (name.endsWith('.md') || name.endsWith('.txt')) {
     const text = await file.text()
     currentArtifactContent.value = text
     currentArtifactType.value = 'document'
     isArtifactOpen.value = true
  } else {
     // Default code/text view
     const text = await file.text()
     currentArtifactContent.value = text
     currentArtifactType.value = 'code'
     isArtifactOpen.value = true
  }
}

import HanWelcome from '@/components/welcome/HanWelcome.vue'
import StandardWelcome from '@/components/welcome/StandardWelcome.vue'
import { AgentType } from '@/types/session'

import {computed, h, nextTick, onMounted, onUnmounted, ref, watch, onBeforeUnmount} from 'vue'
import {InputMode, useModeSwitch} from '@/composables/useModeSwitch'
import {BaseEventItem, EventType, UIMessage} from '@/types/events'
import {useChatStore} from '@/stores/chatStore'
import {generateMessageId, generateTempId} from '@/utils/idGenerator'
import ThinkingMessage from '@/components/messages/ThinkingMessage.vue'
import ThoughtMessage from '@/components/messages/ThoughtMessage.vue'
import ToolApprovalMessage from '@/components/messages/ToolApprovalMessage.vue'
import {useSSE} from '@/composables/useSSE'
import {notification, message as antMessage} from 'ant-design-vue'
import ErrorMessage from '@/components/messages/ErrorMessage.vue'
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

const isDevelopment = (import.meta as any).env?.DEV ?? false

// 共享状态（会话/Agent 选择）
const chat = useChatStore()

console.log('Current mode:', chat)
const inputMessage = ref('')
const attachments = ref<Attachment[]>([])
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

// 滚动相关
// 统一的滚动逻辑（优先使用容器滚动）
const scrollToBottom = () => {
  const container = chatContent.value
  if (container) {
    container.scrollTo({top: container.scrollHeight, behavior: 'smooth'})
  } else {
    // 降级：滚动窗口
    const doc = document.scrollingElement || document.documentElement
    window.scrollTo({top: doc.scrollHeight, behavior: 'smooth'})
  }
  
  // 滚动完成后更新按钮显示状态
  setTimeout(() => {
    updateScrollButtonVisibility()
  }, 300)
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

// 增强的通知处理
const handleDoneNotice = (node: {
  text: string;
  startTime: Date;
  title: string;
  messageId?: string,
  type: NotificationType
}) => {
  const key = `done-${node.startTime.getTime()}-${Math.random().toString(36).slice(2, 8)}`

  const onClick = () => locateByNode(node.messageId)

  const notificationConfig = {
    message: node.text,
    key,
    duration: 5,
    onClick,
    style: {
      borderRadius: '8px',
      backdropFilter: 'blur(10px)',
    }
  }

  switch (node.type) {
    case NotificationType.SUCCESS:
      notification.success({...notificationConfig, message: `✅ ${node.text}`})
      break
    case NotificationType.ERROR:
      notification.error({...notificationConfig, message: `❌ ${node.text}`})
      break
    case NotificationType.WARNING:
      notification.warning({...notificationConfig, message: `⚠️ ${node.text}`})
      break
    case NotificationType.INFO:
      notification.info({...notificationConfig, message: `ℹ️ ${node.text}`})
      break
    default:
      notification.info({...notificationConfig, message: `🔔 ${node.text}`})
      break
  }
}

// 使用带自定义处理器的 useSSE
let {
  nodeIndex,
  connectionStatus,
  taskStatus,
  progress,
  currentSessionId,
  executeReActPlus,
  closeActiveSource
} = useSSE({
  onDoneNotice: handleDoneNotice
 
})

// 从 store 中获取消息 - 基于当前会话ID计算
const messages = computed(() => {
  const id = sessionId.value
  return chat.getSessionMessages(id)
})

// 监听 sessionId 变化，确保消息被加载
// 当从 /chat 路径点击 session 时，需要确保消息被加载
// 这是一个兜底机制，确保即使 ChatGateway 的加载失败或延迟，消息也能被加载
watch(sessionId, async (newSessionId, oldSessionId) => {
  // ⚠️ 切换会话时，清空当前正在处理的 Turn ID，避免 progress 显示在新页面
  currentProcessingTurnId.value = null

  // 如果新会话ID无效，跳过
  if (!newSessionId || newSessionId.startsWith('temp-')) return

  // 等待一小段时间，让 ChatGateway 有机会先加载（避免重复加载）
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // 再次检查消息是否已加载
  const currentMessages = chat.getSessionMessages(newSessionId)
  
  // 如果消息仍然为空，则加载消息
  // 注意：即使 oldSessionId 是 undefined（首次从 /chat 点击 session），也需要加载
  if (currentMessages.length === 0) {
    console.log('[Index] 检测到会话切换且消息未加载，加载消息:', newSessionId, 'oldSessionId:', oldSessionId)
    await chat.loadSession(newSessionId)
  }
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

// 当前正在处理的 Turn ID（用于限制 progress 只在当前 turn 显示）
const currentProcessingTurnId = ref<string | null>(null)

// ====== 页面布局状态（仅用于空态 + 输入框定位，不影响既有消息/发送逻辑）======
// 有消息或正在处理时，视为“聊天已开始”（输入框贴底）
const isChatStarted = computed(() => messages.value.length > 0 || !!currentProcessingTurnId.value)
// 纯空态（无消息且不在处理中）：展示欢迎区 + 输入框居中 + chips
const isEmptyIdle = computed(() => messages.value.length === 0 && !currentProcessingTurnId.value)

// AI 刷新标记（用于在 STARTED 事件时自动切换到新分支）
const pendingAIRefresh = ref<{ userTurnId: string; timestamp: number } | null>(null)

// 检查某个 turn 是否正在处理（progress 在所有分支间共享）
// 优化后的逻辑：
// 1. 必须有 progress 文本
// 2. 必须有 currentProcessingTurnId（可以是 'pending' 或具体的 turnId）
// 3. 如果是 'pending'，显示在最后一个 turn 或空页面
// 4. 如果是具体 turnId，只在对应的 turn 显示
const isTurnProcessing = (turnIndex: number): boolean => {
  // 如果没有 progress 文本，不显示
  if (!progress.value?.text) return false

  // 如果没有正在处理的标记，不显示
  if (!currentProcessingTurnId.value) return false

  // ⚠️ 关键修复：对于 'pending' 状态，不需要检查 turn 是否存在
  // 只需要判断是否是最后一个索引即可
  if (currentProcessingTurnId.value === 'pending') {
    // 显示在最后一个 turn（通常是用户刚发送的消息）
    return turnIndex === turns.value.length - 1
  }

  // 对于具体的 turnId，需要精确匹配
  const turn = turns.value[turnIndex]
  if (!turn) return false

  // 如果已经有了具体的 turnId，只在该 turn 显示 progress
  return turn.id === currentProcessingTurnId.value
}

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


// 工具审批处理函数
const handleToolApproved = (approvalId: string, result: any) => {
  approvalResults.value.set(approvalId, {status: 'approved', result, startTime: new Date()})
  pendingApprovals.value.delete(approvalId)

  notification.success({
    message: '工具执行已批准',
    description: '工具将继续执行，请等待结果...',
    duration: 3
  })

}

const handleToolRejected = (approvalId: string, reason: string) => {
  approvalResults.value.set(approvalId, {status: 'rejected', reason, startTime: new Date()})
  pendingApprovals.value.delete(approvalId)

  notification.warning({
    message: '工具执行已拒绝',
    description: reason,
    duration: 3
  })

}

const handleToolError = (approvalId: string, error: Error) => {
  approvalResults.value.set(approvalId, {status: 'error', error: error.message, startTime: new Date()})

  notification.error({
    message: '工具执行失败',
    description: error.message,
    duration: 5
  })

}


const handleToolTerminateRequested = (approvalId: string, reason: string) => {
  approvalResults.value.set(approvalId, {status: 'terminated', reason, startTime: new Date()})
  pendingApprovals.value.delete(approvalId)

  notification.warning({
    message: '对话已终止',
    description: reason,
    duration: 6
  })

  // 终止当前任务和连接
  if (taskStatus.value.is('running')) {
    taskStatus.value.set('completed')
  }
  connectionStatus.value.set('disconnected')

  // 添加系统消息通知用户对话已终止
  messages.value.push({
    messageId: generateMessageId(),
    type: EventType.SYSTEM,
    sender: 'System',
    message: `**对话已终止**

${reason}

您可以开始新的对话或选择其他会话继续。`,
    startTime: new Date()
  })

  // 滚动到底部显示终止消息
  nextTick(() => {
    scrollToBottom()
  })
}


const handleErrorCopied = (success: boolean) => {
  if (success) {
    notification.success({
      message: '错误信息已复制',
      description: '错误详情已复制到剪贴板',
      duration: 2
    })
  } else {
    notification.error({
      message: '复制失败',
      description: '无法访问剪贴板，请手动选择文本复制',
      duration: 3
    })
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

// 监听消息变化，自动更新 currentProcessingTurnId（从 'pending' 变为真实 turnId）
watch(() => messages.value.length, () => {
  // 只有当前是 'pending' 状态时才需要更新
  if (currentProcessingTurnId.value !== 'pending') return

  // 查找最新的非用户消息（通常是 AI 的第一条回复）
  const latestAIMessage = [...messages.value]
    .reverse()
    .find(msg => msg.type !== EventType.USER && msg.turnId)

  if (latestAIMessage && latestAIMessage.turnId) {
    console.log('[Progress] 更新 currentProcessingTurnId:', latestAIMessage.turnId)
    currentProcessingTurnId.value = latestAIMessage.turnId
  }
})
  
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
  if (!inputMessage.value.trim() || isLoading.value) return

  // 如果是临时 ID（temp-开头），传空字符串给后端，让后端创建真实的 sessionId
  const backendSessionId = sessionId.value.startsWith('temp-') ? '' : sessionId.value

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
  progress.value = new ProgressInfo('正在拼命传递消息中...', new Date(), 'Han')
  // 标记当前正在处理的是新 turn（暂时使用 'pending' 表示等待后端分配）
  currentProcessingTurnId.value = 'pending'

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // 设置当前会话ID到 useSSE
    currentSessionId.value = sessionId.value

    await executeReActPlus(currentMessage, backendSessionId, parentTurnId, currentModelId)
  } catch (error) {
    console.error('发送消息失败:', error)
    const errorMessage: UIMessage = {
      messageId: generateMessageId(),
      type: EventType.ERROR,
      sender: 'System',
      message: '发送失败: ' + (error as Error).message,
      startTime: new Date()
    }
    const currentMessages = chat.getSessionMessages(sessionId.value)
    currentMessages.push(errorMessage)
    chat.setSessionMessages(sessionId.value, currentMessages)
    // 出错时手动设置任务状态
    taskStatus.value.set('error')
  } finally {
    // 清空已发送的附件
    attachments.value = []
    // 任务完成后清空当前处理的 Turn ID
    currentProcessingTurnId.value = null
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
      antMessage.warning('没有可复制的内容')
      return
    }

    await navigator.clipboard.writeText(content)
    antMessage.success('已复制到剪贴板')
  } catch (error) {
    antMessage.error('复制失败')
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
    antMessage.warning('消息内容不能为空')
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

  const userMessage: UIMessage = {
    messageId: messageId,
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
  progress.value = new ProgressInfo('正在拼命传递消息中...', new Date(), 'Han')
  currentProcessingTurnId.value = 'pending'

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // 设置当前会话ID
    currentSessionId.value = sessionId.value

    // 如果是临时 ID（temp-开头），传空字符串给后端，让后端创建真实的 sessionId
    const backendSessionId = sessionId.value.startsWith('temp-') ? '' : sessionId.value
    const currentModelId = chat.getSessionModelId(sessionId.value)

    console.log('[编辑确认] 调用 executeReActPlus:', {
      content: contentToSend,
      backendSessionId,
      parentTurnId: parentTurnIdToUse
    })

    // 使用被编辑 Turn 的 parentTurnId，从上一轮对话分叉创建新分支
    // 例如：编辑 Turn 3 (USER)，则新分支从 Turn 2 (ASSISTANT) 之后分叉
    await executeReActPlus(contentToSend, backendSessionId, parentTurnIdToUse, currentModelId)

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('编辑消息失败:', error)
    notification.error({
      message: '操作失败',
      description: '编辑消息失败: ' + (error as Error).message,
      duration: 5
    })
  } finally {
    currentProcessingTurnId.value = null
  }
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
      message: '无法重新生成',
      description: '找不到对应的用户消息',
      duration: 3
    })
    return
  }

  // 获取用户消息内容
  const userContent = getUserMessageFromTurn(userTurn)
  if (!userContent) {
    notification.warning({
      message: '无法重新生成',
      description: '用户消息为空',
      duration: 3
    })
    return
  }

  console.log('[重新生成] AI 刷新场景，parentTurnId:', userTurn.id, '用户消息:', userContent)

  // 立即设置 loading 和 progress 状态
  taskStatus.value.set('running')  // 立即显示 loading 效果
  progress.value = new ProgressInfo('正在拼命传递消息中...', new Date(), 'Han')
  currentProcessingTurnId.value = 'pending'
  
  // 标记当前是 AI 刷新操作（用于后端返回时自动切换分支）
  pendingAIRefresh.value = {
    userTurnId: userTurn.id,
    timestamp: Date.now()
  }

  try {
    currentSessionId.value = sessionId.value
    const backendSessionId = sessionId.value.startsWith('temp-') ? '' : sessionId.value
    const currentModelId = chat.getSessionModelId(sessionId.value)

    // 使用用户 Turn 的 ID 作为 parentTurnId，实现分支重新生成
    await executeReActPlus(userContent, backendSessionId, userTurn.id, currentModelId)

    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('重新生成失败:', error)
    
    notification.error({
      message: '操作失败',
      description: '重新生成失败: ' + (error as Error).message,
      duration: 5
    })
  } finally {
    currentProcessingTurnId.value = null
    pendingAIRefresh.value = null
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
  const snippet = '\n``javascript\n// 请输入代码\nconsole.log("Hello ReAct+");\n```\n'
  inputMessage.value += snippet
}

const removeAttachment = (name: string) => {
  attachments.value = attachments.value.filter(a => a.name !== name)
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

// NEW UI LOGIC
const uiModes = [
  { id: 'auto', label: 'Auto', icon: Rocket, desc: '自动选择最佳模型', value: 'multimodal' },
  { id: 'deep', label: '深度研究', icon: Brain, desc: '适合复杂任务和推理', value: 'geek' },
  { id: 'multi', label: '多模态', icon: ImageIcon, desc: '处理图像和文档', value: 'multimodal' },
  { id: 'web', label: '联网搜索', icon: Globe, desc: '获取最新实时信息', value: 'multimodal' },
]
const currentUiMode = ref(uiModes[0])
const showLeftMenu = ref(false)
const showRightMenu = ref(false)
const leftMenuRef = ref(null)
const rightMenuRef = ref(null)

// Sync UI mode with actual mode
watch(currentUiMode, (newMode) => {
    switchMode(newMode.value as any)
})

const handleModeSelect = (mode: any) => {
    currentUiMode.value = mode
    showRightMenu.value = false
}

onClickOutside(leftMenuRef, () => showLeftMenu.value = false)
onClickOutside(rightMenuRef, () => showRightMenu.value = false)

const textareaRef = ref<HTMLTextAreaElement | null>(null)
watch(inputMessage, () => {
    if (textareaRef.value) {
        textareaRef.value.style.height = 'auto'
        textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
    }
})


let gsapContext: gsap.Context | null = null

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
const setupInputContainerAdvancedAnimations = () => {
  const inputContainer = document.querySelector('.input-container')
  if (!inputContainer) return

  const textarea = inputContainer.querySelector('textarea')
  if (textarea) {
    let focusAnimation: gsap.core.Tween | null = null

    textarea.addEventListener('focus', () => {
      // 简化的聚焦效果
      focusAnimation = gsap.to(inputContainer, {
        borderColor: "rgba(107, 154, 152, 0.3)",
        y: -1,
        duration: 0.3,
        ease: 'power2.out'
      })
    })

    textarea.addEventListener('blur', () => {
      if (focusAnimation) {
        focusAnimation.kill()
      }

      gsap.to(inputContainer, {
        borderColor: "rgba(107, 154, 152, 0.15)",
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    })
  }
}

/**
 * Textarea 简化动画
 * 移除复杂的光晕效果，保留基本交互反馈
 */
const setupTextareaAdvancedAnimations = () => {
  const textarea = document.querySelector('.input-area textarea')
  if (!textarea) return

  let focusAnimation: gsap.core.Tween | null = null

  textarea.addEventListener('focus', () => {
    // 简化的聚焦效果
    focusAnimation = gsap.to(textarea, {
      scale: 1.001,
      duration: 0.2,
      ease: 'power2.out'
    })
  })

  textarea.addEventListener('blur', () => {
    if (focusAnimation) {
      focusAnimation.kill()
    }

    gsap.to(textarea, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out'
    })
  })
}

/**
 * 发送按钮简化动画 - 添加防抖优化
 * 移除复杂的呼吸和流光效果，保持简洁的交互反馈
 */
const setupSendButtonAdvancedAnimations = () => {
  const sendButton = document.querySelector('.send-button')
  if (!sendButton) return

  let hoverAnimation: gsap.core.Tween | null = null
  let isAnimating = false

  sendButton.addEventListener('mouseenter', () => {
    // 防抖：如果正在动画中，不重复执行
    if (isAnimating) return

    isAnimating = true
    // 简化的发送按钮悬浮效果
    hoverAnimation = gsap.to(sendButton, {
      y: -1,
      duration: 0.2,
      ease: 'power2.out',
      onComplete: () => {
        isAnimating = false
      }
    })
  })

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
  })
}

/**
 * 工具栏按钮简化动画 - 添加防抖优化
 * 移除复杂的涟漪创建，使用简单的缩放效果
 */
const setupToolbarAdvancedAnimations = () => {
  const toolbarButtons = document.querySelectorAll('.input-toolbar button')

  toolbarButtons.forEach(button => {
    let isAnimating = false

    button.addEventListener('mouseenter', () => {
      if (isAnimating) return

      isAnimating = true
      // 简化的悬浮效果
      gsap.to(button, {
        scale: 1.05,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          isAnimating = false
        }
      })
    })

    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          isAnimating = false
        }
      })
    })

    button.addEventListener('click', () => {
      // 简化的点击反馈 - 只在不是动画中时执行
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
    })
  })
}


const testInitPlan = () => {
  const plan = generateTestPlan()
  chat.setSessionPlan(sessionId.value, plan)
  chat.setPlanWidgetMode('ball')
  notification.success({
    message: '测试计划已创建',
    description: '已生成测试计划数据，状态球已显示'
  })
}

const testSimplePlan = () => {
  const plan = generateSimplePlan()
  chat.setSessionPlan(sessionId.value, plan)
  chat.setPlanWidgetMode('ball')
  notification.success({
    message: '简单计划已创建',
    description: '已生成简单测试计划数据，状态球已显示'
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
    // 1. 页面初始化 + 进度指示器
    initGSAPAnimations()


    // 2. 输入相关动画（合并基础和高级动画）
    setupInputContainerAdvancedAnimations()

    setupTextareaAdvancedAnimations()

    // 3. 发送按钮动画（只使用高级版本，避免重复）
    setupSendButtonAdvancedAnimations()

    // 4. 工具栏和附件动画
    setupToolbarAdvancedAnimations()


    // 监听滚动，控制下滑按钮显隐
    chatContent.value?.addEventListener('scroll', updateScrollButtonVisibility)
    // 同时监听窗口滚动作为兜底
    window.addEventListener('scroll', updateScrollButtonVisibility)

    // 初始化时滚到底部并隐藏按钮
    scrollToBottom()
    showScrollButton.value = false

  })
})

// 组件卸载前清理资源
onBeforeUnmount(() => {
  console.log('[Index] 组件卸载，清理资源')
  closeActiveSource()
  if (gsapContext) {
    gsapContext.revert()
    gsapContext = null
  }
})

// 组件卸载
onUnmounted(() => {
  chatContent.value?.removeEventListener('scroll', updateScrollButtonVisibility)
  window.removeEventListener('scroll', updateScrollButtonVisibility)

  // 清理所有 GSAP 动画，避免内存泄漏
  if (gsapContext) {
    gsapContext.revert()
    gsapContext = null
  }

  // 清理全局 GSAP 动画
  gsap.killTweensOf('*')
})
</script>

<template>
  <div ref="appContainer" :class="['react-plus-app', currentThemeClass]" class="relative flex flex-col h-screen overflow-hidden bg-[#FAFAFA] text-slate-800 font-sans selection:bg-orange-100 selection:text-orange-900">
    <!-- Plan 状态侧边栏 - 仅在 reactPlus 页面显示 -->
    <PlanWidget/>
    <!-- 🖥️ 极客模式：终端界面 -->
    <template v-if="isGeekMode">

      <div class="geek-mode-wrapper">
        <!-- 快速模式切换栏 -->
        <div class="geek-mode-header">
          <div class="mode-info">
            <span class="mode-label">极客模式</span>
            <span class="session-info">Session: {{ sessionId }}</span>
          </div>
          <div class="mode-actions">
            <button
                class="exit-geek-btn"
                @click="() => switchMode('multimodal')"
                title="退出极客模式"
            >
              退出
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
      <div class="absolute top-4 left-5 z-50">
        <ModelSelector
          :model-value="chat.selectedModelId"
          :disabled="isLoading"
          @update:model-value="handleModelChange"
          @change="handleModelSelect"
        />
      </div>

      <!-- 右侧面板开关 -->
<!--      <div class="absolute top-4 right-5 z-50">-->
<!--         <a-button -->
<!--           @click="toggleArtifact" -->
<!--           title="Toggle Artifact Panel"-->
<!--         >-->
<!--         <template #icon>-->
<!--          <PanelRight class="size-4 m-auto" />-->
<!--          </template>-->
<!--         </a-button>-->
<!--      </div>-->

      <!-- 主要内容区域 (Flex Row Wrapper) -->
      <div class="main-flex-container flex-1 flex min-w-0 overflow-hidden relative w-full h-full">

        <!-- 左侧/中间：Chat Area -->
        <div class="flex-1 flex flex-col min-w-0 relative h-full transition-all duration-300">
            
            <div class="main-content flex flex-col h-full min-h-0">
              <!-- 对话区域 -->
              <div class="chat-container relative flex-1 min-h-0 overflow-y-auto scroll-smooth pb-[180px]" ref="chatContent" data-chat-content>

                <!-- Welcome Screen -->
                <div v-if="isEmptyIdle" class="absolute inset-x-0 top-[15%] px-4 transition-all duration-500 ease-in-out">
                  <div class="flex flex-col items-center justify-center pointer-events-auto">
                    <component
                        :is="currentWelcomeComponent"
                        @suggestion-click="handleSuggestionClick"
                    />
                  </div>
                </div>

                <!-- 消息列表 -->
                <div v-else class="pb-32">
                  <div
                      v-for="(turn, turnIndex) in turns"
                      :key="turn.id"
                      :id="turn.id ? turn.id : undefined"
                      class="turn-wrapper group relative flex items-start justify-center"
                  >
                     <!-- Turn Content (Same as before) -->
                     <div class="w-full">
                        <!-- Turn Header Shimmer -->
                        <div v-if="turn.messages[0].type !== EventType.USER" class="w-[770px] ml-auto mr-auto relative">
                          <Shimmer v-if="isTurnProcessing(turnIndex)">
                            <span>{{ progress?.text }}</span>
                          </Shimmer>
                        </div>

                        <!-- Edit Box -->
                        <div v-if="editingTurnId === turn.id && isUserTurn(turn)" class="w-[770px] ml-auto mr-auto mb-4">
                           <!-- ... Edit Box Content ... -->
                             <div class="edit-box-glass flex flex-col gap-3 p-4 rounded-xl border border-white/20 shadow-lg backdrop-blur-md">
                                <a-textarea v-model:value="editingContent" :auto-size="{ minRows: 2, maxRows: 8 }" class="glass-input rounded-lg text-slate-700" placeholder="编辑消息内容..." @keydown.ctrl.enter="handleTurnEditConfirm(turn)" @keydown.esc="handleTurnEditCancel" />
                                <div class="flex gap-2 justify-end">
                                  <a-button size="small" class="glass-btn-cancel" @click="handleTurnEditCancel">取消</a-button>
                                  <a-button size="small" type="primary" class="glass-btn-primary" @click="handleTurnEditConfirm(turn)">确认编辑并发送</a-button>
                                </div>
                              </div>
                        </div>

                        <!-- Messages -->
                        <div class="message-wrapper gap-3" v-else>
                           <template v-for="(message, messageIndex) in turn.messages" :key="message.messageId || ``" :id="message.messageId ? 'msg-' + message.messageId : undefined">
                              <UserMessage v-if="message.type === EventType.USER" :message="message" class="message-item " />

                              <!-- ⚠️ USER turn 等待 AI 回复时的 Progress 显示 -->
                              <div v-if="message.type === EventType.USER && isTurnProcessing(turnIndex) && currentProcessingTurnId === 'pending'" class="w-[770px] ml-auto mr-auto relative mt-4">
                                <Shimmer>
                                  <span>{{ progress?.text }}</span>
                                </Shimmer>
                              </div>

                              <ThinkingMessage v-else-if="message.type === EventType.THINKING" :message="message" :is-thinking="!message.endTime" class="message-item " />
                              <ThoughtMessage v-else-if="message.type === EventType.THOUGHT" :message="message" class="message-item " />
                              <div v-else-if="message.type === EventType.PROGRESS" class="message-item flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50/50 border border-primary-100">
                                <LoadingOutlined class="text-primary-500 text-lg animate-spin" />
                                <span class="text-sm text-primary-700">{{ message.message || '正在生成回复...' }}</span>
                              </div>
                              <ToolMessage v-else-if="message.type === EventType.TOOL" :message="message" class="message-item"></ToolMessage>
                              <ToolApprovalMessage v-else-if="message.type === EventType.TOOL_APPROVAL" :message="message" @approved="handleToolApproved(message.messageId!, $event)" @rejected="handleToolRejected(message.messageId!, $event)" @error="handleToolError(message.messageId!, $event)" @terminateRequested="handleToolTerminateRequested(message.messageId!, $event)" class="message-item"/>
                              <ErrorMessage v-else-if="message.type === EventType.ERROR" :message="message" @copied="handleErrorCopied" class="message-item"/>
                              <CommonMessage v-else-if="message.type === EventType.ASSISTANT || message.type === EventType.ACTING" :message="message" class="message-item "/>
                           </template>
                           
                           <!-- Message Branch & Toolbar -->
                           <MessageBranch v-if="hasSiblingBranches(turn)" :default-branch="turn.siblingIndex" :total-branches="turn.siblingCount" @branch-change="(index: number) => handleBranchChange(turn, index)" class="w-[780px] ml-auto mr-auto">
                              <MessageToolbar class="!mt-1 py-1 opacity-0 group-hover:opacity-100! hover:opacity-100! transition-opacity duration-200 justify-start" :class="isUserTurn(turn) ? 'flex-row-reverse' : ''">
                                <MessageBranchSelector :from="isUserTurn(turn) ? 'user' : 'assistant'">
                                  <MessageBranchPrevious />
                                  <MessageBranchPage />
                                  <MessageBranchNext />
                                </MessageBranchSelector>
                                <MessageActions>
                                  <template v-if="isUserTurn(turn)">
                                    <a-tooltip title="复制">
                                      <MessageAction type="text"  shape="circle" class="!text-slate-500 hover:!text-green-500" @click="handleTurnCopy(turn)"><Copy class="size-4 m-auto" /></MessageAction>
                                    </a-tooltip>
                                    <a-tooltip title="编辑">
                                      <MessageAction type="text"  shape="circle" class="!text-slate-500 hover:!text-green-500" @click="handleTurnEditStart(turn)"><PenLine class="size-4 m-auto" /></MessageAction>
                                    </a-tooltip>
                                  </template>
                                  <template v-else>
                                    <a-tooltip title="复制">
                                      <a-button type="text"  shape="circle" class="!text-slate-500 hover:!text-blue-500" @click="handleTurnCopy(turn)">
                                        <template #icon><Copy class="size-4 m-auto" /></template>
                                      </a-button>
                                    </a-tooltip>
                                    <a-tooltip title="重新生成">
                                      <a-button  type="text" shape="circle" class="!text-slate-500 hover:!text-blue-500" @click="handleTurnRegenerate(turn, turnIndex)">
                                         <template #icon><RefreshCcw  class="size-4 m-auto" /></template>
                                      </a-button>
                                    </a-tooltip>
                                    <a-tooltip title="文档编辑">
                                      <a-button type="text"  shape="circle" class="!text-slate-500 hover:!text-blue-500" @click="handleTurnDocumentEdit(turn)">
                                          <template #icon><PenLine class="size-4 m-auto" /></template>
                                      </a-button>
                                    </a-tooltip>
                                  </template>
                                </MessageActions>
                              </MessageToolbar>
                           </MessageBranch>
                           
                           <!-- No Branch Toolbar -->
                           <div v-else class="turn-actions w-[780px] ml-auto mr-auto flex gap-1 py-1 opacity-0 group-hover:opacity-100! hover:opacity-100! transition-opacity duration-200" :class="isUserTurn(turn) ? 'justify-end' : 'justify-start'">
                              
                              <template v-if="isUserTurn(turn)">
                                <a-tooltip title="复制">
                                <a-button type="text" shape="circle" class="!text-slate-500 hover:!text-green-500" @click="handleTurnCopy(turn)"><template #icon><Copy class="size-4 m-auto" /></template></a-button>
                                </a-tooltip>
                                <a-tooltip title="编辑">
                                  <a-button type="text" shape="circle" class="!text-slate-500 hover:!text-green-500" @click="handleTurnEditStart(turn)"><template #icon><EditOutlined /></template></a-button>
                                </a-tooltip>
                              </template>
                              <template v-else>
                                <a-tooltip title="复制">
                                  <a-button type="text" shape="circle" class="!text-slate-500 hover:!text-blue-500" @click="handleTurnCopy(turn)"><template #icon><Copy class="size-4 m-auto" /></template></a-button>
                                </a-tooltip>
                                <a-tooltip title="重新生成">
                                  <a-button type="text" shape="circle" class="!text-slate-500 hover:!text-blue-500" @click="handleTurnRegenerate(turn, turnIndex)" :loading="isLoading"><template #icon><RefreshCcw  class="size-4 m-auto" /></template></a-button>
                                </a-tooltip>
                                <a-tooltip title="文档编辑">
                                  <a-button type="text" shape="circle" class="!text-slate-500 hover:!text-blue-500" @click="handleTurnDocumentEdit(turn)"><template #icon><PenLine class="size-4 m-auto" /></template></a-button>
                                </a-tooltip>
                              </template>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

              </div>

              <!-- 滚动到底部按钮 -->
              <Transition name="fade">
                <div v-show="showScrollButton" class="scroll-to-bottom" @click="scrollToBottom">
                  <a-button type="primary" shape="circle" :icon="h(ArrowDownOutlined)"/>
                </div>
              </Transition>
            </div>

            <!-- 输入区域（空态居中 / 聊天态贴底） -->
            <div
              class="absolute left-0 right-0 z-40 p-4 flex flex-col items-center justify-center pointer-events-none transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
              :class="isChatStarted
                ? 'bottom-0 pb-6'
                : 'bottom-[35vh]'
              "
            >
               <!-- PlanQueue（仅聊天态展示，避免空态挤压输入框居中布局） -->
               <div v-if="isChatStarted" class="w-[830px] mx-auto px-2 md:px-0 pointer-events-auto mb-1">
                 <PlanQueue />
               </div>

               <!-- Input Container -->
               <div class="w-[830px] px-2 md:px-0 mx-auto pointer-events-auto">
                   <div 
                      class="input-container input-area pr-4 relative flex items-center bg-white rounded-[32px] border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 group flex items-end pl-3 pr-2 py-2 gap-2"
                      @dragover.prevent
                      @drop="onDropFiles"
                   >
                      
                      <!-- 1. Left Action Button (+) -->
                      <div class="relative mb-0.5" ref="leftMenuRef">
                          <button
                              @click="showLeftMenu = !showLeftMenu"
                              class="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                              :class="{'bg-slate-100 text-slate-800': showLeftMenu}"
                          >
                              <Plus :size="20" />
                          </button>

                          <!-- Context Fill Menu -->
                          <div v-if="showLeftMenu" class="absolute bottom-12 left-0 bg-white border border-slate-200 rounded-2xl shadow-xl w-56 p-2 animate-fade-in-up origin-bottom-left flex flex-col gap-1 z-50">
                              <button @click="fileInput?.click()" class="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors">
                                  <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><UploadCloud :size="16"/></div>
                                  <div>
                                      <div class="text-sm font-medium text-slate-700">上传文件</div>
                                      <div class="text-[10px] text-slate-400">PDF, Excel, Images</div>
                                  </div>
                              </button>
                              <button @click="insertCodeBlock" class="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors">
                                  <div class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><FilePlus :size="16"/></div>
                                  <div>
                                      <div class="text-sm font-medium text-slate-700">添加文本内容</div>
                                      <div class="text-[10px] text-slate-400">粘贴或输入上下文</div>
                                  </div>
                              </button>
                              <div class="h-px bg-slate-100 my-1"></div>
                              <button class="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-slate-50 rounded-xl text-left transition-colors">
                                  <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500"><Link :size="16"/></div>
                                  <div>
                                      <div class="text-sm font-medium text-slate-700">连接 Google Drive</div>
                                      <div class="text-[10px] text-slate-400">导入云端文件</div>
                                  </div>
                              </button>
                          </div>
                      </div>

                      <!-- 2. Input Field (Centered & Auto-Resizing) -->
                      <textarea 
                        ref="textareaRef"
                        v-model="inputMessage"
                        @keydown.enter.prevent="onPressEnter"
                        @paste="onPaste"
                        placeholder="Ask anything..." 
                        class="flex-1 bg-transparent border-0 text-slate-700 text-base leading-relaxed placeholder:text-slate-400 py-2 px-2 min-h-[44px] max-h-[200px] resize-none focus:ring-0 outline-none"
                        rows="1"
                      />

                      <!-- 3. Right Action Area (Mode + Send) -->
                      <div class="flex items-center gap-2 mb-0.5">
                          
                          <!-- Execution Function Selector -->
                          <div class="relative" ref="rightMenuRef">
                              <button 
                                  @click="showRightMenu = !showRightMenu"
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                                  :class="showRightMenu ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
                              >
                                  <component :is="currentUiMode.icon" :size="16" :class="currentUiMode.id === 'auto' ? 'text-orange-500' : 'text-slate-700'" />
                                  <span>{{ currentUiMode.label }}</span>
                                  <ChevronDown :size="14" class="opacity-50" />
                              </button>

                              <!-- Mode Selection Menu -->
                              <div v-if="showRightMenu" class="absolute bottom-12 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl w-64 p-2 animate-fade-in-up origin-bottom-right flex flex-col gap-1 z-50">
                                  <div class="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">选择执行模式</div>
                                  <button 
                                      v-for="mode in uiModes"
                                      :key="mode.id"
                                      @click="handleModeSelect(mode)"
                                      class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors"
                                      :class="currentUiMode.id === mode.id ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-slate-50'"
                                  >
                                      <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="currentUiMode.id === mode.id ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'">
                                          <component :is="mode.icon" :size="16"/>
                                      </div>
                                      <div>
                                          <div class="text-sm font-medium" :class="currentUiMode.id === mode.id ? 'text-orange-900' : 'text-slate-700'">{{ mode.label }}</div>
                                          <div class="text-[10px] text-slate-400">{{ mode.desc }}</div>
                                      </div>
                                      <div v-if="currentUiMode.id === mode.id" class="ml-auto w-2 h-2 rounded-full bg-orange-500"></div>
                                  </button>
                              </div>
                          </div>

                          <!-- Separator -->
                          <div class="w-px h-5 bg-slate-200 mx-1"></div>

                          <!-- Send Button (Grok Style - Black Circle) -->
                           
                          <button 
                            @click="sendMessage"

                            class="send-button w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm"
                            :class="(canSend || isLoading) ? 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105' : 'bg-slate-100 text-slate-300 cursor-not-allowed'"
                            :disabled="!canSend && !isLoading"
                          >
                            <Loader2 v-if="isLoading" :size="16" class="animate-spin text-white" />
                            <Send v-else :size="16" :class="canSend ? 'ml-0.5' : ''" />
                          </button>
                      </div>
                   </div>
                   
                   <!-- Bottom hint text -->
                   <div class="text-center mt-3 transition-opacity duration-500" :class="isChatStarted ? 'opacity-100' : 'opacity-0 h-0'">
                       <p class="text-[10px] text-slate-400 font-medium tracking-wide opacity-60">
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
                   @click="handleSuggestionClick('请帮我分析一下这个项目的目录结构，并给出优化建议。')"
                   class="group px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-sm font-medium hover:border-orange-400 hover:text-orange-600 hover:shadow-md transition-all duration-200 flex items-center gap-2"
                 >
                   <span class="p-1 bg-orange-50 rounded-full text-orange-500 group-hover:bg-orange-100 transition-colors">
                     <Zap :size="14" />
                   </span>
                   分析代码
                 </button>
                 <button
                   @click="handleSuggestionClick('请帮我写一个 Vue 3 的计数器组件，使用 Composition API。')"
                   class="group px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-sm font-medium hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all duration-200 flex items-center gap-2"
                 >
                   <span class="p-1 bg-blue-50 rounded-full text-blue-500 group-hover:bg-blue-100 transition-colors">
                     <Code :size="14" />
                   </span>
                   生成组件
                 </button>
                 <button
                   @click="handleSuggestionClick('请解释一下什么是 React Hooks，以及常用的 Hooks 有哪些？')"
                   class="group px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-sm font-medium hover:border-green-400 hover:text-green-600 hover:shadow-md transition-all duration-200 flex items-center gap-2"
                 >
                   <span class="p-1 bg-green-50 rounded-full text-green-500 group-hover:bg-green-100 transition-colors">
                     <FileText :size="14" />
                   </span>
                   文档解释
                 </button>
               </div>
            </div>

        </div>

        <!-- Right: Artifact Panel -->
        <Transition name="panel-slide">
        <div 
          v-if="isArtifactOpen" 
          class="h-full bg-white shadow-xl z-20 flex-shrink-0 border-l border-gray-100" 
          :style="{ width: artifactWidth + '%', minWidth: '320px', maxWidth: '70%' }"
        >
             <ArtifactPanel 
               :isOpen="isArtifactOpen" 
               @close="isArtifactOpen = false" 
               :content="currentArtifactContent"
               @update:content="currentArtifactContent = $event"
               :type="currentArtifactType"
             />
        </div>
        </Transition>

      </div>

      <!-- 隐藏文件输入 -->
      <input
          type="file"
          ref="fileInput"
          style="display: none"
          multiple
          accept=".txt,.md,.markdown,.java,.kt,.scala,.py,.go,.js,.mjs,.cjs,.ts,.tsx,.json,.yml,.yaml,.xml,.html,.css,.scss,.less,.vue,.svelte,.c,.cpp,.h,.hpp,.cs,.rs,.php,.rb,.swift,.m,.mm,.sql,.sh,.bat,.ps1,.ini,.conf,.log,.pdf,image/*"
          @change="onFileChange"
      />

    </template>

  </div>
</template>

<style scoped lang="scss">
@use './Index.scss' as *;
@use './EditBox.scss' as *;

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(20px); /* Just a bit, not 100% to keep it subtle like the sidebar ref? Or fully offscreen? Ref sidebar uses -translate-x-full. Let's use 100% for the right panel to slide in fully. */
  transform: translateX(100%);
  opacity: 0;
}
</style>
