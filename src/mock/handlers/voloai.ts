import type { InternalAxiosRequestConfig } from 'axios'
import { ok, match, param, parseBody, mockId } from '../shared'

// ==================== 辅助工具 ====================

/** 生成 turnId */
function turnId(session: string, n: number): string {
  return `${session}-turn-${String(n).padStart(3, '0')}`
}

/** 生成 messageId */
function msgId(session: string, n: number): string {
  return `${session}-msg-${String(n).padStart(3, '0')}`
}

// ==================== Session 001: Q4 数据分析 ====================

const SESSION_001_MESSAGES = [
  // Turn 1: 用户提问
  {
    messageId: msgId('s001', 1),
    sessionId: 'session-001',
    turnId: turnId('s001', 1),
    type: 'USER',
    sender: 'user',
    message: '帮我分析 Q4 季度用户增长数据',
    startTime: '2026-02-20T10:30:00Z',
    endTime: '2026-02-20T10:30:01Z',
  },
  // Turn 2: AI 思考
  {
    messageId: msgId('s001', 2),
    sessionId: 'session-001',
    turnId: turnId('s001', 2),
    parentTurnId: turnId('s001', 1),
    type: 'THINKING',
    sender: 'volo-ai',
    message: '分析用户请求，这是一个数据分析任务。需要获取 Q4（10月-12月）的用户增长数据，并进行多维度分析。我将先搜索市场基准数据作为参照，然后生成可视化图表。',
    startTime: '2026-02-20T10:30:02Z',
    endTime: '2026-02-20T10:30:04Z',
  },
  // Turn 3: 工具调用 - 搜索市场基准
  {
    messageId: msgId('s001', 3),
    sessionId: 'session-001',
    turnId: turnId('s001', 2),
    parentTurnId: turnId('s001', 1),
    type: 'ACTION',
    sender: 'volo-ai',
    message: '正在搜索 2025 Q4 SaaS 行业用户增长基准数据...',
    data: {
      toolCallId: 'tc-001-web-search',
      toolName: 'web_search',
      responseData: { query: '2025 Q4 SaaS user growth benchmark data' },
    },
    startTime: '2026-02-20T10:30:04Z',
    endTime: '2026-02-20T10:30:06Z',
  },
  // Turn 4: 工具返回结果
  {
    messageId: msgId('s001', 4),
    sessionId: 'session-001',
    turnId: turnId('s001', 2),
    parentTurnId: turnId('s001', 1),
    type: 'TOOL',
    sender: 'volo-ai',
    message: '搜索完成，获取到 3 条相关结果',
    data: {
      toolCallId: 'tc-001-web-search',
      toolName: 'web_search',
      responseData: {
        results: [
          { title: 'SaaS Metrics Report Q4 2025', snippet: '平均月增长率 5.2%，头部产品 MAU 增长 12.3%' },
          { title: '2025 App Growth Benchmark', snippet: '移动应用 Q4 日活留存率行业中位数 23.5%' },
          { title: 'User Acquisition Cost Trends', snippet: 'CAC 同比上升 8%，LTV/CAC 比值行业标准 3:1' },
        ],
      },
    },
    startTime: '2026-02-20T10:30:06Z',
    endTime: '2026-02-20T10:30:08Z',
  },
  // Turn 5: AI 详细分析
  {
    messageId: msgId('s001', 5),
    sessionId: 'session-001',
    turnId: turnId('s001', 2),
    parentTurnId: turnId('s001', 1),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `## Q4 季度用户增长数据分析报告

### 一、整体增长趋势

Q4 季度（10月-12月）整体表现强劲，用户增长呈现稳步上升态势：

| 月份 | MAU（万） | DAU（万） | DAU/MAU | 环比增长 |
|------|----------|----------|---------|---------|
| 10月 | 128.5 | 42.3 | 32.9% | +4.8% |
| 11月 | 135.2 | 47.1 | 34.8% | +5.2% |
| 12月 | 146.8 | 53.6 | 36.5% | +8.6% |

**季度总增长率：14.2%**，高于行业中位数（5.2%），接近头部产品水平（12.3%）。

### 二、关键指标分析

#### 1. 用户留存率
- **次日留存**：45.2%（行业基准 40%）✅
- **7日留存**：28.6%（行业基准 25%）✅
- **30日留存**：15.3%（行业基准 12%）✅

#### 2. 转化漏斗
- 访问 → 注册：18.5%
- 注册 → 首次使用：72.3%
- 首次使用 → 活跃用户：38.7%
- 活跃 → 付费：6.2%

#### 3. 用户获取成本（CAC）
- Q4 平均 CAC：¥42.8
- LTV/CAC 比值：4.2:1（高于行业标准 3:1）✅

### 三、增长归因

1. **11月大促活动**贡献了约 35% 的新增用户
2. **产品功能升级**（AI 助手 2.0）带来自然增长提升 22%
3. **社交裂变机制**贡献 18% 的新增用户，病毒传播系数 K=1.3

### 四、建议

- 🟢 继续加大 AI 功能投入，这是差异化核心
- 🟡 优化注册→首次使用转化率（目标 80%+）
- 🔴 关注 30 日留存的长期趋势，当前虽高于基准但增速放缓`,
    startTime: '2026-02-20T10:30:08Z',
    endTime: '2026-02-20T10:30:25Z',
    data: {
      inputTokens: 856,
      outputTokens: 1234,
      totalTokens: 2090,
      estimatedCredits: 1.2,
      modelId: 'gpt-4o',
    },
  },
  // Turn 6: 用户追问图表
  {
    messageId: msgId('s001', 6),
    sessionId: 'session-001',
    turnId: turnId('s001', 3),
    parentTurnId: turnId('s001', 2),
    type: 'USER',
    sender: 'user',
    message: '能给我画个图表吗？',
    startTime: '2026-02-20T10:31:00Z',
    endTime: '2026-02-20T10:31:01Z',
  },
  // Turn 7: AI 返回 UI 事件 (图表)
  {
    messageId: msgId('s001', 7),
    sessionId: 'session-001',
    turnId: turnId('s001', 4),
    parentTurnId: turnId('s001', 3),
    type: 'UI',
    sender: 'volo-ai',
    message: '已为您生成 Q4 用户增长趋势图表：',
    data: {
      componentType: 'bar_chart',
      title: 'Q4 季度 MAU/DAU 增长趋势',
      xAxis: ['10月', '11月', '12月'],
      series: [
        { name: 'MAU（万）', data: [128.5, 135.2, 146.8], color: '#6db8ac' },
        { name: 'DAU（万）', data: [42.3, 47.1, 53.6], color: '#f59e0b' },
      ],
      yAxisLabel: '用户数（万）',
    },
    startTime: '2026-02-20T10:31:03Z',
    endTime: '2026-02-20T10:31:06Z',
  },
  // Turn 8: DONE 总结
  {
    messageId: msgId('s001', 8),
    sessionId: 'session-001',
    turnId: turnId('s001', 4),
    parentTurnId: turnId('s001', 3),
    type: 'DONE',
    sender: 'volo-ai',
    message: '以上是 Q4 季度用户增长的可视化图表。从图中可以清晰看到 12 月的增长加速趋势，MAU 环比增长 8.6% 是季度最高点。如需进一步分析某个维度（如渠道归因、用户画像），请告诉我。',
    startTime: '2026-02-20T10:31:06Z',
    endTime: '2026-02-20T10:31:08Z',
    data: {
      inputTokens: 2340,
      outputTokens: 1890,
      totalTokens: 4230,
      estimatedCredits: 2.5,
      modelId: 'gpt-4o',
    },
  },
]

