/**
 * 对话树构建工具类
 * 提供从扁平数组构建树、转换为 Vue Flow 格式、路径计算等功能
 */

import dagre from 'dagre'
import type {
  Turn,
  ConversationNode,
  ConversationTree,
  FlowNodeData,
  FlowEdgeData,
  TreeLayoutConfig
} from '@/types/conversation'
import type { UIMessage } from '@/types/events'

/**
 * 默认布局配置
 */
export const DEFAULT_LAYOUT_CONFIG: TreeLayoutConfig = {
  direction: 'TB', // Top to Bottom
  nodeSpacing: 40,
  rankSpacing: 80,
  nodeWidth: 280,
  nodeHeight: 80
}

/**
 * 从扁平数组构建对话树
 * @param turns 扁平的 Turn 数组
 * @param activePath 当前激活路径的 turnId 数组
 * @returns 构建好的对话树
 */
export function buildTreeFromFlat(turns: Turn[], activePath: string[] = []): ConversationTree {
  const nodeMap = new Map<string, ConversationNode>()
  const activePathSet = new Set(activePath)

  // 第一遍遍历：创建所有节点
  turns.forEach(turn => {
    const node: ConversationNode = {
      id: turn.turnId,
      turn,
      parentId: turn.parentTurnId,
      children: [],
      depth: 0,
      isActive: activePathSet.has(turn.turnId),
      role: turn.role
    }
    nodeMap.set(turn.turnId, node)
  })

  // 创建虚拟根节点
  const root: ConversationNode = {
    id: 'root',
    turn: {
      turnId: 'root',
      sessionId: turns[0]?.sessionId || '',
      parentTurnId: null,
      content: '',
      role: 'user',
      createdAt: new Date()
    },
    parentId: null,
    children: [],
    depth: 0,
    isActive: false,
    role: 'user'
  }
  nodeMap.set('root', root)

  // 第二遍遍历：建立父子关系
  turns.forEach(turn => {
    const node = nodeMap.get(turn.turnId)!
    const parentId = turn.parentTurnId || 'root'
    const parent = nodeMap.get(parentId)

    if (parent) {
      parent.children.push(node)
    }
  })

  // 第三遍遍历：对每个节点的子节点按创建时间排序
  nodeMap.forEach(node => {
    node.children.sort((a, b) => {
      return a.turn.createdAt.getTime() - b.turn.createdAt.getTime()
    })
  })

  // 第四遍遍历：计算深度
  const calculateDepth = (node: ConversationNode, depth: number) => {
    node.depth = depth
    node.children.forEach(child => calculateDepth(child, depth + 1))
  }
  calculateDepth(root, 0)

  const tree: ConversationTree = {
    sessionId: turns[0]?.sessionId || '',
    root,
    activePath,
    nodeMap
  }

  return tree
}

/**
 * 获取从根节点到目标节点的路径
 * @param tree 对话树
 * @param targetId 目标节点ID
 * @returns turnId 数组（不包含虚拟根节点）
 */
export function getPathToNode(tree: ConversationTree, targetId: string): string[] {
  const path: string[] = []
  const targetNode = tree.nodeMap.get(targetId)

  if (!targetNode) {
    console.warn(`节点 ${targetId} 不存在`)
    return []
  }

  let currentNode: ConversationNode | undefined = targetNode

  while (currentNode && currentNode.id !== 'root') {
    path.unshift(currentNode.id)
    const parentId = currentNode.parentId || 'root'
    currentNode = tree.nodeMap.get(parentId)
  }

  return path
}

/**
 * 获取激活路径上的所有消息
 * @param tree 对话树
 * @returns UIMessage 数组
 */
export function getActiveMessages(tree: ConversationTree): UIMessage[] {
  const messages: UIMessage[] = []

  tree.activePath.forEach(turnId => {
    const node = tree.nodeMap.get(turnId)
    if (node && node.id !== 'root') {
      const turn = node.turn
      messages.push({
        messageId: turn.messageId,
        sessionId: turn.sessionId,
        turnId: turn.turnId,
        type: turn.type!,
        sender: turn.role,
        message: turn.content,
        data: turn.data,
        startTime: turn.createdAt
      })
    }
  })

  return messages
}

/**
 * 高亮激活路径上的节点
 * @param tree 对话树
 * @param activePath 激活路径
 */
export function highlightActivePath(tree: ConversationTree, activePath: string[]) {
  const activePathSet = new Set(activePath)

  tree.nodeMap.forEach(node => {
    node.isActive = activePathSet.has(node.id)
  })

  tree.activePath = activePath
}

/**
 * 将对话树转换为 Vue Flow 的节点和边格式
 * @param tree 对话树
 * @param config 布局配置
 * @returns Vue Flow 格式的节点和边
 */
