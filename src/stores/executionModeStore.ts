import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { AgentType } from '@/types/session'
import type { LlmConfig } from '@/types/llm'

// === 上次选择的 AgentType（作为默认值）===
const PREFERRED_AGENT_TYPE_CACHE_KEY = 'volo_ai_preferred_agent_type'
const preferredAgentType = ref<AgentType>(AgentType.VoloAI)

const loadPreferredAgentTypeFromCache = (): AgentType => {
    try {
        const cached = localStorage.getItem(PREFERRED_AGENT_TYPE_CACHE_KEY)
        if (cached && Object.values(AgentType).includes(cached as AgentType)) {
            preferredAgentType.value = cached as AgentType
        }
    } catch (error) {
        console.error('[executionModeStore] 加载默认 AgentType 缓存失败:', error)
    }
    return preferredAgentType.value
}

const savePreferredAgentTypeToCache = (type: AgentType) => {
    try {
        localStorage.setItem(PREFERRED_AGENT_TYPE_CACHE_KEY, type)
    } catch (error) {
        console.error('[executionModeStore] 保存默认 AgentType 缓存失败:', error)
    }
}

// 模块加载时水合
loadPreferredAgentTypeFromCache()

// === 模型管理状态 ===
const selectedModelId = ref<string | null>(null)
const availableModels = ref<LlmConfig[]>([])  // 缓存的模型列表
const modelsLastFetchedAt = ref<number | null>(null)  // 上次获取时间戳
const MODELS_CACHE_DURATION = 5 * 60 * 1000  // 5分钟缓存

const SELECTED_MODEL_CACHE_KEY = 'volo_ai_selected_model_id'

const loadSelectedModelFromCache = (): string | null => {
    try {
        const cached = localStorage.getItem(SELECTED_MODEL_CACHE_KEY)
        selectedModelId.value = cached || null
        return cached
    } catch (error) {
        console.error('[executionModeStore] 加载模型选择缓存失败:', error)
        return null
    }
}

const saveSelectedModelToCache = (modelId: string | null) => {
    try {
        if (!modelId) {
            localStorage.removeItem(SELECTED_MODEL_CACHE_KEY)
        } else {
            localStorage.setItem(SELECTED_MODEL_CACHE_KEY, modelId)
        }
    } catch (error) {
        console.error('[executionModeStore] 保存模型选择缓存失败:', error)
    }
}

// 模块加载时尝试水合一次，确保 ModelSelector 直接绑定 selectedModelId 时不会为空
loadSelectedModelFromCache()

// === 执行模式（右侧下拉）状态 ===
// 仅保存 UI 的 modeId（auto/fast/agent/thought/max），具体映射由页面 uiModes 维护
const executionUiModeId = ref<string | null>(null)

// === 任务策略 Config（VoloAI 模式开关）===
// 持久化每个 UI mode 对应的开关（useWebSearch/useKnowledgeBase）
export type ExecutionModeConfig = { useWebSearch: boolean; useKnowledgeBase: boolean; useMemoryEnhancement: boolean }

const EXECUTION_MODE_CONFIGS_CACHE_KEY = 'volo_ai_execution_mode_configs_v1'
const DEFAULT_EXECUTION_MODE_CONFIGS: Record<string, ExecutionModeConfig> = {
    auto: { useWebSearch: true, useKnowledgeBase: true, useMemoryEnhancement: true },
    fast: { useWebSearch: false, useKnowledgeBase: false, useMemoryEnhancement: false },
    agent: { useWebSearch: true, useKnowledgeBase: true, useMemoryEnhancement: true },
    thought: { useWebSearch: true, useKnowledgeBase: true, useMemoryEnhancement: true },
    max: { useWebSearch: true, useKnowledgeBase: true, useMemoryEnhancement: true }
}

const executionModeConfigs = ref<Record<string, ExecutionModeConfig>>({ ...DEFAULT_EXECUTION_MODE_CONFIGS })

