import {ref, computed, watch} from 'vue'
import {watchDebounced} from '@vueuse/core'
import {defineStore} from 'pinia'
import type {Session} from '@/types/session'
import {AgentType} from '@/types/session'
import type {UIMessage, TokenUsageData, BillingData, WarningData} from '@/types/events'
import {PlanData, PlanPhase, PlanPhaseStatus, PlanStatus} from '@/types/events'
import {nanoid} from 'nanoid'
import {getSessions} from '@/api/session'
import type {ConversationTree, Turn, ConversationNode} from '@/types/conversation'
import {buildTreeFromFlat, getActiveMessages, getPathToNode, highlightActivePath} from '@/utils/ConversationTreeBuilder'
import {notification} from 'ant-design-vue'
import {useExecutionModeStore} from '@/stores/executionModeStore'
import i18n from '@/i18n'

const { t } = i18n.global


// === 当前编辑的临时会话（不显示在列表中）===
// 使用唯一固定 ID 以便追踪
const EDITING_SESSION_ID = `temp-editing-${Date.now()}`

// === executionModeStore 引用（延迟获取，避免循环初始化）===
// preferredAgentType / selectedModelId 等已迁移至 executionModeStore
// chatStore 通过 execStore() 读取，facade 在 return 中透传以保持向后兼容
const execStore = () => useExecutionModeStore()

const currentEditingSession = ref<Session>({
    id: EDITING_SESSION_ID,
    title: t('storeChat.defaultTitle'),
    type: AgentType.VoloAI, // 初始默认值，运行时通过 execStore().preferredAgentType 获取
    createdTime: new Date(),
    updatedTime: new Date()
})

// 🛡️ HIGH-01 竞态防护：每个 session 的请求版本号
// 同一 session 并发请求时，只有最新版本的响应才会被写入
const fetchVersionBySession: Record<string, number> = {}

const fetchSessionMessagesByEndpoint = async (sessionId: string, endpoint: string): Promise<boolean> => {
    // 递增当前 session 的请求版本号，记录本次请求的版本
    const currentVersion = (fetchVersionBySession[sessionId] || 0) + 1
    fetchVersionBySession[sessionId] = currentVersion

    isLoadingMessages.value = true
    loadingMessagesForSessionId.value = sessionId
    try {
        const http = (await import('@/services/http')).default
        const response: any = await http.get(endpoint)

        if (response.code === 200 && Array.isArray(response.data)) {
            // ChatMessageVO 已在后端统一了 messageId/sender/data/meta 的转换逻辑
            // 对齐规则参见：CLAUDE.md「SSE 与 DB 同步规范」
            const messages = response.data.map((msg: any) => ({
                messageId: msg.messageId,
                type: msg.type,
                sender: msg.sender,
                turnId: msg.turnId,
                parentTurnId: msg.parentTurnId,
                message: msg.message,
                startTime: new Date(msg.startTime),
                endTime: msg.endTime ? new Date(msg.endTime) : undefined,
                data: msg.data,
                meta: msg.meta
            }))

            // 🛡️ 竞态防护 1：检查当前活跃会话是否还是目标会话
            // 如果用户已切换到其他会话，忽略过期响应
            if (activeSessionId.value !== sessionId) {
                console.log(`[chatStore] 忽略过期响应（会话已切换）: sessionId=${sessionId}, 当前活跃会话=${activeSessionId.value}`)
                return false
            }

            // 🛡️ 竞态防护 2：检查请求版本号是否仍为最新
            // 同一 session 快速触发多次请求时，丢弃旧版本响应
            if (fetchVersionBySession[sessionId] !== currentVersion) {
                console.log(`[chatStore] 忽略过期响应（版本过期）: sessionId=${sessionId}, 请求版本=${currentVersion}, 最新版本=${fetchVersionBySession[sessionId]}`)
                return false
            }

            store.setSessionMessages(sessionId, messages)
            return true
        }

        if (response.code !== 200) {
            notification.error({
                message: response.code,
                description: response.message
            })
        }

        return false
    } catch (error: any) {
        console.error('Failed to fetch session messages:', error)
        notification.error({
            message: t('storeChat.fetchMessagesFailed'),
            description: error.message
        })
        // 错误时不替换缓存内容，保留现有数据（可能是水合缓存）
        return false
    } finally {
        // 仅当当前加载的会话仍是本次请求的会话时，才重置 loading 状态
        // 防止快速切换会话时，先完成的请求错误地清除后续请求的 loading 状态
        if (loadingMessagesForSessionId.value === sessionId) {
            isLoadingMessages.value = false
            loadingMessagesForSessionId.value = null
        }
    }
}


// === 知识库选择状态 ===
const SELECTED_KB_IDS_CACHE_KEY = 'volo_ai_selected_kb_ids_v1'
const selectedKnowledgeBaseIds = ref<string[]>([])

const loadSelectedKbIdsFromCache = (): string[] => {
    try {
        const cached = localStorage.getItem(SELECTED_KB_IDS_CACHE_KEY)
        if (!cached) return []
        const parsed = JSON.parse(cached)
        if (!Array.isArray(parsed)) return []
        selectedKnowledgeBaseIds.value = parsed
        return parsed
    } catch {
        return []
    }
}

const saveSelectedKbIdsToCache = (ids: string[]) => {
    try {
        localStorage.setItem(SELECTED_KB_IDS_CACHE_KEY, JSON.stringify(ids))
    } catch (error) {
        console.error('[chatStore] 保存知识库选择缓存失败:', error)
    }
}

