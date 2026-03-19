/**
 * 对话树数据结构定义
 * 用于管理和可视化对话的树状结构（支持重新生成和编辑消息产生的多分支）
 */

import type { UIMessage, EventType } from './events'

/**
 * Turn 数据结构（轮次）
 * 对应后端的 Turn 实体
 */
export interface Turn {
  turnId: string              // 当前轮次ID
  sessionId: string           // 所属会话ID
  parentTurnId: string | null // 父轮次ID（null表示根节点）
  content: string             // 消息内容
  role: 'user' | 'assistant'  // 角色
  type?: EventType            // 事件类型
  createdAt: Date             // 创建时间（用于排序兄弟节点）
  messageId?: string          // 关联的消息ID
  data?: any                  // 额外数据
}

/**
 * 对话树节点
 * 前端用于可视化的树节点结构
 */
export interface ConversationNode {
  id: string                    // turnId
  turn: Turn                    // 完整的 Turn 数据
  parentId: string | null       // parentTurnId
  children: ConversationNode[]  // 子节点列表（按创建时间排序）
  depth: number                 // 深度（用于布局，根节点为0）
  isActive: boolean             // 是否在当前激活路径上
  role: 'user' | 'assistant'    // 角色
  position?: { x: number; y: number } // Vue Flow 布局位置
}

/**
 * 对话树
 * 完整的对话树结构，包含激活路径信息
 */
export interface ConversationTree {
  sessionId: string                              // 会话ID
  root: ConversationNode | null                  // 根节点（虚拟根节点）
  activePath: string[]                           // 当前激活路径的 turnId 数组
  nodeMap: Map<string, ConversationNode>         // turnId 到节点的映射（快速查找）
  activeMessages?: UIMessage[]                   // 当前激活路径的消息列表
}

/**
 * Vue Flow 节点数据
 * 用于 Vue Flow 渲染的节点格式
 */
export interface FlowNodeData {
  id: string                    // 节点ID（turnId）
  type: 'turn'                  // 节点类型
  position: { x: number; y: number }
  data: {
    turn: Turn                  // Turn 数据
    role: 'user' | 'assistant'  // 角色
    isActive: boolean           // 是否在激活路径上
    content: string             // 消息内容（截断后用于显示）
    fullContent: string         // 完整内容（用于 tooltip）
    gradient: string            // 渐变背景色
    createdAt: Date             // 创建时间
  }
}

/**
 * Vue Flow 边数据
 */
export interface FlowEdgeData {
  id: string                    // 边ID
  source: string                // 源节点ID
  target: string                // 目标节点ID
  type?: 'default' | 'straight' | 'smoothstep'
  animated?: boolean            // 是否动画（激活路径）
  style?: Record<string, any>   // 自定义样式
}

/**
 * 对话树布局配置
 */
export interface TreeLayoutConfig {
  direction: 'TB' | 'LR'        // 布局方向：Top-Bottom 或 Left-Right
  nodeSpacing: number           // 节点间距
  rankSpacing: number           // 层级间距
  nodeWidth: number             // 节点宽度
  nodeHeight: number            // 节点高度
}

/**
 * 后端 API 响应类型
 */

// 获取对话树的响应
export interface ConversationTreeResponse {
  sessionId: string
  turns: Turn[]                 // 所有 Turn 数据（扁平结构）
  activePath: string[]          // 当前激活路径
}

// 切换分支的请求
export interface SwitchBranchRequest {
  sessionId: string
  targetTurnId: string          // 要切换到的目标节点ID
}

// 切换分支的响应
export interface SwitchBranchResponse {
  success: boolean
  newActivePath: string[]       // 新的激活路径
  message?: string              // 错误信息（如果失败）
}
