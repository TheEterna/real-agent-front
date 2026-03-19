import type { InternalAxiosRequestConfig } from 'axios'
import { ok, error, match, param, parseBody, mockId, MOCK_USER } from '../shared'

// ==================== Mock Data ====================

const TEMPLATES = [
  {
    id: 'tpl-001',
    name: '本科毕业论文模板',
    degree: 'bachelor',
    wordRange: { min: 8000, max: 15000 },
    description: '适用于本科毕业论文，包含标准的五章结构',
    outline: [
      { title: '绪论', level: 1, children: ['研究背景', '研究目的与意义', '国内外研究现状', '论文结构安排'] },
      { title: '文献综述', level: 1, children: ['相关理论基础', '国内研究进展', '国外研究进展', '文献述评'] },
      { title: '研究方法', level: 1, children: ['研究设计', '数据收集', '分析方法'] },
      { title: '实验结果', level: 1, children: ['实验环境', '结果展示', '结果分析'] },
      { title: '结论', level: 1, children: ['研究总结', '不足与展望'] },
    ],
    createdTime: '2025-09-01T00:00:00Z',
  },
  {
    id: 'tpl-002',
    name: '硕士学位论文模板',
    degree: 'master',
    wordRange: { min: 25000, max: 40000 },
    description: '适用于硕士学位论文，结构更完整，含深度分析章节',
    outline: [
      { title: '绪论', level: 1, children: ['研究背景与动机', '研究目的与意义', '国内外研究现状', '研究内容与创新点', '论文组织结构'] },
      { title: '相关技术与理论基础', level: 1, children: ['核心概念定义', '理论框架', '关键技术综述'] },
      { title: '系统设计与实现', level: 1, children: ['需求分析', '系统架构设计', '核心模块设计', '关键算法实现'] },
      { title: '实验设计与结果分析', level: 1, children: ['实验环境与数据集', '评估指标', '对比实验', '消融实验', '结果讨论'] },
      { title: '总结与展望', level: 1, children: ['工作总结', '主要贡献', '不足之处', '未来工作'] },
    ],
    createdTime: '2025-09-01T00:00:00Z',
  },
  {
    id: 'tpl-003',
    name: '博士学位论文模板',
    degree: 'doctor',
    wordRange: { min: 60000, max: 100000 },
    description: '适用于博士学位论文，多章节深度研究结构',
    outline: [
      { title: '绪论', level: 1, children: ['研究背景', '问题提出', '研究意义', '国内外研究综述', '研究内容与技术路线', '论文创新点'] },
      { title: '理论基础与文献综述', level: 1, children: ['基础理论', '相关工作', '现有方法分析', '理论框架构建'] },
      { title: '方法一：XXX', level: 1, children: ['问题建模', '方法设计', '算法描述', '理论分析'] },
      { title: '方法二：XXX', level: 1, children: ['动机与思路', '模型架构', '训练策略', '复杂度分析'] },
      { title: '方法三：XXX', level: 1, children: ['研究动机', '方法设计', '实现细节'] },
      { title: '实验验证与分析', level: 1, children: ['实验设置', '数据集描述', '基线方法', '主实验结果', '消融研究', '案例分析'] },
      { title: '总结与展望', level: 1, children: ['研究总结', '主要贡献', '局限性讨论', '未来研究方向'] },
    ],
    createdTime: '2025-09-01T00:00:00Z',
  },
  {
    id: 'tpl-004',
    name: '学术期刊论文模板',
    degree: 'bachelor',
    wordRange: { min: 5000, max: 8000 },
    description: '适用于学术期刊投稿，采用 IMRAD 结构',
    outline: [
      { title: 'Introduction', level: 1, children: ['Background', 'Problem Statement', 'Contributions'] },
      { title: 'Methods', level: 1, children: ['Problem Formulation', 'Proposed Approach', 'Implementation Details'] },
      { title: 'Results', level: 1, children: ['Experimental Setup', 'Main Results', 'Ablation Study'] },
      { title: 'Discussion', level: 1, children: ['Analysis', 'Limitations', 'Comparison with Prior Work'] },
    ],
    createdTime: '2025-10-15T00:00:00Z',
  },
  {
    id: 'tpl-005',
    name: '综述论文模板',
    degree: 'master',
    wordRange: { min: 10000, max: 20000 },
    description: '适用于综述类论文，系统性文献回顾结构',
    outline: [
      { title: '引言', level: 1, children: ['研究领域概述', '综述范围与方法', '文章结构'] },
      { title: '背景知识', level: 1, children: ['基本概念', '发展历程', '分类体系'] },
      { title: '方法与技术综述', level: 1, children: ['传统方法', '深度学习方法', '最新进展'] },
      { title: '应用场景', level: 1, children: ['场景一', '场景二', '场景三'] },
      { title: '挑战与展望', level: 1, children: ['当前挑战', '发展趋势', '开放问题'] },
      { title: '总结', level: 1, children: ['主要发现', '研究建议'] },
    ],
    createdTime: '2025-11-01T00:00:00Z',
  },
]

const PROJECTS = [
  {
    id: 'thesis-001',
    title: '基于大语言模型的多智能体协作框架研究',
    stage: 'content_writing',
    degree: 'master',
    major: '计算机科学与技术',
    supervisor: '张教授',
    templateId: 'tpl-002',
    wordCount: 14400,
    targetWordCount: 30000,
    progress: 48,
    abstract: '本文针对当前大语言模型在复杂任务处理中的局限性，提出了一种基于多智能体协作的框架...',
    keywords: ['大语言模型', '多智能体系统', 'MCP协议', '工具调用'],
    userId: MOCK_USER.userId,
    createdTime: '2026-01-15T08:00:00Z',
    updatedTime: '2026-03-18T14:30:00Z',
  },
  {
    id: 'thesis-002',
    title: '社交媒体用户行为分析与推荐系统设计',
    stage: 'revision',
    degree: 'bachelor',
    major: '软件工程',
    supervisor: '李教授',
    templateId: 'tpl-001',
    wordCount: 11000,
    targetWordCount: 15000,
    progress: 80,
    abstract: '本文基于社交媒体平台的用户行为数据，设计并实现了一个融合协同过滤与内容推荐的混合推荐系统...',
    keywords: ['推荐系统', '用户行为分析', '协同过滤', '社交媒体'],
    userId: MOCK_USER.userId,
    createdTime: '2025-12-01T10:00:00Z',
    updatedTime: '2026-03-15T09:20:00Z',
  },
  {
    id: 'thesis-003',
    title: '量子计算在密码学中的应用前景',
    stage: 'outline_design',
    degree: 'doctor',
    major: '信息安全',
    supervisor: '王教授',
    templateId: 'tpl-003',
    wordCount: 5000,
    targetWordCount: 80000,
    progress: 15,
    abstract: '',
    keywords: ['量子计算', '后量子密码学', 'Shor算法', '格密码'],
    userId: MOCK_USER.userId,
    createdTime: '2026-02-20T08:00:00Z',
    updatedTime: '2026-03-10T16:45:00Z',
  },
]