// 模块加载时水合
loadSelectedKbIdsFromCache()

watch(selectedKnowledgeBaseIds, (next) => {
    saveSelectedKbIdsToCache(next)
}, { deep: true })

const sessions = ref<Session[]>([])
const isLoadingSessions = ref(false)
const isLoadingMessages = ref(false)
const loadingMessagesForSessionId = ref<string | null>(null) // 当前正在加载消息的会话ID
const messagesBySession = ref<Record<string, UIMessage[]>>({})
const plansBySession = ref<Record<string, PlanData | null>>({})

const SESSIONS_CACHE_KEY = 'volo_ai_sessions'
const MESSAGES_CACHE_KEY = 'volo_ai_messages_by_session'
const sessionsCacheHydrated = ref(false)
let loadSessionsInflight: Promise<void> | null = null
const messagesCacheHydrated = ref(false)

const loadSessionsFromCache = (): Session[] => {
    try {
        const cached = localStorage.getItem(SESSIONS_CACHE_KEY)
        if (!cached) return []
        const parsed = JSON.parse(cached)
        if (!Array.isArray(parsed)) return []
        return parsed
            .filter((s: any) => s && typeof s.id === 'string')
            .map((s: any) => ({
                id: s.id,
                title: typeof s.title === 'string' ? s.title : t('storeChat.defaultTitle'),
                type: (s.type as AgentType) || AgentType.VoloAI,
                createdTime: s.createdTime ? new Date(s.createdTime) : new Date(),
                updatedTime: s.updatedTime ? new Date(s.updatedTime) : new Date(),
                isPin: Boolean(s.isPin)
            }))
    } catch (error) {
        console.error('[chatStore] 从缓存加载会话列表失败:', error)
        return []
    }
}

const saveSessionsToCache = (data: Session[]) => {
    try {
        const serializable = data.map(s => ({
            id: s.id,
            title: s.title,
            type: s.type,
            createdTime: s.createdTime instanceof Date ? s.createdTime.toISOString() : s.createdTime,
            updatedTime: s.updatedTime instanceof Date ? s.updatedTime.toISOString() : s.updatedTime,
            isPin: Boolean(s.isPin)
        }))
        localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(serializable))
    } catch (error) {
        console.error('[chatStore] 保存会话列表缓存失败:', error)
    }
}

const loadMessagesFromCache = (): Record<string, UIMessage[]> => {
    try {
        const cached = localStorage.getItem(MESSAGES_CACHE_KEY)
        if (!cached) return {}
        const parsed = JSON.parse(cached)
        if (!parsed || typeof parsed !== 'object') return {}

        // 反序列化消息（恢复 Date 对象）
        const result: Record<string, UIMessage[]> = {}
        for (const [sessionId, messages] of Object.entries(parsed)) {
            if (Array.isArray(messages)) {
                result[sessionId] = messages.map((msg: any) => ({
                    ...msg,
                    startTime: msg.startTime ? new Date(msg.startTime) : undefined,
                    endTime: msg.endTime ? new Date(msg.endTime) : undefined
                }))
            }
        }
        return result
    } catch (error) {
        console.error('[chatStore] 从缓存加载消息失败:', error)
        return {}
    }
}

const saveMessagesToCache = (data: Record<string, UIMessage[]>) => {
    try {
        // 序列化消息（Date 转为 ISO 字符串）
        const serializable: Record<string, any[]> = {}
        for (const [sessionId, messages] of Object.entries(data)) {
            serializable[sessionId] = messages.map(msg => ({
                ...msg,
                startTime: msg.startTime instanceof Date ? msg.startTime.toISOString() : msg.startTime,
                endTime: msg.endTime instanceof Date ? msg.endTime.toISOString() : msg.endTime
            }))
        }
        localStorage.setItem(MESSAGES_CACHE_KEY, JSON.stringify(serializable))
    } catch (error) {
        console.error('[chatStore] 保存消息缓存失败:', error)
    }
}

watch(sessions, (next) => {
    saveSessionsToCache(next)
}, { deep: true })

// 防抖写入：流式对话时每秒可能触发几十次 deep change，
// 延迟 1s 批量写入 localStorage，避免同步序列化阻塞 UI
watchDebounced(messagesBySession, (next) => {
    saveMessagesToCache(next)
}, { deep: true, debounce: 1000, maxWait: 3000 })

// 页面卸载前强制刷新消息缓存，防止防抖窗口内的最新消息丢失
// beforeunload 是同步事件，localStorage.setItem 在此是安全的
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        saveMessagesToCache(messagesBySession.value)
    })
}


// === 对话树状态 ===
// 对话树是核心数据结构，替代 messagesBySession 作为消息的主要来源
// 每个会话维护一棵树，树节点包含完整的 turnId 和消息信息
const conversationTreesBySession = ref<Record<string, ConversationTree>>({})
const isLoadingConversationTree = ref(false)

// 每个会话当前激活的路径（turnId 数组）
// 格式：{ sessionId: [turnId1, turnId2, ...] }
const activePathBySession = ref<Record<string, string[]>>({})

// 每个会话的分支选择状态（全局状态，所有组件共享）
// 格式：{ sessionId: Map<parentTurnId, selectedChildIndex> }
// parentTurnId 为 '__ROOT__' 表示根分支的选择
const activeBranchBySession = ref<Record<string, Map<string, number>>>({})

