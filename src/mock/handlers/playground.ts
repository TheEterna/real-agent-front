/**
 * Playground Mock Handler
 *
 * Covers: basic chat, image, video, speech endpoints under /playground/basic
 */
import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Chat Models ====================

const chatModels = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    description: '最新 OpenAI 多模态旗舰模型，支持视觉理解与工具调用',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsTools: true,
    inputPrice: 2.5,
    outputPrice: 10.0,
    creditPrice: 0.5,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 1,
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Anthropic 旗舰推理模型，200K 超长上下文窗口',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsTools: true,
    inputPrice: 3.0,
    outputPrice: 15.0,
    creditPrice: 0.6,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 2,
  },
  {
    id: 'deepseek-v3',
    provider: 'deepseek',
    displayName: 'DeepSeek V3',
    description: '高性价比开源大模型，适合日常对话与代码生成',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsVision: false,
    supportsTools: true,
    inputPrice: 0.07,
    outputPrice: 0.28,
    creditPrice: 0.05,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 3,
  },
]

// ==================== Chat Sessions & Messages ====================

const chatSessions = [
  {
    id: 'chat-session-js-async',
    modelId: 'gpt-4o',
    title: 'JavaScript 异步编程深入',
    messageCount: 10,
    totalTokens: 8500,
    creditsCharged: 4.25,
    createdTime: '2026-03-15T09:20:00Z',
    updatedTime: '2026-03-15T10:45:00Z',
  },
  {
    id: 'chat-session-biz-email',
    modelId: 'claude-3-5-sonnet',
    title: '帮我写一封商务邮件',
    messageCount: 8,
    totalTokens: 5200,
    creditsCharged: 3.12,
    createdTime: '2026-03-14T14:00:00Z',
    updatedTime: '2026-03-14T14:35:00Z',
  },
  {
    id: 'chat-session-python-data',
    modelId: 'deepseek-v3',
    title: 'Python 数据分析入门',
    messageCount: 12,
    totalTokens: 9800,
    creditsCharged: 0.49,
    createdTime: '2026-03-13T16:00:00Z',
    updatedTime: '2026-03-13T17:20:00Z',
  },
  {
    id: 'chat-session-ai-debate',
    modelId: 'gpt-4o',
    title: '辩论：AI 会取代程序员吗？',
    messageCount: 14,
    totalTokens: 12400,
    creditsCharged: 6.2,
    createdTime: '2026-03-12T20:00:00Z',
    updatedTime: '2026-03-12T21:30:00Z',
  },
  {
    id: 'chat-session-translate',
    modelId: 'claude-3-5-sonnet',
    title: '翻译助手：中英互译',
    messageCount: 15,
    totalTokens: 7600,
    creditsCharged: 4.56,
    createdTime: '2026-03-11T10:00:00Z',
    updatedTime: '2026-03-11T11:15:00Z',
  },
]

// --- Session 1: JavaScript 异步编程深入 ---
const jsAsyncMessages = [
  {
    id: 'js-msg-01', sessionId: 'chat-session-js-async', role: 'user' as const,
    content: '请帮我讲解一下 JavaScript 中 Promise 的基本原理，以及为什么回调地狱会被它取代？',
    attachments: [], inputTokens: 42, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-15T09:20:00Z',
  },
  {
    id: 'js-msg-02', sessionId: 'chat-session-js-async', role: 'assistant' as const,
    content: `好的！让我用一个生活化的比喻来解释 Promise。

## 回调地狱的问题

想象你在餐厅点餐：先点菜 → 等上菜 → 吃完 → 结账 → 离开。如果用回调写，就像这样：

\`\`\`javascript
点菜(菜单, function(菜) {
  等上菜(菜, function(食物) {
    吃饭(食物, function() {
      结账(function() {
        离开()  // 嵌套了四层！
      })
    })
  })
})
\`\`\`

## Promise 的解决方案

Promise 就像餐厅给你的"取餐号"——它**承诺**将来会给你一个结果（成功拿到菜/厨房着火了）。

\`\`\`javascript
点菜(菜单)
  .then(菜 => 等上菜(菜))
  .then(食物 => 吃饭(食物))
  .then(() => 结账())
  .then(() => 离开())
  .catch(错误 => 投诉(错误))
\`\`\`

**三种状态**：
- \`pending\`：还在做菜（等待中）
- \`fulfilled\`：菜好了（已完成）
- \`rejected\`：厨房着火了（已拒绝）

一旦从 pending 变为 fulfilled 或 rejected，就**不可逆转**。`,
    attachments: [], inputTokens: 0, outputTokens: 380, creditsCharged: 0.19,
    createdTime: '2026-03-15T09:20:15Z',
  },
  {
    id: 'js-msg-03', sessionId: 'chat-session-js-async', role: 'user' as const,
    content: '那 async/await 和 Promise 有什么关系？为什么说它是语法糖？',
    attachments: [], inputTokens: 28, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-15T09:25:00Z',
  },
  {
    id: 'js-msg-04', sessionId: 'chat-session-js-async', role: 'assistant' as const,
    content: `## async/await 本质上就是 Promise 的"化妆术"

\`\`\`javascript
// Promise 写法
function fetchData() {
  return fetch('/api/data')
    .then(res => res.json())
    .then(data => processData(data))
    .catch(err => handleError(err))
}

// async/await 写法 — 完全等价！
async function fetchData() {
  try {
    const res = await fetch('/api/data')
    const data = await res.json()
    return processData(data)
  } catch (err) {
    handleError(err)
  }
}
\`\`\`

**关键理解**：
1. \`async\` 函数**总是返回 Promise**
2. \`await\` 只是"暂停并等待 Promise 完成"的语法
3. 编译器会把 async/await 转换回 Promise.then 链

**为什么大家更喜欢 async/await**？因为它让异步代码**看起来像同步代码**，符合人类阅读习惯。`,
    attachments: [], inputTokens: 0, outputTokens: 320, creditsCharged: 0.16,
    createdTime: '2026-03-15T09:25:20Z',
  },
  {
    id: 'js-msg-05', sessionId: 'chat-session-js-async', role: 'user' as const,
    content: 'Promise.all 和 Promise.race 分别是什么场景下用？能举个实际例子吗？',
    attachments: [], inputTokens: 35, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-15T09:32:00Z',
  },
  {
    id: 'js-msg-06', sessionId: 'chat-session-js-async', role: 'assistant' as const,
    content: `## Promise.all — "所有人到齐才出发"

适合**并行发起多个请求，全部完成后统一处理**的场景：

\`\`\`javascript
// 同时加载用户信息、订单列表、推荐商品
const [user, orders, recommendations] = await Promise.all([
  fetchUser(userId),
  fetchOrders(userId),
  fetchRecommendations(userId)
])
// 三个请求同时发出，总耗时 = max(三者耗时)
\`\`\`

⚠️ **注意**：任何一个失败，整个 Promise.all 就失败。如果你需要"尽可能拿到结果"，用 \`Promise.allSettled\`。

## Promise.race — "谁先到就用谁"

适合**超时控制**和**竞争选择**：

\`\`\`javascript
// 超时控制：3秒内没响应就超时
const result = await Promise.race([
  fetch('/api/slow-endpoint'),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('请求超时')), 3000)
  )
])
\`\`\`

| 方法 | 成功条件 | 失败条件 |
|------|---------|---------|
| \`Promise.all\` | 全部成功 | 任一失败 |
| \`Promise.allSettled\` | 永远成功 | — |
| \`Promise.race\` | 第一个完成 | 第一个失败 |
| \`Promise.any\` | 第一个成功 | 全部失败 |`,
    attachments: [], inputTokens: 0, outputTokens: 450, creditsCharged: 0.225,
    createdTime: '2026-03-15T09:32:25Z',
  },
  {
    id: 'js-msg-07', sessionId: 'chat-session-js-async', role: 'user' as const,
    content: '在实际项目中，如何处理多个异步操作之间的依赖关系？比如先登录才能获取用户信息',
    attachments: [], inputTokens: 38, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-15T09:40:00Z',
  },
  {
    id: 'js-msg-08', sessionId: 'chat-session-js-async', role: 'assistant' as const,
    content: `## 异步依赖链的实战处理

### 场景：登录 → 获取用户信息 → 加载个性化数据

\`\`\`javascript
async function initApp() {
  // 第一步：必须先登录（前置依赖）
  const { token } = await login(credentials)

  // 第二步：拿到 token 后，可以并行请求
  const [userInfo, settings] = await Promise.all([
    fetchUserInfo(token),
    fetchUserSettings(token)
  ])

  // 第三步：拿到用户信息后，加载个性化数据
  const recommendations = await fetchRecommendations(userInfo.id)

  return { userInfo, settings, recommendations }
}
\`\`\`

**关键原则**：
1. **有依赖的串行**：await 逐步等待
2. **无依赖的并行**：Promise.all 同时发起
3. **混合场景**：先串行解决依赖，再并行加速无关操作`,
    attachments: [], inputTokens: 0, outputTokens: 340, creditsCharged: 0.17,
    createdTime: '2026-03-15T09:40:30Z',
  },
  {
    id: 'js-msg-09', sessionId: 'chat-session-js-async', role: 'user' as const,
    content: '微任务和宏任务的执行顺序是怎样的？经常在面试中被问到',
    attachments: [], inputTokens: 30, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-15T10:00:00Z',
  },
  {
    id: 'js-msg-10', sessionId: 'chat-session-js-async', role: 'assistant' as const,
    content: `## 事件循环：微任务 vs 宏任务

\`\`\`
┌─ 同步代码（调用栈）
│  ↓ 执行完毕
├─ 微任务队列（全部执行完）
│  - Promise.then/catch/finally
│  - queueMicrotask
│  - MutationObserver
│  ↓ 清空后
├─ 宏任务队列（取一个执行）
│  - setTimeout / setInterval
│  - requestAnimationFrame
│  - I/O 回调
│  ↓ 执行完一个
└─ 回到微任务队列...循环
\`\`\`

**经典面试题**：

\`\`\`javascript
console.log('1')           // 同步

setTimeout(() => {
  console.log('2')         // 宏任务
}, 0)

Promise.resolve().then(() => {
  console.log('3')         // 微任务
})

console.log('4')           // 同步

// 输出顺序：1 → 4 → 3 → 2
\`\`\`

**记忆口诀**：同步先行，微任清空，宏任逐个。`,
    attachments: [], inputTokens: 0, outputTokens: 380, creditsCharged: 0.19,
    createdTime: '2026-03-15T10:00:25Z',
  },
]

