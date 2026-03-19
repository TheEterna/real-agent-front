/**
 * VOLO Canvas Mock 数据层
 *
 * 开发调试用，提供模拟的项目、节点和 AI 生成流程
 *
 * @author Han
 * @since 2026-02-03
 */

import type {
  CanvasProject,
  CanvasNode,
  CanvasEdge,
  AiImageNodeData,
  AiVideoNodeData,
  AiChatNodeData,
  AiAudioNodeData
} from '@/types/canvas'
import {
  CanvasNodeType,
  StickyColor,
  AiGenerationStatus,
  DEFAULT_CANVAS_SETTINGS,
  DEFAULT_VIEWPORT
} from '@/types/canvas'
import { CANVAS_EDGE_COLOR } from '@/styles/canvas-colors'

// ==================== 配置 ====================

/** 是否启用 Mock 模式 */
export const USE_CANVAS_MOCK = false

/** Mock 延迟配置 */
export const MOCK_DELAY = {
  short: 200,
  medium: 500,
  long: 1000,
  aiGeneration: 3000
}

// ==================== Mock 图像/视频 URL ====================

const MOCK_IMAGE_URLS = [
  'https://picsum.photos/seed/canvas1/800/600',
  'https://picsum.photos/seed/canvas2/800/600',
  'https://picsum.photos/seed/canvas3/800/600',
  'https://picsum.photos/seed/canvas4/800/600',
  'https://picsum.photos/seed/canvas5/800/600',
  'https://picsum.photos/seed/canvas6/800/600'
]

const MOCK_VIDEO_URLS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4'
]

const MOCK_AUDIO_URLS = [
  'https://www.w3schools.com/html/horse.mp3'
]

// ==================== Mock 项目数据 ====================

/** 生成 Mock 项目列表 */
export function generateMockProjects(count = 3): CanvasProject[] {
  const projects: CanvasProject[] = []
  const titles = [
    '产品宣传海报设计',
    '短视频脚本策划',
    'AI 创意工作流'
  ]

  for (let i = 0; i < count; i++) {
    const createdTime = new Date(Date.now() - i * 86400000).toISOString()
    projects.push({
      id: `project-${i + 1}`,
      title: titles[i % titles.length],
      description: `这是一个示例项目 ${i + 1}`,
      thumbnailUrl: MOCK_IMAGE_URLS[i % MOCK_IMAGE_URLS.length],
      nodes: [],
      edges: [],
      viewport: { ...DEFAULT_VIEWPORT },
      settings: { ...DEFAULT_CANVAS_SETTINGS },
      createdTime,
      updatedTime: createdTime
    })
  }

  return projects
}

/** 生成示例画布节点 */
export function generateDemoNodes(): CanvasNode[] {
  return [
    // 便签节点 - 项目说明
    {
      id: 'sticky-1',
      type: CanvasNodeType.STICKY,
      position: { x: 50, y: 50 },
      data: {
        content: '欢迎使用 VOLO Canvas!\n\n拖拽节点到画布，连接它们来构建你的创意工作流。',
        color: StickyColor.YELLOW,
        isEditing: false
      }
    },
    // 文本节点
    {
      id: 'text-1',
      type: CanvasNodeType.TEXT,
      position: { x: 350, y: 50 },
      data: {
        content: '## 创意简报\n\n为新产品设计一组宣传素材，包括：\n- 主视觉海报\n- 社交媒体配图\n- 短视频转场',
        isEditing: false
      }
    },
    // 图像节点
    {
      id: 'image-1',
      type: CanvasNodeType.IMAGE,
      position: { x: 50, y: 300 },
      data: {
        url: MOCK_IMAGE_URLS[0],
        thumbnailUrl: MOCK_IMAGE_URLS[0],
        width: 800,
        height: 600,
        alt: '素材图片 1'
      }
    },
    {
      id: 'image-2',
      type: CanvasNodeType.IMAGE,
      position: { x: 350, y: 300 },
      data: {
        url: MOCK_IMAGE_URLS[1],
        thumbnailUrl: MOCK_IMAGE_URLS[1],
        width: 800,
        height: 600,
        alt: '素材图片 2'
      }
    },
    // AI 图像生成节点
    {
      id: 'ai-image-1',
      type: CanvasNodeType.AI_IMAGE,
      position: { x: 700, y: 100 },
      data: {
        prompt: '赛博朋克风格的城市夜景，霓虹灯光，高楼大厦',
        modelId: 'gpt-image-1',
        status: AiGenerationStatus.IDLE
      } as AiImageNodeData
    },
    // AI 视频生成节点
    {
      id: 'ai-video-1',
      type: CanvasNodeType.AI_VIDEO,
      position: { x: 700, y: 350 },
      data: {
        prompt: '平滑的转场效果，从第一张图片渐变到第二张',
        modelId: 'video-gen-1',
        status: AiGenerationStatus.IDLE
      } as AiVideoNodeData
    }
  ]
}