// 每个会话当前显示的路径（仅用于对话树高亮，不影响消息列表）
// 🎯 来自 Index.vue 的 currentDisplayPath，跟踪用户在组件内的分支选择
// 格式：{ sessionId: [turnId1, turnId2, ...] }
const displayPathBySession = ref<Record<string, string[]>>({})


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

// === Artifact Panel 全局状态 ===
export type ArtifactType = 'code' | 'preview' | 'document' | 'table' | 'image' | 'pdf'

interface ArtifactPanelState {
    isOpen: boolean
    width: number  // percent
    content: string
    type: ArtifactType
}

const artifactPanelState = ref<ArtifactPanelState>({
    isOpen: false,
    width: 45,
    content: '',
    type: 'code'
})

// === Artifact 历史记录管理 ===
export interface ArtifactHistoryItem {
    id: string
    title: string
    content: string
    type: ArtifactType
    createdTime: Date
    sessionId: string
}

const artifactHistory = ref<ArtifactHistoryItem[]>([])

// === 计费状态（V4 超精简版）===
// Token 使用统计（按会话存储，实时更新）
const tokenUsageBySession = ref<Record<string, TokenUsageData>>({})
// 计费信息（按会话存储，扣费完成后更新）
const billingInfoBySession = ref<Record<string, BillingData>>({})
// 警告信息（按会话存储，通用警告机制）
const warningInfoBySession = ref<Record<string, { data: WarningData; message: string }>>({})

// === 活跃会话管理（核心架构：谁的数据谁负责）===
// 当前活跃的会话 ID，由 ChatGateway 设置，Store 自己决定如何加载
const activeSessionId = ref<string | null>(null)
// 编辑会话提升标记：promoteEditingSession 设置，watch(activeSessionId) 消费
// 提升期间跳过 loadSession 和 componentKey 更新，避免组件重建和后台 fetch 覆盖消息
let _isPromoting = false

// === 视图状态管理（重构：从 ChatGateway 收拢）===
export type ChatViewType = 'loading' | 'welcome' | 'volo-ai'

interface ChatViewState {
    type: ChatViewType
    sessionId: string | null  // 当前显示的会话 ID（可能是 temp-editing-*）
}

const chatViewState = ref<ChatViewState>({
    type: 'loading',
    sessionId: null
})

// 组件稳定 key：仅在真正的会话切换时变化，promotion 期间保持不变
// 这样组件不会在 temp→real 提升时被销毁重建
const componentKey = ref<string | null>(null)

// === 辅助函数：获取 Agent 类型对应的视图类型 ===
const getViewTypeForAgent = (type: AgentType): ChatViewType => {
    switch (type) {
        case AgentType.VoloAI: return 'volo-ai'
        default: return 'volo-ai'
    }
}

// === 核心：监听活跃会话变化，处理所有相关逻辑 ===
watch(activeSessionId, async (newId, oldId) => {
    console.log('[chatStore] 活跃会话变化:', oldId, '->', newId)

    // 情况 1：无会话 ID，显示欢迎页
    if (!newId) {
        // 检查是否有编辑会话
        if (currentEditingSession.value.id.startsWith('temp-editing-')) {
            chatViewState.value = {
                type: getViewTypeForAgent(currentEditingSession.value.type),
                sessionId: currentEditingSession.value.id
            }
            componentKey.value = currentEditingSession.value.id
        } else {
            chatViewState.value = {
                type: 'welcome',
                sessionId: null
            }
            componentKey.value = null
        }
        return
    }

    // 情况 2：临时会话（temp-editing-*）
    if (newId.startsWith('temp-')) {
        const session = sessions.value.find(s => s.id === newId)
        const agentType = session?.type || currentEditingSession.value.type || execStore().preferredAgentType
        chatViewState.value = {
            type: getViewTypeForAgent(agentType),
            sessionId: newId
        }
        componentKey.value = newId
        return
    }

    // 情况 3：真实会话（不存在则回退）
    const session = sessions.value.find(s => s.id === newId)
    if (!session) {
        console.warn('[chatStore] 会话不存在:', newId)
        chatViewState.value = {
            type: 'welcome',
            sessionId: null
        }
        componentKey.value = null
        return
    }

    // 情况 4a：编辑会话提升（预创建后 temp→real）
    // 更新视图 sessionId，但保持 componentKey 不变，避免组件重建
    if (_isPromoting) {
        _isPromoting = false
        console.log('[chatStore] 编辑会话提升，保持组件稳定:', newId)
        chatViewState.value = {
            type: getViewTypeForAgent(session.type),
            sessionId: newId
        }
        // componentKey 保持不变 → 组件不重建
        // 不调用 loadSession → 避免后台 fetch 覆盖刚迁移的消息
        return
    }

    // 情况 4b：正常会话切换
    console.log('[chatStore] 正常会话切换，更新视图:', newId)
    chatViewState.value = {
        type: getViewTypeForAgent(session.type),
        sessionId: newId
    }
    componentKey.value = newId

    // 执行消息加载
    await loadSession(newId, true)
})

// === 会话操作函数 ===