// ==================== Session 002: Python Web Scraper ====================

const SESSION_002_MESSAGES = [
  // Turn 1: 用户请求
  {
    messageId: msgId('s002', 1),
    sessionId: 'session-002',
    turnId: turnId('s002', 1),
    type: 'USER',
    sender: 'user',
    message: '用 Python 写一个 Web Scraper，能爬取豆瓣电影 Top 250 的数据',
    startTime: '2026-02-18T14:00:00Z',
    endTime: '2026-02-18T14:00:01Z',
  },
  // Turn 2: PLAN_WRITE - 任务规划
  {
    messageId: msgId('s002', 2),
    sessionId: 'session-002',
    turnId: turnId('s002', 2),
    parentTurnId: turnId('s002', 1),
    type: 'PLAN_WRITE',
    sender: 'volo-ai',
    message: '已制定开发计划',
    data: {
      goal: '开发一个 Python 爬虫，爬取豆瓣电影 Top 250 的完整数据（名称、评分、导演、简介等）',
      currentTaskId: 'phase-1',
      taskPhaseList: [
        { id: 'phase-1', title: '环境准备与依赖分析', description: '确认所需库（requests, BeautifulSoup4, pandas），分析豆瓣页面结构', index: 0, taskStatus: 'RUNNING' },
        { id: 'phase-2', title: '核心爬虫逻辑实现', description: '编写请求、解析、反爬虫策略（User-Agent轮换、请求间隔）', index: 1, taskStatus: 'TODO' },
        { id: 'phase-3', title: '数据存储与导出', description: '将数据存为 CSV/JSON 格式，支持增量更新', index: 2, taskStatus: 'TODO' },
        { id: 'phase-4', title: '测试与优化', description: '异常处理、日志记录、性能优化', index: 3, taskStatus: 'TODO' },
      ],
    },
    startTime: '2026-02-18T14:00:02Z',
    endTime: '2026-02-18T14:00:05Z',
  },
  // Turn 3: THINKING
  {
    messageId: msgId('s002', 3),
    sessionId: 'session-002',
    turnId: turnId('s002', 2),
    parentTurnId: turnId('s002', 1),
    type: 'THINKING',
    sender: 'volo-ai',
    message: '开始分析豆瓣电影 Top 250 页面结构。豆瓣有反爬机制，需要设置合适的 Headers 和请求间隔。页面采用分页模式，每页25部电影，共10页。',
    startTime: '2026-02-18T14:00:05Z',
    endTime: '2026-02-18T14:00:07Z',
  },
  // Turn 4: ACTION - 查阅文档
  {
    messageId: msgId('s002', 4),
    sessionId: 'session-002',
    turnId: turnId('s002', 2),
    parentTurnId: turnId('s002', 1),
    type: 'ACTION',
    sender: 'volo-ai',
    message: '正在查阅 BeautifulSoup4 最新文档...',
    data: {
      toolCallId: 'tc-002-doc-search',
      toolName: 'web_search',
      responseData: { query: 'BeautifulSoup4 latest documentation CSS selectors' },
    },
    startTime: '2026-02-18T14:00:07Z',
    endTime: '2026-02-18T14:00:09Z',
  },
  // Turn 5: TOOL 返回
  {
    messageId: msgId('s002', 5),
    sessionId: 'session-002',
    turnId: turnId('s002', 2),
    parentTurnId: turnId('s002', 1),
    type: 'TOOL',
    sender: 'volo-ai',
    message: '文档检索完成',
    data: {
      toolCallId: 'tc-002-doc-search',
      toolName: 'web_search',
      responseData: {
        results: [
          { title: 'Beautiful Soup Documentation', snippet: 'bs4 4.12.3 - CSS Selector API: soup.select(), soup.select_one()' },
        ],
      },
    },
    startTime: '2026-02-18T14:00:09Z',
    endTime: '2026-02-18T14:00:10Z',
  },
  // Turn 6: ASSISTANT - 第一版代码
  {
    messageId: msgId('s002', 6),
    sessionId: 'session-002',
    turnId: turnId('s002', 2),
    parentTurnId: turnId('s002', 1),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `好的，我来为你编写一个完整的豆瓣 Top 250 爬虫。这个爬虫包含反爬策略、错误处理和数据导出功能。

### 第一步：安装依赖

\`\`\`bash
pip install requests beautifulsoup4 pandas lxml
\`\`\`

### 第二步：核心爬虫代码

\`\`\`python
"""
豆瓣电影 Top 250 爬虫
功能：爬取电影名称、评分、导演、年份、类型、简介
策略：User-Agent 轮换 + 随机延迟 + 异常重试
"""
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import random
import logging
from typing import List, Dict, Optional

# 日志配置
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# User-Agent 池
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/119.0.0.0',
]

BASE_URL = 'https://movie.douban.com/top250'

def get_headers() -> dict:
    """随机选择 User-Agent"""
    return {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
    }

def fetch_page(url: str, retries: int = 3) -> Optional[str]:
    """请求页面，支持重试"""
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=get_headers(), timeout=10)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as e:
            logger.warning(f'请求失败 (第{attempt+1}次): {e}')
            time.sleep(2 ** attempt)
    return None

def parse_movie_item(item) -> Dict:
    """解析单个电影条目"""
    title_span = item.select_one('.title')
    title = title_span.text.strip() if title_span else '未知'

    rating = item.select_one('.rating_num')
    score = float(rating.text) if rating else 0.0

    info = item.select_one('.bd p')
    info_text = info.text.strip() if info else ''

    quote = item.select_one('.inq')
    brief = quote.text.strip() if quote else ''

    return {
        'title': title,
        'score': score,
        'info': info_text,
        'brief': brief,
    }

def scrape_top250() -> List[Dict]:
    """爬取 Top 250 全部数据"""
    movies = []
    for start in range(0, 250, 25):
        url = f'{BASE_URL}?start={start}'
        logger.info(f'正在爬取: {url}')

        html = fetch_page(url)
        if not html:
            logger.error(f'跳过页面: {url}')
            continue

        soup = BeautifulSoup(html, 'lxml')
        items = soup.select('.item')

        for item in items:
            movie = parse_movie_item(item)
            movie['rank'] = len(movies) + 1
            movies.append(movie)

        # 随机延迟 1-3 秒，避免被封
        delay = random.uniform(1.0, 3.0)
        logger.info(f'等待 {delay:.1f}s...')
        time.sleep(delay)

    return movies

def save_to_csv(movies: List[Dict], filename: str = 'douban_top250.csv'):
    """保存为 CSV"""
    df = pd.DataFrame(movies)
    df.to_csv(filename, index=False, encoding='utf-8-sig')
    logger.info(f'已保存 {len(movies)} 部电影到 {filename}')

if __name__ == '__main__':
    movies = scrape_top250()
    save_to_csv(movies)
    print(f'\\n爬取完成！共 {len(movies)} 部电影')
\`\`\`

### 代码说明

1. **反爬策略**：User-Agent 随机轮换 + 1-3秒随机延迟
2. **容错机制**：每页最多重试 3 次，指数退避
3. **数据解析**：使用 CSS Selector 精准定位
4. **输出格式**：CSV（Excel 可直接打开，UTF-8 BOM 编码）`,
    startTime: '2026-02-18T14:00:10Z',
    endTime: '2026-02-18T14:00:35Z',
  },
  // Turn 7: PLAN_WRITE 更新 - phase-1 完成
  {
    messageId: msgId('s002', 7),
    sessionId: 'session-002',
    turnId: turnId('s002', 2),
    parentTurnId: turnId('s002', 1),
    type: 'PLAN_WRITE',
    sender: 'volo-ai',
    message: '计划更新：核心代码已完成',
    data: {
      goal: '开发一个 Python 爬虫，爬取豆瓣电影 Top 250 的完整数据',
      currentTaskId: 'phase-3',
      taskPhaseList: [
        { id: 'phase-1', title: '环境准备与依赖分析', description: '确认所需库，分析页面结构', index: 0, taskStatus: 'DONE' },
        { id: 'phase-2', title: '核心爬虫逻辑实现', description: '请求、解析、反爬虫策略', index: 1, taskStatus: 'DONE' },
        { id: 'phase-3', title: '数据存储与导出', description: 'CSV/JSON 格式导出', index: 2, taskStatus: 'RUNNING' },
        { id: 'phase-4', title: '测试与优化', description: '异常处理、日志记录', index: 3, taskStatus: 'TODO' },
      ],
    },
    startTime: '2026-02-18T14:00:35Z',
    endTime: '2026-02-18T14:00:36Z',
  },
  // Turn 8: 用户追问 JSON 格式
  {
    messageId: msgId('s002', 8),
    sessionId: 'session-002',
    turnId: turnId('s002', 3),
    parentTurnId: turnId('s002', 2),
    type: 'USER',
    sender: 'user',
    message: '能不能也支持输出 JSON 格式？另外加一个进度条',
    startTime: '2026-02-18T14:01:00Z',
    endTime: '2026-02-18T14:01:01Z',
  },
  // Turn 9: THINKING
  {
    messageId: msgId('s002', 9),
    sessionId: 'session-002',
    turnId: turnId('s002', 4),
    parentTurnId: turnId('s002', 3),
    type: 'THINKING',
    sender: 'volo-ai',
    message: '用户需要两个增强：1) JSON 输出支持——使用 json.dump 带 ensure_ascii=False；2) 进度条——使用 tqdm 库，可以直接包裹 range() 迭代器。',
    startTime: '2026-02-18T14:01:02Z',
    endTime: '2026-02-18T14:01:04Z',
  },
  // Turn 10: ASSISTANT 增强代码
  {
    messageId: msgId('s002', 10),
    sessionId: 'session-002',
    turnId: turnId('s002', 4),
    parentTurnId: turnId('s002', 3),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `当然！补充 JSON 导出和 tqdm 进度条：

\`\`\`bash
pip install tqdm
\`\`\`

\`\`\`python
import json
from tqdm import tqdm

def save_to_json(movies: List[Dict], filename: str = 'douban_top250.json'):
    """保存为 JSON"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)
    logger.info(f'已保存 {len(movies)} 部电影到 {filename}')

def scrape_top250() -> List[Dict]:
    """爬取 Top 250 全部数据（带进度条）"""
    movies = []
    pages = range(0, 250, 25)
    for start in tqdm(pages, desc='爬取进度', unit='页'):
        url = f'{BASE_URL}?start={start}'
        html = fetch_page(url)
        if not html:
            continue
        soup = BeautifulSoup(html, 'lxml')
        for item in soup.select('.item'):
            movie = parse_movie_item(item)
            movie['rank'] = len(movies) + 1
            movies.append(movie)
        time.sleep(random.uniform(1.0, 3.0))
    return movies

if __name__ == '__main__':
    movies = scrape_top250()
    save_to_csv(movies)
    save_to_json(movies)
    print(f'爬取完成！共 {len(movies)} 部电影，已导出 CSV + JSON')
\`\`\`

修改点：
- 新增 \`save_to_json()\` 函数，使用 \`ensure_ascii=False\` 保证中文正常
- \`scrape_top250()\` 中用 \`tqdm\` 包裹分页迭代，实时显示进度条
- 主函数同时调用两种导出`,
    startTime: '2026-02-18T14:01:04Z',
    endTime: '2026-02-18T14:01:20Z',
  },
  // Turn 11: DONE
  {
    messageId: msgId('s002', 11),
    sessionId: 'session-002',
    turnId: turnId('s002', 4),
    parentTurnId: turnId('s002', 3),
    type: 'DONE',
    sender: 'volo-ai',
    message: '代码已更新完毕。完整功能：反爬策略 + 错误重试 + CSV/JSON 双格式 + tqdm 进度条。直接运行 `python douban_top250.py` 即可。如需增加更多字段（如海报URL、演员列表），随时告诉我。',
    startTime: '2026-02-18T14:01:20Z',
    endTime: '2026-02-18T14:01:22Z',
    data: {
      inputTokens: 3120,
      outputTokens: 2456,
      totalTokens: 5576,
      estimatedCredits: 3.2,
      modelId: 'gpt-4o',
    },
  },
]

