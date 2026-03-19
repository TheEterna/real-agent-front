import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param } from '../shared'

// ==================== Text Config Data ====================

interface TextItem {
  key: string
  value: string
  renderStrategy: 'SINGLE' | 'RANDOM'
  weight: number
}

interface TextConfigResponse {
  zh: TextItem[]
  en: TextItem[]
}

function t(key: string, value: string, strategy: 'SINGLE' | 'RANDOM' = 'SINGLE', weight = 100): TextItem {
  return { key, value, renderStrategy: strategy, weight }
}

const TEXT_CONFIGS: Record<string, TextConfigResponse> = {
  chatgateway: {
    zh: [
      t('welcome_title', 'VOLO AI'),
      t('welcome_sub', '你的AI智能助手，随时为你服务'),
      t('starter_prompt_1', '帮我分析这段代码的性能瓶颈', 'RANDOM'),
      t('starter_prompt_2', '写一篇关于AI未来发展趋势的文章', 'RANDOM'),
      t('starter_prompt_3', '翻译这段英文为地道的中文', 'RANDOM'),
      t('starter_prompt_4', '帮我制定一个高效的学习计划', 'RANDOM'),
      t('starter_prompt_5', '解释量子计算的基本原理', 'RANDOM'),
      t('starter_prompt_6', '帮我写一封专业的商务邮件', 'RANDOM'),
      t('starter_prompt_7', '分析这张图片的内容和构图', 'RANDOM'),
      t('starter_prompt_8', '帮我做一个SWOT分析', 'RANDOM'),
      t('starter_prompt_9', '用Python写一个数据可视化脚本', 'RANDOM', 80),
      t('starter_prompt_10', '总结这篇论文的核心观点', 'RANDOM', 80),
    ],
    en: [
      t('welcome_title', 'VOLO AI'),
      t('welcome_sub', 'Your intelligent AI assistant, always at your service'),
      t('starter_prompt_1', 'Analyze the performance bottlenecks in this code', 'RANDOM'),
      t('starter_prompt_2', 'Write an article about future AI trends', 'RANDOM'),
      t('starter_prompt_3', 'Translate this text into natural Chinese', 'RANDOM'),
      t('starter_prompt_4', 'Help me create an efficient study plan', 'RANDOM'),
      t('starter_prompt_5', 'Explain the basics of quantum computing', 'RANDOM'),
      t('starter_prompt_6', 'Write a professional business email', 'RANDOM'),
      t('starter_prompt_7', 'Analyze the content and composition of this image', 'RANDOM'),
      t('starter_prompt_8', 'Help me do a SWOT analysis', 'RANDOM'),
    ],
  },

  chatassistant: {
    zh: [
      t('greeting_1', '你好呀！今天有什么我可以帮你的吗？', 'RANDOM'),
      t('greeting_2', '嗨，很高兴见到你！随时可以跟我聊天哦~', 'RANDOM'),
      t('greeting_3', '欢迎回来！想聊点什么呢？', 'RANDOM'),
      t('empty_state', '这里还没有对话记录，开始一段新的对话吧'),
      t('cta_primary', '开始聊天'),
      t('input_placeholder', '输入你想说的话...'),
      t('thinking_hint', '正在思考中，请稍候...'),
    ],
    en: [
      t('greeting_1', 'Hello! What can I help you with today?', 'RANDOM'),
      t('greeting_2', 'Hi there! Feel free to chat with me anytime~', 'RANDOM'),
      t('greeting_3', 'Welcome back! What would you like to talk about?', 'RANDOM'),
      t('empty_state', 'No conversation yet, start a new one!'),
      t('cta_primary', 'Start Chat'),
      t('input_placeholder', 'Type your message...'),
      t('thinking_hint', 'Thinking, please wait...'),
    ],
  },

  playground: {
    zh: [
      t('section_title', '探索 Playground'),
      t('section_desc', '体验 VOLO AI 的各种能力模块，找到最适合你的工具'),
      t('feature_basic_chat', '基础对话 — 与AI进行自由对话，测试模型能力'),
      t('feature_basic_image', '图像生成 — 用文字描述生成高质量图片'),
      t('feature_basic_video', '视频生成 — AI驱动的视频创作工具'),
      t('feature_basic_speech', '语音合成 — 将文字转化为自然流畅的语音'),
      t('feature_chat_assistant', '陪伴聊天 — 人性化的情感陪伴助手'),
      t('feature_chat_analyzer', '对话分析 — AI情感顾问，洞察沟通模式'),
      t('feature_canvas', '无限画布 — AI驱动的创意协作画布'),
      t('feature_thesis_writer', '论文写作 — 智能论文撰写与排版'),
      t('feature_mind_map', '思维导图 — AI辅助的思维可视化工具'),
      t('feature_role_play', '角色扮演 — 沉浸式AI角色互动体验'),
      t('feature_tools', 'MCP工具 — 配置和管理外部工具集成'),
      t('feature_skills', 'Agent技能 — 定制AI能力与技能组合'),
    ],
    en: [
      t('section_title', 'Explore Playground'),
      t('section_desc', 'Experience various VOLO AI capabilities and find the right tool for you'),
      t('feature_basic_chat', 'Basic Chat — Free conversation with AI to test model capabilities'),
      t('feature_basic_image', 'Image Generation — Generate high-quality images from text'),
      t('feature_basic_video', 'Video Generation — AI-powered video creation'),
      t('feature_basic_speech', 'Speech Synthesis — Convert text to natural speech'),
      t('feature_chat_assistant', 'Companion Chat — Emotionally intelligent companion'),
      t('feature_chat_analyzer', 'Chat Analyzer — AI emotional advisor'),
      t('feature_canvas', 'Infinite Canvas — AI-driven creative collaboration'),
      t('feature_thesis_writer', 'Thesis Writer — Smart thesis writing & formatting'),
      t('feature_mind_map', 'Mind Map — AI-assisted visual thinking'),
      t('feature_role_play', 'Role Play — Immersive AI character interactions'),
    ],
  },

  landing: {
    zh: [
      t('hero_title', '用 AI 重新定义你的工作流'),
      t('hero_sub', '多 Agent 协作、MCP 工具生态、流式体验——VOLO AI 让复杂任务变简单'),
      t('feature_1_title', '智能任务分级'),
      t('feature_1_desc', 'VoloAI 自动分析请求复杂度，选择最优执行路径，从直接回答到深度推理一键切换'),
      t('feature_2_title', '开放工具生态'),
      t('feature_2_desc', '基于 MCP 协议的工具集成，搜索、地图、计算等能力即插即用，告别供应商锁定'),
      t('feature_3_title', '实时流式响应'),
      t('feature_3_desc', 'SSE 驱动的逐字输出，思考过程可视化，让你始终掌握 AI 的推理节奏'),
      t('cta_text', '免费开始使用'),
      t('cta_secondary', '了解更多'),
      t('social_proof', '已有超过 10,000 位用户信赖 VOLO AI'),
    ],
    en: [
      t('hero_title', 'Redefine Your Workflow with AI'),
      t('hero_sub', 'Multi-Agent collaboration, MCP tool ecosystem, streaming experience — VOLO AI simplifies complex tasks'),
      t('feature_1_title', 'Intelligent Task Routing'),
      t('feature_1_desc', 'VoloAI automatically analyzes request complexity and selects the optimal execution path'),
      t('feature_2_title', 'Open Tool Ecosystem'),
      t('feature_2_desc', 'MCP protocol-based integrations — search, maps, compute, plug and play'),
      t('feature_3_title', 'Real-time Streaming'),
      t('feature_3_desc', 'SSE-driven token-by-token output with visible reasoning process'),
      t('cta_text', 'Get Started Free'),
      t('cta_secondary', 'Learn More'),
    ],
  },

  profile: {
    zh: [
      t('section_basic', '基本信息'),
      t('section_subscription', '订阅与账单'),
      t('section_security', '安全设置'),
      t('section_preferences', '偏好设置'),
      t('section_data', '数据管理'),
      t('empty_avatar', '点击上传头像'),
      t('empty_bio', '还没有填写个人简介，点击编辑添加吧'),
      t('empty_usage', '暂无使用记录'),
      t('credits_label', '剩余积分'),
      t('tier_label', '当前套餐'),
    ],
    en: [
      t('section_basic', 'Basic Info'),
      t('section_subscription', 'Subscription & Billing'),
      t('section_security', 'Security'),
      t('section_preferences', 'Preferences'),
      t('section_data', 'Data Management'),
      t('empty_avatar', 'Click to upload avatar'),
      t('empty_bio', 'No bio yet, click to add one'),
      t('empty_usage', 'No usage records'),
      t('credits_label', 'Credits Remaining'),
      t('tier_label', 'Current Plan'),
    ],
  },

  common: {
    zh: [
      t('loading_tip_1', 'AI 正在全力思考中...', 'RANDOM'),
      t('loading_tip_2', '请稍候，马上就好...', 'RANDOM'),
      t('loading_tip_3', '正在处理你的请求...', 'RANDOM'),
      t('loading_tip_4', '灵感正在路上，请耐心等待~', 'RANDOM', 80),
      t('loading_tip_5', '数据加载中，精彩即将呈现...', 'RANDOM', 80),
      t('error_generic', '操作失败，请稍后重试'),
      t('error_network', '网络连接异常，请检查网络后重试'),
      t('error_auth', '登录已过期，请重新登录'),
      t('error_permission', '权限不足，无法执行此操作'),
      t('error_not_found', '请求的资源不存在'),
      t('success_generic', '操作成功'),
      t('success_save', '保存成功'),
      t('success_delete', '删除成功'),
      t('confirm_delete', '确定要删除吗？此操作不可撤销'),
      t('btn_cancel', '取消'),
      t('btn_confirm', '确定'),
    ],
    en: [
      t('loading_tip_1', 'AI is thinking hard...', 'RANDOM'),
      t('loading_tip_2', 'Just a moment, almost there...', 'RANDOM'),
      t('loading_tip_3', 'Processing your request...', 'RANDOM'),
      t('loading_tip_4', 'Inspiration is on the way~', 'RANDOM', 80),
      t('loading_tip_5', 'Loading data, great things coming...', 'RANDOM', 80),
      t('error_generic', 'Operation failed, please try again'),
      t('error_network', 'Network error, please check your connection'),
      t('error_auth', 'Session expired, please log in again'),
      t('error_permission', 'Insufficient permissions'),
      t('error_not_found', 'Requested resource not found'),
      t('success_generic', 'Operation successful'),
      t('success_save', 'Saved successfully'),
      t('success_delete', 'Deleted successfully'),
      t('confirm_delete', 'Are you sure? This action cannot be undone'),
      t('btn_cancel', 'Cancel'),
      t('btn_confirm', 'Confirm'),
    ],
  },
}

// ==================== Handler ====================

export default function textConfigMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // GET /config/texts/:type
  if (method === 'get' && match('/config/texts/:type', url)) {
    const type = param('/config/texts/:type', url, 'type')
    const data = TEXT_CONFIGS[type]
    if (data) {
      return ok(data)
    }
    return ok({ zh: [], en: [] })
  }

  return null
}
