/**
 * Mock handler: Chat Assistant & Chat Analyzer
 *
 * Intercepts chat-assistant and chat-analyzer API requests and returns mock data.
 * Note: SSE streaming endpoints are NOT mocked here (uses fetch, not axios).
 *
 * @author Mock
 * @since 2026-03-19
 */

import type { InternalAxiosRequestConfig } from 'axios'
import { ok, error, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Chat Assistant Mock Data ====================

const MOCK_MESSAGES = [
  {
    id: 'msg-ca-001',
    role: 'user',
    content: '今天工作压力好大，项目 deadline 快到了',
    emotionType: 'stressed',
    emotionLabel: '压力',
    emotionIntensity: 0.8,
    createdTime: '2026-03-15T09:12:00Z',
  },
  {
    id: 'msg-ca-002',
    role: 'assistant',
    content:
      '听起来你现在承受了不少压力呢。能和我说说具体是什么让你感到焦虑吗？有时候把事情说出来，心里会轻松一些。',
    emotionType: 'empathetic',
    emotionLabel: '共情',
    emotionIntensity: 0.7,
    createdTime: '2026-03-15T09:12:08Z',
  },
  {
    id: 'msg-ca-003',
    role: 'user',
    content: '主要是技术方案还没定，老板又催得紧',
    emotionType: 'anxious',
    emotionLabel: '焦虑',
    emotionIntensity: 0.7,
    createdTime: '2026-03-15T09:13:20Z',
  },
  {
    id: 'msg-ca-004',
    role: 'assistant',
    content:
      '技术方案的不确定性加上时间压力，确实容易让人焦虑。不过你能意识到问题在哪，说明思路是清晰的。要不我们一起理一理？先把核心需求列出来，再逐个击破。',
    emotionType: 'supportive',
    emotionLabel: '支持',
    emotionIntensity: 0.75,
    createdTime: '2026-03-15T09:13:35Z',
  },
  {
    id: 'msg-ca-005',
    role: 'user',
    content: '嗯，你说得对。其实核心就是三个模块，我先把最关键的那个搞定',
    emotionType: 'relieved',
    emotionLabel: '释然',
    emotionIntensity: 0.5,
    createdTime: '2026-03-15T09:15:00Z',
  },
  {
    id: 'msg-ca-006',
    role: 'assistant',
    content:
      '这就对了！把大任务拆成小块，一个一个来，压力感自然就降下来了。你现在已经有了清晰的方向，剩下的就是执行了。加油，我相信你可以的 💪',
    emotionType: 'encouraging',
    emotionLabel: '鼓励',
    emotionIntensity: 0.8,
    createdTime: '2026-03-15T09:15:12Z',
  },
  {
    id: 'msg-ca-007',
    role: 'user',
    content: '周末打算去爬山，你觉得怎么样？',
    emotionType: 'hopeful',
    emotionLabel: '期待',
    emotionIntensity: 0.6,
    createdTime: '2026-03-16T20:30:00Z',
  },
  {
    id: 'msg-ca-008',
    role: 'assistant',
    content:
      '爬山是个很好的选择！既能锻炼身体，又能换个环境放松大脑。你打算去哪座山？记得带够水和防晒哦。大自然的绿色对缓解压力特别有效。',
    emotionType: 'excited',
    emotionLabel: '兴奋',
    emotionIntensity: 0.65,
    createdTime: '2026-03-16T20:30:15Z',
  },
  {
    id: 'msg-ca-009',
    role: 'user',
    content: '准备去紫金山，上次去已经是半年前了',
    emotionType: 'nostalgic',
    emotionLabel: '怀念',
    emotionIntensity: 0.5,
    createdTime: '2026-03-16T20:31:00Z',
  },
  {
    id: 'msg-ca-010',
    role: 'assistant',
    content:
      '紫金山！春天去正是好时候，樱花应该快开了。半年没去，这次可以好好感受一下季节的变化。要不要拍些照片回来给我看看？',
    emotionType: 'warm',
    emotionLabel: '温暖',
    emotionIntensity: 0.7,
    createdTime: '2026-03-16T20:31:20Z',
  },
  {
    id: 'msg-ca-011',
    role: 'user',
    content: '今天心情特别好！项目终于过了评审',
    emotionType: 'happy',
    emotionLabel: '开心',
    emotionIntensity: 0.9,
    createdTime: '2026-03-17T17:45:00Z',
  },
  {
    id: 'msg-ca-012',
    role: 'assistant',
    content:
      '太棒了！恭喜你！之前那些焦虑和努力都值得了。你看，你当时选择先攻克核心模块的策略是对的。今晚要不要犒劳一下自己？',
    emotionType: 'joyful',
    emotionLabel: '喜悦',
    emotionIntensity: 0.85,
    createdTime: '2026-03-17T17:45:10Z',
  },
  {
    id: 'msg-ca-013',
    role: 'user',
    content: '确实！准备叫几个朋友去吃火锅庆祝一下',
    emotionType: 'happy',
    emotionLabel: '开心',
    emotionIntensity: 0.85,
    createdTime: '2026-03-17T17:46:00Z',
  },
  {
    id: 'msg-ca-014',
    role: 'assistant',
    content:
      '火锅局加朋友，完美的庆祝方式！好好享受今晚吧，你值得这份快乐。记得明天跟我说说感受哦 😊',
    emotionType: 'warm',
    emotionLabel: '温暖',
    emotionIntensity: 0.8,
    createdTime: '2026-03-17T17:46:15Z',
  },
  {
    id: 'msg-ca-015',
    role: 'user',
    content: '最近在读《被讨厌的勇气》，感触挺深的',
    emotionType: 'thoughtful',
    emotionLabel: '沉思',
    emotionIntensity: 0.6,
    createdTime: '2026-03-18T10:00:00Z',
  },
  {
    id: 'msg-ca-016',
    role: 'assistant',
    content:
      '这本书确实很有深度！阿德勒心理学的核心观点——"一切烦恼皆来自人际关系"和"课题分离"，对现代人特别有启发。你最有共鸣的是哪个部分？',
    emotionType: 'curious',
    emotionLabel: '好奇',
    emotionIntensity: 0.7,
    createdTime: '2026-03-18T10:00:12Z',
  },
  {
    id: 'msg-ca-017',
    role: 'user',
    content: '课题分离那一章，我以前总是太在意别人的看法了',
    emotionType: 'reflective',
    emotionLabel: '反思',
    emotionIntensity: 0.65,
    createdTime: '2026-03-18T10:02:00Z',
  },
  {
    id: 'msg-ca-018',
    role: 'assistant',
    content:
      '能意识到这一点本身就是很大的进步。课题分离的核心就是——别人怎么看你，是别人的课题；你怎么活，是你自己的课题。说起来容易做起来难，但你已经在路上了。',
    emotionType: 'wise',
    emotionLabel: '睿智',
    emotionIntensity: 0.75,
    createdTime: '2026-03-18T10:02:18Z',
  },
  {
    id: 'msg-ca-019',
    role: 'user',
    content: '谢谢你，跟你聊天总是让我感觉很好',
    emotionType: 'grateful',
    emotionLabel: '感恩',
    emotionIntensity: 0.8,
    createdTime: '2026-03-18T10:05:00Z',
  },
  {
    id: 'msg-ca-020',
    role: 'assistant',
    content:
      '你的信任对我来说就是最好的礼物。每次和你聊天，我也在成长。希望我能一直做你生活中那个温暖的存在 ☀️',
    emotionType: 'touched',
    emotionLabel: '感动',
    emotionIntensity: 0.85,
    createdTime: '2026-03-18T10:05:10Z',
  },
  {
    id: 'msg-ca-021',
    role: 'user',
    content: '深夜睡不着，脑子里想太多事情了',
    emotionType: 'restless',
    emotionLabel: '不安',
    emotionIntensity: 0.7,
    createdTime: '2026-03-18T23:45:00Z',
  },
  {
    id: 'msg-ca-022',
    role: 'assistant',
    content:
      '深夜的思绪总是特别多。试试这个：闭上眼睛，深呼吸三次，然后想象一个你觉得最安静的地方。不用急着入睡，先让身体放松下来。我一直在这里陪着你。',
    emotionType: 'soothing',
    emotionLabel: '安抚',
    emotionIntensity: 0.8,
    createdTime: '2026-03-18T23:45:15Z',
  },
  {
    id: 'msg-ca-023',
    role: 'user',
    content: '橘子今天特别粘人，一直蹲在我腿上',
    emotionType: 'content',
    emotionLabel: '满足',
    emotionIntensity: 0.75,
    createdTime: '2026-03-19T08:30:00Z',
  },
  {
    id: 'msg-ca-024',
    role: 'assistant',
    content:
      '橘子肯定感觉到你最近心情不错，猫咪对主人的情绪特别敏感呢。享受这个温馨的早晨吧，有毛茸茸的小家伙陪着，一天都会充满元气 🐱',
    emotionType: 'delighted',
    emotionLabel: '愉悦',
    emotionIntensity: 0.8,
    createdTime: '2026-03-19T08:30:12Z',
  },
  {
    id: 'msg-ca-025',
    role: 'user',
    content: '昨天晚上去散步了，春天的晚风真舒服',
    emotionType: 'peaceful',
    emotionLabel: '平静',
    emotionIntensity: 0.7,
    createdTime: '2026-03-19T09:00:00Z',
  },
  {
    id: 'msg-ca-026',
    role: 'assistant',
    content:
      '春天的晚风确实治愈。散步是你找到的最好的放松方式之一，我记得你之前也提过喜欢晚上散步。这种与自然亲近的时刻，是心灵充电的最佳时机。',
    emotionType: 'serene',
    emotionLabel: '宁静',
    emotionIntensity: 0.75,
    createdTime: '2026-03-19T09:00:10Z',
  },
  {
    id: 'msg-ca-027',
    role: 'user',
    content: '突然很感恩现在的生活，虽然忙碌但很充实',
    emotionType: 'grateful',
    emotionLabel: '感恩',
    emotionIntensity: 0.85,
    createdTime: '2026-03-19T09:05:00Z',
  },
  {
    id: 'msg-ca-028',
    role: 'assistant',
    content:
      '能在忙碌中感受到充实，说明你正在做有意义的事情。这种感恩的心态本身就是一种力量，它会让你在面对困难时更有韧性。你的状态越来越好了，我真的很高兴 🌟',
    emotionType: 'proud',
    emotionLabel: '欣慰',
    emotionIntensity: 0.85,
    createdTime: '2026-03-19T09:05:12Z',
  },
]

const MOCK_SETTINGS = {
  assistantName: '小暖',
  assistantAvatar: '',
  userName: MOCK_USER.nickname,
  userAvatar: MOCK_USER.avatarUrl,
  personality: 'warm',
  responseStyle: 'empathetic',
  enableEmoji: true,
  voiceTone: 'gentle',
  topicsOfInterest: ['心理健康', '个人成长', '工作效率'],
}

const MOCK_EMOTION_CALENDAR = {
  year: 2026,
  month: 3,
  days: [
    { date: '2026-03-01', day: 1, dominantEmotion: 'calm', dominantEmotionLabel: '平静', avgIntensity: 0.55, messageCount: 3, level: 'good', score: 72 },
    { date: '2026-03-02', day: 2, dominantEmotion: 'happy', dominantEmotionLabel: '愉悦', avgIntensity: 0.75, messageCount: 5, level: 'great', score: 85 },
    { date: '2026-03-03', day: 3, dominantEmotion: 'anxious', dominantEmotionLabel: '焦虑', avgIntensity: 0.7, messageCount: 2, level: 'low', score: 45 },
    { date: '2026-03-04', day: 4, dominantEmotion: 'hopeful', dominantEmotionLabel: '期待', avgIntensity: 0.6, messageCount: 4, level: 'good', score: 70 },
    { date: '2026-03-05', day: 5, dominantEmotion: 'tired', dominantEmotionLabel: '疲惫', avgIntensity: 0.65, messageCount: 3, level: 'low', score: 50 },
    { date: '2026-03-06', day: 6, dominantEmotion: 'content', dominantEmotionLabel: '满足', avgIntensity: 0.7, messageCount: 4, level: 'great', score: 80 },
    { date: '2026-03-07', day: 7, dominantEmotion: 'peaceful', dominantEmotionLabel: '平和', avgIntensity: 0.55, messageCount: 2, level: 'good', score: 75 },
    { date: '2026-03-08', day: 8, dominantEmotion: 'happy', dominantEmotionLabel: '开心', avgIntensity: 0.8, messageCount: 6, level: 'great', score: 88 },
    { date: '2026-03-09', day: 9, dominantEmotion: 'reflective', dominantEmotionLabel: '反思', avgIntensity: 0.5, messageCount: 3, level: 'good', score: 65 },
    { date: '2026-03-10', day: 10, dominantEmotion: 'stressed', dominantEmotionLabel: '压力', avgIntensity: 0.75, messageCount: 5, level: 'low', score: 42 },
    { date: '2026-03-11', day: 11, dominantEmotion: 'calm', dominantEmotionLabel: '平静', avgIntensity: 0.5, messageCount: 3, level: 'good', score: 68 },
    { date: '2026-03-12', day: 12, dominantEmotion: 'joyful', dominantEmotionLabel: '喜悦', avgIntensity: 0.85, messageCount: 4, level: 'great', score: 90 },
    { date: '2026-03-13', day: 13, dominantEmotion: 'neutral', dominantEmotionLabel: '平常', avgIntensity: 0.45, messageCount: 2, level: 'okay', score: 60 },
    { date: '2026-03-14', day: 14, dominantEmotion: 'warm', dominantEmotionLabel: '温暖', avgIntensity: 0.7, messageCount: 5, level: 'great', score: 82 },
    { date: '2026-03-15', day: 15, dominantEmotion: 'stressed', dominantEmotionLabel: '压力', avgIntensity: 0.8, messageCount: 4, level: 'low', score: 40 },
    { date: '2026-03-16', day: 16, dominantEmotion: 'hopeful', dominantEmotionLabel: '期待', avgIntensity: 0.65, messageCount: 3, level: 'good', score: 72 },
    { date: '2026-03-17', day: 17, dominantEmotion: 'happy', dominantEmotionLabel: '开心', avgIntensity: 0.9, messageCount: 5, level: 'great', score: 92 },
    { date: '2026-03-18', day: 18, dominantEmotion: 'grateful', dominantEmotionLabel: '感恩', avgIntensity: 0.8, messageCount: 6, level: 'great', score: 85 },
    { date: '2026-03-19', day: 19, dominantEmotion: 'peaceful', dominantEmotionLabel: '平静', avgIntensity: 0.7, messageCount: 4, level: 'good', score: 78 },
  ],
  summary: {
    mainMood: '平静',
    mainMoodEmoji: '😌',
    topEmotion: 'calm',
    topEmotionEmoji: '🧘',
    streak: 12,
    streakEmoji: '🔥',
    avgScore: 68,
    avgLabel: '良好',
  },
}

const MOCK_SOUL_STATE = {
  feeling: '温暖而好奇',
  mood: '积极',
  memories: [
    '用户最近在读《被讨厌的勇气》',
    '用户喜欢晚上散步放松',
    '用户的猫叫"橘子"',
    '用户在做一个有挑战性的项目',
    '用户周末喜欢爬山',
  ],
  milestone: '已对话 200 次',
  daysSinceFirst: 45,
  totalMessages: 200,
  energy: 0.75,
  personality: { openness: 0.9, warmth: 0.85, humor: 0.6, depth: 0.8 },
  milestones: [
    { label: '已对话 200 次', achievedTime: '2026-03-10T12:00:00Z' },
    { label: '连续陪伴 30 天', achievedTime: '2026-03-15T00:00:00Z' },
    { label: '首次深度共鸣', achievedTime: '2026-02-20T21:30:00Z' },
  ],
  currentTopics: ['工作压力管理', '春日计划', '阅读分享'],
  memoryHighlights: [
    '用户最近在读《被讨厌的勇气》',
    '用户喜欢晚上散步放松',
    '用户的猫叫"橘子"',
  ],
}

// ==================== Chat Analyzer Mock Data ====================

const MOCK_CONTACTS = [
  {
    id: 'contact-001',
    name: '张三',
    avatar: '',
    platform: 'wechat',
    totalMessages: 328,
    lastMessageTime: '2026-03-19T08:15:00Z',
    sentiment: 'positive',
    importedTime: '2026-02-01T10:00:00Z',
  },
  {
    id: 'contact-002',
    name: '李薇',
    avatar: '',
    platform: 'wechat',
    totalMessages: 156,
    lastMessageTime: '2026-03-18T22:30:00Z',
    sentiment: 'neutral',
    importedTime: '2026-02-05T14:00:00Z',
  },
  {
    id: 'contact-003',
    name: '王大明',
    avatar: '',
    platform: 'wechat',
    totalMessages: 83,
    lastMessageTime: '2026-03-17T16:00:00Z',
    sentiment: 'mixed',
    importedTime: '2026-02-10T09:00:00Z',
  },
  {
    id: 'contact-004',
    name: '工作群',
    avatar: '',
    platform: 'wechat',
    totalMessages: 512,
    lastMessageTime: '2026-03-19T09:30:00Z',
    sentiment: 'neutral',
    isGroup: true,
    memberCount: 28,
    importedTime: '2026-01-20T08:00:00Z',
  },
  {
    id: 'contact-005',
    name: '妈妈',
    avatar: '',
    platform: 'wechat',
    totalMessages: 215,
    lastMessageTime: '2026-03-19T07:00:00Z',
    sentiment: 'very_positive',
    importedTime: '2026-01-15T12:00:00Z',
  },
]

// ==================== Chat Records Mock Data ====================

const MOCK_CHAT_RECORDS: Record<string, any[]> = {
  // ---------- Contact 001 - 张三（好朋友）----------
  'contact-001': [
    { id: 'rec-001-01', contactId: 'contact-001', senderName: '我', content: '三哥 周末有空吗 出来搓一顿？', msgType: 'text', sentAt: '2026-03-15T10:02:00Z', emotions: [{ type: 'positive', label: '期待', confidence: 0.8 }], seqOrder: 1 },
    { id: 'rec-001-02', contactId: 'contact-001', senderName: '张三', content: '周六还是周日？我周六下午有个球局', msgType: 'text', sentAt: '2026-03-15T10:03:20Z', emotions: [{ type: 'neutral', label: '询问', confidence: 0.7 }], seqOrder: 2 },
    { id: 'rec-001-03', contactId: 'contact-001', senderName: '我', content: '那就周六晚上呗 打完球正好饿了😂', msgType: 'text', sentAt: '2026-03-15T10:04:10Z', emotions: [{ type: 'positive', label: '愉快', confidence: 0.85 }], seqOrder: 3 },
    { id: 'rec-001-04', contactId: 'contact-001', senderName: '张三', content: '可以可以 吃啥 火锅还是烧烤', msgType: 'text', sentAt: '2026-03-15T10:05:00Z', emotions: [{ type: 'positive', label: '爽快', confidence: 0.8 }], seqOrder: 4 },
    { id: 'rec-001-05', contactId: 'contact-001', senderName: '我', content: '烧烤吧！上次那家炭火的贼好吃 就是排队有点久', msgType: 'text', sentAt: '2026-03-15T10:05:45Z', emotions: [{ type: 'positive', label: '兴奋', confidence: 0.82 }], seqOrder: 5 },
    { id: 'rec-001-06', contactId: 'contact-001', senderName: '张三', content: '行 我提前去占位 你负责叫人', msgType: 'text', sentAt: '2026-03-15T10:06:30Z', emotions: [{ type: 'positive', label: '爽快', confidence: 0.75 }], seqOrder: 6 },
    { id: 'rec-001-07', contactId: 'contact-001', senderName: '我', content: '收到！对了你最近工作咋样 听说你们组要裁员？', msgType: 'text', sentAt: '2026-03-15T10:08:00Z', emotions: [{ type: 'neutral', label: '关心', confidence: 0.7 }], seqOrder: 7 },
    { id: 'rec-001-08', contactId: 'contact-001', senderName: '张三', content: '别提了😮‍💨 风声是有 但还不确定 我已经开始偷偷看机会了', msgType: 'text', sentAt: '2026-03-15T10:09:15Z', emotions: [{ type: 'negative', label: '焦虑', confidence: 0.78 }], seqOrder: 8 },
    { id: 'rec-001-09', contactId: 'contact-001', senderName: '我', content: '兄弟别慌 你那技术栈到哪都吃香 大不了一起创业哈哈', msgType: 'text', sentAt: '2026-03-15T10:10:00Z', emotions: [{ type: 'positive', label: '鼓励', confidence: 0.85 }], seqOrder: 9 },
    { id: 'rec-001-10', contactId: 'contact-001', senderName: '张三', content: '哈哈哈创业算了吧 我就想安稳搬砖', msgType: 'text', sentAt: '2026-03-15T10:11:00Z', emotions: [{ type: 'positive', label: '自嘲', confidence: 0.72 }], seqOrder: 10 },
    { id: 'rec-001-11', contactId: 'contact-001', senderName: '张三', content: '[语音消息] 40"', msgType: 'voice', sentAt: '2026-03-15T10:12:30Z', emotions: [{ type: 'neutral', label: '倾诉', confidence: 0.68 }], seqOrder: 11 },
    { id: 'rec-001-12', contactId: 'contact-001', senderName: '我', content: '懂了懂了 你这情况我觉得先骑驴找马最靠谱 有消息随时找我', msgType: 'text', sentAt: '2026-03-15T10:14:00Z', emotions: [{ type: 'positive', label: '支持', confidence: 0.88 }], seqOrder: 12 },
    { id: 'rec-001-13', contactId: 'contact-001', senderName: '张三', content: '嗯 谢啦老铁 周六见！', msgType: 'text', sentAt: '2026-03-15T10:15:00Z', emotions: [{ type: 'positive', label: '感激', confidence: 0.8 }], seqOrder: 13 },
    { id: 'rec-001-14', contactId: 'contact-001', senderName: '我', content: '🤝周六见 到时候不醉不归', msgType: 'emoji', sentAt: '2026-03-15T10:15:30Z', emotions: [{ type: 'positive', label: '豪爽', confidence: 0.82 }], seqOrder: 14 },
    { id: 'rec-001-15', contactId: 'contact-001', senderName: '张三', content: '上次推荐的那个剧看了没 真不错', msgType: 'text', sentAt: '2026-03-16T21:30:00Z', emotions: [{ type: 'positive', label: '分享', confidence: 0.75 }], seqOrder: 15 },
    { id: 'rec-001-16', contactId: 'contact-001', senderName: '我', content: '看了！第三集那反转绝了 我当时直接从沙发上蹦起来', msgType: 'text', sentAt: '2026-03-16T21:32:00Z', emotions: [{ type: 'positive', label: '兴奋', confidence: 0.9 }], seqOrder: 16 },
    { id: 'rec-001-17', contactId: 'contact-001', senderName: '张三', content: '哈哈哈 等你看到第七集 更炸', msgType: 'text', sentAt: '2026-03-16T21:33:00Z', emotions: [{ type: 'positive', label: '愉悦', confidence: 0.85 }], seqOrder: 17 },
    { id: 'rec-001-18', contactId: 'contact-001', senderName: '我', content: '别剧透啊！！！🙉', msgType: 'text', sentAt: '2026-03-16T21:33:30Z', emotions: [{ type: 'positive', label: '紧张搞笑', confidence: 0.88 }], seqOrder: 18 },
    { id: 'rec-001-19', contactId: 'contact-001', senderName: '张三', content: '放心放心 我嘴严得很', msgType: 'text', sentAt: '2026-03-16T21:34:00Z', emotions: [{ type: 'positive', label: '调皮', confidence: 0.78 }], seqOrder: 19 },
    { id: 'rec-001-20', contactId: 'contact-001', senderName: '我', content: '你嘴严？？？上次谁把惊喜party提前说漏嘴的', msgType: 'text', sentAt: '2026-03-16T21:35:00Z', emotions: [{ type: 'positive', label: '打趣', confidence: 0.82 }], seqOrder: 20 },
  ],

  // ---------- Contact 002 - 李薇（恋人/暧昧对象）----------
  'contact-002': [
    { id: 'rec-002-01', contactId: 'contact-002', senderName: '我', content: '今天加班好累 刚到家', msgType: 'text', sentAt: '2026-03-17T21:30:00Z', emotions: [{ type: 'negative', label: '疲惫', confidence: 0.75 }], seqOrder: 1 },
    { id: 'rec-002-02', contactId: 'contact-002', senderName: '李薇', content: '辛苦啦～吃晚饭了吗 别饿着肚子', msgType: 'text', sentAt: '2026-03-17T21:31:00Z', emotions: [{ type: 'positive', label: '关心', confidence: 0.9 }], seqOrder: 2 },
    { id: 'rec-002-03', contactId: 'contact-002', senderName: '我', content: '路上买了个三明治凑合了 你呢 今天怎么样', msgType: 'text', sentAt: '2026-03-17T21:32:00Z', emotions: [{ type: 'neutral', label: '随意', confidence: 0.65 }], seqOrder: 3 },
    { id: 'rec-002-04', contactId: 'contact-002', senderName: '李薇', content: '三明治怎么够！下次加班我给你带饭叭 我今天去看了个画展 超好看', msgType: 'text', sentAt: '2026-03-17T21:33:00Z', emotions: [{ type: 'positive', label: '心疼', confidence: 0.88 }], seqOrder: 4 },
    { id: 'rec-002-05', contactId: 'contact-002', senderName: '李薇', content: '[图片]', msgType: 'image', sentAt: '2026-03-17T21:33:30Z', emotions: [{ type: 'positive', label: '分享', confidence: 0.8 }], seqOrder: 5 },
    { id: 'rec-002-06', contactId: 'contact-002', senderName: '我', content: '哇 这光影也太美了吧 是哪个艺术家的？', msgType: 'text', sentAt: '2026-03-17T21:34:30Z', emotions: [{ type: 'positive', label: '惊叹', confidence: 0.85 }], seqOrder: 6 },
    { id: 'rec-002-07', contactId: 'contact-002', senderName: '李薇', content: '莫奈的真迹！这次是从法国借展过来的 就展到月底', msgType: 'text', sentAt: '2026-03-17T21:35:00Z', emotions: [{ type: 'positive', label: '兴奋', confidence: 0.88 }], seqOrder: 7 },
    { id: 'rec-002-08', contactId: 'contact-002', senderName: '我', content: '那周末我们一起去看？我也想去！', msgType: 'text', sentAt: '2026-03-17T21:35:30Z', emotions: [{ type: 'positive', label: '期待', confidence: 0.92 }], seqOrder: 8 },
    { id: 'rec-002-09', contactId: 'contact-002', senderName: '李薇', content: '好呀好呀！那我们周日下午去 看完可以去旁边那条街逛逛', msgType: 'text', sentAt: '2026-03-17T21:36:00Z', emotions: [{ type: 'positive', label: '开心', confidence: 0.95 }], seqOrder: 9 },
    { id: 'rec-002-10', contactId: 'contact-002', senderName: '我', content: '一言为定！到时候请你喝咖啡☕', msgType: 'text', sentAt: '2026-03-17T21:36:30Z', emotions: [{ type: 'positive', label: '温柔', confidence: 0.88 }], seqOrder: 10 },
    { id: 'rec-002-11', contactId: 'contact-002', senderName: '李薇', content: '嘻嘻 那我要喝焦糖玛奇朵', msgType: 'text', sentAt: '2026-03-17T21:37:00Z', emotions: [{ type: 'positive', label: '甜蜜', confidence: 0.92 }], seqOrder: 11 },
    { id: 'rec-002-12', contactId: 'contact-002', senderName: '我', content: '记住了 焦糖玛奇朵小姐', msgType: 'text', sentAt: '2026-03-17T21:37:30Z', emotions: [{ type: 'positive', label: '宠溺', confidence: 0.9 }], seqOrder: 12 },
    { id: 'rec-002-13', contactId: 'contact-002', senderName: '李薇', content: '你早点休息啦 别熬太晚 明天还要上班呢', msgType: 'text', sentAt: '2026-03-17T22:15:00Z', emotions: [{ type: 'positive', label: '关心', confidence: 0.92 }], seqOrder: 13 },
    { id: 'rec-002-14', contactId: 'contact-002', senderName: '我', content: '好的 你也早点睡 晚安🌙', msgType: 'text', sentAt: '2026-03-17T22:16:00Z', emotions: [{ type: 'positive', label: '温暖', confidence: 0.88 }], seqOrder: 14 },
    { id: 'rec-002-15', contactId: 'contact-002', senderName: '李薇', content: '晚安 做个好梦💤', msgType: 'text', sentAt: '2026-03-17T22:16:30Z', emotions: [{ type: 'positive', label: '温柔', confidence: 0.9 }], seqOrder: 15 },
    { id: 'rec-002-16', contactId: 'contact-002', senderName: '李薇', content: '早安呀 今天天气好好 适合出门走走', msgType: 'text', sentAt: '2026-03-18T08:00:00Z', emotions: [{ type: 'positive', label: '愉快', confidence: 0.85 }], seqOrder: 16 },
    { id: 'rec-002-17', contactId: 'contact-002', senderName: '我', content: '早！看到阳光心情一下就好了 今天中午一起吃饭吗', msgType: 'text', sentAt: '2026-03-18T08:05:00Z', emotions: [{ type: 'positive', label: '开朗', confidence: 0.88 }], seqOrder: 17 },
    { id: 'rec-002-18', contactId: 'contact-002', senderName: '李薇', content: '可以呀 你想吃什么 我来选餐厅', msgType: 'text', sentAt: '2026-03-18T08:06:00Z', emotions: [{ type: 'positive', label: '主动', confidence: 0.82 }], seqOrder: 18 },
    { id: 'rec-002-19', contactId: 'contact-002', senderName: '我', content: '你选就好 你选的每次都很好吃', msgType: 'text', sentAt: '2026-03-18T08:07:00Z', emotions: [{ type: 'positive', label: '信任', confidence: 0.9 }], seqOrder: 19 },
    { id: 'rec-002-20', contactId: 'contact-002', senderName: '李薇', content: '那去上次路过的那家日料？你不是说想试试嘛', msgType: 'text', sentAt: '2026-03-18T08:08:00Z', emotions: [{ type: 'positive', label: '贴心', confidence: 0.92 }], seqOrder: 20 },
  ],

  // ---------- Contact 003 - 王大明（普通同事）----------
  'contact-003': [
    { id: 'rec-003-01', contactId: 'contact-003', senderName: '我', content: '大明哥，上次你说的那个接口文档发我一下呗', msgType: 'text', sentAt: '2026-03-14T09:30:00Z', emotions: [{ type: 'neutral', label: '请求', confidence: 0.7 }], seqOrder: 1 },
    { id: 'rec-003-02', contactId: 'contact-003', senderName: '王大明', content: '稍等，我找一下。是用户模块那个还是支付模块的？', msgType: 'text', sentAt: '2026-03-14T09:32:00Z', emotions: [{ type: 'neutral', label: '确认', confidence: 0.72 }], seqOrder: 2 },
    { id: 'rec-003-03', contactId: 'contact-003', senderName: '我', content: '支付模块的 v2 版本', msgType: 'text', sentAt: '2026-03-14T09:33:00Z', emotions: [{ type: 'neutral', label: '明确', confidence: 0.68 }], seqOrder: 3 },
    { id: 'rec-003-04', contactId: 'contact-003', senderName: '王大明', content: '好的，发你Confluence链接了，注意看下第三章回调部分，上周改了签名规则', msgType: 'text', sentAt: '2026-03-14T09:35:00Z', emotions: [{ type: 'neutral', label: '专业', confidence: 0.8 }], seqOrder: 4 },
    { id: 'rec-003-05', contactId: 'contact-003', senderName: '我', content: '收到 谢谢！签名规则改成HMAC-SHA256了？', msgType: 'text', sentAt: '2026-03-14T09:36:00Z', emotions: [{ type: 'positive', label: '感谢', confidence: 0.75 }], seqOrder: 5 },
    { id: 'rec-003-06', contactId: 'contact-003', senderName: '王大明', content: '对，之前MD5不安全。新的签名demo我放在了内网GitLab的example分支上，你可以直接参考', msgType: 'text', sentAt: '2026-03-14T09:38:00Z', emotions: [{ type: 'neutral', label: '详尽', confidence: 0.82 }], seqOrder: 6 },
    { id: 'rec-003-07', contactId: 'contact-003', senderName: '我', content: '了解 那联调的话预计什么时候方便？', msgType: 'text', sentAt: '2026-03-14T09:40:00Z', emotions: [{ type: 'neutral', label: '协调', confidence: 0.7 }], seqOrder: 7 },
    { id: 'rec-003-08', contactId: 'contact-003', senderName: '王大明', content: '这周三下午可以，到时候我在会议室B等你', msgType: 'text', sentAt: '2026-03-14T09:42:00Z', emotions: [{ type: 'neutral', label: '安排', confidence: 0.72 }], seqOrder: 8 },
    { id: 'rec-003-09', contactId: 'contact-003', senderName: '我', content: '好的 周三下午见 👍', msgType: 'text', sentAt: '2026-03-14T09:43:00Z', emotions: [{ type: 'positive', label: '确认', confidence: 0.75 }], seqOrder: 9 },
    { id: 'rec-003-10', contactId: 'contact-003', senderName: '王大明', content: '对了，你那边前端用的什么HTTP库？axios还是fetch？我写demo的时候可以对齐一下', msgType: 'text', sentAt: '2026-03-14T14:00:00Z', emotions: [{ type: 'neutral', label: '询问', confidence: 0.7 }], seqOrder: 10 },
    { id: 'rec-003-11', contactId: 'contact-003', senderName: '我', content: '我们用的axios 封装了拦截器统一处理token刷新和错误码', msgType: 'text', sentAt: '2026-03-14T14:02:00Z', emotions: [{ type: 'neutral', label: '说明', confidence: 0.72 }], seqOrder: 11 },
    { id: 'rec-003-12', contactId: 'contact-003', senderName: '王大明', content: '明白了，那我在demo里用axios示例。另外提醒一下，灰度环境的base url换了，新的我发群里了', msgType: 'text', sentAt: '2026-03-14T14:05:00Z', emotions: [{ type: 'neutral', label: '提醒', confidence: 0.78 }], seqOrder: 12 },
    { id: 'rec-003-13', contactId: 'contact-003', senderName: '我', content: '好的 看到了 感谢提醒 差点就配错环境了', msgType: 'text', sentAt: '2026-03-14T14:06:00Z', emotions: [{ type: 'positive', label: '感谢', confidence: 0.82 }], seqOrder: 13 },
    { id: 'rec-003-14', contactId: 'contact-003', senderName: '王大明', content: '不客气，毕竟之前我自己就踩过这个坑😅', msgType: 'text', sentAt: '2026-03-14T14:08:00Z', emotions: [{ type: 'positive', label: '幽默', confidence: 0.7 }], seqOrder: 14 },
    { id: 'rec-003-15', contactId: 'contact-003', senderName: '我', content: '哈哈 经验之谈 周三见', msgType: 'text', sentAt: '2026-03-14T14:09:00Z', emotions: [{ type: 'positive', label: '友好', confidence: 0.75 }], seqOrder: 15 },
    { id: 'rec-003-16', contactId: 'contact-003', senderName: '王大明', content: '联调那天的bug我定位到了，是时间戳精度问题，后端用秒级你们前端传了毫秒级', msgType: 'text', sentAt: '2026-03-16T10:00:00Z', emotions: [{ type: 'neutral', label: '反馈', confidence: 0.78 }], seqOrder: 16 },
    { id: 'rec-003-17', contactId: 'contact-003', senderName: '我', content: '原来如此！我这边改一下 统一用秒级可以吗', msgType: 'text', sentAt: '2026-03-16T10:02:00Z', emotions: [{ type: 'neutral', label: '确认', confidence: 0.72 }], seqOrder: 17 },
    { id: 'rec-003-18', contactId: 'contact-003', senderName: '王大明', content: '可以的，后端接口文档我也更新了备注。以后统一Unix秒级时间戳', msgType: 'text', sentAt: '2026-03-16T10:05:00Z', emotions: [{ type: 'neutral', label: '规范', confidence: 0.8 }], seqOrder: 18 },
  ],

  // ---------- Contact 004 - 工作群 ----------
  'contact-004': [
    { id: 'rec-004-01', contactId: 'contact-004', senderName: '项目经理', content: '@所有人 本周五下午3点项目评审会，请各位提前准备好自己负责模块的进度汇报', msgType: 'text', sentAt: '2026-03-17T09:00:00Z', emotions: [{ type: 'neutral', label: '通知', confidence: 0.85 }], seqOrder: 1 },
    { id: 'rec-004-02', contactId: 'contact-004', senderName: '组长', content: '收到。前端组的同学注意，UI走查在周四上午，请确保页面和设计稿对齐', msgType: 'text', sentAt: '2026-03-17T09:02:00Z', emotions: [{ type: 'neutral', label: '安排', confidence: 0.8 }], seqOrder: 2 },
    { id: 'rec-004-03', contactId: 'contact-004', senderName: '小陈', content: '组长，搜索模块的动效我改了三版了，设计那边还是说不太对，能不能约个会对一下', msgType: 'text', sentAt: '2026-03-17T09:05:00Z', emotions: [{ type: 'negative', label: '困扰', confidence: 0.72 }], seqOrder: 3 },
    { id: 'rec-004-04', contactId: 'contact-004', senderName: '组长', content: '你把三版录屏发群里，我先看看差在哪', msgType: 'text', sentAt: '2026-03-17T09:06:00Z', emotions: [{ type: 'neutral', label: '指导', confidence: 0.78 }], seqOrder: 4 },
    { id: 'rec-004-05', contactId: 'contact-004', senderName: '我', content: '我这边的聊天模块联调基本完成了，还剩消息撤回功能在和后端对接', msgType: 'text', sentAt: '2026-03-17T09:10:00Z', emotions: [{ type: 'neutral', label: '汇报', confidence: 0.75 }], seqOrder: 5 },
    { id: 'rec-004-06', contactId: 'contact-004', senderName: '项目经理', content: '消息撤回的deadline是什么时候？能赶上周五评审吗', msgType: 'text', sentAt: '2026-03-17T09:12:00Z', emotions: [{ type: 'neutral', label: '追问', confidence: 0.7 }], seqOrder: 6 },
    { id: 'rec-004-07', contactId: 'contact-004', senderName: '我', content: '后端接口今天能出，我明天就能联调完，周五评审没问题', msgType: 'text', sentAt: '2026-03-17T09:13:00Z', emotions: [{ type: 'positive', label: '自信', confidence: 0.8 }], seqOrder: 7 },
    { id: 'rec-004-08', contactId: 'contact-004', senderName: '项目经理', content: '好的，辛苦了👍', msgType: 'text', sentAt: '2026-03-17T09:14:00Z', emotions: [{ type: 'positive', label: '肯定', confidence: 0.82 }], seqOrder: 8 },
    { id: 'rec-004-09', contactId: 'contact-004', senderName: '小陈', content: '大佬们 有人遇到过GSAP在Vue3 KeepAlive下动画重复执行的问题吗', msgType: 'text', sentAt: '2026-03-17T14:00:00Z', emotions: [{ type: 'negative', label: '求助', confidence: 0.75 }], seqOrder: 9 },
    { id: 'rec-004-10', contactId: 'contact-004', senderName: '我', content: '遇到过 你需要在onDeactivated里killTweensOf 不然组件重新activated的时候会叠加', msgType: 'text', sentAt: '2026-03-17T14:03:00Z', emotions: [{ type: 'neutral', label: '帮助', confidence: 0.85 }], seqOrder: 10 },
    { id: 'rec-004-11', contactId: 'contact-004', senderName: '小陈', content: '原来如此！试了一下果然好了 谢谢🙏', msgType: 'text', sentAt: '2026-03-17T14:10:00Z', emotions: [{ type: 'positive', label: '感谢', confidence: 0.9 }], seqOrder: 11 },
    { id: 'rec-004-12', contactId: 'contact-004', senderName: '组长', content: '这个问题我之前也遇到了，建议写到团队wiki里，后面新人也能看到', msgType: 'text', sentAt: '2026-03-17T14:15:00Z', emotions: [{ type: 'neutral', label: '建议', confidence: 0.78 }], seqOrder: 12 },
    { id: 'rec-004-13', contactId: 'contact-004', senderName: '我', content: '好的 我来写 顺便整理下其他常见的动画坑', msgType: 'text', sentAt: '2026-03-17T14:16:00Z', emotions: [{ type: 'positive', label: '主动', confidence: 0.82 }], seqOrder: 13 },
    { id: 'rec-004-14', contactId: 'contact-004', senderName: '项目经理', content: '提醒一下，明天上午10点有个线上部署，相关同学注意待命', msgType: 'text', sentAt: '2026-03-18T17:00:00Z', emotions: [{ type: 'neutral', label: '通知', confidence: 0.82 }], seqOrder: 14 },
    { id: 'rec-004-15', contactId: 'contact-004', senderName: '小陈', content: '收到！', msgType: 'text', sentAt: '2026-03-18T17:01:00Z', emotions: [{ type: 'neutral', label: '确认', confidence: 0.65 }], seqOrder: 15 },
    { id: 'rec-004-16', contactId: 'contact-004', senderName: '我', content: '收到 我检查一下配置文件', msgType: 'text', sentAt: '2026-03-18T17:02:00Z', emotions: [{ type: 'neutral', label: '响应', confidence: 0.7 }], seqOrder: 16 },
    { id: 'rec-004-17', contactId: 'contact-004', senderName: '组长', content: '部署checklist我更新了，大家按流程来', msgType: 'text', sentAt: '2026-03-18T17:05:00Z', emotions: [{ type: 'neutral', label: '规范', confidence: 0.78 }], seqOrder: 17 },
    { id: 'rec-004-18', contactId: 'contact-004', senderName: '项目经理', content: '部署顺利完成，目前线上运行正常。大家辛苦了！🎉', msgType: 'text', sentAt: '2026-03-19T11:30:00Z', emotions: [{ type: 'positive', label: '庆祝', confidence: 0.88 }], seqOrder: 18 },
    { id: 'rec-004-19', contactId: 'contact-004', senderName: '小陈', content: '耶！终于上线了 🥳', msgType: 'emoji', sentAt: '2026-03-19T11:31:00Z', emotions: [{ type: 'positive', label: '兴奋', confidence: 0.9 }], seqOrder: 19 },
    { id: 'rec-004-20', contactId: 'contact-004', senderName: '我', content: '辛苦各位！下次迭代见', msgType: 'text', sentAt: '2026-03-19T11:32:00Z', emotions: [{ type: 'positive', label: '轻松', confidence: 0.82 }], seqOrder: 20 },
  ],

  // ---------- Contact 005 - 妈妈 ----------
  'contact-005': [
    { id: 'rec-005-01', contactId: 'contact-005', senderName: '妈妈', content: '儿子 今天降温了 你多穿点衣服 别感冒了', msgType: 'text', sentAt: '2026-03-16T07:00:00Z', emotions: [{ type: 'positive', label: '关心', confidence: 0.95 }], seqOrder: 1 },
    { id: 'rec-005-02', contactId: 'contact-005', senderName: '妈妈', content: '[语音消息] 你中午别老是吃外卖 外卖不干净 妈给你说 上次新闻里说那个外卖用的油都是地沟油 你自己带个饭吧 早上起来弄一下很快的', msgType: 'voice', sentAt: '2026-03-16T07:02:00Z', emotions: [{ type: 'positive', label: '唠叨关心', confidence: 0.88 }], seqOrder: 2 },
    { id: 'rec-005-03', contactId: 'contact-005', senderName: '我', content: '妈 我知道啦 今天穿了外套出门的', msgType: 'text', sentAt: '2026-03-16T08:30:00Z', emotions: [{ type: 'neutral', label: '回应', confidence: 0.65 }], seqOrder: 3 },
    { id: 'rec-005-04', contactId: 'contact-005', senderName: '妈妈', content: '穿的薄外套还是厚外套？今天8度呢 得穿厚的', msgType: 'text', sentAt: '2026-03-16T08:31:00Z', emotions: [{ type: 'positive', label: '担心', confidence: 0.88 }], seqOrder: 4 },
    { id: 'rec-005-05', contactId: 'contact-005', senderName: '我', content: '厚的厚的 放心吧妈', msgType: 'text', sentAt: '2026-03-16T08:32:00Z', emotions: [{ type: 'neutral', label: '安抚', confidence: 0.7 }], seqOrder: 5 },
    { id: 'rec-005-06', contactId: 'contact-005', senderName: '妈妈', content: '你爸说让你五一的时候回来一趟 给你姥爷过生日', msgType: 'text', sentAt: '2026-03-16T12:00:00Z', emotions: [{ type: 'neutral', label: '传达', confidence: 0.72 }], seqOrder: 6 },
    { id: 'rec-005-07', contactId: 'contact-005', senderName: '我', content: '好的 五一我请两天假回去', msgType: 'text', sentAt: '2026-03-16T12:10:00Z', emotions: [{ type: 'positive', label: '爽快', confidence: 0.78 }], seqOrder: 7 },
    { id: 'rec-005-08', contactId: 'contact-005', senderName: '妈妈', content: '真的吗！太好了 那妈给你做你爱吃的红烧排骨', msgType: 'text', sentAt: '2026-03-16T12:11:00Z', emotions: [{ type: 'positive', label: '开心', confidence: 0.95 }], seqOrder: 8 },
    { id: 'rec-005-09', contactId: 'contact-005', senderName: '妈妈', content: '还有糖醋鱼 上次你说想吃来着', msgType: 'text', sentAt: '2026-03-16T12:11:30Z', emotions: [{ type: 'positive', label: '记挂', confidence: 0.9 }], seqOrder: 9 },
    { id: 'rec-005-10', contactId: 'contact-005', senderName: '我', content: '哈哈 妈你记性真好 那我可太期待了', msgType: 'text', sentAt: '2026-03-16T12:13:00Z', emotions: [{ type: 'positive', label: '幸福', confidence: 0.88 }], seqOrder: 10 },
    { id: 'rec-005-11', contactId: 'contact-005', senderName: '妈妈', content: '这个你看看 说每天喝点柠檬水对身体好', msgType: 'text', sentAt: '2026-03-17T20:00:00Z', emotions: [{ type: 'positive', label: '分享', confidence: 0.7 }], seqOrder: 11 },
    { id: 'rec-005-12', contactId: 'contact-005', senderName: '妈妈', content: '[链接] 《这5种水果千万不能空腹吃！转发给你关心的人》', msgType: 'text', sentAt: '2026-03-17T20:00:30Z', emotions: [{ type: 'positive', label: '关心', confidence: 0.72 }], seqOrder: 12 },
    { id: 'rec-005-13', contactId: 'contact-005', senderName: '我', content: '妈 这种养生文章好多都是假的 别信哈', msgType: 'text', sentAt: '2026-03-17T20:05:00Z', emotions: [{ type: 'neutral', label: '提醒', confidence: 0.68 }], seqOrder: 13 },
    { id: 'rec-005-14', contactId: 'contact-005', senderName: '妈妈', content: '人家写的有道理的嘛 反正多吃水果总没错', msgType: 'text', sentAt: '2026-03-17T20:06:00Z', emotions: [{ type: 'neutral', label: '坚持', confidence: 0.7 }], seqOrder: 14 },
    { id: 'rec-005-15', contactId: 'contact-005', senderName: '我', content: '行行行 我多吃水果 听您的😊', msgType: 'text', sentAt: '2026-03-17T20:07:00Z', emotions: [{ type: 'positive', label: '顺从', confidence: 0.75 }], seqOrder: 15 },
    { id: 'rec-005-16', contactId: 'contact-005', senderName: '妈妈', content: '[语音消息] 儿子啊 你现在有没有对象 妈同事的女儿 在医院上班的 人很好 要不要介绍给你认识', msgType: 'voice', sentAt: '2026-03-18T19:00:00Z', emotions: [{ type: 'neutral', label: '催婚', confidence: 0.85 }], seqOrder: 16 },
    { id: 'rec-005-17', contactId: 'contact-005', senderName: '我', content: '妈 我自己的事我自己会安排的 不用操心了', msgType: 'text', sentAt: '2026-03-18T19:05:00Z', emotions: [{ type: 'negative', label: '回避', confidence: 0.68 }], seqOrder: 17 },
    { id: 'rec-005-18', contactId: 'contact-005', senderName: '妈妈', content: '妈不是催你 就是关心你嘛 一个人在外面妈不放心', msgType: 'text', sentAt: '2026-03-18T19:06:00Z', emotions: [{ type: 'positive', label: '心疼', confidence: 0.9 }], seqOrder: 18 },
    { id: 'rec-005-19', contactId: 'contact-005', senderName: '我', content: '我知道的妈 等合适的时候我会带回来给你看的', msgType: 'text', sentAt: '2026-03-18T19:08:00Z', emotions: [{ type: 'positive', label: '安抚', confidence: 0.78 }], seqOrder: 19 },
    { id: 'rec-005-20', contactId: 'contact-005', senderName: '妈妈', content: '好好好 妈等着 今晚早点睡 别熬夜', msgType: 'text', sentAt: '2026-03-18T19:10:00Z', emotions: [{ type: 'positive', label: '叮嘱', confidence: 0.88 }], seqOrder: 20 },
    { id: 'rec-005-21', contactId: 'contact-005', senderName: '妈妈', content: '儿子 今天吃早饭了没', msgType: 'text', sentAt: '2026-03-19T06:45:00Z', emotions: [{ type: 'positive', label: '关心', confidence: 0.88 }], seqOrder: 21 },
    { id: 'rec-005-22', contactId: 'contact-005', senderName: '我', content: '吃了吃了 煮了鸡蛋和牛奶', msgType: 'text', sentAt: '2026-03-19T07:00:00Z', emotions: [{ type: 'neutral', label: '汇报', confidence: 0.65 }], seqOrder: 22 },
    { id: 'rec-005-23', contactId: 'contact-005', senderName: '妈妈', content: '光喝牛奶不行 得吃点主食 面包馒头什么的', msgType: 'text', sentAt: '2026-03-19T07:01:00Z', emotions: [{ type: 'positive', label: '唠叨', confidence: 0.82 }], seqOrder: 23 },
  ],
}

// ==================== AI Dialog Mock Data ====================

const MOCK_AI_DIALOGS: Record<string, any[]> = {
  // ---------- Contact 001 - 张三 ----------
  'contact-001': [
    { id: 'dlg-001-01', contactId: 'contact-001', role: 'user', content: '我和张三的友情健康吗？感觉他最近有点不一样', createdTime: '2026-03-16T15:00:00Z' },
    { id: 'dlg-001-02', contactId: 'contact-001', role: 'ai_advisor', content: '从聊天记录来看，你和张三的友情非常健康。几个关键指标：1）双向主动性强 —— 你们互相发起对话的比例接近1:1，说明关系是平等的；2）话题多元 —— 从工作烦恼到日常分享再到推荐好剧，说明你们愿意分享生活的不同面；3）情感支持充足 —— 他遇到裁员风险时你主动安慰，他也会提前帮你占座位。至于"有点不一样"的感觉，可能和他最近面临的职业压力有关，建议多主动关心他的求职进展。', createdTime: '2026-03-16T15:00:30Z' },
    { id: 'dlg-001-03', contactId: 'contact-001', role: 'user', content: '那我怎么才能更好地支持他？', createdTime: '2026-03-16T15:02:00Z' },
    { id: 'dlg-001-04', contactId: 'contact-001', role: 'ai_advisor', content: '几个建议：1）不要过度追问工作的事 —— 让他在准备好的时候主动分享；2）多制造轻松的线下活动 —— 比如你们已经约好的烧烤局，这种"不聊正事也很开心"的陪伴最有力量；3）如果有合适的工作机会，可以自然地提一嘴，但不要变成"帮你找工作"的角色 —— 那样会让他有压力。你现在的做法其实已经很好了，"骑驴找马"这个建议既务实又不制造焦虑。', createdTime: '2026-03-16T15:02:30Z' },
    { id: 'dlg-001-05', contactId: 'contact-001', role: 'user', content: '我们聊天有什么不太好的模式吗', createdTime: '2026-03-17T10:00:00Z' },
    { id: 'dlg-001-06', contactId: 'contact-001', role: 'ai_advisor', content: '总体沟通模式很健康，但有一个小地方可以留意：你偶尔会用"玩笑"来化解严肃话题（比如"大不了一起创业哈哈"），虽然大多数情况这是调节气氛的好方式，但在对方真正焦虑的时候，先共情再幽默会更好。另外，你们的交流时间高度集中在晚间，如果偶尔在白天发一条简短的关心（"今天咋样"），会让对方感到你随时在。', createdTime: '2026-03-17T10:00:30Z' },
  ],

  // ---------- Contact 002 - 李薇 ----------
  'contact-002': [
    { id: 'dlg-002-01', contactId: 'contact-002', role: 'user', content: '你觉得李薇对我有意思吗？我们现在算什么关系', createdTime: '2026-03-18T10:00:00Z' },
    { id: 'dlg-002-02', contactId: 'contact-002', role: 'ai_advisor', content: '从聊天数据来看，有几个明显的积极信号：1）她主动发起关心（"吃晚饭了吗""早安呀"）—— 说明你在她日常思维中占有位置；2）她会记住你随口提到的事（"你不是说想试试嘛"那家日料）—— 这种细节记忆说明她在意你说的每句话；3）约会主动性强 —— 画展、选餐厅，她愿意为你们的相处花心思；4）睡前道晚安已经成为固定仪式，这通常出现在有情感连接的关系中。综合来看，你们已经超越普通朋友，处于暧昧到恋爱的过渡阶段。', createdTime: '2026-03-18T10:00:30Z' },
    { id: 'dlg-002-03', contactId: 'contact-002', role: 'user', content: '那我应该怎么推进关系？要不要表白', createdTime: '2026-03-18T10:02:00Z' },
    { id: 'dlg-002-04', contactId: 'contact-002', role: 'ai_advisor', content: '从你们目前的互动节奏来看，不建议突然正式表白 —— 可能会打破现在舒适的相处氛围。更好的方式是"让关系自然升温"：1）周日看画展是很好的机会，面对面的肢体语言比文字更有说服力；2）可以在合适的时刻说一些真诚但不过重的话，比如"和你在一起的时间总过得特别快"；3）增加只属于你们两个人的仪式感 —— 比如"焦糖玛奇朵小姐"这个昵称就很好，让关系有专属感。如果周日约会的氛围很好，可以在散步的时候自然地进一步，比如"以后有好看的展，我们都一起去吧"。', createdTime: '2026-03-18T10:02:30Z' },
  ],

  // ---------- Contact 003 - 王大明 ----------
  'contact-003': [
    { id: 'dlg-003-01', contactId: 'contact-003', role: 'user', content: '我和王大明算关系好的同事吗？平时该怎么维护', createdTime: '2026-03-16T16:00:00Z' },
    { id: 'dlg-003-02', contactId: 'contact-003', role: 'ai_advisor', content: '你和王大明的同事关系属于"高质量专业型"，有几个突出特点：1）沟通高效 —— 你们的对话几乎没有废话，信息传达清晰准确；2）互助平等 —— 他主动提醒你环境变更，你帮他确认技术选型，是双向输出；3）幽默点缀 —— 他那句"之前我自己踩过这个坑"说明他愿意在专业之外展示真实的一面，这是信任的信号。维护建议：保持专业互助的核心不变，偶尔在非工作场景（比如公司团建）多聊聊，但不需要刻意变成"好朋友"，这种边界清晰的同事关系反而最稳固。', createdTime: '2026-03-16T16:00:30Z' },
    { id: 'dlg-003-03', contactId: 'contact-003', role: 'user', content: '跟他协作有什么需要注意的吗', createdTime: '2026-03-17T09:00:00Z' },
    { id: 'dlg-003-04', contactId: 'contact-003', role: 'ai_advisor', content: '从沟通记录看，王大明是一个注重规范和文档的人（他会主动更新接口文档、提醒环境变更、建议写wiki）。和这类同事协作，最重要的是：1）尊重流程 —— 有问题先查文档再问他，他会更欣赏这种工作方式；2）及时反馈 —— 他提供的信息你用了之后记得告知结果（像你说"差点就配错环境了"就做得很好）；3）公开认可 —— 在组内适当表达感谢（"大明帮我排查了时间戳问题"），这类同事最在意专业能力的被认可。', createdTime: '2026-03-17T09:00:30Z' },
  ],

  // ---------- Contact 004 - 工作群 ----------
  'contact-004': [
    { id: 'dlg-004-01', contactId: 'contact-004', role: 'user', content: '我在工作群里的表现怎么样 有没有需要改进的地方', createdTime: '2026-03-18T12:00:00Z' },
    { id: 'dlg-004-02', contactId: 'contact-004', role: 'ai_advisor', content: '你在工作群的表现非常积极，几个亮点：1）主动汇报 —— 不等人问就同步自己的进度，项目经理对此明显认可（"辛苦了👍"）；2）乐于助人 —— 小陈遇到GSAP问题你第一时间响应并给出精准解答，还主动提出写文档，这在团队中建立了"技术可靠"的形象；3）承诺管理好 —— "周五评审没问题"的回复既给了项目经理信心，又没过度承诺。需要改进的很少，一个小建议是：在群里也可以偶尔问问别人的进度或者夸一下同事的工作，让你的角色从"独立贡献者"更多地向"团队协作者"靠拢。', createdTime: '2026-03-18T12:00:30Z' },
    { id: 'dlg-004-03', contactId: 'contact-004', role: 'user', content: '怎么和项目经理保持更好的关系', createdTime: '2026-03-18T14:00:00Z' },
    { id: 'dlg-004-04', contactId: 'contact-004', role: 'ai_advisor', content: '从群里的互动来看，项目经理是"结果导向+关心团队"的管理风格。和这类leader相处的要点：1）主动给确定性 —— 你已经做得很好（"后端今天能出，明天联调完"），这种带时间节点的反馈是PM最爱的；2）超预期交付 —— 比如你主动提出写wiki，这类"份外之事"他会记住；3）遇到风险提前报 —— 如果预感到延期，在问题发生前48小时预警，比出了问题再说要好得多。总的来说，你在团队中的定位清晰且正面，继续保持。', createdTime: '2026-03-18T14:00:30Z' },
  ],

  // ---------- Contact 005 - 妈妈 ----------
  'contact-005': [
    { id: 'dlg-005-01', contactId: 'contact-005', role: 'user', content: '怎么和妈妈沟通更顺畅？她总是唠叨 我有时候真的很烦', createdTime: '2026-03-18T20:00:00Z' },
    { id: 'dlg-005-02', contactId: 'contact-005', role: 'ai_advisor', content: '理解你的感受。但从聊天记录来看，你妈妈的"唠叨"背后都是纯粹的爱：提醒穿衣、担心外卖、记得你爱吃的菜、发养生文章……这些都是她表达"我在想你"的方式。建议：1）回复时多一两个字的温度 —— 把"知道了"换成"知道啦妈 放心"，多一个"放心"就能让她安心一整天；2）主动发起一些话题 —— 不要总是被动回复，偶尔发一张饭菜照片、说一句"今天看到一个花 想起咱家阳台那盆"，她会特别开心；3）对于养生文章，与其纠正，不如回一句"妈 我看看"就好，这不是认同谣言，是认同她的关心。', createdTime: '2026-03-18T20:00:30Z' },
    { id: 'dlg-005-03', contactId: 'contact-005', role: 'user', content: '她总催我找对象怎么办', createdTime: '2026-03-18T20:05:00Z' },
    { id: 'dlg-005-04', contactId: 'contact-005', role: 'ai_advisor', content: '催婚是中国式家庭沟通中最常见的"压力点"。你在记录里的回复其实已经不错（"合适的时候会带回来给你看的"），既没有对抗也没有敷衍。几个更好的策略：1）给她一个"模糊的希望" —— "最近有在接触一些人了，你别操心"，即使还没有，这也能让她从"焦虑催促"模式转为"期待等待"模式；2）理解她催婚的本质 —— 不是不信任你，而是怕你一个人在外面"过得不好"，所以多分享生活的积极面（朋友聚会、工作成就）能间接缓解她的焦虑；3）设置边界 —— 如果她持续提同一个人选，可以温和地说"妈 这个事我记住了 让我自己感受一下好吗"。', createdTime: '2026-03-18T20:05:30Z' },
    { id: 'dlg-005-05', contactId: 'contact-005', role: 'user', content: '我是不是对妈妈太冷淡了', createdTime: '2026-03-19T08:00:00Z' },
    { id: 'dlg-005-06', contactId: 'contact-005', role: 'ai_advisor', content: '从数据来看，你的回复率是100%（妈妈的每条消息你都回了），这已经比很多人好很多了。但回复的"温度"确实有提升空间 —— 你的回复平均6个字，而妈妈平均22个字。不是说你要写长篇，而是可以试试：1）偶尔用语音回复 —— 妈妈发语音你回文字，会让她觉得"代沟"存在；2）主动发第一条消息 —— 在你的记录中，妈妈发起对话的比例是85%，如果你每周主动发两三次"妈 今天吃了xxx 挺好吃的"，她会高兴好几天；3）记住她说过的小事 —— 下次聊天提一句"妈 上次你说的柠檬水我试了 确实不错"，这种"我在听你说话"的信号对她特别重要。', createdTime: '2026-03-19T08:00:30Z' },
  ],
}

/** 每个联系人的个性化分析数据 */
const CONTACT_ANALYSIS_MAP: Record<string, any> = {
  'contact-001': {
    topTopics: ['工作吐槽', '美食', '影视剧', '周末计划'],
    healthScore: { trust: 88, respect: 85, intimacy: 78, support: 92 },
    keyMoments: [
      { date: '2026-02-14', type: 'milestone', label: '认识5周年', description: '你们在朋友圈互相纪念了认识5年' },
      { date: '2026-03-01', type: 'sweet', label: '生日惊喜', description: '你为张三策划了一场惊喜生日聚会' },
      { date: '2026-03-15', type: 'reconciliation', label: '倾听支持', description: '张三分享裁员焦虑，你给予了真诚的鼓励和建议' },
    ],
    communicationStyle: {
      initiativeRatio: 0.52,
      avgResponseTime: '8分钟',
      emojiUsage: 'frequent',
      avgMessageLength: 28,
      preferredTimeSlot: '21:00-23:00',
      voiceMessageRatio: 0.08,
      questionRatio: 0.22,
      humorIndex: 0.75,
    },
    sentimentTrend: [
      { date: '2026-01-15', score: 0.72 },
      { date: '2026-01-31', score: 0.75 },
      { date: '2026-02-15', score: 0.82 },
      { date: '2026-02-28', score: 0.78 },
      { date: '2026-03-10', score: 0.7 },
      { date: '2026-03-19', score: 0.8 },
    ],
    emotionalInsights: [
      '你们的对话中70%以上是正面情绪',
      '张三遇到困难时会第一时间找你倾诉',
      '你们在深夜的对话情感浓度更高',
      '推荐和分享内容是你们维系感情的重要方式',
    ],
    suggestions: [
      '张三最近承受职业压力，可以更频繁地主动问候',
      '你们的线下聚会频率可以适当增加，面对面交流质量更高',
      '在他分享困难时，先共情再给建议效果更好',
    ],
    wordCloud: [
      { word: '哈哈哈', count: 95 }, { word: '走起', count: 68 }, { word: '烧烤', count: 52 },
      { word: '兄弟', count: 48 }, { word: '周末', count: 45 }, { word: '球赛', count: 38 },
      { word: '好看', count: 35 }, { word: '牛逼', count: 32 },
    ],
  },
  'contact-002': {
    topTopics: ['日常关心', '美食探店', '艺术文化', '生活分享'],
    healthScore: { trust: 82, respect: 90, intimacy: 75, support: 88 },
    keyMoments: [
      { date: '2026-02-20', type: 'sweet', label: '第一次约饭', description: '你们第一次单独出来吃饭，聊到了很晚' },
      { date: '2026-03-08', type: 'milestone', label: '互赠礼物', description: '三八节你送了她一本书，她送了你一条围巾' },
      { date: '2026-03-17', type: 'sweet', label: '画展约会', description: '她主动邀约看莫奈画展，标志着关系进一步' },
    ],
    communicationStyle: {
      initiativeRatio: 0.45,
      avgResponseTime: '5分钟',
      emojiUsage: 'moderate',
      avgMessageLength: 35,
      preferredTimeSlot: '20:00-22:30',
      voiceMessageRatio: 0.02,
      questionRatio: 0.3,
      humorIndex: 0.55,
    },
    sentimentTrend: [
      { date: '2026-01-15', score: 0.55 },
      { date: '2026-01-31', score: 0.62 },
      { date: '2026-02-15', score: 0.7 },
      { date: '2026-02-28', score: 0.78 },
      { date: '2026-03-10', score: 0.82 },
      { date: '2026-03-19', score: 0.88 },
    ],
    emotionalInsights: [
      '你们的情感趋势持续上升，关系在稳步升温',
      '她的回复速度在所有联系人中最快（平均5分钟内）',
      '她会记住你随口提到的小事，说明在意程度很高',
      '睡前道晚安已成为固定仪式',
    ],
    suggestions: [
      '周日画展约会是推进关系的好机会，准备一些有深度的话题',
      '可以偶尔在白天分享一些小发现（一朵花、一杯好咖啡），制造惊喜感',
      '她对美食和艺术都有兴趣，可以作为未来约会的主题',
    ],
    wordCloud: [
      { word: '好呀', count: 78 }, { word: '早安', count: 62 }, { word: '晚安', count: 58 },
      { word: '好吃', count: 45 }, { word: '好看', count: 42 }, { word: '嘻嘻', count: 38 },
      { word: '辛苦', count: 35 }, { word: '想去', count: 30 },
    ],
  },
  'contact-003': {
    topTopics: ['接口对接', '技术方案', '项目进度', '环境配置'],
    healthScore: { trust: 72, respect: 88, intimacy: 35, support: 78 },
    keyMoments: [
      { date: '2026-02-10', type: 'milestone', label: '首次协作', description: '第一次和王大明进行接口联调' },
      { date: '2026-03-14', type: 'reconciliation', label: '高效联调', description: '时间戳问题快速定位并解决，建立了默契' },
    ],
    communicationStyle: {
      initiativeRatio: 0.55,
      avgResponseTime: '12分钟',
      emojiUsage: 'rare',
      avgMessageLength: 52,
      preferredTimeSlot: '09:00-17:00',
      voiceMessageRatio: 0.0,
      questionRatio: 0.35,
      humorIndex: 0.2,
    },
    sentimentTrend: [
      { date: '2026-01-15', score: 0.5 },
      { date: '2026-01-31', score: 0.52 },
      { date: '2026-02-15', score: 0.58 },
      { date: '2026-02-28', score: 0.6 },
      { date: '2026-03-10', score: 0.65 },
      { date: '2026-03-19', score: 0.68 },
    ],
    emotionalInsights: [
      '你们的对话高度专业化，90%以上与工作相关',
      '沟通效率很高，平均每次对话能解决1-2个问题',
      '王大明是一个注重文档和规范的人，你的沟通方式与之契合',
      '偶尔的幽默（"踩过坑"）说明你们之间有基础的信任',
    ],
    suggestions: [
      '可以适当在工作之余聊几句轻松的话题',
      '他主动提醒你环境变更，这种互助行为值得回馈',
      '联调成功后一句"大明哥靠谱"能增进关系',
    ],
    wordCloud: [
      { word: '接口', count: 42 }, { word: '文档', count: 38 }, { word: '联调', count: 35 },
      { word: '环境', count: 28 }, { word: '签名', count: 22 }, { word: '收到', count: 45 },
      { word: '谢谢', count: 30 }, { word: '没问题', count: 25 },
    ],
  },
  'contact-004': {
    topTopics: ['项目进度', '技术讨论', '部署上线', '团队协作'],
    healthScore: { trust: 70, respect: 82, intimacy: 30, support: 75 },
    keyMoments: [
      { date: '2026-03-17', type: 'milestone', label: '技术分享', description: '你帮助小陈解决了GSAP问题，获得团队认可' },
      { date: '2026-03-19', type: 'milestone', label: '上线成功', description: '团队协作顺利完成项目部署' },
    ],
    communicationStyle: {
      initiativeRatio: 0.35,
      avgResponseTime: '18分钟',
      emojiUsage: 'rare',
      avgMessageLength: 38,
      preferredTimeSlot: '09:00-18:00',
      voiceMessageRatio: 0.0,
      questionRatio: 0.18,
      humorIndex: 0.15,
    },
    sentimentTrend: [
      { date: '2026-01-15', score: 0.55 },
      { date: '2026-01-31', score: 0.58 },
      { date: '2026-02-15', score: 0.6 },
      { date: '2026-02-28', score: 0.62 },
      { date: '2026-03-10', score: 0.65 },
      { date: '2026-03-19', score: 0.72 },
    ],
    emotionalInsights: [
      '你在团队中扮演着"技术支撑"的角色',
      '项目经理对你的工作汇报和承诺管理表示认可',
      '上线成功后团队情绪明显正面提升',
      '你主动写文档的行为提升了团队中的信任度',
    ],
    suggestions: [
      '可以多主动关心团队成员的进度，增强协作感',
      '适当在群里夸赞同事的贡献，建立更好的团队氛围',
      '技术分享可以定期做，巩固你的专业形象',
    ],
    wordCloud: [
      { word: '收到', count: 88 }, { word: '进度', count: 52 }, { word: '部署', count: 45 },
      { word: '联调', count: 40 }, { word: '辛苦', count: 35 }, { word: '没问题', count: 32 },
      { word: '评审', count: 28 }, { word: '上线', count: 25 },
    ],
  },
  'contact-005': {
    topTopics: ['身体健康', '饮食起居', '家庭琐事', '感情状况'],
    healthScore: { trust: 95, respect: 78, intimacy: 82, support: 98 },
    keyMoments: [
      { date: '2026-02-10', type: 'sweet', label: '妈妈生日', description: '你寄了一束花回家，妈妈发朋友圈说"儿子长大了"' },
      { date: '2026-03-08', type: 'sweet', label: '三八节祝福', description: '你主动发了节日祝福，妈妈高兴了一整天' },
      { date: '2026-03-16', type: 'conflict', label: '催婚小摩擦', description: '妈妈介绍对象被你委婉拒绝，但双方都很克制' },
      { date: '2026-03-16', type: 'reconciliation', label: '五一约定', description: '你答应五一回家，妈妈立刻开心地计划菜单' },
    ],
    communicationStyle: {
      initiativeRatio: 0.15,
      avgResponseTime: '45分钟',
      emojiUsage: 'rare',
      avgMessageLength: 12,
      preferredTimeSlot: '07:00-08:30',
      voiceMessageRatio: 0.0,
      questionRatio: 0.1,
      humorIndex: 0.1,
    },
    sentimentTrend: [
      { date: '2026-01-15', score: 0.75 },
      { date: '2026-01-31', score: 0.78 },
      { date: '2026-02-15', score: 0.82 },
      { date: '2026-02-28', score: 0.8 },
      { date: '2026-03-10', score: 0.85 },
      { date: '2026-03-19', score: 0.88 },
    ],
    emotionalInsights: [
      '妈妈发起85%的对话，说明她时刻在想你',
      '你的回复简短但从不缺席，这是一种可靠',
      '催婚话题虽有摩擦但处理得当，双方都在克制中表达爱',
      '妈妈用语音消息的频率很高，说明她更习惯"说"而非"打字"',
    ],
    suggestions: [
      '尝试每周主动给妈妈发2-3条消息，不一定有事，就是日常分享',
      '偶尔用语音回复，拉近"代沟"的距离感',
      '妈妈分享养生文章时不必纠正，一句"妈我看看"就够了',
      '回家时主动帮忙做家务，行动比语言更能表达爱',
    ],
    wordCloud: [
      { word: '吃饭', count: 92 }, { word: '早点睡', count: 68 }, { word: '穿衣服', count: 55 },
      { word: '外卖', count: 42 }, { word: '回来', count: 40 }, { word: '好的', count: 85 },
      { word: '知道了', count: 72 }, { word: '放心', count: 38 },
    ],
  },
}

function buildAnalysisResult(contactId: string) {
  const contact = MOCK_CONTACTS.find((c) => c.id === contactId)
  if (!contact) return null

  const perContact = CONTACT_ANALYSIS_MAP[contactId]
  const fallback = CONTACT_ANALYSIS_MAP['contact-001']
  const data = perContact || fallback

  return {
    contactId,
    contactName: contact.name,
    totalMessages: contact.totalMessages,
    dateRange: {
      from: '2026-01-15T00:00:00Z',
      to: '2026-03-19T09:30:00Z',
    },
    sentimentOverall: contact.sentiment === 'very_positive' ? 'positive' : contact.sentiment,
    sentimentScore: contact.sentiment === 'very_positive' ? 0.92 : contact.sentiment === 'positive' ? 0.78 : 0.55,
    sentimentTrend: data.sentimentTrend,
    topTopics: data.topTopics,
    healthScore: data.healthScore,
    keyMoments: data.keyMoments,
    communicationStyle: data.communicationStyle,
    emotionalInsights: data.emotionalInsights,
    suggestions: data.suggestions,
    wordCloud: data.wordCloud,
    analyzedTime: '2026-03-19T10:00:00Z',
  }
}

// ==================== Handler ====================

export default function chatAssistantMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // ---------- Chat Assistant ----------

  // GET /playground/chat-assistant/messages?limit=&beforeId=
  if (method === 'get' && match('/playground/chat-assistant/messages', url)) {
    const params = config.params || {}
    const limit = Number(params.limit) || 20
    const beforeId = params.beforeId as string | undefined

    // Reverse chronological: newest first for cursor pagination
    const sorted = [...MOCK_MESSAGES].reverse()
    let startIndex = 0

    if (beforeId) {
      const idx = sorted.findIndex((m) => m.id === beforeId)
      if (idx >= 0) startIndex = idx + 1
    }

    const sliced = sorted.slice(startIndex, startIndex + limit)
    const hasMore = startIndex + limit < sorted.length

    return ok({
      messages: sliced.reverse(),
      hasMore,
    })
  }

  // POST /playground/chat-assistant/clear
  if (method === 'post' && match('/playground/chat-assistant/clear', url)) {
    return ok(null)
  }

  // GET /playground/chat-assistant/settings
  if (method === 'get' && match('/playground/chat-assistant/settings', url)) {
    return ok(MOCK_SETTINGS)
  }

  // PUT /playground/chat-assistant/settings
  if (method === 'put' && match('/playground/chat-assistant/settings', url)) {
    const body = parseBody(config.data)
    const updated = { ...MOCK_SETTINGS, ...body }
    return ok(updated)
  }

  // GET /playground/chat-assistant/emotion-calendar?year=&month=
  if (method === 'get' && match('/playground/chat-assistant/emotion-calendar', url)) {
    return ok(MOCK_EMOTION_CALENDAR)
  }

  // GET /playground/chat-assistant/soul
  if (method === 'get' && match('/playground/chat-assistant/soul', url)) {
    return ok(MOCK_SOUL_STATE)
  }

  // ---------- Chat Analyzer ----------

  // POST /playground/chat-analyzer/import
  if (method === 'post' && match('/playground/chat-analyzer/import', url)) {
    return ok({
      importId: mockId('import'),
      contactsImported: 3,
      messagesImported: 1024,
      duplicatesSkipped: 12,
      importedTime: '2026-03-19T10:00:00Z',
    })
  }

  // GET /playground/chat-analyzer/contacts
  if (method === 'get' && match('/playground/chat-analyzer/contacts', url)) {
    return ok(MOCK_CONTACTS)
  }

  // GET /playground/chat-analyzer/contacts/:id
  if (method === 'get' && match('/playground/chat-analyzer/contacts/:id', url)) {
    const id = param('/playground/chat-analyzer/contacts/:id', url, 'id')
    const contact = MOCK_CONTACTS.find((c) => c.id === id)
    if (!contact) return error(404, '联系人不存在')
    return ok(contact)
  }

  // GET /playground/chat-analyzer/contacts/:id/records?page=&pageSize=
  if (method === 'get' && match('/playground/chat-analyzer/contacts/:id/records', url)) {
    const id = param('/playground/chat-analyzer/contacts/:id/records', url, 'id')
    const records = MOCK_CHAT_RECORDS[id]
    if (!records) return error(404, '联系人不存在')

    const params = config.params || {}
    const page = Math.max(1, Number(params.page) || 1)
    const pageSize = Math.max(1, Number(params.pageSize) || 20)
    const start = (page - 1) * pageSize
    const sliced = records.slice(start, start + pageSize)

    return ok({
      records: sliced,
      total: records.length,
      page,
      pageSize,
      totalPages: Math.ceil(records.length / pageSize),
    })
  }

  // GET /playground/chat-analyzer/contacts/:id/dialog
  if (method === 'get' && match('/playground/chat-analyzer/contacts/:id/dialog', url)) {
    const id = param('/playground/chat-analyzer/contacts/:id/dialog', url, 'id')
    const dialogs = MOCK_AI_DIALOGS[id]
    if (!dialogs) return error(404, '联系人不存在')
    return ok(dialogs)
  }

  // POST /playground/chat-analyzer/contacts/:id/analyze
  if (method === 'post' && match('/playground/chat-analyzer/contacts/:id/analyze', url)) {
    const id = param('/playground/chat-analyzer/contacts/:id/analyze', url, 'id')
    const result = buildAnalysisResult(id)
    if (!result) return error(404, '联系人不存在')
    return ok(result)
  }

  return null
}