const loadSession = async (id: string, allowBackgroundRefresh: boolean = true): Promise<boolean> => {
    // 如果是编辑会话，不需要加载
    if (id === EDITING_SESSION_ID) {
        return true
    }

    // 🆕 先尝试从缓存加载消息（水合）
    if (!messagesCacheHydrated.value) {
        const cachedMessages = loadMessagesFromCache()
        if (Object.keys(cachedMessages).length > 0) {
            messagesBySession.value = cachedMessages
            console.log('[chatStore] 从缓存加载消息:', Object.keys(cachedMessages).length, '个会话')
        }
        messagesCacheHydrated.value = true
    }

    // 🎯 水合缓存策略：即使有缓存也请求后端，缓存只是为了丝滑体验
    const hasCachedMessages = messagesBySession.value[id] && messagesBySession.value[id].length > 0
    if (hasCachedMessages) {
        console.log('[chatStore] 使用缓存的消息（水合）:', id, messagesBySession.value[id].length, '条', allowBackgroundRefresh ? '，同时后台刷新...' : '（跳过后台刷新）')
    }

    // 始终请求后端获取最新数据
    const session = sessions.value.find(s => s.id === id)
    const agentType = session?.type || execStore().preferredAgentType || AgentType.VoloAI

    // 如果有缓存，后台静默刷新（不阻塞返回）
    if (hasCachedMessages) {
        // 如果调用方明确禁止后台刷新，则跳过
        if (!allowBackgroundRefresh) {
            console.log('[chatStore] 跳过后台刷新（调用方指定）:', id)
            return true
        }

        // 后台刷新，不等待结果，但添加竞态防护
        const fetchPromise = store.fetchVoloAISessionMessages(id)

        fetchPromise.then(success => {
            // 🛡️ 竞态防护：后台刷新完成时也检查会话是否仍是目标
            if (success && activeSessionId.value === id) {
                console.log('[chatStore] 后台刷新完成:', id)
            } else if (!success) {
                console.log('[chatStore] 后台刷新跳过（会话已切换或失败）:', id)
            }
        }).catch(error => {
            console.warn('[chatStore] 后台刷新失败，保留缓存数据:', error)
            // 添加用户提示
            notification.warning({
                message: t('storeChat.syncFailed'),
                description: t('storeChat.syncFailedDesc'),
                duration: 4
            })
        })

        return true  // 立即返回，使用缓存数据
    }

    // 无缓存时，同步等待请求结果
    return await store.fetchVoloAISessionMessages(id)
}