function buildOutlineForProject(projectId: string) {
  if (projectId === 'thesis-001') {
    return [
      {
        id: 'node-ch1', projectId, parentId: null, level: 1, sortOrder: 0,
        title: '第一章 绪论', description: '', targetWordCount: 4000, actualWordCount: 3500, status: 'completed',
        children: [
          { id: 'node-ch1-1', projectId, parentId: 'node-ch1', level: 2, sortOrder: 0, title: '1.1 研究背景', description: '', targetWordCount: 1500, actualWordCount: 1500, status: 'completed', children: [] },
          { id: 'node-ch1-2', projectId, parentId: 'node-ch1', level: 2, sortOrder: 1, title: '1.2 研究目的与意义', description: '', targetWordCount: 1000, actualWordCount: 1000, status: 'completed', children: [] },
          { id: 'node-ch1-3', projectId, parentId: 'node-ch1', level: 2, sortOrder: 2, title: '1.3 国内外研究现状', description: '', targetWordCount: 1500, actualWordCount: 1000, status: 'completed', children: [] },
        ],
      },
      {
        id: 'node-ch2', projectId, parentId: null, level: 1, sortOrder: 1,
        title: '第二章 相关技术与理论基础', description: '', targetWordCount: 6000, actualWordCount: 5800, status: 'in_progress',
        children: [
          { id: 'node-ch2-1', projectId, parentId: 'node-ch2', level: 2, sortOrder: 0, title: '2.1 大语言模型概述', description: '', targetWordCount: 2000, actualWordCount: 2000, status: 'completed', children: [] },
          { id: 'node-ch2-2', projectId, parentId: 'node-ch2', level: 2, sortOrder: 1, title: '2.2 多智能体系统理论', description: '', targetWordCount: 2000, actualWordCount: 1500, status: 'in_progress', children: [] },
          { id: 'node-ch2-3', projectId, parentId: 'node-ch2', level: 2, sortOrder: 2, title: '2.3 MCP 协议与工具调用', description: '', targetWordCount: 2000, actualWordCount: 1800, status: 'in_progress', children: [] },
        ],
      },
      {
        id: 'node-ch3', projectId, parentId: null, level: 1, sortOrder: 2,
        title: '第三章 系统设计与实现', description: '', targetWordCount: 8000, actualWordCount: 5100, status: 'draft',
        children: [
          { id: 'node-ch3-1', projectId, parentId: 'node-ch3', level: 2, sortOrder: 0, title: '3.1 系统架构设计', description: '', targetWordCount: 2000, actualWordCount: 2000, status: 'draft', children: [] },
          { id: 'node-ch3-2', projectId, parentId: 'node-ch3', level: 2, sortOrder: 1, title: '3.2 智能体协作策略', description: '', targetWordCount: 3000, actualWordCount: 1500, status: 'draft', children: [] },
          { id: 'node-ch3-3', projectId, parentId: 'node-ch3', level: 2, sortOrder: 2, title: '3.3 工具集成框架', description: '', targetWordCount: 3000, actualWordCount: 1600, status: 'draft', children: [] },
        ],
      },
      {
        id: 'node-ch4', projectId, parentId: null, level: 1, sortOrder: 3,
        title: '第四章 实验与分析', description: '', targetWordCount: 6000, actualWordCount: 0, status: 'pending',
        children: [
          { id: 'node-ch4-1', projectId, parentId: 'node-ch4', level: 2, sortOrder: 0, title: '4.1 实验设计', description: '', targetWordCount: 2000, actualWordCount: 0, status: 'pending', children: [] },
          { id: 'node-ch4-2', projectId, parentId: 'node-ch4', level: 2, sortOrder: 1, title: '4.2 结果分析', description: '', targetWordCount: 4000, actualWordCount: 0, status: 'pending', children: [] },
        ],
      },
      {
        id: 'node-ch5', projectId, parentId: null, level: 1, sortOrder: 4,
        title: '第五章 总结与展望', description: '', targetWordCount: 3000, actualWordCount: 0, status: 'pending',
        children: [
          { id: 'node-ch5-1', projectId, parentId: 'node-ch5', level: 2, sortOrder: 0, title: '5.1 研究总结', description: '', targetWordCount: 1500, actualWordCount: 0, status: 'pending', children: [] },
          { id: 'node-ch5-2', projectId, parentId: 'node-ch5', level: 2, sortOrder: 1, title: '5.2 未来工作展望', description: '', targetWordCount: 1500, actualWordCount: 0, status: 'pending', children: [] },
        ],
      },
    ]
  }
  return []
}

