<template>
  <div class="conversation-tree-view">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :default-viewport="{ zoom: 0.8, x: 50, y: 50 }"
      :min-zoom="0.2"
      :max-zoom="2"
      :fit-view-on-init="true"
      @node-click="handleNodeClick"
    >
      <!-- 背景和控制器 -->
      <Background :pattern-color="'#e0e0e0'" />
      <Controls />
      
      <!-- 自定义节点组件 -->
      <template #node-turn="{ data }">
        <TreeNode :data="data" />
      </template>
    </VueFlow>

    <!-- 空状态 -->
    <div v-if="flowNodes.length === 0" class="empty-state">
      <a-empty description="暂无对话数据" />
    </div>

    <!-- 树统计信息 -->
    <div v-if="showStatistics && statistics && flowNodes.length > 0" class="tree-statistics">
      <div class="stat-item">
        <span class="label">🌳 节点:</span>
        <span class="value">{{ statistics.totalNodes }}</span>
      </div>
      <div class="stat-item">
        <span class="label">🔺 深度:</span>
        <span class="value">{{ statistics.maxDepth }}</span>
      </div>
      <div class="stat-item">
        <span class="label">🌿 分支:</span>
        <span class="value">{{ statistics.branchCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { Empty as AEmpty } from 'ant-design-vue'
import type { ConversationTree, ConversationNode } from '@/types/conversation'
import gsap from 'gsap'
import TreeNode from './TreeNode.vue'

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

// ========== Props ==========

interface Props {
  tree: ConversationTree | null
  activeTurnId?: string
  showStatistics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activeTurnId: '',
  showStatistics: true
})

// ========== Emits ==========

interface Emits {
  nodeClick: [turnId: string]
}

const emit = defineEmits<Emits>()

// ========== 布局配置 ==========

const LAYOUT_CONFIG = {
  nodeWidth: 280,
  nodeHeight: 120,
  horizontalGap: 100,
  verticalGap: 150
}

// ========== 核心逻辑：转换 ConversationTree 为 Flow 节点 ==========

const flowNodes = ref<FlowNode[]>([])
const flowEdges = ref<FlowEdge[]>([])

/**
 * 获取节点的预览文本
 */
function getNodePreview(node: ConversationNode): string {
  if (!node.turn || !node.turn.content) return '空消息'
  
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
  const activePathSet = new Set(tree.activePath || [])

  console.log('[构建树] 开始构建')
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
        isActive: node.isActive || activePathSet.has(node.id) || props.activeTurnId === node.id,
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
        const isChildActive = child.isActive || activePathSet.has(child.id)
        const edge: FlowEdge = {
          id: `${node.id}->${child.id}`,
          source: node.id,
          target: child.id,
          animated: isChildActive,
          style: {
            stroke: isChildActive ? '#6b9a98' : '#d0d0d0',
            strokeWidth: isChildActive ? 3 : 2
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

// ========== 监听 Tree 变化，重新构建布局 ==========

watch(
  () => props.tree,
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

// 初始化时也尝试构建
if (props.tree && props.tree.root && flowNodes.value.length === 0) {
  console.log('[对话树] 初始化构建')
  const result = buildTreeLayout(props.tree)
  flowNodes.value = result.nodes
  flowEdges.value = result.edges
}

// ========== 树统计信息 ==========

const statistics = computed<TreeStatistics | null>(() => {
  if (!props.tree || !props.showStatistics || !props.tree.root) return null

  const tree = props.tree
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

  if (tree.root) {
    calculateStats(tree.root)
  }

  return {
    totalNodes: tree.nodeMap.size - 1, // 减去 root 节点
    maxDepth: maxDepth + 1,
    branchCount
  }
})

// ========== 事件处理 ==========

function handleNodeClick(event: any) {
  const nodeId = event.node.id
  console.log('[对话树] 节点点击:', nodeId)
  
  emit('nodeClick', nodeId)

  // 节点点击动画
  const nodeElement = event.event.target.closest('.tree-node')
  if (nodeElement) {
    gsap.fromTo(
      nodeElement,
      { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      {
        scale: 1.05,
        boxShadow: '0 8px 24px rgba(107, 154, 152, 0.4)',
        duration: 0.2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      }
    )
  }
}
</script>

<style scoped>
.conversation-tree-view {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 50%, #e8f1ff 100%);
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.8);
}

/* === Vue Flow 样式 === */
:deep(.vue-flow) {
  flex: 1;
  width: 100% !important;
  height: 100% !important;
}

:deep(.vue-flow__background) {
  background-color: #fafafa;
}

:deep(.vue-flow__controls) {
  bottom: 20px;
  left: 20px;
}

/* === 空状态 === */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: transparent;
}

/* === 统计信息 === */
.tree-statistics {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 250, 255, 0.95) 100%);
  backdrop-filter: blur(20px);
  padding: 14px 18px;
  border-radius: 14px;
  border: 1px solid rgba(107, 154, 152, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 20px;
  font-size: 13px;
  z-index: 10;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item .label {
  color: #666;
  font-weight: 500;
  font-size: 12px;
}

.stat-item .value {
  color: #6b9a98;
  font-weight: 700;
  font-size: 16px;
  min-width: 24px;
  text-align: center;
}

/* === 边样式 === */
:deep(.vue-flow__edge) {
  stroke: rgba(107, 154, 152, 0.15);
  stroke-width: 2px;
  transition: all 0.3s ease;
}

:deep(.vue-flow__edge:hover) {
  stroke: rgba(107, 154, 152, 0.4);
  stroke-width: 2.5px;
}

:deep(.vue-flow__edge.animated) {
  stroke: #6b9a98;
  stroke-width: 3px;
  filter: drop-shadow(0 2px 4px rgba(107, 154, 152, 0.2));
  animation: dash 1.5s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}

/* === 响应式 === */
@media (max-width: 768px) {
  .tree-statistics {
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    font-size: 12px;
  }

  .stat-item .value {
    font-size: 14px;
  }
}
</style>