// ==================== Session 003: 论文翻译 ====================

const SESSION_003_MESSAGES = [
  // Turn 1: 用户请求
  {
    messageId: msgId('s003', 1),
    sessionId: 'session-003',
    turnId: turnId('s003', 1),
    type: 'USER',
    sender: 'user',
    message: `请翻译这段关于 Transformer 架构的论文摘要：

"Attention Is All You Need. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train."`,
    startTime: '2026-02-15T09:00:00Z',
    endTime: '2026-02-15T09:00:02Z',
  },
  // Turn 2: THINKING
  {
    messageId: msgId('s003', 2),
    sessionId: 'session-003',
    turnId: turnId('s003', 2),
    parentTurnId: turnId('s003', 1),
    type: 'THINKING',
    sender: 'volo-ai',
    message: '这是经典论文 "Attention Is All You Need" 的摘要。翻译策略：保留术语原文（Transformer, Attention）同时给出准确的中文学术表达。需要注意 "dispensing with" 译为"完全摒弃"比"不使用"更学术化。',
    startTime: '2026-02-15T09:00:03Z',
    endTime: '2026-02-15T09:00:05Z',
  },
  // Turn 3: ASSISTANT 翻译结果
  {
    messageId: msgId('s003', 3),
    sessionId: 'session-003',
    turnId: turnId('s003', 2),
    parentTurnId: turnId('s003', 1),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `## 翻译结果

### 中文译文

**《注意力即是全部所需》**

我们提出了一种新的简洁网络架构——**Transformer**，该架构完全基于**注意力机制（Attention Mechanism）**，彻底摒弃了循环结构（Recurrence）和卷积操作（Convolution）。在两项机器翻译任务上的实验表明，该模型在翻译质量上更具优势，同时具备更强的**并行化能力**，所需训练时间也显著缩短。

### 术语对照表

| 英文原文 | 中文翻译 | 说明 |
|---------|---------|------|
| Transformer | Transformer（保留原文） | 已成为专有名词 |
| Attention Mechanism | 注意力机制 | 核心概念 |
| Recurrence | 循环结构 | 指 RNN/LSTM 的递归结构 |
| Convolution | 卷积操作 | 指 CNN 的卷积层 |
| Parallelizable | 并行化能力 | GPU 并行计算优势 |`,
    startTime: '2026-02-15T09:00:05Z',
    endTime: '2026-02-15T09:00:18Z',
  },
  // Turn 4: 用户追问
  {
    messageId: msgId('s003', 4),
    sessionId: 'session-003',
    turnId: turnId('s003', 3),
    parentTurnId: turnId('s003', 2),
    type: 'USER',
    sender: 'user',
    message: '"dispensing with" 这里翻译成"摒弃"会不会太强烈了？学术论文里常用什么表达？',
    startTime: '2026-02-15T09:01:00Z',
    endTime: '2026-02-15T09:01:02Z',
  },
  // Turn 5: ASSISTANT 解释
  {
    messageId: msgId('s003', 5),
    sessionId: 'session-003',
    turnId: turnId('s003', 4),
    parentTurnId: turnId('s003', 3),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `很好的问题！"dispensing with" 在学术语境中确实有几种不同的译法：

| 译法 | 语气强度 | 适用场景 |
|------|---------|---------|
| **摒弃** | ★★★★★ | 强调革新，适合技术突破类论文 |
| **舍弃** | ★★★★ | 中性偏强，常见于对比实验 |
| **不再依赖** | ★★★ | 温和表达，适合综述类论文 |
| **省去/去除** | ★★ | 轻描淡写，适合工程优化 |

在这篇论文的语境中，作者用 "dispensing with ... **entirely**" 加了 "entirely" 强调**完全不用**，所以"彻底摒弃"是准确的。

不过如果你偏好更温和的表达，可以改为：

> 该架构完全基于注意力机制，**不再依赖**循环结构和卷积操作。

两种都是合格的学术翻译，选择取决于你想传达的语气。`,
    startTime: '2026-02-15T09:01:03Z',
    endTime: '2026-02-15T09:01:15Z',
  },
  // Turn 6: DONE
  {
    messageId: msgId('s003', 6),
    sessionId: 'session-003',
    turnId: turnId('s003', 4),
    parentTurnId: turnId('s003', 3),
    type: 'DONE',
    sender: 'volo-ai',
    message: '翻译和术语解析已完成。如果还有其他段落需要翻译，或者想调整某个术语的译法，随时告诉我。',
    startTime: '2026-02-15T09:01:15Z',
    endTime: '2026-02-15T09:01:16Z',
    data: {
      inputTokens: 1680,
      outputTokens: 1245,
      totalTokens: 2925,
      estimatedCredits: 1.7,
      modelId: 'gpt-4o',
    },
  },
]

