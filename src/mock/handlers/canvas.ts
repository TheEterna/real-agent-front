/**
 * Canvas Mock Handler
 *
 * Covers: /playground/canvas/projects endpoints
 * Provides rich mock data for 3 canvas projects
 */
import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody, mockId } from '../shared'

// ==================== Types ====================

interface CanvasNode {
  id: string
  type: 'TEXT' | 'IMAGE' | 'AI_CHAT' | 'AI_IMAGE' | 'STICKY' | 'GROUP'
  position: { x: number; y: number }
  data: Record<string, any>
  style?: Record<string, any>
  locked?: boolean
}

interface CanvasEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
  animated?: boolean
  label?: string
  style?: Record<string, any>
}

interface CanvasProject {
  id: string
  title: string
  description?: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewport: { x: number; y: number; zoom: number }
  settings: { showGrid: boolean; snapToGrid: boolean; gridSize: number; background: string }
  createdTime: string
  updatedTime: string
}

// ==================== Project 1: AI 产品架构思维导图 ====================

const project1Nodes: CanvasNode[] = [
  {
    id: 'p1-n1',
    type: 'TEXT',
    position: { x: 400, y: 300 },
    data: {
      content: 'VOLO AI 系统架构',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#1a1a2e',
      align: 'center',
    },
    style: {
      width: 280,
      height: 60,
      background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
      borderRadius: 16,
      border: '2px solid #81c784',
      padding: 16,
    },
  },
  {
    id: 'p1-n2',
    type: 'AI_CHAT',
    position: { x: 80, y: 120 },
    data: {
      label: '用户端 (Vue 3)',
      description: 'SPA 前端应用，基于 Composition API',
      prompt: '分析 Vue 3 前端架构的优势',
      status: 'SUCCESS',
      result: 'Vue 3 Composition API 提供了更好的逻辑复用和类型推断，配合 Pinia 状态管理实现清晰的数据流。',
    },
    style: {
      width: 220,
      height: 100,
      background: '#e3f2fd',
      borderRadius: 12,
      border: '1px solid #90caf9',
    },
  },
  {
    id: 'p1-n3',
    type: 'AI_CHAT',
    position: { x: 700, y: 80 },
    data: {
      label: '后端 (Spring Boot)',
      description: '响应式后端服务，DDD 分层架构',
      prompt: '评估 Spring AI 在 Agent 场景的适用性',
      status: 'SUCCESS',
      result: 'Spring AI 统一了 LLM 抽象层，支持多模型切换。配合 Project Reactor 实现端到端非阻塞。',
    },
    style: {
      width: 240,
      height: 100,
      background: '#fff3e0',
      borderRadius: 12,
      border: '1px solid #ffb74d',
    },
  },
  {
    id: 'p1-n4',
    type: 'AI_CHAT',
    position: { x: 400, y: 550 },
    data: {
      label: '数据库 (PostgreSQL)',
      description: 'PostgreSQL 16+ with jsonb support',
      prompt: '分析 R2DBC 响应式数据库的性能',
      status: 'IDLE',
    },
    style: {
      width: 240,
      height: 90,
      background: '#fce4ec',
      borderRadius: 12,
      border: '1px solid #f48fb1',
    },
  },
  {
    id: 'p1-n5',
    type: 'TEXT',
    position: { x: 50, y: 350 },
    data: {
      content: 'SSE 通信',
      fontSize: 16,
      fontWeight: '500',
      color: '#37474f',
    },
    style: {
      width: 140,
      height: 44,
      background: '#f3e5f5',
      borderRadius: 8,
      border: '1px solid #ce93d8',
      padding: 10,
    },
  },
  {
    id: 'p1-n6',
    type: 'TEXT',
    position: { x: 250, y: 480 },
    data: {
      content: 'Agent 策略',
      fontSize: 16,
      fontWeight: '500',
      color: '#37474f',
    },
    style: {
      width: 140,
      height: 44,
      background: '#e8eaf6',
      borderRadius: 8,
      border: '1px solid #9fa8da',
      padding: 10,
    },
  },
  {
    id: 'p1-n7',
    type: 'TEXT',
    position: { x: 700, y: 480 },
    data: {
      content: 'MCP 工具',
      fontSize: 16,
      fontWeight: '500',
      color: '#37474f',
    },
    style: {
      width: 140,
      height: 44,
      background: '#e0f7fa',
      borderRadius: 8,
      border: '1px solid #80deea',
      padding: 10,
    },
  },
  {
    id: 'p1-n8',
    type: 'STICKY',
    position: { x: 900, y: 300 },
    data: {
      content: 'TODO: 优化SSE重连机制\n- 指数退避策略\n- 断线续传\n- 心跳检测优化',
      color: '#fff9c4',
      author: 'Han',
    },
    style: {
      width: 200,
      height: 140,
      background: '#fff9c4',
      borderRadius: 4,
      boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
    },
  },
  {
    id: 'p1-n9',
    type: 'STICKY',
    position: { x: 900, y: 480 },
    data: {
      content: '注意: 缓存一致性\n单层缓存原则\nRedis TTL → DB fallback',
      color: '#f8bbd0',
      author: 'Architect',
    },
    style: {
      width: 200,
      height: 120,
      background: '#f8bbd0',
      borderRadius: 4,
      boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
    },
  },
  {
    id: 'p1-n10',
    type: 'GROUP',
    position: { x: 660, y: 50 },
    data: {
      label: '后端核心模块',
      collapsed: false,
      children: ['p1-n3', 'p1-n7'],
    },
    style: {
      width: 340,
      height: 510,
      background: 'rgba(255, 183, 77, 0.08)',
      borderRadius: 16,
      border: '2px dashed rgba(255, 183, 77, 0.4)',
      padding: 20,
    },
  },
  {
    id: 'p1-n11',
    type: 'TEXT',
    position: { x: 80, y: 520 },
    data: {
      content: 'VoloAI 智能任务分级',
      fontSize: 14,
      fontWeight: '500',
      color: '#455a64',
    },
    style: {
      width: 180,
      height: 40,
      background: '#e8f5e9',
      borderRadius: 8,
      border: '1px solid #a5d6a7',
      padding: 8,
    },
  },
  {
    id: 'p1-n12',
    type: 'TEXT',
    position: { x: 1100, y: 150 },
    data: {
      content: 'LLM 模型层\nOpenAI / Gemini / 通义千问',
      fontSize: 14,
      fontWeight: '400',
      color: '#546e7a',
    },
    style: {
      width: 200,
      height: 60,
      background: '#efebe9',
      borderRadius: 8,
      border: '1px solid #bcaaa4',
      padding: 10,
    },
  },
]

