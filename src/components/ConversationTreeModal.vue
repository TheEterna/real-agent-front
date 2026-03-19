<template>
  <AModal
      v-model:open="internalVisible"
      :title="t('comp.conversationTree.title')"
      width="95vw"
      :footer="null"
      :centered="true"
      :destroy-on-close="true"
      wrap-class-name="conversation-tree-modal-wrapper"
      class="linear-theme-modal"
      @cancel="handleClose"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
          <ApartmentOutlined />
        </div>
        <div class="flex flex-col">
          <span class="text-base font-semibold text-gray-800 tracking-tight">{{ t('comp.conversationTree.title') }}</span>
          <span v-if="tree" class="text-xs text-gray-500 font-normal">{{ sessionTitle }}</span>
        </div>
      </div>
    </template>

    <!-- 工具栏 - Linear 风格 -->
    <div class="flex flex-col md:flex-row gap-4 p-2 bg-gray-50/50 rounded-xl mb-4 border border-gray-200/50 items-center justify-between">
      <!-- 控制按钮 -->
      <div class="flex items-center gap-2">
        <ATooltip :title="t('comp.conversationTree.centerView')">
            <button class="linear-button" @click="handleFitView">
              <CompressOutlined />
            </button>
        </ATooltip>

        <ATooltip :title="t('comp.conversationTree.refreshData')">
            <button class="linear-button" @click="handleRefresh">
              <ReloadOutlined />
            </button>
        </ATooltip>
        
        <div class="h-4 w-px bg-gray-200 mx-1"></div>
        
        <div class="text-xs text-gray-500 hidden md:flex items-center gap-2 px-2">
           <InfoCircleOutlined />
           <span>{{ t('comp.conversationTree.dragHint') }}</span>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="w-full md:w-auto min-w-[240px]">
        <div class="linear-search-box">
          <SearchOutlined class="text-gray-400 ml-3" />
          <input
            v-model="searchQuery"
            type="text"
            :aria-label="t('comp.conversationTree.searchAriaLabel')"
            :placeholder="t('comp.conversationTree.searchPlaceholder')"
            class="linear-search-input"
            @keyup.enter="handleSearch(searchQuery)"
          />
          <CloseOutlined
            v-if="searchQuery"
            class="text-gray-400 hover:text-gray-600 cursor-pointer mr-3 transition-colors"
            @click="searchQuery = ''; handleSearch('')"
          />
        </div>
      </div>
    </div>

    <!-- 树形图容器 -->
    <Spin :spinning="loading" :tip="t('comp.conversationTree.loadingTip')" wrapper-class-name="h-full">
      <div class="w-full h-[65vh] md:h-[75vh] min-h-[400px] bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden relative border border-gray-200 dark:border-zinc-700 shadow-sm">
        <!-- 内嵌的对话树视图 -->
        <div v-if="tree && flowNodes.length > 0" class="w-full h-full relative">
          <VueFlow
            :nodes="flowNodes"
            :edges="flowEdges"
            :default-viewport="{ zoom: 0.8, x: 50, y: 50 }"
            :min-zoom="0.2"
            :max-zoom="2"
            :fit-view-on-init="true"
            class="linear-flow"
            @node-click="handleNodeClick"
          >
            <!-- 背景和控制器 -->
            <Background :pattern-color="'var(--color-gray-200, #e5e7eb)'" :gap="24" :size="2" />
            <Controls class="linear-controls" :show-interactive="false" />

            <!-- 自定义节点组件 -->
            <template #node-turn="{ data }">
              <TreeNode :data="data" />
            </template>
          </VueFlow>

          <!-- 树统计信息 - 悬浮卡片 -->
          <div v-if="statistics && flowNodes.length > 0" class="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
            <div class="glass-stat-card pointer-events-auto">
              <div class="flex items-center gap-4 text-xs">
                 <div class="flex flex-col items-center">
                    <span class="text-gray-400 mb-0.5 font-medium uppercase tracking-wider text-[10px]">{{ t('comp.conversationTree.statsNodes') }}</span>
                    <span class="font-bold text-gray-700 text-sm font-mono">{{ statistics.totalNodes }}</span>
                 </div>
                 <div class="w-px h-6 bg-gray-100"></div>
                 <div class="flex flex-col items-center">
                    <span class="text-gray-400 mb-0.5 font-medium uppercase tracking-wider text-[10px]">{{ t('comp.conversationTree.statsDepth') }}</span>
                    <span class="font-bold text-gray-700 text-sm font-mono">{{ statistics.maxDepth }}</span>
                 </div>
                 <div class="w-px h-6 bg-gray-100"></div>
                 <div class="flex flex-col items-center">
                    <span class="text-gray-400 mb-0.5 font-medium uppercase tracking-wider text-[10px]">{{ t('comp.conversationTree.statsBranches') }}</span>
                    <span class="font-bold text-gray-700 text-sm font-mono">{{ statistics.branchCount }}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="flex flex-col items-center justify-center w-full h-full gap-4 bg-gray-50/30">
          <AEmpty :description="t('comp.conversationTree.emptyDescription')" :image="AEmpty.PRESENTED_IMAGE_SIMPLE" />
          <button class="linear-button px-4" @click="handleRefresh">{{ t('comp.conversationTree.refreshData') }}</button>
        </div>
      </div>
    </Spin>

    <!-- 错误提示 -->
    <div v-if="error" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
       <div class="bg-destructive/5 text-destructive border border-destructive/20 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-md">
          <InfoCircleOutlined />
          <span>{{ error }}</span>
          <CloseOutlined class="cursor-pointer opacity-50 hover:opacity-100" @click="error = ''" />
       </div>
    </div>
  </AModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  Modal as AModal,
  Button as AButton,
  Tooltip as ATooltip,
  Divider as ADivider,
  Empty as AEmpty,
  Spin,
  Alert as AAlert
} from 'ant-design-vue'
import {
  ApartmentOutlined,
  CompressOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import TreeNode from './TreeNode.vue'
import { useChatStore } from '@/stores/chatStore'
import type { ConversationTree, ConversationNode } from '@/types/conversation'
import gsap from 'gsap'

// ========== 类型定义 ==========

interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    role: 'user' | 'assistant'
    preview: string
    messageCount: number
    isActive: boolean
    hasBranches: boolean
    branchIndex: number
    branchCount: number
  }
}