const loadExecutionModeConfigsFromCache = (): Record<string, ExecutionModeConfig> | null => {
    try {
        const cached = localStorage.getItem(EXECUTION_MODE_CONFIGS_CACHE_KEY)
        if (!cached) return null
        const parsed = JSON.parse(cached)
        if (!parsed || typeof parsed !== 'object') return null

        // 深度合并：确保每个 mode 的配置都包含所有字段（兼容新增字段场景）
        const merged: Record<string, ExecutionModeConfig> = { ...DEFAULT_EXECUTION_MODE_CONFIGS }
        for (const [key, value] of Object.entries(parsed)) {
            if (value && typeof value === 'object') {
                merged[key] = { ...(DEFAULT_EXECUTION_MODE_CONFIGS[key] || { useWebSearch: false, useKnowledgeBase: false, useMemoryEnhancement: false }), ...(value as Partial<ExecutionModeConfig>) }
            }
        }
        executionModeConfigs.value = merged
        return executionModeConfigs.value
    } catch (error) {
        console.error('[executionModeStore] 加载执行模式配置缓存失败:', error)
        return null
    }
}

const saveExecutionModeConfigsToCache = (configs: Record<string, ExecutionModeConfig>) => {
    try {
        localStorage.setItem(EXECUTION_MODE_CONFIGS_CACHE_KEY, JSON.stringify(configs))
    } catch (error) {
        console.error('[executionModeStore] 保存执行模式配置缓存失败:', error)
    }
}

// 模块加载时尝试水合一次
loadExecutionModeConfigsFromCache()

// === watch 自动持久化 ===
watch(selectedModelId, (next) => {
    saveSelectedModelToCache(next)
})

watch(executionModeConfigs, (next) => {
    saveExecutionModeConfigsToCache(next)
}, { deep: true })

watch(preferredAgentType, (next) => {
    savePreferredAgentTypeToCache(next)
})

