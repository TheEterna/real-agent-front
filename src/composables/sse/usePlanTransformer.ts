/**
 * Plan 状态转换模块
 *
 * 负责:
 * - TaskStatus -> PlanPhaseStatus 映射
 * - 计算整体计划状态
 * - PlanWriteEventData -> PlanData 转换
 *
 * 从原 useSSE.ts 提取，保持逻辑完全一致
 */

import {
  type PlanData,
  type PlanWriteEventData,
  type TaskPhaseItem,
  PlanPhaseStatus,
  PlanStatus,
  TaskPhaseStatus
} from '@/types/events'

/**
 * 将后端 TaskStatus 映射到前端 PlanPhaseStatus
 */
export const mapTaskStatusToPlanPhaseStatus = (taskStatus: TaskPhaseStatus): PlanPhaseStatus => {
  switch (taskStatus) {
    case TaskPhaseStatus.TODO:
      return PlanPhaseStatus.TODO
    case TaskPhaseStatus.RUNNING:
      return PlanPhaseStatus.RUNNING
    case TaskPhaseStatus.DONE:
      return PlanPhaseStatus.COMPLETED
    case TaskPhaseStatus.FAILED:
      return PlanPhaseStatus.FAILED
    default:
      return PlanPhaseStatus.TODO
  }
}

/**
 * 根据任务列表状态确定整体计划状态
 */
export const determinePlanStatus = (taskList: { taskStatus: TaskPhaseStatus }[]): PlanStatus => {
  if (!taskList || taskList.length === 0) {
    return PlanStatus.PLANNING
  }

  const hasRunning = taskList.some(t => t.taskStatus === TaskPhaseStatus.RUNNING)
  const allDone = taskList.every(t => t.taskStatus === TaskPhaseStatus.DONE)
  const hasFailed = taskList.some(t => t.taskStatus === TaskPhaseStatus.FAILED)

  if (hasFailed) return PlanStatus.FAILED
  if (allDone) return PlanStatus.COMPLETED
  if (hasRunning) return PlanStatus.EXECUTING
  return PlanStatus.PLANNING
}

/**
 * 将 PlanWriteEventData (后端 TaskModeMeta) 转换为 PlanData 格式
 */
export const transformPlanWriteEventToPlanData = (planWriteData: PlanWriteEventData): PlanData => {
  return {
    goal: planWriteData.goal,
    currentPhaseId: planWriteData.currentTaskId,
    phases: planWriteData.taskPhaseList.map((task: TaskPhaseItem) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      index: task.index,
      // 将后端 TaskStatus 映射到前端 PlanPhaseStatus
      status: mapTaskStatusToPlanPhaseStatus(task.taskStatus)
    })),
    status: determinePlanStatus(planWriteData.taskPhaseList),
    updatedTime: new Date()
  }
}

/**
 * Plan 转换器 composable
 *
 * 提供 Plan 相关的所有转换函数
 */
export function usePlanTransformer() {
  return {
    mapTaskStatusToPlanPhaseStatus,
    determinePlanStatus,
    transformPlanWriteEventToPlanData
  }
}