interface FlowEdge {
  id: string
  source: string
  target: string
  animated?: boolean
  style?: Record<string, any>
}

interface TreeStatistics {
  totalNodes: number
  maxDepth: number
  branchCount: number
}

// ========== Props & Emits ==========

interface Props {
  visible: boolean
  sessionId: string
}

const props = defineProps<Props>()

interface Emits {
  'update:visible': [value: boolean]
  nodeClick: [nodeId: string]
}

const emit = defineEmits<Emits>()

// ========== Store ==========

const { t } = useI18n()
const chatStore = useChatStore()

// ========== 布局配置 ==========

const LAYOUT_CONFIG = {
  nodeWidth: 280,
  nodeHeight: 120,
  horizontalGap: 100,
  verticalGap: 150
}

// ========== 状态管理 ==========

const internalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const tree = ref<ConversationTree | null>(null)
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

// Flow 节点和边
const flowNodes = ref<FlowNode[]>([])
const flowEdges = ref<FlowEdge[]>([])

// ========== 计算属性 ==========

const sessionTitle = computed(() => {
  const session = chatStore.getSession(props.sessionId)
  return session?.title || t('comp.conversationTree.untitledSession')
})

/**
 * 获取节点的预览文本
 */
function getNodePreview(node: ConversationNode): string {
  if (!node.turn || !node.turn.content) return t('comp.conversationTree.emptyMessage')

  const text = node.turn.content.trim()
  return text.length > 80 ? text.substring(0, 80) + '...' : text
}