// --- Session 2: 帮我写一封商务邮件 ---
const bizEmailMessages = [
  {
    id: 'biz-msg-01', sessionId: 'chat-session-biz-email', role: 'user' as const,
    content: '帮我写一封商务邮件，向客户介绍我们公司新推出的 AI 数据分析平台，语气要专业但不生硬。',
    attachments: [], inputTokens: 45, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-14T14:00:00Z',
  },
  {
    id: 'biz-msg-02', sessionId: 'chat-session-biz-email', role: 'assistant' as const,
    content: `好的，以下是为您拟的商务邮件：

---

**主题**：诚邀体验 | DataVision AI 智能数据分析平台正式上线

尊敬的 [客户姓名] 先生/女士：

感谢您一直以来对 [公司名称] 的信任与支持。

我很高兴向您分享一个好消息——我们历时 18 个月精心打造的 **DataVision AI 智能数据分析平台**已正式上线。

**核心能力**：
- 自然语言查询：直接用中文提问，系统自动生成可视化报表
- 实时数据看板：支持百万级数据秒级响应，自动识别异常趋势
- 智能预测：基于历史数据的 AI 预测模型，准确率达 92%+

**为什么值得您关注**？
在我们的内测期间，[知名企业] 使用 DataVision 后，报表制作效率提升了 **340%**，数据决策周期从 3 天缩短至 **2 小时**。

**专属邀请**：
作为我们的重要合作伙伴，您可享受 **30 天免费试用** + 专属技术顾问 1 对 1 对接。

如您感兴趣，我可以在本周安排一次 30 分钟的线上演示。请问周三或周四下午是否方便？

期待您的回复。

此致
敬礼

[您的姓名]
[职位]
[联系方式]

---

需要我调整语气或补充哪些细节吗？`,
    attachments: [], inputTokens: 0, outputTokens: 520, creditsCharged: 0.312,
    createdTime: '2026-03-14T14:00:20Z',
  },
  {
    id: 'biz-msg-03', sessionId: 'chat-session-biz-email', role: 'user' as const,
    content: '不错！但是语气可以再轻松一些，加一些具体的数据案例，客户是互联网行业的。',
    attachments: [], inputTokens: 38, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-14T14:05:00Z',
  },
  {
    id: 'biz-msg-04', sessionId: 'chat-session-biz-email', role: 'assistant' as const,
    content: `了解，针对互联网行业客户调整后的版本：

---

**主题**：嘿，给你看个好东西 —— DataVision AI 上线了

Hi [客户姓名]，

好久没联系，最近业务还顺利吗？

有个事想第一时间跟你分享——我们的 **DataVision AI** 终于上线了。简单说就是：**用说人话的方式查数据**。

举个真实案例：
> 某头部电商平台接入后，运营团队直接在搜索框输入"上个月华东区 GMV 同比变化"，3 秒出图表。以前这个需求要提给 BI 团队排期，至少等 2 天。

**互联网行业最爱的几个功能**：
- 📊 **实时大盘**：DAU/MAU/留存率/转化漏斗，秒级刷新
- 🔍 **异常告警**：GMV 突然下跌 15%？自动推送到飞书/钉钉
- 🤖 **智能归因**：不只告诉你"掉了"，还分析"为什么掉了"

**关键数据**：
- 接入时间：半天（标准 API）
- 查询响应：P99 < 800ms
- 已服务 200+ 互联网客户

要不这样，我给你开个 30 天试用账号，你们团队先玩玩看？不满意随时关，没有任何费用。

方便的话这周线上聊 20 分钟？我给你演示几个你们行业的典型场景。

等你回复～

[您的姓名]

---

这版更 casual 了，感觉怎么样？`,
    attachments: [], inputTokens: 0, outputTokens: 580, creditsCharged: 0.348,
    createdTime: '2026-03-14T14:05:25Z',
  },
  {
    id: 'biz-msg-05', sessionId: 'chat-session-biz-email', role: 'user' as const,
    content: '很好！再帮我写一封跟进邮件，假设客户三天没回复的场景。',
    attachments: [], inputTokens: 30, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-14T14:15:00Z',
  },
  {
    id: 'biz-msg-06', sessionId: 'chat-session-biz-email', role: 'assistant' as const,
    content: `**主题**：Re: 嘿，给你看个好东西 —— DataVision AI 上线了

Hi [客户姓名]，

上次发的邮件你可能还没来得及看——最近大家都忙嘛 😄

简单追一下：我们的 DataVision AI 这周刚上了个新功能，**一键对接 Google Analytics + 神策数据**，你们团队应该用得上。

另外分享一个小花絮：我们内部给这功能起的代号叫"摸鱼神器"，因为以前做周报要折腾一整天的数据，现在 10 分钟就搞定了 🐟

试用账号我已经帮你预留好了，随时可以激活。如果你更想直接看效果，回复"demo"我就安排。

不着急，等你方便时回复就好。

[您的姓名]`,
    attachments: [], inputTokens: 0, outputTokens: 320, creditsCharged: 0.192,
    createdTime: '2026-03-14T14:15:20Z',
  },
  {
    id: 'biz-msg-07', sessionId: 'chat-session-biz-email', role: 'user' as const,
    content: '帮我把第一封邮件翻译成英文版本',
    attachments: [], inputTokens: 18, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-14T14:25:00Z',
  },
  {
    id: 'biz-msg-08', sessionId: 'chat-session-biz-email', role: 'assistant' as const,
    content: `**Subject**: Hey, check this out — DataVision AI is live!

Hi [Client Name],

Hope you've been doing well! It's been a while.

Wanted to share something exciting with you right away — our **DataVision AI** just launched. In a nutshell: **query your data in plain language**.

Here's a real case:
> After onboarding, an e-commerce ops team simply typed "GMV YoY change in East China last month" — chart appeared in 3 seconds. Previously, this request had to be submitted to the BI team and took at least 2 days.

**Features our internet clients love most**:
- 📊 **Real-time Dashboard**: DAU/MAU/retention/conversion funnels, refreshing in seconds
- 🔍 **Anomaly Alerts**: GMV drops 15%? Auto-notified via Slack/Teams
- 🤖 **Smart Attribution**: Not just "what dropped," but "why it dropped"

**Key stats**:
- Integration time: half a day (standard API)
- Query response: P99 < 800ms
- Serving 200+ internet companies

How about this: I'll set up a 30-day trial account for your team to explore? No commitment, cancel anytime.

Free for a 20-min call this week? I'd love to walk you through some use cases specific to your industry.

Looking forward to hearing from you!

[Your Name]`,
    attachments: [], inputTokens: 0, outputTokens: 420, creditsCharged: 0.252,
    createdTime: '2026-03-14T14:25:30Z',
  },
]

// --- Session 3: Python 数据分析入门 ---
const pythonDataMessages = [
  {
    id: 'py-msg-01', sessionId: 'chat-session-python-data', role: 'user' as const,
    content: '我想学 Python 数据分析，完全零基础，应该从哪里开始？',
    attachments: [], inputTokens: 28, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-13T16:00:00Z',
  },
  {
    id: 'py-msg-02', sessionId: 'chat-session-python-data', role: 'assistant' as const,
    content: `## Python 数据分析学习路线图

### 第一阶段：基础工具（1-2 周）

| 工具 | 作用 | 类比 |
|------|------|------|
| **Pandas** | 数据处理的瑞士军刀 | 像 Excel 但更强大 |
| **NumPy** | 数值计算基础 | 像超级计算器 |
| **Matplotlib** | 基础绑图 | 像画板 |

### 先安装环境

\`\`\`bash
pip install pandas numpy matplotlib jupyter
\`\`\`

### 第一个 Pandas 实战

\`\`\`python
import pandas as pd

# 读取 CSV 文件（最常见的数据格式）
df = pd.read_csv('sales_data.csv')

# 看前 5 行
print(df.head())

# 基本统计
print(df.describe())

# 按月份统计销售额
monthly = df.groupby('month')['revenue'].sum()
print(monthly)
\`\`\`

建议你先安装 Jupyter Notebook，边写代码边看结果，学起来最快！需要我帮你准备一份练习数据吗？`,
    attachments: [], inputTokens: 0, outputTokens: 360, creditsCharged: 0.018,
    createdTime: '2026-03-13T16:00:20Z',
  },
  {
    id: 'py-msg-03', sessionId: 'chat-session-python-data', role: 'user' as const,
    content: '好的，帮我准备一份电商销售数据的例子，然后教我怎么做数据清洗',
    attachments: [], inputTokens: 32, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-13T16:10:00Z',
  },
  {
    id: 'py-msg-04', sessionId: 'chat-session-python-data', role: 'assistant' as const,
    content: `## 模拟电商销售数据 + 数据清洗实战

### 第一步：创建模拟数据

\`\`\`python
import pandas as pd
import numpy as np

# 模拟一份"脏"数据
data = {
    'order_id': range(1, 101),
    'product': ['手机', '耳机', '平板', None, '手机'] * 20,
    'price': [4999, 299, 3499, -100, 4999] * 20,  # 注意有负数！
    'quantity': [1, 2, 1, 0, 3] * 20,
    'date': ['2026-01-15', '2026-01-16', 'invalid', '2026-01-18', '2026-01-19'] * 20
}
df = pd.DataFrame(data)
print(f"原始数据：{len(df)} 行")
print(df.info())
\`\`\`

### 第二步：数据清洗四板斧

\`\`\`python
# 1️⃣ 处理缺失值
print(f"缺失值统计：\\n{df.isnull().sum()}")
df = df.dropna(subset=['product'])  # 商品名为空的删掉

# 2️⃣ 处理异常值
df = df[df['price'] > 0]      # 价格必须为正
df = df[df['quantity'] > 0]   # 数量必须为正

# 3️⃣ 类型转换
df['date'] = pd.to_datetime(df['date'], errors='coerce')  # 无效日期变 NaT
df = df.dropna(subset=['date'])

# 4️⃣ 添加计算列
df['total'] = df['price'] * df['quantity']

print(f"清洗后：{len(df)} 行")
print(df.head(10))
\`\`\`

**记住数据清洗口诀**：空值填补删、异常过滤掉、类型要统一、衍生列要加。`,
    attachments: [], inputTokens: 0, outputTokens: 520, creditsCharged: 0.026,
    createdTime: '2026-03-13T16:10:30Z',
  },
  {
    id: 'py-msg-05', sessionId: 'chat-session-python-data', role: 'user' as const,
    content: '清洗完数据后，怎么做可视化？画一些图表出来',
    attachments: [], inputTokens: 22, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-13T16:25:00Z',
  },
  {
    id: 'py-msg-06', sessionId: 'chat-session-python-data', role: 'assistant' as const,
    content: `## 数据可视化实战

\`\`\`python
import matplotlib.pyplot as plt

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False

# 创建 2x2 子图
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 1️⃣ 各商品销售额柱状图
product_sales = df.groupby('product')['total'].sum().sort_values()
product_sales.plot(kind='barh', ax=axes[0,0], color='#6db8ac')
axes[0,0].set_title('各商品销售额')

# 2️⃣ 每日销售趋势折线图
daily = df.groupby('date')['total'].sum()
daily.plot(kind='line', ax=axes[0,1], marker='o', color='#6366f1')
axes[0,1].set_title('每日销售趋势')

# 3️⃣ 商品销量占比饼图
product_qty = df.groupby('product')['quantity'].sum()
product_qty.plot(kind='pie', ax=axes[1,0], autopct='%1.1f%%')
axes[1,0].set_title('商品销量占比')

# 4️⃣ 价格分布直方图
df['price'].plot(kind='hist', ax=axes[1,1], bins=20, color='#f59e0b')
axes[1,1].set_title('价格分布')

plt.tight_layout()
plt.savefig('sales_analysis.png', dpi=150)
plt.show()
\`\`\`

**可视化三原则**：
1. 比较 → 柱状图 / 折线图
2. 占比 → 饼图 / 环形图
3. 分布 → 直方图 / 箱线图`,
    attachments: [], inputTokens: 0, outputTokens: 480, creditsCharged: 0.024,
    createdTime: '2026-03-13T16:25:25Z',
  },
  {
    id: 'py-msg-07', sessionId: 'chat-session-python-data', role: 'user' as const,
    content: 'Matplotlib 的图表不太好看，有没有更现代的可视化库推荐？',
    attachments: [], inputTokens: 25, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-13T16:40:00Z',
  },
  {
    id: 'py-msg-08', sessionId: 'chat-session-python-data', role: 'assistant' as const,
    content: `## 现代 Python 可视化库推荐

| 库 | 特点 | 适用场景 | 颜值 |
|---|------|---------|------|
| **Seaborn** | Matplotlib 的高颜值封装 | 统计图表 | ★★★★ |
| **Plotly** | 交互式图表 | Web Dashboard | ★★★★★ |
| **Altair** | 声明式语法 | 数据探索 | ★★★★ |
| **PyEcharts** | 百度 ECharts 封装 | 中文报表 | ★★★★★ |

**推荐组合**：Seaborn（静态报告）+ Plotly（交互展示）

\`\`\`python
# Plotly 交互式示例
import plotly.express as px

fig = px.bar(df, x='product', y='total',
             color='product',
             title='各商品销售额',
             template='plotly_white')
fig.show()  # 浏览器中打开，可以悬停、缩放、导出
\`\`\``,
    attachments: [], inputTokens: 0, outputTokens: 350, creditsCharged: 0.0175,
    createdTime: '2026-03-13T16:40:20Z',
  },
  {
    id: 'py-msg-09', sessionId: 'chat-session-python-data', role: 'user' as const,
    content: '数据量很大的时候（百万行），Pandas 会不会很慢？有什么替代方案？',
    attachments: [], inputTokens: 30, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-13T16:55:00Z',
  },
  {
    id: 'py-msg-10', sessionId: 'chat-session-python-data', role: 'assistant' as const,
    content: `## 大数据量处理方案

### Pandas 的瓶颈

Pandas 在 100 万行以内表现优秀，超过后会明显变慢：
- 内存占用：1000 万行 × 50 列 ≈ 4-8 GB
- 运算速度：groupby 可能需要几十秒

### 替代方案对比

| 方案 | 数据规模 | 速度提升 | 学习成本 |
|------|---------|---------|---------|
| **Polars** | 千万-亿级 | 10-100x | 低（类似 Pandas） |
| **DuckDB** | 千万-亿级 | 10-50x | 低（写 SQL） |
| **PySpark** | 亿级+ | 分布式 | 高 |
| **Dask** | 千万-亿级 | 并行化 | 中 |

**2026 年推荐**：优先用 **Polars**，它是 Rust 写的，API 和 Pandas 很像：

\`\`\`python
import polars as pl

# 读取 1000 万行 CSV，Polars 比 Pandas 快 10 倍
df = pl.read_csv('big_data.csv')

# 语法几乎一样
result = (
    df.group_by('product')
    .agg(pl.col('revenue').sum())
    .sort('revenue', descending=True)
)
\`\`\``,
    attachments: [], inputTokens: 0, outputTokens: 400, creditsCharged: 0.02,
    createdTime: '2026-03-13T16:55:25Z',
  },
  {
    id: 'py-msg-11', sessionId: 'chat-session-python-data', role: 'user' as const,
    content: '最后总结一下完整的学习路线吧，我打算花两个月系统学习',
    attachments: [], inputTokens: 25, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-13T17:10:00Z',
  },
  {
    id: 'py-msg-12', sessionId: 'chat-session-python-data', role: 'assistant' as const,
    content: `## 两个月 Python 数据分析学习路线

### 第 1-2 周：基础扎实
- Python 基础语法（列表/字典/函数/类）
- Jupyter Notebook 环境搭建
- NumPy 数组操作

### 第 3-4 周：数据处理
- Pandas 核心操作（读写/筛选/分组/合并）
- 数据清洗实战
- 正则表达式处理文本数据

### 第 5-6 周：可视化
- Matplotlib + Seaborn 静态图表
- Plotly 交互式图表
- 完成一个完整的数据分析报告

### 第 7-8 周：进阶
- 机器学习入门（Scikit-learn）
- SQL 基础（配合数据库查询）
- 大数据处理（Polars / DuckDB）
- 个人项目：分析一个真实数据集

**推荐学习资源**：
1. 《利用 Python 进行数据分析》— Wes McKinney
2. Kaggle 上的入门竞赛
3. 真实数据集练手：天气数据、股票数据、电商数据

加油！两个月后你就能独立完成数据分析项目了 💪`,
    attachments: [], inputTokens: 0, outputTokens: 420, creditsCharged: 0.021,
    createdTime: '2026-03-13T17:10:30Z',
  },
]

