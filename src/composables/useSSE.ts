import { ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notification } from 'ant-design-vue'
import { UIMessage, EventType, BaseEventItem, InitPlanEventData, UpdatePlanEventData, AdvancePlanEventData, PlanData } from '@/types/events'
import { ConnectionStatus, TaskStatus, ProgressInfo } from '@/types/status'
import { NotificationType } from '@/types/notification'
import { AgentType } from '@/types/session'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
const ssePromise = import('sse.js')

// === SSE 相关接口定义 ===

/** SSE 连接源接口 */
interface SSESource {
    addEventListener(event: string, handler: (e: MessageEvent) => void): void
    close(): void
    stream(): void
}


/** 自定义事件处理器映射 */
interface SSEEventHandlers {
    onStarted?: (event: BaseEventItem) => void | boolean
    onThinking?: (event: BaseEventItem) => void | boolean
    onAction?: (event: BaseEventItem) => void | boolean
    onActing?: (event: BaseEventItem) => void | boolean
    onObserving?: (event: BaseEventItem) => void | boolean
    onExecuting?: (event: BaseEventItem) => void | boolean
    onTool?: (event: BaseEventItem) => void | boolean
    onToolApproval?: (event: BaseEventItem) => void | boolean
    onInteraction?: (event: BaseEventItem) => void | boolean
    onProgress?: (event: BaseEventItem) => void | boolean
    onDone?: (event: BaseEventItem) => void | boolean
    onDoneWithWarning?: (event: BaseEventItem) => void | boolean
    onError?: (event: BaseEventItem) => void | boolean
    onCompleted?: (event: BaseEventItem) => void | boolean
    onDefault?: (event: BaseEventItem) => void | boolean

    // ReActPlus 专属事件处理器
    onTaskAnalysis?: (event: BaseEventItem) => void | boolean
    onThought?: (event: BaseEventItem) => void | boolean
    onInitPlan?: (event: BaseEventItem) => void | boolean
    onUpdatePlan?: (event: BaseEventItem) => void | boolean
    onAdvancePlan?: (event: BaseEventItem) => void | boolean
}

/** Agent执行配置 */
interface AgentExecuteOptions {
    endpoint: string
    method?: 'POST' | 'GET'
    headers?: Record<string, string>
    payload?: Record<string, any>
}

/** useSSE 配置选项 */
interface SSEOptions {
    /** 自定义事件处理器 */
    handlers?: SSEEventHandlers
    /** 滚动到底部回调 */
    onScrollToBottom?: () => void
    /** 完成通知回调 */
    onDoneNotice?: (p: {
        text: string;
        startTime: Date;
        title: string;
        messageId?: string,
        type: NotificationType
    }) => void
}

