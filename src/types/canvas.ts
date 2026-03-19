/**
 * VOLO Canvas 类型定义
 *
 * 无限画布 AI 创作平台的核心类型
 *
 * @author Han
 * @since 2026-02-03
 */

import { STICKY_COLORS } from '@/styles/canvas-colors'

// ==================== 枚举定义 ====================

/** 节点类型枚举 */
export enum CanvasNodeType {
  /** 文本/Markdown 节点 */
  TEXT = 'text',
  /** 图像节点 */
  IMAGE = 'image',
  /** 视频节点 */
  VIDEO = 'video',
  /** 音频节点 */
  AUDIO = 'audio',
  /** 便签节点 */
  STICKY = 'sticky',
  /** 分组容器节点 */
  GROUP = 'group',
  /** AI 对话节点 */
  AI_CHAT = 'ai-chat',
  /** AI 图像生成节点 */
  AI_IMAGE = 'ai-image',
  /** AI 视频生成节点 */
  AI_VIDEO = 'ai-video',
  /** AI 音频生成节点 */
  AI_AUDIO = 'ai-audio'
}

/** 边/连接类型枚举 */
export enum CanvasEdgeType {
  /** 默认连接 */
  DEFAULT = 'default',
  /** 上下文输入连接 */
  CONTEXT = 'context',
  /** 输出连接 */
  OUTPUT = 'output'
}

/** AI 节点生成状态 */
export enum AiGenerationStatus {
  /** 空闲 */
  IDLE = 'idle',
  /** 生成中 */
  GENERATING = 'generating',
  /** 成功 */
  SUCCESS = 'success',
  /** 错误 */
  ERROR = 'error'
}

/** 便签颜色 */
export enum StickyColor {
  YELLOW = 'yellow',
  PINK = 'pink',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  ORANGE = 'orange'
}

// ==================== 节点数据类型 ====================

/** 文本节点数据 */
export interface TextNodeData {
  content: string
  isEditing?: boolean
}

/** 图像节点数据 */
export interface ImageNodeData {
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  alt?: string
}

/** 视频节点数据 */
export interface VideoNodeData {
  url: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
}

/** 音频节点数据 */
export interface AudioNodeData {
  url: string
  duration?: number
  waveformUrl?: string
}

/** 便签节点数据 */
export interface StickyNodeData {
  content: string
  color: StickyColor
  isEditing?: boolean
}

/** 分组节点数据 */
export interface GroupNodeData {
  label: string
  color?: string
  childIds?: string[]
}

/** AI 对话节点数据 */
export interface AiChatNodeData {
  prompt: string
  modelId?: string
  result?: string
  status: AiGenerationStatus
  progress?: number
  progressMessage?: string
  error?: string
}

/** AI 图像生成节点数据 */
export interface AiImageNodeData {
  prompt: string
  modelId?: string
  params?: {
    size?: string
    quality?: string
    style?: string
    numberOfImages?: number
  }
  result?: {
    url: string
    thumbnailUrl?: string
    revisedPrompt?: string
  }
  status: AiGenerationStatus
  progress?: number
  progressMessage?: string
  error?: string
}

/** AI 视频生成节点数据 */
export interface AiVideoNodeData {
  prompt: string
  modelId?: string
  params?: {
    duration?: number
    fps?: number
    resolution?: string
  }
  result?: {
    url: string
    thumbnailUrl?: string
    duration?: number
  }
  status: AiGenerationStatus
  progress?: number
  progressMessage?: string
  error?: string
}

/** AI 音频生成节点数据 */
export interface AiAudioNodeData {
  prompt: string
  modelId?: string
  type: 'tts' | 'music' | 'sfx'
  params?: {
    voice?: string
    speed?: number
    duration?: number
  }
  result?: {
    url: string
    duration?: number
  }
  status: AiGenerationStatus
  progress?: number
  progressMessage?: string
  error?: string
}

/** 节点数据联合类型 */
export type CanvasNodeData =
  | TextNodeData
  | ImageNodeData
  | VideoNodeData
  | AudioNodeData
  | StickyNodeData
  | GroupNodeData
  | AiChatNodeData
  | AiImageNodeData
  | AiVideoNodeData
  | AiAudioNodeData

// ==================== 节点样式 ====================

/** 节点样式 */
export interface CanvasNodeStyle {
  width?: number
  height?: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number
  zIndex?: number
}

// ==================== 核心数据结构 ====================

/** 画布节点 */
export interface CanvasNode {
  /** 节点唯一标识 */
  id: string
  /** 节点类型 */
  type: CanvasNodeType
  /** 节点位置 */
  position: {
    x: number
    y: number
  }
  /** 节点数据 */
  data: CanvasNodeData
  /** 节点样式 */
  style?: CanvasNodeStyle
  /** 是否锁定 */
  locked?: boolean
  /** 是否选中 */
  selected?: boolean
  /** 父节点 ID (用于分组) */
  parentId?: string
}