export function convertToFlowNodes(
  tree: ConversationTree,
  config: TreeLayoutConfig = DEFAULT_LAYOUT_CONFIG
): { nodes: FlowNodeData[]; edges: FlowEdgeData[] } {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: config.direction,
    ranksep: config.rankSpacing,
    nodesep: config.nodeSpacing
  })

  const nodes: FlowNodeData[] = []
  const edges: FlowEdgeData[] = []

  // 遍历所有节点（跳过虚拟根节点）
  tree.nodeMap.forEach((node, nodeId) => {
    if (nodeId === 'root') return

    // 添加到 dagre 图
    dagreGraph.setNode(nodeId, {
      width: config.nodeWidth,
      height: config.nodeHeight
    })

    // 创建 Vue Flow 节点
    const flowNode: FlowNodeData = {
      id: nodeId,
      type: 'turn',
      position: { x: 0, y: 0 }, // 稍后由 dagre 计算
      data: {
        turn: node.turn,
        role: node.role,
        isActive: node.isActive,
        content: truncateMessage(node.turn.content, 100),
        fullContent: node.turn.content,
        gradient: getNodeGradient(node.role, node.isActive),
        createdAt: node.turn.createdAt
      }
    }
    nodes.push(flowNode)

    // 创建边
    const parentId = node.parentId === null ? 'root' : node.parentId
    if (parentId !== 'root') {
      dagreGraph.setEdge(parentId, nodeId)

      const edge: FlowEdgeData = {
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: node.isActive && tree.nodeMap.get(parentId)?.isActive,
        style: {
          stroke: node.isActive && tree.nodeMap.get(parentId)?.isActive
            ? '#6b9a98'
            : '#d0d0d0',
          strokeWidth: node.isActive && tree.nodeMap.get(parentId)?.isActive
            ? 3
            : 2
        }
      }
      edges.push(edge)
    }
  })

  // 处理虚拟根节点的子节点连接
  const rootNode = tree.nodeMap.get('root')
  if (rootNode) {
    rootNode.children.forEach(child => {
      // 不需要为虚拟根节点创建边，因为根节点不在 nodes 中
      // dagreGraph.setEdge('root', child.id)

      // 虚拟根节点的子节点直接作为顶层节点，不需要边
    })
  }

  // 执行布局
  dagre.layout(dagreGraph)

  // 更新节点位置
  nodes.forEach(node => {
    const dagreNode = dagreGraph.node(node.id)
    if (dagreNode) {
      node.position = {
        x: dagreNode.x - config.nodeWidth / 2,
        y: dagreNode.y - config.nodeHeight / 2
      }
    }
  })

  return { nodes, edges }
}

/**
 * 截断消息内容用于显示
 * @param content 完整内容
 * @param maxLength 最大长度
 * @returns 截断后的内容
 */
function truncateMessage(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content
  }

  // 如果是代码块，提取第一行
  if (content.includes('```')) {
    const firstLine = content.split('\n')[0]
    return firstLine.substring(0, maxLength) + '...'
  }

  return content.substring(0, maxLength) + '...'
}

/**
 * 获取节点的渐变背景色
 * @param role 角色
 * @param isActive 是否在激活路径上
 * @returns CSS 渐变字符串
 */
function getNodeGradient(role: 'user' | 'assistant', isActive: boolean): string {
  if (role === 'user') {
    return isActive
      ? 'linear-gradient(135deg, #90caf9, #64b5f6)' // Jelly 蓝色（激活）
      : 'linear-gradient(135deg, #bbdefb, #90caf9)' // 浅蓝色（非激活）
  } else {
    return isActive
      ? 'linear-gradient(135deg, #a5d6a7, #81c784)' // Jelly 绿色（激活）
      : 'linear-gradient(135deg, #c8e6c9, #a5d6a7)' // 浅绿色（非激活）
  }
}

/**
 * 计算树的统计信息
 * @param tree 对话树
 * @returns 统计信息
 */
export function getTreeStatistics(tree: ConversationTree): {
  totalNodes: number
  maxDepth: number
  branchCount: number
  userMessages: number
  assistantMessages: number
} {
  let totalNodes = 0
  let maxDepth = 0
  let branchCount = 0
  let userMessages = 0
  let assistantMessages = 0

  tree.nodeMap.forEach(node => {
    if (node.id === 'root') return

    totalNodes++
    maxDepth = Math.max(maxDepth, node.depth)

    if (node.children.length > 1) {
      branchCount += node.children.length - 1
    }

    if (node.role === 'user') {
      userMessages++
    } else {
      assistantMessages++
    }
  })

  return {
    totalNodes,
    maxDepth,
    branchCount,
    userMessages,
    assistantMessages
  }
}

/**
 * 验证树的合法性
 * @param tree 对话树
 * @returns 验证结果
 */
export function validateTree(tree: ConversationTree): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查循环依赖
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  const detectCycle = (nodeId: string): boolean => {
    if (!visited.has(nodeId)) {
      visited.add(nodeId)
      recursionStack.add(nodeId)

      const node = tree.nodeMap.get(nodeId)
      if (node) {
        for (const child of node.children) {
          if (!visited.has(child.id) && detectCycle(child.id)) {
            return true
          } else if (recursionStack.has(child.id)) {
            errors.push(`检测到循环依赖: ${nodeId} -> ${child.id}`)
            return true
          }
        }
      }
    }
    recursionStack.delete(nodeId)
    return false
  }

  detectCycle('root')

  // 检查孤儿节点
  tree.nodeMap.forEach((node, nodeId) => {
    if (nodeId === 'root') return

    const parentId = node.parentId || 'root'
    const parent = tree.nodeMap.get(parentId)

    if (!parent) {
      errors.push(`节点 ${nodeId} 的父节点 ${parentId} 不存在`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
