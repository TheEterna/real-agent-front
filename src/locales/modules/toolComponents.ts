/**
 * Tool / Status / Model / Agent 组件翻译
 * 覆盖: ToolBox, ToolApprovalCard, ToolExecutionCard, ToolResultViewer,
 *       StatusBall, StatusIndicator, ModelSelector, AgentSelector, ErrorMessage
 */

export const toolComponentsZh = {
  compTool: {
    // ── ToolBox ──
    toolBox: {
      defaultName: '工具调用',
      ariaLabel: '工具调用: {name}',
      toggleArgs: '展开/收起入参',
      toggleResponse: '展开/收起响应数据',
      arguments: '入参',
      itemCount: '{count} 项',
      responseData: '响应数据',
      noData: '暂无数据',
    },

    // ── ToolApprovalCard ──
    approval: {
      title: '工具审批',
      toolName: '工具名称',
      args: '参数',
      approve: '批准执行',
      reject: '拒绝',
      openInTools: '在工具页查看',
      noToolName: '未指定工具名',
      executing: '正在执行...',
      done: '执行完成',
      failed: '执行失败',
      rejected: '已拒绝执行',
    },

    // ── ToolExecutionCard ──
    execution: {
      statusPending: '准备中',
      statusExecuting: '执行中',
      statusSuccess: '成功',
      statusError: '失败',
      statusUnknown: '未知',
      arguments: '参数',
      itemCount: '{count} 项',
      noArgs: '无参数',
      result: '结果',
      noResult: '暂无结果',
      errorInfo: '错误信息',
    },

    // ── ToolResultViewer ──
    result: {
      title: '工具执行结果',
      summary: '摘要',
      status: '状态',
      toolName: '工具名称',
      duration: '耗时',
      message: '消息',
      args: '入参',
      resultTab: '结果',
      logs: '日志',
      metrics: '指标',
      raw: '原始数据',
      running: '执行中...',
      success: '成功',
      failed: '失败',
    },

    // ── StatusBall ──
    statusBall: {
      viewPlan: '查看计划',
      progress: '进度 {percent}%',
      generatedFiles: '生成的文件',
      notifications: '通知',
      settings: '设置',
      conversationTree: '对话树',
      justNow: '刚刚',
      minutesAgo: '{count} 分钟前',
      hoursAgo: '{count} 小时前',
      daysAgo: '{count} 天前',
      filesHeader: '生成的文件',
      noFiles: '暂无生成的文件',
      createdAt: '创建时间：{time}',
    },

    // ── StatusIndicator ──
    statusIndicator: {
      running: 'ReAct任务执行中...',
      completed: '任务执行完成',
      error: '任务执行失败',
      idle: '等待中',
    },

    // ── ModelSelector ──
    modelSelector: {
      loading: '加载中...',
      selectModel: '选择模型',
      noModels: '无可用模型',
      providerAliyun: '通义千问',
      providerMoonshot: '月之暗面',
      providerZhipu: '智谱清言',
      providerBaidu: '文心一言',
      providerDoubao: '豆包',
      provider01ai: '零一万物',
    },

    // ── AgentSelector ──
    agentSelector: {
      dialogTitle: '选择 Agent 核心',
      dialogSubtitle: '采用无限连续逻辑架构，打破语境边界。',
      closeLabel: '关闭',
      flagship: '旗舰架构',
      deployLogic: '部署逻辑',
      archDocs: '架构说明',
      logicPreview: '逻辑流预览',
      engineNote: '分布式核心采用 Volo V3.0 无限连续逻辑引擎。',
      agentList: 'Agent 列表',
      selectAgent: '选择 {name} - {desc}',
      // VoloAI agent 内容
      voloTagline: '无限连续架构',
      voloDescription: '采用自研 agent 逻辑架构。支持多模态推理、文件识别、多方式交互、human in loop 以及完全自主的动态策略规划能力。',
      capMultiModal: '多模态推理',
      capHumanInLoop: 'Human in loop',
      capFullAgent: '全自主 Agent',
    },

    // ── ErrorMessage ──
    errorMsg: {
      // 错误类型标题
      timeout: '请求超时',
      rateLimit: 'API 调用限制',
      authFailed: '认证失败',
      networkFailed: '网络连接失败',
      toolError: '工具执行错误',
      llmError: 'AI 模型错误',
      unknownError: '执行错误',
      // 通用标签
      suggestionsTitle: '建议操作',
      technicalTitle: '技术详情',
      sourceLabel: '来源:',
      nodeIdLabel: '节点ID:',
      // 建议 — timeout
      timeoutSug1: '检查网络连接是否稳定',
      timeoutSug2: '稍后重试',
      timeoutSug3: '考虑增加超时时间设置',
      // 建议 — rateLimit
      rateLimitSug1: '等待几分钟后重试',
      rateLimitSug2: '检查 API 配额使用情况',
      rateLimitSug3: '考虑升级 API 套餐',
      // 建议 — auth
      authSug1: '检查 API Key 是否正确配置',
      authSug2: '验证认证凭据是否过期',
      authSug3: '确认服务端配置文件',
      // 建议 — network
      networkSug1: '检查网络连接',
      networkSug2: '验证服务地址是否正确',
      networkSug3: '检查防火墙设置',
      // 建议 — tool
      toolSug1: '确认工具参数是否正确',
      toolSug2: '检查工具是否已正确注册',
      toolSug3: '查看后端日志获取详细信息',
      // 建议 — llm
      llmSug1: '检查模型服务是否正常',
      llmSug2: '验证 API 配置',
      llmSug3: '查看后端日志',
      // 建议 — default
      defaultSug1: '查看详细错误信息',
      defaultSug2: '检查后端日志',
      defaultSug3: '联系技术支持',
    },
  },
}

