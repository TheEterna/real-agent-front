/**
 * useSSE - SSE 流式通信核心模块
 *
 * 重构说明：
 * - 原有 1140 行代码拆分为 5 个子模块
 * - 本文件现为薄层包装，组合子模块功能
 * - 对外 API 保持完全不变，确保向后兼容
 *
 * 子模块：
 * - useSSEConnection: SSE 连接管理 + Token 刷新
 * - useMessageAggregator: 消息聚合逻辑
 * - useSSEEventBus: 事件分发
 * - usePlanTransformer: Plan 状态转换
 * - agents/config: Agent 执行配置
 */

import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { notification } from 'ant-design-vue'
import {
    EventType,
    type BaseEventItem,
    type InitPlanEventData,
    type UpdatePlanEventData,
    type AdvancePlanEventData,
    type PlanWriteEventData
} from '@/types/events'
import { ConnectionStatus, TaskStatus, ProgressInfo } from '@/types/status'
import { NotificationType } from '@/types/notification'
import { AgentType } from '@/types/session'
import { useChatStore } from '@/stores/chatStore'
import type { AttachmentDTO } from '@/api/file'

// 导入拆分后的子模块
import { useSSEConnection } from './sse/useSSEConnection'
import { useMessageAggregator } from './sse/useMessageAggregator'
import { useSSEEventBus } from './sse/useSSEEventBus'
import { transformPlanWriteEventToPlanData } from './sse/usePlanTransformer'
import { AGENT_CONFIGS, VOLO_AI_RESUME_ENDPOINT, VOLO_AI_INTERACTION_ENDPOINT } from './sse/agents/config'
import type { SSEOptions, SSEEventHandlers, AgentExecuteOptions } from './sse/types'

// 重新导出类型，保持向后兼容
export type { SSEOptions, SSEEventHandlers, AgentExecuteOptions }