const CHAPTER_CONTENTS: Record<string, { content: string; wordCount: number }> = {
  'node-ch1': {
    content: '随着人工智能技术的快速发展，大语言模型（Large Language Models, LLMs）在自然语言处理领域展现出了前所未有的能力。从GPT-4到Claude，从Gemini到通义千问，这些模型不仅能够理解和生成自然语言，还展现出了初步的推理和规划能力。然而，单一的大语言模型在面对复杂、多步骤任务时仍然存在明显的局限性：幻觉问题导致输出不可靠、上下文窗口限制制约了长程推理能力、缺乏与外部系统交互的原生机制。多智能体协作框架（Multi-Agent Collaboration Framework）被认为是突破这些瓶颈的有效途径。通过将复杂任务分解为多个子任务，由专门化的智能体分别处理，再通过协调机制整合结果，可以显著提升系统的准确性和鲁棒性。',
    wordCount: 3500,
  },
  'node-ch1-1': {
    content: '近年来，以 Transformer 架构为基础的大语言模型取得了令人瞩目的进展。OpenAI 发布的 GPT-4 在多项基准测试中达到了人类水平的表现，Anthropic 的 Claude 系列在长文本理解和安全性方面展现出独特优势，Google 的 Gemini 则在多模态能力上持续突破。这些模型的成功激发了学术界和工业界对于构建更强大 AI 系统的广泛兴趣。然而，现实世界的任务往往涉及多个领域的知识、多种工具的协调使用以及复杂的决策链路。单一模型在处理这类任务时，常常面临"工具调用不准确"、"规划能力不足"和"缺乏自我纠错机制"等问题。这些挑战促使研究者开始探索多智能体协作的新范式。',
    wordCount: 1500,
  },
  'node-ch1-2': {
    content: '本研究旨在设计并实现一个基于大语言模型的多智能体协作框架，通过智能任务分级机制（VoloAI）实现不同复杂度任务的自适应处理。研究意义体现在三个方面：理论层面，丰富了多智能体系统中任务分配与协调的理论模型；技术层面，提出了基于 MCP 协议的工具标准化集成方案，降低了智能体与外部系统对接的复杂度；应用层面，构建了可私有化部署的开源框架，为企业级 AI 应用提供了新的技术路径。',
    wordCount: 1000,
  },
  'node-ch1-3': {
    content: '在多智能体系统研究领域，Park 等人（2023）提出的 Generative Agents 开创性地将大语言模型与社会模拟相结合，展示了智能体社区中涌现的社会行为。Yao 等人（2023）的 ReAct 框架将推理与行动交织进行，显著提升了智能体在需要外部知识的任务上的表现。在工具调用方面，Anthropic 提出的 Model Context Protocol（MCP）为智能体与外部工具的交互提供了标准化协议，被认为是当前最有前景的工具集成方案之一。国内方面，智谱AI、百川智能等团队也在多智能体协作领域进行了积极探索。',
    wordCount: 1000,
  },
  'node-ch2-1': {
    content: '大语言模型（LLM）是基于 Transformer 架构的深度神经网络模型，通过在大规模文本语料上进行预训练，获得了强大的语言理解和生成能力。当前主流的 LLM 可分为三大技术路线：以 GPT-4 为代表的自回归生成模型、以 BERT 为基础的编码器模型，以及兼具编码和解码能力的 T5 系列模型。在参数规模方面，GPT-4 据推测拥有超过一万亿参数，采用了混合专家（MoE）架构以平衡计算效率与模型容量。注意力机制是 LLM 的核心组件，通过 Query-Key-Value 的计算方式实现序列中长距离依赖的建模。近期的研究热点包括：扩展上下文窗口（如 Anthropic 的 200K token 支持）、指令微调（Instruction Tuning）、基于人类反馈的强化学习（RLHF）以及检索增强生成（RAG）等。',
    wordCount: 2000,
  },
  'node-ch2-2': {
    content: '多智能体系统（Multi-Agent System, MAS）是分布式人工智能的重要研究方向。在经典定义中，智能体是具有自主性、反应性、主动性和社会性的计算实体。多智能体系统的核心问题包括：任务分配机制（如何将复杂任务分解并分配给各个智能体）、协调策略（智能体之间如何协商和合作）、通信协议（信息如何在智能体之间传递）以及冲突解决（当智能体意见不一致时如何决策）。',
    wordCount: 1500,
  },
  'node-ch2-3': {
    content: 'Model Context Protocol（MCP）是 Anthropic 于 2024 年提出的开放标准协议，旨在为大语言模型与外部工具、数据源之间的交互提供统一的通信规范。在传统的工具调用范式中，每个 LLM 平台定义了各自不同的函数调用（Function Calling）接口格式，导致工具开发者需要为不同平台重复适配，极大地增加了集成成本。MCP 协议通过定义标准化的消息格式、工具描述模式和执行流程，实现了"一次开发、多处运行"的工具集成目标。\n\nMCP 协议的核心架构采用客户端-服务器模型。MCP Host（宿主）是发起连接的 LLM 应用程序，MCP Client（客户端）负责维护与服务器的一对一连接，MCP Server（服务器）则暴露具体的工具能力。三者之间通过 JSON-RPC 2.0 协议进行通信，支持同步请求-响应和异步通知两种消息模式。协议定义了三种核心原语：Tools（工具）允许模型执行具有副作用的操作，如数据库查询、文件写入；Resources（资源）提供只读的结构化数据访问，类似于 REST API 的 GET 端点；Prompts（提示模板）则封装了可复用的交互模板。\n\n在工具调用流程方面，MCP 遵循严格的生命周期管理。首先，客户端通过 initialize 握手与服务器建立连接并协商能力（Capability Negotiation）；随后，客户端可通过 tools/list 请求获取服务器暴露的所有可用工具及其 JSON Schema 描述；当 LLM 决定调用某个工具时，客户端发送 tools/call 请求，携带工具名称和参数；服务器执行工具逻辑后返回结构化结果。这一流程确保了工具调用的可追溯性和安全性。\n\n与现有工具调用方案相比，MCP 协议具有显著优势。OpenAI 的 Function Calling 虽然使用广泛，但工具描述与平台 API 紧密耦合，缺乏跨平台互操作性。LangChain 的 Tool 抽象层提供了一定程度的统一接口，但本质上是应用层的封装而非协议层的标准化。MCP 则从协议层面定义了完整的通信标准，支持本地进程（stdio）和远程服务（HTTP + SSE）两种传输方式，具备更强的扩展性和适用性。此外，MCP 协议内置了安全机制，包括工具调用的人机确认（Human-in-the-Loop）、权限分级控制以及敏感操作审计日志等。\n\n在本研究的多智能体协作框架中，MCP 协议扮演着工具集成中间件的角色。每个专业化智能体通过 MCP 客户端连接到相应的工具服务器，实现了智能体能力的动态扩展。例如，数据分析智能体可通过 MCP 连接数据库查询服务器和可视化服务器，代码生成智能体可连接代码执行沙箱和版本控制服务器。这种松耦合的工具集成方式使得系统具备良好的可扩展性——新增工具能力只需部署对应的 MCP Server，无需修改智能体核心逻辑。',
    wordCount: 1800,
  },
  'node-ch3-1': {
    content: '本系统采用分层架构设计，自上而下分为表示层、应用层、领域层和基础设施层。表示层基于 Vue 3 和 TypeScript 实现，负责用户交互和实时数据展示；应用层使用 Spring Boot 构建，处理业务编排和流程控制；领域层封装核心业务逻辑，包括智能体管理、任务分级、会话管理等领域模型；基础设施层负责与外部系统对接，包括 LLM API 调用、MCP 工具管理和数据持久化。系统通过 SSE（Server-Sent Events）实现流式响应，确保用户在 AI 推理过程中获得实时反馈。\n\n在具体实现中，系统架构遵循领域驱动设计（DDD）的分层原则。接入层（real-agent-web）作为系统的统一入口，负责 HTTP 请求路由、参数校验和响应格式化，采用 Spring WebFlux 实现全异步非阻塞的请求处理。应用层（real-agent-application）编排领域服务，实现跨领域的业务流程协调，如多智能体任务分发流程中涉及的任务解析、智能体选择和结果聚合。领域层（real-agent-domain）封装核心业务实体和仓储接口，定义了 Agent、Conversation、Message 等核心领域模型。基础设施层（real-agent-infrastructure）实现领域层定义的接口，提供具体的技术实现，包括 R2DBC 数据库访问、Redis 缓存管理、LLM API 集成以及 MCP 服务器连接管理。\n\n系统的核心创新在于智能任务分级机制（VoloAI Strategy）。当用户提交请求后，系统首先通过轻量级分类模型对任务复杂度进行评估，将任务分为三个等级：简单查询（Level 1）直接由单个通用智能体处理；中等复杂度任务（Level 2）由专业化智能体配合工具调用完成；高复杂度任务（Level 3）则启动多智能体协作流程，由协调器（Orchestrator）分配子任务给多个专业智能体并行处理，最后由汇总器（Aggregator）整合结果。这种分级机制有效平衡了响应速度与处理质量，避免了简单任务过度消耗计算资源的问题。',
    wordCount: 2000,
  },
  'node-ch3-2': {
    content: '智能体协作策略是本框架的核心创新之一，其目标是实现多个专业化智能体之间的高效协调与任务分工。本文提出了一种基于角色分配与动态协商的协作策略，包含三个关键机制：角色定义机制、任务分解机制和结果融合机制。\n\n角色定义机制为每个智能体赋予特定的专业能力配置（Capability Profile）。在系统中，智能体按功能划分为以下角色：规划器（Planner）负责将复杂任务分解为可执行的子任务序列，分配器（Dispatcher）根据子任务特征选择最合适的执行智能体，执行器（Executor）携带特定领域知识和工具访问权限完成具体子任务，审查器（Reviewer）对执行结果进行质量评估和错误检测。每种角色的系统提示词（System Prompt）经过精心设计，融入了领域知识、行为约束和输出格式要求。\n\n任务分解机制采用递归分解策略。当系统接收到一个复杂任务时，规划器首先生成初始任务计划（Task Plan），以有向无环图（DAG）的形式表示子任务之间的依赖关系。无依赖的子任务可以并行执行，有依赖的子任务则按拓扑排序顺序串行处理。每个子任务包含明确的输入描述、预期输出格式、所需工具列表和验收标准。这种结构化的任务表示使得分配器能够准确匹配智能体能力与任务需求。\n\n结果融合机制负责将多个智能体的输出整合为最终结果。系统采用基于置信度的加权融合策略：每个执行器在完成子任务后返回结果及自评置信度分数（0-1），审查器对结果进行独立评估并给出外部评分。最终结果通过加权聚合生成，权重由内部置信度和外部评分共同决定。当出现智能体间结果冲突时，系统启动辩论协议（Debate Protocol），由冲突双方分别陈述理由，最后由仲裁智能体做出最终决策。\n\n协作通信方面，智能体之间通过结构化消息进行交互，消息格式遵循统一的 JSON Schema 定义。每条消息包含发送者标识、接收者标识、消息类型（任务分配、结果返回、协商请求、状态更新等）、负载内容和时间戳。系统维护一个全局消息总线，支持点对点通信和广播通信两种模式。为防止消息风暴，系统设置了每轮通信的最大消息数限制和超时机制。',
    wordCount: 1500,
  },
  'node-ch3-3': {
    content: '工具集成框架是本系统实现智能体能力扩展的关键基础设施。基于 MCP 协议，本文设计了一套完整的工具生命周期管理方案，涵盖工具注册、发现、调用、监控和回收五个阶段。\n\n在工具注册阶段，系统支持两种注册方式：静态注册和动态注册。静态注册适用于系统内置工具，在应用启动时通过配置文件自动加载；动态注册适用于第三方工具，通过管理界面或 API 在运行时添加。每个工具注册时需提供符合 MCP 规范的工具描述（Tool Description），包括工具名称、功能说明、输入参数的 JSON Schema 定义、输出格式描述以及权限要求。系统将注册信息存储在工具注册表（Tool Registry）中，并建立工具能力索引以支持快速查找。\n\n工具发现机制允许智能体根据当前任务需求动态查询可用工具。系统实现了基于语义相似度的工具匹配算法：将任务描述和工具功能说明分别编码为向量表示，通过余弦相似度计算匹配分数，返回 Top-K 最相关的工具列表。此外，系统维护了工具使用历史统计，通过协同过滤算法推荐"在类似任务中常被一起使用"的工具组合。\n\n工具调用阶段实现了安全沙箱执行环境。每次工具调用被封装为一个独立的执行上下文（Execution Context），包含调用参数、超时设置、重试策略和权限令牌。系统根据工具的安全等级采取不同的执行策略：低风险工具（如数据查询、文本处理）自动执行；中风险工具（如文件写入、网络请求）需要用户确认；高风险工具（如系统命令执行、数据删除）需要管理员审批。所有工具调用的请求和响应均被记录在审计日志中，支持事后追溯和异常分析。\n\n在系统实现层面，工具集成框架采用了基于 Spring WebFlux 的响应式架构。工具调用通过 Reactor 的 Mono/Flux 类型实现异步非阻塞处理，支持多个工具的并行调用和结果流式返回。框架内置了熔断器（Circuit Breaker）和限流器（Rate Limiter），防止单个工具故障导致系统级联失败。工具调用结果通过 SSE 通道实时推送给前端，用户可以在工具执行过程中看到中间状态和进度信息。',
    wordCount: 1600,
  },
}