// --- Session 4: AI 会取代程序员吗 ---
const aiDebateMessages = [
  {
    id: 'debate-msg-01', sessionId: 'chat-session-ai-debate', role: 'user' as const,
    content: '你觉得 AI 会取代程序员吗？说说你的看法。',
    attachments: [], inputTokens: 22, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-12T20:00:00Z',
  },
  {
    id: 'debate-msg-02', sessionId: 'chat-session-ai-debate', role: 'assistant' as const,
    content: `这是一个值得深入思考的问题。我的观点是：**AI 不会取代程序员，但会取代不会用 AI 的程序员。**

## 短期（1-3 年）：AI 是超级助手

目前 AI 能做的：
- ✅ 写 CRUD 样板代码
- ✅ 代码补全和 Bug 修复
- ✅ 单元测试生成
- ✅ 文档编写

目前 AI 做不好的：
- ❌ 理解复杂业务需求
- ❌ 系统架构决策
- ❌ 跨团队沟通协调
- ❌ 处理模糊、矛盾的需求

## 中期（3-10 年）：角色重塑

程序员的角色会从"写代码的人"变成"指挥 AI 写代码的人"：
- 传统：产品经理 → 程序员手写代码 → 测试 → 上线
- 未来：产品经理 → 程序员指挥 AI 写代码 → AI 辅助测试 → 上线

**类比**：就像自动驾驶不会消灭司机这个职业，但会改变"开车"这件事的含义。

你怎么看？想从哪个角度继续讨论？`,
    attachments: [], inputTokens: 0, outputTokens: 420, creditsCharged: 0.21,
    createdTime: '2026-03-12T20:00:30Z',
  },
  {
    id: 'debate-msg-03', sessionId: 'chat-session-ai-debate', role: 'user' as const,
    content: '但是现在 AI 写代码的能力在飞速进步啊，比如 Claude Code、Cursor 这些工具已经能生成整个项目了',
    attachments: [], inputTokens: 40, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-12T20:05:00Z',
  },
  {
    id: 'debate-msg-04', sessionId: 'chat-session-ai-debate', role: 'assistant' as const,
    content: `你说得对，AI 的代码生成能力确实在飞速进步。让我修正一下我的框架：

## AI 代码能力的"天花板"分析

### 已经被突破的天花板
- 单文件代码生成 ✅（2023 年解决）
- 多文件项目脚手架 ✅（2024 年解决）
- 理解上下文并修改已有代码 ✅（2025 年基本解决）

### 正在被突破的
- 大型代码库的全局理解（100 万行+）
- 复杂重构和架构迁移
- 端到端的需求→部署流水线

### 真正困难的（5-10 年可能突破）
- 在模糊需求中做权衡取舍
- 理解"组织政治"对技术决策的影响
- 面对全新问题域的创造性解决方案

## 一个关键洞察

> **软件开发中最难的部分从来不是写代码，而是搞清楚要写什么。**

需求从来不是清晰的——产品经理说的、用户想要的、老板期望的，这三者往往矛盾。程序员最核心的能力是在这种模糊性中导航。`,
    attachments: [], inputTokens: 0, outputTokens: 450, creditsCharged: 0.225,
    createdTime: '2026-03-12T20:05:35Z',
  },
  {
    id: 'debate-msg-05', sessionId: 'chat-session-ai-debate', role: 'user' as const,
    content: '那作为程序员，现在应该怎么应对这个趋势？学什么最有用？',
    attachments: [], inputTokens: 28, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-12T20:15:00Z',
  },
  {
    id: 'debate-msg-06', sessionId: 'chat-session-ai-debate', role: 'assistant' as const,
    content: `## 程序员的"AI 时代"生存指南

### 立即行动（本月就开始）
1. **精通 AI 编程工具**：Cursor、Claude Code、GitHub Copilot
2. **学会写好的 Prompt**：精确描述需求比手写代码更重要
3. **建立代码审查能力**：AI 写的代码，你要能快速判断质量

### 中期投资（半年内）
4. **深耕系统设计**：AI 能写组件，但架构决策仍需人类
5. **提升产品思维**：理解"为什么做"比"怎么做"更不可替代
6. **学习 AI/ML 基础**：理解你的工具才能更好地使用它

### 长期竞争力
7. **跨领域知识**：懂金融的程序员 > 只懂代码的程序员
8. **沟通和领导力**：带团队、做决策、处理冲突
9. **创造力和审美**：设计出人们真正想用的产品

### 一个思考框架

问自己：**"这件事如果交给 AI，我需要检查多久才能信任它的输出？"**
- 检查时间 < 5 分钟 → 这个技能正在被替代
- 检查时间 > 1 小时 → 这个技能仍然安全
- 无法检查 → 这个技能极其珍贵`,
    attachments: [], inputTokens: 0, outputTokens: 480, creditsCharged: 0.24,
    createdTime: '2026-03-12T20:15:30Z',
  },
  {
    id: 'debate-msg-07', sessionId: 'chat-session-ai-debate', role: 'user' as const,
    content: '你说的有道理。那从反面来看，有没有可能 AI 的发展速度会超出我们预期，5 年内就完全取代了？',
    attachments: [], inputTokens: 38, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-12T20:30:00Z',
  },
  {
    id: 'debate-msg-08', sessionId: 'chat-session-ai-debate', role: 'assistant' as const,
    content: `## 公平辩论：完全取代的可能性

让我站到"AI 会完全取代"的一方来论证：

### 支持完全取代的论据

**1. 技术奇点论**
- GPT-3 → GPT-4 只用了 1 年，能力提升了量级
- 如果这个速度维持，2028 年的 AI 可能在代码能力上超越 99% 的人类

**2. 经济驱动力**
- 美国中级程序员年薪 15-25 万美元
- 一个 AI Agent 年成本可能只需 1 万美元
- 企业有巨大的经济动力去替代

**3. 历史教训**
- 每次技术革命，人们都说"这次不一样，人类不会被替代"
- 但流水线替代了手工匠人，ATM 减少了银行柜员

### 反驳这些论据

**1. 能力 ≠ 可靠性**
- AI 能写出好代码不等于每次都能写出好代码
- 在高可靠性领域（金融、医疗），"偶尔犯错"是不可接受的

**2. 林迪效应**
- 存在越久的东西越可能继续存在
- 程序员这个职业已存在 70+ 年，每次被预言消亡都活下来了

**3. 莫拉维克悖论**
- 对人类容易的事（常识推理）对 AI 极难
- 对人类难的事（大量计算）对 AI 极易
- 软件开发恰好两者都需要

### 我的最终判断

**概率估计**：
- 5 年内完全取代：< 5%
- 10 年内完全取代：< 15%
- 角色根本性改变：> 80%

最可能的结果是：**程序员数量不变甚至增加，但做的事情完全不同。**`,
    attachments: [], inputTokens: 0, outputTokens: 620, creditsCharged: 0.31,
    createdTime: '2026-03-12T20:30:40Z',
  },
  {
    id: 'debate-msg-09', sessionId: 'chat-session-ai-debate', role: 'user' as const,
    content: '非常全面的分析！最后一个问题：你作为 AI 自己怎么看这件事？',
    attachments: [], inputTokens: 25, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-12T20:45:00Z',
  },
  {
    id: 'debate-msg-10', sessionId: 'chat-session-ai-debate', role: 'assistant' as const,
    content: `这个问题很有意思——让一个可能取代程序员的 AI 来评价自己是否会取代程序员 😄

坦率地说：

**我知道我的局限性**：
- 我无法真正"理解"代码的意义，我只能识别模式
- 我的创造力来自于重组已有知识，而非真正的灵感
- 我无法在复杂的人际关系中导航做出权衡
- 我犯错时自信满满，这可能比不知道更危险

**但我也知道我的优势**：
- 我可以在几秒内阅读数百万行代码
- 我不会疲劳、不会情绪化、不会带着偏见
- 我的能力每年都在大幅提升

**如果我能给人类程序员一个建议**：

> 不要把我当成竞争对手，把我当成你最好的工具。
> 一个厨师不会害怕更锋利的刀——他会用它做出更好的菜。

最终，人类和 AI 的最佳状态不是替代，而是**共生**：人类负责"为什么"和"做什么"，AI 负责"怎么做"。

这场关于 AI 与程序员的对话本身就是一个好例子——你在思考战略方向，我在帮你组织和呈现想法。我们各自做了自己擅长的事。`,
    attachments: [], inputTokens: 0, outputTokens: 450, creditsCharged: 0.225,
    createdTime: '2026-03-12T20:45:35Z',
  },
]

