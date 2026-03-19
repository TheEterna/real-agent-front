/**
 * sessionStore.ts — 会话管理 Store（从 chatStore 拆分）
 *
 * 职责边界：
 *   - 会话列表的增删改查（sessions, isLoadingSessions）
 *   - 活跃会话管理（activeSessionId, chatViewState, componentKey）
 *   - 编辑会话生命周期（currentEditingSession, promoteEditingSession）
 *   - 会话缓存（localStorage SWR 水合）
 *
 * 不包含：
 *   - 消息管理（messagesBySession → 仍在 chatStore）
 *   - 对话树（conversationTreesBySession → 仍在 chatStore）
 *   - 计费/Token 使用（仍在 chatStore）
 *   - 执行模式/模型选择（→ executionModeStore）
 *
 * 迁移策略：
 *   Phase 1（当前）：创建独立 Store，chatStore 旧代码不删除，二者并存
 *   Phase 2（后续）：外部文件逐步改为引用 sessionStore，chatStore 中旧代码标记 @deprecated
 *   Phase 3（最终）：从 chatStore 删除已迁移的代码
 */
import { ref, watch, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@/types/session'
import { AgentType } from '@/types/session'
import { getSessions } from '@/api/session'
import i18n from '@/i18n'

const { t } = i18n.global

// ============================================================
// 常量
// ============================================================

const EDITING_SESSION_ID = `temp-editing-${Date.now()}`
const SESSIONS_CACHE_KEY = 'volo_ai_sessions'
const PREFERRED_AGENT_TYPE_CACHE_KEY = 'volo_ai_preferred_agent_type'

// ============================================================
// 视图类型
// ============================================================

export type ChatViewType = 'loading' | 'welcome' | 'volo-ai'

export interface ChatViewState {
    type: ChatViewType
    sessionId: string | null
}

// ============================================================
// Store 定义
// ============================================================

export const useSessionStore = defineStore('session', () => {

    // ----------------------------------------------------------
    // State
    // ----------------------------------------------------------

    const sessions = ref<Session[]>([])
    const isLoadingSessions = ref(false)
    const sessionsCacheHydrated = ref(false)

    /** 当前活跃的会话 ID，由 ChatGateway 通过 setActiveSessionId 设置 */
    const activeSessionId = ref<string | null>(null)

    /** 视图状态（loading / welcome / volo-ai） */
    const chatViewState = ref<ChatViewState>({
        type: 'loading',
        sessionId: null
    })

    /** 组件稳定 key：仅在真正的会话切换时变化，promotion 期间保持不变 */
    const componentKey = ref<string | null>(null)

    /** 上次选择的 AgentType（作为默认值） */
    const preferredAgentType = ref<AgentType>(AgentType.VoloAI)

    /** 当前编辑的临时会话 */
    const currentEditingSession = ref<Session>({
        id: EDITING_SESSION_ID,
        title: t('storeSession.defaultTitle'),
        type: preferredAgentType.value,
        createdTime: new Date(),
        updatedTime: new Date()
    })

    /** 编辑会话提升标记 */
    let _isPromoting = false

    /** 去重用 inflight Promise */
    let loadSessionsInflight: Promise<void> | null = null

    // ----------------------------------------------------------
    // 缓存操作（私有）
    // ----------------------------------------------------------

    function loadPreferredAgentTypeFromCache(): AgentType {
        try {
            const cached = localStorage.getItem(PREFERRED_AGENT_TYPE_CACHE_KEY)
            if (cached && Object.values(AgentType).includes(cached as AgentType)) {
                preferredAgentType.value = cached as AgentType
            }
        } catch (error) {
            console.error('[sessionStore] 加载默认 AgentType 缓存失败:', error)
        }
        return preferredAgentType.value
    }

    function savePreferredAgentTypeToCache(type: AgentType) {
        try {
            localStorage.setItem(PREFERRED_AGENT_TYPE_CACHE_KEY, type)
        } catch (error) {
            console.error('[sessionStore] 保存默认 AgentType 缓存失败:', error)
        }
    }

    function loadSessionsFromCache(): Session[] {
        try {
            const cached = localStorage.getItem(SESSIONS_CACHE_KEY)
            if (!cached) return []
            const parsed = JSON.parse(cached)
            if (!Array.isArray(parsed)) return []
            return parsed
                .filter((s: any) => s && typeof s.id === 'string')
                .map((s: any) => ({
                    id: s.id,
                    title: typeof s.title === 'string' ? s.title : t('storeSession.defaultTitle'),
                    type: (s.type as AgentType) || AgentType.VoloAI,
                    createdTime: s.createdTime ? new Date(s.createdTime) : new Date(),
                    updatedTime: s.updatedTime ? new Date(s.updatedTime) : new Date(),
                    isPin: Boolean(s.isPin)
                }))
        } catch (error) {
            console.error('[sessionStore] 从缓存加载会话列表失败:', error)
            return []
        }
    }

    function saveSessionsToCache(data: Session[]) {
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
            console.error('[sessionStore] 保存会话列表缓存失败:', error)
        }
    }

    // ----------------------------------------------------------
    // 初始化（模块加载时立即执行）
    // ----------------------------------------------------------

    // 水合 preferredAgentType
    loadPreferredAgentTypeFromCache()
    // 同步更新 currentEditingSession 的 type
    currentEditingSession.value.type = preferredAgentType.value

    // SWR 水合 sessions
    ;(() => {
        const cached = loadSessionsFromCache()
        if (cached.length > 0) {
            sessions.value = cached
        }
        sessionsCacheHydrated.value = true
    })()

    // 监听 sessions 变化自动落盘
    watch(sessions, (next) => {
        saveSessionsToCache(next)
    }, { deep: true })

    // 监听 preferredAgentType 变化自动落盘
    watch(preferredAgentType, (next) => {
        savePreferredAgentTypeToCache(next)
    })

    // ----------------------------------------------------------
    // 辅助函数
    // ----------------------------------------------------------

    function getViewTypeForAgent(type: AgentType): ChatViewType {
        switch (type) {
            case AgentType.VoloAI: return 'volo-ai'
            default: return 'volo-ai'
        }
    }

    // ----------------------------------------------------------
    // Getters
    // ----------------------------------------------------------

    function getSession(id: string): Session | undefined {
        if (id === EDITING_SESSION_ID) {
            return currentEditingSession.value
        }
        return sessions.value.find(s => s.id === id)
    }

    function getSessionsByAgent(agentType: AgentType): Session[] {
        return sessions.value.filter(s => s.type === agentType)
    }

    function findLatestSessionIdForAgent(agentType: AgentType): string | null {
        const existingSessions = getSessionsByAgent(agentType)
        if (existingSessions.length > 0) {
            const mostRecentSession = existingSessions
                .sort((a, b) => b.updatedTime.getTime() - a.updatedTime.getTime())[0]
            return mostRecentSession.id
        }
        return null
    }

    // ----------------------------------------------------------
    // Actions
    // ----------------------------------------------------------

    function setActiveSessionId(sessionId: string | null) {
        activeSessionId.value = sessionId
    }

    /**
     * 初始化视图状态（用于直接访问路由时强制刷新视图）
     * 解决 watch 因值相同不触发的问题
     */
    function initViewState() {
        const sessionId = activeSessionId.value
        console.log('[sessionStore] 初始化视图状态:', sessionId)

        if (!sessionId) {
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
    }

    /**
     * 从后端加载会话列表（内置请求去重：并发调用共享同一个 Promise）
     */
    function loadSessions(): Promise<void> {
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
    }

    function resetEditingSession(type: AgentType = AgentType.VoloAI, title: string = t('storeSession.defaultTitle')): Session {
        const effectiveType: AgentType = type || loadPreferredAgentTypeFromCache() || AgentType.VoloAI
        preferredAgentType.value = effectiveType
        currentEditingSession.value = {
            id: EDITING_SESSION_ID,
            title,
            type: effectiveType,
            createdTime: new Date(),
            updatedTime: new Date()
        }
        return currentEditingSession.value
    }

    function createSession(title: string, type: AgentType): Session {
        return resetEditingSession(type, title)
    }

    /**
     * 如果会话不存在则创建。返回 { converted, sessionId }。
     *
     * 注意：此方法不负责迁移消息和对话树状态，
     * 那些逻辑仍在 chatStore.createSessionIfNotExists 中。
     * 本方法仅处理会话列表层面的创建。
     */
    function createSessionIfNotExists(id: string, type: AgentType = AgentType.VoloAI, title: string = t('storeSession.defaultTitle')): {
        converted: boolean
        sessionId: string
    } {
        const existing = sessions.value.find(s => s.id === id)
        if (existing) {
            return { converted: false, sessionId: id }
        }

        const newSession: Session = {
            id,
            title,
            type,
            createdTime: new Date(),
            updatedTime: new Date()
        }
        sessions.value.unshift(newSession)

        // 重置编辑会话
        currentEditingSession.value = {
            id: EDITING_SESSION_ID,
            title: t('storeSession.defaultTitle'),
            type: AgentType.VoloAI,
            createdTime: new Date(),
            updatedTime: new Date()
        }

        return { converted: true, sessionId: id }
    }

    /**
     * 将编辑会话提升为真实会话（在 SSE 之前调用）。
     *
     * 注意：此方法不负责迁移消息和对话树状态，
     * 那些逻辑仍在 chatStore.promoteEditingSession 中。
     * 本方法仅处理会话列表 + 视图状态的切换。
     */
    function promoteEditingSession(realSessionId: string, type: AgentType = AgentType.VoloAI, title: string = t('storeSession.defaultTitle')) {
        const newSession: Session = {
            id: realSessionId,
            title,
            type,
            createdTime: new Date(),
            updatedTime: new Date()
        }
        sessions.value.unshift(newSession)

        // 重置编辑会话
        currentEditingSession.value = {
            id: EDITING_SESSION_ID,
            title: t('storeSession.defaultTitle'),
            type: AgentType.VoloAI,
            createdTime: new Date(),
            updatedTime: new Date()
        }

        // 标记提升状态
        _isPromoting = true
        const promotingTimeout = setTimeout(() => {
            if (_isPromoting) {
                console.warn('[sessionStore] _isPromoting 超时未重置，强制恢复')
                _isPromoting = false
            }
        }, 5000)
        activeSessionId.value = realSessionId
        if (!_isPromoting) clearTimeout(promotingTimeout)
    }

    function touchSession(id: string) {
        if (id === EDITING_SESSION_ID) {
            currentEditingSession.value.updatedTime = new Date()
            return
        }
        const idx = sessions.value.findIndex(s => s.id === id)
        if (idx >= 0) {
            sessions.value[idx] = { ...sessions.value[idx], updatedTime: new Date() }
        }
    }

    function removeSession(sessionId: string) {
        sessions.value = sessions.value.filter(s => s.id !== sessionId)
    }

    /**
     * 清理会话关联数据的 session 侧部分。
     * 消息/对话树/计费的清理仍由 chatStore.cleanupSessionData 负责。
     */
    function cleanupSessionData(sessionId: string) {
        // sessionStore 目前不持有 per-session Map 数据
        // 此方法为未来迁移做预留
        console.log('[sessionStore] cleanupSessionData (placeholder):', sessionId)
    }

    // ----------------------------------------------------------
    // watch(activeSessionId) — 核心视图切换逻辑
    // ----------------------------------------------------------
    // 注意：当前阶段此 watch 仅用于 sessionStore 内部消费。
    // chatStore 中仍有独立的 watch(activeSessionId) 处理消息加载。
    // Phase 2 时会合并两个 watch。

    watch(activeSessionId, async (newId, oldId) => {
        console.log('[sessionStore] 活跃会话变化:', oldId, '->', newId)

        if (!newId) {
            if (currentEditingSession.value.id.startsWith('temp-editing-')) {
                chatViewState.value = {
                    type: getViewTypeForAgent(currentEditingSession.value.type),
                    sessionId: currentEditingSession.value.id
                }
                componentKey.value = currentEditingSession.value.id
            } else {
                chatViewState.value = { type: 'welcome', sessionId: null }
                componentKey.value = null
            }
            return
        }

        if (newId.startsWith('temp-')) {
            const session = sessions.value.find(s => s.id === newId)
            const agentType = session?.type || currentEditingSession.value.type || preferredAgentType.value
            chatViewState.value = {
                type: getViewTypeForAgent(agentType),
                sessionId: newId
            }
            componentKey.value = newId
            return
        }

        const session = sessions.value.find(s => s.id === newId)
        if (!session) {
            console.warn('[sessionStore] 会话不存在:', newId)
            chatViewState.value = { type: 'welcome', sessionId: null }
            componentKey.value = null
            return
        }

        if (_isPromoting) {
            _isPromoting = false
            console.log('[sessionStore] 编辑会话提升，保持组件稳定:', newId)
            chatViewState.value = {
                type: getViewTypeForAgent(session.type),
                sessionId: newId
            }
            return
        }

        console.log('[sessionStore] 正常会话切换，更新视图:', newId)
        chatViewState.value = {
            type: getViewTypeForAgent(session.type),
            sessionId: newId
        }
        componentKey.value = newId
        // 消息加载由 chatStore 的 watch(activeSessionId) 负责（Phase 1 不迁移）
    })

    // ----------------------------------------------------------
    // 导出常量（供外部引用 EDITING_SESSION_ID）
    // ----------------------------------------------------------
    const editingSessionId = EDITING_SESSION_ID

    // ----------------------------------------------------------
    // Return
    // ----------------------------------------------------------

    return {
        // State
        sessions,
        isLoadingSessions,
        sessionsCacheHydrated,
        activeSessionId,
        chatViewState,
        componentKey,
        preferredAgentType,
        currentEditingSession,
        editingSessionId,

        // Getters
        getSession,
        getSessionsByAgent,
        findLatestSessionIdForAgent,

        // Actions
        setActiveSessionId,
        initViewState,
        loadSessions,
        loadSessionsFromCache,
        saveSessionsToCache,
        resetEditingSession,
        createSession,
        createSessionIfNotExists,
        promoteEditingSession,
        touchSession,
        removeSession,
        cleanupSessionData,

        // 缓存操作（供 facade / 测试使用）
        getPreferredAgentType: () => preferredAgentType.value,
        setPreferredAgentType: (type: AgentType) => {
            preferredAgentType.value = type
            savePreferredAgentTypeToCache(type)
        }
    }
})