const resetEditingSession = (type: AgentType = AgentType.VoloAI, title: string = t('storeChat.defaultTitle')) => {
    const effectiveType: AgentType = type || execStore().getPreferredAgentType() || AgentType.VoloAI
    execStore().setPreferredAgentType(effectiveType)
    // 只修改编辑会话的 type 和 title，不添加到列表
    currentEditingSession.value = {
        id: EDITING_SESSION_ID,
        title,
        type: effectiveType,
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

const createSessionIfNotExists = (id: string, type: AgentType = AgentType.VoloAI, title: string = t('storeChat.defaultTitle')): {
    converted: boolean;
    sessionId: string
} => {
    // 查找是否已有此 ID 的会话
    const existing = sessions.value.find(s => s.id === id)
    if (existing) {
        return {converted: false, sessionId: id}
    }

    // 迁移编辑会话的消息（使用浅拷贝数组，避免引用共享问题）
    const editingMessages = messagesBySession.value[EDITING_SESSION_ID] || []

    // 创建新会话
    const newSession: Session = {
        id,
        title,
        type,
        createdTime: new Date(),
        updatedTime: new Date()
    }
    sessions.value.unshift(newSession)
    messagesBySession.value[id] = [...editingMessages]

    // 迁移对话树状态（与 promoteEditingSession 保持一致）
    if (conversationTreesBySession.value[EDITING_SESSION_ID]) {
        conversationTreesBySession.value[id] = conversationTreesBySession.value[EDITING_SESSION_ID]
        delete conversationTreesBySession.value[EDITING_SESSION_ID]
    }
    if (activePathBySession.value[EDITING_SESSION_ID]) {
        activePathBySession.value[id] = activePathBySession.value[EDITING_SESSION_ID]
        delete activePathBySession.value[EDITING_SESSION_ID]
    }
    if (activeBranchBySession.value[EDITING_SESSION_ID]) {
        activeBranchBySession.value[id] = activeBranchBySession.value[EDITING_SESSION_ID]
        delete activeBranchBySession.value[EDITING_SESSION_ID]
    }
    if (displayPathBySession.value[EDITING_SESSION_ID]) {
        displayPathBySession.value[id] = displayPathBySession.value[EDITING_SESSION_ID]
        delete displayPathBySession.value[EDITING_SESSION_ID]
    }

    // 清空编辑会话
    messagesBySession.value[EDITING_SESSION_ID] = []
    currentEditingSession.value = {
        id: EDITING_SESSION_ID,
        title: t('storeChat.defaultTitle'),
        type: AgentType.VoloAI,
        createdTime: new Date(),
        updatedTime: new Date()
    }

    // [Phase 3 清理] isTempToRealConverting flag 和 setTimeout 兜底已移除
    // 预创建会话后不再需要 temp→real 转换防护

    return {converted: true, sessionId: id}
}

// === SWR：Store 创建时立即从 localStorage 水合会话列表 ===
// 确保侧边栏在非 chat 路由也能显示缓存数据，无需等待 API 调用
;(() => {
    const cached = loadSessionsFromCache()
    if (cached.length > 0) {
        sessions.value = cached
    }
    sessionsCacheHydrated.value = true
})()

// === 向后兼容 facade：从 executionModeStore 透传的 computed 引用 ===
// 使用 computed 包装，确保 Pinia 识别为响应式 getter（而非普通属性）
const _preferredAgentType = computed(() => execStore().preferredAgentType)
const _selectedModelId = computed(() => execStore().selectedModelId)
const _availableModels = computed(() => execStore().availableModels)
const _executionUiModeId = computed(() => execStore().executionUiModeId)
const _executionModeConfigs = computed(() => execStore().executionModeConfigs)

// === 导出的 store 对象 ===
const store = {
    // 响应式状态
    // sessionId, // Removed
    sessions,
    isLoadingSessions,
    isLoadingMessages,
    loadingMessagesForSessionId,
    messagesBySession,
    plansBySession,
    planWidgetState,
    artifactPanelState,  // 新增：Artifact Panel 全局状态
    currentEditingSession,
    conversationTreesBySession,
    isLoadingConversationTree,
    // === 向后兼容 facade：从 executionModeStore 透传 ===
    preferredAgentType: _preferredAgentType,
    selectedModelId: _selectedModelId,
    availableModels: _availableModels,
    executionUiModeId: _executionUiModeId,
    executionModeConfigs: _executionModeConfigs,
    selectedKnowledgeBaseIds,
    // ========== 计费状态（V4 超精简版）==========
    tokenUsageBySession,
    billingInfoBySession,
    warningInfoBySession,

    // ========== 视图状态（重构：从 ChatGateway 收拢）==========
    chatViewState,
    componentKey,
    // 活跃会话（核心：谁的数据谁负责）
    activeSessionId,
    setActiveSessionId(sessionId: string | null) {
        activeSessionId.value = sessionId
    },

    // 初始化视图状态（用于直接访问路由时强制刷新视图）
    initViewState() {
        // 手动触发视图状态更新（解决 watch 因值相同不触发的问题）
        const sessionId = activeSessionId.value
        console.log('[chatStore] 初始化视图状态:', sessionId)

        if (!sessionId) {
            // 无会话 ID，显示欢迎页或编辑会话
            if (currentEditingSession.value.id.startsWith('temp-editing-')) {
                chatViewState.value = {
                    type: getViewTypeForAgent(currentEditingSession.value.type),
                    sessionId: currentEditingSession.value.id
                }
                componentKey.value = currentEditingSession.value.id
            } else {
                chatViewState.value = {
                    type: 'welcome',
                    sessionId: null
                }
                componentKey.value = null
            }
        }
    },

    // 会话操作
    loadSession,
    resetEditingSession,
    createSession,
    createSessionIfNotExists,

    /**
     * 将编辑会话提升为真实会话（在 SSE 之前调用）
     * 通过 _isPromoting 标记让 watch(activeSessionId) 跳过 loadSession 和 componentKey 更新，
     * 避免组件重建和后台 fetch 覆盖刚迁移的消息。
     */
    promoteEditingSession(realSessionId: string, type: AgentType = AgentType.VoloAI, title: string = t('storeChat.defaultTitle')) {
        // 1. 创建会话记录
        const newSession: Session = {
            id: realSessionId,
            title,
            type,
            createdTime: new Date(),
            updatedTime: new Date()
        }
        sessions.value.unshift(newSession)

        // 2. 迁移消息
        const editingMessages = messagesBySession.value[EDITING_SESSION_ID] || []
        messagesBySession.value[realSessionId] = [...editingMessages]

        // 2a. 迁移对话树状态（conversationTree、activePath、activeBranch、displayPath）
        // 编辑会话可能已经建立了树结构（首条消息），必须一并迁移到真实会话
        if (conversationTreesBySession.value[EDITING_SESSION_ID]) {
            conversationTreesBySession.value[realSessionId] = conversationTreesBySession.value[EDITING_SESSION_ID]
            delete conversationTreesBySession.value[EDITING_SESSION_ID]
        }
        if (activePathBySession.value[EDITING_SESSION_ID]) {
            activePathBySession.value[realSessionId] = activePathBySession.value[EDITING_SESSION_ID]
            delete activePathBySession.value[EDITING_SESSION_ID]
        }
        if (activeBranchBySession.value[EDITING_SESSION_ID]) {
            activeBranchBySession.value[realSessionId] = activeBranchBySession.value[EDITING_SESSION_ID]
            delete activeBranchBySession.value[EDITING_SESSION_ID]
        }
        if (displayPathBySession.value[EDITING_SESSION_ID]) {
            displayPathBySession.value[realSessionId] = displayPathBySession.value[EDITING_SESSION_ID]
            delete displayPathBySession.value[EDITING_SESSION_ID]
        }

        // 3. 重置编辑会话
        messagesBySession.value[EDITING_SESSION_ID] = []
        currentEditingSession.value = {
            id: EDITING_SESSION_ID,
            title: t('storeChat.defaultTitle'),
            type: AgentType.VoloAI,
            createdTime: new Date(),
            updatedTime: new Date()
        }

        // 4. 标记提升状态，让 watch(activeSessionId) 跳过 loadSession 和 componentKey 更新
        _isPromoting = true
        // 安全网：5 秒后强制重置 _isPromoting，防止 watch 异常导致标记永久卡死
        // 正常流程中 watch(activeSessionId) 的 4a 分支会在同步微任务内消费并重置
        const promotingTimeout = setTimeout(() => {
            if (_isPromoting) {
                console.warn('[chatStore] _isPromoting 超时未重置，强制恢复')
                _isPromoting = false
            }
        }, 5000)
        activeSessionId.value = realSessionId
        // watch 消费后清除超时（正常路径：同步微任务内完成）
        if (!_isPromoting) clearTimeout(promotingTimeout)
        // chatViewState 由 watch(activeSessionId) 的 4a 分支更新
        // componentKey 保持不变 → 组件不重建
    },

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
            const messageId = msg.messageId || crypto.randomUUID()
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
        const messageId = msg.messageId || crypto.randomUUID()
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

    // === Artifact Panel 管理方法 ===

    /**
     * 打开 Artifact Panel
     * @param content 内容
     * @param type 类型
     * @param title 文件标题（可选）
     * @param sessionId 会话ID（可选）
     */
    openArtifactPanel(content: string, type: ArtifactType = 'code', title?: string, sessionId?: string) {
        artifactPanelState.value = {
            isOpen: true,
            width: artifactPanelState.value.width,  // 保持当前宽度
            content,
            type
        }

        // 添加到历史记录
        if (title) {
            const historyItem: ArtifactHistoryItem = {
                id: nanoid(),
                title,
                content,
                type,
                createdTime: new Date(),
                sessionId: sessionId || EDITING_SESSION_ID
            }
            artifactHistory.value.unshift(historyItem)

            // 限制历史记录数量（最多保留 50 条）
            if (artifactHistory.value.length > 50) {
                artifactHistory.value = artifactHistory.value.slice(0, 50)
            }
        }
    },

    /**
     * 关闭 Artifact Panel
     */
    closeArtifactPanel() {
        artifactPanelState.value.isOpen = false
    },

    /**
     * 更新 Artifact Panel 内容
     * @param content 新内容
     */
    updateArtifactContent(content: string) {
        artifactPanelState.value.content = content
    },

    /**
     * 更新 Artifact Panel 类型
     * @param type 新类型
     */
    updateArtifactType(type: ArtifactType) {
        artifactPanelState.value.type = type
    },

    /**
     * 更新 Artifact Panel 宽度
     * @param width 宽度百分比
     */
    updateArtifactWidth(width: number) {
        artifactPanelState.value.width = width
    },

    /**
     * 获取 Artifact Panel 状态
     */
    getArtifactPanelState(): ArtifactPanelState {
        return { ...artifactPanelState.value }
    },

    /**
     * 获取 Artifact 历史记录列表
     * @param sessionId 可选，筛选特定会话的文件
     */
    getArtifactHistory(sessionId?: string): ArtifactHistoryItem[] {
        if (sessionId) {
            return artifactHistory.value.filter(item => item.sessionId === sessionId)
        }
        return [...artifactHistory.value]
    },

    /**
     * 从历史记录打开 Artifact
     * @param historyItem 历史记录项
     */
    openArtifactFromHistory(historyItem: ArtifactHistoryItem) {
        artifactPanelState.value = {
            isOpen: true,
            width: artifactPanelState.value.width,
            content: historyItem.content,
            type: historyItem.type
        }
    },

    /**
     * 清空 Artifact 历史记录
     */
    clearArtifactHistory() {
        artifactHistory.value = []
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

    // === 向后兼容 facade：执行模式/模型/AgentType 方法委托到 executionModeStore ===
    loadModelsFromCache: (...args: any[]) => execStore().loadModelsFromCache(...args),
    saveModelsToCache: (...args: any[]) => execStore().saveModelsToCache(...args),
    refreshModels: (...args: any[]) => execStore().refreshModels(...args),
    getAvailableModels: (...args: any[]) => execStore().getAvailableModels(...args),
    loadExecutionUiModeFromCache: (...args: any[]) => execStore().loadExecutionUiModeFromCache(...args),
    saveExecutionUiModeToCache: (...args: any[]) => execStore().saveExecutionUiModeToCache(...args),
    getExecutionUiModeId: (...args: any[]) => execStore().getExecutionUiModeId(...args),
    setExecutionUiModeId: (...args: any[]) => execStore().setExecutionUiModeId(...args),
    setSelectedModel: (...args: any[]) => execStore().setSelectedModel(...args),
    getSessionModelId: (...args: any[]) => execStore().getSessionModelId(...args),
    updateSessionModel: (...args: any[]) => execStore().updateSessionModel(...args),
    getPreferredAgentType: (...args: any[]) => execStore().getPreferredAgentType(...args),
    setPreferredAgentType: (...args: any[]) => execStore().setPreferredAgentType(...args),
    getExecutionModeConfigs: (...args: any[]) => execStore().getExecutionModeConfigs(...args),

    /**
     * 切换知识库选中状态
     */
    toggleKnowledgeBaseId(id: string) {
        const idx = selectedKnowledgeBaseIds.value.indexOf(id)
        if (idx >= 0) {
            selectedKnowledgeBaseIds.value.splice(idx, 1)
        } else {
            selectedKnowledgeBaseIds.value.push(id)
        }
    },

    /**
     * 设置选中的知识库 ID 列表
     */
    setSelectedKnowledgeBaseIds(ids: string[]) {
        selectedKnowledgeBaseIds.value = [...ids]
    },

    updateExecutionModeConfig: (...args: any[]) => execStore().updateExecutionModeConfig(...args),

    async fetchVoloAISessionMessages(sessionId: string): Promise<boolean> {
        return await fetchSessionMessagesByEndpoint(sessionId, `/agent/chat/volo-ai/${sessionId}/messages`)
    },

    // 从后端加载会话列表（内置请求去重：并发调用共享同一个 Promise）
    // SWR 缓存水合已在 store 创建时完成，此方法仅负责 API 刷新
    loadSessions() {
        // 请求去重：已有进行中的请求则直接复用
        if (loadSessionsInflight) return loadSessionsInflight

        const shouldShowLoading = sessions.value.length === 0
        if (shouldShowLoading) {
            isLoadingSessions.value = true
        }

        loadSessionsInflight = (async () => {
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
                if (shouldShowLoading) {
                    isLoadingSessions.value = false
                }
                loadSessionsInflight = null
            }
        })()

        return loadSessionsInflight
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
        // ✅ 只更新 activePath，不修改节点的 isActive 属性
        // highlightActivePath(existingTree, currentActivePath)  // ✖️ 移除
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
     * 切换到指定分支（轻量级，不重新加载消息）
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

            console.log('[switchToPath] 开始切换分支, 目标节点:', targetTurnId)
            console.log('[switchToPath] 当前活动路径:', tree.activePath)

            // 前端计算到目标节点的路径
            const newActivePath = getPathToNode(tree, targetTurnId)

            console.log('[switchToPath] 计算到目标节点的路径:', newActivePath)
            if (newActivePath.length === 0) {
                console.warn('无法计算到目标节点的路径:', targetTurnId)
                return false
            }

            // 🔧 修复路径截断问题：如果目标节点不是叶子节点，需要延伸路径到叶子节点
            const targetNode = tree.nodeMap.get(targetTurnId)
            if (targetNode && targetNode.children.length > 0) {
                console.log('[switchToPath] 目标节点有子节点，需要延伸路径到叶子节点')

                // 延伸策略：优先沿着原 activePath 继续，否则选择最新的子节点
                let currentNode = targetNode
                const originalActivePath = tree.activePath || []

                while (currentNode.children.length > 0) {
                    let nextChild: ConversationNode | null = null

                    // 策略1: 如果原路径经过这个节点，继续沿着原路径
                    const nextInOriginalPath = originalActivePath.find(
                        id => currentNode.children.some(child => child.id === id)
                    )
                    if (nextInOriginalPath) {
                        nextChild = currentNode.children.find(child => child.id === nextInOriginalPath) || null
                        console.log('[switchToPath] 沿着原路径继续:', nextInOriginalPath)
                    }

                    // 策略2: 否则选择最新的子节点（按创建时间排序）
                    if (!nextChild) {
                        const sortedChildren = [...currentNode.children].sort((a, b) =>
                            b.turn.createdAt.getTime() - a.turn.createdAt.getTime()
                        )
                        nextChild = sortedChildren[0]
                        console.log('[switchToPath] 选择最新子节点:', nextChild.id)
                    }

                    if (!nextChild) break

                    newActivePath.push(nextChild.id)
                    currentNode = nextChild
                }

                console.log('[switchToPath] 延伸后的完整路径:', newActivePath)
            }

            // 🎯 从 activePath 反推 activeBranchBySession
            // 为每个父节点设置其子节点在路径中的索引
            const newBranchMap = new Map<string, number>()

            for (let i = 0; i < newActivePath.length; i++) {
                const turnId = newActivePath[i]
                const node = tree.nodeMap.get(turnId)
                if (!node) continue

                const parentId = node.parentId

                if (parentId && parentId !== 'root') {
                    // 有父节点，获取父节点的所有子节点
                    const parent = tree.nodeMap.get(parentId)
                    if (parent && parent.children.length > 0) {
                        const childIndex = parent.children.findIndex(child => child.id === turnId)
                        if (childIndex >= 0) {
                            newBranchMap.set(parentId, childIndex)
                            console.log(`[switchToPath] 设置分支 ${parentId.substring(0, 8)}... 的索引为 ${childIndex}`)
                        }
                    }
                } else {
                    // 没有父节点或父节点是虚拟根，说明是根节点
                    const rootNode = tree.root
                    if (rootNode && rootNode.children.length > 0) {
                        const rootIndex = rootNode.children.findIndex(child => child.id === turnId)
                        if (rootIndex >= 0) {
                            newBranchMap.set('__ROOT__', rootIndex)
                            console.log(`[switchToPath] 设置根分支索引为 ${rootIndex}`)
                        }
                    }
                }
            }

            // 🎯 更新 activeBranchBySession（触发 Index.vue 的 turns computed 重新计算）
            store.setActiveBranchMap(sessionId, newBranchMap)

            // ✅ 更新树的 activePath（用于对话树高亮）
            tree.activePath = newActivePath
            tree.activeMessages = getActiveMessages(tree)

            console.log('[switchToPath] 成功切换到分支:', targetTurnId, '新路径:', newActivePath)
            console.log('[switchToPath] 更新后的 activeBranchBySession:', Array.from(newBranchMap.entries()))

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
     * 更新当前激活路径（轻量级，不触发消息重新加载）
     * 用于组件内分支切换时同步状态
     * @param sessionId 会话ID
     * @param path turnId 数组
     */
    updateActivePath(sessionId: string, path: string[]) {
        activePathBySession.value[sessionId] = path
        console.log('[chatStore] 更新 activePathBySession:', sessionId, path)
    },

    /**
     * 获取会话的当前显示路径（用于对话树高亮）
     * @param sessionId 会话ID
     * @returns turnId 数组
     */
    getDisplayPath(sessionId: string): string[] {
        return displayPathBySession.value[sessionId] || []
    },

    /**
     * 更新会话的当前显示路径（仅用于对话树高亮，不触发消息更新）
     * @param sessionId 会话ID
     * @param path turnId 数组
     */
    updateDisplayPath(sessionId: string, path: string[]) {
        displayPathBySession.value[sessionId] = path
        console.log('[chatStore] 更新 displayPathBySession:', sessionId, path)
    },

    /**
     * 获取会话的分支选择状态
     * @param sessionId 会话ID
     * @returns 分支选择 Map
     */
    getActiveBranch(sessionId: string): Map<string, number> {
        if (!activeBranchBySession.value[sessionId]) {
            activeBranchBySession.value[sessionId] = new Map()
        }
        return activeBranchBySession.value[sessionId]
    },

    /**
     * 更新会话的分支选择状态
     * @param sessionId 会话ID
     * @param parentKey 父节点 key（turnId 或 '__ROOT__'）
     * @param branchIndex 选中的分支索引
     */
    updateActiveBranch(sessionId: string, parentKey: string, branchIndex: number) {
        if (!activeBranchBySession.value[sessionId]) {
            activeBranchBySession.value[sessionId] = new Map()
        }
        activeBranchBySession.value[sessionId].set(parentKey, branchIndex)
        console.log('[chatStore] 更新 activeBranchBySession:', sessionId, parentKey, branchIndex)
    },

    /**
     * 批量替换会话的分支选择状态（用于从 activePath 重建）
     * @param sessionId 会话ID
     * @param branchMap 新的分支选择 Map
     */
    setActiveBranchMap(sessionId: string, branchMap: Map<string, number>) {
        activeBranchBySession.value[sessionId] = branchMap
        console.log('[chatStore] 批量替换 activeBranchBySession:', sessionId, Array.from(branchMap.entries()))
    },

    /**
     * 清除会话的对话树缓存
     * @param sessionId 会话ID
     */
    clearConversationTree(sessionId: string) {
        delete conversationTreesBySession.value[sessionId]
    },

    // ========== 计费方法（V4 超精简版）==========

    /**
     * 更新会话的 Token 使用统计（实时）
     * @param sessionId 会话 ID
     * @param data Token 使用数据
     */
    updateTokenUsage(sessionId: string, data: TokenUsageData) {
        tokenUsageBySession.value[sessionId] = {
            ...tokenUsageBySession.value[sessionId],
            ...data
        }
        console.log('[chatStore] 更新 token 使用统计:', sessionId, data)
    },

    /**
     * 获取会话的 Token 使用统计
     * @param sessionId 会话 ID
     * @returns Token 使用数据
     */
    getTokenUsage(sessionId: string): TokenUsageData | undefined {
        return tokenUsageBySession.value[sessionId]
    },

    /**
     * 更新会话的计费信息（扣费完成后）
     * @param sessionId 会话 ID
     * @param data 计费数据
     */
    updateBillingInfo(sessionId: string, data: BillingData) {
        billingInfoBySession.value[sessionId] = data
        console.log('[chatStore] 更新计费信息:', sessionId, data)
    },

    /**
     * 获取会话的计费信息
     * @param sessionId 会话 ID
     * @returns 计费数据
     */
    getBillingInfo(sessionId: string): BillingData | undefined {
        return billingInfoBySession.value[sessionId]
    },

    /**
     * 清除会话的计费信息（切换会话时调用）
     * @param sessionId 会话 ID
     */
    clearBillingInfo(sessionId: string) {
        delete tokenUsageBySession.value[sessionId]
        delete billingInfoBySession.value[sessionId]
        delete warningInfoBySession.value[sessionId]
    },

    /**
     * 更新会话的警告信息（余额不足/透支警告）
     * @param sessionId 会话 ID
     * @param data 警告数据
     * @param message 警告消息
     */
    updateWarningInfo(sessionId: string, data: WarningData, message: string) {
        warningInfoBySession.value[sessionId] = { data, message }
        console.log('[chatStore] 更新警告信息:', sessionId, data, message)
    },

    /**
     * 获取会话的警告信息
     * @param sessionId 会话 ID
     * @returns 警告信息
     */
    getWarningInfo(sessionId: string): { data: WarningData; message: string } | undefined {
        return warningInfoBySession.value[sessionId]
    },

    /**
     * 清除会话的警告信息
     * @param sessionId 会话 ID
     */
    clearWarningInfo(sessionId: string) {
        delete warningInfoBySession.value[sessionId]
    },

    // ========== HIGH-02 修复：会话删除时清理所有关联数据 ==========

    /**
     * 清理指定会话的所有关联数据（内部方法）
     * 在删除会话时调用，防止 Map 残留导致内存泄漏
     * @param sessionId 会话 ID
     */
    cleanupSessionData(sessionId: string) {
        delete messagesBySession.value[sessionId]
        delete conversationTreesBySession.value[sessionId]
        delete activePathBySession.value[sessionId]
        delete activeBranchBySession.value[sessionId]
        delete displayPathBySession.value[sessionId]
        delete tokenUsageBySession.value[sessionId]
        delete billingInfoBySession.value[sessionId]
        delete warningInfoBySession.value[sessionId]
        delete plansBySession.value[sessionId]
        // 清理竞态防护版本号
        delete fetchVersionBySession[sessionId]
        console.log('[chatStore] 已清理会话关联数据:', sessionId)
    },

    /**
     * 从 Store 中移除会话及其所有关联数据
     * 在后端删除成功后调用，确保前端状态完全清理
     * @param sessionId 会话 ID
     */
    removeSession(sessionId: string) {
        // 1. 从会话列表中移除
        sessions.value = sessions.value.filter(s => s.id !== sessionId)
        // 2. 清理所有关联的 Map 数据
        store.cleanupSessionData(sessionId)
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
            title: t('storeChat.defaultTitle'),
            type: AgentType.VoloAI,
            createdTime: new Date(),
            updatedTime: new Date()
        }
        sessions.value.unshift(newSession)
    }
}
