// ============================================================
// Avatar Store — 数字分身状态管理（多分身版）
// 职责：管理分身列表、当前选中分身、配额校验、
//       人设、自主行为、待审批队列、记忆、行为日志
// 模式：Composition API + SWR + 乐观更新
// ============================================================

import { defineStore } from "pinia"
import { ref, computed, readonly, watch } from "vue"
import * as avatarApi from "@/api/avatar"
import { useAuthStore } from "@/stores/authStore"
import type { TierType } from "@/types/subscription"
import type {
  Avatar,
  AvatarPersonality,
  AvatarAgentConfig,
  AvatarPermissions,
  AvatarVO,
  AvatarConfigRequest,
  AvatarAutonomyRequest,
  AvatarQuota,
  PendingAction,
  PendingActionVO,
  AvatarActionLog,
  AvatarActionLogVO,
  AvatarMemory,
  AvatarMemoryVO,
  AddMemoryRequest,
} from "@/types/avatar"
import { DEFAULT_PERMISSIONS } from "@/types/avatar"

// ==================== VO → Model 转换 ====================

/** 安全地构建 personality，防御后端返回 null 或部分字段缺失 */
function safePersonality(p: AvatarPersonality | null | undefined): AvatarPersonality {
  return {
    tone: p?.tone ?? "",
    interests: Array.isArray(p?.interests) ? p.interests : [],
    expertise: Array.isArray(p?.expertise) ? p.expertise : [],
    quirks: Array.isArray(p?.quirks) ? p.quirks : [],
  }
}

/** 安全地构建 agentConfig，防御后端返回 null 或部分字段缺失 */
function safeAgentConfig(c: AvatarAgentConfig | null | undefined): AvatarAgentConfig {
  return {
    modelTier: c?.modelTier ?? "standard",
    memoryCapacity: c?.memoryCapacity ?? 100,
    maxActionsPerDay: c?.maxActionsPerDay ?? 50,
  }
}

/** 安全地构建 permissions，防御后端返回 null 或部分字段缺失 */
function safePermissions(p: AvatarPermissions | null | undefined): AvatarPermissions {
  return {
    base: {
      post: p?.base?.post ?? DEFAULT_PERMISSIONS.base.post,
      comment: p?.base?.comment ?? DEFAULT_PERMISSIONS.base.comment,
      like: p?.base?.like ?? DEFAULT_PERMISSIONS.base.like,
      follow: p?.base?.follow ?? DEFAULT_PERMISSIONS.base.follow,
    },
    mcpCapabilities: Array.isArray(p?.mcpCapabilities) ? p.mcpCapabilities : [],
    globalDailyLimit: p?.globalDailyLimit ?? DEFAULT_PERMISSIONS.globalDailyLimit,
    maxContentLength: p?.maxContentLength ?? DEFAULT_PERMISSIONS.maxContentLength,
  }
}

function transformAvatar(vo: AvatarVO): Avatar {
  return {
    id: vo.id,
    userId: vo.userId,
    name: vo.name ?? "",
    bio: vo.bio ?? "",
    avatarUrl: vo.avatarUrl ?? "",
    personality: safePersonality(vo.personality),
    autonomy: vo.autonomy ?? "off",
    active: vo.active ?? false,
    agentConfig: safeAgentConfig(vo.agentConfig),
    permissions: safePermissions(vo.permissions),
    createdTime: new Date(vo.createdTime ?? Date.now()),
    updatedTime: new Date(vo.updatedTime ?? Date.now()),
  }
}

function transformPendingAction(vo: PendingActionVO): PendingAction {
  return {
    id: vo.id,
    avatarId: vo.avatarId,
    actionType: vo.actionType ?? "unknown",
    payload: vo.payload ?? {},
    status: vo.status ?? "pending",
    expiresTime: new Date(vo.expiresTime ?? Date.now()),
    createdTime: new Date(vo.createdTime ?? Date.now()),
  }
}

function transformActionLog(vo: AvatarActionLogVO): AvatarActionLog {
  return {
    id: vo.id,
    avatarId: vo.avatarId,
    actionType: vo.actionType ?? "unknown",
    targetId: vo.targetId ?? null,
    status: vo.status ?? "unknown",
    content: vo.content ?? null,
    createdTime: new Date(vo.createdTime ?? Date.now()),
  }
}

function transformMemory(vo: AvatarMemoryVO): AvatarMemory {
  return {
    id: vo.id,
    avatarId: vo.avatarId,
    type: vo.type ?? "knowledge",
    content: vo.content ?? {},
    weight: vo.weight ?? 1,
    source: vo.source ?? "manual",
    createdTime: new Date(vo.createdTime ?? Date.now()),
  }
}