// ==================== Session 004: 复杂多步计划 ====================

const SESSION_004_MESSAGES = [
  // Turn 1: 用户请求
  {
    messageId: msgId('s004', 1),
    sessionId: 'session-004',
    turnId: turnId('s004', 1),
    type: 'USER',
    sender: 'user',
    message: '帮我设计一个完整的电商微服务架构方案，需要考虑高并发、分布式事务和服务治理',
    startTime: '2026-03-01T09:00:00Z',
    endTime: '2026-03-01T09:00:02Z',
  },
  // Turn 2: THINKING
  {
    messageId: msgId('s004', 2),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'THINKING',
    sender: 'volo-ai',
    message: '这是一个复杂的架构设计任务，涉及多个领域：微服务拆分、高并发方案（缓存/限流/消息队列）、分布式事务（Saga/TCC）、服务治理（注册发现/熔断/链路追踪）。需要分阶段系统化输出。',
    startTime: '2026-03-01T09:00:03Z',
    endTime: '2026-03-01T09:00:06Z',
  },
  // Turn 3: PLAN_WRITE - 初始计划
  {
    messageId: msgId('s004', 3),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'PLAN_WRITE',
    sender: 'volo-ai',
    message: '任务计划已制定',
    data: {
      goal: '设计完整的电商微服务架构方案，覆盖服务拆分、高并发、分布式事务、服务治理四大维度',
      currentTaskId: 'phase-1',
      taskPhaseList: [
        { id: 'phase-1', title: '业务域分析与服务拆分', description: '分析电商核心域（商品/订单/支付/库存/用户），确定服务边界和数据所有权', index: 0, taskStatus: 'RUNNING' },
        { id: 'phase-2', title: '高并发架构设计', description: '缓存分层（Redis Cluster）、限流策略（令牌桶）、消息队列（RocketMQ）、读写分离', index: 1, taskStatus: 'TODO' },
        { id: 'phase-3', title: '分布式事务方案', description: 'Saga 编排模式 vs TCC 补偿模式对比，核心链路事务设计', index: 2, taskStatus: 'TODO' },
        { id: 'phase-4', title: '服务治理体系', description: 'Nacos 注册发现、Sentinel 熔断降级、SkyWalking 链路追踪、API 网关', index: 3, taskStatus: 'TODO' },
        { id: 'phase-5', title: '架构总图与部署方案', description: '整体架构图、K8s 部署拓扑、容量规划', index: 4, taskStatus: 'TODO' },
      ],
    },
    startTime: '2026-03-01T09:00:06Z',
    endTime: '2026-03-01T09:00:08Z',
  },
  // Turn 4: ACTION - 搜索最新实践
  {
    messageId: msgId('s004', 4),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'ACTION',
    sender: 'volo-ai',
    message: '正在搜索 2025-2026 年电商微服务最佳实践...',
    data: {
      toolCallId: 'tc-004-search',
      toolName: 'web_search',
      responseData: { query: 'e-commerce microservices architecture best practices 2026' },
    },
    startTime: '2026-03-01T09:00:08Z',
    endTime: '2026-03-01T09:00:10Z',
  },
  // Turn 5: TOOL 返回
  {
    messageId: msgId('s004', 5),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'TOOL',
    sender: 'volo-ai',
    message: '获取到行业最新实践参考',
    data: {
      toolCallId: 'tc-004-search',
      toolName: 'web_search',
      responseData: {
        results: [
          { title: 'Alibaba Microservice Architecture 2025', snippet: 'Spring Cloud Alibaba + Seata AT 模式处理分布式事务' },
          { title: 'ByteDance Service Mesh Practice', snippet: '基于 Istio 的服务网格实践，QPS 峰值 50万/秒' },
        ],
      },
    },
    startTime: '2026-03-01T09:00:10Z',
    endTime: '2026-03-01T09:00:11Z',
  },
  // Turn 6: ASSISTANT - Phase 1 输出
  {
    messageId: msgId('s004', 6),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `## 一、业务域分析与服务拆分

### 核心领域模型（DDD 战略设计）

\`\`\`
┌────────────────────────────────────────────────┐
│                 电商平台领域                      │
├──────────┬──────────┬──────────┬───────────────┤
│ 商品域    │ 交易域    │ 用户域    │ 营销域         │
│ ·商品中心 │ ·订单中心 │ ·用户中心 │ ·优惠券服务    │
│ ·类目管理 │ ·支付中心 │ ·账户服务 │ ·活动引擎     │
│ ·搜索服务 │ ·库存中心 │ ·地址服务 │ ·推荐服务     │
│ ·评价服务 │ ·物流中心 │ ·会员等级 │ ·积分系统     │
└──────────┴──────────┴──────────┴───────────────┘
\`\`\`

### 服务边界原则

| 原则 | 实践 |
|------|------|
| **数据所有权** | 每个服务独占自己的数据库 Schema |
| **业务闭环** | 一个完整业务操作不应跨越 3 个以上服务 |
| **独立部署** | 任何服务升级不影响其他服务运行 |
| **松耦合** | 服务间仅通过 API/事件通信，禁止共享数据库 |`,
    startTime: '2026-03-01T09:00:11Z',
    endTime: '2026-03-01T09:00:30Z',
  },
  // Turn 7: PLAN_WRITE 更新进度
  {
    messageId: msgId('s004', 7),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'PLAN_WRITE',
    sender: 'volo-ai',
    message: '阶段 1 完成，推进到阶段 2',
    data: {
      goal: '设计完整的电商微服务架构方案',
      currentTaskId: 'phase-2',
      taskPhaseList: [
        { id: 'phase-1', title: '业务域分析与服务拆分', description: 'DDD 战略设计，服务边界确定', index: 0, taskStatus: 'DONE' },
        { id: 'phase-2', title: '高并发架构设计', description: '缓存、限流、消息队列、读写分离', index: 1, taskStatus: 'RUNNING' },
        { id: 'phase-3', title: '分布式事务方案', description: 'Saga/TCC 对比与设计', index: 2, taskStatus: 'TODO' },
        { id: 'phase-4', title: '服务治理体系', description: '注册发现、熔断降级、链路追踪', index: 3, taskStatus: 'TODO' },
        { id: 'phase-5', title: '架构总图与部署方案', description: 'K8s 部署拓扑、容量规划', index: 4, taskStatus: 'TODO' },
      ],
    },
    startTime: '2026-03-01T09:00:30Z',
    endTime: '2026-03-01T09:00:31Z',
  },
  // Turn 8: ASSISTANT - Phase 2
  {
    messageId: msgId('s004', 8),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `## 二、高并发架构设计

### 缓存分层策略

\`\`\`
请求 → CDN（静态资源）→ Nginx（页面缓存）→ Redis Cluster（热数据）→ DB
                                                    ↓
                                              本地缓存 Caffeine
                                              (极热 Key 防穿透)
\`\`\`

| 层级 | 技术 | TTL | 命中率目标 |
|------|------|-----|----------|
| L1 CDN | CloudFlare | 30min | 60% 静态 |
| L2 Nginx | proxy_cache | 5min | 30% 页面 |
| L3 Redis | Redis Cluster 6节点 | 10min | 95% 热数据 |
| L4 本地 | Caffeine | 30s | 99.9% 极热 |

### 限流方案

- **网关层**：Sentinel 令牌桶，QPS 上限按服务配置
- **服务层**：线程池隔离（Bulkhead 模式）
- **数据层**：连接池限制 + 慢查询自动熔断

### 消息队列

- **削峰填谷**：下单高峰期消息入 RocketMQ，异步处理
- **最终一致**：库存扣减 → MQ → 订单确认 → MQ → 支付通知`,
    startTime: '2026-03-01T09:00:31Z',
    endTime: '2026-03-01T09:00:50Z',
  },
  // Turn 9: DONE
  {
    messageId: msgId('s004', 9),
    sessionId: 'session-004',
    turnId: turnId('s004', 2),
    parentTurnId: turnId('s004', 1),
    type: 'DONE',
    sender: 'volo-ai',
    message: '已完成前两个阶段的架构设计。分布式事务、服务治理和部署方案将在后续轮次中继续输出。需要我继续展开剩余部分吗？',
    startTime: '2026-03-01T09:00:50Z',
    endTime: '2026-03-01T09:00:52Z',
    data: {
      inputTokens: 4560,
      outputTokens: 3890,
      totalTokens: 8450,
      estimatedCredits: 4.8,
      modelId: 'gpt-4o',
    },
  },
]

