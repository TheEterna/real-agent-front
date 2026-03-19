/**
 * 中文翻译聚合文件
 * 从各模块导入并合并所有中文翻译
 */

// === 基础设施模块 ===
import { commonZh } from './modules/common'

// === 页面模块 ===
import { chatZh } from './modules/chat'
import { avatarZh } from './modules/avatar'
import { feedZh } from './modules/feed'
import { knowledgeBaseZh } from './modules/knowledgeBase'
import { loginOnboardingZh } from './modules/loginOnboarding'
import { profileZh } from './modules/profile'
import { smallPagesZh } from './modules/smallPages'

// === Playground 模块 ===
import { playgroundBasicZh } from './modules/playgroundBasic'
import { playgroundChatZh } from './modules/playgroundChat'
import { chatAnalyzerZh } from './modules/chatAnalyzer'
import { playgroundCanvasZh } from './modules/playgroundCanvas'
import { playgroundMiscZh } from './modules/playgroundMisc'
import { thesisWriterZh } from './modules/thesisWriter'

// === 组件模块 ===
import { messagesZh } from './modules/messages'
import { aiElementsZh } from './modules/aiElements'
import { planZh } from './modules/plan'
import { toolComponentsZh } from './modules/toolComponents'
import { standaloneComponentsZh } from './modules/standaloneComponents'
import { homeWelcomeZh } from './modules/homeWelcome'
import { miscComponentsZh } from './modules/miscComponents'

// === Store 模块 ===
import { storeSessionZh } from './modules/storeSession'
import { storeFeatureZh } from './modules/storeFeature'
import { storeChatZh } from './modules/storeChat'
import { storeAuthZh } from './modules/storeAuth'

// === UI Event 模块 ===
import { uiEventZh } from './modules/uiEvent'

// === API 模块 ===
import { apiZh } from './modules/api'

// === Constants 模块 ===
import { constantsZh } from './modules/constants'

// === Composables 模块 ===
import { composablesZh } from './modules/composables'

// === UI 组件模块 ===
import { uiComponentsZh } from './modules/uiComponents'

export default {
  // 保留原有的基础翻译
  message: {
    hello: '你好',
    tools: '工具',
    agents: '代理',
    workflows: '工作流',
    config: '配置',
    logs: '日志',
    playground: '游乐场',
    dashboard: '仪表盘'
  },
  menu: {
    chat: 'AI对话',
    'chat/': 'AI对话',
    dashboard: '仪表盘',
    tools: '工具',
    agents: '代理',
    workflows: '工作流',
    config: '配置',
    logs: '日志',
    playground: '游乐场'
  },
  tools: {
    title: '工具',
    search: '搜索工具…',
    selectTool: '选择工具',
    toolArgs: '工具参数',
    execute: '执行',
    reset: '重置',
    result: '执行结果',
    noToolSelected: '请选择一个工具',
    invalidJson: '无效的JSON格式',
    execError: '执行错误',
    resultViewer: '结果查看'
  },
  approval: {
    title: '工具审批',
    toolName: '工具名称',
    args: '参数',
    approve: '批准并执行',
    reject: '拒绝',
    openInTools: '在工具页打开',
    executing: '正在执行…',
    done: '执行完成',
    failed: '执行失败',
    rejected: '已拒绝',
    noToolName: '缺少工具名称'
  },
  'tools.result': {
    title: '执行结果',
    summary: '摘要',
    status: '状态',
    toolName: '工具',
    duration: '耗时',
    message: '消息',
    args: '参数',
    result: '结果',
    logs: '日志',
    metrics: '指标',
    raw: '原始数据',
    running: '执行中',
    success: '成功',
    failed: '失败'
  },
  dashboard: {
    tools: '工具',
    agents: '代理',
    runs: '运行次数 (24h)',
    errors: '错误数 (24h)'
  },

  // 模块翻译
  ...commonZh,
  ...chatZh,
  ...avatarZh,
  ...feedZh,
  ...knowledgeBaseZh,
  ...loginOnboardingZh,
  ...profileZh,
  ...smallPagesZh,
  ...playgroundBasicZh,
  ...playgroundChatZh,
  ...chatAnalyzerZh,
  ...playgroundCanvasZh,
  ...playgroundMiscZh,
  ...messagesZh,
  ...aiElementsZh,
  ...planZh,
  ...toolComponentsZh,
  ...standaloneComponentsZh,
  ...homeWelcomeZh,
  ...miscComponentsZh,
  ...storeSessionZh,
  ...storeFeatureZh,
  ...storeChatZh,
  ...storeAuthZh,
  ...uiEventZh,
  ...apiZh,
  ...constantsZh,
  ...thesisWriterZh,
  ...composablesZh,
  ...uiComponentsZh,
}