/**
 * 递归构建树结构，计算每个节点的位置
 */
function buildTreeLayout(tree: ConversationTree): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  const levelWidths = new Map<number, number>() // 每层已用宽度

  // 🔧 使用 chatStore.displayPathBySession（来自 Index.vue 的 currentDisplayPath）而不是 tree.activePath
  const displayPath = chatStore.getDisplayPath(props.sessionId)
  const activePathSet = new Set(displayPath.length > 0 ? displayPath : (tree.activePath || []))

  console.log('[构建树] 开始构建')
  console.log('[构建树] 使用显示路径 (displayPath):', displayPath)
  console.log('[构建树] activePathSet:', Array.from(activePathSet))

  /**
   * 递归遍历树，计算位置
   */
  function traverse(
    node: ConversationNode,
    depth: number,
    siblingIndex: number,
    siblingCount: number
  ): void {
    // 跳过根节点
    if (node.id === 'root') {
      console.log('[构建树] 跳过 root 节点, children:', node.children.length)
      node.children.forEach((child, index) => {
        traverse(child, 0, index, node.children.length)
      })
      return
    }

    console.log(`[构建树] 处理节点 ${node.id}, depth=${depth}`)

    // 计算 X 位置：每一层从左到右排列
    const currentLevelWidth = levelWidths.get(depth) || 0
    const x = currentLevelWidth
    levelWidths.set(depth, currentLevelWidth + LAYOUT_CONFIG.nodeWidth + LAYOUT_CONFIG.horizontalGap)

    // 计算 Y 位置
    const y = depth * (LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.verticalGap)

    console.log(`[构建树] 位置 x=${x}, y=${y}`)

    // 创建节点
    const flowNode: FlowNode = {
      id: node.id,
      type: 'turn',
      position: { x, y },
      data: {
        role: node.role,
        preview: getNodePreview(node),
        messageCount: 1,
        isActive: activePathSet.has(node.id),
        hasBranches: siblingCount > 1,
        branchIndex: siblingIndex,
        branchCount: siblingCount
      }
    }
    nodes.push(flowNode)
    console.log(`[构建树] 添加节点 ${node.id}, 位置=${JSON.stringify(flowNode.position)}`)

    // 遍历子节点
    if (node.children && node.children.length > 0) {
      console.log(`[构建树] 节点 ${node.id} 有 ${node.children.length} 个子节点`)
      node.children.forEach((child, index) => {
        // 创建边
        const isChildActive = activePathSet.has(child.id)
        const edge: FlowEdge = {
          id: `${node.id}->${child.id}`,
          source: node.id,
          target: child.id,
          animated: isChildActive,
          style: {
            stroke: isChildActive ? 'var(--color-gray-500, #6b7280)' : 'var(--color-gray-200, #e5e7eb)',
            strokeWidth: isChildActive ? 2 : 1.5
          }
        }
        edges.push(edge)
        console.log(`[构建树] 添加边 ${edge.id}`)

        // 递归处理子节点
        traverse(child, depth + 1, index, node.children.length)
      })
    }
  }

  // 从根节点开始遍历
  if (tree.root) {
    console.log('[构建树] 从 root 开始递归遍历')
    traverse(tree.root, 0, 0, 1)
  }

  console.log('[构建树] 构建完成, 节点:', nodes.length, ', 边:', edges.length)

  return { nodes, edges }
}

/**
 * 搜索树节点
 */
function searchNodes(node: ConversationNode, query: string): ConversationNode | null {
  const lowercaseQuery = query.toLowerCase()
  const nodeText = node.turn?.content?.toLowerCase() || ''
  const matches = nodeText.includes(lowercaseQuery)

  // 递归搜索子节点
  const matchedChildren = node.children
    .map(child => searchNodes(child, query))
    .filter((child): child is ConversationNode => child !== null)

  // 如果节点本身匹配或子节点匹配，保留该节点
  if (matches || matchedChildren.length > 0) {
    return {
      ...node,
      children: matchedChildren
    }
  }

  return null
}