// ==================== Session 005: 联网搜索 + 知识检索 ====================

const SESSION_005_MESSAGES = [
  // Turn 1: 用户请求
  {
    messageId: msgId('s005', 1),
    sessionId: 'session-005',
    turnId: turnId('s005', 1),
    type: 'USER',
    sender: 'user',
    message: '帮我调研一下 2026 年最新的 AI Agent 框架，对比 LangChain、CrewAI、AutoGen 和 Spring AI 的优劣势',
    startTime: '2026-03-10T15:00:00Z',
    endTime: '2026-03-10T15:00:02Z',
  },
  // Turn 2: THINKING
  {
    messageId: msgId('s005', 2),
    sessionId: 'session-005',
    turnId: turnId('s005', 2),
    parentTurnId: turnId('s005', 1),
    type: 'THINKING',
    sender: 'volo-ai',
    message: '这是一个调研类任务，需要联网搜索最新信息，同时检查知识库中是否有已有的技术选型文档。我将先搜索各框架的最新版本和社区动态，再查阅知识库中的评测报告。',
    startTime: '2026-03-10T15:00:03Z',
    endTime: '2026-03-10T15:00:05Z',
  },
  // Turn 3: ACTION - Web Search
  {
    messageId: msgId('s005', 3),
    sessionId: 'session-005',
    turnId: turnId('s005', 2),
    parentTurnId: turnId('s005', 1),
    type: 'ACTION',
    sender: 'volo-ai',
    message: '正在搜索 AI Agent 框架最新对比资料...',
    data: {
      toolCallId: 'tc-005-search-1',
      toolName: 'web_search',
      responseData: { query: 'AI Agent framework comparison 2026 LangChain CrewAI AutoGen Spring AI' },
    },
    startTime: '2026-03-10T15:00:05Z',
    endTime: '2026-03-10T15:00:07Z',
  },
  // Turn 4: TOOL - 搜索结果
  {
    messageId: msgId('s005', 4),
    sessionId: 'session-005',
    turnId: turnId('s005', 2),
    parentTurnId: turnId('s005', 1),
    type: 'TOOL',
    sender: 'volo-ai',
    message: '搜索完成，获取到 5 条相关结果',
    data: {
      toolCallId: 'tc-005-search-1',
      toolName: 'web_search',
      responseData: {
        results: [
          { title: 'LangChain v0.3 Release Notes', snippet: '新增 LangGraph 编排引擎，支持 Stateful Multi-Agent 协作' },
          { title: 'CrewAI 2026 Roadmap', snippet: '角色化 Agent 框架，v0.40 引入 Knowledge Graph 记忆层' },
          { title: 'AutoGen v0.4 - Microsoft Research', snippet: '重构为 AutoGen Studio，低代码可视化 Agent 编排' },
          { title: 'Spring AI 1.0 GA Released', snippet: '正式发布 1.0，统一 LLM 抽象层，原生支持 MCP 协议' },
          { title: 'AI Agent Framework Benchmark 2026', snippet: '延迟、吞吐量、工具调用成功率对比评测' },
        ],
      },
    },
    startTime: '2026-03-10T15:00:07Z',
    endTime: '2026-03-10T15:00:09Z',
  },
  // Turn 5: ACTION - Knowledge Retrieval
  {
    messageId: msgId('s005', 5),
    sessionId: 'session-005',
    turnId: turnId('s005', 2),
    parentTurnId: turnId('s005', 1),
    type: 'ACTION',
    sender: 'volo-ai',
    message: '正在检索知识库中的技术选型文档...',
    data: {
      toolCallId: 'tc-005-kb-1',
      toolName: 'knowledge_retrieval',
      responseData: { query: 'AI Agent 框架技术选型', datasetId: 'ds-tech-docs' },
    },
    startTime: '2026-03-10T15:00:09Z',
    endTime: '2026-03-10T15:00:11Z',
  },
  // Turn 6: TOOL - 知识库结果
  {
    messageId: msgId('s005', 6),
    sessionId: 'session-005',
    turnId: turnId('s005', 2),
    parentTurnId: turnId('s005', 1),
    type: 'TOOL',
    sender: 'volo-ai',
    message: '知识库检索完成，找到 2 篇相关文档',
    data: {
      toolCallId: 'tc-005-kb-1',
      toolName: 'knowledge_retrieval',
      responseData: {
        documents: [
          { title: 'VOLO AI 技术选型报告 v2', relevance: 0.92, snippet: '选择 Spring AI 的核心理由：Java 生态成熟、响应式原生支持、MCP 协议兼容' },
          { title: 'Agent 框架评测（内部）', relevance: 0.85, snippet: 'LangChain 生态最全但 Python only；Spring AI 企业级首选' },
        ],
      },
    },
    startTime: '2026-03-10T15:00:11Z',
    endTime: '2026-03-10T15:00:13Z',
  },
  // Turn 7: ASSISTANT 综合分析
  {
    messageId: msgId('s005', 7),
    sessionId: 'session-005',
    turnId: turnId('s005', 2),
    parentTurnId: turnId('s005', 1),
    type: 'ASSISTANT',
    sender: 'volo-ai',
    message: `## 2026 年 AI Agent 框架深度对比

综合联网搜索和知识库内部文档，以下是四大框架的全面对比：

### 对比总览

| 维度 | LangChain | CrewAI | AutoGen | Spring AI |
|------|-----------|--------|---------|-----------|
| **语言** | Python | Python | Python | Java/Kotlin |
| **最新版本** | v0.3 (LangGraph) | v0.40 | v0.4 (Studio) | **1.0 GA** |
| **Agent 模式** | ReAct + Graph | Role-based | Conversation | Strategy Pattern |
| **多 Agent** | LangGraph 编排 | Crew 协作 | GroupChat | 自定义策略 |
| **工具协议** | 自有 + MCP | 自有 | 自有 | **MCP 原生** |
| **流式输出** | 支持 | 支持 | 有限 | **SSE 原生** |
| **生态丰富度** | ★★★★★ | ★★★ | ★★★★ | ★★★ |
| **企业级能力** | ★★★ | ★★ | ★★★ | ★★★★★ |
| **学习曲线** | 陡峭 | 平缓 | 中等 | 中等 |
| **社区活跃度** | 极高 | 快速增长 | 高 | 稳步增长 |

### 各框架亮点

#### LangChain v0.3
- **LangGraph**：状态机驱动的 Agent 编排，支持条件分支和循环
- 生态无敌：600+ 集成（向量库/LLM/工具）
- 缺点：抽象层过厚，调试困难，版本迭代激进（API 频繁变更）

#### CrewAI v0.40
- **角色化设计**：定义 Agent 角色/目标/背景故事，高度拟人化
- 新增 Knowledge Graph 记忆层，跨会话知识持久化
- 缺点：企业级功能薄弱，无原生权限/审计/限流

#### AutoGen v0.4 (Studio)
- **低代码可视化**：AutoGen Studio 拖拽编排，适合非开发者
- 微软背书，Azure 深度集成
- 缺点：流式输出支持有限，定制灵活度不如 LangChain

#### Spring AI 1.0 GA
- **企业级首选**：Spring Security/Actuator/Micrometer 一体化
- **MCP 协议原生**：工具标准化，避免供应商锁定
- **响应式**：Project Reactor + SSE，非阻塞高并发
- 缺点：生态相比 Python 框架仍较年轻

### 选型建议

| 场景 | 推荐框架 | 原因 |
|------|---------|------|
| 快速原型/研究 | LangChain | 生态最全，示例最多 |
| 角色扮演/创意应用 | CrewAI | 角色化设计天然适合 |
| 企业低代码 | AutoGen Studio | 可视化编排，Azure 集成 |
| **企业级生产系统** | **Spring AI** | 安全/监控/部署成熟 |`,
    startTime: '2026-03-10T15:00:13Z',
    endTime: '2026-03-10T15:00:40Z',
  },
  // Turn 8: DONE
  {
    messageId: msgId('s005', 8),
    sessionId: 'session-005',
    turnId: turnId('s005', 2),
    parentTurnId: turnId('s005', 1),
    type: 'DONE',
    sender: 'volo-ai',
    message: '框架对比调研完成。综合来看，Spring AI 1.0 GA 的发布使其成为 Java/Kotlin 企业级场景的最佳选择。如需更深入分析某个框架，或者需要具体的 PoC 代码示例，请告诉我。',
    startTime: '2026-03-10T15:00:40Z',
    endTime: '2026-03-10T15:00:42Z',
    data: {
      inputTokens: 5230,
      outputTokens: 4120,
      totalTokens: 9350,
      estimatedCredits: 5.4,
      modelId: 'gpt-4o',
    },
  },
]

// ==================== 消息索引 ====================

const ALL_MESSAGES: Record<string, any[]> = {
  'session-001': SESSION_001_MESSAGES,
  'session-002': SESSION_002_MESSAGES,
  'session-003': SESSION_003_MESSAGES,
  'session-004': SESSION_004_MESSAGES,
  'session-005': SESSION_005_MESSAGES,
}

// ==================== Mock Handler ====================

export default function voloaiMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // GET /agent/chat/volo-ai/:sessionId/messages
  if (method === 'get' && match('/agent/chat/volo-ai/:sessionId/messages', url)) {
    const sessionId = param('/agent/chat/volo-ai/:sessionId/messages', url, 'sessionId')
    const messages = ALL_MESSAGES[sessionId]
    if (!messages) {
      return ok([])
    }
    return ok(messages)
  }

  // POST /agent/chat/volo-ai/interaction_response
  if (method === 'post' && match('/agent/chat/volo-ai/interaction_response', url)) {
    const body = parseBody(config.data)
    return ok(mockId('interaction-resp'))
  }

  return null
}
