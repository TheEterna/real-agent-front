/**
 * Plan 模块翻译 — 执行计划侧边栏、可视化、阶段卡片、小部件
 */

export const planZh = {
  plan: {
    sidebar: {
      title: '执行计划',
      minimizeToBall: '缩为状态球',
      emptyTitle: '暂无执行计划',
      emptyDesc: '当 Agent 开始执行复杂任务时，\n这里将显示详细的执行计划',
      goalLabel: '目标',
      statusLabel: '状态:',
      progressLabel: '进度:',
      phaseLabel: '阶段:',
      phaseCount: '{count} 个阶段',
      currentPhase: '当前阶段',
    },
    status: {
      planning: '规划中',
      executing: '执行中',
      completed: '已完成',
      paused: '已暂停',
      failed: '执行失败',
      unknown: '未知状态',
    },
    phaseStatus: {
      todo: '待执行',
      running: '执行中',
      completed: '已完成',
      paused: '已暂停',
      failed: '失败',
      unknown: '未知',
      completedShort: '完成',
    },
    visualization: {
      timeline: '时间线',
      grid: '网格',
      compact: '紧凑',
    },
    phaseCard: {
      phaseIndex: '阶段 {index}',
      titleLabel: '阶段标题',
      descLabel: '阶段描述',
      titlePlaceholder: '请输入阶段标题',
      descPlaceholder: '请输入阶段详细描述',
    },
    widget: {
      artifactTitle: '# 生成的文件\n\n这里将显示 AI 生成的文件内容。',
    },
  },
}

export const planEn = {
  plan: {
    sidebar: {
      title: 'Execution Plan',
      minimizeToBall: 'Minimize to ball',
      emptyTitle: 'No Execution Plan',
      emptyDesc: 'When the Agent starts executing complex tasks,\nthe detailed execution plan will be displayed here',
      goalLabel: 'Goal',
      statusLabel: 'Status:',
      progressLabel: 'Progress:',
      phaseLabel: 'Phases:',
      phaseCount: '{count} phases',
      currentPhase: 'Current Phase',
    },
    status: {
      planning: 'Planning',
      executing: 'Executing',
      completed: 'Completed',
      paused: 'Paused',
      failed: 'Failed',
      unknown: 'Unknown',
    },
    phaseStatus: {
      todo: 'Pending',
      running: 'Running',
      completed: 'Completed',
      paused: 'Paused',
      failed: 'Failed',
      unknown: 'Unknown',
      completedShort: 'Done',
    },
    visualization: {
      timeline: 'Timeline',
      grid: 'Grid',
      compact: 'Compact',
    },
    phaseCard: {
      phaseIndex: 'Phase {index}',
      titleLabel: 'Phase Title',
      descLabel: 'Phase Description',
      titlePlaceholder: 'Enter phase title',
      descPlaceholder: 'Enter phase description',
    },
    widget: {
      artifactTitle: '# Generated Files\n\nThe AI-generated file content will be displayed here.',
    },
  },
}