export function useSSE(options: SSEOptions = {}) {
    // === 响应式状态 ===
    // 使用全局 store 作为消息数据源，实现解耦
    const chatStore = useChatStore()
    const authStore = useAuthStore()
    
    // 当前会话ID，用于决定消息写入哪个会话
    const currentSessionId = ref<string>('')
    const nodeIndex = ref<Record<string, number>>({})
    const connectionStatus = ref(new ConnectionStatus('disconnected'))
    const taskStatus = ref(new TaskStatus('idle'))
    const progress = ref<ProgressInfo | null>(null)
    const currentTaskTitle = ref<string>("")
    const router = useRouter()

    // === SSE 连接管理 ===
    const activeSource = ref<SSESource | null>(null)

    // === 工具函数 ===
    const closeSource = (source: SSESource | null) => {
        try {
            if (source && typeof source.close === 'function') source.close()
        } catch (e) {
            console.error('Failed to close SSE source:', e)
        }
    }

    /** 延迟执行函数（用于重试战略）*/
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    /** 关闭当前活动的 SSE 连接 */
    const closeActiveSource = () => {
        if (activeSource.value) {
            closeSource(activeSource.value)
            activeSource.value = null
        }
    }

    /** 清理所有状态和资源 */
    const cleanup = () => {
        closeActiveSource()
        nodeIndex.value = {}
        progress.value = null
        taskStatus.value.set('idle')
        connectionStatus.value.set('disconnected')
        currentTaskTitle.value = ""
        currentSessionId.value = ''
    }


    const scrollToBottom = async () => {
        await nextTick()
        options?.onScrollToBottom?.()
    }

    const getSenderByEventType = (event: BaseEventItem): string => {
        return event.agentId || "Agent"
    }

    // === 默认事件处理器实现（策略模式） ===


    /** 更新消息到消息列表（默认的消息聚合逻辑）*/
    const updateMessage = (event: BaseEventItem): void => {
        // 生成 fallback messageId（防御性编程）
        let messageId = event.messageId
        if (!messageId) {
            messageId = `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
            console.warn('Event missing messageId, generated fallback:', messageId, event)
            event.messageId = messageId  // 更新事件对象，确保后续处理有 ID
        }

        const sessionId = event.sessionId || currentSessionId.value
        const turnId = event.turnId
        const parentTurnId = event.parentTurnId  // 新增：父 turn ID
        const type = event.type as EventType
        const message = (event.message || '').toString()
        const data = event.data
        const startTime = event.startTime || new Date()
        const endTime = event.endTime ?? new Date()

        // 从 store 中获取当前会话的消息
        const messages = chatStore.getSessionMessages(sessionId)
        const index = nodeIndex.value[messageId]

        if (type === EventType.TOOL) {
            // 工具事件作为独立消息插入
            const toolMsg: UIMessage = {
                messageId: messageId,
                sessionId: sessionId,
                turnId: turnId,
                parentTurnId: parentTurnId,
                type: type,
                sender: getSenderByEventType(event),
                message: message,
                data: data,
                startTime: startTime,
                endTime: endTime,
                meta: event.meta
            }
            messages.push(toolMsg)
            chatStore.setSessionMessages(sessionId, messages)
        }
        else if (type === EventType.TOOL_APPROVAL) {

            const toolApprovalMsg: UIMessage = {
                messageId: messageId,
                sessionId: sessionId,
                turnId: turnId,
                parentTurnId: parentTurnId,
                type: type,
                sender: getSenderByEventType(event),
                message: message,
                data: data,
                startTime: startTime,
                endTime: endTime,
                meta: event.meta
            }
            messages.push(toolApprovalMsg)
            chatStore.setSessionMessages(sessionId, messages)
        } else if (index !== undefined && index < messages.length) {
            // messageId已存在，更新现有消息
            const node = messages[index]

            // 非工具事件：累积到message字段
            node.message = node.message ? `${node.message}${message}` : message
            node.events?.push?.(event)
            chatStore.setSessionMessages(sessionId, messages)

        } else {

            // 非工具事件作为主消息创建并建立nodeIndex

            const firstNodeMessage: UIMessage = {
                messageId: messageId,
                sessionId: sessionId,
                turnId: turnId,
                parentTurnId: parentTurnId,
                type: type,
                sender: getSenderByEventType(event),
                message: message,
                data: data,
                startTime: startTime,
                endTime: endTime,
                meta: event.meta
            }
            messages.push(firstNodeMessage)
            // 立即建立nodeIndex映射
            nodeIndex.value[messageId] = messages.length - 1
            chatStore.setSessionMessages(sessionId, messages)

        }
    }

    /** 更新思维链消息（ReActPlus专用） */
    const updateThoughtMessage = (event: BaseEventItem): void => {
        const messageId = event.messageId
        if (!messageId) {
            console.warn('THOUGHT event missing messageId, falling back to default handling', event)
            updateMessage(event)
            return
        }

        const sessionId = event.sessionId || currentSessionId.value
        const messages = chatStore.getSessionMessages(sessionId)
        const index = nodeIndex.value[messageId]
        const message = (event.message || '').toString()

        if (index !== undefined && index < messages.length) {
            // messageId已存在，累积思维链内容到现有消息
            const node = messages[index]
            node.message = node.message ? `${node.message}${message}` : message
            if (!node.events) {
                node.events = []
            }
            node.events.push(event)
            // 更新 endTime 如果事件已结束
            if (event.endTime) {
                node.endTime = event.endTime
            }
            chatStore.setSessionMessages(sessionId, messages)
        } else {
            // 创建新的思维链节点
            const thoughtMessage: UIMessage = {
                messageId: messageId,
                sessionId: sessionId,
                turnId: event.turnId,
                type: EventType.THOUGHT, // 使用 THOUGHT 类型
                sender: getSenderByEventType(event),
                message: message,
                data: event.data,
                startTime: event.startTime || new Date(),
                endTime: event.endTime,
                events: [event],
                meta: event.meta
            }
            messages.push(thoughtMessage)
            nodeIndex.value[messageId] = messages.length - 1
            chatStore.setSessionMessages(sessionId, messages)
        }
    }

    /** 更新任务分析消息（ReActPlus专用） */
    const updateTaskAnalysisMessage = (event: BaseEventItem): void => {
        const messageId = event.messageId
        if (!messageId) {
            console.warn('TASK_ANALYSIS event missing messageId, falling back to default handling', event)
            updateMessage(event)
            return
        }

        const sessionId = event.sessionId || currentSessionId.value
        const messages = chatStore.getSessionMessages(sessionId)
        const index = nodeIndex.value[messageId]
        const message = (event.message || '').toString()

        if (index !== undefined && index < messages.length) {
            // messageId已存在，累积任务分析内容到现有消息
            const node = messages[index]
            node.message = node.message ? `${node.message}${message}` : message
            if (!node.events) {
                node.events = []
            }
            node.events.push(event)
            // 更新 endTime 如果事件已结束
            if (event.endTime) {
                node.endTime = event.endTime
            }
            chatStore.setSessionMessages(sessionId, messages)
        } else {
            // 创建新的任务分析消息节点
            const analysisMessage: UIMessage = {
                messageId: messageId,
                sessionId: sessionId,
                turnId: event.turnId,
                type: EventType.TASK_ANALYSIS, // 使用 TASK_ANALYSIS 类型
                sender: getSenderByEventType(event),
                message: message,
                data: event.data,
                startTime: event.startTime || new Date(),
                endTime: event.endTime,
                events: [event],
                meta: event.meta
            }
            messages.push(analysisMessage)
            nodeIndex.value[messageId] = messages.length - 1
            chatStore.setSessionMessages(sessionId, messages)
        }
    }


    /** 默认事件处理器映射 */
    const defaultHandlers: Required<SSEEventHandlers> = {
        onStarted: (event: BaseEventItem) => {
            console.log("chat started：" + event.message)
            const startTime = event.startTime || new Date()

            // 区分两种 STARTED 事件：
            // 1. 带 data 的事件（Controller 发出）：包含完整 SessionVO，用于更新会话列表
            // 2. 不带 data 的事件（Strategy 发出）：用于更新进度信息

            if (event.data && event.sessionId) {
                // 第一个 STARTED 事件：创建会话
                const chatStore = useChatStore()

                // 从 event.data 中提取 SessionVO
                const sessionVO = event.data as any  // 类型：SessionVO

                console.log('[useSSE] 收到完整 session 信息（第一次创建会话）:', sessionVO)

                // 在 chatStore 中创建或更新会话记录，传入完整信息
                const result = chatStore.createSessionIfNotExists(
                    sessionVO.id,
                    sessionVO.type as AgentType,
                    sessionVO.title  // 传入 AI 生成的 title
                )

                // 如果发生了临时会话到真实会话的转换，更新 URL
                if (result.converted) {
                    console.log('[useSSE] 临时会话转为真实会话，更新 URL:', result.sessionId)

                    // 使用路径参数更新 URL（从 /chat 改为 /chat/:sessionId）
                    router.replace({
                        name: 'Chat',
                        params: { sessionId: result.sessionId }
                    })
                }
            } else {
                // 第二个 STARTED 事件：更新进度信息
                progress.value = new ProgressInfo(event.message, startTime, event.agentId as any)
            }
        },
        onThinking: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onAction: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onActing: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onObserving: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onExecuting: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onTool: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onToolApproval: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onInteraction: (event: BaseEventItem) => {
            updateMessage(event)
        },
        onProgress: (event: BaseEventItem) => {
            console.log("进度更新了")
            const message = (event.message || '').toString()
            const startTime = event.startTime || new Date()
            progress.value = new ProgressInfo(message, startTime, event.agentId as any)
        },
        onDone: (event: BaseEventItem) => {
            const message = (event.message || '').toString()
            const startTime = event.startTime || new Date()
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
            const startTime = event.startTime || new Date()
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

            // 1. 更新消息列表 - 确保错误信息在聊天记录中可见
            updateMessage(event)

            // 2. 发送错误通知
            options?.onDoneNotice?.({
                text: '[ERROR] ' + message,
                startTime,
                title: currentTaskTitle.value || '',
                messageId: event.messageId || undefined,
                type: NotificationType.ERROR
            })

            // 3. 不关闭连接 - 后端具有重试机制，前端保持连接打开让后端继续重试
            // 仅清空进度信息，保持 connectionStatus 为 connected 和 taskStatus 为 running
            progress.value = null
        },
        onCompleted: (event: BaseEventItem) => {
            // COMPLETED为流结束信号，不写入消息列表，但需要更新状态
            connectionStatus.value.set('disconnected')
            taskStatus.value.set('completed')
            progress.value = null // 清空进度信息
            closeActiveSource() // 使用新的安全关闭方法
        },
        onDefault: (event: BaseEventItem) => {
            updateMessage(event)
        },

        // ReActPlus 专属事件处理器的默认实现
        onTaskAnalysis: (event: BaseEventItem) => {
            // 任务分析阶段：累积消息到独立节点
            updateTaskAnalysisMessage(event)
        },
        onThought: (event: BaseEventItem) => {
            // 思维链生成：累积消息到独立节点
            updateThoughtMessage(event)
        },
        onInitPlan: (event: BaseEventItem) => {
            // 初始化计划：处理计划创建

            // 处理计划数据，集成到ChatStore
            if (event.data && event.sessionId) {
                const chatStore = useChatStore()
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
            // 更新计划：处理计划修改

            // 更新ChatStore中的计划数据
            if (event.data && event.sessionId) {
                const chatStore = useChatStore()
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
            // 推进计划：处理阶段推进

            // 处理阶段推进逻辑
            if (event.data && event.sessionId) {
                const chatStore = useChatStore()
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
        }
    }

    // === 核心事件处理函数（对外暴露） ===

    /**
     * 手动处理SSE事件
     * @param event SSE事件对象
     * @param source SSE连接源（可选）
     */
    const handleEvent = (event: BaseEventItem, source?: SSESource): void => {


        const eventType = event.type
        const customHandlers = options.handlers || {}

        // 获取事件类型对应的处理器名称
        const handlerName = getHandlerNameByEventType(eventType)

        // 优先使用自定义处理器
        const customHandler = customHandlers[handlerName]
        if (customHandler) {
            const result = customHandler(event)
            // 如果自定义处理器返回false，则跳过默认处理器
            if (result === false) return
        }

        // 执行默认处理
        console.log('default handle event: ', eventType)
        const defaultHandler = defaultHandlers[handlerName]
        defaultHandler(event)

    }

    /** 根据事件类型获取处理器方法名称 */
    const getHandlerNameByEventType = (eventType: string): keyof SSEEventHandlers => {
        const handlerMap: Record<string, keyof SSEEventHandlers> = {
            [EventType.STARTED]: 'onStarted',
            [EventType.THINKING]: 'onThinking',
            [EventType.ACTION]: 'onAction',
            [EventType.ACTING]: 'onActing',
            [EventType.OBSERVING]: 'onObserving',
            [EventType.EXECUTING]: 'onExecuting',
            [EventType.TOOL]: 'onTool',
            [EventType.TOOL_APPROVAL]: 'onToolApproval',
            [EventType.INTERACTION]: 'onInteraction',
            [EventType.PROGRESS]: 'onProgress',
            [EventType.DONE]: 'onDone',
            [EventType.DONEWITHWARNING]: 'onDoneWithWarning',
            [EventType.ERROR]: 'onError',
            [EventType.COMPLETED]: 'onCompleted',
            // ReActPlus 专属事件类型
            [EventType.TASK_ANALYSIS]: 'onTaskAnalysis',
            [EventType.THOUGHT]: 'onThought',
            [EventType.INIT_PLAN]: 'onInitPlan',
            [EventType.UPDATE_PLAN]: 'onUpdatePlan',
            [EventType.ADVANCE_PLAN]: 'onAdvancePlan'
        }

        return handlerMap[eventType] || 'onDefault'
    }

    // === 通用 Agent 执行器 ===


    /**
     * 通用的 Agent 执行方法
     * @param text 用户输入文本
     * @param sessionId 会话ID
     * @param agentOptions Agent配置选项
     */
    const executeAgent = async (
        text: string,
        sessionId: string,
        agentOptions: AgentExecuteOptions
    ): Promise<void> => {

        return new Promise<void>((resolve, reject) => {
            // 动态 import，避免在 SSR 或测试环境报错
            ssePromise.then(({ SSE }) => {
                // 启动新任务前先清理之前的连接
                closeActiveSource()

                currentTaskTitle.value = text || ''
                progress.value = null

                const defaultHeaders: Record<string, string> = {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    'Cache-Control': 'no-cache',
                }

                // 从 authStore 获取 token 并添加到 headers
                const authStore = useAuthStore()
                let token = authStore.accessToken
                
                // 定义内层函数，用于建立 SSE 连接
                const establishSSEConnection = () => {
                    if (token) {
                        defaultHeaders['Authorization'] = `Bearer ${token}`
                    }

                    const source = new SSE(agentOptions.endpoint, {
                        method: agentOptions.method || 'POST',
                        headers: { ...defaultHeaders, ...(agentOptions.headers || {}) },
                        payload: agentOptions.payload ? JSON.stringify(agentOptions.payload) : undefined,
                    }) as SSESource

                    // 保存当前活动连接的引用
                    activeSource.value = source

                    source.addEventListener('open', () => {
                        connectionStatus.value.set('connected')
                        taskStatus.value.set('running')
                        scrollToBottom()
                    })


                    /** 创建事件监听器的工厂函数 */
                    const createEventListener = (eventName: string) => (messageEvent: MessageEvent) => {
                        // console.log(`[SSE] 收到事件: ${eventName}`, messageEvent.data)
                        if (!messageEvent?.data) return
                        try {
                            const event = JSON.parse(messageEvent.data) as BaseEventItem
                            // console.log(`[SSE] 解析事件成功: ${eventName}`, event)
                            handleEvent(event, source)
                        } catch (e) {
                            console.error(`Failed to parse ${eventName} event:`, e)
                        }
                    }

                    // 定义所有需要监听的事件类型（避免重复注册）
                    const EVENT_TYPES = [
                        // 基础事件
                        'STARTED', 'PROGRESS', 'AGENT_SELECTED', 'THINKING',
                        'ACTION', 'ACTING', 'OBSERVING', 'DONE', 'EXECUTING',
                        'ERROR', 'TOOL', 'DONEWITHWARNING', 'TOOL_APPROVAL',
                        'INTERACTION', 'COMPLETED',
                        // ReActPlus 专属事件
                        'TASK_ANALYSIS', 'THOUGHT', 'INIT_PLAN',
                        'UPDATE_PLAN', 'ADVANCE_PLAN'
                    ] as const

                    // 统一注册所有事件监听器
                    EVENT_TYPES.forEach(eventType => {
                        source.addEventListener(eventType, createEventListener(eventType))
                    })

                    // 特别重要：监听默认的 'message' 事件
                    source.addEventListener('message', createEventListener('message'))

                    // 监听连接状态事件
                    source.addEventListener('error', (event: Event) => {
                        console.error('[SSE] 连接错误:', event)
                        const customEvent = event as any
                        const responseCode = customEvent.responseCode
                        const errorData = customEvent.data ? JSON.parse(customEvent.data) : null
                        
                        console.log('[SSE] 错误详情 - Code:', responseCode, 'Data:', errorData)
                        
                        // 处理 401 未授权错误
                        if (responseCode === 401) {
                            console.warn('[SSE] 收到 401 错误，尝试刷新 Token')
                            closeActiveSource()
                            
                            const refreshToken = authStore.refreshToken
                            if (refreshToken) {
                                import('@/api/auth').then(({ authApi }) => {
                                    authApi.refresh(refreshToken).then(response => {
                                        if (response.code === 200) {
                                            const { accessToken: newToken, refreshToken: newRefreshToken, expiresIn } = response.data
                                            authStore.setTokens(newToken, newRefreshToken, expiresIn)
                                            token = newToken
                                            console.log('[SSE] 401 错误后 Token 刷新成功，重试连接')
                                            // 重新建立连接
                                            establishSSEConnection()
                                        } else {
                                            console.error('[SSE] 401 错误处理：Token 刷新失败')
                                            connectionStatus.value.set('error')
                                            taskStatus.value.set('error')
                                            notification.error({
                                                message: 'Token 刷新失败',
                                                description: '登录已过期，请重新登录',
                                                duration: 5
                                            })
                                        }
                                    }).catch(err => {
                                        console.error('[SSE] 401 错误处理：Token 刷新异常', err)
                                        connectionStatus.value.set('error')
                                        taskStatus.value.set('error')
                                        notification.error({
                                            message: '身份验证失败',
                                            description: '请重新登录',
                                            duration: 5
                                        })
                                    })
                                })
                            } else {
                                console.warn('[SSE] 没有 Refresh Token，无法重试')
                                connectionStatus.value.set('error')
                                taskStatus.value.set('error')
                                notification.error({
                                    message: '身份验证过期',
                                    description: '请重新登录',
                                    duration: 5
                                })
                            }
                            return
                        }
                        
                        // 其他错误处理
                        connectionStatus.value.set('error')
                        taskStatus.value.set('error')
                        notification.error({
                            message: 'SSE 连接错误',
                            description: '与服务器的连接已断开，请刷新页面或重试',
                            duration: 5
                        })
                    })

                    source.addEventListener('close', () => {
                        console.log('[SSE] 连接关闭')
                        connectionStatus.value.set('disconnected')
                    })

                    try {
                        source.stream()
                    } catch (e: any) {
                        const errorMsg = e?.message || '未知错误'
                        const error = new Error('启动SSE流失败: ' + errorMsg)
                        console.error('[SSE] 流启动失败:', error)

                        // 显示错误提示
                        notification.error({
                            message: '连接启动失败',
                            description: errorMsg,
                            duration: 5
                        })

                        reject(error)
                    }
                }
                
                // 检查 Token 是否即将过期，如果过期则同步刷新
                if (authStore.isTokenExpiring) {
                    console.warn('[SSE] Token 即将过期，尝试同步刷新')
                    // 使用 authApi 同步刷新 Token（不走 axios 拦截器）
                    const refreshToken = authStore.refreshToken
                    if (refreshToken) {
                        import('@/api/auth').then(({ authApi }) => {
                            authApi.refresh(refreshToken).then(response => {
                                if (response.code === 200) {
                                    const { accessToken: newToken, refreshToken: newRefreshToken, expiresIn } = response.data
                                    authStore.setTokens(newToken, newRefreshToken, expiresIn)
                                    token = newToken
                                    console.log('[SSE] Token 刷新成功')
                                    // 继续执行 SSE 连接（此时 token 已更新）
                                    establishSSEConnection()
                                } else {
                                    console.error('[SSE] Token 刷新失败:', response.message)
                                    reject(new Error('Token 刷新失败'))
                                }
                            }).catch(err => {
                                console.error('[SSE] Token 刷新异常:', err)
                                reject(err)
                            })
                        })
                        return
                    }
                }
                
                // Token 状态正常，直接建立连接
                establishSSEConnection()
            })
                .catch((e) => {
                    const errorMsg = (e as Error).message
                    console.error('[SSE] 加载失败:', errorMsg)

                    // 显示错误提示
                    notification.error({
                        message: '加载SSE模块失败',
                        description: errorMsg,
                        duration: 5
                    })

                    reject(new Error('未能加载 sse.js: ' + errorMsg))
                })
        })
    }

    /**
     * 执行ReAct智能体
     * @param text 用户输入文本
     * @param sessionId 会话ID
     */
    const executeReAct = async (text: string, sessionId: string): Promise<void> => {
        try {
            return await executeAgent(text, sessionId, {
                endpoint: '/api/agent/chat/react/stream',
                method: 'POST',
                payload: {
                    message: text,
                    sessionId,
                }
            })
        } catch (error: any) {
            console.error('ReAct 执行失败:', error)

            // 显示执行失败提示
            notification.error({
                message: '执行失败',
                description: error?.message || '执行任务时出错，请重试',
                duration: 5
            })

            throw error
        }
    }
    /**
     * 执行ReActPlus智能体
     * @param text 用户输入文本
     * @param sessionId 会话ID
     * @param parentTurnId 父 turn ID（用于非线性对话分支，可选）
     */
    const executeReActPlus = async (text: string, sessionId: string, parentTurnId?: string): Promise<void> => {
        try {
            return await executeAgent(text, sessionId, {
                endpoint: '/api/agent/chat/react-plus/stream',
                method: 'POST',
                payload: {
                    message: text,
                    sessionId,
                    parentTurnId  // 新增：支持非线性对话分支
                }
            })
        } catch (error: any) {
            console.error('ReActPlus 执行失败:', error)

            // 显示执行失败提示
            notification.error({
                message: '执行失败',
                description: error?.message || '执行任务时出错，请重试',
                duration: 5
            })

            throw error
        }
    }



    // === 返回接口 ===
    return {
        // 状态数据
        nodeIndex,
        connectionStatus,
        taskStatus,
        progress,
        currentSessionId,  // 新增：当前会话ID

        // 执行方法（重构后的新接口）
        executeReAct,          // 保留：向后兼容的快捷方法
        executeReActPlus,          // 保留：向后兼容的快捷方法

        // 连接管理（新增）
        cleanup,               // 新增：清理所有状态和连接
        closeActiveSource,     // 新增：关闭当前活动连接

    }
}