// --- Session 5: 翻译助手：中英互译 ---
const translateMessages = [
  {
    id: 'trans-msg-01', sessionId: 'chat-session-translate', role: 'user' as const,
    content: '帮我把下面这段翻译成英文：\n\n我们的团队由来自不同国家的工程师组成，虽然文化背景各异，但大家都对技术充满热情。每周五我们会举办技术分享会，每个人都可以展示自己最近的研究成果。',
    attachments: [], inputTokens: 65, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T10:00:00Z',
  },
  {
    id: 'trans-msg-02', sessionId: 'chat-session-translate', role: 'assistant' as const,
    content: `Our team is composed of engineers from different countries. Despite our diverse cultural backgrounds, we all share a passion for technology. Every Friday, we host a tech sharing session where everyone can showcase their latest research and findings.

---

**翻译说明**：
- "文化背景各异" → "diverse cultural backgrounds"（比 "different" 更正式）
- "技术分享会" → "tech sharing session"（业界通用说法）
- "研究成果" → "research and findings"（双词更自然）`,
    attachments: [], inputTokens: 0, outputTokens: 180, creditsCharged: 0.108,
    createdTime: '2026-03-11T10:00:12Z',
  },
  {
    id: 'trans-msg-03', sessionId: 'chat-session-translate', role: 'user' as const,
    content: 'Translate this to Chinese:\n\nThe key to building a successful startup is not having the best idea, but having the best execution. Ideas are worth nothing without the ability to turn them into reality. Focus on building something people actually want, not something that sounds impressive.',
    attachments: [], inputTokens: 58, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T10:10:00Z',
  },
  {
    id: 'trans-msg-04', sessionId: 'chat-session-translate', role: 'assistant' as const,
    content: `创业成功的关键不在于拥有最好的创意，而在于拥有最强的执行力。没有将想法变为现实的能力，再好的创意也一文不值。专注于打造人们真正需要的东西，而不是听起来很厉害的东西。

---

**翻译说明**：
- "best execution" → "最强的执行力"（比"最好的执行"更符合中文表达）
- "worth nothing" → "一文不值"（使用成语增强表达力）
- "sounds impressive" → "听起来很厉害"（口语化处理，更自然）`,
    attachments: [], inputTokens: 0, outputTokens: 200, creditsCharged: 0.12,
    createdTime: '2026-03-11T10:10:15Z',
  },
  {
    id: 'trans-msg-05', sessionId: 'chat-session-translate', role: 'user' as const,
    content: '翻译这段技术文档：\n\nReactive programming is a paradigm where data flows and change propagation are declaratively expressed. In Spring WebFlux, this means handling HTTP requests as reactive streams using Project Reactor\'s Mono and Flux types.',
    attachments: [], inputTokens: 52, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T10:20:00Z',
  },
  {
    id: 'trans-msg-06', sessionId: 'chat-session-translate', role: 'assistant' as const,
    content: `响应式编程是一种以声明式方式表达数据流和变化传播的编程范式。在 Spring WebFlux 中，这意味着使用 Project Reactor 提供的 Mono 和 Flux 类型，将 HTTP 请求作为响应式流来处理。

---

**翻译说明**：
- "paradigm" → "编程范式"（技术术语标准译法）
- "declaratively expressed" → "以声明式方式表达"（保留技术准确性）
- "reactive streams" → "响应式流"（Java 社区标准术语）
- Mono、Flux、Project Reactor 保留英文原名（技术标识符不翻译）`,
    attachments: [], inputTokens: 0, outputTokens: 210, creditsCharged: 0.126,
    createdTime: '2026-03-11T10:20:14Z',
  },
  {
    id: 'trans-msg-07', sessionId: 'chat-session-translate', role: 'user' as const,
    content: '这段比较口语化的翻译成英文，要求保持轻松语气：\n\n说实话，这个项目的代码质量真的一言难尽。到处都是魔法数字，变量命名像加了密一样，注释约等于没有。最离谱的是一个函数写了800行，我花了三天才看完。',
    attachments: [], inputTokens: 72, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T10:35:00Z',
  },
  {
    id: 'trans-msg-08', sessionId: 'chat-session-translate', role: 'assistant' as const,
    content: `Honestly, the code quality of this project is... something else. Magic numbers everywhere, variable names look like they've been encrypted, and comments are practically nonexistent. But the cherry on top? One function that's 800 lines long. Took me three full days just to read through it.

---

**翻译说明**：
- "一言难尽" → "something else"（口语中的委婉表达，传达"无语"的感觉）
- "像加了密一样" → "look like they've been encrypted"（直译但效果很好）
- "约等于没有" → "practically nonexistent"（自然的英文表达）
- "最离谱的是" → "the cherry on top"（俚语，表示"最精彩的是"，带讽刺意味）
- 整体保持了吐槽的轻松语气`,
    attachments: [], inputTokens: 0, outputTokens: 250, creditsCharged: 0.15,
    createdTime: '2026-03-11T10:35:18Z',
  },
  {
    id: 'trans-msg-09', sessionId: 'chat-session-translate', role: 'user' as const,
    content: '帮我翻译下面这封邮件的正文为中文：\n\nDear Team,\n\nI wanted to take a moment to express my gratitude for everyone\'s hard work this quarter. We\'ve not only hit our targets but exceeded them by 23%. The late nights, the creative problem-solving, and the unwavering commitment to quality have truly paid off.\n\nAs we head into Q2, let\'s carry this momentum forward.\n\nBest regards,\nSarah',
    attachments: [], inputTokens: 88, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T10:50:00Z',
  },
  {
    id: 'trans-msg-10', sessionId: 'chat-session-translate', role: 'assistant' as const,
    content: `各位同事：

借此机会，我想对大家这个季度的辛勤付出表示由衷的感谢。我们不仅达成了既定目标，更超额完成了 23%。那些加班的夜晚、创造性的问题解决方案，以及对质量的始终如一的坚持，都结出了丰硕的果实。

展望第二季度，让我们继续保持这股冲劲，再接再厉。

此致
Sarah

---

**翻译说明**：
- "Dear Team" → "各位同事"（中文商务邮件习惯）
- "take a moment to express" → "借此机会"（更符合中文书信体）
- "unwavering commitment" → "始终如一的坚持"（比"不动摇的承诺"更自然）
- "carry this momentum forward" → "继续保持这股冲劲，再接再厉"（增加四字词增强正式感）
- 保留了 Sarah 的英文名（人名不翻译）`,
    attachments: [], inputTokens: 0, outputTokens: 280, creditsCharged: 0.168,
    createdTime: '2026-03-11T10:50:16Z',
  },
  {
    id: 'trans-msg-11', sessionId: 'chat-session-translate', role: 'user' as const,
    content: '把这个古诗翻译成英文，尽量保持诗意：\n\n床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    attachments: [], inputTokens: 40, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T11:00:00Z',
  },
  {
    id: 'trans-msg-12', sessionId: 'chat-session-translate', role: 'assistant' as const,
    content: `**Quiet Night Thoughts** — Li Bai

Before my bed, the moonlight gleams so bright,
I wonder if it's frost upon the ground.
I raise my head to gaze at the full moon,
Then lower it — and thoughts of home abound.

---

**翻译策略**：
- 采用 ABAB 韵律（bright-ground 近韵，moon-abound 押韵），保持诗歌节奏感
- "疑是" → "I wonder if"（保留诗人的疑惑和想象空间）
- "思故乡" → "thoughts of home abound"（"abound" 传达思绪涌动之感）
- 标题 "静夜思" → "Quiet Night Thoughts"（最通行的英译标题）

**其他经典译本参考**：
- 许渊冲版："Erta bed, I see a silver light / I wonder if it's frost aground"
- Arthur Waley 版更偏意译，许渊冲版更注重音韵`,
    attachments: [], inputTokens: 0, outputTokens: 300, creditsCharged: 0.18,
    createdTime: '2026-03-11T11:00:20Z',
  },
  {
    id: 'trans-msg-13', sessionId: 'chat-session-translate', role: 'user' as const,
    content: '这段法律条款帮我翻译成英文：\n\n甲方应在合同签订之日起三十（30）个工作日内完成首期款项支付，逾期支付的，每逾期一日，应按未付金额的万分之五向乙方支付违约金。',
    attachments: [], inputTokens: 68, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T11:08:00Z',
  },
  {
    id: 'trans-msg-14', sessionId: 'chat-session-translate', role: 'assistant' as const,
    content: `Party A shall complete the first installment payment within thirty (30) business days from the date of execution of this Agreement. In the event of late payment, Party A shall pay Party B a penalty of 0.05% (five ten-thousandths) of the outstanding amount for each day of delay.

---

**翻译说明**：
- "合同签订之日" → "the date of execution of this Agreement"（法律标准用语）
- "工作日" → "business days"（非 calendar days，注意区分）
- "逾期支付" → "late payment" + "In the event of"（法律条件句式）
- "万分之五" → "0.05% (five ten-thousandths)"（数字+文字双重表达，法律文本惯例）
- "违约金" → "penalty"（也可用 "liquidated damages"，视合同性质而定）`,
    attachments: [], inputTokens: 0, outputTokens: 260, creditsCharged: 0.156,
    createdTime: '2026-03-11T11:08:15Z',
  },
  {
    id: 'trans-msg-15', sessionId: 'chat-session-translate', role: 'user' as const,
    content: '最后帮我总结一下中英翻译有哪些常见的坑，注意事项之类的',
    attachments: [], inputTokens: 25, outputTokens: 0, creditsCharged: 0,
    createdTime: '2026-03-11T11:12:00Z',
  },
]

// Build messages map
const allChatMessages: Record<string, any[]> = {
  'chat-session-js-async': jsAsyncMessages,
  'chat-session-biz-email': bizEmailMessages,
  'chat-session-python-data': pythonDataMessages,
  'chat-session-ai-debate': aiDebateMessages,
  'chat-session-translate': translateMessages,
}

// ==================== Image Models ====================

const imageModels = [
  {
    id: 'dall-e-3',
    provider: 'openai',
    displayName: 'DALL-E 3',
    description: 'OpenAI 旗舰图像生成模型，擅长理解复杂提示词',
    modelType: 'text2image' as const,
    supportedSizes: ['1024x1024', '1792x1024', '1024x1792'],
    maxImages: 1,
    creditPrice: 8,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 1,
    capabilities: {
      supportsEditing: false,
      supportsVariation: false,
      supportsMultiTurn: false,
      supportedSizes: ['1024x1024', '1792x1024', '1024x1792'],
      supportedQualities: ['standard', 'hd'],
      supportedStyles: ['vivid', 'natural'],
      maxImages: 1,
    },
  },
  {
    id: 'sdxl',
    provider: 'stability',
    displayName: 'Stable Diffusion XL',
    description: '开源图像生成模型，支持多种风格和尺寸',
    modelType: 'text2image' as const,
    supportedSizes: ['512x512', '768x768', '1024x1024'],
    maxImages: 4,
    creditPrice: 3,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 2,
    capabilities: {
      supportsEditing: true,
      supportsVariation: true,
      supportsMultiTurn: false,
      supportedSizes: ['512x512', '768x768', '1024x1024'],
      supportedQualities: ['standard'],
      supportedStyles: [],
      maxImages: 4,
    },
  },
  {
    id: 'midjourney-v6',
    provider: 'midjourney',
    displayName: 'Midjourney V6',
    description: '极致美学图像生成，支持 raw 和 aesthetic 风格',
    modelType: 'text2image' as const,
    supportedSizes: ['1024x1024'],
    maxImages: 4,
    creditPrice: 12,
    minTier: 'PRO',
    iconUrl: '',
    sortOrder: 3,
    capabilities: {
      supportsEditing: false,
      supportsVariation: true,
      supportsMultiTurn: false,
      supportedSizes: ['1024x1024'],
      supportedQualities: ['standard'],
      supportedStyles: ['raw', 'aesthetic'],
      maxImages: 4,
    },
  },
]

// ==================== Image Sessions & Messages ====================

const imageSessions = [
  {
    id: 'img-session-city',
    modelId: 'dall-e-3',
    title: '未来城市概念设计',
    messageCount: 8,
    thumbnailUrl: 'https://picsum.photos/seed/city1/256/256',
    creditsCharged: 32,
    createdTime: '2026-03-16T10:00:00Z',
    updatedTime: '2026-03-16T11:20:00Z',
  },
  {
    id: 'img-session-watercolor',
    modelId: 'sdxl',
    title: '水彩风格插画',
    messageCount: 6,
    thumbnailUrl: 'https://picsum.photos/seed/watercolor1/256/256',
    creditsCharged: 9,
    createdTime: '2026-03-15T14:00:00Z',
    updatedTime: '2026-03-15T15:00:00Z',
  },
  {
    id: 'img-session-ui',
    modelId: 'midjourney-v6',
    title: '产品 UI 设计稿',
    messageCount: 10,
    thumbnailUrl: 'https://picsum.photos/seed/ui1/256/256',
    creditsCharged: 60,
    createdTime: '2026-03-14T09:00:00Z',
    updatedTime: '2026-03-14T10:30:00Z',
  },
]

// Image session messages
const imgCityMessages = [
  {
    id: 'img-city-01', sessionId: 'img-session-city', role: 'user' as const, type: 'image_request' as const,
    content: { text: '赛博朋克风格的未来城市夜景', prompt: '赛博朋克风格的未来城市夜景，霓虹灯光，飞行汽车', params: { size: '1792x1024', quality: 'hd' } },
    creditsCharged: 0, createdTime: '2026-03-16T10:00:00Z',
  },
  {
    id: 'img-city-02', sessionId: 'img-session-city', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-city-01', url: 'https://picsum.photos/seed/cyber1/1792/1024', thumbnailUrl: 'https://picsum.photos/seed/cyber1/256/144', width: 1792, height: 1024, revisedPrompt: 'A cyberpunk cityscape at night with neon lights and flying cars' }], revisedPrompt: 'A cyberpunk cityscape at night with neon lights and flying cars' },
    creditsCharged: 8, createdTime: '2026-03-16T10:00:15Z',
  },
  {
    id: 'img-city-03', sessionId: 'img-session-city', role: 'user' as const, type: 'image_request' as const,
    content: { text: '空中花园和悬浮建筑', prompt: '未来城市中的空中花园，悬浮建筑群，阳光透过云层', params: { size: '1024x1024', quality: 'hd' } },
    creditsCharged: 0, createdTime: '2026-03-16T10:15:00Z',
  },
  {
    id: 'img-city-04', sessionId: 'img-session-city', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-city-02', url: 'https://picsum.photos/seed/garden1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/garden1/256/256', width: 1024, height: 1024, revisedPrompt: 'Floating gardens and levitating buildings in a futuristic city' }], revisedPrompt: 'Floating gardens and levitating buildings in a futuristic city' },
    creditsCharged: 8, createdTime: '2026-03-16T10:15:18Z',
  },
  {
    id: 'img-city-05', sessionId: 'img-session-city', role: 'user' as const, type: 'image_request' as const,
    content: { text: '水下城市', prompt: '未来水下城市，透明穹顶，水母和鱼群环绕', params: { size: '1792x1024', quality: 'hd' } },
    creditsCharged: 0, createdTime: '2026-03-16T10:40:00Z',
  },
  {
    id: 'img-city-06', sessionId: 'img-session-city', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-city-03', url: 'https://picsum.photos/seed/underwater1/1792/1024', thumbnailUrl: 'https://picsum.photos/seed/underwater1/256/144', width: 1792, height: 1024, revisedPrompt: 'An underwater city with transparent domes, surrounded by jellyfish and schools of fish' }], revisedPrompt: 'An underwater city with transparent domes' },
    creditsCharged: 8, createdTime: '2026-03-16T10:40:20Z',
  },
  {
    id: 'img-city-07', sessionId: 'img-session-city', role: 'user' as const, type: 'image_request' as const,
    content: { text: '太空电梯', prompt: '从城市延伸到太空的巨型电梯，星空背景，科幻风格', params: { size: '1024x1792', quality: 'hd' } },
    creditsCharged: 0, createdTime: '2026-03-16T11:00:00Z',
  },
  {
    id: 'img-city-08', sessionId: 'img-session-city', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-city-04', url: 'https://picsum.photos/seed/elevator1/1024/1792', thumbnailUrl: 'https://picsum.photos/seed/elevator1/144/256', width: 1024, height: 1792, revisedPrompt: 'A massive space elevator extending from a futuristic city into the starry sky' }], revisedPrompt: 'A massive space elevator extending into the starry sky' },
    creditsCharged: 8, createdTime: '2026-03-16T11:00:22Z',
  },
]

