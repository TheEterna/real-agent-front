/**
 * 对话树构建工具类
 * 提供从扁平数组构建树、转换为 Vue Flow 格式、路径计算等功能
 */

import type {
  Turn,
  ConversationNode,
  ConversationTree,
} from '@/types/conversation'
import type { UIMessage } from '@/types/events'

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

  // 从目标节点反向追溯到根节点
  while (currentNode && currentNode.id !== 'root') {
    path.unshift(currentNode.id)  // 插入到数组开头
    const parentId = currentNode.parentId || 'root'
    currentNode = tree.nodeMap.get(parentId)
  }

  console.log(`[getPathToNode] 目标节点: ${targetId}, 计算路径:`, path)
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
        parentTurnId: turn.parentTurnId ?? undefined,
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