// ==================== 配额常量 ====================

const AVATAR_LIMITS: Record<TierType, number> = {
  free: 1,
  pro: 3,
  turbo: 5,
  ultra: Infinity,
}

// ==================== SWR 缓存 Key ====================

const CACHE_KEY = "volo_ai_avatars_list"

// ==================== Store 定义 ====================

export const useAvatarStore = defineStore("avatar", () => {
  const authStore = useAuthStore()

  // ---- 分身列表 ----
  const avatars = ref<Avatar[]>([])
  const isLoadingAvatars = ref(false)
  const cacheHydrated = ref(false)

  // ---- 当前选中分身 ----
  const activeAvatarId = ref<string | null>(null)
  const activeAvatar = computed<Avatar | null>(() =>
    avatars.value.find((a) => a.id === activeAvatarId.value) ?? null,
  )

  // ---- 待审批队列（当前选中分身）----
  const pendingActions = ref<PendingAction[]>([])
  const isLoadingPending = ref(false)

  // ---- 行为日志（当前选中分身）----
  const activityLog = ref<AvatarActionLog[]>([])
  const isLoadingActivity = ref(false)

  // ---- 记忆管理（当前选中分身）----
  const memories = ref<AvatarMemory[]>([])
  const isLoadingMemories = ref(false)

  // ==================== 配额校验 ====================

  /** 获取当前用户的 tier（优先 subscription.planId，兼容旧 tier 字段） */
  function getUserTier(): TierType {
    const user = authStore.user
    return user?.subscription?.planId ?? user?.tier ?? "free"
  }

  /** 是否还能创建新分身（前端乐观校验） */
  const canCreateAvatar = computed<boolean>(() => {
    const tier = getUserTier()
    const limit = AVATAR_LIMITS[tier] ?? AVATAR_LIMITS.free
    return avatars.value.length < limit
  })

  /** 配额信息（用于 UI 展示） */
  const avatarQuota = computed<AvatarQuota>(() => {
    const tier = getUserTier()
    return {
      current: avatars.value.length,
      max: AVATAR_LIMITS[tier] ?? AVATAR_LIMITS.free,
      isUltra: tier === "ultra",
    }
  })

  // ==================== SWR 水合 ====================

  function hydrateFromCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) {
          avatars.value = parsed.map(transformAvatar)
          cacheHydrated.value = true
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY)
    }
  }

  /** 将当前列表持久化到 localStorage */
  function persistCache() {
    try {
      // 存储原始 VO 格式（Date 序列化兼容）
      localStorage.setItem(CACHE_KEY, JSON.stringify(avatars.value))
    } catch {
      // 忽略缓存写入失败（QuotaExceeded 等）
    }
  }

  // ==================== 列表内部更新辅助 ====================

  /** 替换列表中指定 id 的分身（更新后端返回的最新数据） */
  function replaceAvatarInList(avatarId: string, updated: Avatar) {
    avatars.value = avatars.value.map((a) => (a.id === avatarId ? updated : a))
    persistCache()
  }

  // ==================== 分身列表 CRUD ====================

  /** 加载分身列表 */
  async function loadAvatars() {
    if (isLoadingAvatars.value) return
    isLoadingAvatars.value = true

    try {
      const res = await avatarApi.getMyAvatars()
      if (res.code === 200 && res.data) {
        avatars.value = res.data.map(transformAvatar)
        persistCache()
      }
    } catch (error) {
      console.error("[avatarStore] loadAvatars failed, keeping stale data:", error)
      // SWR: 请求失败保留缓存，不清空
    } finally {
      isLoadingAvatars.value = false
    }
  }

  /** 创建分身（前端配额校验 + 后端校验双保险） */
  async function createAvatar(data: AvatarConfigRequest) {
    if (!canCreateAvatar.value) {
      throw new Error("quota exceeded")
    }

    try {
      const res = await avatarApi.createAvatar(data)
      if (res.code === 200 && res.data) {
        avatars.value = [...avatars.value, transformAvatar(res.data)]
        persistCache()
      }
      return res
    } catch (error) {
      console.error("[avatarStore] createAvatar failed:", error)
      throw error
    }
  }

  /** 更新基本配置 */
  async function updateConfig(avatarId: string, data: AvatarConfigRequest) {
    try {
      const res = await avatarApi.updateAvatar(avatarId, data)
      if (res.code === 200 && res.data) {
        replaceAvatarInList(avatarId, transformAvatar(res.data))
      }
      return res
    } catch (error) {
      console.error("[avatarStore] updateConfig failed:", error)
      throw error
    }
  }

  /** 删除分身（乐观更新 + 回滚） */
  async function deleteAvatar(avatarId: string) {
    // 乐观删除：先从列表移除
    const snapshot = [...avatars.value]
    avatars.value = avatars.value.filter((a) => a.id !== avatarId)
    persistCache()

    // 如果删除的是当前选中分身，清空选中状态
    if (activeAvatarId.value === avatarId) {
      activeAvatarId.value = null
    }

    try {
      const res = await avatarApi.deleteAvatar(avatarId)
      if (res.code !== 200) {
        // 后端失败，回滚
        avatars.value = snapshot
        persistCache()
      }
      return res
    } catch (error) {
      // 网络失败，回滚
      avatars.value = snapshot
      persistCache()
      console.error("[avatarStore] deleteAvatar failed, rolled back:", error)
      throw error
    }
  }

  /** 更新人设 */
  async function updatePersonality(avatarId: string, data: AvatarPersonality) {
    try {
      const res = await avatarApi.updatePersonality(avatarId, data)
      if (res.code === 200 && res.data) {
        replaceAvatarInList(avatarId, transformAvatar(res.data))
      }
      return res
    } catch (error) {
      console.error("[avatarStore] updatePersonality failed:", error)
      throw error
    }
  }

  /** 更新自主行为配置 */
  async function updateAutonomy(avatarId: string, data: AvatarAutonomyRequest) {
    try {
      const res = await avatarApi.updateAutonomy(avatarId, data)
      if (res.code === 200 && res.data) {
        replaceAvatarInList(avatarId, transformAvatar(res.data))
      }
      return res
    } catch (error) {
      console.error("[avatarStore] updateAutonomy failed:", error)
      throw error
    }
  }

  /** 更新细粒度行为权限 */
  async function updatePermissions(avatarId: string, data: AvatarPermissions) {
    try {
      const res = await avatarApi.updatePermissions(avatarId, data)
      if (res.code === 200 && res.data) {
        replaceAvatarInList(avatarId, transformAvatar(res.data))
      }
      return res
    } catch (error) {
      console.error("[avatarStore] updatePermissions failed:", error)
      throw error
    }
  }

  // ==================== 待审批队列 ====================

  /** 加载待审批行为 */
  async function loadPendingActions(avatarId: string) {
    if (isLoadingPending.value) return
    isLoadingPending.value = true

    try {
      const res = await avatarApi.getPendingActions(avatarId)
      if (res.code === 200 && res.data) {
        pendingActions.value = res.data.map(transformPendingAction)
      }
    } catch (error) {
      console.error("[avatarStore] loadPendingActions failed:", error)
    } finally {
      isLoadingPending.value = false
    }
  }

  /** 批准行为 */
  async function approveAction(avatarId: string, actionId: string) {
    try {
      const res = await avatarApi.approveAction(avatarId, actionId)
      if (res.code === 200) {
        pendingActions.value = pendingActions.value.filter((a) => a.id !== actionId)
      }
      return res
    } catch (error) {
      console.error("[avatarStore] approveAction failed:", error)
      throw error
    }
  }

  /** 拒绝行为 */
  async function rejectAction(avatarId: string, actionId: string) {
    try {
      const res = await avatarApi.rejectAction(avatarId, actionId)
      if (res.code === 200) {
        pendingActions.value = pendingActions.value.filter((a) => a.id !== actionId)
      }
      return res
    } catch (error) {
      console.error("[avatarStore] rejectAction failed:", error)
      throw error
    }
  }

  // ==================== 行为日志 ====================

  /** 加载行为日志 */
  async function loadActivityLog(avatarId: string) {
    if (isLoadingActivity.value) return
    isLoadingActivity.value = true

    try {
      const res = await avatarApi.getActivityLog(avatarId)
      if (res.code === 200 && res.data) {
        activityLog.value = res.data.map(transformActionLog)
      }
    } catch (error) {
      console.error("[avatarStore] loadActivityLog failed:", error)
    } finally {
      isLoadingActivity.value = false
    }
  }

  // ==================== 记忆管理 ====================

  /** 加载记忆列表 */
  async function loadMemories(avatarId: string) {
    if (isLoadingMemories.value) return
    isLoadingMemories.value = true

    try {
      const res = await avatarApi.getMemories(avatarId)
      if (res.code === 200 && res.data) {
        memories.value = res.data.map(transformMemory)
      }
    } catch (error) {
      console.error("[avatarStore] loadMemories failed:", error)
    } finally {
      isLoadingMemories.value = false
    }
  }

  /** 添加记忆 */
  async function addMemory(avatarId: string, data: AddMemoryRequest) {
    try {
      const res = await avatarApi.addMemory(avatarId, data)
      if (res.code === 200 && res.data) {
        memories.value = [transformMemory(res.data), ...memories.value]
      }
      return res
    } catch (error) {
      console.error("[avatarStore] addMemory failed:", error)
      throw error
    }
  }

  /** 删除记忆 */
  async function deleteMemory(avatarId: string, memoryId: string) {
    try {
      const res = await avatarApi.deleteMemory(avatarId, memoryId)
      if (res.code === 200) {
        memories.value = memories.value.filter((m) => m.id !== memoryId)
      }
      return res
    } catch (error) {
      console.error("[avatarStore] deleteMemory failed:", error)
      throw error
    }
  }

  // ==================== 聚合 Computed ====================

  /** 待处理行为数量 */
  const pendingActionCount = computed(() => pendingActions.value.length)

  /** 今日活动摘要（按 actionType 分类统计） */
  const todayActivitySummary = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayLogs = activityLog.value.filter((l) => l.createdTime >= today)
    return {
      total: todayLogs.length,
      posts: todayLogs.filter((l) => l.actionType === "CREATE_POST").length,
      likes: todayLogs.filter((l) => l.actionType === "LIKE_POST").length,
      comments: todayLogs.filter((l) => l.actionType === "COMMENT_POST").length,
    }
  })

  // ==================== activeAvatarId 管理 ====================

  /** 设置当前选中分身（View 层通过此方法通知 Store） */
  function setActiveAvatarId(id: string | null) {
    activeAvatarId.value = id
  }

  /**
   * 切换 activeAvatarId 时，清空当前分身的子数据
   * 子页面进入时会通过 ensure* 方法重新加载
   */
  watch(activeAvatarId, () => {
    pendingActions.value = []
    activityLog.value = []
    memories.value = []
  })

  // ==================== Ensure 方法（View 安全调用）====================
  // View 层使用 ensure* 方法通知 Store 需要数据，Store 自己决定是否加载
  // 这些方法是幂等的：已有数据或正在加载时不会重复请求

  /** 确保分身列表已加载（View 安全：Store 自行决定是否请求） */
  async function ensureAvatarsLoaded() {
    if (avatars.value.length > 0 || isLoadingAvatars.value) return
    await loadAvatars()
  }

  /** 确保待审批队列已加载（View 安全：需传入 avatarId） */
  async function ensurePendingActionsLoaded(avatarId: string) {
    if (pendingActions.value.length > 0 || isLoadingPending.value) return
    await loadPendingActions(avatarId)
  }

  /** 确保行为日志已加载（View 安全：需传入 avatarId） */
  async function ensureActivityLogLoaded(avatarId: string) {
    if (activityLog.value.length > 0 || isLoadingActivity.value) return
    await loadActivityLog(avatarId)
  }

  /** 确保记忆列表已加载（View 安全：需传入 avatarId） */
  async function ensureMemoriesLoaded(avatarId: string) {
    if (memories.value.length > 0 || isLoadingMemories.value) return
    await loadMemories(avatarId)
  }

  // ==================== 初始化 ====================

  hydrateFromCache()

  // ==================== 返回 ====================

  return {
    // 状态（只读）
    avatars: readonly(avatars),
    activeAvatarId: readonly(activeAvatarId),
    activeAvatar,
    isLoadingAvatars: readonly(isLoadingAvatars),
    cacheHydrated: readonly(cacheHydrated),
    pendingActions: readonly(pendingActions),
    isLoadingPending: readonly(isLoadingPending),
    activityLog: readonly(activityLog),
    isLoadingActivity: readonly(isLoadingActivity),
    memories: readonly(memories),
    isLoadingMemories: readonly(isLoadingMemories),

    // 配额（只读 computed）
    canCreateAvatar,
    avatarQuota,

    // 聚合 computed（供 composable 层使用）
    pendingActionCount,
    todayActivitySummary,

    // activeAvatarId 管理
    setActiveAvatarId,

    // View 安全的 ensure 方法（推荐 View 使用）
    ensureAvatarsLoaded,
    ensurePendingActionsLoaded,
    ensureActivityLogLoaded,
    ensureMemoriesLoaded,

    // Store 内部加载方法（仅限 Store 内部/Composable 使用）
    loadAvatars,
    createAvatar,
    updateConfig,
    deleteAvatar,
    updatePersonality,
    updateAutonomy,
    updatePermissions,
    loadPendingActions,
    approveAction,
    rejectAction,
    loadActivityLog,
    loadMemories,
    addMemory,
    deleteMemory,
  }
})
