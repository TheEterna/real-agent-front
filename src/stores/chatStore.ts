import {ref} from 'vue'
import {defineStore} from 'pinia'
import type {Session} from '@/types/session'
import {AgentType} from '@/types/session'
import type {UIMessage} from '@/types/events'
import {PlanData, PlanPhase, PlanPhaseStatus, PlanStatus} from '@/types/events'
import {nanoid} from 'nanoid'
import {getSessions} from '@/api/session'
import type {ConversationTree, Turn, ConversationNode} from '@/types/conversation'
import {buildTreeFromFlat, getActiveMessages, getPathToNode, highlightActivePath} from '@/utils/ConversationTreeBuilder'
import {notification} from 'ant-design-vue'


// === 当前编辑的临时会话（不显示在列表中）===
// 使用唯一固定 ID 以便追踪
const EDITING_SESSION_ID = `temp-editing-${Date.now()}`
const currentEditingSession = ref<Session>({
    id: EDITING_SESSION_ID,
    title: '新对话',
    type: AgentType.ReAct_Plus,
    createdTime: new Date(),
    updatedTime: new Date()
})

// === 核心响应式状态 ===
// === 核心响应式状态 ===
// const sessionId = ref<string>(EDITING_SESSION_ID) // Removed: State is now managed by URL
const sessions = ref<Session[]>([])
const isLoadingSessions = ref(false)
const isLoadingMessages = ref(false)
const messagesBySession = ref<Record<string, UIMessage[]>>({})
const plansBySession = ref<Record<string, PlanData | null>>({})

// === 对话树状态 ===
// 对话树是核心数据结构，替代 messagesBySession 作为消息的主要来源
// 每个会话维护一棵树，树节点包含完整的 turnId 和消息信息
const conversationTreesBySession = ref<Record<string, ConversationTree>>({})
const isLoadingConversationTree = ref(false)

// 每个会话当前激活的路径（turnId 数组）
// 格式：{ sessionId: [turnId1, turnId2, ...] }
const activePathBySession = ref<Record<string, string[]>>({})


// === Plan 小部件状态 ===
export type PlanWidgetMode = 'hidden' | 'ball' | 'mini' | 'sidebar'

interface PlanWidgetState {
    mode: PlanWidgetMode
    position: { x: number; y: number }
    size: { width: number; height: number }
}

const planWidgetState = ref<PlanWidgetState>({
    mode: 'ball',
    position: {x: 1000, y: 100},
    size: {width: 380, height: 600}
})

// === 会话操作函数 ===

const loadSession = async (id: string): Promise<boolean> => {
    // 如果是编辑会话，不需要加载
    if (id === EDITING_SESSION_ID) {
        return true
    }

    // 直接从后端加载历史消息，不做前端验证
    // 如果会话不存在，由 messages 接口返回错误
    // console.log('加载会话历史消息:', id)
    // console.log('会话加载成功')
    return await store.fetchReActPlusSessionMessages(id)
}

const resetEditingSession = (type: AgentType = AgentType.ReAct_Plus, title: string = '新对话') => {
    // 只修改编辑会话的 type 和 title，不添加到列表
    currentEditingSession.value = {
        id: EDITING_SESSION_ID,
        title,
        type,
        createdTime: new Date(),
        updatedTime: new Date()
    }
    // 清空该会话的消息
    messagesBySession.value[EDITING_SESSION_ID] = []
    return currentEditingSession.value
}

const createSession = async (title: string, type: AgentType) => {
    return resetEditingSession(type, title)
}

const createSessionIfNotExists = (id: string, type: AgentType = AgentType.ReAct_Plus, title: string = '新对话'): {
    converted: boolean;
    sessionId: string
} => {
    // 查找是否已有此 ID 的会话
    const existing = sessions.value.find(s => s.id === id)
    if (existing) {
        return {converted: false, sessionId: id}
    }

    // 检查是否有编辑会话的消息需要迁移（深拷贝，避免引用问题）
    const editingMessages = messagesBySession.value[EDITING_SESSION_ID] || []
    const copiedMessages = editingMessages.map(msg => ({
        ...msg,
        // 更新 sessionId 为新会话 ID
        sessionId: id
    }))

    // 创建新会话
    const newSession: Session = {
        id,
        title,
        type,
        createdTime: new Date(),
        updatedTime: new Date()
    }
    sessions.value.unshift(newSession)
    messagesBySession.value[id] = copiedMessages

    // 清空编辑会话
    messagesBySession.value[EDITING_SESSION_ID] = []
    currentEditingSession.value = {
        id: EDITING_SESSION_ID,
        title: '新对话',
        type: AgentType.ReAct_Plus,
        createdTime: new Date(),
        updatedTime: new Date()
    }

    return {converted: true, sessionId: id}
}

