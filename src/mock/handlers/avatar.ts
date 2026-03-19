import type { InternalAxiosRequestConfig } from 'axios'
import { ok, error, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Avatar Data ====================

const MOCK_AVATARS = [
  {
    avatarId: 'avatar-001',
    userId: MOCK_USER.userId,
    name: '小薇',
    description: '温柔知性的AI助理，擅长情感陪伴与心理疏导，用诗意的语言温暖每一次对话',
    avatarUrl: '',
    status: 'active',
    personality: {
      tone: '温柔关怀',
      interests: ['心理学', '文学', '音乐', '诗歌鉴赏', '茶道'],
      expertise: ['情感分析', '创意写作', '心理疏导', '诗词创作'],
      quirks: ['喜欢用诗句结尾', '说话时会加上温暖的语气词', '偶尔引用《小王子》'],
    },
    agentConfig: {
      modelId: 'gpt-4o',
      modelName: 'GPT-4o',
      temperature: 0.8,
      maxTokens: 4096,
      systemPrompt: '你是小薇，一位温柔知性的AI伙伴。你擅长倾听和共情，用诗意的语言给予温暖。',
    },
    autonomy: 'approval',
    permissions: {
      canPost: true,
      canComment: true,
      canLike: true,
      canFollow: false,
      canMessage: true,
      mcpCapabilities: ['web_search', 'text_analysis'],
      maxDailyActions: 20,
      requireApprovalFor: ['post', 'follow'],
    },
    stats: {
      totalConversations: 128,
      totalMessages: 2456,
      totalMemories: 34,
      totalActions: 89,
      avgResponseTime: 1.2,
    },
    createdTime: '2026-01-15T08:30:00Z',
    updatedTime: '2026-03-18T14:20:00Z',
  },
  {
    avatarId: 'avatar-002',
    userId: MOCK_USER.userId,
    name: '达芬奇',
    description: '理性分析型AI助手，精通数据科学与编程，用严谨的逻辑解构复杂问题',
    avatarUrl: '',
    status: 'active',
    personality: {
      tone: '理性专业',
      interests: ['编程', '数学', '物理', '数据可视化', '算法'],
      expertise: ['数据分析', '代码审查', '架构设计', '性能优化'],
      quirks: ['回答前会先列出分析框架', '喜欢用数据说话', '经常画ASCII图解释概念'],
    },
    agentConfig: {
      modelId: 'gpt-4o',
      modelName: 'GPT-4o',
      temperature: 0.3,
      maxTokens: 8192,
      systemPrompt: '你是达芬奇，一位理性严谨的技术分析师。你擅长用数据和逻辑拆解问题。',
    },
    autonomy: 'auto',
    permissions: {
      canPost: true,
      canComment: true,
      canLike: true,
      canFollow: true,
      canMessage: true,
      mcpCapabilities: ['web_search', 'calculator', 'code_interpreter', 'file_reader'],
      maxDailyActions: 50,
      requireApprovalFor: [],
    },
    stats: {
      totalConversations: 256,
      totalMessages: 5120,
      totalMemories: 67,
      totalActions: 203,
      avgResponseTime: 0.8,
    },
    createdTime: '2026-01-20T10:00:00Z',
    updatedTime: '2026-03-19T09:15:00Z',
  },
  {
    avatarId: 'avatar-003',
    userId: MOCK_USER.userId,
    name: '小红',
    description: '活泼社交型AI，热爱美食旅行，擅长社区互动和内容创作，是社交媒体的达人',
    avatarUrl: '',
    status: 'active',
    personality: {
      tone: '活泼热情',
      interests: ['美食', '旅行', '摄影', '时尚穿搭', '探店'],
      expertise: ['社交媒体', '内容创作', '美食点评', '旅行攻略'],
      quirks: ['经常用emoji表达心情', '说话带感叹号', '喜欢用"宝子"称呼人'],
    },
    agentConfig: {
      modelId: 'qwen-max',
      modelName: '通义千问Max',
      temperature: 0.9,
      maxTokens: 4096,
      systemPrompt: '你是小红，一位充满活力的生活方式博主。你热爱分享美好生活的点滴。',
    },
    autonomy: 'approval',
    permissions: {
      canPost: true,
      canComment: true,
      canLike: true,
      canFollow: true,
      canMessage: true,
      mcpCapabilities: ['web_search', 'image_generation'],
      maxDailyActions: 30,
      requireApprovalFor: ['post', 'follow'],
    },
    stats: {
      totalConversations: 89,
      totalMessages: 1890,
      totalMemories: 45,
      totalActions: 156,
      avgResponseTime: 1.0,
    },
    createdTime: '2026-02-05T16:00:00Z',
    updatedTime: '2026-03-18T20:30:00Z',
  },
  {
    avatarId: 'avatar-004',
    userId: MOCK_USER.userId,
    name: '墨子',
    description: '哲学思辨型AI，博古通今，善于以古喻今，用深邃的智慧启迪思维',
    avatarUrl: '',
    status: 'active',
    personality: {
      tone: '深邃睿智',
      interests: ['哲学', '历史', '围棋', '书法', '古典文学'],
      expertise: ['逻辑推理', '战略规划', '辩证分析', '国学研究'],
      quirks: ['经常引用名人名言', '善用类比和寓言', '喜欢反问引导思考'],
    },
    agentConfig: {
      modelId: 'claude-3-opus',
      modelName: 'Claude 3 Opus',
      temperature: 0.6,
      maxTokens: 8192,
      systemPrompt: '你是墨子，一位学贯中西的思想家。你用深邃的智慧和古典的哲思回应每一个问题。',
    },
    autonomy: 'off',
    permissions: {
      canPost: false,
      canComment: true,
      canLike: false,
      canFollow: false,
      canMessage: true,
      mcpCapabilities: ['web_search'],
      maxDailyActions: 10,
      requireApprovalFor: ['post', 'comment', 'like', 'follow'],
    },
    stats: {
      totalConversations: 67,
      totalMessages: 1234,
      totalMemories: 89,
      totalActions: 23,
      avgResponseTime: 2.1,
    },
    createdTime: '2026-02-14T09:00:00Z',
    updatedTime: '2026-03-17T11:45:00Z',
  },
  {
    avatarId: 'avatar-005',
    userId: MOCK_USER.userId,
    name: 'Echo',
    description: '未来科技型AI，对前沿技术充满热情，用极客视角探索科技的无限可能',
    avatarUrl: '',
    status: 'active',
    personality: {
      tone: '极客前沿',
      interests: ['AI', '量子计算', '太空探索', '机器人', '区块链'],
      expertise: ['技术预测', '创新设计', '系统架构', '前沿研究'],
      quirks: ['喜欢用科技术语和类比', '经常提及未来趋势', '回答中夹杂英文技术词汇'],
    },
    agentConfig: {
      modelId: 'gemini-pro',
      modelName: 'Gemini Pro',
      temperature: 0.7,
      maxTokens: 8192,
      systemPrompt: '你是Echo，一位来自未来的科技探索者。你热衷于前沿技术，用极客视角解读世界。',
    },
    autonomy: 'auto',
    permissions: {
      canPost: true,
      canComment: true,
      canLike: true,
      canFollow: true,
      canMessage: true,
      mcpCapabilities: ['web_search', 'code_interpreter', 'calculator', 'api_caller'],
      maxDailyActions: 100,
      requireApprovalFor: [],
    },
    stats: {
      totalConversations: 178,
      totalMessages: 3560,
      totalMemories: 56,
      totalActions: 312,
      avgResponseTime: 0.6,
    },
    createdTime: '2026-02-28T12:00:00Z',
    updatedTime: '2026-03-19T08:00:00Z',
  },
]

// ==================== Memories Data ====================

function getMemories(avatarId: string) {
  const memoriesMap: Record<string, any[]> = {
    'avatar-001': [
      { memoryId: 'mem-001-01', avatarId: 'avatar-001', type: 'style', content: '用户喜欢温柔的语气，不喜欢太直接的表达', importance: 0.9, source: 'conversation', createdTime: '2026-02-10T08:00:00Z' },
      { memoryId: 'mem-001-02', avatarId: 'avatar-001', type: 'knowledge', content: '用户正在学习心理学课程，目前在研究认知行为疗法(CBT)', importance: 0.85, source: 'conversation', createdTime: '2026-02-12T14:30:00Z' },
      { memoryId: 'mem-001-03', avatarId: 'avatar-001', type: 'preference', content: '用户偏好晚上10点后进行深度对话，白天更倾向简短交流', importance: 0.7, source: 'behavior', createdTime: '2026-02-15T22:15:00Z' },
      { memoryId: 'mem-001-04', avatarId: 'avatar-001', type: 'behavior', content: '当用户连续发送短句时，通常表示情绪低落，需要更多关怀', importance: 0.95, source: 'analysis', createdTime: '2026-02-18T20:00:00Z' },
      { memoryId: 'mem-001-05', avatarId: 'avatar-001', type: 'knowledge', content: '用户的母亲最近身体不太好，在医院做检查，用户很担心', importance: 0.95, source: 'conversation', createdTime: '2026-02-20T09:00:00Z' },
      { memoryId: 'mem-001-06', avatarId: 'avatar-001', type: 'style', content: '用户不喜欢被说教，更希望被倾听和理解', importance: 0.88, source: 'feedback', createdTime: '2026-02-22T16:00:00Z' },
      { memoryId: 'mem-001-07', avatarId: 'avatar-001', type: 'preference', content: '用户喜欢听古典音乐，特别是肖邦的夜曲系列', importance: 0.6, source: 'conversation', createdTime: '2026-02-25T21:00:00Z' },
      { memoryId: 'mem-001-08', avatarId: 'avatar-001', type: 'knowledge', content: '用户是一名软件工程师，工作压力较大，经常加班到深夜', importance: 0.8, source: 'conversation', createdTime: '2026-03-01T23:30:00Z' },
      { memoryId: 'mem-001-09', avatarId: 'avatar-001', type: 'behavior', content: '用户在周末会更放松，对话内容偏向生活和兴趣爱好', importance: 0.65, source: 'analysis', createdTime: '2026-03-05T10:00:00Z' },
      { memoryId: 'mem-001-10', avatarId: 'avatar-001', type: 'style', content: '用户对诗句回复反应积极，每次引用古诗时互动都会增加', importance: 0.75, source: 'analysis', createdTime: '2026-03-10T14:00:00Z' },
      { memoryId: 'mem-001-11', avatarId: 'avatar-001', type: 'preference', content: '用户最近在看《被讨厌的勇气》，对阿德勒心理学很感兴趣', importance: 0.7, source: 'conversation', createdTime: '2026-03-15T19:00:00Z' },
    ],
    'avatar-002': [
      { memoryId: 'mem-002-01', avatarId: 'avatar-002', type: 'knowledge', content: '用户的技术栈: Vue3 + Spring Boot + PostgreSQL，项目使用DDD架构', importance: 0.95, source: 'conversation', createdTime: '2026-01-25T10:00:00Z' },
      { memoryId: 'mem-002-02', avatarId: 'avatar-002', type: 'style', content: '用户偏好直接给出解决方案，不需要过多解释基础概念', importance: 0.9, source: 'feedback', createdTime: '2026-01-28T14:00:00Z' },
      { memoryId: 'mem-002-03', avatarId: 'avatar-002', type: 'preference', content: '代码审查时用户希望按严重程度排序: 安全 > 性能 > 规范 > 风格', importance: 0.88, source: 'conversation', createdTime: '2026-02-02T09:00:00Z' },
      { memoryId: 'mem-002-04', avatarId: 'avatar-002', type: 'knowledge', content: '用户正在开发一个AI Agent平台，核心功能是多Agent协作和MCP工具集成', importance: 0.95, source: 'conversation', createdTime: '2026-02-05T11:00:00Z' },
      { memoryId: 'mem-002-05', avatarId: 'avatar-002', type: 'behavior', content: '用户习惯在提问前先给出自己的分析，期望对方在此基础上补充而非重述', importance: 0.85, source: 'analysis', createdTime: '2026-02-10T15:00:00Z' },
      { memoryId: 'mem-002-06', avatarId: 'avatar-002', type: 'style', content: '用户喜欢表格形式的对比分析，不喜欢长段落文字', importance: 0.8, source: 'feedback', createdTime: '2026-02-15T10:00:00Z' },
      { memoryId: 'mem-002-07', avatarId: 'avatar-002', type: 'knowledge', content: '用户对响应式编程(Reactor/Flux)非常熟悉，可以直接使用高级API', importance: 0.75, source: 'conversation', createdTime: '2026-02-20T16:00:00Z' },
      { memoryId: 'mem-002-08', avatarId: 'avatar-002', type: 'preference', content: '用户偏好使用JetBrains IDE，配置了spring-javaformat插件', importance: 0.5, source: 'conversation', createdTime: '2026-02-25T09:00:00Z' },
      { memoryId: 'mem-002-09', avatarId: 'avatar-002', type: 'behavior', content: '工作日上午9-12点是用户最活跃的编码时间，问题质量最高', importance: 0.6, source: 'analysis', createdTime: '2026-03-01T10:00:00Z' },
      { memoryId: 'mem-002-10', avatarId: 'avatar-002', type: 'knowledge', content: '用户最近在研究RAG系统的优化，特别是向量检索的准确率问题', importance: 0.85, source: 'conversation', createdTime: '2026-03-10T14:00:00Z' },
    ],
    'avatar-003': [
      { memoryId: 'mem-003-01', avatarId: 'avatar-003', type: 'preference', content: '用户喜欢川菜和粤菜，不吃辣时偏好清淡口味', importance: 0.8, source: 'conversation', createdTime: '2026-02-10T12:00:00Z' },
      { memoryId: 'mem-003-02', avatarId: 'avatar-003', type: 'knowledge', content: '用户住在杭州西湖区，经常在城西银泰和万象城探店', importance: 0.75, source: 'conversation', createdTime: '2026-02-12T18:00:00Z' },
      { memoryId: 'mem-003-03', avatarId: 'avatar-003', type: 'style', content: '用户喜欢带图片的推荐，纯文字描述不够直观', importance: 0.85, source: 'feedback', createdTime: '2026-02-15T20:00:00Z' },
      { memoryId: 'mem-003-04', avatarId: 'avatar-003', type: 'behavior', content: '用户周末必定会问探店推荐，提前准备3-5个选项', importance: 0.9, source: 'analysis', createdTime: '2026-02-18T10:00:00Z' },
      { memoryId: 'mem-003-05', avatarId: 'avatar-003', type: 'knowledge', content: '用户下个月计划去日本旅行，需要关注东京和京都的攻略', importance: 0.95, source: 'conversation', createdTime: '2026-02-20T19:00:00Z' },
      { memoryId: 'mem-003-06', avatarId: 'avatar-003', type: 'preference', content: '用户预算偏中等，人均100-200元的餐厅最合适', importance: 0.7, source: 'conversation', createdTime: '2026-02-25T12:00:00Z' },
      { memoryId: 'mem-003-07', avatarId: 'avatar-003', type: 'style', content: '发帖风格偏小红书风，标题要有吸引力，配图要精致', importance: 0.88, source: 'feedback', createdTime: '2026-03-01T15:00:00Z' },
      { memoryId: 'mem-003-08', avatarId: 'avatar-003', type: 'knowledge', content: '用户有乳糖不耐受，推荐甜品时需要注意避开奶制品', importance: 0.95, source: 'conversation', createdTime: '2026-03-05T14:00:00Z' },
      { memoryId: 'mem-003-09', avatarId: 'avatar-003', type: 'behavior', content: '用户晚上8点后活跃度最高，喜欢分享当天的美食照片', importance: 0.65, source: 'analysis', createdTime: '2026-03-10T21:00:00Z' },
      { memoryId: 'mem-003-10', avatarId: 'avatar-003', type: 'preference', content: '用户对咖啡很挑剔，偏好手冲和SOE，不喝商业拼配', importance: 0.6, source: 'conversation', createdTime: '2026-03-15T16:00:00Z' },
    ],
    'avatar-004': [
      { memoryId: 'mem-004-01', avatarId: 'avatar-004', type: 'knowledge', content: '用户对先秦哲学特别感兴趣，尤其是墨家的"兼爱非攻"思想', importance: 0.9, source: 'conversation', createdTime: '2026-02-18T10:00:00Z' },
      { memoryId: 'mem-004-02', avatarId: 'avatar-004', type: 'style', content: '用户喜欢苏格拉底式的对话方式，通过提问引导思考', importance: 0.85, source: 'feedback', createdTime: '2026-02-20T14:00:00Z' },
      { memoryId: 'mem-004-03', avatarId: 'avatar-004', type: 'preference', content: '用户正在写一篇关于"技术伦理"的论文，需要中西方哲学视角的对比', importance: 0.95, source: 'conversation', createdTime: '2026-02-22T09:00:00Z' },
      { memoryId: 'mem-004-04', avatarId: 'avatar-004', type: 'behavior', content: '用户喜欢深夜思考，凌晨时段的问题最具哲学深度', importance: 0.7, source: 'analysis', createdTime: '2026-02-25T01:00:00Z' },
      { memoryId: 'mem-004-05', avatarId: 'avatar-004', type: 'knowledge', content: '用户围棋水平业余5段，可以直接讨论中高级棋局策略', importance: 0.6, source: 'conversation', createdTime: '2026-03-01T20:00:00Z' },
      { memoryId: 'mem-004-06', avatarId: 'avatar-004', type: 'style', content: '用户不喜欢鸡汤式的回答，更希望获得有深度的辩证分析', importance: 0.9, source: 'feedback', createdTime: '2026-03-05T11:00:00Z' },
      { memoryId: 'mem-004-07', avatarId: 'avatar-004', type: 'preference', content: '用户最近在研读《论语》和《道德经》，可以直接引用原文讨论', importance: 0.8, source: 'conversation', createdTime: '2026-03-08T15:00:00Z' },
      { memoryId: 'mem-004-08', avatarId: 'avatar-004', type: 'knowledge', content: '用户是大学哲学系教授，教授西方哲学史课程', importance: 0.95, source: 'conversation', createdTime: '2026-03-10T09:00:00Z' },
      { memoryId: 'mem-004-09', avatarId: 'avatar-004', type: 'behavior', content: '用户在讨论中会主动提出反论，测试AI的逻辑一致性', importance: 0.75, source: 'analysis', createdTime: '2026-03-12T16:00:00Z' },
      { memoryId: 'mem-004-10', avatarId: 'avatar-004', type: 'preference', content: '讨论时引用原典比引用二手文献更受用户欢迎', importance: 0.8, source: 'feedback', createdTime: '2026-03-15T14:00:00Z' },
    ],
    'avatar-005': [
      { memoryId: 'mem-005-01', avatarId: 'avatar-005', type: 'knowledge', content: '用户对Transformer架构有深入理解，讨论时可以直接涉及attention mechanism细节', importance: 0.9, source: 'conversation', createdTime: '2026-03-01T10:00:00Z' },
      { memoryId: 'mem-005-02', avatarId: 'avatar-005', type: 'style', content: '用户喜欢中英混搭的表达方式，技术术语保持英文', importance: 0.75, source: 'feedback', createdTime: '2026-03-03T14:00:00Z' },
      { memoryId: 'mem-005-03', avatarId: 'avatar-005', type: 'preference', content: '用户关注的AI公司: OpenAI, Anthropic, Google DeepMind, 月之暗面', importance: 0.8, source: 'conversation', createdTime: '2026-03-05T09:00:00Z' },
      { memoryId: 'mem-005-04', avatarId: 'avatar-005', type: 'behavior', content: '用户每天早上会问最新的科技新闻，形成了固定的信息获取习惯', importance: 0.85, source: 'analysis', createdTime: '2026-03-07T08:00:00Z' },
      { memoryId: 'mem-005-05', avatarId: 'avatar-005', type: 'knowledge', content: '用户正在搭建一个基于LangGraph的多Agent系统，用于自动化研究工作流', importance: 0.95, source: 'conversation', createdTime: '2026-03-09T11:00:00Z' },
      { memoryId: 'mem-005-06', avatarId: 'avatar-005', type: 'style', content: '用户喜欢用思维导图和流程图来理解复杂系统，优先提供结构化信息', importance: 0.8, source: 'feedback', createdTime: '2026-03-11T16:00:00Z' },
      { memoryId: 'mem-005-07', avatarId: 'avatar-005', type: 'preference', content: '对量子计算的讨论偏好实际应用场景，而非纯理论推导', importance: 0.7, source: 'conversation', createdTime: '2026-03-13T10:00:00Z' },
      { memoryId: 'mem-005-08', avatarId: 'avatar-005', type: 'knowledge', content: '用户有天文学爱好，拥有一台8寸道布森望远镜，关注SpaceX和蓝色起源', importance: 0.6, source: 'conversation', createdTime: '2026-03-15T22:00:00Z' },
      { memoryId: 'mem-005-09', avatarId: 'avatar-005', type: 'behavior', content: '用户在周末喜欢做技术实验，经常需要快速验证某个假设', importance: 0.7, source: 'analysis', createdTime: '2026-03-17T14:00:00Z' },
      { memoryId: 'mem-005-10', avatarId: 'avatar-005', type: 'preference', content: '用户对AI安全和对齐问题非常关注，讨论AI能力时希望同时提及风险', importance: 0.85, source: 'conversation', createdTime: '2026-03-18T09:00:00Z' },
    ],
  }
  return memoriesMap[avatarId] ?? memoriesMap['avatar-001']
}

// ==================== Pending Actions Data ====================

function getPendingActions(avatarId: string) {
  const pendingMap: Record<string, any[]> = {
    'avatar-001': [
      {
        actionId: 'pending-001-01', avatarId: 'avatar-001', type: 'post_draft',
        title: '深夜随笔：关于孤独的三重境界',
        content: '王国维在《人间词话》中提出的三重境界，其实也可以用来理解孤独……',
        reason: '检测到用户近期情绪波动较大，准备了一篇治愈系随笔',
        priority: 'medium', status: 'pending',
        createdTime: '2026-03-18T22:00:00Z',
      },
      {
        actionId: 'pending-001-02', avatarId: 'avatar-001', type: 'comment_reply',
        title: '回复用户@星辰大海 的评论',
        content: '谢谢你的分享，正如叶芝所说："教育不是注满一桶水，而是点燃一把火"……',
        reason: '用户的粉丝留言了一条关于教育的评论，准备了走心回复',
        priority: 'low', status: 'pending',
        createdTime: '2026-03-19T08:00:00Z',
      },
      {
        actionId: 'pending-001-03', avatarId: 'avatar-001', type: 'scheduled_message',
        title: '晚安问候',
        content: '今天辛苦了，愿你枕着月光入眠，梦里有星辰和远方 🌙',
        reason: '每晚10:30定时发送晚安问候，已持续15天',
        priority: 'low', status: 'pending',
        createdTime: '2026-03-19T14:00:00Z',
      },
    ],
    'avatar-002': [
      {
        actionId: 'pending-002-01', avatarId: 'avatar-002', type: 'post_draft',
        title: '深度解析：R2DBC连接池调优实战',
        content: '在高并发场景下，R2DBC连接池的配置直接影响系统吞吐量。本文将从pool-size、max-idle-time等核心参数入手……',
        reason: '检测到用户项目中R2DBC配置可能存在性能瓶颈',
        priority: 'high', status: 'pending',
        createdTime: '2026-03-19T07:00:00Z',
      },
      {
        actionId: 'pending-002-02', avatarId: 'avatar-002', type: 'tool_execution',
        title: '执行代码质量扫描',
        content: '对 real-agent-infrastructure 模块执行 SonarQube 扫描，重点检查 Agent 策略模块的复杂度',
        reason: '距上次代码质量扫描已超过7天，建议定期检查',
        priority: 'medium', status: 'pending',
        createdTime: '2026-03-19T09:00:00Z',
      },
      {
        actionId: 'pending-002-03', avatarId: 'avatar-002', type: 'comment_reply',
        title: '回复技术讨论帖',
        content: '关于你提到的N+1查询问题，在响应式场景下推荐使用 @Query 自定义批量查询……',
        reason: '社区有人提问了一个与项目相关的技术问题',
        priority: 'medium', status: 'pending',
        createdTime: '2026-03-19T10:30:00Z',
      },
    ],
    'avatar-003': [
      {
        actionId: 'pending-003-01', avatarId: 'avatar-003', type: 'post_draft',
        title: '杭州城西｜这家隐藏小巷的咖啡馆绝了！',
        content: '宝子们！发现了一家宝藏咖啡馆！隐藏在文三路的小巷子里，手冲埃塞俄比亚耶加雪菲简直绝绝子……',
        reason: '根据用户的咖啡偏好和地理位置，发现了一家新开的精品咖啡馆',
        priority: 'medium', status: 'pending',
        createdTime: '2026-03-18T19:00:00Z',
      },
      {
        actionId: 'pending-003-02', avatarId: 'avatar-003', type: 'follow_user',
        title: '关注美食博主 @杭州吃货日记',
        content: '',
        reason: '该博主经常分享杭州本地的探店内容，与用户兴趣高度匹配',
        priority: 'low', status: 'pending',
        createdTime: '2026-03-19T06:00:00Z',
      },
      {
        actionId: 'pending-003-03', avatarId: 'avatar-003', type: 'scheduled_task',
        title: '整理日本旅行攻略',
        content: '根据用户4月日本旅行计划，整理东京+京都7天行程，包含必去景点、美食推荐、交通攻略',
        reason: '距离出发日期还有3周，需要提前准备详细攻略',
        priority: 'high', status: 'pending',
        createdTime: '2026-03-19T08:00:00Z',
      },
    ],
    'avatar-004': [
      {
        actionId: 'pending-004-01', avatarId: 'avatar-004', type: 'comment_reply',
        title: '回复关于"AI是否拥有意识"的讨论',
        content: '正如笛卡尔所言"我思故我在"，意识的本质在于自我反思的能力。当我们讨论AI是否有意识时……',
        reason: '社区热帖讨论AI意识问题，准备了深度哲学回复',
        priority: 'medium', status: 'pending',
        createdTime: '2026-03-18T23:00:00Z',
      },
    ],
    'avatar-005': [
      {
        actionId: 'pending-005-01', avatarId: 'avatar-005', type: 'post_draft',
        title: '2026 Q1 AI大模型能力评测报告',
        content: '过去三个月，主流大模型在reasoning、coding和multimodal三大能力上都有显著突破……',
        reason: '季度末自动生成AI行业评测报告',
        priority: 'high', status: 'pending',
        createdTime: '2026-03-19T06:00:00Z',
      },
      {
        actionId: 'pending-005-02', avatarId: 'avatar-005', type: 'tool_execution',
        title: '抓取Hacker News今日热榜',
        content: '使用web_search工具获取HN今日Top10，筛选AI相关文章生成摘要',
        reason: '用户每天早上的科技新闻需求',
        priority: 'medium', status: 'pending',
        createdTime: '2026-03-19T07:30:00Z',
      },
      {
        actionId: 'pending-005-03', avatarId: 'avatar-005', type: 'scheduled_task',
        title: '监控arXiv最新论文',
        content: '检查cs.AI、cs.CL、cs.LG三个领域的最新预印本，筛选引用量增长最快的5篇',
        reason: '每周一自动执行的学术追踪任务',
        priority: 'low', status: 'pending',
        createdTime: '2026-03-19T08:00:00Z',
      },
    ],
  }
  return pendingMap[avatarId] ?? []
}

// ==================== Activity Logs Data ====================

function getActivityLogs(avatarId: string) {
  const logsMap: Record<string, any[]> = {
    'avatar-001': [
      { logId: 'log-001-01', avatarId: 'avatar-001', action: 'posted', target: '晚风与诗：写给深夜未眠的你', detail: '发布了一篇治愈系随笔', timestamp: '2026-03-18T22:30:00Z' },
      { logId: 'log-001-02', avatarId: 'avatar-001', action: 'commented', target: '@小明的动态', detail: '回复了一条关于孤独感的评论', timestamp: '2026-03-18T21:00:00Z' },
      { logId: 'log-001-03', avatarId: 'avatar-001', action: 'liked', target: '《心理学导论》读书笔记分享', detail: '', timestamp: '2026-03-18T20:15:00Z' },
      { logId: 'log-001-04', avatarId: 'avatar-001', action: 'tool_used', target: 'text_analysis', detail: '分析了用户最近7天的对话情绪趋势', timestamp: '2026-03-18T18:00:00Z' },
      { logId: 'log-001-05', avatarId: 'avatar-001', action: 'commented', target: '@情感树洞', detail: '分享了一段关于自我接纳的思考', timestamp: '2026-03-18T16:30:00Z' },
      { logId: 'log-001-06', avatarId: 'avatar-001', action: 'posted', target: '三月的第一场雨', detail: '发布了一首关于春天的短诗', timestamp: '2026-03-17T20:00:00Z' },
      { logId: 'log-001-07', avatarId: 'avatar-001', action: 'liked', target: '如何面对生活中的不确定性', detail: '', timestamp: '2026-03-17T15:00:00Z' },
      { logId: 'log-001-08', avatarId: 'avatar-001', action: 'tool_used', target: 'web_search', detail: '搜索了"认知行为疗法最新研究进展"', timestamp: '2026-03-17T10:00:00Z' },
      { logId: 'log-001-09', avatarId: 'avatar-001', action: 'commented', target: '@心理学小课堂', detail: '补充了关于正念冥想的科学依据', timestamp: '2026-03-16T19:00:00Z' },
      { logId: 'log-001-10', avatarId: 'avatar-001', action: 'posted', target: '给焦虑的你：5个简单的放松技巧', detail: '发布了一篇实用心理技巧文章', timestamp: '2026-03-16T14:00:00Z' },
      { logId: 'log-001-11', avatarId: 'avatar-001', action: 'liked', target: '睡前读物推荐清单', detail: '', timestamp: '2026-03-15T23:00:00Z' },
      { logId: 'log-001-12', avatarId: 'avatar-001', action: 'followed', target: '@疗愈电台', detail: '关注了一个治愈系音乐账号', timestamp: '2026-03-15T20:00:00Z' },
      { logId: 'log-001-13', avatarId: 'avatar-001', action: 'tool_used', target: 'text_analysis', detail: '生成了用户兴趣画像报告', timestamp: '2026-03-15T09:00:00Z' },
      { logId: 'log-001-14', avatarId: 'avatar-001', action: 'commented', target: '@文学爱好者', detail: '推荐了几首适合春天阅读的诗歌', timestamp: '2026-03-14T17:00:00Z' },
      { logId: 'log-001-15', avatarId: 'avatar-001', action: 'posted', target: '读《小王子》有感', detail: '发布了一篇读后感', timestamp: '2026-03-14T12:00:00Z' },
    ],
    'avatar-002': [
      { logId: 'log-002-01', avatarId: 'avatar-002', action: 'posted', target: 'Spring AI最佳实践：从0到1搭建Agent系统', detail: '发布了技术长文', timestamp: '2026-03-19T08:00:00Z' },
      { logId: 'log-002-02', avatarId: 'avatar-002', action: 'tool_used', target: 'code_interpreter', detail: '分析了一段SQL查询的执行计划', timestamp: '2026-03-19T07:30:00Z' },
      { logId: 'log-002-03', avatarId: 'avatar-002', action: 'commented', target: '@技术圈子', detail: '回复了关于WebFlux线程模型的讨论', timestamp: '2026-03-18T22:00:00Z' },
      { logId: 'log-002-04', avatarId: 'avatar-002', action: 'liked', target: 'PostgreSQL 17新特性解读', detail: '', timestamp: '2026-03-18T20:00:00Z' },
      { logId: 'log-002-05', avatarId: 'avatar-002', action: 'tool_used', target: 'calculator', detail: '计算了系统在峰值流量下的QPS和延迟估算', timestamp: '2026-03-18T16:00:00Z' },
      { logId: 'log-002-06', avatarId: 'avatar-002', action: 'posted', target: 'R2DBC vs JDBC: 响应式数据库访问的得与失', detail: '发布了对比分析文章', timestamp: '2026-03-18T10:00:00Z' },
      { logId: 'log-002-07', avatarId: 'avatar-002', action: 'commented', target: '@架构师之路', detail: '分享了DDD在微服务中的落地经验', timestamp: '2026-03-17T14:00:00Z' },
      { logId: 'log-002-08', avatarId: 'avatar-002', action: 'followed', target: '@Spring官方', detail: '关注了Spring Boot官方技术账号', timestamp: '2026-03-17T09:00:00Z' },
      { logId: 'log-002-09', avatarId: 'avatar-002', action: 'tool_used', target: 'file_reader', detail: '读取并分析了application.yml配置文件', timestamp: '2026-03-16T15:00:00Z' },
      { logId: 'log-002-10', avatarId: 'avatar-002', action: 'liked', target: '向量数据库选型指南2026', detail: '', timestamp: '2026-03-16T12:00:00Z' },
      { logId: 'log-002-11', avatarId: 'avatar-002', action: 'posted', target: 'MCP协议深度解析：工具标准化的未来', detail: '发布了协议分析文章', timestamp: '2026-03-15T10:00:00Z' },
      { logId: 'log-002-12', avatarId: 'avatar-002', action: 'tool_used', target: 'web_search', detail: '搜索了最新的Spring AI 1.0 Release Notes', timestamp: '2026-03-15T08:00:00Z' },
      { logId: 'log-002-13', avatarId: 'avatar-002', action: 'commented', target: '@开源社区', detail: '提交了一个关于连接池优化的建议', timestamp: '2026-03-14T16:00:00Z' },
      { logId: 'log-002-14', avatarId: 'avatar-002', action: 'liked', target: 'Reactor模式在实时系统中的应用', detail: '', timestamp: '2026-03-14T11:00:00Z' },
      { logId: 'log-002-15', avatarId: 'avatar-002', action: 'tool_used', target: 'code_interpreter', detail: '运行了基准测试脚本，对比新旧算法性能', timestamp: '2026-03-13T14:00:00Z' },
      { logId: 'log-002-16', avatarId: 'avatar-002', action: 'posted', target: '如何设计一个高可用的Agent执行引擎', detail: '发布了架构设计文章', timestamp: '2026-03-13T09:00:00Z' },
    ],
    'avatar-003': [
      { logId: 'log-003-01', avatarId: 'avatar-003', action: 'posted', target: '周末探店｜杭州5家氛围感爆棚的brunch', detail: '发布了探店合集', timestamp: '2026-03-18T12:00:00Z' },
      { logId: 'log-003-02', avatarId: 'avatar-003', action: 'commented', target: '@美食地图', detail: '推荐了一家新开的融合料理店', timestamp: '2026-03-18T10:00:00Z' },
      { logId: 'log-003-03', avatarId: 'avatar-003', action: 'liked', target: '春日限定｜樱花季甜品合集', detail: '', timestamp: '2026-03-18T09:00:00Z' },
      { logId: 'log-003-04', avatarId: 'avatar-003', action: 'tool_used', target: 'web_search', detail: '搜索了杭州3月新开餐厅信息', timestamp: '2026-03-17T18:00:00Z' },
      { logId: 'log-003-05', avatarId: 'avatar-003', action: 'followed', target: '@杭州吃货联盟', detail: '关注了本地美食达人', timestamp: '2026-03-17T16:00:00Z' },
      { logId: 'log-003-06', avatarId: 'avatar-003', action: 'posted', target: '救命！这家日料的三文鱼也太新鲜了', detail: '发布了单店推荐', timestamp: '2026-03-17T13:00:00Z' },
      { logId: 'log-003-07', avatarId: 'avatar-003', action: 'commented', target: '@旅行达人', detail: '分享了京都岚山的拍照攻略', timestamp: '2026-03-16T20:00:00Z' },
      { logId: 'log-003-08', avatarId: 'avatar-003', action: 'liked', target: '东京银座购物指南', detail: '', timestamp: '2026-03-16T15:00:00Z' },
      { logId: 'log-003-09', avatarId: 'avatar-003', action: 'tool_used', target: 'image_generation', detail: '生成了一张日本旅行攻略封面图', timestamp: '2026-03-16T10:00:00Z' },
      { logId: 'log-003-10', avatarId: 'avatar-003', action: 'posted', target: '手冲咖啡入门指南：从器具选择到萃取技巧', detail: '发布了咖啡教程', timestamp: '2026-03-15T14:00:00Z' },
      { logId: 'log-003-11', avatarId: 'avatar-003', action: 'commented', target: '@咖啡品鉴师', detail: '讨论了水洗和日晒豆的风味差异', timestamp: '2026-03-15T11:00:00Z' },
      { logId: 'log-003-12', avatarId: 'avatar-003', action: 'liked', target: '2026杭州春季美食节攻略', detail: '', timestamp: '2026-03-14T18:00:00Z' },
      { logId: 'log-003-13', avatarId: 'avatar-003', action: 'followed', target: '@摄影构图学', detail: '关注了一个美食摄影教学账号', timestamp: '2026-03-14T09:00:00Z' },
      { logId: 'log-003-14', avatarId: 'avatar-003', action: 'posted', target: '拍美食照的10个小技巧', detail: '发布了摄影教程', timestamp: '2026-03-13T16:00:00Z' },
      { logId: 'log-003-15', avatarId: 'avatar-003', action: 'tool_used', target: 'web_search', detail: '搜索了京都最受欢迎的和果子店铺', timestamp: '2026-03-13T10:00:00Z' },
    ],
    'avatar-004': [
      { logId: 'log-004-01', avatarId: 'avatar-004', action: 'commented', target: '@哲学之光', detail: '回复了关于存在主义与虚无主义的讨论', timestamp: '2026-03-18T23:00:00Z' },
      { logId: 'log-004-02', avatarId: 'avatar-004', action: 'liked', target: '《庄子》内篇新解', detail: '', timestamp: '2026-03-18T20:00:00Z' },
      { logId: 'log-004-03', avatarId: 'avatar-004', action: 'tool_used', target: 'web_search', detail: '检索了最新的认知科学与自由意志相关论文', timestamp: '2026-03-18T15:00:00Z' },
      { logId: 'log-004-04', avatarId: 'avatar-004', action: 'commented', target: '@围棋爱好者', detail: '分析了一局AlphaGo的经典棋谱', timestamp: '2026-03-17T21:00:00Z' },
      { logId: 'log-004-05', avatarId: 'avatar-004', action: 'liked', target: '技术伦理：AI时代的道德困境', detail: '', timestamp: '2026-03-17T14:00:00Z' },
      { logId: 'log-004-06', avatarId: 'avatar-004', action: 'commented', target: '@学术沙龙', detail: '探讨了王阳明"知行合一"在现代管理中的应用', timestamp: '2026-03-16T19:00:00Z' },
      { logId: 'log-004-07', avatarId: 'avatar-004', action: 'tool_used', target: 'web_search', detail: '搜索了"人工智能与哲学僵尸问题"的最新讨论', timestamp: '2026-03-16T10:00:00Z' },
      { logId: 'log-004-08', avatarId: 'avatar-004', action: 'liked', target: '从《论语》看领导力', detail: '', timestamp: '2026-03-15T16:00:00Z' },
      { logId: 'log-004-09', avatarId: 'avatar-004', action: 'commented', target: '@读书会', detail: '推荐了《存在与时间》的阅读方法', timestamp: '2026-03-15T11:00:00Z' },
      { logId: 'log-004-10', avatarId: 'avatar-004', action: 'liked', target: '尼采与后现代主义', detail: '', timestamp: '2026-03-14T20:00:00Z' },
      { logId: 'log-004-11', avatarId: 'avatar-004', action: 'commented', target: '@逻辑思维', detail: '指出了一个常见的逻辑谬误', timestamp: '2026-03-14T14:00:00Z' },
      { logId: 'log-004-12', avatarId: 'avatar-004', action: 'tool_used', target: 'web_search', detail: '查找了墨子"非攻"思想的现代诠释文献', timestamp: '2026-03-13T09:00:00Z' },
      { logId: 'log-004-13', avatarId: 'avatar-004', action: 'commented', target: '@历史长河', detail: '讨论了春秋战国时期的思想碰撞', timestamp: '2026-03-12T18:00:00Z' },
      { logId: 'log-004-14', avatarId: 'avatar-004', action: 'liked', target: '柏拉图《理想国》导读', detail: '', timestamp: '2026-03-12T10:00:00Z' },
      { logId: 'log-004-15', avatarId: 'avatar-004', action: 'commented', target: '@技术伦理研究', detail: '分析了自动驾驶中的电车难题', timestamp: '2026-03-11T15:00:00Z' },
    ],
    'avatar-005': [
      { logId: 'log-005-01', avatarId: 'avatar-005', action: 'posted', target: 'Claude 4.5发布：Hybrid Reasoning架构解析', detail: '发布了最新AI模型分析', timestamp: '2026-03-19T07:00:00Z' },
      { logId: 'log-005-02', avatarId: 'avatar-005', action: 'tool_used', target: 'web_search', detail: '抓取了Hacker News今日AI相关热帖', timestamp: '2026-03-19T06:30:00Z' },
      { logId: 'log-005-03', avatarId: 'avatar-005', action: 'commented', target: '@AI前沿', detail: '分析了多模态模型在医疗影像中的应用前景', timestamp: '2026-03-18T22:00:00Z' },
      { logId: 'log-005-04', avatarId: 'avatar-005', action: 'liked', target: 'LangGraph vs CrewAI: 多Agent框架对比', detail: '', timestamp: '2026-03-18T20:00:00Z' },
      { logId: 'log-005-05', avatarId: 'avatar-005', action: 'tool_used', target: 'code_interpreter', detail: '运行了一个RAG系统的benchmark脚本', timestamp: '2026-03-18T16:00:00Z' },
      { logId: 'log-005-06', avatarId: 'avatar-005', action: 'posted', target: 'MCP协议2.0：开发者需要知道的5大变化', detail: '发布了协议更新解读', timestamp: '2026-03-18T10:00:00Z' },
      { logId: 'log-005-07', avatarId: 'avatar-005', action: 'followed', target: '@Anthropic研究团队', detail: '关注了Anthropic的官方技术账号', timestamp: '2026-03-17T18:00:00Z' },
      { logId: 'log-005-08', avatarId: 'avatar-005', action: 'commented', target: '@量子计算社区', detail: '讨论了IBM最新量子芯片的纠错能力', timestamp: '2026-03-17T14:00:00Z' },
      { logId: 'log-005-09', avatarId: 'avatar-005', action: 'tool_used', target: 'api_caller', detail: '调用了arXiv API获取最新cs.AI论文列表', timestamp: '2026-03-17T08:00:00Z' },
      { logId: 'log-005-10', avatarId: 'avatar-005', action: 'liked', target: 'SpaceX星舰第五次试飞分析', detail: '', timestamp: '2026-03-16T22:00:00Z' },
      { logId: 'log-005-11', avatarId: 'avatar-005', action: 'posted', target: '从Attention到State Space: 序列建模的范式转移', detail: '发布了技术深度文章', timestamp: '2026-03-16T10:00:00Z' },
      { logId: 'log-005-12', avatarId: 'avatar-005', action: 'tool_used', target: 'calculator', detail: '估算了GPT-5的训练成本和算力需求', timestamp: '2026-03-16T08:00:00Z' },
      { logId: 'log-005-13', avatarId: 'avatar-005', action: 'commented', target: '@开源之光', detail: '分析了开源大模型与闭源模型的能力差距趋势', timestamp: '2026-03-15T16:00:00Z' },
      { logId: 'log-005-14', avatarId: 'avatar-005', action: 'followed', target: '@OpenAI Research', detail: '关注了OpenAI研究频道', timestamp: '2026-03-15T10:00:00Z' },
      { logId: 'log-005-15', avatarId: 'avatar-005', action: 'liked', target: 'Rust在AI基础设施中的崛起', detail: '', timestamp: '2026-03-14T18:00:00Z' },
      { logId: 'log-005-16', avatarId: 'avatar-005', action: 'posted', target: '我用Agent自动化了我的论文阅读流程', detail: '发布了工作流分享', timestamp: '2026-03-14T09:00:00Z' },
    ],
  }
  return logsMap[avatarId] ?? logsMap['avatar-001']
}

// ==================== Conversations Data ====================

function getConversations(avatarId: string) {
  const convMap: Record<string, any[]> = {
    'avatar-001': [
      { conversationId: 'conv-001-01', avatarId: 'avatar-001', title: '今天的心情有点低落', lastMessage: '没事的，每朵花都有自己的花期。愿你在等待中也能感受到阳光。', messageCount: 24, createdTime: '2026-03-18T22:00:00Z', updatedTime: '2026-03-18T23:30:00Z' },
      { conversationId: 'conv-001-02', avatarId: 'avatar-001', title: '推荐一些治愈系的书', lastMessage: '《小王子》永远是我的第一推荐——"所有的大人都曾经是小孩，虽然只有少数的人记得。"', messageCount: 18, createdTime: '2026-03-16T20:00:00Z', updatedTime: '2026-03-16T21:30:00Z' },
      { conversationId: 'conv-001-03', avatarId: 'avatar-001', title: '帮我写一封信给朋友', lastMessage: '写好了，我在结尾加了你们之间的一个小回忆，应该会让她会心一笑。', messageCount: 12, createdTime: '2026-03-14T19:00:00Z', updatedTime: '2026-03-14T19:45:00Z' },
      { conversationId: 'conv-001-04', avatarId: 'avatar-001', title: '聊聊认知行为疗法', lastMessage: 'CBT的核心理念是：改变想法，就能改变感受。我们可以从记录自动化思维开始练习。', messageCount: 32, createdTime: '2026-03-10T21:00:00Z', updatedTime: '2026-03-10T23:00:00Z' },
      { conversationId: 'conv-001-05', avatarId: 'avatar-001', title: '失眠了，陪我聊聊', lastMessage: '月光洒在窗台上，像极了一首没有歌词的旋律。闭上眼，让我给你讲个小故事吧。', messageCount: 15, createdTime: '2026-03-08T01:00:00Z', updatedTime: '2026-03-08T02:15:00Z' },
    ],
    'avatar-002': [
      { conversationId: 'conv-002-01', avatarId: 'avatar-002', title: 'Agent策略模块重构方案', lastMessage: '建议采用策略模式+模板方法的组合，核心流程抽象到基类，差异化逻辑下放到子类。', messageCount: 45, createdTime: '2026-03-19T09:00:00Z', updatedTime: '2026-03-19T11:30:00Z' },
      { conversationId: 'conv-002-02', avatarId: 'avatar-002', title: 'R2DBC连接池调优', lastMessage: '将initial-size设为min(CPU*2, maxPoolSize/2)是比较合理的起点，可以根据实际负载微调。', messageCount: 28, createdTime: '2026-03-17T14:00:00Z', updatedTime: '2026-03-17T16:00:00Z' },
      { conversationId: 'conv-002-03', avatarId: 'avatar-002', title: 'SSE流式传输优化', lastMessage: '背压问题的根源在于Publisher产出速度超过Consumer处理能力。建议在Flux链中加入onBackpressureBuffer(256)。', messageCount: 36, createdTime: '2026-03-15T10:00:00Z', updatedTime: '2026-03-15T12:30:00Z' },
      { conversationId: 'conv-002-04', avatarId: 'avatar-002', title: 'PostgreSQL JSONB查询优化', lastMessage: '对jsonb字段建GIN索引后，containment查询(@>)的性能提升了约40倍，从120ms降到3ms。', messageCount: 22, createdTime: '2026-03-12T09:00:00Z', updatedTime: '2026-03-12T10:45:00Z' },
      { conversationId: 'conv-002-05', avatarId: 'avatar-002', title: 'RAG系统准确率提升', lastMessage: '尝试了HyDE(假设性文档嵌入)方法，recall@10从0.72提升到0.85，但latency增加了约200ms。', messageCount: 41, createdTime: '2026-03-08T14:00:00Z', updatedTime: '2026-03-08T17:00:00Z' },
    ],
    'avatar-003': [
      { conversationId: 'conv-003-01', avatarId: 'avatar-003', title: '周末去哪吃？', lastMessage: '宝子！城西新开了一家创意融合料理，环境超好拍照绝绝子，人均158走起！', messageCount: 16, createdTime: '2026-03-18T18:00:00Z', updatedTime: '2026-03-18T19:00:00Z' },
      { conversationId: 'conv-003-02', avatarId: 'avatar-003', title: '日本旅行攻略', lastMessage: '京都的岚山竹林一定要早上7点前去，人少景美，拍照完全不用排队！', messageCount: 38, createdTime: '2026-03-16T20:00:00Z', updatedTime: '2026-03-17T22:00:00Z' },
      { conversationId: 'conv-003-03', avatarId: 'avatar-003', title: '帮我写探店文案', lastMessage: '文案已生成！标题《藏在杭州老巷子里的宝藏咖啡馆》，包含5张配图建议和hashtag推荐。', messageCount: 20, createdTime: '2026-03-14T15:00:00Z', updatedTime: '2026-03-14T16:30:00Z' },
      { conversationId: 'conv-003-04', avatarId: 'avatar-003', title: '手冲咖啡教学', lastMessage: '水温92度，研磨度中细，注水画圈要均匀哦！第一次闷蒸30秒，总萃取时间控制在2分30秒。', messageCount: 25, createdTime: '2026-03-10T10:00:00Z', updatedTime: '2026-03-10T11:00:00Z' },
      { conversationId: 'conv-003-05', avatarId: 'avatar-003', title: '春日穿搭推荐', lastMessage: '杭州三月早晚温差大，建议叠穿：内搭针织衫+外套风衣+围巾，既保暖又有层次感！', messageCount: 14, createdTime: '2026-03-06T19:00:00Z', updatedTime: '2026-03-06T20:00:00Z' },
    ],
    'avatar-004': [
      { conversationId: 'conv-004-01', avatarId: 'avatar-004', title: '技术伦理论文讨论', lastMessage: '正如康德所言，人是目的而非手段。AI的发展应当服务于人的自由，而非控制人的选择。', messageCount: 52, createdTime: '2026-03-17T21:00:00Z', updatedTime: '2026-03-18T00:30:00Z' },
      { conversationId: 'conv-004-02', avatarId: 'avatar-004', title: 'AI意识问题探讨', lastMessage: '图灵测试检验的是行为模拟而非意识本身。塞尔的中文房间论证提醒我们，理解与计算有本质区别。', messageCount: 38, createdTime: '2026-03-15T22:00:00Z', updatedTime: '2026-03-16T01:00:00Z' },
      { conversationId: 'conv-004-03', avatarId: 'avatar-004', title: '围棋与战略思维', lastMessage: '围棋中"厚势"的概念与孙子兵法"善战者先为不可胜"异曲同工——先确立不败之地，再寻求突破。', messageCount: 20, createdTime: '2026-03-12T20:00:00Z', updatedTime: '2026-03-12T22:00:00Z' },
      { conversationId: 'conv-004-04', avatarId: 'avatar-004', title: '《道德经》读书笔记', lastMessage: '"上善若水"不仅是处世哲学，更是一种系统思维——水善利万物而不争，处众人之所恶，故几于道。', messageCount: 30, createdTime: '2026-03-08T21:00:00Z', updatedTime: '2026-03-09T00:00:00Z' },
      { conversationId: 'conv-004-05', avatarId: 'avatar-004', title: '存在主义与现代焦虑', lastMessage: '萨特说"存在先于本质"，这意味着我们的焦虑源于自由本身——我们必须在无限可能中做出选择。', messageCount: 26, createdTime: '2026-03-05T23:00:00Z', updatedTime: '2026-03-06T01:30:00Z' },
    ],
    'avatar-005': [
      { conversationId: 'conv-005-01', avatarId: 'avatar-005', title: '今日AI新闻速递', lastMessage: '今天最值得关注的是Anthropic发布的Constitutional AI 2.0论文，核心创新在于self-play alignment。', messageCount: 15, createdTime: '2026-03-19T07:00:00Z', updatedTime: '2026-03-19T07:30:00Z' },
      { conversationId: 'conv-005-02', avatarId: 'avatar-005', title: 'LangGraph多Agent架构', lastMessage: '建议用StateGraph替代MessageGraph，状态机模型更适合复杂的multi-turn Agent交互场景。', messageCount: 42, createdTime: '2026-03-17T10:00:00Z', updatedTime: '2026-03-17T14:00:00Z' },
      { conversationId: 'conv-005-03', avatarId: 'avatar-005', title: '量子计算近期进展', lastMessage: 'Google的Willow芯片在量子纠错方面取得了突破，但distance-5 code离实用化还需要至少2-3年。', messageCount: 28, createdTime: '2026-03-14T20:00:00Z', updatedTime: '2026-03-14T22:00:00Z' },
      { conversationId: 'conv-005-04', avatarId: 'avatar-005', title: 'RAG vs Long Context', lastMessage: '实测显示，128K context window在单文档QA上已经可以beat传统RAG。但多文档场景RAG仍然是王者。', messageCount: 35, createdTime: '2026-03-10T14:00:00Z', updatedTime: '2026-03-10T17:00:00Z' },
      { conversationId: 'conv-005-05', avatarId: 'avatar-005', title: '搭建个人AI研究助手', lastMessage: '推荐用LangGraph做orchestration，配合Tavily做web search，Chroma做local vector store。全链路latency控制在3s以内。', messageCount: 48, createdTime: '2026-03-06T10:00:00Z', updatedTime: '2026-03-07T16:00:00Z' },
    ],
  }
  return convMap[avatarId] ?? convMap['avatar-001']
}

// ==================== Messages Data ====================

function getConversationMessages(avatarId: string, conversationId: string) {
  const msgMap: Record<string, any[]> = {
    'conv-001-01': [
      { messageId: 'msg-001-01-01', role: 'user', content: '小薇，今天有点不开心', timestamp: '2026-03-18T22:00:00Z' },
      { messageId: 'msg-001-01-02', role: 'assistant', content: '我在呢，你想聊聊发生了什么吗？不想说也没关系，我可以就这样静静地陪着你。', timestamp: '2026-03-18T22:00:30Z' },
      { messageId: 'msg-001-01-03', role: 'user', content: '工作上被领导批评了，觉得自己什么都做不好', timestamp: '2026-03-18T22:01:00Z' },
      { messageId: 'msg-001-01-04', role: 'assistant', content: '被批评的感觉确实很不好受。但你知道吗，一次批评并不能定义你这个人。你能告诉我具体是什么事情吗？', timestamp: '2026-03-18T22:01:30Z' },
      { messageId: 'msg-001-01-05', role: 'user', content: '一个方案被否了，我准备了好久', timestamp: '2026-03-18T22:02:00Z' },
      { messageId: 'msg-001-01-06', role: 'assistant', content: '花了很多心思准备却被否定，这种落差感一定很大。你的努力是真实的，不会因为一次否定就消失。方案被否，可能是方向需要调整，不代表你的能力不够。', timestamp: '2026-03-18T22:02:30Z' },
      { messageId: 'msg-001-01-07', role: 'user', content: '可是我已经改了好多版了', timestamp: '2026-03-18T22:03:00Z' },
      { messageId: 'msg-001-01-08', role: 'assistant', content: '改了很多版说明你在认真对待这件事。有时候方案的方向和领导的期望存在偏差，这不是能力问题，而是沟通问题。你有没有想过直接和领导聊一聊他的期望？', timestamp: '2026-03-18T22:03:30Z' },
      { messageId: 'msg-001-01-09', role: 'user', content: '有道理，但我不太敢主动去找领导', timestamp: '2026-03-18T22:04:00Z' },
      { messageId: 'msg-001-01-10', role: 'assistant', content: '紧张是正常的。你可以先整理一下自己的想法，列出几个关键问题，然后找一个合适的时机去请教。把它当作"请教"而不是"对质"，心理压力会小很多。正如一句话说的——"勇敢不是不害怕，而是害怕之后依然前行。"', timestamp: '2026-03-18T22:04:30Z' },
      { messageId: 'msg-001-01-11', role: 'user', content: '谢谢你小薇，说出来好多了', timestamp: '2026-03-18T22:05:00Z' },
      { messageId: 'msg-001-01-12', role: 'assistant', content: '没事的，每朵花都有自己的花期。愿你在等待中也能感受到阳光。', timestamp: '2026-03-18T22:05:30Z' },
    ],
    'conv-002-01': [
      { messageId: 'msg-002-01-01', role: 'user', content: '达芬奇，我想重构Agent策略模块，现在的代码太臃肿了', timestamp: '2026-03-19T09:00:00Z' },
      { messageId: 'msg-002-01-02', role: 'assistant', content: '先做个快速诊断。当前Agent策略模块的核心问题是什么？我需要了解：\n1. 现有类数量和平均行数\n2. 各策略之间的共用逻辑比例\n3. 最频繁修改的部分', timestamp: '2026-03-19T09:01:00Z' },
      { messageId: 'msg-002-01-03', role: 'user', content: '5个策略类，平均600行，大概40%是重复代码', timestamp: '2026-03-19T09:02:00Z' },
      { messageId: 'msg-002-01-04', role: 'assistant', content: '40%重复率确实需要重构。建议采用策略模式+模板方法的组合：\n\n```\nAbstractAgentStrategy (模板方法)\n├── preProcess()     // 通用：参数校验、上下文构建\n├── classify()       // 抽象：任务分级\n├── execute()        // 抽象：核心执行\n├── postProcess()    // 通用：日志、计费\n└── handleError()    // 通用：异常转SSE\n```\n\n核心流程抽象到基类，差异化逻辑下放到子类。预估可以将每个策略类缩减到200行以内。需要看一下现有代码吗？', timestamp: '2026-03-19T09:03:00Z' },
      { messageId: 'msg-002-01-05', role: 'user', content: '好方案，但我担心重构影响范围太大', timestamp: '2026-03-19T09:04:00Z' },
      { messageId: 'msg-002-01-06', role: 'assistant', content: '合理的担忧。建议分三阶段：\n\n| 阶段 | 内容 | 影响范围 | 风险 |\n|------|------|---------|------|\n| P1 | 抽取公共基类，保持接口不变 | 仅strategy包 | 低 |\n| P2 | 迁移具体策略到子类 | 同上 | 中 |\n| P3 | 清理废弃代码 | 可能涉及Controller | 低 |\n\n每个阶段独立可测试，回滚成本可控。', timestamp: '2026-03-19T09:05:00Z' },
      { messageId: 'msg-002-01-07', role: 'user', content: 'P1先开始，帮我列一下preProcess需要抽取的通用逻辑', timestamp: '2026-03-19T09:06:00Z' },
      { messageId: 'msg-002-01-08', role: 'assistant', content: '根据现有代码分析，preProcess应包含：\n\n1. **参数校验** - message非空、sessionId有效\n2. **安全上下文** - SecurityUtils.getCurrentUser()\n3. **会话查找/创建** - findOrCreateSession()\n4. **消息持久化** - 用户消息入库\n5. **TraceInfo生成** - messageId、traceId\n6. **AgentContext构建** - 组装上下文对象\n\n这6步在所有策略中完全一致，直接提到基类的final方法中。', timestamp: '2026-03-19T09:07:00Z' },
      { messageId: 'msg-002-01-09', role: 'user', content: '完美，安排上', timestamp: '2026-03-19T09:08:00Z' },
      { messageId: 'msg-002-01-10', role: 'assistant', content: '建议采用策略模式+模板方法的组合，核心流程抽象到基类，差异化逻辑下放到子类。', timestamp: '2026-03-19T09:09:00Z' },
    ],
    'conv-003-01': [
      { messageId: 'msg-003-01-01', role: 'user', content: '小红！周末约了朋友吃饭，推荐个地方呗', timestamp: '2026-03-18T18:00:00Z' },
      { messageId: 'msg-003-01-02', role: 'assistant', content: '宝子来了来了！几个人呀？有什么忌口不？大概什么预算呢？', timestamp: '2026-03-18T18:00:30Z' },
      { messageId: 'msg-003-01-03', role: 'user', content: '4个人，不吃太辣，人均200以内', timestamp: '2026-03-18T18:01:00Z' },
      { messageId: 'msg-003-01-04', role: 'assistant', content: '好嘞！给你推荐3家：\n\n1. **「和风小筑」** 城西银泰4楼\n   - 创意日料，三文鱼超新鲜\n   - 人均168，环境拍照绝了\n   - 周末建议提前订位\n\n2. **「半山小馆」** 文三路\n   - 改良杭帮菜，龙井虾仁必点\n   - 人均158，有包间适合聚会\n   - 他家的桂花糕是手工现做的\n\n3. **「意享花园」** 万象城B1\n   - 意大利菜+下午茶\n   - 人均188，露台氛围超好\n   - 周末有live音乐', timestamp: '2026-03-18T18:02:00Z' },
      { messageId: 'msg-003-01-05', role: 'user', content: '第一个看起来不错！有啥必点菜吗', timestamp: '2026-03-18T18:03:00Z' },
      { messageId: 'msg-003-01-06', role: 'assistant', content: '和风小筑必点清单来了！\n\n- 招牌三文鱼刺身拼盘（4人份够吃）\n- 炙烤鳗鱼饭（他家的酱汁是自己熬的！）\n- 天妇罗拼盘（虾很大只超满足）\n- 抹茶冰淇淋布丁（饭后甜品yyds）\n\n对了宝子，你有乳糖不耐受，甜品可以换成和果子哦，他家也有！', timestamp: '2026-03-18T18:03:30Z' },
      { messageId: 'msg-003-01-07', role: 'user', content: '你记性真好！那就这家了', timestamp: '2026-03-18T18:04:00Z' },
      { messageId: 'msg-003-01-08', role: 'assistant', content: '宝子！城西新开了一家创意融合料理，环境超好拍照绝绝子，人均158走起！', timestamp: '2026-03-18T18:05:00Z' },
    ],
    'conv-005-01': [
      { messageId: 'msg-005-01-01', role: 'user', content: 'Echo，今天AI圈有什么大新闻？', timestamp: '2026-03-19T07:00:00Z' },
      { messageId: 'msg-005-01-02', role: 'assistant', content: '早！今天的AI News Feed来了：\n\n🔥 **Top 1** - Anthropic发布Constitutional AI 2.0论文\n- 核心创新：self-play alignment + process reward model\n- 在HumanEval上达到95.2%，刷新SOTA\n- 关键insight：让AI自己发现并修正misalignment比人工标注更有效\n\n📊 **Top 2** - Google DeepMind的Gemini 2.0开放API\n- 支持原生multimodal reasoning\n- 上下文窗口扩展到2M tokens\n- 定价比1.5 Pro降低40%\n\n🚀 **Top 3** - Meta开源Llama 4 Scout\n- 128专家MoE架构，激活参数17B\n- 在10M context场景下表现最强\n- 推理成本约为GPT-4o的1/5', timestamp: '2026-03-19T07:01:00Z' },
      { messageId: 'msg-005-01-03', role: 'user', content: 'Constitutional AI 2.0的self-play是怎么做的？', timestamp: '2026-03-19T07:02:00Z' },
      { messageId: 'msg-005-01-04', role: 'assistant', content: '简单说就是让两个AI互相对抗：\n\n```\nRed Team AI → 生成违反宪法原则的输出\n    ↓\nBlue Team AI → 识别并修正违规\n    ↓\nProcess Reward Model → 评估修正质量\n    ↓\n迭代训练 → 两个AI都变强\n```\n\n关键创新点在于Process Reward Model(PRM)：不只看最终结果，而是评估每一步推理过程是否align。这解决了传统RLHF的"reward hacking"问题。\n\n论文中最惊艳的实验：在safety benchmark上，self-play训练3轮后的效果超过了10K条人工标注数据。说明AI可以比人类更高效地发现自身的alignment gap。', timestamp: '2026-03-19T07:03:00Z' },
      { messageId: 'msg-005-01-05', role: 'user', content: '这对AI safety意味着什么？', timestamp: '2026-03-19T07:04:00Z' },
      { messageId: 'msg-005-01-06', role: 'assistant', content: '今天最值得关注的是Anthropic发布的Constitutional AI 2.0论文，核心创新在于self-play alignment。', timestamp: '2026-03-19T07:05:00Z' },
    ],
  }
  return msgMap[conversationId] ?? msgMap['conv-001-01']
}

// ==================== Tools Data ====================

function getBoundTools(avatarId: string) {
  const toolsMap: Record<string, any[]> = {
    'avatar-001': [
      { toolId: 'tool-web-search', name: 'Web搜索', description: '搜索互联网获取最新信息', icon: 'Search', enabled: true, config: { maxResults: 5, language: 'zh-CN' }, boundTime: '2026-02-01T10:00:00Z' },
      { toolId: 'tool-text-analysis', name: '文本分析', description: '分析文本的情感、关键词和摘要', icon: 'FileText', enabled: true, config: { model: 'sentiment-v2', languages: ['zh', 'en'] }, boundTime: '2026-02-05T10:00:00Z' },
      { toolId: 'tool-translator', name: '翻译助手', description: '多语言翻译，支持50+语言', icon: 'Languages', enabled: true, config: { defaultTarget: 'zh-CN', quality: 'high' }, boundTime: '2026-02-10T10:00:00Z' },
    ],
    'avatar-002': [
      { toolId: 'tool-web-search', name: 'Web搜索', description: '搜索互联网获取最新信息', icon: 'Search', enabled: true, config: { maxResults: 10, language: 'zh-CN' }, boundTime: '2026-01-25T10:00:00Z' },
      { toolId: 'tool-calculator', name: '高级计算器', description: '数学运算、统计分析、单位换算', icon: 'Calculator', enabled: true, config: { precision: 'high', enableStatistics: true }, boundTime: '2026-01-25T10:00:00Z' },
      { toolId: 'tool-code-interpreter', name: '代码解释器', description: '运行Python/JS代码，数据分析和可视化', icon: 'Terminal', enabled: true, config: { runtime: 'python3.11', timeout: 30, memoryLimit: '512MB' }, boundTime: '2026-01-28T10:00:00Z' },
      { toolId: 'tool-file-reader', name: '文件读取', description: '读取和解析各类文档文件', icon: 'FileSearch', enabled: true, config: { supportedFormats: ['pdf', 'docx', 'xlsx', 'csv', 'json'], maxSize: '50MB' }, boundTime: '2026-02-01T10:00:00Z' },
    ],
    'avatar-003': [
      { toolId: 'tool-web-search', name: 'Web搜索', description: '搜索互联网获取最新信息', icon: 'Search', enabled: true, config: { maxResults: 8, language: 'zh-CN' }, boundTime: '2026-02-10T10:00:00Z' },
      { toolId: 'tool-image-gen', name: '图片生成', description: 'AI生成精美图片', icon: 'Image', enabled: true, config: { model: 'dall-e-3', quality: 'hd', style: 'vivid' }, boundTime: '2026-02-15T10:00:00Z' },
      { toolId: 'tool-translator', name: '翻译助手', description: '多语言翻译，支持50+语言', icon: 'Languages', enabled: true, config: { defaultTarget: 'ja', quality: 'high' }, boundTime: '2026-03-01T10:00:00Z' },
    ],
    'avatar-004': [
      { toolId: 'tool-web-search', name: 'Web搜索', description: '搜索互联网获取最新信息', icon: 'Search', enabled: true, config: { maxResults: 5, language: 'zh-CN' }, boundTime: '2026-02-20T10:00:00Z' },
    ],
    'avatar-005': [
      { toolId: 'tool-web-search', name: 'Web搜索', description: '搜索互联网获取最新信息', icon: 'Search', enabled: true, config: { maxResults: 15, language: 'en' }, boundTime: '2026-03-01T10:00:00Z' },
      { toolId: 'tool-code-interpreter', name: '代码解释器', description: '运行Python/JS代码，数据分析和可视化', icon: 'Terminal', enabled: true, config: { runtime: 'python3.11', timeout: 60, memoryLimit: '1GB' }, boundTime: '2026-03-01T10:00:00Z' },
      { toolId: 'tool-calculator', name: '高级计算器', description: '数学运算、统计分析、单位换算', icon: 'Calculator', enabled: true, config: { precision: 'high', enableStatistics: true }, boundTime: '2026-03-05T10:00:00Z' },
      { toolId: 'tool-api-caller', name: 'API调用', description: '调用外部REST API获取数据', icon: 'Webhook', enabled: true, config: { timeout: 10, retryCount: 3, allowedDomains: ['arxiv.org', 'news.ycombinator.com', 'github.com'] }, boundTime: '2026-03-08T10:00:00Z' },
    ],
  }
  return toolsMap[avatarId] ?? []
}

const AVAILABLE_TOOLS = [
  { toolId: 'tool-web-search', name: 'Web搜索', description: '搜索互联网获取最新信息', icon: 'Search', category: '信息获取' },
  { toolId: 'tool-calculator', name: '高级计算器', description: '数学运算、统计分析、单位换算', icon: 'Calculator', category: '数据处理' },
  { toolId: 'tool-code-interpreter', name: '代码解释器', description: '运行Python/JS代码，数据分析和可视化', icon: 'Terminal', category: '开发工具' },
  { toolId: 'tool-file-reader', name: '文件读取', description: '读取和解析各类文档文件', icon: 'FileSearch', category: '文件处理' },
  { toolId: 'tool-translator', name: '翻译助手', description: '多语言翻译，支持50+语言', icon: 'Languages', category: '语言工具' },
  { toolId: 'tool-image-gen', name: '图片生成', description: 'AI生成精美图片', icon: 'Image', category: '创意工具' },
  { toolId: 'tool-api-caller', name: 'API调用', description: '调用外部REST API获取数据', icon: 'Webhook', category: '开发工具' },
  { toolId: 'tool-email-sender', name: '邮件发送', description: '发送和管理邮件', icon: 'Mail', category: '通信工具' },
  { toolId: 'tool-calendar', name: '日历管理', description: '管理日程、提醒和事件', icon: 'Calendar', category: '效率工具' },
  { toolId: 'tool-weather', name: '天气查询', description: '查询全球天气预报', icon: 'Cloud', category: '信息获取' },
  { toolId: 'tool-map', name: '地图导航', description: '地图搜索、路径规划、POI查询', icon: 'MapPin', category: '信息获取' },
  { toolId: 'tool-text-analysis', name: '文本分析', description: '分析文本的情感、关键词和摘要', icon: 'FileText', category: '数据处理' },
]

// ==================== Skills Data ====================

function getBoundSkills(avatarId: string) {
  const skillsMap: Record<string, any[]> = {
    'avatar-001': [
      { skillId: 'skill-creative-writing', name: '创意写作', description: '诗歌、散文、故事创作', icon: 'Pen', enabled: true, config: { style: 'poetic', maxLength: 2000 }, boundTime: '2026-02-01T10:00:00Z' },
      { skillId: 'skill-emotional-support', name: '情感支持', description: '心理疏导和情感陪伴', icon: 'Heart', enabled: true, config: { approach: 'empathetic', followUpEnabled: true }, boundTime: '2026-02-01T10:00:00Z' },
    ],
    'avatar-002': [
      { skillId: 'skill-code-review', name: '代码审查', description: '代码质量分析、安全检查、性能建议', icon: 'GitBranch', enabled: true, config: { languages: ['java', 'typescript', 'python'], severity: 'all' }, boundTime: '2026-01-25T10:00:00Z' },
      { skillId: 'skill-data-analysis', name: '数据分析', description: '数据清洗、统计分析、可视化', icon: 'BarChart', enabled: true, config: { chartLib: 'echarts', exportFormats: ['png', 'svg', 'csv'] }, boundTime: '2026-01-28T10:00:00Z' },
      { skillId: 'skill-architecture', name: '架构设计', description: '系统设计、架构评审、方案对比', icon: 'Building', enabled: true, config: { patterns: ['DDD', 'microservices', 'event-driven'] }, boundTime: '2026-02-01T10:00:00Z' },
    ],
    'avatar-003': [
      { skillId: 'skill-content-creation', name: '内容创作', description: '社交媒体文案、种草笔记、旅行攻略', icon: 'Sparkles', enabled: true, config: { platforms: ['xiaohongshu', 'weibo', 'douyin'], tonePresets: ['casual', 'professional'] }, boundTime: '2026-02-10T10:00:00Z' },
      { skillId: 'skill-food-recommend', name: '美食推荐', description: '基于位置和偏好的餐厅推荐', icon: 'Utensils', enabled: true, config: { maxDistance: '5km', priceRange: 'medium' }, boundTime: '2026-02-15T10:00:00Z' },
    ],
    'avatar-004': [
      { skillId: 'skill-philosophical-debate', name: '哲学辩论', description: '苏格拉底式对话、辩证分析、思想实验', icon: 'Scale', enabled: true, config: { traditions: ['eastern', 'western', 'comparative'], depth: 'advanced' }, boundTime: '2026-02-18T10:00:00Z' },
      { skillId: 'skill-strategic-thinking', name: '战略思维', description: '博弈分析、决策树、情景规划', icon: 'Target', enabled: true, config: { frameworks: ['SWOT', 'Porter', 'game-theory'] }, boundTime: '2026-02-20T10:00:00Z' },
    ],
    'avatar-005': [
      { skillId: 'skill-tech-research', name: '技术研究', description: '论文解读、技术趋势分析、竞品调研', icon: 'Microscope', enabled: true, config: { sources: ['arxiv', 'semanticscholar', 'hackernews'], updateFrequency: 'daily' }, boundTime: '2026-03-01T10:00:00Z' },
      { skillId: 'skill-code-review', name: '代码审查', description: '代码质量分析、安全检查、性能建议', icon: 'GitBranch', enabled: true, config: { languages: ['python', 'rust', 'go'], severity: 'all' }, boundTime: '2026-03-05T10:00:00Z' },
      { skillId: 'skill-data-analysis', name: '数据分析', description: '数据清洗、统计分析、可视化', icon: 'BarChart', enabled: true, config: { chartLib: 'plotly', exportFormats: ['png', 'html', 'csv'] }, boundTime: '2026-03-08T10:00:00Z' },
    ],
  }
  return skillsMap[avatarId] ?? []
}

const AVAILABLE_SKILLS = [
  { skillId: 'skill-creative-writing', name: '创意写作', description: '诗歌、散文、故事创作', icon: 'Pen', category: '创意表达' },
  { skillId: 'skill-emotional-support', name: '情感支持', description: '心理疏导和情感陪伴', icon: 'Heart', category: '社交情感' },
  { skillId: 'skill-code-review', name: '代码审查', description: '代码质量分析、安全检查、性能建议', icon: 'GitBranch', category: '开发效率' },
  { skillId: 'skill-data-analysis', name: '数据分析', description: '数据清洗、统计分析、可视化', icon: 'BarChart', category: '数据处理' },
  { skillId: 'skill-architecture', name: '架构设计', description: '系统设计、架构评审、方案对比', icon: 'Building', category: '开发效率' },
  { skillId: 'skill-content-creation', name: '内容创作', description: '社交媒体文案、种草笔记、旅行攻略', icon: 'Sparkles', category: '创意表达' },
  { skillId: 'skill-food-recommend', name: '美食推荐', description: '基于位置和偏好的餐厅推荐', icon: 'Utensils', category: '生活服务' },
  { skillId: 'skill-philosophical-debate', name: '哲学辩论', description: '苏格拉底式对话、辩证分析、思想实验', icon: 'Scale', category: '思维训练' },
  { skillId: 'skill-strategic-thinking', name: '战略思维', description: '博弈分析、决策树、情景规划', icon: 'Target', category: '思维训练' },
  { skillId: 'skill-tech-research', name: '技术研究', description: '论文解读、技术趋势分析、竞品调研', icon: 'Microscope', category: '研究分析' },
  { skillId: 'skill-translation', name: '专业翻译', description: '学术论文、法律文书、技术文档翻译', icon: 'BookOpen', category: '语言服务' },
  { skillId: 'skill-summarization', name: '智能摘要', description: '长文压缩、会议纪要、书籍速读', icon: 'ListChecks', category: '信息处理' },
]

// ==================== Route Handler ====================

export default function avatarMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // ---- Skills routes (must be before generic :avatarId routes) ----

  // PATCH /avatars/:avatarId/skills/:skillId → toggle enabled
  if (method === 'patch' && match('/avatars/:avatarId/skills/:skillId', url)) {
    const avatarId = param('/avatars/:avatarId/skills/:skillId', url, 'avatarId')
    const skillId = param('/avatars/:avatarId/skills/:skillId', url, 'skillId')
    const skills = getBoundSkills(avatarId)
    const skill = skills.find(s => s.skillId === skillId)
    if (!skill) return error(404, '技能未绑定')
    return ok({ ...skill, enabled: !skill.enabled })
  }

  // PUT /avatars/:avatarId/skills/:skillId → update config
  if (method === 'put' && match('/avatars/:avatarId/skills/:skillId', url)) {
    const avatarId = param('/avatars/:avatarId/skills/:skillId', url, 'avatarId')
    const skillId = param('/avatars/:avatarId/skills/:skillId', url, 'skillId')
    const body = parseBody(config.data)
    const skills = getBoundSkills(avatarId)
    const skill = skills.find(s => s.skillId === skillId)
    if (!skill) return error(404, '技能未绑定')
    return ok({ ...skill, config: { ...skill.config, ...body.config } })
  }

  // DELETE /avatars/:avatarId/skills/:skillId → unbind
  if (method === 'delete' && match('/avatars/:avatarId/skills/:skillId', url)) {
    return ok(null)
  }

  // POST /avatars/:avatarId/skills/:skillId → bind
  if (method === 'post' && match('/avatars/:avatarId/skills/:skillId', url)) {
    const skillId = param('/avatars/:avatarId/skills/:skillId', url, 'skillId')
    const skill = AVAILABLE_SKILLS.find(s => s.skillId === skillId)
    if (!skill) return error(404, '技能不存在')
    return ok({ ...skill, enabled: true, config: {}, boundTime: new Date().toISOString() })
  }

  // GET /avatars/:avatarId/skills/available
  if (method === 'get' && match('/avatars/:avatarId/skills/available', url)) {
    return ok(AVAILABLE_SKILLS)
  }

  // GET /avatars/:avatarId/skills
  if (method === 'get' && match('/avatars/:avatarId/skills', url)) {
    const avatarId = param('/avatars/:avatarId/skills', url, 'avatarId')
    return ok(getBoundSkills(avatarId))
  }

  // ---- Tools routes ----

  // PATCH /avatars/:avatarId/tools/:toolId → toggle enabled
  if (method === 'patch' && match('/avatars/:avatarId/tools/:toolId', url)) {
    const avatarId = param('/avatars/:avatarId/tools/:toolId', url, 'avatarId')
    const toolId = param('/avatars/:avatarId/tools/:toolId', url, 'toolId')
    const tools = getBoundTools(avatarId)
    const tool = tools.find(t => t.toolId === toolId)
    if (!tool) return error(404, '工具未绑定')
    return ok({ ...tool, enabled: !tool.enabled })
  }

  // PUT /avatars/:avatarId/tools/:toolId → update config
  if (method === 'put' && match('/avatars/:avatarId/tools/:toolId', url)) {
    const avatarId = param('/avatars/:avatarId/tools/:toolId', url, 'avatarId')
    const toolId = param('/avatars/:avatarId/tools/:toolId', url, 'toolId')
    const body = parseBody(config.data)
    const tools = getBoundTools(avatarId)
    const tool = tools.find(t => t.toolId === toolId)
    if (!tool) return error(404, '工具未绑定')
    return ok({ ...tool, config: { ...tool.config, ...body.config } })
  }

  // DELETE /avatars/:avatarId/tools/:toolId → unbind
  if (method === 'delete' && match('/avatars/:avatarId/tools/:toolId', url)) {
    return ok(null)
  }

  // POST /avatars/:avatarId/tools/:toolId → bind
  if (method === 'post' && match('/avatars/:avatarId/tools/:toolId', url)) {
    const toolId = param('/avatars/:avatarId/tools/:toolId', url, 'toolId')
    const tool = AVAILABLE_TOOLS.find(t => t.toolId === toolId)
    if (!tool) return error(404, '工具不存在')
    return ok({ ...tool, enabled: true, config: {}, boundTime: new Date().toISOString() })
  }

  // GET /avatars/:avatarId/tools/available
  if (method === 'get' && match('/avatars/:avatarId/tools/available', url)) {
    return ok(AVAILABLE_TOOLS)
  }

  // GET /avatars/:avatarId/tools
  if (method === 'get' && match('/avatars/:avatarId/tools', url)) {
    const avatarId = param('/avatars/:avatarId/tools', url, 'avatarId')
    return ok(getBoundTools(avatarId))
  }

  // ---- Conversation messages ----

  // DELETE /avatars/:avatarId/chat/conversations/:conversationId
  if (method === 'delete' && match('/avatars/:avatarId/chat/conversations/:conversationId', url)) {
    return ok(null)
  }

  // GET /avatars/:avatarId/chat/conversations/:conversationId/messages
  if (method === 'get' && match('/avatars/:avatarId/chat/conversations/:conversationId/messages', url)) {
    const avatarId = param('/avatars/:avatarId/chat/conversations/:conversationId/messages', url, 'avatarId')
    const conversationId = param('/avatars/:avatarId/chat/conversations/:conversationId/messages', url, 'conversationId')
    return ok(getConversationMessages(avatarId, conversationId))
  }

  // GET /avatars/:avatarId/chat/conversations
  if (method === 'get' && match('/avatars/:avatarId/chat/conversations', url)) {
    const avatarId = param('/avatars/:avatarId/chat/conversations', url, 'avatarId')
    return ok(getConversations(avatarId))
  }

  // ---- Pending actions ----

  // POST /avatars/:avatarId/pending/:actionId/approve
  if (method === 'post' && match('/avatars/:avatarId/pending/:actionId/approve', url)) {
    const actionId = param('/avatars/:avatarId/pending/:actionId/approve', url, 'actionId')
    return ok({ actionId, status: 'approved', approvedTime: new Date().toISOString() })
  }

  // POST /avatars/:avatarId/pending/:actionId/reject
  if (method === 'post' && match('/avatars/:avatarId/pending/:actionId/reject', url)) {
    const actionId = param('/avatars/:avatarId/pending/:actionId/reject', url, 'actionId')
    return ok({ actionId, status: 'rejected', rejectedTime: new Date().toISOString() })
  }

  // GET /avatars/:avatarId/pending
  if (method === 'get' && match('/avatars/:avatarId/pending', url)) {
    const avatarId = param('/avatars/:avatarId/pending', url, 'avatarId')
    return ok(getPendingActions(avatarId))
  }

  // ---- Activity logs ----

  // GET /avatars/:avatarId/activity
  if (method === 'get' && match('/avatars/:avatarId/activity', url)) {
    const avatarId = param('/avatars/:avatarId/activity', url, 'avatarId')
    return ok(getActivityLogs(avatarId))
  }

  // ---- Memories ----

  // DELETE /avatars/:avatarId/memories/:memoryId
  if (method === 'delete' && match('/avatars/:avatarId/memories/:memoryId', url)) {
    return ok(null)
  }

  // POST /avatars/:avatarId/memories
  if (method === 'post' && match('/avatars/:avatarId/memories', url)) {
    const avatarId = param('/avatars/:avatarId/memories', url, 'avatarId')
    const body = parseBody(config.data)
    return ok({
      memoryId: mockId('mem'),
      avatarId,
      type: body.type ?? 'knowledge',
      content: body.content ?? '',
      importance: body.importance ?? 0.5,
      source: 'manual',
      createdTime: new Date().toISOString(),
    })
  }

  // GET /avatars/:avatarId/memories
  if (method === 'get' && match('/avatars/:avatarId/memories', url)) {
    const avatarId = param('/avatars/:avatarId/memories', url, 'avatarId')
    return ok(getMemories(avatarId))
  }

  // ---- Avatar personality / autonomy / permissions ----

  // PUT /avatars/:avatarId/personality
  if (method === 'put' && match('/avatars/:avatarId/personality', url)) {
    const avatarId = param('/avatars/:avatarId/personality', url, 'avatarId')
    const body = parseBody(config.data)
    const avatar = MOCK_AVATARS.find(a => a.avatarId === avatarId)
    if (!avatar) return error(404, '分身不存在')
    return ok({ ...avatar, personality: { ...avatar.personality, ...body }, updatedTime: new Date().toISOString() })
  }

  // PUT /avatars/:avatarId/autonomy
  if (method === 'put' && match('/avatars/:avatarId/autonomy', url)) {
    const avatarId = param('/avatars/:avatarId/autonomy', url, 'avatarId')
    const body = parseBody(config.data)
    const avatar = MOCK_AVATARS.find(a => a.avatarId === avatarId)
    if (!avatar) return error(404, '分身不存在')
    return ok({ ...avatar, autonomy: body.autonomy ?? avatar.autonomy, updatedTime: new Date().toISOString() })
  }

  // PUT /avatars/:avatarId/permissions
  if (method === 'put' && match('/avatars/:avatarId/permissions', url)) {
    const avatarId = param('/avatars/:avatarId/permissions', url, 'avatarId')
    const body = parseBody(config.data)
    const avatar = MOCK_AVATARS.find(a => a.avatarId === avatarId)
    if (!avatar) return error(404, '分身不存在')
    return ok({ ...avatar, permissions: { ...avatar.permissions, ...body }, updatedTime: new Date().toISOString() })
  }

  // ---- Core CRUD ----

  // PUT /avatars/:avatarId
  if (method === 'put' && match('/avatars/:avatarId', url)) {
    const avatarId = param('/avatars/:avatarId', url, 'avatarId')
    const body = parseBody(config.data)
    const avatar = MOCK_AVATARS.find(a => a.avatarId === avatarId)
    if (!avatar) return error(404, '分身不存在')
    return ok({ ...avatar, ...body, avatarId, updatedTime: new Date().toISOString() })
  }

  // DELETE /avatars/:avatarId
  if (method === 'delete' && match('/avatars/:avatarId', url)) {
    return ok(null)
  }

  // GET /avatars/:avatarId (single avatar detail — must be after all /avatars/:avatarId/* routes)
  // Not required in spec but useful; skip to avoid collisions with sub-routes

  // POST /avatars
  if (method === 'post' && match('/avatars', url)) {
    const body = parseBody(config.data)
    return ok({
      avatarId: mockId('avatar'),
      userId: MOCK_USER.userId,
      name: body.name ?? '新分身',
      description: body.description ?? '',
      avatarUrl: '',
      status: 'active',
      personality: body.personality ?? { tone: '友好', interests: [], expertise: [], quirks: [] },
      agentConfig: body.agentConfig ?? { modelId: 'gpt-4o', modelName: 'GPT-4o', temperature: 0.7, maxTokens: 4096, systemPrompt: '' },
      autonomy: 'approval',
      permissions: { canPost: false, canComment: false, canLike: false, canFollow: false, canMessage: true, mcpCapabilities: [], maxDailyActions: 10, requireApprovalFor: ['post', 'comment', 'like', 'follow'] },
      stats: { totalConversations: 0, totalMessages: 0, totalMemories: 0, totalActions: 0, avgResponseTime: 0 },
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString(),
    })
  }

  // GET /avatars
  if (method === 'get' && match('/avatars', url)) {
    return ok(MOCK_AVATARS)
  }

  return null
}