const project1Edges: CanvasEdge[] = [
  { id: 'p1-e1', source: 'p1-n1', target: 'p1-n2', label: 'SSE Stream', type: 'smoothstep', animated: true, style: { stroke: '#42a5f5', strokeWidth: 2 } },
  { id: 'p1-e2', source: 'p1-n1', target: 'p1-n3', label: 'REST API', type: 'smoothstep', animated: true, style: { stroke: '#ffb74d', strokeWidth: 2 } },
  { id: 'p1-e3', source: 'p1-n1', target: 'p1-n4', label: 'R2DBC', type: 'smoothstep', animated: false, style: { stroke: '#f48fb1', strokeWidth: 2 } },
  { id: 'p1-e4', source: 'p1-n2', target: 'p1-n5', label: '实时推送', type: 'default', animated: true, style: { stroke: '#ce93d8', strokeWidth: 1.5 } },
  { id: 'p1-e5', source: 'p1-n3', target: 'p1-n6', label: '策略执行', type: 'default', animated: false, style: { stroke: '#9fa8da', strokeWidth: 1.5 } },
  { id: 'p1-e6', source: 'p1-n3', target: 'p1-n7', label: 'MCP 协议', type: 'default', animated: true, style: { stroke: '#80deea', strokeWidth: 1.5 } },
  { id: 'p1-e7', source: 'p1-n6', target: 'p1-n4', type: 'default', animated: false, style: { stroke: '#90a4ae', strokeWidth: 1 } },
  { id: 'p1-e8', source: 'p1-n7', target: 'p1-n12', label: 'API 调用', type: 'smoothstep', animated: true, style: { stroke: '#bcaaa4', strokeWidth: 1.5 } },
  { id: 'p1-e9', source: 'p1-n6', target: 'p1-n11', label: '任务分级', type: 'default', animated: false, style: { stroke: '#a5d6a7', strokeWidth: 1 } },
  { id: 'p1-e10', source: 'p1-n5', target: 'p1-n2', label: '事件总线', type: 'default', animated: false, style: { stroke: '#b39ddb', strokeWidth: 1 } },
  { id: 'p1-e11', source: 'p1-n4', target: 'p1-n3', label: '查询结果', type: 'default', animated: false, style: { stroke: '#ef9a9a', strokeWidth: 1, strokeDasharray: '5,5' } },
]