// 过滤后的树
const filteredTree = computed<ConversationTree | null>(() => {
  if (!tree.value || !searchQuery.value.trim()) {
    return tree.value
  }

  const query = searchQuery.value.trim()
  if (!tree.value.root) return tree.value

  const filteredRoot = searchNodes(tree.value.root, query)
  if (!filteredRoot) {
    return null
  }

  return {
    ...tree.value,
    root: filteredRoot
  }
})

// 统计过滤后的节点数
const filteredNodeCount = computed(() => {
  if (!filteredTree.value || !filteredTree.value.root) return 0

  let count = 0
  function traverse(node: ConversationNode) {
    if (node.id !== 'root') count++
    node.children.forEach(child => traverse(child))
  }
  traverse(filteredTree.value.root)
  return count
})

// 树统计信息
const statistics = computed<TreeStatistics | null>(() => {
  if (!tree.value || !tree.value.root) return null

  const currentTree = tree.value
  let maxDepth = 0
  let branchCount = 0

  // 计算最大深度和分支数
  function calculateStats(node: ConversationNode): void {
    maxDepth = Math.max(maxDepth, node.depth)

    if (node.children.length > 1) {
      branchCount++
    }

    node.children.forEach(child => calculateStats(child))
  }

  if (currentTree.root) {
    calculateStats(currentTree.root)
  }

  return {
    totalNodes: currentTree.nodeMap.size - 1, // 减去 root 节点
    maxDepth: maxDepth + 1,
    branchCount
  }
})

// ========== 监听 Tree 变化，重新构建布局 ==========

watch(
  () => filteredTree.value,
  (newTree) => {
    console.log('[对话树] watch 触发')
    console.log('[对话树] newTree:', newTree)

    if (!newTree) {
      console.log('[对话树] tree 为 null')
      flowNodes.value = []
      flowEdges.value = []
      return
    }

    if (!newTree.root) {
      console.log('[对话树] tree.root 为 null')
      flowNodes.value = []
      flowEdges.value = []
      return
    }

    console.log('[对话树] 开始构建布局')
    console.log('[对话树] root.id:', newTree.root.id)
    console.log('[对话树] root.children.length:', newTree.root.children.length)

    const result = buildTreeLayout(newTree)

    console.log('[对话树] 构建结果:')
    console.log('  - 节点数:', result.nodes.length)
    console.log('  - 边数:', result.edges.length)
    console.log('  - 节点列表:', result.nodes)

    flowNodes.value = result.nodes
    flowEdges.value = result.edges
  },
  { immediate: true, deep: false }
)

// ========== 事件处理 ==========

// 加载对话树
const loadTree = async () => {
  if (!props.sessionId) {
    error.value = t('comp.conversationTree.invalidSessionId')
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log("对话树加载的id:" + props.sessionId)
    const loadedTree = await chatStore.fetchConversationTree(props.sessionId)

    if (loadedTree) {
      tree.value = loadedTree
      console.log('对话树加载成功:', loadedTree)

      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
    } else {
      error.value = t('comp.conversationTree.loadTreeFailed')
    }
  } catch (err: any) {
    console.error('加载对话树失败:', err)
    error.value = err.message || t('comp.conversationTree.loadTreeFailed')
  } finally {
    loading.value = false
  }
}