export function useSSE(options: SSEOptions = {}) {
    // === 使用子模块 ===
    const { connect, closeActiveSource, activeSource } = useSSEConnection()
    const {
        nodeIndex,
        updateMessage,
        updateThoughtMessage,
        updateTaskAnalysisMessage,
        updateReasoningMessage,
        tryUpdateUserMessageTurnId,
        resetNodeIndex
    } = useMessageAggregator()

    // === 响应式状态 ===
    const chatStore = useChatStore()
    const router = useRouter()

    const currentSessionId = ref<string>('')
    const connectionStatus = ref(new ConnectionStatus('disconnected'))
    const taskStatus = ref(new TaskStatus('idle'))
    const progress = ref<ProgressInfo | null>(null)
    const currentTaskTitle = ref<string>('')
    let errorTimeoutId: ReturnType<typeof setTimeout> | null = null

    // === 工具函数 ===
    const scrollToBottom = async () => {
        await nextTick()
        options?.onScrollToBottom?.()
    }

    const ensureDateOrUndefined = (date: any): Date | undefined => {
        if (date == null) return undefined
        if (date instanceof Date) return isNaN(date.getTime()) ? undefined : date
        if (typeof date === 'string' || typeof date === 'number') {
            const parsed = new Date(date)
            return isNaN(parsed.getTime()) ? undefined : parsed
        }
        return undefined
    }

    const normalizeEventDates = (event: BaseEventItem): BaseEventItem => {
        const start = ensureDateOrUndefined((event as any).startTime)
        ;(event as any).startTime = start ?? new Date()

        const end = ensureDateOrUndefined((event as any).endTime)
        if ((event as any).endTime != null) {
            ;(event as any).endTime = end
        }
        return event
    }

    /** 清理所有状态和资源 */
    const cleanup = () => {
        if (errorTimeoutId) { clearTimeout(errorTimeoutId); errorTimeoutId = null }
        closeActiveSource()
        // 清除当前会话的索引（按会话隔离）
        resetNodeIndex(currentSessionId.value)
        progress.value = null
        taskStatus.value.set('idle')
        connectionStatus.value.set('disconnected')
        currentTaskTitle.value = ''
        currentSessionId.value = ''
    }

    // === 默认事件处理器实现 ===
    const defaultHandlers: Required<SSEEventHandlers> = {
        onStarted: (event: BaseEventItem) => {
            console.log('chat started：' + event.message)
            const startTime = event.startTime || new Date()

            // 区分两种 STARTED 事件：
            // 1. 带 data 的事件（Controller 发出）：包含完整 SessionVO，用于更新会话列表
            // 2. 不带 data 的事件（Strategy 发出）：用于更新进度信息

            if (event.data && event.sessionId) {
                // 第一个 STARTED 事件：创建会话
                const sessionVO = event.data as any

                console.log('[useSSE] 收到完整 session 信息（第一次创建会话）:', sessionVO)

                // 更新当前会话 ID
                currentSessionId.value = sessionVO.id

                // 如果会话已预创建（Phase 2），createSessionIfNotExists 检测到会话已存在，不执行转换
                // 如果未预创建（兼容旧逻辑），仍走 createSessionIfNotExists 完成 temp→real 转换
                const result = chatStore.createSessionIfNotExists(
                    sessionVO.id,
                    sessionVO.type as AgentType,
                    sessionVO.title
                )

                if (result.converted) {
                    console.log('[useSSE] 临时会话转为真实会话，更新 URL:', result.sessionId)
                    router.replace({
                        name: 'Chat',
                        params: { sessionId: result.sessionId }
                    })
                }

                // 立即用 STARTED 事件的 parentTurnId 更新用户消息的 turnId
                if (event.parentTurnId) {
                    console.log('[useSSE] STARTED 事件携带 parentTurnId:', event.parentTurnId)
                    tryUpdateUserMessageTurnId(sessionVO.id, event.parentTurnId)
                }

                // 通知 UI 层：新 Turn 已分配 turnId，progress 可挂载到该 turn
                // 注意：STARTED 在 EXCLUDED_MESSAGE_TYPES 中，不会创建消息节点
                // Turn 结构由后续的 THINKING/ACTING 等首条非排除消息建立
                // isTurnProcessing 已处理 turnId 尚未在树中的回退逻辑
                if (event.turnId) {
                    options?.onTurnStarted?.(event.turnId)
                }
            } else {
                // 第二个 STARTED 事件：更新进度信息
                const msg = (event.message || '').toString()
                if (msg.trim()) {
                    progress.value = new ProgressInfo(msg, startTime, event.agentId as any)
                }
            }
        },
        onThinking: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onAction: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onActing: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onObserving: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onExecuting: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onTool: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onToolApproval: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onInteraction: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },
        onProgress: (event: BaseEventItem) => {
            console.log('进度更新了')
            const message = (event.message || '').toString()
            // 后端可能会发送空白 progress（例如占位/心跳），避免把 UI 进度清空成“空白”
            if (!message.trim()) return
            const startTime = event.startTime || new Date()
            progress.value = new ProgressInfo(message, startTime, event.agentId as any)
        },
        onDone: (event: BaseEventItem) => {
            const message = (event.message || '').toString()
            const startTime = event.endTime ?? event.startTime ?? new Date()
            // ⚠️ 修复：DONE 事件时清空 progress，避免残留
            progress.value = null
            options?.onDoneNotice?.({
                text: message,
                startTime,
                title: currentTaskTitle.value || '',
                messageId: event.messageId || undefined,
                type: NotificationType.WARNING
            })
        },
        onDoneWithWarning: (event: BaseEventItem) => {
            const message = (event.message || '').toString()
            const startTime = event.endTime ?? event.startTime ?? new Date()
            progress.value = null
            options?.onDoneNotice?.({
                text: message,
                startTime,
                title: currentTaskTitle.value || '',
                messageId: event.messageId || undefined,
                type: NotificationType.WARNING
            })
        },
        onError: (event: BaseEventItem) => {
            const message = (event.message || '').toString()
            const startTime = event.startTime || new Date()

            // 1. 更新消息列表（如果是编译错误或其他异常，确保它被记录）
            if (!event.messageId) {
                event.messageId = `error-${Date.now()}`
            }
            updateMessage(event, currentSessionId.value)

            // 2. 更新状态（不再弹出通知，UI 已有继续按钮）
            progress.value = null
            taskStatus.value.set('error')

            // 4. 防御性兜底：若后端未发送 COMPLETED，超时后强制关闭连接，防止资源泄漏
            if (errorTimeoutId) clearTimeout(errorTimeoutId)
            errorTimeoutId = setTimeout(() => {
                errorTimeoutId = null
                if (taskStatus.value.is('error') && activeSource.value) {
                    console.warn('[useSSE] ERROR 后未收到 COMPLETED，强制关闭连接')
                    connectionStatus.value.set('disconnected')
                    closeActiveSource()
                }
            }, 5000)
        },
        onCompleted: (event: BaseEventItem) => {
            // COMPLETED为流结束信号
            if (errorTimeoutId) { clearTimeout(errorTimeoutId); errorTimeoutId = null }
            connectionStatus.value.set('disconnected')
            taskStatus.value.set('completed')
            progress.value = null
            closeActiveSource()

        },
        onDefault: (event: BaseEventItem) => {
            updateMessage(event, currentSessionId.value)
        },

        onTaskAnalysis: (event: BaseEventItem) => {
            updateTaskAnalysisMessage(event, currentSessionId.value)
        },
        onThought: (event: BaseEventItem) => {
            updateThoughtMessage(event, currentSessionId.value)
        },
        onInitPlan: (event: BaseEventItem) => {
            if (event.data && event.sessionId) {
                try {
                    const planData = event.data as InitPlanEventData
                    if (planData.plan) {
                        chatStore.setSessionPlan(event.sessionId, planData.plan)
                        console.log('Plan initialized for session:', event.sessionId, planData.plan)
                    }
                } catch (error) {
                    console.error('Failed to process INIT_PLAN event:', error)
                }
            }
        },
        onUpdatePlan: (event: BaseEventItem) => {
            if (event.data && event.sessionId) {
                try {
                    const updateData = event.data as UpdatePlanEventData
                    if (updateData.updates) {
                        chatStore.updateSessionPlan(event.sessionId, updateData.updates)
                        console.log('Plan updated for session:', event.sessionId, updateData.updates)
                    }
                } catch (error) {
                    console.error('Failed to process UPDATE_PLAN event:', error)
                }
            }
        },
        onAdvancePlan: (event: BaseEventItem) => {
            if (event.data && event.sessionId) {
                try {
                    const advanceData = event.data as AdvancePlanEventData
                    chatStore.advancePlanPhase(
                        event.sessionId,
                        advanceData.fromPhaseId,
                        advanceData.toPhaseId
                    )
                    console.log('Plan advanced for session:', event.sessionId,
                        'from:', advanceData.fromPhaseId, 'to:', advanceData.toPhaseId)
                } catch (error) {
                    console.error('Failed to process ADVANCE_PLAN event:', error)
                }
            }
        },
        onPlanWrite: (event: BaseEventItem) => {
            if (event.data && event.sessionId) {
                try {
                    const planWriteData = event.data as PlanWriteEventData
                    const planData = transformPlanWriteEventToPlanData(planWriteData)
                    chatStore.setSessionPlan(event.sessionId, planData)
                    console.log('Plan written for session:', event.sessionId, planData)
                } catch (error) {
                    console.error('Failed to process PLAN_WRITE event:', error)
                }
            }
        },
        onReasoning: (event: BaseEventItem) => {
            updateReasoningMessage(event, currentSessionId.value)
        }
    }

    // 创建事件分发器
    const { dispatch } = useSSEEventBus(defaultHandlers, options.handlers)

    // === 核心事件处理函数 ===
    const handleEvent = (event: BaseEventItem): void => {
        dispatch(event)
    }

    // === 通用 Agent 执行器 ===
    const executeAgent = async (
        text: string,
        sessionId: string,
        agentOptions: AgentExecuteOptions
    ): Promise<void> => {
        // 重置状态（清除当前会话的索引）
        resetNodeIndex(currentSessionId.value)
        currentTaskTitle.value = text || ''

        return connect(
            {
                endpoint: agentOptions.endpoint,
                method: agentOptions.method,
                headers: agentOptions.headers,
                payload: agentOptions.payload
            },
            {
                onEvent: (messageEvent, eventType) => {
                    if (!messageEvent?.data) return
                    try {
                        const event = normalizeEventDates(JSON.parse(messageEvent.data) as BaseEventItem)
                        handleEvent(event)
                    } catch (e) {
                        // 记录原始数据用于调试，但继续处理后续事件
                        console.error(`[SSE] 事件解析失败，跳过: eventType=${eventType}, data=${messageEvent.data?.slice(0, 200)}`, e)
                    }
                },
                onConnected: () => {
                    connectionStatus.value.set('connected')
                    taskStatus.value.set('running')
                    scrollToBottom()
                },
                onDisconnected: () => {
                    connectionStatus.value.set('disconnected')
                },
                onError: (event, errorInfo) => {
                    connectionStatus.value.set('error')
                    taskStatus.value.set('error')
                    progress.value = null

                    if (errorInfo?.isServerError) {
                        console.warn(`[SSE] 服务器错误 (${errorInfo.responseCode})`)
                    }
                    // 不需要额外处理：connect() 已 reject Promise，上层 catch 块会处理
                }
            }
        )
    }

    // === Agent 执行快捷方法 ===

    /**
     * 执行 Volo AI 智能体
     */
    const executeVoloAI = async (
        text: string,
        sessionId: string,
        parentTurnId?: string,
        modelId?: string,
        attachments?: AttachmentDTO[],
        executionMode?: string,
        useWebSearch?: boolean,
        useKnowledgeBase?: boolean,
        useMemoryEnhancement?: boolean,
        knowledgeBaseIds?: string[]
    ): Promise<void> => {
        return await executeAgent(text, sessionId, {
            endpoint: AGENT_CONFIGS.voloAI.endpoint,
            method: 'POST',
            payload: {
                message: text,
                sessionId,
                parentTurnId,
                modelId,
                attachments,
                executionMode,
                useWebSearch,
                useKnowledgeBase,
                useMemoryEnhancement,
                knowledgeBaseIds
            }
        })
    }

    /**
     * 恢复 Volo AI 执行（Human-in-the-loop — 机制 A：DB Stop+Resume）
     *
     * 创建新的 SSE 连接，后端重建上下文后重新执行策略。
     * 适用于：SSE 已断开、需要完整重新执行的场景。
     */
    const resumeVoloAI = async (resumePointId: string, response?: any): Promise<void> => {
        const endpoint = `${VOLO_AI_RESUME_ENDPOINT}?turnId=${encodeURIComponent(resumePointId)}`
        return await executeAgent('', '', {
            endpoint,
            method: 'POST',
            payload: response || {}
        })
    }

    /**
     * 发送交互响应（Human-in-the-loop — 机制 B：BySink 实时审批）
     *
     * REST 调用，解除后端 Sinks.One 阻塞，使当前 SSE 流继续执行。
     * 适用于：SSE 仍存活、工具审批等实时交互场景。
     *
     * @param turnId Turn ID
     * @param response 交互响应（approved/rejected + data）
     */
    const sendInteractionResponse = async (turnId: string, response?: any): Promise<void> => {
        const { sendInteractionResponse: sendResponse } = await import('@/api/agent')
        await sendResponse(turnId, response || {})
    }

    // === 返回接口（保持与原有完全一致）===
    return {
        // 状态数据
        nodeIndex,
        connectionStatus,
        taskStatus,
        progress,
        currentSessionId,

        // 执行方法
        executeVoloAI,
        resumeVoloAI,
        sendInteractionResponse,

        // 连接管理
        cleanup,
        closeActiveSource,
    }
}