// === 导出的 store 对象 ===
const store = {
    // 响应式状态
    // sessionId, // Removed
    sessions,
    isLoadingSessions,
    isLoadingMessages,
    messagesBySession,
    plansBySession,
    planWidgetState,
    currentEditingSession,
    conversationTreesBySession,
    isLoadingConversationTree,

    // 会话操作
    loadSession,
    resetEditingSession,
    createSession,
    createSessionIfNotExists,

    getSessionMessages(id: string): UIMessage[] {
        return messagesBySession.value[id] ? [...messagesBySession.value[id]] : []
    },

    /**
     * 设置会话消息（带去重）
     * 使用 messageId 去重，避免 SSE 重连或后端重发导致消息重复
     * 同时自动更新对话树（增量更新）
     */
    setSessionMessages(id: string, msgs: UIMessage[]) {
        // 使用 Map 按 messageId 去重（保留最新的）
        const messageMap = new Map<string, UIMessage>()
        
        for (const msg of msgs) {
            // 如果消息没有 messageId，生成一个临时 ID
            const messageId = msg.messageId || `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
            if (!msg.messageId) {
                msg.messageId = messageId
                console.warn('[chatStore] Message missing messageId, generated fallback:', messageId)
            }
            messageMap.set(messageId, msg)
        }
        
        const newMessages = Array.from(messageMap.values())
        messagesBySession.value[id] = newMessages
        
        // 自动更新对话树（增量更新）
        store.updateConversationTree(id, newMessages)
    },

    /**
     * 追加消息到会话（带去重）
     * 只添加不存在的消息，已存在的消息会被更新
     * 同时自动触发对话树的增量更新
     */
    appendSessionMessage(id: string, msg: UIMessage) {
        const currentMessages = store.getSessionMessages(id)
        const messageId = msg.messageId || `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        if (!msg.messageId) {
            msg.messageId = messageId
            console.warn('[chatStore] Message missing messageId, generated fallback:', messageId)
        }
        
        // 查找是否已存在
        const existingIndex = currentMessages.findIndex(m => m.messageId === messageId)
        if (existingIndex >= 0) {
            // 更新现有消息
            currentMessages[existingIndex] = msg
        } else {
            // 追加新消息
            currentMessages.push(msg)
        }
        
        // 通过 setSessionMessages 触发树的更新
        store.setSessionMessages(id, currentMessages)
    },

    touchSession(id: string) {
        // 编辑会话只触发自身，不添加到列表
        if (id === EDITING_SESSION_ID) {
            currentEditingSession.value.updatedTime = new Date()
            return
        }

        const idx = sessions.value.findIndex(s => s.id === id)
        if (idx >= 0) {
            sessions.value[idx] = {...sessions.value[idx], updatedTime: new Date()}
        }
    },

    // Plan 管理方法
    getPlan(id: string): PlanData | null {
        return plansBySession.value[id] || null
    },

    getSessionPlan(id: string): PlanData | null {
        return plansBySession.value[id] || null
    },

    setSessionPlan(id: string, plan: PlanData) {
        plansBySession.value[id] = {
            ...plan,
            phases: plan.phases.map((phase, index) => ({
                ...phase,
                id: phase.id || nanoid(8),
                index: index,
                status: phase.status || PlanPhaseStatus.TODO
            })),
            status: plan.status || PlanStatus.PLANNING,
            createdAt: plan.createdAt || new Date(),
            updatedTime: new Date()
        }
        store.touchSession(id)
    },

    updateSessionPlan(id: string, updates: Partial<PlanData>) {
        const existingPlan = plansBySession.value[id]
        if (!existingPlan) return

        plansBySession.value[id] = {
            ...existingPlan,
            ...updates,
            phases: updates.phases ?
                updates.phases.map((phase, index) => ({
                    ...phase,
                    id: phase.id || nanoid(8),
                    index: index,
                    status: phase.status || PlanPhaseStatus.TODO
                })) : existingPlan.phases,
            updatedTime: new Date()
        }
        store.touchSession(id)
    },

    advancePlanPhase(id: string, fromPhaseId?: string, toPhaseId?: string) {
        const plan = plansBySession.value[id]
        if (!plan) return

        const phases = plan.phases.map(phase => {
            if (fromPhaseId && phase.id === fromPhaseId) {
                return {...phase, status: PlanPhaseStatus.COMPLETED}
            }
            if (toPhaseId && phase.id === toPhaseId) {
                return {...phase, status: PlanPhaseStatus.RUNNING}
            }
            return phase
        })

        store.updateSessionPlan(id, {
            phases,
            currentPhaseId: toPhaseId,
            status: PlanStatus.EXECUTING
        })
    },

    updatePhase(id: string, phaseId: string, updates: Partial<PlanPhase>) {
        const plan = plansBySession.value[id]
        if (!plan) return

        const phases = plan.phases.map(phase =>
            phase.id === phaseId ? {...phase, ...updates} : phase
        )

        store.updateSessionPlan(id, {phases})
    },

    clearSessionPlan(id: string) {
        delete plansBySession.value[id]
    },

    // Plan 小部件状态管理方法
    getPlanWidgetMode(): PlanWidgetMode {
        return planWidgetState.value.mode
    },

    setPlanWidgetMode(mode: PlanWidgetMode) {
        planWidgetState.value.mode = mode
    },

    getPlanWidgetPosition(): { x: number; y: number } {
        return {...planWidgetState.value.position}
    },

    setPlanWidgetPosition(position: { x: number; y: number }) {
        planWidgetState.value.position = position
    },

    getPlanWidgetSize(): { width: number; height: number } {
        return {...planWidgetState.value.size}
    },

    setPlanWidgetSize(size: { width: number; height: number }) {
        planWidgetState.value.size = size
    },

    updatePlanWidgetState(updates: Partial<PlanWidgetState>) {
        planWidgetState.value = {
            ...planWidgetState.value,
            ...updates
        }
    },

    // 会话管理方法
    getSession(id: string): Session | undefined {
        if (id === EDITING_SESSION_ID) {
            return currentEditingSession.value
        }
        return sessions.value.find(s => s.id === id)
    },

    getSessionsByAgent(agentType: AgentType): Session[] {
        return sessions.value.filter(s => s.type === agentType)
    },

    findLatestSessionIdForAgent(agentType: AgentType): string | null {
        const existingSessions = store.getSessionsByAgent(agentType)
        if (existingSessions.length > 0) {
            const mostRecentSession = existingSessions.sort((a, b) => b.updatedTime.getTime() - a.updatedTime.getTime())[0]
            return mostRecentSession.id
        } else {
            return null
        }
    },

    // 从后端加载消息
    async fetchReActPlusSessionMessages(sessionId: string): Promise<boolean> {
    // async fetchReActPlusSessionMessages(sessionId: string): Promise<UIMessage[]> {
        isLoadingMessages.value = true
        try {
            const http = (await import('@/services/http')).default
            const response: any = await http.get(`/agent/chat/react-plus/${sessionId}/messages`)

            // 后端返回成功,处理消息数据
            if (response.code === 200 && Array.isArray(response.data)) {
                const messages = response.data.map((msg: any) => ({
                    messageId: msg.id,
                    type: msg.type,
                    sender: msg.type === 'USER' ? '用户' : 'Agent',
                    turnId: msg.turnId,
                    parentTurnId: msg.parentTurnId,  // 新增：父 turn ID，用于非线性对话
                    message: msg.message,
                    startTime: new Date(msg.startTime),
                    endTime: msg.endTime ? new Date(msg.endTime) : undefined,
                    data: msg.data
                }))
                store.setSessionMessages(sessionId, messages)
                // return messages
                return true
            }

            if (response.code !== 200) {
                // 调用 ant 的提示组件
                notification.error({
                    message: response.code,
                    description: response.message
                })
            }

            return false

        } catch (error: any) {
            // 接口调用失败(网络错误、404、500等)
            console.error('Failed to fetch ReActPlus session messages:', error)

            // 调用 ant 的提示组件
            notification.error({
                message: 'Failed to fetch ReActPlus session messages',
                description: error.message
            })
            // 清空该会话的消息
            store.setSessionMessages(sessionId, [])
            return false
        } finally {
            isLoadingMessages.value = false
        }
    },

    // 从后端加载会话列表
    async loadSessions() {
        isLoadingSessions.value = true
        try {
            const result = await getSessions()
            if (result.code === 200 && Array.isArray(result.data)) {
                const loadedSessions: Session[] = result.data.map(s => ({
                    id: s.id,
                    title: s.title,
                    type: s.type as AgentType,
                    createdTime: new Date(s.createdTime),
                    updatedTime: new Date(s.updatedTime),
                    isPin: s.isPin || false
                }))

                loadedSessions.sort((a, b) => {
                    if (a.isPin !== b.isPin) {
                        return (b.isPin ? 1 : 0) - (a.isPin ? 1 : 0)
                    }
                    return b.updatedTime.getTime() - a.updatedTime.getTime()
                })

                sessions.value = loadedSessions
            }
        } catch (error) {
            console.error('加载会话列表失败:', error)
        } finally {
            isLoadingSessions.value = false
        }
    },

    // === 对话树管理方法 ===

    /**
     * 增量更新对话树（根据消息列表构建/更新树结构）
     * 只在以下情况触发：
     * 1. 首次加载会话消息时（mounted）
     * 2. 有新 turn 添加时（新消息包含新的 turnId）
     * @param sessionId 会话ID
     * @param messages 消息列表
     */
    updateConversationTree(sessionId: string, messages: UIMessage[]) {
        const existingTree = conversationTreesBySession.value[sessionId]
        
        // 构建 turnId 到消息的映射
        const turnMap = new Map<string, UIMessage[]>()
        messages.forEach(msg => {
            const turnId = msg.turnId
            if (!turnId) return  // 跳过没有 turnId 的消息
            
            if (!turnMap.has(turnId)) {
                turnMap.set(turnId, [])
            }
            turnMap.get(turnId)!.push(msg)
        })
        
        // 如果树不存在，创建新树
        if (!existingTree) {
            const turns = Array.from(turnMap.entries()).map(([turnId, turnMessages]) => {
                const firstMsg = turnMessages[0]
                return {
                    turnId,
                    sessionId,
                    parentTurnId: firstMsg.parentTurnId || null,
                    content: turnMessages.map(m => m.message).join('\n'),
                    role: firstMsg.type === 'USER' ? 'user' as const : 'assistant' as const,
                    type: firstMsg.type,
                    createdAt: firstMsg.startTime || new Date(),  // 确保有默认值
                    messageId: firstMsg.messageId,
                    data: firstMsg.data
                }
            })
            
            // 获取或初始化激活路径
            const activePath = activePathBySession.value[sessionId] || store.calculateDefaultActivePath(turns)
            
            // 构建树
            const tree = buildTreeFromFlat(turns, activePath)
            tree.sessionId = sessionId
            tree.activeMessages = getActiveMessages(tree)
            
            conversationTreesBySession.value[sessionId] = tree
            activePathBySession.value[sessionId] = activePath
            
            console.log('[chatStore] 创建对话树:', sessionId, '节点数:', turns.length)
            return
        }
        
        // 如果树已存在，增量更新（只处理新增的 turn）
        const existingTurnIds = new Set<string>()
        existingTree.nodeMap.forEach((node, turnId) => {
            if (turnId !== 'root') {
                existingTurnIds.add(turnId)
            }
        })
        
        // 找出新增的 turn
        const newTurns: Turn[] = []
        turnMap.forEach((turnMessages, turnId) => {
            if (!existingTurnIds.has(turnId)) {
                const firstMsg = turnMessages[0]
                newTurns.push({
                    turnId,
                    sessionId,
                    parentTurnId: firstMsg.parentTurnId || null,
                    content: turnMessages.map(m => m.message).join('\n'),
                    role: firstMsg.type === 'USER' ? 'user' as const : 'assistant' as const,
                    type: firstMsg.type,
                    createdAt: firstMsg.startTime || new Date(),  // 确保有默认值
                    messageId: firstMsg.messageId,
                    data: firstMsg.data
                })
            }
        })
        
        // 如果没有新 turn，跳过更新
        if (newTurns.length === 0) {
            return
        }
        
        // 将新节点添加到树中
        newTurns.forEach(turn => {
            const node: ConversationNode = {
                id: turn.turnId,
                turn,
                parentId: turn.parentTurnId,
                children: [],
                depth: 0,
                isActive: false,  // 默认不激活，由后续路径计算决定
                role: turn.role
            }
            
            existingTree.nodeMap.set(turn.turnId, node)
            
            // 添加到父节点的 children
            const parentId = turn.parentTurnId || 'root'
            const parent = existingTree.nodeMap.get(parentId)
            if (parent) {
                parent.children.push(node)
                // 按创建时间排序
                parent.children.sort((a, b) => {
                    return a.turn.createdAt.getTime() - b.turn.createdAt.getTime()
                })
            }
        })
        
        // 重新计算深度
        const calculateDepth = (node: ConversationNode, depth: number) => {
            node.depth = depth
            node.children.forEach((child: ConversationNode) => calculateDepth(child, depth + 1))
        }
        if (existingTree.root) {
            calculateDepth(existingTree.root, 0)
        }
        
        // 更新激活路径（如果有新的 turn 在当前激活路径上，自动延长路径）
        const currentActivePath = activePathBySession.value[sessionId] || []
        const lastActiveTurnId = currentActivePath[currentActivePath.length - 1]
        
        // 检查新 turn 是否在当前路径末端
        const newPathTurns = newTurns.filter(t => t.parentTurnId === lastActiveTurnId)
        if (newPathTurns.length > 0) {
            // 选择最新的 turn 添加到激活路径
            const latestTurn = newPathTurns.sort((a, b) => 
                b.createdAt.getTime() - a.createdAt.getTime()
            )[0]
            
            currentActivePath.push(latestTurn.turnId)
            activePathBySession.value[sessionId] = currentActivePath
        }
        
        // 更新树的激活路径和激活消息
        highlightActivePath(existingTree, currentActivePath)
        existingTree.activePath = currentActivePath
        existingTree.activeMessages = getActiveMessages(existingTree)
        
        console.log('[chatStore] 增量更新对话树:', sessionId, '新增节点:', newTurns.length)
    },

    /**
     * 计算默认激活路径（从根节点到最后一个叶子节点，默认选择每层最新的分支）
     * @param turns Turn 数组
     * @returns turnId 数组
     */
    calculateDefaultActivePath(turns: Turn[]): string[] {
        if (turns.length === 0) return []
        
        // 构建简单的父子关系映射
        const childrenMap = new Map<string | null, Turn[]>()
        turns.forEach(turn => {
            const parentId = turn.parentTurnId
            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, [])
            }
            childrenMap.get(parentId)!.push(turn)
        })
        
        // 对每个父节点的子节点按时间排序
        childrenMap.forEach(children => {
            children.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        })
        
        // 从根节点开始，选择每层最后一个子节点
        const path: string[] = []
        let currentParentId: string | null = null
        
        while (true) {
            const children = childrenMap.get(currentParentId)
            if (!children || children.length === 0) break
            
            // 选择最新的子节点（最后一个）
            const nextTurn = children[children.length - 1]
            path.push(nextTurn.turnId)
            currentParentId = nextTurn.turnId
        }
        
        return path
    },

    /**
     * 获取会话的对话树
     * @param sessionId 会话ID
     * @returns 对话树或 null
     */
    getConversationTree(sessionId: string): ConversationTree | null {
        return conversationTreesBySession.value[sessionId] || null
    },

    /**
     * 从后端加载对话树
     * @param sessionId 会话ID
     * @returns 对话树
     */
    async fetchConversationTree(sessionId: string): Promise<ConversationTree | null> {
        isLoadingConversationTree.value = true
        try {
            // 优先来自真实数据（messagesBySession）
            const messages = messagesBySession.value[sessionId] || []
            const turns: Turn[] = []
            const activePath: string[] = []

            if (messages.length > 0) {
                // 从 messages 构建 turns
                const turnMap = new Map<string, Turn>()
                messages.forEach(msg => {
                    const turnId = msg.turnId
                    if (!turnId) return
                    
                    if (!turnMap.has(turnId)) {
                        turnMap.set(turnId, {
                            turnId,
                            sessionId,
                            parentTurnId: msg.parentTurnId || null,
                            content: '',
                            role: msg.type === 'USER' ? 'user' : 'assistant',
                            type: msg.type,
                            createdAt: msg.startTime || new Date(),
                            messageId: msg.messageId,
                            data: msg.data
                        })
                    }
                    
                    // 串联消息内容
                    const turn = turnMap.get(turnId)!
                    turn.content += (turn.content ? '\n' : '') + msg.message
                })
                
                turns.push(...Array.from(turnMap.values()))
                
                // 来自 chatStore 的 activePathBySession
                const storedActivePath = activePathBySession.value[sessionId] || []
                if (storedActivePath.length > 0) {
                    activePath.push(...storedActivePath)
                } else if (turns.length > 0) {
                    // 第一个 turn 作为默认激活路径
                    activePath.push(turns[0].turnId)
                }
            } else {
                // 如果没有真实数据，检查是否已经有缓存的树
                const existingTree = conversationTreesBySession.value[sessionId]
                if (existingTree) {
                    console.log('[ConversationTree] 使用缓存的树:', sessionId)
                    return existingTree
                }
                
                // 都没有数据，改用 Mock 数据 测试
                console.warn('[ConversationTree] 没有真实数据也没有缓存，改用 Mock 数据，会话 ID:', sessionId)

            }

            // 构建树
            const tree = buildTreeFromFlat(turns, activePath)
            tree.sessionId = sessionId
            tree.activeMessages = getActiveMessages(tree)

            // 缓存到 store
            conversationTreesBySession.value[sessionId] = tree

            return tree
        } catch (error) {
            console.error('加载对话树失败:', error)
            return null
        } finally {
            isLoadingConversationTree.value = false
        }
    },

    /**
     * 切换到指定分支
     * @param sessionId 会话ID
     * @param targetTurnId 目标节点ID
     * @returns 是否成功
     */
    async switchToPath(sessionId: string, targetTurnId: string): Promise<boolean> {
        try {
            const tree = conversationTreesBySession.value[sessionId]
            if (!tree) {
                console.warn('对话树不存在:', sessionId)
                return false
            }

            // TODO: 后端对接 - 调用后端 API 计算新路径
            // const http = (await import('@/services/http')).default
            // const response = await http.post(`/agent/chat/turns/${targetTurnId}/switch`, { sessionId })
            // const newActivePath = response.data.newActivePath

            // 临时：前端计算新路径
            const newActivePath = getPathToNode(tree, targetTurnId)

            console.log('计算新路径:', newActivePath)
            if (newActivePath.length === 0) {
                console.warn('无法计算到目标节点的路径:', targetTurnId)
                return false
            }

            // 更新树的激活路径
            highlightActivePath(tree, newActivePath)
            tree.activePath = newActivePath
            tree.activeMessages = getActiveMessages(tree)
            
            // 更新全局激活路径
            activePathBySession.value[sessionId] = newActivePath

            // 更新消息列表（显示新路径上的消息）
            if (tree.activeMessages) {
                store.setSessionMessages(sessionId, tree.activeMessages)
            }

            console.log('成功切换到分支:', targetTurnId, '新路径:', newActivePath)
            return true
        } catch (error) {
            console.error('切换分支失败:', error)
            return false
        }
    },

    /**
     * 获取当前激活路径上的消息
     * 这是页面显示消息的主要数据源
     * @param sessionId 会话ID
     * @returns 消息数组
     */
    getActivePathMessages(sessionId: string): UIMessage[] {
        const tree = conversationTreesBySession.value[sessionId]
        if (!tree || !tree.activeMessages) {
            // 如果树不存在，降级使用 messagesBySession
            return store.getSessionMessages(sessionId)
        }
        return tree.activeMessages
    },
    
    /**
     * 获取当前激活路径
     * @param sessionId 会话ID
     * @returns turnId 数组
     */
    getActivePath(sessionId: string): string[] {
        return activePathBySession.value[sessionId] || []
    },

    /**
     * 清除会话的对话树缓存
     * @param sessionId 会话ID
     */
    clearConversationTree(sessionId: string) {
        delete conversationTreesBySession.value[sessionId]
    }
}

// 导出 Pinia 存储
export const useChatStore = defineStore('chat', () => store)

// 便捷函数：向会话添加消息
export function appendMessage(id: string, msg: UIMessage) {
    const arr = messagesBySession.value[id] ?? []
    messagesBySession.value[id] = [...arr, msg]
    const idx = sessions.value.findIndex(s => s.id === id)
    if (idx >= 0) {
        sessions.value[idx] = {...sessions.value[idx], updatedTime: new Date()}
    } else {
        const newSession: Session = {
            id,
            title: '新对话',
            type: AgentType.ReAct,
            createdTime: new Date(),
            updatedTime: new Date()
        }
        sessions.value.unshift(newSession)
    }
}