/** 画布边/连接 */
export interface CanvasEdge {
  /** 边唯一标识 */
  id: string
  /** 源节点 ID */
  source: string
  /** 目标节点 ID */
  target: string
  /** 源节点连接点 */
  sourceHandle?: string
  /** 目标节点连接点 */
  targetHandle?: string
  /** 边类型 */
  type?: CanvasEdgeType
  /** 是否动画 */
  animated?: boolean
  /** 边标签 */
  label?: string
  /** 边样式 */
  style?: {
    stroke?: string
    strokeWidth?: number
  }
}

/** 画布视口 */
export interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

/** 画布设置 */
export interface CanvasSettings {
  /** 是否显示网格 */
  gridEnabled: boolean
  /** 是否吸附网格 */
  snapToGrid: boolean
  /** 网格大小 */
  gridSize: number
  /** 背景颜色 */
  backgroundColor: string
}

/** 画布项目 */
export interface CanvasProject {
  /** 项目唯一标识 */
  id: string
  /** 项目标题 */
  title: string
  /** 项目描述 */
  description?: string
  /** 缩略图 URL */
  thumbnailUrl?: string
  /** 节点列表 */
  nodes: CanvasNode[]
  /** 边列表 */
  edges: CanvasEdge[]
  /** 视口状态 */
  viewport: CanvasViewport
  /** 画布设置 */
  settings: CanvasSettings
  /** 创建时间 */
  createdTime: string
  /** 更新时间 */
  updatedTime: string
}

// ==================== 历史记录 ====================

/** 画布快照 (用于撤销/重做) */
export interface CanvasSnapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  timestamp: number
}

// ==================== 事件类型 ====================

/** AI 生成进度事件 */
export interface AiGenerationProgressEvent {
  nodeId: string
  progress: number
  message: string
}

/** AI 生成完成事件 */
export interface AiGenerationCompleteEvent {
  nodeId: string
  result: unknown
}

/** AI 生成错误事件 */
export interface AiGenerationErrorEvent {
  nodeId: string
  error: string
}

// ==================== 节点面板配置 ====================

/** 节点面板项 */
export interface NodePaletteItem {
  type: CanvasNodeType
  label: string
  icon: string
  description: string
  category: 'basic' | 'media' | 'ai'
}

/** 节点面板配置 */
export const NODE_PALETTE_CONFIG: NodePaletteItem[] = [
  // 基础节点
  {
    type: CanvasNodeType.TEXT,
    label: '文本',
    icon: 'Type',
    description: '添加文本或 Markdown 内容',
    category: 'basic'
  },
  {
    type: CanvasNodeType.STICKY,
    label: '便签',
    icon: 'StickyNote',
    description: '添加彩色便签笔记',
    category: 'basic'
  },
  {
    type: CanvasNodeType.GROUP,
    label: '分组',
    icon: 'Group',
    description: '将多个节点分组',
    category: 'basic'
  },
  // 媒体节点
  {
    type: CanvasNodeType.IMAGE,
    label: '图像',
    icon: 'Image',
    description: '上传或添加图像',
    category: 'media'
  },
  {
    type: CanvasNodeType.VIDEO,
    label: '视频',
    icon: 'Video',
    description: '上传或添加视频',
    category: 'media'
  },
  {
    type: CanvasNodeType.AUDIO,
    label: '音频',
    icon: 'Music',
    description: '上传或添加音频',
    category: 'media'
  },
  // AI 节点
  {
    type: CanvasNodeType.AI_CHAT,
    label: 'AI 对话',
    icon: 'MessageSquare',
    description: '与 AI 进行对话生成文本',
    category: 'ai'
  },
  {
    type: CanvasNodeType.AI_IMAGE,
    label: 'AI 图像',
    icon: 'Sparkles',
    description: '使用 AI 生成图像',
    category: 'ai'
  },
  {
    type: CanvasNodeType.AI_VIDEO,
    label: 'AI 视频',
    icon: 'Clapperboard',
    description: '使用 AI 生成视频或转场',
    category: 'ai'
  },
  {
    type: CanvasNodeType.AI_AUDIO,
    label: 'AI 音频',
    icon: 'AudioLines',
    description: '使用 AI 生成语音或音乐',
    category: 'ai'
  }
]

// ==================== 默认值 ====================

/** 默认画布设置 */
export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  gridEnabled: true,
  snapToGrid: true,
  gridSize: 20,
  backgroundColor: '#fafafa'
}

/** 默认视口 */
export const DEFAULT_VIEWPORT: CanvasViewport = {
  x: 0,
  y: 0,
  zoom: 1
}

/** 便签颜色映射 */
export const STICKY_COLOR_MAP: Record<StickyColor, { bg: string; border: string }> = {
  [StickyColor.YELLOW]: STICKY_COLORS.yellow,
  [StickyColor.PINK]: STICKY_COLORS.pink,
  [StickyColor.BLUE]: STICKY_COLORS.blue,
  [StickyColor.GREEN]: STICKY_COLORS.green,
  [StickyColor.PURPLE]: STICKY_COLORS.purple,
  [StickyColor.ORANGE]: STICKY_COLORS.orange,
}