// 处理节点点击
const handleNodeClick = async (event: any) => {
  const nodeId = event.node.id
  console.log('[对话树] 节点点击:', nodeId)

  loading.value = true
  try {
    const success = await chatStore.switchToPath(props.sessionId, nodeId)
    if (success) {
      message.success(t('comp.conversationTree.switchBranchSuccess'))
      tree.value = chatStore.getConversationTree(props.sessionId)
      emit('nodeClick', nodeId)
    } else {
      message.error(t('comp.conversationTree.switchBranchFailed'))
    }
  } catch (error: any) {
    console.error('切换分支失败:', error)
    message.error(error.message || t('comp.conversationTree.switchBranchFailed'))
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = (value: string) => {
  searchQuery.value = value
  console.log('搜索节点:', value)
}

// 居中视图
const handleFitView = () => {
  message.info(t('comp.conversationTree.viewCentered'))
}

// 刷新数据
const handleRefresh = async () => {
  await loadTree()
  message.success(t('comp.conversationTree.dataRefreshed'))
}

// 处理关闭
const handleClose = () => {
  internalVisible.value = false
  searchQuery.value = ''
}

onUnmounted(() => {
  const modalContent = document.querySelector('.conversation-tree-modal-wrapper .ant-modal-content')
  if (modalContent) gsap.killTweensOf(modalContent)
})

// 监听可见性变化
watch(
    () => props.visible,
    async (newVisible) => {
      console.log('ConversationTreeModal 可见性变化:', newVisible)
      if (newVisible) {
        await nextTick()
        console.log('准备加载对话树，sessionId:', props.sessionId)
        await loadTree()
        // 入场动画
        const modalContent = document.querySelector('.conversation-tree-modal-wrapper .ant-modal-content')
        if (modalContent) {
          gsap.fromTo(
              modalContent,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
          )
        }
      } else {
        tree.value = null
        error.value = ''
        searchQuery.value = ''
        flowNodes.value = []
        flowEdges.value = []
      }
    }
)
</script>

<style scoped>
/* Linear Theme Styles */
:deep(.linear-theme-modal .ant-modal-content) {
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px) saturate(180%);
}

:deep(.linear-theme-modal .ant-modal-header) {
  background: transparent;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  padding: 16px 24px;
  margin-bottom: 0;
}

:deep(.linear-theme-modal .ant-modal-body) {
  padding: 20px 24px 24px;
}

:deep(.linear-theme-modal .ant-modal-close) {
  top: 16px;
  right: 24px;
  color: #9ca3af;
}

:deep(.linear-theme-modal .ant-modal-close:hover) {
  background-color: rgba(0,0,0,0.05);
  border-radius: 8px;
  color: #4b5563;
}

/* Linear Button */
.linear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.linear-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.linear-button:active {
  transform: translateY(0);
  background: #f3f4f6;
}

/* Search Box */
.linear-search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  height: 36px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.linear-search-box:focus-within {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.1);
}

.linear-search-input {
  flex: 1;
  border: none;
  background: transparent;
  height: 100%;
  padding: 0 12px;
  font-size: 0.875rem;
  color: #374151;
  outline: none;
}

.linear-search-input::placeholder {
  color: #9ca3af;
}

/* Glass Stat Card */
.glass-stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

/* Vue Flow Customization */
:deep(.linear-flow .vue-flow__edge) {
  stroke: #e5e7eb;
  stroke-width: 2;
}

:deep(.linear-flow .vue-flow__edge.animated) {
  stroke: #9ca3af;
  stroke-dasharray: 5;
  animation: flowAnimation 30s linear infinite;
}

@keyframes flowAnimation {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}

:deep(.linear-controls) {
  margin: 16px;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  gap: 5px;
  display: flex;
}

:deep(.linear-controls .vue-flow__controls-button) {
  border-radius: 6px;
  width: 35px;
  height: 35px;
  padding: 7px;
  border: 1px solid #e5e7eb;
  background: white;
}

:deep(.linear-controls .vue-flow__controls-button:hover) {
  background: #f3f4f6;
}

/* Responsive */
@media (max-width: 768px) {
  :deep(.linear-theme-modal .ant-modal-content) {
    border-radius: 20px;
  }
}
</style>