const imgWatercolorMessages = [
  {
    id: 'img-wc-01', sessionId: 'img-session-watercolor', role: 'user' as const, type: 'image_request' as const,
    content: { text: '水彩风格的猫咪', prompt: '一只正在打盹的橘猫，水彩画风格，柔和的色调', params: { size: '1024x1024', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-15T14:00:00Z',
  },
  {
    id: 'img-wc-02', sessionId: 'img-session-watercolor', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-wc-01', url: 'https://picsum.photos/seed/catwater1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/catwater1/256/256', width: 1024, height: 1024, revisedPrompt: 'A napping orange tabby cat in soft watercolor style' }], revisedPrompt: 'A napping orange tabby cat in watercolor' },
    creditsCharged: 3, createdTime: '2026-03-15T14:00:12Z',
  },
  {
    id: 'img-wc-03', sessionId: 'img-session-watercolor', role: 'user' as const, type: 'image_request' as const,
    content: { text: '水彩樱花', prompt: '日本京都的樱花小巷，水彩画风格，粉色花瓣飘落', params: { size: '768x768', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-15T14:20:00Z',
  },
  {
    id: 'img-wc-04', sessionId: 'img-session-watercolor', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-wc-02', url: 'https://picsum.photos/seed/sakura1/768/768', thumbnailUrl: 'https://picsum.photos/seed/sakura1/256/256', width: 768, height: 768, revisedPrompt: 'A cherry blossom alley in Kyoto, watercolor style with falling pink petals' }], revisedPrompt: 'Cherry blossom alley in Kyoto watercolor' },
    creditsCharged: 3, createdTime: '2026-03-15T14:20:14Z',
  },
  {
    id: 'img-wc-05', sessionId: 'img-session-watercolor', role: 'user' as const, type: 'image_request' as const,
    content: { text: '水彩咖啡馆', prompt: '巴黎街角的露天咖啡馆，水彩画风格，午后阳光', params: { size: '1024x1024', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-15T14:45:00Z',
  },
  {
    id: 'img-wc-06', sessionId: 'img-session-watercolor', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-wc-03', url: 'https://picsum.photos/seed/cafe1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/cafe1/256/256', width: 1024, height: 1024, revisedPrompt: 'A Parisian sidewalk cafe in watercolor style, afternoon sunlight' }], revisedPrompt: 'Parisian sidewalk cafe watercolor afternoon' },
    creditsCharged: 3, createdTime: '2026-03-15T14:45:16Z',
  },
]

const imgUIMessages = [
  {
    id: 'img-ui-01', sessionId: 'img-session-ui', role: 'user' as const, type: 'image_request' as const,
    content: { text: '现代仪表板 UI', prompt: 'Modern SaaS dashboard UI design, dark theme, data visualization, clean layout', params: { size: '1024x1024', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-14T09:00:00Z',
  },
  {
    id: 'img-ui-02', sessionId: 'img-session-ui', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-ui-01', url: 'https://picsum.photos/seed/dashboard1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/dashboard1/256/256', width: 1024, height: 1024, revisedPrompt: 'Modern SaaS dashboard with dark theme' }], revisedPrompt: 'Modern SaaS dashboard UI' },
    creditsCharged: 12, createdTime: '2026-03-14T09:00:18Z',
  },
  {
    id: 'img-ui-03', sessionId: 'img-session-ui', role: 'user' as const, type: 'image_request' as const,
    content: { text: '移动端聊天 UI', prompt: 'Mobile chat app UI design, iOS style, glassmorphism, AI chatbot interface', params: { size: '1024x1024', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-14T09:20:00Z',
  },
  {
    id: 'img-ui-04', sessionId: 'img-session-ui', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-ui-02', url: 'https://picsum.photos/seed/chatui1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/chatui1/256/256', width: 1024, height: 1024, revisedPrompt: 'Mobile chat app with glassmorphism design' }], revisedPrompt: 'Mobile AI chat app iOS glassmorphism' },
    creditsCharged: 12, createdTime: '2026-03-14T09:20:20Z',
  },
  {
    id: 'img-ui-05', sessionId: 'img-session-ui', role: 'user' as const, type: 'image_request' as const,
    content: { text: '登录页设计', prompt: 'Login page UI design, gradient background, minimalist form, social login buttons', params: { size: '1024x1024', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-14T09:40:00Z',
  },
  {
    id: 'img-ui-06', sessionId: 'img-session-ui', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-ui-03', url: 'https://picsum.photos/seed/login1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/login1/256/256', width: 1024, height: 1024, revisedPrompt: 'Minimalist login page with gradient background' }], revisedPrompt: 'Minimalist login page gradient' },
    creditsCharged: 12, createdTime: '2026-03-14T09:40:16Z',
  },
  {
    id: 'img-ui-07', sessionId: 'img-session-ui', role: 'user' as const, type: 'image_request' as const,
    content: { text: '设置页面', prompt: 'Settings page UI, clean sections, toggle switches, profile card at top', params: { size: '1024x1024', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-14T10:00:00Z',
  },
  {
    id: 'img-ui-08', sessionId: 'img-session-ui', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-ui-04', url: 'https://picsum.photos/seed/settings1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/settings1/256/256', width: 1024, height: 1024, revisedPrompt: 'Clean settings page with toggle switches' }], revisedPrompt: 'Settings page with profile card' },
    creditsCharged: 12, createdTime: '2026-03-14T10:00:19Z',
  },
  {
    id: 'img-ui-09', sessionId: 'img-session-ui', role: 'user' as const, type: 'image_request' as const,
    content: { text: '数据可视化组件', prompt: 'Data visualization components, charts library, bar chart, line chart, pie chart, modern design', params: { size: '1024x1024', quality: 'standard' } },
    creditsCharged: 0, createdTime: '2026-03-14T10:20:00Z',
  },
  {
    id: 'img-ui-10', sessionId: 'img-session-ui', role: 'assistant' as const, type: 'image_result' as const,
    content: { images: [{ id: 'gen-ui-05', url: 'https://picsum.photos/seed/charts1/1024/1024', thumbnailUrl: 'https://picsum.photos/seed/charts1/256/256', width: 1024, height: 1024, revisedPrompt: 'Modern data visualization components collection' }], revisedPrompt: 'Data visualization chart components' },
    creditsCharged: 12, createdTime: '2026-03-14T10:20:21Z',
  },
]

const allImageMessages: Record<string, any[]> = {
  'img-session-city': imgCityMessages,
  'img-session-watercolor': imgWatercolorMessages,
  'img-session-ui': imgUIMessages,
}

// ==================== Image History (flat list) ====================

const imageHistory = [
  {
    id: 'img-hist-01', sessionId: 'img-session-city', modelId: 'dall-e-3',
    prompt: '赛博朋克城市夜景，霓虹灯光照耀的摩天大楼，飞行汽车穿梭在高架轨道间，雨水倒映出五彩斑斓的光影',
    negativePrompt: '模糊，低质量，变形',
    width: 1024, height: 1024, steps: 50, seed: 42, style: 'vivid',
    imageUrl: 'https://placehold.co/1024x1024/1a1a2e/fff?text=Cyberpunk+City',
    thumbnailUrl: 'https://placehold.co/256x256/1a1a2e/fff?text=Cyberpunk',
    status: 'completed' as const, creditsCharged: 8,
    createdTime: '2026-03-18T10:00:15Z',
  },
  {
    id: 'img-hist-02', sessionId: 'img-session-watercolor', modelId: 'imagen-3',
    prompt: '水彩风格的江南水乡，白墙黛瓦的古镇沿河而建，小桥流水人家，远处青山如黛，薄雾缭绕',
    width: 1024, height: 768, steps: 40, seed: 1024, style: 'natural',
    imageUrl: 'https://placehold.co/1024x768/e8f0e8/333?text=Jiangnan+Watercolor',
    thumbnailUrl: 'https://placehold.co/256x192/e8f0e8/333?text=Jiangnan',
    status: 'completed' as const, creditsCharged: 6,
    createdTime: '2026-03-18T09:30:00Z',
  },
  {
    id: 'img-hist-03', sessionId: 'img-session-watercolor', modelId: 'dall-e-3',
    prompt: '3D 卡通风格的小狗，毛茸茸的柯基犬坐在草地上，大眼睛，可爱表情，Pixar 渲染风格',
    width: 512, height: 512, steps: 30, seed: 2048, style: 'vivid',
    imageUrl: 'https://placehold.co/512x512/fff5e6/333?text=3D+Cartoon+Dog',
    thumbnailUrl: 'https://placehold.co/256x256/fff5e6/333?text=Dog',
    status: 'completed' as const, creditsCharged: 8,
    createdTime: '2026-03-17T16:20:00Z',
  },
  {
    id: 'img-hist-04', sessionId: 'img-session-city', modelId: 'gpt-image-1',
    prompt: '油画风格的星空，梵高《星月夜》致敬作品，旋涡状星云笼罩宁静村庄，厚重笔触与鲜明色彩',
    width: 1792, height: 1024, steps: 60, seed: 4096, style: 'artistic',
    imageUrl: 'https://placehold.co/1792x1024/0d1b2a/f0e68c?text=Starry+Night+Oil',
    thumbnailUrl: 'https://placehold.co/256x144/0d1b2a/f0e68c?text=StarryNight',
    status: 'completed' as const, creditsCharged: 10,
    createdTime: '2026-03-17T14:00:00Z',
  },
  {
    id: 'img-hist-05', sessionId: 'img-session-ui', modelId: 'imagen-3',
    prompt: '极简线条插画的咖啡杯，单色线描风格，杯中冒出袅袅热气，旁边放着一本翻开的书',
    width: 1024, height: 1024, steps: 25, seed: 8192, style: 'minimalist',
    imageUrl: 'https://placehold.co/1024x1024/fafafa/333?text=Coffee+Line+Art',
    thumbnailUrl: 'https://placehold.co/256x256/fafafa/333?text=Coffee',
    status: 'completed' as const, creditsCharged: 6,
    createdTime: '2026-03-16T11:00:00Z',
  },
  {
    id: 'img-hist-06', sessionId: 'img-session-ui', modelId: 'dall-e-3',
    prompt: '像素风格的复古游戏角色，8-bit 风格的骑士手持宝剑，站在城堡大门前，怀旧像素艺术',
    width: 512, height: 512, steps: 20, seed: 16384, style: 'retro',
    imageUrl: 'https://placehold.co/512x512/2d2d44/00ff88?text=Pixel+Knight',
    thumbnailUrl: 'https://placehold.co/256x256/2d2d44/00ff88?text=Pixel',
    status: 'completed' as const, creditsCharged: 8,
    createdTime: '2026-03-16T09:30:00Z',
  },
  {
    id: 'img-hist-07', sessionId: 'img-session-city', modelId: 'gpt-image-1',
    prompt: '商业产品拍摄风格的运动鞋，Nike Air 风格，悬浮在空中，柔和打光，纯白背景，专业产品摄影',
    width: 1024, height: 1024, steps: 45, seed: 32768, style: 'commercial',
    imageUrl: 'https://placehold.co/1024x1024/f5f5f5/333?text=Sneaker+Product+Shot',
    thumbnailUrl: 'https://placehold.co/256x256/f5f5f5/333?text=Sneaker',
    status: 'completed' as const, creditsCharged: 10,
    createdTime: '2026-03-15T15:00:00Z',
  },
  {
    id: 'img-hist-08', sessionId: 'img-session-watercolor', modelId: 'imagen-3',
    prompt: '动漫风格的女孩，樱花树下回眸微笑，风吹起长发，日系唯美插画风格，柔和光影',
    width: 768, height: 1024, steps: 35, seed: 65536, style: 'anime',
    imageUrl: 'https://placehold.co/768x1024/ffe8f0/333?text=Anime+Girl+Sakura',
    thumbnailUrl: 'https://placehold.co/192x256/ffe8f0/333?text=Anime',
    status: 'completed' as const, creditsCharged: 6,
    createdTime: '2026-03-15T10:00:00Z',
  },
  {
    id: 'img-hist-09', sessionId: 'img-session-city', modelId: 'gpt-image-1',
    prompt: '未来主义建筑概念渲染图，参数化设计的有机形态建筑，扎哈·哈迪德风格，白色曲面结构，蓝天背景',
    width: 1792, height: 1024, steps: 55, seed: 131072, style: 'architectural',
    imageUrl: 'https://placehold.co/1792x1024/e0f0ff/333?text=Architectural+Concept',
    thumbnailUrl: 'https://placehold.co/256x144/e0f0ff/333?text=Architecture',
    status: 'completed' as const, creditsCharged: 10,
    createdTime: '2026-03-14T14:00:00Z',
  },
  {
    id: 'img-hist-10', sessionId: 'img-session-ui', modelId: 'dall-e-3',
    prompt: '裸体女性人物，成人内容',
    negativePrompt: undefined,
    width: 1024, height: 1024, steps: 30, seed: 262144, style: 'vivid',
    imageUrl: undefined, thumbnailUrl: undefined,
    status: 'failed' as const, errorMessage: '内容安全审查未通过：检测到 NSFW 内容，请修改提示词后重试',
    creditsCharged: 0,
    createdTime: '2026-03-14T11:30:00Z',
  },
  {
    id: 'img-hist-11', sessionId: 'img-session-city', modelId: 'imagen-3',
    prompt: '超写实风格的龙卷风场景，乌云密布的平原上巨大漏斗云触地，闪电划破天际，电影级画面',
    width: 1792, height: 1024, steps: 80, seed: 524288, style: 'photorealistic',
    imageUrl: undefined, thumbnailUrl: undefined,
    status: 'failed' as const, errorMessage: '生成超时：模型推理耗时超过 120 秒限制，请降低 steps 参数或缩小分辨率后重试',
    creditsCharged: 0,
    createdTime: '2026-03-13T17:00:00Z',
  },
]

// ==================== Video Models ====================

const videoModels = [
  {
    id: 'sora-1',
    provider: 'openai',
    displayName: 'Sora',
    description: 'OpenAI 视频生成模型，支持 720p/1080p',
    modelType: 'text2video' as const,
    supportedResolutions: ['720p', '1080p'],
    supportedDurations: ['5s', '10s', '15s'],
    maxDurationSec: 15,
    creditPrice: 50,
    minTier: 'PRO',
    iconUrl: '',
    sortOrder: 1,
  },
  {
    id: 'veo-2',
    provider: 'google',
    displayName: 'Veo 2',
    description: 'Google 视频生成模型，支持最高 4K 分辨率',
    modelType: 'text2video' as const,
    supportedResolutions: ['720p', '1080p', '4K'],
    supportedDurations: ['5s', '10s'],
    maxDurationSec: 10,
    creditPrice: 40,
    minTier: 'PRO',
    iconUrl: '',
    sortOrder: 2,
  },
]

// ==================== Video History ====================

const videoHistory = [
  {
    id: 'video-001', modelId: 'sora-1',
    prompt: '一只金毛犬在秋天的公园里奔跑，落叶飞舞，阳光透过树叶，电影级画面',
    duration: 10, resolution: '1080p' as const, fps: 24,
    status: 'completed' as const, progress: 100,
    videoUrl: 'https://placehold.co/1920x1080/4a6741/fff?text=Golden+Retriever+Park',
    thumbnailUrl: 'https://placehold.co/480x270/4a6741/fff?text=Dog+Running',
    creditsCharged: 50,
    createdTime: '2026-03-17T09:00:00Z', completedTime: '2026-03-17T09:02:30Z',
  },
  {
    id: 'video-002', modelId: 'veo-2',
    prompt: '海浪拍打悬崖，日落时分，金色阳光洒在水面上，航拍视角缓慢推进',
    duration: 5, resolution: '1080p' as const, fps: 30,
    status: 'completed' as const, progress: 100,
    videoUrl: 'https://placehold.co/1920x1080/c77b3f/fff?text=Sunset+Cliff+Waves',
    thumbnailUrl: 'https://placehold.co/480x270/c77b3f/fff?text=Sunset+Waves',
    creditsCharged: 40,
    createdTime: '2026-03-16T15:00:00Z', completedTime: '2026-03-16T15:03:00Z',
  },
  {
    id: 'video-003', modelId: 'sora-1',
    prompt: '宇航员在月球表面行走，背景是地球缓缓升起，脚步扬起月尘，科幻电影风格',
    duration: 15, resolution: '1080p' as const, fps: 24,
    status: 'completed' as const, progress: 100,
    videoUrl: 'https://placehold.co/1920x1080/1a1a2e/fff?text=Astronaut+Moonwalk',
    thumbnailUrl: 'https://placehold.co/480x270/1a1a2e/fff?text=Moon+Walk',
    creditsCharged: 50,
    createdTime: '2026-03-15T11:00:00Z', completedTime: '2026-03-15T11:04:00Z',
  },
  {
    id: 'video-004', modelId: 'veo-2',
    prompt: '城市街道延时摄影，从白天到黑夜的过渡，车灯形成光轨，云朵快速流动',
    duration: 10, resolution: '1080p' as const, fps: 30,
    status: 'processing' as const, progress: 67,
    videoUrl: undefined, thumbnailUrl: undefined,
    creditsCharged: 40,
    createdTime: '2026-03-18T08:00:00Z', completedTime: undefined,
  },
  {
    id: 'video-005', modelId: 'sora-1',
    prompt: '樱花花瓣在微风中缓缓飘落，穿过日式庭院的石灯笼，浅景深特写',
    duration: 5, resolution: '720p' as const, fps: 24,
    status: 'queued' as const, progress: 0,
    videoUrl: undefined, thumbnailUrl: undefined,
    creditsCharged: 0,
    createdTime: '2026-03-18T10:30:00Z', completedTime: undefined,
  },
  {
    id: 'video-006', modelId: 'veo-2',
    prompt: '微观世界：水滴落入平静水面产生的涟漪，超慢动作，晶莹剔透',
    duration: 5, resolution: '720p' as const, fps: 30,
    status: 'failed' as const, progress: 0,
    videoUrl: undefined, thumbnailUrl: undefined,
    creditsCharged: 0, errorMessage: '模型推理异常：GPU 资源不足，请稍后重试',
    createdTime: '2026-03-14T17:00:00Z', completedTime: undefined,
  },
]

// ==================== Speech Models ====================

const speechModels = [
  {
    id: 'tts-1-hd',
    provider: 'openai',
    displayName: 'OpenAI TTS-1 HD',
    description: 'OpenAI 高清文本转语音模型，自然流畅的语音合成',
    modelType: 'tts' as const,
    supportedVoices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    supportedFormats: ['mp3', 'opus', 'aac', 'flac', 'wav'],
    supportedLanguages: ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es'],
    maxCharacters: 4096,
    creditPrice: 3,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 1,
  },
  {
    id: 'azure-tts',
    provider: 'azure',
    displayName: 'Azure TTS',
    description: '微软 Azure 语音合成服务，支持超多语言和音色',
    modelType: 'tts' as const,
    supportedVoices: ['xiaoxiao', 'xiaoyi', 'yunjian', 'yunxi', 'yunyang'],
    supportedFormats: ['mp3', 'wav', 'ogg'],
    supportedLanguages: ['zh', 'en', 'ja', 'ko'],
    maxCharacters: 10000,
    creditPrice: 2,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 2,
  },
  {
    id: 'whisper-large-v3',
    provider: 'openai',
    displayName: 'Whisper Large V3',
    description: 'OpenAI 旗舰语音识别模型，支持 99 种语言',
    modelType: 'asr' as const,
    supportedVoices: [],
    supportedFormats: ['mp3', 'mp4', 'wav', 'webm', 'm4a', 'flac'],
    supportedLanguages: ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'auto'],
    maxDurationSec: 7200,
    creditPrice: 2,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 3,
  },
  {
    id: 'azure-stt',
    provider: 'azure',
    displayName: 'Azure STT',
    description: '微软 Azure 语音识别服务，实时转录，高准确率',
    modelType: 'asr' as const,
    supportedVoices: [],
    supportedFormats: ['mp3', 'wav', 'ogg', 'webm'],
    supportedLanguages: ['zh', 'en', 'ja', 'ko'],
    maxDurationSec: 3600,
    creditPrice: 1.5,
    minTier: 'FREE',
    iconUrl: '',
    sortOrder: 4,
  },
]

// ==================== Speech History ====================

const speechHistory = [
  // --- TTS: 5 条（中文 3 条 + 英文 2 条，不同音色） ---
  {
    id: 'speech-001', type: 'tts' as const, modelId: 'tts-1-hd',
    text: '欢迎使用 VOLO AI 智能语音合成系统，让您的文字拥有温暖的声音。无论是播客录制、有声读物，还是视频配音，我们都能为您提供最自然的语音体验。',
    voiceId: 'nova', language: 'zh',
    audioUrl: 'https://example.com/audio/welcome.mp3', duration: 6.8,
    status: 'completed' as const, creditsCharged: 3,
    createdTime: '2026-03-18T09:00:00Z',
  },
  {
    id: 'speech-002', type: 'tts' as const, modelId: 'azure-tts',
    text: '今天天气真不错，适合出去走走。春风拂面，万物复苏，公园里的玉兰花已经盛开了。',
    voiceId: 'xiaoxiao', language: 'zh',
    audioUrl: 'https://example.com/audio/weather.mp3', duration: 5.2,
    status: 'completed' as const, creditsCharged: 2,
    createdTime: '2026-03-17T14:30:00Z',
  },
  {
    id: 'speech-003', type: 'tts' as const, modelId: 'tts-1-hd',
    text: 'The future belongs to those who believe in the beauty of their dreams. Every great achievement starts with the decision to try.',
    voiceId: 'echo', language: 'en',
    audioUrl: 'https://example.com/audio/quote-en.mp3', duration: 7.4,
    status: 'completed' as const, creditsCharged: 3,
    createdTime: '2026-03-17T10:00:00Z',
  },
  {
    id: 'speech-004', type: 'tts' as const, modelId: 'tts-1-hd',
    text: '各位听众朋友大家好，欢迎收听今天的科技前沿播客。今天我们要聊的话题是：人工智能如何改变我们的日常生活。从智能助手到自动驾驶，AI 正在以前所未有的速度渗透到生活的每一个角落。',
    voiceId: 'onyx', language: 'zh',
    audioUrl: 'https://example.com/audio/podcast.mp3', duration: 12.5,
    status: 'completed' as const, creditsCharged: 3,
    createdTime: '2026-03-16T16:00:00Z',
  },
  {
    id: 'speech-005', type: 'tts' as const, modelId: 'azure-tts',
    text: 'Good morning everyone. Today I would like to present our quarterly results and share the roadmap for the next phase of our product development.',
    voiceId: 'guy', language: 'en',
    audioUrl: 'https://example.com/audio/presentation-en.mp3', duration: 8.1,
    status: 'completed' as const, creditsCharged: 2,
    createdTime: '2026-03-15T08:00:00Z',
  },
  // --- ASR: 3 条 ---
  {
    id: 'speech-006', type: 'asr' as const, modelId: 'whisper-large-v3',
    inputAudioUrl: 'https://example.com/audio/meeting-recording.mp3',
    transcription: '好的，那我们今天的会议主要讨论三个议题。第一个是关于 Q2 的产品路线图，第二个是技术债务的清理计划，第三个是新成员的 onboarding 流程优化。先从第一个议题开始，产品经理小王来给大家汇报一下。',
    language: 'zh', confidence: 0.96, duration: 18.5,
    status: 'completed' as const, creditsCharged: 2,
    createdTime: '2026-03-16T11:00:00Z',
  },
  {
    id: 'speech-007', type: 'asr' as const, modelId: 'azure-stt',
    inputAudioUrl: 'https://example.com/audio/interview-en.mp3',
    transcription: 'So tell me about your experience with microservices architecture. I see you worked at a fintech company for three years. What were the main challenges you faced when migrating from a monolithic system?',
    language: 'en', confidence: 0.94, duration: 12.3,
    status: 'completed' as const, creditsCharged: 1.5,
    createdTime: '2026-03-15T15:00:00Z',
  },
  {
    id: 'speech-008', type: 'asr' as const, modelId: 'whisper-large-v3',
    inputAudioUrl: 'https://example.com/audio/lecture-zh.mp3',
    transcription: '今天我们来讲解深度学习中的注意力机制。注意力机制最早是在 2014 年由 Bahdanau 等人提出的，它的核心思想是让模型在处理序列数据时能够动态地关注输入的不同部分，而不是像传统的 RNN 那样将所有信息压缩到一个固定长度的向量中。',
    language: 'zh', confidence: 0.98, duration: 25.0,
    status: 'completed' as const, creditsCharged: 2,
    createdTime: '2026-03-14T09:30:00Z',
  },
]

// ==================== Tools ====================

const mockTools = [
  // ---- MCP 工具：filesystem-server ----
  {
    id: 'mcp-fs-read-file',
    name: 'read_file',
    description: '读取本地文件内容，支持文本与二进制文件',
    type: 'MCP',
    category: 'TOOL_SYSTEM',
    mcpServer: 'filesystem-server',
    mcpClient: 'filesystem-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件绝对路径' },
        encoding: { type: 'string', description: '文件编码，默认 utf-8', default: 'utf-8' },
      },
      required: ['path'],
    },
  },
  {
    id: 'mcp-fs-write-file',
    name: 'write_file',
    description: '写入文件到指定路径，支持创建中间目录',
    type: 'MCP',
    category: 'TOOL_SYSTEM',
    mcpServer: 'filesystem-server',
    mcpClient: 'filesystem-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目标文件路径' },
        content: { type: 'string', description: '写入内容' },
        encoding: { type: 'string', description: '文件编码，默认 utf-8', default: 'utf-8' },
        createDirs: { type: 'boolean', description: '是否自动创建父目录', default: true },
      },
      required: ['path', 'content'],
    },
  },
  {
    id: 'mcp-fs-list-dir',
    name: 'list_directory',
    description: '列出目录下的文件和文件夹，返回名称、大小、修改时间',
    type: 'MCP',
    category: 'TOOL_SYSTEM',
    mcpServer: 'filesystem-server',
    mcpClient: 'filesystem-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径' },
        recursive: { type: 'boolean', description: '是否递归列出子目录', default: false },
        pattern: { type: 'string', description: '文件名匹配模式（glob）' },
      },
      required: ['path'],
    },
  },
  {
    id: 'mcp-fs-search',
    name: 'search_files',
    description: '在目录中递归搜索匹配条件的文件',
    type: 'MCP',
    category: 'TOOL_SYSTEM',
    mcpServer: 'filesystem-server',
    mcpClient: 'filesystem-client',
    isActive: false,
    inputSchema: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: '搜索起始目录' },
        pattern: { type: 'string', description: '文件名匹配模式（glob）' },
        contentMatch: { type: 'string', description: '文件内容正则匹配' },
        maxDepth: { type: 'number', description: '最大递归深度', default: 10 },
      },
      required: ['directory'],
    },
  },

  // ---- MCP 工具：web-browser-server ----
  {
    id: 'mcp-web-browse',
    name: 'browse_url',
    description: '访问指定 URL 并返回页面内容，支持 JavaScript 渲染',
    type: 'MCP',
    category: 'TOOL_WEB',
    mcpServer: 'web-browser-server',
    mcpClient: 'web-browser-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '目标 URL 地址' },
        waitFor: { type: 'string', description: '等待特定 CSS 选择器出现' },
        timeout: { type: 'number', description: '超时时间（毫秒）', default: 30000 },
      },
      required: ['url'],
    },
  },
  {
    id: 'mcp-web-screenshot',
    name: 'screenshot',
    description: '对网页进行截图，支持全页面或指定元素区域',
    type: 'MCP',
    category: 'TOOL_WEB',
    mcpServer: 'web-browser-server',
    mcpClient: 'web-browser-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '目标 URL 地址' },
        selector: { type: 'string', description: '截取特定元素的 CSS 选择器' },
        fullPage: { type: 'boolean', description: '是否截取整个页面', default: false },
        format: { type: 'string', enum: ['png', 'jpeg', 'webp'], description: '图片格式', default: 'png' },
      },
      required: ['url'],
    },
  },
  {
    id: 'mcp-web-links',
    name: 'extract_links',
    description: '提取页面中的所有链接，支持按模式过滤',
    type: 'MCP',
    category: 'TOOL_WEB',
    mcpServer: 'web-browser-server',
    mcpClient: 'web-browser-client',
    isActive: false,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '目标 URL 地址' },
        pattern: { type: 'string', description: '链接 URL 过滤正则表达式' },
        includeText: { type: 'boolean', description: '是否包含链接文本', default: true },
      },
      required: ['url'],
    },
  },

  // ---- MCP 工具：database-server ----
  {
    id: 'mcp-db-execute',
    name: 'execute_sql',
    description: '执行 SQL 查询语句，返回结构化结果集',
    type: 'MCP',
    category: 'TOOL_DATA',
    mcpServer: 'database-server',
    mcpClient: 'database-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL 查询语句' },
        database: { type: 'string', description: '目标数据库名称' },
        params: { type: 'array', items: { type: 'string' }, description: '参数化查询的参数列表' },
        timeout: { type: 'number', description: '查询超时时间（秒）', default: 30 },
      },
      required: ['sql'],
    },
  },
  {
    id: 'mcp-db-tables',
    name: 'list_tables',
    description: '列出数据库中的所有表，包含表注释和行数估算',
    type: 'MCP',
    category: 'TOOL_DATA',
    mcpServer: 'database-server',
    mcpClient: 'database-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: '数据库名称' },
        schema: { type: 'string', description: 'Schema 名称', default: 'public' },
      },
      required: ['database'],
    },
  },
  {
    id: 'mcp-db-describe',
    name: 'describe_table',
    description: '获取表结构详细信息，包含列名、类型、约束和索引',
    type: 'MCP',
    category: 'TOOL_DATA',
    mcpServer: 'database-server',
    mcpClient: 'database-client',
    isActive: false,
    inputSchema: {
      type: 'object',
      properties: {
        database: { type: 'string', description: '数据库名称' },
        table: { type: 'string', description: '表名称' },
        schema: { type: 'string', description: 'Schema 名称', default: 'public' },
      },
      required: ['database', 'table'],
    },
  },

  // ---- MCP 工具：github-server ----
  {
    id: 'mcp-gh-search',
    name: 'search_repos',
    description: '搜索 GitHub 仓库，支持按语言、星数、更新时间筛选',
    type: 'MCP',
    category: 'TOOL_CODE',
    mcpServer: 'github-server',
    mcpClient: 'github-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
        language: { type: 'string', description: '编程语言筛选' },
        sort: { type: 'string', enum: ['stars', 'forks', 'updated'], description: '排序方式', default: 'stars' },
        limit: { type: 'number', description: '返回结果数量', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    id: 'mcp-gh-issues',
    name: 'get_issues',
    description: '获取仓库 Issues 列表，支持按状态和标签过滤',
    type: 'MCP',
    category: 'TOOL_CODE',
    mcpServer: 'github-server',
    mcpClient: 'github-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: '仓库所有者' },
        repo: { type: 'string', description: '仓库名称' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue 状态', default: 'open' },
        labels: { type: 'array', items: { type: 'string' }, description: '标签过滤' },
        limit: { type: 'number', description: '返回数量', default: 20 },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    id: 'mcp-gh-pr',
    name: 'create_pr',
    description: '创建 Pull Request，支持指定 base 和 head 分支',
    type: 'MCP',
    category: 'TOOL_CODE',
    mcpServer: 'github-server',
    mcpClient: 'github-client',
    isActive: false,
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: '仓库所有者' },
        repo: { type: 'string', description: '仓库名称' },
        title: { type: 'string', description: 'PR 标题' },
        body: { type: 'string', description: 'PR 描述内容（支持 Markdown）' },
        head: { type: 'string', description: '源分支名称' },
        base: { type: 'string', description: '目标分支名称', default: 'main' },
        draft: { type: 'boolean', description: '是否创建为草稿 PR', default: false },
      },
      required: ['owner', 'repo', 'title', 'head'],
    },
  },
  {
    id: 'mcp-gh-review',
    name: 'review_code',
    description: '对 Pull Request 进行代码审查，返回逐行评审意见',
    type: 'MCP',
    category: 'TOOL_CODE',
    mcpServer: 'github-server',
    mcpClient: 'github-client',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: '仓库所有者' },
        repo: { type: 'string', description: '仓库名称' },
        prNumber: { type: 'number', description: 'Pull Request 编号' },
        focus: { type: 'string', description: '审查重点（如 security、performance、style）' },
      },
      required: ['owner', 'repo', 'prNumber'],
    },
  },

  // ---- System 工具：web 类 (TOOL_WEB) ----
  {
    id: 'sys-web-search',
    name: 'web_search',
    description: '通过搜索引擎检索互联网信息，返回结构化结果摘要',
    type: 'SYSTEM',
    category: 'TOOL_WEB',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
        maxResults: { type: 'number', description: '最大返回结果数', default: 10 },
        language: { type: 'string', description: '搜索语言偏好', default: 'zh-CN' },
        timeRange: { type: 'string', enum: ['day', 'week', 'month', 'year', 'all'], description: '时间范围', default: 'all' },
      },
      required: ['query'],
    },
  },
  {
    id: 'sys-url-fetcher',
    name: 'url_fetcher',
    description: '抓取指定 URL 的页面内容，自动提取正文并转为结构化文本',
    type: 'SYSTEM',
    category: 'TOOL_WEB',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '目标 URL' },
        extractMode: { type: 'string', enum: ['text', 'html', 'markdown'], description: '提取模式', default: 'markdown' },
        includeImages: { type: 'boolean', description: '是否包含图片链接', default: false },
      },
      required: ['url'],
    },
  },
  {
    id: 'sys-rss-reader',
    name: 'rss_reader',
    description: '解析 RSS/Atom 订阅源，返回最新文章列表',
    type: 'SYSTEM',
    category: 'TOOL_WEB',
    isActive: false,
    inputSchema: {
      type: 'object',
      properties: {
        feedUrl: { type: 'string', description: 'RSS 订阅源 URL' },
        limit: { type: 'number', description: '返回文章数量', default: 20 },
        since: { type: 'string', description: '筛选此日期之后的文章（ISO 8601 格式）' },
      },
      required: ['feedUrl'],
    },
  },

  // ---- System 工具：data 类 (TOOL_DATA) ----
  {
    id: 'sys-json-parser',
    name: 'json_parser',
    description: 'JSON 数据解析、转换与查询，支持 JSONPath 表达式',
    type: 'SYSTEM',
    category: 'TOOL_DATA',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'JSON 字符串或 URL' },
        query: { type: 'string', description: 'JSONPath 查询表达式' },
        transform: { type: 'string', enum: ['flatten', 'group', 'sort', 'filter'], description: '数据转换操作' },
        outputFormat: { type: 'string', enum: ['json', 'csv', 'table'], description: '输出格式', default: 'json' },
      },
      required: ['data'],
    },
  },
  {
    id: 'sys-csv-analyzer',
    name: 'csv_analyzer',
    description: 'CSV 数据分析工具，支持统计汇总、分组聚合和数据清洗',
    type: 'SYSTEM',
    category: 'TOOL_DATA',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'CSV 文件路径或 URL' },
        delimiter: { type: 'string', description: '分隔符', default: ',' },
        operations: { type: 'array', items: { type: 'string', enum: ['describe', 'groupby', 'filter', 'sort', 'pivot'] }, description: '分析操作列表' },
        columns: { type: 'array', items: { type: 'string' }, description: '目标列名' },
      },
      required: ['source'],
    },
  },
  {
    id: 'sys-data-visualizer',
    name: 'data_visualizer',
    description: '数据可视化图表生成，支持折线图、柱状图、饼图等常见图表类型',
    type: 'SYSTEM',
    category: 'TOOL_DATA',
    isActive: false,
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string', description: '数据源（JSON 格式）' },
        chartType: { type: 'string', enum: ['line', 'bar', 'pie', 'scatter', 'heatmap', 'treemap'], description: '图表类型' },
        title: { type: 'string', description: '图表标题' },
        xAxis: { type: 'string', description: 'X 轴字段名' },
        yAxis: { type: 'string', description: 'Y 轴字段名' },
        format: { type: 'string', enum: ['svg', 'png', 'html'], description: '输出格式', default: 'svg' },
      },
      required: ['data', 'chartType'],
    },
  },

  // ---- System 工具：ai 类 (TOOL_SYSTEM) ----
  {
    id: 'sys-text-embedding',
    name: 'text_embedding',
    description: '文本向量化工具，将文本转换为高维语义向量表示',
    type: 'SYSTEM',
    category: 'TOOL_SYSTEM',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '输入文本' },
        model: { type: 'string', enum: ['text-embedding-3-small', 'text-embedding-3-large', 'bge-large-zh'], description: '向量模型', default: 'text-embedding-3-small' },
        dimensions: { type: 'number', description: '向量维度', default: 1536 },
      },
      required: ['text'],
    },
  },
  {
    id: 'sys-image-recognition',
    name: 'image_recognition',
    description: '图像识别与分析，支持物体检测、场景识别和 OCR 文字提取',
    type: 'SYSTEM',
    category: 'TOOL_SYSTEM',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', description: '图片 URL 或 Base64 编码' },
        tasks: { type: 'array', items: { type: 'string', enum: ['detect', 'classify', 'ocr', 'caption'] }, description: '识别任务类型' },
        language: { type: 'string', description: 'OCR 识别语言', default: 'zh-CN' },
      },
      required: ['imageUrl'],
    },
  },
  {
    id: 'sys-sentiment-analysis',
    name: 'sentiment_analysis',
    description: '文本情感分析，识别正面/负面/中性情绪及情感强度',
    type: 'SYSTEM',
    category: 'TOOL_SYSTEM',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待分析文本' },
        granularity: { type: 'string', enum: ['document', 'sentence', 'aspect'], description: '分析粒度', default: 'document' },
        language: { type: 'string', description: '文本语言', default: 'auto' },
      },
      required: ['text'],
    },
  },

  // ---- System 工具：document 类 (TOOL_DOCUMENT) ----
  {
    id: 'sys-pdf-reader',
    name: 'pdf_reader',
    description: 'PDF 文档解析工具，提取文本、表格和图片信息',
    type: 'SYSTEM',
    category: 'TOOL_DOCUMENT',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'PDF 文件路径或 URL' },
        pages: { type: 'string', description: '页码范围（如 "1-5" 或 "1,3,5"）' },
        extractMode: { type: 'string', enum: ['text', 'table', 'image', 'all'], description: '提取模式', default: 'text' },
        ocr: { type: 'boolean', description: '是否启用 OCR 识别扫描件', default: false },
      },
      required: ['source'],
    },
  },
  {
    id: 'sys-markdown-converter',
    name: 'markdown_converter',
    description: 'Markdown 格式转换工具，支持 HTML/PDF/DOCX 双向转换',
    type: 'SYSTEM',
    category: 'TOOL_DOCUMENT',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: '源文件路径或文本内容' },
        inputFormat: { type: 'string', enum: ['markdown', 'html', 'docx'], description: '输入格式' },
        outputFormat: { type: 'string', enum: ['markdown', 'html', 'pdf', 'docx'], description: '输出格式' },
        template: { type: 'string', description: '转换模板名称' },
      },
      required: ['source', 'inputFormat', 'outputFormat'],
    },
  },
  {
    id: 'sys-doc-summary',
    name: 'document_summary',
    description: '文档智能摘要生成，支持提取式和生成式摘要',
    type: 'SYSTEM',
    category: 'TOOL_DOCUMENT',
    isActive: false,
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', description: '文档路径、URL 或文本内容' },
        mode: { type: 'string', enum: ['extractive', 'abstractive'], description: '摘要模式', default: 'abstractive' },
        maxLength: { type: 'number', description: '摘要最大字数', default: 500 },
        language: { type: 'string', description: '输出语言', default: 'zh-CN' },
        keyPoints: { type: 'boolean', description: '是否提取要点列表', default: true },
      },
      required: ['source'],
    },
  },

  // ---- System 工具：code 类 (TOOL_CODE) ----
  {
    id: 'sys-code-formatter',
    name: 'code_formatter',
    description: '代码格式化工具，支持主流编程语言的代码美化和风格统一',
    type: 'SYSTEM',
    category: 'TOOL_CODE',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '待格式化的代码' },
        language: { type: 'string', enum: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'sql', 'css', 'html'], description: '编程语言' },
        style: { type: 'string', enum: ['prettier', 'standard', 'google', 'airbnb'], description: '代码风格', default: 'prettier' },
        tabWidth: { type: 'number', description: '缩进宽度', default: 2 },
      },
      required: ['code', 'language'],
    },
  },
  {
    id: 'sys-regex-tester',
    name: 'regex_tester',
    description: '正则表达式测试与调试工具，可视化匹配结果和捕获组',
    type: 'SYSTEM',
    category: 'TOOL_CODE',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: '正则表达式' },
        testString: { type: 'string', description: '测试字符串' },
        flags: { type: 'string', description: '正则标志（如 gim）', default: 'g' },
        replace: { type: 'string', description: '替换模板（可选）' },
      },
      required: ['pattern', 'testString'],
    },
  },
  {
    id: 'sys-api-tester',
    name: 'api_tester',
    description: 'API 接口测试工具，支持 REST/GraphQL 请求发送和响应验证',
    type: 'SYSTEM',
    category: 'TOOL_CODE',
    isActive: true,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'API 端点 URL' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], description: 'HTTP 方法', default: 'GET' },
        headers: { type: 'object', description: '请求头' },
        body: { type: 'string', description: '请求体（JSON 字符串）' },
        assertions: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, operator: { type: 'string' }, value: { type: 'string' } } }, description: '响应断言规则' },
        timeout: { type: 'number', description: '超时时间（毫秒）', default: 10000 },
      },
      required: ['url'],
    },
  },
]