/** 生成示例边 */
export function generateDemoEdges(): CanvasEdge[] {
  return [
    // 图像连接到 AI 视频节点
    {
      id: 'edge-1',
      source: 'image-1',
      target: 'ai-video-1',
      animated: true,
      style: { stroke: CANVAS_EDGE_COLOR }
    },
    {
      id: 'edge-2',
      source: 'image-2',
      target: 'ai-video-1',
      animated: true,
      style: { stroke: CANVAS_EDGE_COLOR }
    }
  ]
}

// ==================== Mock API ====================

/** 延迟函数 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Mock 获取项目列表 */
export async function mockGetProjects(): Promise<CanvasProject[]> {
  await delay(MOCK_DELAY.medium)
  return generateMockProjects()
}

/** Mock 获取单个项目 */
export async function mockGetProject(projectId: string): Promise<CanvasProject | null> {
  await delay(MOCK_DELAY.short)
  const projects = generateMockProjects()
  const project = projects.find(p => p.id === projectId)

  if (project) {
    // 为第一个项目添加示例节点
    if (projectId === 'project-1') {
      project.nodes = generateDemoNodes()
      project.edges = generateDemoEdges()
    }
  }

  return project || null
}

/** Mock 创建项目 */
export async function mockCreateProject(title: string): Promise<CanvasProject> {
  await delay(MOCK_DELAY.medium)
  const now = new Date().toISOString()
  return {
    id: `project-${Date.now()}`,
    title,
    nodes: [],
    edges: [],
    viewport: { ...DEFAULT_VIEWPORT },
    settings: { ...DEFAULT_CANVAS_SETTINGS },
    createdTime: now,
    updatedTime: now
  }
}

/** Mock 保存项目 */
export async function mockSaveProject(project: CanvasProject): Promise<boolean> {
  await delay(MOCK_DELAY.medium)
  console.log('[Mock] 保存项目:', project.id, project.title)
  return true
}

/** Mock 删除项目 */
export async function mockDeleteProject(projectId: string): Promise<boolean> {
  await delay(MOCK_DELAY.short)
  console.log('[Mock] 删除项目:', projectId)
  return true
}

// ==================== AI 生成 Mock ====================

/** AI 生成进度步骤 */
interface ProgressStep {
  progress: number
  message: string
  delay: number
}

/** 通用 AI 生成模拟 */
function createAiGenerationMock<T>(
  steps: ProgressStep[],
  generateResult: () => T,
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: T) => void,
  onError?: (error: Error) => void
): AbortController {
  const controller = new AbortController()
  let aborted = false

  controller.signal.addEventListener('abort', () => {
    aborted = true
  })

  const runGeneration = async () => {
    try {
      for (const step of steps) {
        if (aborted) return
        await delay(step.delay)
        if (aborted) return
        onProgress(step.progress, step.message)
      }

      if (aborted) return
      const result = generateResult()
      onComplete(result)
    } catch (error) {
      if (!aborted && onError) {
        onError(error as Error)
      }
    }
  }

  runGeneration()
  return controller
}

/** Mock AI 图像生成 */
export function mockAiImageGenerate(
  prompt: string,
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: AiImageNodeData['result']) => void,
  onError?: (error: Error) => void
): AbortController {
  const steps: ProgressStep[] = [
    { progress: 10, message: '分析提示词...', delay: 400 },
    { progress: 25, message: '构建图像结构...', delay: 600 },
    { progress: 50, message: '生成图像细节...', delay: 800 },
    { progress: 75, message: '优化色彩和光影...', delay: 600 },
    { progress: 90, message: '最终渲染...', delay: 400 },
    { progress: 100, message: '完成', delay: 200 }
  ]

  const generateResult = () => {
    const url = `https://picsum.photos/seed/${Date.now()}/1024/1024`
    return {
      url,
      thumbnailUrl: url,
      revisedPrompt: `${prompt}，高清细节，专业品质`
    }
  }

  return createAiGenerationMock(steps, generateResult, onProgress, onComplete, onError)
}