const CITATIONS = [
  { id: 'cite-001', projectId: 'thesis-001', type: 'journal', title: 'Language Models are Few-Shot Learners', authors: ['Brown, T.', 'Mann, B.', 'Ryder, N.', 'Subbiah, M.'], year: 2020, journal: 'Advances in Neural Information Processing Systems', volume: '33', pages: '1877-1901', doi: '10.48550/arXiv.2005.14165', formattedText: 'Brown T, Mann B, Ryder N, et al. Language Models are Few-Shot Learners[J]. Advances in Neural Information Processing Systems, 2020, 33: 1877-1901.', citedInChapters: ['node-ch1', 'node-ch2'], createdTime: '2026-02-01T10:00:00Z' },
  { id: 'cite-002', projectId: 'thesis-001', type: 'conference', title: 'ReAct: Synergizing Reasoning and Acting in Language Models', authors: ['Yao, S.', 'Zhao, J.', 'Yu, D.', 'Du, N.'], year: 2023, conference: 'ICLR 2023', doi: '10.48550/arXiv.2210.03629', formattedText: 'Yao S, Zhao J, Yu D, et al. ReAct: Synergizing Reasoning and Acting in Language Models[C]. ICLR, 2023.', citedInChapters: ['node-ch1', 'node-ch2', 'node-ch3'], createdTime: '2026-02-01T10:05:00Z' },
  { id: 'cite-003', projectId: 'thesis-001', type: 'conference', title: 'Generative Agents: Interactive Simulacra of Human Behavior', authors: ['Park, J.S.', 'O\'Brien, J.C.', 'Cai, C.J.', 'Morris, M.R.'], year: 2023, conference: 'UIST 2023', doi: '10.1145/3586183.3606763', formattedText: 'Park J S, O\'Brien J C, Cai C J, et al. Generative Agents: Interactive Simulacra of Human Behavior[C]. UIST, 2023.', citedInChapters: ['node-ch1', 'node-ch2'], createdTime: '2026-02-01T10:10:00Z' },
  { id: 'cite-004', projectId: 'thesis-001', type: 'conference', title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', authors: ['Wei, J.', 'Wang, X.', 'Schuurmans, D.', 'Bosma, M.'], year: 2022, conference: 'NeurIPS 2022', doi: '10.48550/arXiv.2201.11903', formattedText: 'Wei J, Wang X, Schuurmans D, et al. Chain-of-Thought Prompting Elicits Reasoning in Large Language Models[C]. NeurIPS, 2022.', citedInChapters: ['node-ch1', 'node-ch2'], createdTime: '2026-02-02T08:00:00Z' },
  { id: 'cite-005', projectId: 'thesis-001', type: 'journal', title: 'A Survey on LLM-based Multi-Agent Systems', authors: ['Wang, L.', 'Ma, C.', 'Feng, X.', 'Zhang, Z.'], year: 2024, journal: 'ACM Computing Surveys', volume: '56', pages: '1-38', doi: '10.1145/3639057', formattedText: 'Wang L, Ma C, Feng X, et al. A Survey on LLM-based Multi-Agent Systems[J]. ACM Computing Surveys, 2024, 56: 1-38.', citedInChapters: ['node-ch1', 'node-ch2', 'node-ch3'], createdTime: '2026-02-02T08:10:00Z' },
  { id: 'cite-006', projectId: 'thesis-001', type: 'journal', title: 'Attention Is All You Need', authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.', 'Uszkoreit, J.'], year: 2017, journal: 'Advances in Neural Information Processing Systems', volume: '30', pages: '5998-6008', doi: '10.48550/arXiv.1706.03762', formattedText: 'Vaswani A, Shazeer N, Parmar N, et al. Attention Is All You Need[J]. NeurIPS, 2017, 30: 5998-6008.', citedInChapters: ['node-ch2'], createdTime: '2026-02-03T09:00:00Z' },
  { id: 'cite-007', projectId: 'thesis-001', type: 'conference', title: 'Toolformer: Language Models Can Teach Themselves to Use Tools', authors: ['Schick, T.', 'Dwivedi-Yu, J.', 'Dessì, R.', 'Raileanu, R.'], year: 2023, conference: 'NeurIPS 2023', doi: '10.48550/arXiv.2302.04761', formattedText: 'Schick T, Dwivedi-Yu J, Dessì R, et al. Toolformer: Language Models Can Teach Themselves to Use Tools[C]. NeurIPS, 2023.', citedInChapters: ['node-ch2', 'node-ch3'], createdTime: '2026-02-03T09:15:00Z' },
  { id: 'cite-008', projectId: 'thesis-001', type: 'journal', title: 'AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation', authors: ['Wu, Q.', 'Bansal, G.', 'Zhang, J.', 'Wu, Y.'], year: 2023, journal: 'arXiv preprint', doi: '10.48550/arXiv.2308.08155', formattedText: 'Wu Q, Bansal G, Zhang J, et al. AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation[J]. arXiv preprint, 2023.', citedInChapters: ['node-ch1', 'node-ch3'], createdTime: '2026-02-04T10:00:00Z' },
  { id: 'cite-009', projectId: 'thesis-001', type: 'conference', title: 'HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face', authors: ['Shen, Y.', 'Song, K.', 'Tan, X.', 'Li, D.'], year: 2023, conference: 'NeurIPS 2023', doi: '10.48550/arXiv.2303.17580', formattedText: 'Shen Y, Song K, Tan X, et al. HuggingGPT: Solving AI Tasks with ChatGPT and its Friends in Hugging Face[C]. NeurIPS, 2023.', citedInChapters: ['node-ch1', 'node-ch3'], createdTime: '2026-02-04T10:20:00Z' },
  { id: 'cite-010', projectId: 'thesis-001', type: 'journal', title: 'Communicative Agents for Software Development', authors: ['Qian, C.', 'Cong, X.', 'Yang, C.', 'Chen, W.'], year: 2024, journal: 'ACL 2024', pages: '1-18', doi: '10.48550/arXiv.2307.07924', formattedText: 'Qian C, Cong X, Yang C, et al. Communicative Agents for Software Development[C]. ACL, 2024.', citedInChapters: ['node-ch1', 'node-ch3'], createdTime: '2026-02-05T08:00:00Z' },
  { id: 'cite-011', projectId: 'thesis-001', type: 'journal', title: 'Model Context Protocol: A Standard for Tool Integration', authors: ['Anthropic Research'], year: 2024, journal: 'Anthropic Technical Report', formattedText: 'Anthropic Research. Model Context Protocol: A Standard for Tool Integration[R]. Anthropic Technical Report, 2024.', citedInChapters: ['node-ch2', 'node-ch3'], createdTime: '2026-02-05T08:30:00Z' },
  { id: 'cite-012', projectId: 'thesis-001', type: 'book', title: '多智能体系统：算法、博弈论与逻辑基础', authors: ['Shoham, Y.', 'Leyton-Brown, K.'], year: 2009, publisher: 'Cambridge University Press', formattedText: 'Shoham Y, Leyton-Brown K. 多智能体系统：算法、博弈论与逻辑基础[M]. Cambridge University Press, 2009.', citedInChapters: ['node-ch2'], createdTime: '2026-02-06T09:00:00Z' },
  { id: 'cite-013', projectId: 'thesis-001', type: 'conference', title: 'Tree of Thoughts: Deliberate Problem Solving with Large Language Models', authors: ['Yao, S.', 'Yu, D.', 'Zhao, J.', 'Shafran, I.'], year: 2023, conference: 'NeurIPS 2023', doi: '10.48550/arXiv.2305.10601', formattedText: 'Yao S, Yu D, Zhao J, et al. Tree of Thoughts: Deliberate Problem Solving with Large Language Models[C]. NeurIPS, 2023.', citedInChapters: ['node-ch2', 'node-ch3'], createdTime: '2026-02-07T10:00:00Z' },
  { id: 'cite-014', projectId: 'thesis-001', type: 'journal', title: 'LLM-based Multi-Agent Reinforcement Learning: A Survey', authors: ['Chen, S.', 'Li, B.', 'Huang, R.'], year: 2024, journal: 'IEEE Transactions on Neural Networks and Learning Systems', volume: '35', pages: '4812-4830', doi: '10.1109/TNNLS.2024.3358', formattedText: 'Chen S, Li B, Huang R. LLM-based Multi-Agent Reinforcement Learning: A Survey[J]. IEEE Transactions on Neural Networks and Learning Systems, 2024, 35: 4812-4830.', citedInChapters: ['node-ch1', 'node-ch2'], createdTime: '2026-02-08T09:00:00Z' },
  { id: 'cite-015', projectId: 'thesis-001', type: 'conference', title: 'AgentBench: Evaluating LLMs as Agents', authors: ['Liu, X.', 'Yu, H.', 'Zhang, H.', 'Xu, Y.'], year: 2024, conference: 'ICLR 2024', doi: '10.48550/arXiv.2308.03688', formattedText: 'Liu X, Yu H, Zhang H, et al. AgentBench: Evaluating LLMs as Agents[C]. ICLR, 2024.', citedInChapters: ['node-ch1', 'node-ch2', 'node-ch3'], createdTime: '2026-02-09T11:00:00Z' },
]

const HISTORY_ENTRIES = [
  { id: 'hist-001', projectId: 'thesis-001', action: 'create_project', description: '创建论文项目', userId: MOCK_USER.userId, timestamp: '2026-01-15T08:00:00Z' },
  { id: 'hist-002', projectId: 'thesis-001', action: 'update_outline', description: '初始化论文大纲结构', userId: MOCK_USER.userId, timestamp: '2026-01-16T10:30:00Z' },
  { id: 'hist-003', projectId: 'thesis-001', action: 'write_chapter', description: '完成第一章 1.1 研究背景初稿', userId: MOCK_USER.userId, timestamp: '2026-01-20T14:00:00Z' },
  { id: 'hist-004', projectId: 'thesis-001', action: 'add_citation', description: '添加 12 篇参考文献', userId: MOCK_USER.userId, timestamp: '2026-02-01T10:00:00Z' },
  { id: 'hist-005', projectId: 'thesis-001', action: 'write_chapter', description: '完成第一章 1.2 研究目的与意义', userId: MOCK_USER.userId, timestamp: '2026-02-05T16:00:00Z' },
  { id: 'hist-006', projectId: 'thesis-001', action: 'write_chapter', description: '完成第一章 1.3 国内外研究现状', userId: MOCK_USER.userId, timestamp: '2026-02-10T11:00:00Z' },
  { id: 'hist-007', projectId: 'thesis-001', action: 'ai_assist', description: 'AI 辅助生成第二章 2.1 大语言模型概述', userId: MOCK_USER.userId, timestamp: '2026-02-15T09:00:00Z' },
  { id: 'hist-008', projectId: 'thesis-001', action: 'write_chapter', description: '开始撰写第二章 2.2 多智能体系统理论', userId: MOCK_USER.userId, timestamp: '2026-02-20T13:00:00Z' },
  { id: 'hist-009', projectId: 'thesis-001', action: 'format_check', description: '执行全文格式检查，发现 5 个问题', userId: MOCK_USER.userId, timestamp: '2026-03-01T10:00:00Z' },
  { id: 'hist-010', projectId: 'thesis-001', action: 'write_chapter', description: '完成第三章 3.1 系统架构设计初稿', userId: MOCK_USER.userId, timestamp: '2026-03-10T15:00:00Z' },
  { id: 'hist-011', projectId: 'thesis-001', action: 'update_outline', description: '调整第四章结构，拆分实验与分析', userId: MOCK_USER.userId, timestamp: '2026-03-15T09:30:00Z' },
  { id: 'hist-012', projectId: 'thesis-001', action: 'revision', description: '修订第一章绪论，补充最新文献引用', userId: MOCK_USER.userId, timestamp: '2026-03-18T14:30:00Z' },
]

function buildVersionHistory(nodeId: string, chapterData: { content: string; wordCount: number }) {
  const fullContent = chapterData.content
  // 版本3：当前最新版（完整内容）
  const v3Content = fullContent
  // 版本2：约85%的内容（模拟中间修改版）
  const v2Len = Math.floor(fullContent.length * 0.85)
  const v2Content = fullContent.substring(0, v2Len) + '……（待补充）'
  // 版本1：约60%的内容（初稿）
  const v1Len = Math.floor(fullContent.length * 0.6)
  const v1Content = fullContent.substring(0, v1Len) + '……（初稿待完善）'

  const histories = [
    {
      id: `ver-${nodeId}-3`,
      chapterId: nodeId,
      version: 3,
      wordCount: chapterData.wordCount,
      changeDescription: '补充最新文献引用，优化语言表达，修正术语统一性问题',
      createdTime: '2026-03-15T14:00:00Z',
      content: v3Content,
    },
    {
      id: `ver-${nodeId}-2`,
      chapterId: nodeId,
      version: 2,
      wordCount: Math.floor(chapterData.wordCount * 0.85),
      changeDescription: '增加案例分析，完善论证逻辑，补充对比实验描述',
      createdTime: '2026-02-28T10:30:00Z',
      content: v2Content,
    },
    {
      id: `ver-${nodeId}-1`,
      chapterId: nodeId,
      version: 1,
      wordCount: Math.floor(chapterData.wordCount * 0.6),
      changeDescription: '初稿完成，包含基本框架和核心论点',
      createdTime: '2026-02-10T16:00:00Z',
      content: v1Content,
    },
  ]

  // 对部分章节添加额外版本（模拟更丰富的修订历史）
  if (nodeId === 'node-ch1-1' || nodeId === 'node-ch1') {
    histories.push({
      id: `ver-${nodeId}-4`,
      chapterId: nodeId,
      version: 4,
      wordCount: chapterData.wordCount + 200,
      changeDescription: '根据导师反馈修改：强化研究动机陈述，补充2025年最新进展',
      createdTime: '2026-03-18T09:30:00Z',
      content: fullContent + '\n\n进入2025年，大语言模型领域呈现出多模态融合与推理能力深化的双重趋势。OpenAI 的 o1 系列模型展示了通过链式推理（Chain-of-Thought）显著提升复杂问题解决能力的可能性，而 Anthropic 的 Claude 3.5 Sonnet 则在代码生成和长文本理解方面刷新了多项基准。',
    })
    // 按版本号倒序排列
    histories.sort((a, b) => b.version - a.version)
  }

  return histories
}

function buildFormatCheckResults(isChapter: boolean) {
  const items = [
    { id: mockId('fc'), category: 'font', severity: 'error', message: '正文字体应为宋体小四号，当前部分段落使用了微软雅黑', location: isChapter ? '第2段' : '第二章 第3节', suggestion: '统一修改为宋体小四号（12pt）' },
    { id: mockId('fc'), category: 'spacing', severity: 'error', message: '段落首行缩进应为2个字符，发现0缩进段落', location: isChapter ? '第5段' : '第三章 第1节', suggestion: '设置首行缩进为2字符' },
    { id: mockId('fc'), category: 'heading', severity: 'warning', message: '三级标题编号格式不一致，部分使用"1.1.1"，部分使用"（1）"', location: isChapter ? '标题区域' : '全文', suggestion: '统一使用"X.X.X"格式的三级编号' },
    { id: mockId('fc'), category: 'citation', severity: 'warning', message: '参考文献引用格式应为上标"[1]"，当前部分为行内格式', location: isChapter ? '第3段' : '第一章 第3节', suggestion: '将所有引用标注修改为上标格式' },
    { id: mockId('fc'), category: 'figure', severity: 'info', message: '图片标题建议使用"图X-X"格式，当前使用"图X.X"', location: isChapter ? '图1' : '第三章', suggestion: '按照学校论文模板要求统一图表编号格式' },
    { id: mockId('fc'), category: 'margin', severity: 'error', message: '页边距不符合要求：上2.5cm、下2.5cm、左3cm、右2cm', location: '全局', suggestion: '调整页面设置中的边距参数' },
    { id: mockId('fc'), category: 'lineSpacing', severity: 'warning', message: '正文行距应为1.5倍行距，部分段落为单倍行距', location: isChapter ? '第4-6段' : '第二章', suggestion: '选中全文设置1.5倍行距' },
  ]
  return items
}

function buildScholarResults(query: string) {
  return [
    { id: mockId('scholar'), title: `${query} - A Comprehensive Survey`, authors: ['Zhang, W.', 'Liu, H.', 'Chen, X.'], year: 2024, journal: 'IEEE Transactions on AI', citations: 156, abstract: `This paper provides a comprehensive survey of ${query}, covering recent advances and future directions...`, doi: '10.1109/TAI.2024.001', url: 'https://example.com/paper1' },
    { id: mockId('scholar'), title: `Advances in ${query}: Methods and Applications`, authors: ['Li, Y.', 'Wang, J.'], year: 2023, journal: 'ACM Computing Surveys', citations: 89, abstract: `We review the state-of-the-art methods in ${query} and discuss their practical applications...`, doi: '10.1145/3639058', url: 'https://example.com/paper2' },
    { id: mockId('scholar'), title: `Deep Learning Approaches for ${query}`, authors: ['Kim, S.', 'Park, H.', 'Lee, J.'], year: 2024, conference: 'AAAI 2024', citations: 42, abstract: `This paper proposes a novel deep learning framework for ${query}...`, doi: '10.1609/aaai.2024.001', url: 'https://example.com/paper3' },
    { id: mockId('scholar'), title: `Rethinking ${query} in the Era of Foundation Models`, authors: ['Brown, A.', 'Smith, R.'], year: 2025, journal: 'Nature Machine Intelligence', citations: 210, abstract: `Foundation models have transformed the landscape of ${query}. We analyze the implications...`, doi: '10.1038/s42256-025-001', url: 'https://example.com/paper4' },
    { id: mockId('scholar'), title: `Benchmarking ${query}: Challenges and Opportunities`, authors: ['Wu, T.', 'Zhao, M.', 'Yang, L.'], year: 2024, conference: 'ICML 2024', citations: 67, abstract: `We propose new benchmarks for evaluating ${query} systems and identify key challenges...`, doi: '10.5555/icml2024.001', url: 'https://example.com/paper5' },
  ]
}

function buildTopicRecommendations() {
  return [
    { id: mockId('topic'), title: '基于检索增强生成的领域知识问答系统研究', description: '将 RAG 技术与领域专业知识库结合，提升大模型在垂直领域的准确性', keywords: ['RAG', '知识问答', '领域适配'], difficulty: 'medium', relevance: 0.92 },
    { id: mockId('topic'), title: '多模态大模型在智能教育中的应用与评估', description: '探索多模态 AI 在个性化学习路径推荐、自动批改等教育场景的应用', keywords: ['多模态', '智能教育', '个性化学习'], difficulty: 'medium', relevance: 0.88 },
    { id: mockId('topic'), title: '面向代码生成的大语言模型安全性分析', description: '研究 LLM 生成代码中的安全漏洞检测与自动修复方法', keywords: ['代码生成', '安全分析', 'LLM'], difficulty: 'high', relevance: 0.85 },
    { id: mockId('topic'), title: '基于强化学习的智能体自主决策框架设计', description: '结合 RLHF 与环境交互反馈，提升智能体在开放域任务中的决策能力', keywords: ['强化学习', '自主决策', '智能体'], difficulty: 'high', relevance: 0.90 },
    { id: mockId('topic'), title: '联邦学习环境下的大模型微调隐私保护研究', description: '在保护用户数据隐私的前提下实现大模型的分布式微调', keywords: ['联邦学习', '隐私保护', '微调'], difficulty: 'high', relevance: 0.83 },
  ]
}

function buildGuidedQuestions() {
  return {
    questions: [
      { id: mockId('q'), question: '你的研究主要解决的核心问题是什么？与现有方法相比有什么独特之处？', purpose: '帮助明确研究贡献点', category: 'research_focus' },
      { id: mockId('q'), question: '你计划使用什么数据集或实验环境来验证你的方法？评估指标是什么？', purpose: '帮助规划实验设计', category: 'experiment' },
      { id: mockId('q'), question: '你的方法在哪些场景下可能不适用？有什么已知的局限性？', purpose: '帮助完善讨论部分', category: 'limitation' },
      { id: mockId('q'), question: '请描述你方法的关键技术流程，从输入到输出经历了哪些步骤？', purpose: '帮助组织方法论章节', category: 'methodology' },
      { id: mockId('q'), question: '你的研究成果可以如何应用到实际产品或系统中？', purpose: '帮助思考实践价值', category: 'application' },
    ],
  }
}

// ==================== URL Query Param Helper ====================

function getQueryParam(url: string, key: string): string {
  const qs = url.split('?')[1]
  if (!qs) return ''
  const params = new URLSearchParams(qs)
  return params.get(key) ?? ''
}

// ==================== Handler ====================

export default function thesisMock(config: InternalAxiosRequestConfig): any | null {
  const url = config.url ?? ''
  const method = (config.method || 'get').toLowerCase()

  // ==================== Fixed paths (no params) ====================

  // POST /thesis/outline/operate
  if (match('/thesis/outline/operate', url) && method === 'post') {
    const body = parseBody(config.data)
    return ok({
      id: body.nodeId || mockId('outline'),
      projectId: body.projectId || '',
      parentId: body.parentId || null,
      level: body.level || 1,
      sortOrder: body.sortOrder || 0,
      title: body.title || '新章节',
      description: body.description || '',
      targetWordCount: body.targetWordCount || 2000,
      actualWordCount: 0,
      status: 'pending',
      children: [],
    })
  }

  // POST /thesis/topics/recommend
  if (match('/thesis/topics/recommend', url) && method === 'post') {
    return ok(buildTopicRecommendations())
  }

  // POST /thesis/guided/questions
  if (match('/thesis/guided/questions', url) && method === 'post') {
    return ok(buildGuidedQuestions())
  }

  // GET /thesis/scholar/search
  if (match('/thesis/scholar/search', url) && method === 'get') {
    const query = getQueryParam(url, 'query') || 'multi-agent'
    return ok(buildScholarResults(query))
  }

  // GET /thesis/templates (list)
  if (match('/thesis/templates', url) && method === 'get') {
    return ok(TEMPLATES)
  }

  // GET /thesis/templates/:id
  if (match('/thesis/templates/:id', url) && method === 'get') {
    const tplId = param('/thesis/templates/:id', url, 'id')
    const tpl = TEMPLATES.find(t => t.id === tplId)
    return tpl ? ok(tpl) : error(404, '模板不存在')
  }

  // ==================== Chapters — specific first ====================

  // POST /thesis/chapters/:id/versions/:v/restore
  if (match('/thesis/chapters/:id/versions/:v/restore', url) && method === 'post') {
    const nodeId = param('/thesis/chapters/:id/versions/:v/restore', url, 'id')
    const version = param('/thesis/chapters/:id/versions/:v/restore', url, 'v')
    const chapterData = CHAPTER_CONTENTS[nodeId]
    return ok({
      id: mockId('chapter-content'),
      nodeId,
      content: chapterData?.content || '（已恢复的历史版本内容）',
      wordCount: chapterData?.wordCount || 0,
      version: parseInt(version) || 1,
      createdTime: '2026-03-01T10:00:00Z',
      updatedTime: new Date().toISOString(),
      isCurrent: true,
    })
  }

  // GET /thesis/chapters/:id/versions
  if (match('/thesis/chapters/:id/versions', url) && method === 'get') {
    const nodeId = param('/thesis/chapters/:id/versions', url, 'id')
    const chapterData = CHAPTER_CONTENTS[nodeId]
    if (!chapterData) return ok([])
    const versions = buildVersionHistory(nodeId, chapterData)
    return ok(versions)
  }

  // POST /thesis/chapters/:id/format-check
  if (match('/thesis/chapters/:id/format-check', url) && method === 'post') {
    return ok(buildFormatCheckResults(true))
  }

  // GET /thesis/chapters/:id/content
  if (match('/thesis/chapters/:id/content', url) && method === 'get') {
    const nodeId = param('/thesis/chapters/:id/content', url, 'id')
    const chapterData = CHAPTER_CONTENTS[nodeId]
    return ok({
      id: mockId('chapter-content'),
      nodeId,
      content: chapterData?.content || '',
      wordCount: chapterData?.wordCount || 0,
      version: 3,
      createdTime: '2026-02-10T16:00:00Z',
      updatedTime: '2026-03-15T14:00:00Z',
      isCurrent: true,
    })
  }

  // PUT /thesis/chapters/:id/content
  if (match('/thesis/chapters/:id/content', url) && method === 'put') {
    const nodeId = param('/thesis/chapters/:id/content', url, 'id')
    const body = parseBody(config.data)
    const content = body.content || ''
    return ok({
      id: mockId('chapter-content'),
      nodeId,
      content,
      wordCount: content.length,
      version: 4,
      createdTime: '2026-02-10T16:00:00Z',
      updatedTime: new Date().toISOString(),
      isCurrent: true,
    })
  }

  // ==================== Citations ====================

  // PUT /thesis/citations/:id
  if (match('/thesis/citations/:id', url) && method === 'put') {
    const body = parseBody(config.data)
    const citId = param('/thesis/citations/:id', url, 'id')
    const existing = CITATIONS.find(c => c.id === citId)
    return ok({ ...(existing || {}), ...body, id: citId, updatedTime: new Date().toISOString() })
  }

  // DELETE /thesis/citations/:id
  if (match('/thesis/citations/:id', url) && method === 'delete') {
    return ok(null)
  }

  // ==================== Projects — specific sub-paths first ====================

  // GET /thesis/projects/:id/export/word
  if (match('/thesis/projects/:id/export/word', url) && method === 'get') {
    const projectId = param('/thesis/projects/:id/export/word', url, 'id')
    const project = PROJECTS.find(p => p.id === projectId)
    return ok({ message: `论文《${project?.title || '未知'}》Word 文档已生成`, filename: `${project?.title || 'thesis'}.docx`, size: 256000 })
  }

  // GET /thesis/projects/:id/export/pdf
  if (match('/thesis/projects/:id/export/pdf', url) && method === 'get') {
    const projectId = param('/thesis/projects/:id/export/pdf', url, 'id')
    const project = PROJECTS.find(p => p.id === projectId)
    return ok({ message: `论文《${project?.title || '未知'}》PDF 文档已生成`, filename: `${project?.title || 'thesis'}.pdf`, size: 512000 })
  }

  // PUT /thesis/projects/:id/outline/reorder
  if (match('/thesis/projects/:id/outline/reorder', url) && method === 'put') {
    return ok(null)
  }

  // GET /thesis/projects/:id/outline
  if (match('/thesis/projects/:id/outline', url) && method === 'get') {
    const projectId = param('/thesis/projects/:id/outline', url, 'id')
    return ok(buildOutlineForProject(projectId))
  }

  // POST /thesis/projects/:id/format-check
  if (match('/thesis/projects/:id/format-check', url) && method === 'post') {
    return ok(buildFormatCheckResults(false))
  }

  // GET /thesis/projects/:id/citations
  if (match('/thesis/projects/:id/citations', url) && method === 'get') {
    const projectId = param('/thesis/projects/:id/citations', url, 'id')
    return ok(CITATIONS.filter(c => c.projectId === projectId))
  }

  // POST /thesis/projects/:id/citations
  if (match('/thesis/projects/:id/citations', url) && method === 'post') {
    const projectId = param('/thesis/projects/:id/citations', url, 'id')
    const body = parseBody(config.data)
    return ok({
      id: mockId('citation'),
      projectId,
      ...body,
      formattedText: body.formattedText || `${(body.authors || ['Unknown']).join(', ')}. ${body.title || ''}[J]. ${body.journal || body.conference || ''}, ${body.year || ''}.`,
      createdTime: new Date().toISOString(),
    })
  }

  // GET /thesis/projects/:id/history
  if (match('/thesis/projects/:id/history', url) && method === 'get') {
    const projectId = param('/thesis/projects/:id/history', url, 'id')
    return ok(HISTORY_ENTRIES.filter(h => h.projectId === projectId))
  }

  // GET /thesis/projects/:id (single project)
  if (match('/thesis/projects/:id', url) && method === 'get') {
    const projectId = param('/thesis/projects/:id', url, 'id')
    const project = PROJECTS.find(p => p.id === projectId)
    return project ? ok(project) : error(404, '论文项目不存在')
  }

  // PUT /thesis/projects/:id
  if (match('/thesis/projects/:id', url) && method === 'put') {
    const projectId = param('/thesis/projects/:id', url, 'id')
    const body = parseBody(config.data)
    const existing = PROJECTS.find(p => p.id === projectId)
    return ok({
      ...(existing || {}),
      ...body,
      id: projectId,
      updatedTime: new Date().toISOString(),
    })
  }

  // DELETE /thesis/projects/:id
  if (match('/thesis/projects/:id', url) && method === 'delete') {
    return ok(null)
  }

  // POST /thesis/projects (create)
  if (match('/thesis/projects', url) && method === 'post') {
    const body = parseBody(config.data)
    const now = new Date().toISOString()
    return ok({
      id: mockId('thesis-project'),
      title: body.title || '新论文项目',
      stage: 'topic_selection',
      degree: body.degree || 'bachelor',
      major: body.major || '',
      supervisor: body.supervisor || '',
      templateId: body.templateId || null,
      wordCount: 0,
      targetWordCount: body.targetWordCount || 10000,
      progress: 0,
      abstract: '',
      keywords: body.keywords || [],
      userId: MOCK_USER.userId,
      createdTime: now,
      updatedTime: now,
    })
  }

  // GET /thesis/projects (list)
  if (match('/thesis/projects', url) && method === 'get') {
    return ok(PROJECTS)
  }

  return null
}
