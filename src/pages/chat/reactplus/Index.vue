<script setup lang="ts">

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
import {
  ArrowDownOutlined,
  CodeOutlined,
  CopyOutlined,
  EditOutlined,
  FileTextOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  RedoOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  ThunderboltOutlined
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
import { RefreshCcwIcon } from 'lucide-vue-next'
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
import CommonMessage from "@/components/messages/CommonMessage.vue";
import UserMessage from "@/components/messages/UserMessage.vue";

// 处理建议点击
const handleSuggestionClick = (prompt: string) => {
  inputMessage.value = prompt
  // 聚焦输入框
  nextTick(() => {
    const textarea = document.querySelector('.input-area textarea') as HTMLTextAreaElement
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

// AI 刷新标记（用于在 STARTED 事件时自动切换到新分支）
const pendingAIRefresh = ref<{ userTurnId: string; timestamp: number } | null>(null)

// 检查某个 turn 是否正在处理（progress 在所有分支间共享）
// 只要有 progress 且是当前激活路径的最后一个 turn，就显示
const isTurnProcessing = (turnIndex: number): boolean => {
  // 如果没有 progress，不显示
  if (!progress.value?.text) return false
  
  // 如果不在执行中，不显示
  if (!currentProcessingTurnId.value) return false
  
  // 只在当前激活路径的最后一个 turn 显示 progress
  return turnIndex === turns.value.length - 1
}

// ========== 分支管理状态 ==========
// 每个分支点当前选中的子分支索引：Map<parentTurnId, selectedChildIndex>
const activeBranchByParent = ref<Map<string, number>>(new Map())

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

  // 调试：输出 turn 树结构
  console.log('[turns computed] 结果:', result.map(t => ({
    id: t.id.substring(0, 8) + '...',
    parentTurnId: t.parentTurnId?.substring(0, 8) + '...',
    siblingCount: t.siblingCount,
    siblingIndex: t.siblingIndex,
    type: t.messages[0]?.type
  })))

  return result
})

// 检查某个 turn 是否有兄弟分支（用于显示分支选择器）
const hasSiblingBranches = (turn: TurnTreeNode): boolean => {
  const result = turn.siblingCount > 1
  if (result) {
    console.log('[分支检测] Turn 有兄弟分支:', {
      turnId: turn.id,
      parentTurnId: turn.parentTurnId,
      siblingCount: turn.siblingCount,
      siblingIndex: turn.siblingIndex,
      isUserTurn: turn.messages[0]?.type === EventType.USER
    })
  }
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
  activeBranchByParent.value.set(key, newIndex)
  console.log('[分支切换] key:', key, 'newIndex:', newIndex)
}

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
  activeBranchByParent.value.set(key, newIndex)
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
  activeBranchByParent.value.set(key, newIndex)
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

// 会话ID（响应式）
const sessionId = computed(() => route.params.sessionId as string || chat.currentEditingSession.id)

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
  if (!inputMessage.value.trim() || isLoading.value) return

  // 如果是临时 ID（temp-开头），传空字符串给后端，让后端创建真实的 sessionId
  const backendSessionId = sessionId.value.startsWith('temp-') ? '' : sessionId.value

  // 获取当前激活路径上最后一个 turn 的 ID 作为 parentTurnId
  // 这样新消息会接在当前对话分支的末尾
  const lastTurn = turns.value.length > 0 ? turns.value[turns.value.length - 1] : null
  const parentTurnId = lastTurn?.id

  // 生成消息 ID
  const messageId = generateMessageId()

  const userMessage: UIMessage = {
    messageId: messageId,
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

  // 立即设置 progress 状态（请求发送前就显示）
  progress.value = new ProgressInfo('正在拼命传递消息中...', new Date(), 'Han')
  // 标记当前正在处理的是新 turn（暂时使用 'pending' 表示等待后端分配）
  currentProcessingTurnId.value = 'pending'

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  try {
    // 设置当前会话ID到 useSSE
    currentSessionId.value = sessionId.value


    await executeReActPlus(currentMessage, backendSessionId, parentTurnId)
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

  // 立即设置 progress 状态
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

    console.log('[编辑确认] 调用 executeReActPlus:', {
      content: contentToSend,
      backendSessionId,
      parentTurnId: parentTurnIdToUse
    })

    // 使用被编辑 Turn 的 parentTurnId，从上一轮对话分叉创建新分支
    // 例如：编辑 Turn 3 (USER)，则新分支从 Turn 2 (ASSISTANT) 之后分叉
    await executeReActPlus(contentToSend, backendSessionId, parentTurnIdToUse)

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

  // 立即设置 progress 状态
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

    // 使用用户 Turn 的 ID 作为 parentTurnId，实现分支重新生成
    await executeReActPlus(userContent, backendSessionId, userTurn.id)

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

// ========== 3. 消息出现动画 - 青龙升腾 ==========
const animateMessageEntry = (element: HTMLElement) => {
  // 先清理可能存在的旧动画
  gsap.killTweensOf(element)

  gsap.fromTo(element,
      {
        opacity: 0.9,
        y: 20,
        scale: 0.98
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.2)",
        clearProps: "all"
      }
  )
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
  <div ref="appContainer" :class="['react-plus-app', currentThemeClass]">
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
      <!-- 主要内容区域 -->
      <div class="main-content flex flex-col h-full min-h-0">

        <!-- 对话区域 -->
        <div class="chat-container flex-1 min-h-0 overflow-y-auto scroll-smooth" ref="chatContent" data-chat-content>


          <!-- Welcome Screen (Placeholder) -->
          <div v-if="messages.length === 0 && !currentProcessingTurnId" class="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
            <component
                :is="currentWelcomeComponent"
                @suggestion-click="handleSuggestionClick"
            />
          </div>

          <!-- 正在发送中但消息还没来时的占位 -->
          <div v-else-if="messages.length === 0 && currentProcessingTurnId" class="pb-32">
            <div class="w-[770px] ml-auto mr-auto py-4">
              <Shimmer><span>{{ progress?.text || '正在拼命传递消息中...' }}</span></Shimmer>
            </div>
          </div>

          <div v-else class="pb-32">
            <div
                v-for="(turn, turnIndex) in turns"
                :key="turn.id"
                :id="turn.id ? turn.id : undefined"
                class="turn-wrapper group relative flex items-start justify-center"
            >

              <div class="w-full">

                <!-- Turn Header - 只在最后一个 AI Turn 且正在处理时显示 Shimmer -->
                <div v-if="turn.messages[0].type !== EventType.USER" class="w-[770px] ml-auto mr-auto relative">
                  <Shimmer
                      v-if="isTurnProcessing(turnIndex)"
                  >
                    <span>{{ progress?.text }}</span>
                  </Shimmer>
                </div>

                <!-- 编辑模式：用户 Turn 编辑框 -->
                <div
                    v-if="editingTurnId === turn.id && isUserTurn(turn)"
                    class="w-[770px] ml-auto mr-auto mb-4"
                >
                  <div class="flex flex-col gap-2 p-4 bg-white/80 rounded-xl border border-primary-100 shadow-sm">
                    <a-textarea
                        v-model:value="editingContent"
                        :auto-size="{ minRows: 2, maxRows: 8 }"
                        class="rounded-lg"
                        placeholder="编辑消息内容..."
                        @keydown.ctrl.enter="handleTurnEditConfirm(turn)"
                        @keydown.esc="handleTurnEditCancel"
                    />
                    <div class="flex gap-2 justify-end">
                      <a-button size="small" @click="handleTurnEditCancel">
                        取消
                      </a-button>
                      <a-button size="small" type="primary" @click="handleTurnEditConfirm(turn)">
                        确认编辑并发送
                      </a-button>
                    </div>
                  </div>
                </div>

                <!-- 正常模式：显示消息 -->
                <div class="message-wrapper gap-3" v-else>
                  <!-- Messages in this turn -->
                  <template
                      v-for="(message, messageIndex) in turn.messages"
                      :key="message.messageId || ``"
                      :id="message.messageId ? 'msg-' + message.messageId : undefined"
                  >
                    <UserMessage
                        v-if="message.type === EventType.USER"
                        :message="message"
                        class="message-item "
                    />
                    <!-- Thinking 消息 - 使用折叠组件 -->
                    <ThinkingMessage
                        v-else-if="message.type === EventType.THINKING"
                        :message="message"
                        :is-thinking="!message.endTime"
                        class="message-item "
                    />

                    <!-- THOUGHT 消息 - 使用 ChainOfThought 组件 -->
                    <ThoughtMessage
                        v-else-if="message.type === EventType.THOUGHT"
                        :message="message"
                        class="message-item "
                    />

                    <!-- PROGRESS 消息 - 占位 loading 状态 -->
                    <div 
                        v-else-if="message.type === EventType.PROGRESS"
                        class="message-item flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-50/50 border border-primary-100"
                    >
                      <LoadingOutlined class="text-primary-500 text-lg animate-spin" />
                      <span class="text-sm text-primary-700">
                        {{ message.message || '正在生成回复...' }}
                      </span>
                    </div>

                    <!-- 工具调用消息 -->
                    <ToolMessage v-else-if="message.type === EventType.TOOL"
                                 :message="message"
                                 class="message-item"
                    ></ToolMessage>

                    <!-- 工具审批消息 -->
                    <ToolApprovalMessage
                        v-else-if="message.type === EventType.TOOL_APPROVAL"
                        :message="message"
                        @approved="handleToolApproved(message.messageId!, $event)"
                        @rejected="handleToolRejected(message.messageId!, $event)"
                        @error="handleToolError(message.messageId!, $event)"
                        @terminateRequested="handleToolTerminateRequested(message.messageId!, $event)"
                        class="message-item"
                    />
                    <!-- 错误消息 - 使用专用组件 -->
                    <ErrorMessage
                        v-else-if="message.type === EventType.ERROR"
                        :message="message"
                        @copied="handleErrorCopied"
                        class="message-item"
                    />
                    <!-- Assistant 消息（包含 THOUGHT 和 TASK_ANALYSIS） -->
                    <CommonMessage
                        v-else-if="message.type === EventType.ASSISTANT || message.type === EventType.ACTING"
                        :message="message"
                        class="message-item "
                    />
                  </template>

                  <!-- Turn 级别操作按钮栏（悬浮显示） -->
                  <MessageBranch
                      v-if="hasSiblingBranches(turn)"
                      :default-branch="turn.siblingIndex"
                      :total-branches="turn.siblingCount"
                      @branch-change="(index: number) => handleBranchChange(turn, index)"
                      class="w-[780px] ml-auto mr-auto"
                  >
                    <MessageToolbar
                        class="!mt-1 py-1 opacity-0 group-hover:opacity-100! hover:opacity-100! transition-opacity duration-200 justify-start"
                        :class="isUserTurn(turn) ? 'flex-row-reverse' : ''"
                    >
                      <!-- 分支选择器 -->
                      <MessageBranchSelector :from="isUserTurn(turn) ? 'user' : 'assistant'">
                        <MessageBranchPrevious />
                        <MessageBranchPage />
                        <MessageBranchNext />
                      </MessageBranchSelector>

                      <!-- 操作按钮 -->
                      <MessageActions>
                        <!-- 复制 -->
                        <MessageAction
                            label="复制"
                            @click="handleTurnCopy(turn)"
                        >
                          <CopyOutlined class="size-4" />
                        </MessageAction>

                        <!-- 用户 Turn：编辑 -->
                        <MessageAction
                            v-if="isUserTurn(turn)"
                            label="编辑"
                            @click="handleTurnEditStart(turn)"
                        >
                          <EditOutlined class="size-4" />
                        </MessageAction>

                        <!-- AI Turn：重新生成 -->
                        <MessageAction
                            v-else
                            label="重新生成"
                            @click="handleTurnRegenerate(turn, turnIndex)"
                        >
                          <RefreshCcwIcon class="size-4" />
                        </MessageAction>
                      </MessageActions>
                    </MessageToolbar>
                  </MessageBranch>

                  <!-- 无分支时的简单操作栏 -->
                  <div
                      v-else
                      class="turn-actions w-[780px] ml-auto mr-auto flex gap-1 py-1
                        opacity-0 group-hover:opacity-100! hover:opacity-100! transition-opacity duration-200"
                      :class="isUserTurn(turn) ? 'justify-end' : 'justify-start'"
                  >
                    <!-- 复制按钮 -->
                    <a-button
                        type="text"
                        shape="circle"
                        class="!text-slate-400 hover:!text-blue-500"
                        @click="handleTurnCopy(turn)"
                    >
                      <template #icon>
                        <CopyOutlined />
                      </template>
                    </a-button>

                    <!-- 用户 Turn：编辑 -->
                    <template v-if="isUserTurn(turn)">
                      <a-button
                          type="text"
                          shape="circle"
                          class="!text-slate-400 hover:!text-green-500"
                          @click="handleTurnEditStart(turn)"
                      >
                        <template #icon>
                          <EditOutlined />
                        </template>
                      </a-button>
                    </template>

                    <!-- AI Turn：重新生成 -->
                    <template v-else>
                      <a-button
                          type="text"
                          shape="circle"
                          class="!text-slate-400 hover:!text-primary-500"
                          @click="handleTurnRegenerate(turn, turnIndex)"
                          :loading="isLoading"
                      >
                        <template #icon>
                          <RedoOutlined />
                        </template>
                      </a-button>
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

      <div
          class=" w-[830px] sticky bottom-1.5 z-30 px-2 md:px-0  mx-auto
            input-container overflow-hidden rounded-2xl border border-primary-50 backdrop-blur-xl
            shadow-lg transition-colors"
          @dragover.prevent
          @drop="onDropFiles"
      >

        <!-- 📎 附件预览区域 - 仅在有附件时显示 -->

        <div v-if="attachments.length" class="mode-selector flex items-center gap-3 px-5 py-3 flex gap-2 px-4 py-2">
          <div class="flex items-center gap-2">
            <div v-for="attachment in attachments" :key="attachment.name"
                 class="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-200 rounded-md text-xs shadow-sm">
              <FileTextOutlined class="text-blue-500 text-xs"/>
              <span class="text-blue-700 font-medium truncate max-w-[100px]">{{ attachment.name }}</span>
              <span class="text-blue-400">{{ bytes(attachment.size) }}KB</span>
              <button
                  @click="removeAttachment(attachment.name)"
                  class="text-blue-400 hover:text-red-500 ml-1 font-bold text-sm leading-none"
              >×
              </button>
            </div>
          </div>
        </div>


        <!-- 输入区域（textarea + 发送按钮 + 工具栏） -->
        <div class="input-area relative flex flex-col justify-between px-4 pb-2 bg-transparent w-full">
          <a-textarea
              v-model:value="inputMessage"
              :maxlength="4000"
              :auto-size="{ minRows: 1, maxRows: 2 }"
              placeholder="请输入您的问题..."
              :disabled="isLoading"
              :bordered="false"
              class="w-full text-slate-800 text-sm leading-6 font-normal bg-transparent outline-none focus:outline-none"
              @pressEnter="onPressEnter"
              @paste="onPaste"
          />
          <button
              :disabled="!canSend"
              @click="sendMessage"
              class="send-button absolute right-4 top-1/2 w-10 h-10 -translate-y-1/2 rounded-[50%] font-semibold"
          >
            <SendOutlined class="rotate-330 m-auto pl-1 pt-1 text-lg" v-if="!isLoading"/>
            <LoadingOutlined class="m-auto text-lg" v-else/>
          </button>

          <!-- 工具按钮组 -->
          <div class="input-toolbar mt-1 flex items-center gap-1 text-slate-500 text-sm">
            <a-button type="text" size="large" @click="handleUploadClick" :icon="h(PaperClipOutlined)"/>
            <input ref="fileInput" type="file" class="hidden" multiple @change="onFileChange"/>
            <a-button type="text" size="large" @click="insertCodeBlock" :icon="h(CodeOutlined)"/>

            <!-- 模式切换与功能设置下拉菜单 -->
            <a-dropdown placement="topLeft" trigger="click">
              <a-button type="text" size="large" :icon="h(SettingOutlined)" class="hover:text-primary-500"/>
              <template #overlay>
                <a-menu class="min-w-[200px]">
                  <!-- 模式切换组 -->
                  <a-menu-item-group title="模式切换">
                    <a-menu-item
                        key="geek"
                        @click="() => switchMode('geek')"
                        :class="{ 'ant-menu-item-selected': currentMode === 'geek' }"
                    >
                      <template #icon>
                        <RobotOutlined/>
                      </template>
                      极客模式
                    </a-menu-item>
                    <a-menu-item
                        key="multimodal"
                        @click="() => switchMode('multimodal')"
                        :class="{ 'ant-menu-item-selected': currentMode === 'multimodal' }"
                    >
                      <template #icon>
                        <ThunderboltOutlined/>
                      </template>
                      多模态模式
                    </a-menu-item>
                  </a-menu-item-group>

                  <a-menu-divider/>

                  <!-- 开发模式测试功能 -->
                  <template v-if="isDevelopment">
                    <a-menu-divider/>
                    <a-menu-item-group title="开发测试">
                      <a-menu-item key="test-plan" @click="testInitPlan">
                        <template #icon>🧪</template>
                        测试计划
                      </a-menu-item>
                      <a-menu-item key="simple-plan" @click="testSimplePlan">
                        <template #icon>📝</template>
                        简单计划
                      </a-menu-item>
                    </a-menu-item-group>
                  </template>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
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

</style>