export const toolComponentsEn = {
  compTool: {
    // ── ToolBox ──
    toolBox: {
      defaultName: 'Tool Call',
      ariaLabel: 'Tool Call: {name}',
      toggleArgs: 'Toggle arguments',
      toggleResponse: 'Toggle response data',
      arguments: 'Arguments',
      itemCount: '{count} items',
      responseData: 'Response Data',
      noData: 'No data',
    },

    // ── ToolApprovalCard ──
    approval: {
      title: 'Tool Approval',
      toolName: 'Tool Name',
      args: 'Arguments',
      approve: 'Approve',
      reject: 'Reject',
      openInTools: 'Open in Tools',
      noToolName: 'No tool name specified',
      executing: 'Executing...',
      done: 'Execution complete',
      failed: 'Execution failed',
      rejected: 'Execution rejected',
    },

    // ── ToolExecutionCard ──
    execution: {
      statusPending: 'Pending',
      statusExecuting: 'Executing',
      statusSuccess: 'Success',
      statusError: 'Failed',
      statusUnknown: 'Unknown',
      arguments: 'Arguments',
      itemCount: '{count} items',
      noArgs: 'No arguments',
      result: 'Result',
      noResult: 'No result yet',
      errorInfo: 'Error Details',
    },

    // ── ToolResultViewer ──
    result: {
      title: 'Tool Execution Result',
      summary: 'Summary',
      status: 'Status',
      toolName: 'Tool Name',
      duration: 'Duration',
      message: 'Message',
      args: 'Arguments',
      resultTab: 'Result',
      logs: 'Logs',
      metrics: 'Metrics',
      raw: 'Raw Data',
      running: 'Running...',
      success: 'Success',
      failed: 'Failed',
    },

    // ── StatusBall ──
    statusBall: {
      viewPlan: 'View Plan',
      progress: 'Progress {percent}%',
      generatedFiles: 'Generated Files',
      notifications: 'Notifications',
      settings: 'Settings',
      conversationTree: 'Conversation Tree',
      justNow: 'Just now',
      minutesAgo: '{count} min ago',
      hoursAgo: '{count} hr ago',
      daysAgo: '{count} days ago',
      filesHeader: 'Generated Files',
      noFiles: 'No files generated',
      createdAt: 'Created: {time}',
    },

    // ── StatusIndicator ──
    statusIndicator: {
      running: 'ReAct task executing...',
      completed: 'Task completed',
      error: 'Task failed',
      idle: 'Idle',
    },

    // ── ModelSelector ──
    modelSelector: {
      loading: 'Loading...',
      selectModel: 'Select Model',
      noModels: 'No models available',
      providerAliyun: 'Qwen',
      providerMoonshot: 'Moonshot',
      providerZhipu: 'Zhipu GLM',
      providerBaidu: 'Ernie',
      providerDoubao: 'Doubao',
      provider01ai: 'Yi',
    },

    // ── AgentSelector ──
    agentSelector: {
      dialogTitle: 'Select Agent Core',
      dialogSubtitle: 'Infinite continuous logic architecture — break the boundary of context.',
      closeLabel: 'Close',
      flagship: 'Flagship',
      deployLogic: 'Deploy Logic',
      archDocs: 'Architecture Docs',
      logicPreview: 'Logic Flow Preview',
      engineNote: 'Distributed core powered by Volo V3.0 Infinite Continuous Logic Engine.',
      agentList: 'Agent List',
      selectAgent: 'Select {name} - {desc}',
      voloTagline: 'Infinite Continuous Architecture',
      voloDescription: 'Proprietary agent logic architecture. Supports multi-modal reasoning, file recognition, multi-interaction, human in loop, and fully autonomous dynamic strategy planning.',
      capMultiModal: 'Multi-modal Reasoning',
      capHumanInLoop: 'Human in Loop',
      capFullAgent: 'Fully Autonomous Agent',
    },

    // ── ErrorMessage ──
    errorMsg: {
      timeout: 'Request Timeout',
      rateLimit: 'API Rate Limit',
      authFailed: 'Authentication Failed',
      networkFailed: 'Network Connection Failed',
      toolError: 'Tool Execution Error',
      llmError: 'AI Model Error',
      unknownError: 'Execution Error',
      suggestionsTitle: 'Suggestions',
      technicalTitle: 'Technical Details',
      sourceLabel: 'Source:',
      nodeIdLabel: 'Node ID:',
      timeoutSug1: 'Check your network connection',
      timeoutSug2: 'Try again later',
      timeoutSug3: 'Consider increasing the timeout setting',
      rateLimitSug1: 'Wait a few minutes and retry',
      rateLimitSug2: 'Check API quota usage',
      rateLimitSug3: 'Consider upgrading your API plan',
      authSug1: 'Verify that the API Key is correctly configured',
      authSug2: 'Check if credentials have expired',
      authSug3: 'Confirm server configuration files',
      networkSug1: 'Check network connection',
      networkSug2: 'Verify the service address',
      networkSug3: 'Check firewall settings',
      toolSug1: 'Verify tool parameters',
      toolSug2: 'Check if the tool is properly registered',
      toolSug3: 'Check backend logs for details',
      llmSug1: 'Check if the model service is running',
      llmSug2: 'Verify API configuration',
      llmSug3: 'Check backend logs',
      defaultSug1: 'View detailed error information',
      defaultSug2: 'Check backend logs',
      defaultSug3: 'Contact technical support',
    },
  },
}