// ==================== Project 2: 新功能头脑风暴 ====================

const project2Nodes: CanvasNode[] = [
  {
    id: 'p2-n1',
    type: 'STICKY',
    position: { x: 100, y: 100 },
    data: {
      content: '💡 语音对话模式\n支持实时语音输入，\nASR → Agent → TTS 全链路',
      color: '#fff9c4',
      author: 'PM',
    },
    style: {
      width: 200,
      height: 130,
      background: '#fff9c4',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'p2-n2',
    type: 'STICKY',
    position: { x: 380, y: 80 },
    data: {
      content: '🎨 AI 绘画工作台\n文生图 + 图生图\n支持 DALL-E 3 / SD',
      color: '#e1bee7',
      author: 'Designer',
    },
    style: {
      width: 200,
      height: 120,
      background: '#e1bee7',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'p2-n3',
    type: 'STICKY',
    position: { x: 650, y: 100 },
    data: {
      content: '📊 数据可视化 Agent\n自然语言 → SQL → 图表\n支持多数据源接入',
      color: '#b2dfdb',
      author: 'Dev',
    },
    style: {
      width: 210,
      height: 130,
      background: '#b2dfdb',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'p2-n4',
    type: 'STICKY',
    position: { x: 950, y: 120 },
    data: {
      content: '🔄 工作流编排器\n可视化拖拽构建\nAgent 编排流程',
      color: '#bbdefb',
      author: 'Architect',
    },
    style: {
      width: 200,
      height: 110,
      background: '#bbdefb',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'p2-n5',
    type: 'AI_CHAT',
    position: { x: 350, y: 350 },
    data: {
      label: 'AI 优先级分析',
      prompt: '帮我分析这些功能的优先级，考虑用户价值、开发成本和技术风险',
      status: 'SUCCESS',
      result: '建议优先级排序：\n1. 语音对话模式（高用户价值，ASR/TTS 成熟）\n2. 工作流编排器（核心差异化，中等开发量）\n3. 数据可视化（高需求，需 SQL 安全审计）\n4. AI 绘画工作台（锦上添花，可后期迭代）',
      model: 'gpt-4',
      tokenUsage: { input: 256, output: 180 },
    },
    style: {
      width: 340,
      height: 200,
      background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
      borderRadius: 12,
      border: '2px solid #7986cb',
    },
  },
  {
    id: 'p2-n6',
    type: 'AI_IMAGE',
    position: { x: 800, y: 350 },
    data: {
      label: '产品概念图',
      prompt: '生成一个产品概念图，展示 AI 多模态协作平台的界面',
      status: 'SUCCESS',
      resultUrl: 'https://placehold.co/400x300/e8eaf6/5c6bc0?text=VOLO+AI+Concept',
      model: 'dall-e-3',
      resolution: '1024x1024',
    },
    style: {
      width: 300,
      height: 240,
      background: '#f5f5f5',
      borderRadius: 12,
      border: '1px solid #e0e0e0',
    },
  },
  {
    id: 'p2-n7',
    type: 'TEXT',
    position: { x: 100, y: 320 },
    data: {
      content: '核心目标：Q2 发布 MVP',
      fontSize: 18,
      fontWeight: '600',
      color: '#d32f2f',
    },
    style: {
      width: 220,
      height: 44,
      background: '#ffebee',
      borderRadius: 8,
      border: '1px solid #ef9a9a',
      padding: 10,
    },
  },
  {
    id: 'p2-n8',
    type: 'STICKY',
    position: { x: 100, y: 500 },
    data: {
      content: '⚠️ 技术风险\n- LLM API 成本控制\n- 多模型一致性\n- SSE 大规模并发',
      color: '#ffe0b2',
      author: 'Tech Lead',
    },
    style: {
      width: 200,
      height: 130,
      background: '#ffe0b2',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
]

const project2Edges: CanvasEdge[] = [
  { id: 'p2-e1', source: 'p2-n1', target: 'p2-n5', label: '评估', type: 'smoothstep', animated: false, style: { stroke: '#ffd54f', strokeWidth: 1.5 } },
  { id: 'p2-e2', source: 'p2-n2', target: 'p2-n5', label: '评估', type: 'smoothstep', animated: false, style: { stroke: '#ce93d8', strokeWidth: 1.5 } },
  { id: 'p2-e3', source: 'p2-n3', target: 'p2-n5', label: '评估', type: 'smoothstep', animated: false, style: { stroke: '#80cbc4', strokeWidth: 1.5 } },
  { id: 'p2-e4', source: 'p2-n4', target: 'p2-n5', label: '评估', type: 'smoothstep', animated: false, style: { stroke: '#90caf9', strokeWidth: 1.5 } },
  { id: 'p2-e5', source: 'p2-n5', target: 'p2-n6', label: '生成概念图', type: 'default', animated: true, style: { stroke: '#7986cb', strokeWidth: 2 } },
  { id: 'p2-e6', source: 'p2-n7', target: 'p2-n5', type: 'default', animated: false, style: { stroke: '#ef9a9a', strokeWidth: 1, strokeDasharray: '4,4' } },
]

// ==================== Project 3: 竞品分析 ====================

const project3Nodes: CanvasNode[] = [
  {
    id: 'p3-n1',
    type: 'TEXT',
    position: { x: 500, y: 50 },
    data: {
      content: '多模态 AI 平台竞品分析',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1a237e',
      align: 'center',
    },
    style: {
      width: 320,
      height: 50,
      background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
      borderRadius: 12,
      border: '2px solid #5c6bc0',
      padding: 10,
    },
  },
  {
    id: 'p3-n2',
    type: 'TEXT',
    position: { x: 100, y: 200 },
    data: {
      content: 'ChatGPT',
      fontSize: 20,
      fontWeight: '600',
      color: '#1a1a1a',
      subtitle: 'OpenAI · GPT-4o · 全球市场领导者',
    },
    style: {
      width: 200,
      height: 70,
      background: '#e8f5e9',
      borderRadius: 12,
      border: '2px solid #66bb6a',
      padding: 12,
    },
  },
  {
    id: 'p3-n3',
    type: 'TEXT',
    position: { x: 400, y: 200 },
    data: {
      content: 'Gemini',
      fontSize: 20,
      fontWeight: '600',
      color: '#1a1a1a',
      subtitle: 'Google · Gemini 2.0 · 多模态原生',
    },
    style: {
      width: 200,
      height: 70,
      background: '#e3f2fd',
      borderRadius: 12,
      border: '2px solid #42a5f5',
      padding: 12,
    },
  },
  {
    id: 'p3-n4',
    type: 'TEXT',
    position: { x: 700, y: 200 },
    data: {
      content: 'Claude',
      fontSize: 20,
      fontWeight: '600',
      color: '#1a1a1a',
      subtitle: 'Anthropic · Claude 4 · 长上下文',
    },
    style: {
      width: 200,
      height: 70,
      background: '#fff3e0',
      borderRadius: 12,
      border: '2px solid #ffa726',
      padding: 12,
    },
  },
  {
    id: 'p3-n5',
    type: 'TEXT',
    position: { x: 1000, y: 200 },
    data: {
      content: '通义千问',
      fontSize: 20,
      fontWeight: '600',
      color: '#1a1a1a',
      subtitle: '阿里巴巴 · Qwen-Max · 中文优化',
    },
    style: {
      width: 200,
      height: 70,
      background: '#fce4ec',
      borderRadius: 12,
      border: '2px solid #ec407a',
      padding: 12,
    },
  },
  {
    id: 'p3-n6',
    type: 'STICKY',
    position: { x: 100, y: 350 },
    data: {
      content: '优势：\n✅ 插件生态最丰富\n✅ 用户基数最大\n✅ GPT Store 市场\n\n劣势：\n❌ API 成本高\n❌ 中文能力一般',
      color: '#e8f5e9',
      author: 'Analyst',
    },
    style: {
      width: 200,
      height: 200,
      background: '#e8f5e9',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'p3-n7',
    type: 'STICKY',
    position: { x: 400, y: 350 },
    data: {
      content: '优势：\n✅ 多模态原生支持\n✅ 搜索引擎整合\n✅ 200万token上下文\n\n劣势：\n❌ 开放性不足\n❌ 工具生态薄弱',
      color: '#e3f2fd',
      author: 'Analyst',
    },
    style: {
      width: 200,
      height: 200,
      background: '#e3f2fd',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'p3-n8',
    type: 'STICKY',
    position: { x: 700, y: 350 },
    data: {
      content: '优势：\n✅ 超长上下文(1M)\n✅ 安全性最强\n✅ 代码能力突出\n\n劣势：\n❌ 多模态较弱\n❌ 无官方插件市场',
      color: '#fff3e0',
      author: 'Analyst',
    },
    style: {
      width: 200,
      height: 200,
      background: '#fff3e0',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'p3-n9',
    type: 'IMAGE',
    position: { x: 1000, y: 350 },
    data: {
      src: 'https://placehold.co/400x300/fce4ec/c62828?text=Product+Screenshot',
      alt: '产品截图对比',
      caption: '四大平台界面对比截图',
    },
    style: {
      width: 260,
      height: 200,
      borderRadius: 12,
      border: '1px solid #e0e0e0',
      objectFit: 'cover',
    },
  },
  {
    id: 'p3-n10',
    type: 'TEXT',
    position: { x: 400, y: 650 },
    data: {
      content: 'VOLO AI 差异化定位',
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1b5e20',
      align: 'center',
    },
    style: {
      width: 280,
      height: 50,
      background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)',
      borderRadius: 12,
      border: '2px solid #66bb6a',
      padding: 10,
    },
  },
  {
    id: 'p3-n11',
    type: 'STICKY',
    position: { x: 300, y: 750 },
    data: {
      content: '🎯 核心差异：\n1. 开源可控 (DDD分层)\n2. MCP协议开放生态\n3. 多策略任务分级\n4. 私有化部署\n5. 完全可定制',
      color: '#dcedc8',
      author: 'Strategy',
    },
    style: {
      width: 220,
      height: 160,
      background: '#dcedc8',
      borderRadius: 4,
      boxShadow: '2px 2px 8px rgba(0,0,0,0.08)',
    },
  },
]

const project3Edges: CanvasEdge[] = [
  { id: 'p3-e1', source: 'p3-n1', target: 'p3-n2', type: 'smoothstep', animated: false, style: { stroke: '#66bb6a', strokeWidth: 1.5 } },
  { id: 'p3-e2', source: 'p3-n1', target: 'p3-n3', type: 'smoothstep', animated: false, style: { stroke: '#42a5f5', strokeWidth: 1.5 } },
  { id: 'p3-e3', source: 'p3-n1', target: 'p3-n4', type: 'smoothstep', animated: false, style: { stroke: '#ffa726', strokeWidth: 1.5 } },
  { id: 'p3-e4', source: 'p3-n1', target: 'p3-n5', type: 'smoothstep', animated: false, style: { stroke: '#ec407a', strokeWidth: 1.5 } },
  { id: 'p3-e5', source: 'p3-n2', target: 'p3-n6', type: 'default', animated: false, style: { stroke: '#a5d6a7', strokeWidth: 1 } },
  { id: 'p3-e6', source: 'p3-n3', target: 'p3-n7', type: 'default', animated: false, style: { stroke: '#90caf9', strokeWidth: 1 } },
  { id: 'p3-e7', source: 'p3-n4', target: 'p3-n8', type: 'default', animated: false, style: { stroke: '#ffcc80', strokeWidth: 1 } },
  { id: 'p3-e8', source: 'p3-n10', target: 'p3-n11', type: 'default', animated: true, style: { stroke: '#66bb6a', strokeWidth: 2 } },
  { id: 'p3-e9', source: 'p3-n2', target: 'p3-n10', label: '对标', type: 'default', animated: false, style: { stroke: '#bdbdbd', strokeWidth: 1, strokeDasharray: '6,4' } },
  { id: 'p3-e10', source: 'p3-n3', target: 'p3-n10', label: '对标', type: 'default', animated: false, style: { stroke: '#bdbdbd', strokeWidth: 1, strokeDasharray: '6,4' } },
]

// ==================== Projects Data ====================

const MOCK_PROJECTS: CanvasProject[] = [
  {
    id: 'canvas-proj-001',
    title: 'AI 产品架构思维导图',
    description: 'VOLO AI 系统架构梳理，包含前端、后端、数据库及核心模块的关系图',
    nodes: project1Nodes,
    edges: project1Edges,
    viewport: { x: -50, y: -20, zoom: 0.85 },
    settings: { showGrid: true, snapToGrid: true, gridSize: 20, background: '#fafafa' },
    createdTime: '2026-03-10T09:30:00Z',
    updatedTime: '2026-03-18T14:22:00Z',
  },
  {
    id: 'canvas-proj-002',
    title: '新功能头脑风暴',
    description: 'Q2 新功能规划与优先级分析，包含 AI 辅助评估结果',
    nodes: project2Nodes,
    edges: project2Edges,
    viewport: { x: 0, y: 0, zoom: 0.9 },
    settings: { showGrid: false, snapToGrid: false, gridSize: 16, background: '#ffffff' },
    createdTime: '2026-03-12T10:00:00Z',
    updatedTime: '2026-03-17T16:45:00Z',
  },
  {
    id: 'canvas-proj-003',
    title: '竞品分析',
    description: '多模态 AI 平台竞品对比：ChatGPT / Gemini / Claude / 通义千问，及 VOLO AI 差异化定位',
    nodes: project3Nodes,
    edges: project3Edges,
    viewport: { x: -80, y: -30, zoom: 0.75 },
    settings: { showGrid: true, snapToGrid: true, gridSize: 24, background: '#f8f9fa' },
    createdTime: '2026-03-08T14:00:00Z',
    updatedTime: '2026-03-19T09:10:00Z',
  },
]

// ==================== Handler ====================

export default function canvasMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // GET /playground/canvas/projects/:projectId — single project
  if (match('/playground/canvas/projects/:projectId', url) && method === 'get') {
    const projectId = param('/playground/canvas/projects/:projectId', url, 'projectId')
    const project = MOCK_PROJECTS.find((p) => p.id === projectId)
    return project ? ok(project) : ok(MOCK_PROJECTS[0])
  }

  // PUT /playground/canvas/projects/:projectId — save
  if (match('/playground/canvas/projects/:projectId', url) && method === 'put') {
    return ok(true)
  }

  // DELETE /playground/canvas/projects/:projectId — delete
  if (match('/playground/canvas/projects/:projectId', url) && method === 'delete') {
    return ok(true)
  }

  // POST /playground/canvas/projects — create
  if (match('/playground/canvas/projects', url) && method === 'post') {
    const body = parseBody(config.data)
    const newProject: CanvasProject = {
      id: mockId('canvas-proj'),
      title: body.title || '未命名画布',
      description: body.description || '',
      nodes: body.nodes || [],
      edges: body.edges || [],
      viewport: body.viewport || { x: 0, y: 0, zoom: 1 },
      settings: body.settings || { showGrid: true, snapToGrid: true, gridSize: 20, background: '#ffffff' },
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
    }
    return ok(newProject)
  }

  // GET /playground/canvas/projects — list all projects
  if (match('/playground/canvas/projects', url) && method === 'get') {
    return ok(MOCK_PROJECTS)
  }

  return null
}