/** Mock AI 视频生成 */
export function mockAiVideoGenerate(
  prompt: string,
  _inputImages: string[],
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: AiVideoNodeData['result']) => void,
  onError?: (error: Error) => void
): AbortController {
  const steps: ProgressStep[] = [
    { progress: 5, message: '分析输入素材...', delay: 500 },
    { progress: 15, message: '理解转场需求...', delay: 600 },
    { progress: 30, message: '计算运动轨迹...', delay: 800 },
    { progress: 50, message: '生成中间帧...', delay: 1000 },
    { progress: 70, message: '渲染视频...', delay: 1200 },
    { progress: 85, message: '添加转场效果...', delay: 800 },
    { progress: 95, message: '编码输出...', delay: 500 },
    { progress: 100, message: '完成', delay: 200 }
  ]

  const generateResult = () => ({
    url: MOCK_VIDEO_URLS[0],
    thumbnailUrl: MOCK_IMAGE_URLS[0],
    duration: 5
  })

  return createAiGenerationMock(steps, generateResult, onProgress, onComplete, onError)
}

/** Mock AI 对话生成 */
export function mockAiChatGenerate(
  prompt: string,
  _context: string[],
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: string) => void,
  onError?: (error: Error) => void
): AbortController {
  const steps: ProgressStep[] = [
    { progress: 20, message: '理解上下文...', delay: 300 },
    { progress: 50, message: '生成回复...', delay: 600 },
    { progress: 80, message: '优化表达...', delay: 400 },
    { progress: 100, message: '完成', delay: 200 }
  ]

  const responses = [
    `基于您的需求，我建议采用以下方案：\n\n1. **视觉风格**：现代简约，突出产品特点\n2. **色彩搭配**：主色调采用品牌色，辅以中性色\n3. **排版布局**：留白充足，信息层次分明\n\n这样的设计能够有效传达品牌价值，同时保持视觉吸引力。`,
    `根据您提供的素材，我为您生成了以下文案：\n\n**标题**：突破想象，定义未来\n\n**正文**：每一次创新，都是对可能性的探索。我们不仅创造产品，更创造体验。\n\n**行动号召**：立即体验，开启新篇章`,
    `分析您的创意需求后，我的建议是：\n\n- 转场效果采用平滑渐变，保持视觉连贯性\n- 配乐选择轻快节奏，增强观看体验\n- 时长控制在 15-30 秒，适合社交媒体传播`
  ]

  const generateResult = () => responses[Math.floor(Math.random() * responses.length)]

  return createAiGenerationMock(steps, generateResult, onProgress, onComplete, onError)
}

/** Mock AI 音频生成 */
export function mockAiAudioGenerate(
  prompt: string,
  type: 'tts' | 'music' | 'sfx',
  onProgress: (progress: number, message: string) => void,
  onComplete: (result: AiAudioNodeData['result']) => void,
  onError?: (error: Error) => void
): AbortController {
  const typeMessages: Record<string, ProgressStep[]> = {
    tts: [
      { progress: 20, message: '分析文本...', delay: 300 },
      { progress: 50, message: '合成语音...', delay: 600 },
      { progress: 80, message: '优化音质...', delay: 400 },
      { progress: 100, message: '完成', delay: 200 }
    ],
    music: [
      { progress: 10, message: '分析风格需求...', delay: 400 },
      { progress: 30, message: '生成旋律...', delay: 800 },
      { progress: 60, message: '编排和声...', delay: 800 },
      { progress: 85, message: '混音处理...', delay: 600 },
      { progress: 100, message: '完成', delay: 200 }
    ],
    sfx: [
      { progress: 25, message: '分析音效需求...', delay: 300 },
      { progress: 60, message: '生成音效...', delay: 500 },
      { progress: 90, message: '后期处理...', delay: 300 },
      { progress: 100, message: '完成', delay: 200 }
    ]
  }

  const steps = typeMessages[type] || typeMessages.tts

  const generateResult = () => ({
    url: MOCK_AUDIO_URLS[0],
    duration: type === 'music' ? 30 : type === 'tts' ? 10 : 3
  })

  return createAiGenerationMock(steps, generateResult, onProgress, onComplete, onError)
}

// ==================== 工具函数（从 api/canvas 重新导出，避免破坏现有引用）====================

export { generateId, createNode, createEdge } from '@/api/canvas'