// === 内部 store 引用（用于 self-referencing actions）===
const storeActions = {
    // 响应式状态
    preferredAgentType,
    selectedModelId,
    availableModels,
    executionUiModeId,
    executionModeConfigs,

    // === 模型管理方法 ===

    /**
     * 从 localStorage 加载模型列表
     */
    loadModelsFromCache(): LlmConfig[] {
        try {
            const cached = localStorage.getItem('volo_ai_models')
            if (cached) {
                const parsed = JSON.parse(cached)
                availableModels.value = parsed
                console.log('[executionModeStore] 从缓存加载模型列表:', parsed.length, '个模型')
                return parsed
            }
        } catch (error) {
            console.error('[executionModeStore] 加载模型缓存失败:', error)
        }
        return []
    },

    /**
     * 保存模型列表到 localStorage
     */
    saveModelsToCache(models: LlmConfig[]) {
        try {
            localStorage.setItem('volo_ai_models', JSON.stringify(models))
            availableModels.value = models
            console.log('[executionModeStore] 保存模型列表到缓存:', models.length, '个模型')
        } catch (error) {
            console.error('[executionModeStore] 保存模型缓存失败:', error)
        }
    },

    /**
     * 更新模型列表（无痕替换）
     * 1. 先使用缓存数据（立即可用）
     * 2. 后台获取最新数据
     * 3. 静默替换缓存
     */
    async refreshModels(force: boolean = false): Promise<LlmConfig[]> {
        const now = Date.now()
        const isCacheValid = modelsLastFetchedAt.value &&
            (now - modelsLastFetchedAt.value) < MODELS_CACHE_DURATION

        // 1. 如果有有效缓存且不是强制刷新，立即返回缓存
        if (!force && availableModels.value.length > 0 && isCacheValid) {
            console.log('[executionModeStore] 使用已有模型列表（缓存有效）')
            return availableModels.value
        }

        // 2. 先加载本地缓存（如果存在）
        const cached = storeActions.loadModelsFromCache()

        // 3. 后台异步获取最新数据
        try {
            const { getAllModels } = await import('@/api/llm')
            const res = await getAllModels()

            if (res.code === 200 && Array.isArray(res.data)) {
                storeActions.saveModelsToCache(res.data)
                modelsLastFetchedAt.value = now  // 更新获取时间
                return res.data
            } else {
                console.warn('[executionModeStore] 获取模型列表失败，使用缓存数据')
                return cached
            }
        } catch (error) {
            console.error('[executionModeStore] 获取模型列表异常，使用缓存数据:', error)
            return cached
        }
    },

    /**
     * 获取可用模型列表（优先缓存）
     */
    getAvailableModels(): LlmConfig[] {
        if (availableModels.value.length === 0) {
            storeActions.loadModelsFromCache()
        }
        return availableModels.value
    },

    // === 执行模式（右侧下拉）缓存 ===

    /**
     * 从 localStorage 加载执行模式（UI modeId）
     */
    loadExecutionUiModeFromCache(): string | null {
        try {
            const cached = localStorage.getItem('volo_ai_execution_ui_mode')
            if (cached) {
                executionUiModeId.value = cached
                return cached
            }
        } catch (error) {
            console.error('[executionModeStore] 加载执行模式缓存失败:', error)
        }
        return null
    },

    /**
     * 保存执行模式（UI modeId）到 localStorage
     */
    saveExecutionUiModeToCache(modeId: string) {
        try {
            localStorage.setItem('volo_ai_execution_ui_mode', modeId)
            executionUiModeId.value = modeId
        } catch (error) {
            console.error('[executionModeStore] 保存执行模式缓存失败:', error)
        }
    },

    /**
     * 获取当前执行模式（UI modeId）。若未初始化则从缓存读取，默认返回 auto。
     */
    getExecutionUiModeId(): string {
        if (!executionUiModeId.value) {
            storeActions.loadExecutionUiModeFromCache()
        }
        return executionUiModeId.value || 'auto'
    },

    /**
     * 设置当前执行模式（UI modeId）并持久化
     */
    setExecutionUiModeId(modeId: string) {
        storeActions.saveExecutionUiModeToCache(modeId)
    },

    /**
     * 设置全局选中的模型
     */
    setSelectedModel(modelId: string | null) {
        selectedModelId.value = modelId
        saveSelectedModelToCache(modelId)
    },

    /**
     * 获取指定会话的模型 ID（从全局选中模型获取）
     */
    getSessionModelId(sessionId: string): string | undefined {
        if (!selectedModelId.value) {
            loadSelectedModelFromCache()
        }
        return selectedModelId.value || undefined
    },

    /**
     * 更新会话的模型（已废弃，模型不再存储在会话中）
     * @deprecated 模型选择现在是全局的，不再与会话绑定
     */
    updateSessionModel(sessionId: string, modelId: string) {
        // 仅更新全局模型选择
        selectedModelId.value = modelId
        saveSelectedModelToCache(modelId)
    },

    getPreferredAgentType(): AgentType {
        return preferredAgentType.value
    },

    setPreferredAgentType(type: AgentType) {
        preferredAgentType.value = type
        savePreferredAgentTypeToCache(type)
    },

    /**
     * 获取所有执行模式配置（用于 UI 绑定）
     */
    getExecutionModeConfigs(): Record<string, ExecutionModeConfig> {
        if (!executionModeConfigs.value || Object.keys(executionModeConfigs.value).length === 0) {
            loadExecutionModeConfigsFromCache()
        }
        return executionModeConfigs.value
    },

    /**
     * 更新指定 UI mode 的配置并持久化
     */
    updateExecutionModeConfig(modeId: string, updates: Partial<ExecutionModeConfig>) {
        const prev = executionModeConfigs.value[modeId] || { useWebSearch: false, useKnowledgeBase: false, useMemoryEnhancement: false }
        executionModeConfigs.value = {
            ...executionModeConfigs.value,
            [modeId]: {
                ...prev,
                ...updates
            }
        }
        saveExecutionModeConfigsToCache(executionModeConfigs.value)
    },
}

// 导出 Pinia 存储
export const useExecutionModeStore = defineStore('executionMode', () => storeActions)