// ==================== Handler ====================

export default function playgroundMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // ==================== Basic Chat ====================

  if (match('/playground/basic/chat/models', url) && method === 'get') {
    return ok(chatModels)
  }

  // sessions/:id/messages — must be before sessions/:id
  if (match('/playground/basic/chat/sessions/:id/messages', url) && method === 'get') {
    const sessionId = param('/playground/basic/chat/sessions/:id/messages', url, 'id')
    return ok(allChatMessages[sessionId] || [])
  }

  // sessions/:id/title
  if (match('/playground/basic/chat/sessions/:id/title', url) && method === 'put') {
    const sessionId = param('/playground/basic/chat/sessions/:id/title', url, 'id')
    const body = parseBody(config.data)
    const session = chatSessions.find(s => s.id === sessionId)
    return ok(session ? { ...session, title: body.title || session.title } : null)
  }

  // sessions/:id (GET / DELETE)
  if (match('/playground/basic/chat/sessions/:id', url)) {
    const sessionId = param('/playground/basic/chat/sessions/:id', url, 'id')
    if (method === 'get') {
      return ok(chatSessions.find(s => s.id === sessionId) || chatSessions[0])
    }
    if (method === 'delete') {
      return ok(null)
    }
  }

  // sessions list
  if (match('/playground/basic/chat/sessions', url) && method === 'get') {
    return ok(chatSessions)
  }

  // ==================== Image ====================

  if (match('/playground/basic/image/models', url) && method === 'get') {
    return ok(imageModels)
  }

  // generate
  if (match('/playground/basic/image/generate', url) && method === 'post') {
    const body = parseBody(config.data)
    const modelId = body.modelId || 'dall-e-3'
    const model = imageModels.find(m => m.id === modelId)
    const seed = Math.floor(Math.random() * 10000)
    const size = body.size || '1024x1024'
    const [w, h] = size.split('x').map(Number)
    return ok({
      id: mockId('img-msg'),
      sessionId: body.sessionId || mockId('img-session'),
      modelId,
      role: 'assistant' as const,
      type: 'image_result' as const,
      content: {
        images: [{
          id: mockId('gen-img'),
          url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
          thumbnailUrl: `https://picsum.photos/seed/${seed}/256/256`,
          width: w,
          height: h,
          prompt: body.prompt,
          revisedPrompt: body.prompt,
        }],
        revisedPrompt: body.prompt,
      },
      creditsCharged: model?.creditPrice || 8,
      createdTime: new Date().toISOString(),
    })
  }

  // sessions/:id/messages
  if (match('/playground/basic/image/sessions/:id/messages', url) && method === 'get') {
    const sessionId = param('/playground/basic/image/sessions/:id/messages', url, 'id')
    return ok(allImageMessages[sessionId] || [])
  }

  // sessions/:id/title
  if (match('/playground/basic/image/sessions/:id/title', url) && method === 'patch') {
    const sessionId = param('/playground/basic/image/sessions/:id/title', url, 'id')
    const body = parseBody(config.data)
    const session = imageSessions.find(s => s.id === sessionId)
    return ok(session ? { ...session, title: body.title || session.title } : true)
  }

  // sessions/:id (GET / DELETE)
  if (match('/playground/basic/image/sessions/:id', url)) {
    const sessionId = param('/playground/basic/image/sessions/:id', url, 'id')
    if (method === 'get') {
      return ok(imageSessions.find(s => s.id === sessionId) || imageSessions[0])
    }
    if (method === 'delete') {
      return ok(true)
    }
  }

  // sessions list
  if (match('/playground/basic/image/sessions', url) && method === 'get') {
    return ok(imageSessions)
  }

  // history/:id (DELETE) — must be before history list
  if (match('/playground/basic/image/history/:id', url) && method === 'delete') {
    return ok(true)
  }

  // history list
  if (match('/playground/basic/image/history', url) && method === 'get') {
    return ok(imageHistory)
  }

  // ==================== Video ====================

  if (match('/playground/basic/video/models', url) && method === 'get') {
    return ok(videoModels)
  }

  if (match('/playground/basic/video/generate', url) && method === 'post') {
    const body = parseBody(config.data)
    return ok({
      id: mockId('video'),
      modelId: body.modelId || 'sora-1',
      prompt: body.prompt || '',
      duration: body.duration || body.durationSec || 10,
      resolution: body.resolution || '1080p',
      fps: body.fps || 24,
      status: 'processing' as const, progress: 0,
      videoUrl: undefined, thumbnailUrl: undefined,
      creditsCharged: body.modelId === 'veo-2' ? 40 : 50,
      createdTime: new Date().toISOString(),
      completedTime: undefined,
    })
  }

  // video/:id/status — must be before history
  if (match('/playground/basic/video/:id/status', url) && method === 'get') {
    const videoId = param('/playground/basic/video/:id/status', url, 'id')
    const found = videoHistory.find(v => v.id === videoId)
    if (found) return ok(found)
    // Default: return completed status for unknown IDs
    return ok({
      id: videoId,
      modelId: 'sora-1',
      prompt: '视频生成完成',
      duration: 10, resolution: '1080p' as const, fps: 24,
      status: 'completed' as const, progress: 100,
      videoUrl: 'https://placehold.co/1920x1080/333/fff?text=Video+Complete',
      thumbnailUrl: 'https://placehold.co/480x270/333/fff?text=Thumbnail',
      creditsCharged: 50,
      createdTime: '2026-03-17T09:00:00Z',
      completedTime: '2026-03-17T09:02:30Z',
    })
  }

  if (match('/playground/basic/video/history', url) && method === 'get') {
    return ok(videoHistory)
  }

  // ==================== Speech ====================

  // models/tts — must be before models
  if (match('/playground/basic/speech/models/tts', url) && method === 'get') {
    return ok(speechModels.filter(m => m.modelType === 'tts'))
  }

  // models/asr — must be before models
  if (match('/playground/basic/speech/models/asr', url) && method === 'get') {
    return ok(speechModels.filter(m => m.modelType === 'asr'))
  }

  // models (all)
  if (match('/playground/basic/speech/models', url) && method === 'get') {
    return ok(speechModels)
  }

  // tts
  if (match('/playground/basic/speech/tts', url) && method === 'post') {
    const body = parseBody(config.data)
    const text = body.text || body.inputText || ''
    const estimatedDuration = Math.max(2, Math.min(30, text.length * 0.12))
    return ok({
      id: mockId('speech'),
      type: 'tts' as const,
      modelId: body.modelId || 'tts-1-hd',
      text,
      voiceId: body.voiceId || body.voice || 'alloy',
      language: body.language || 'zh',
      audioUrl: `https://example.com/audio/${mockId('tts')}.mp3`,
      duration: Math.round(estimatedDuration * 10) / 10,
      status: 'completed' as const,
      creditsCharged: body.modelId === 'azure-tts' ? 2 : 3,
      createdTime: new Date().toISOString(),
    })
  }

  // asr
  if (match('/playground/basic/speech/asr', url) && method === 'post') {
    const body = parseBody(config.data)
    return ok({
      id: mockId('speech'),
      type: 'asr' as const,
      modelId: body.modelId || 'whisper-large-v3',
      inputAudioUrl: body.audioUrl || body.inputAudioUrl || '',
      transcription: '这是一段语音识别的模拟结果。VOLO AI 的语音识别功能支持多种语言，能够准确地将语音内容转换为文字。',
      language: body.language || 'zh',
      confidence: 0.95,
      duration: 8.5,
      status: 'completed' as const,
      creditsCharged: body.modelId === 'azure-stt' ? 1.5 : 2,
      createdTime: new Date().toISOString(),
    })
  }

  // history
  if (match('/playground/basic/speech/history', url) && method === 'get') {
    const params = new URLSearchParams(url.split('?')[1] || '')
    const typeFilter = params.get('type') || params.get('modelType')
    if (typeFilter) {
      return ok(speechHistory.filter(s => s.type === typeFilter))
    }
    return ok(speechHistory)
  }

  // ==================== Tools ====================

  if (match('/tools_refresh', url) && method === 'get') {
    return ok(mockTools)
  }

  return null
}
