// ============================================================
// useAvatarCreate — 分身创建流程状态管理
// 职责：管理创建流程中的选择状态、内核锁定校验、请求构建
// ============================================================

import { ref, computed, watch } from 'vue'
import i18n from '@/i18n'
import { useAvatarStore } from '@/stores/avatarStore'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import type { AvatarCoreTier, AvatarTemplate, UserPortrait } from '../types'
import { AVATAR_TEMPLATES, CORE_TIER_SPECS, TIER_LEVELS } from '../constants/templates'
import type { TierType } from '@/types/subscription'
import type { AvatarConfigRequest } from '@/types/avatar'

export function useAvatarCreate() {
  const avatarStore = useAvatarStore()
  const authStore = useAuthStore()

  // ---- 选择状态 ----
  const selectedTemplateId = ref<string | null>(null)
  const selectedCoreTier = ref<AvatarCoreTier | null>(null)
  const avatarName = ref('')

  // ---- 模版专属数据 ----
  // 各 Extra Step 子组件通过此 ref 写入数据
  const extraData = ref<Record<string, unknown>>({})

  // ---- 用户画像（克隆自己用）----
  const portrait = ref<UserPortrait | null>(null)
  const isLoadingPortrait = ref(false)

  // ---- 派生 computed ----

  const selectedTemplate = computed<AvatarTemplate | null>(() =>
    AVATAR_TEMPLATES.find((t) => t.id === selectedTemplateId.value) ?? null,
  )

  /** 获取当前用户会员等级 */
  function getUserTier(): TierType {
    const user = authStore.user
    return user?.subscription?.planId ?? user?.tier ?? 'free'
  }

  const userTier = computed<TierType>(() => getUserTier())

  /** 判断某内核是否对当前用户锁定 */
  function isCoreTierLocked(tier: AvatarCoreTier): boolean {
    const required = CORE_TIER_SPECS[tier].requiredTier
    return TIER_LEVELS[userTier.value] < TIER_LEVELS[required]
  }

  /** 是否可以创建（所有必填项已选 + 配额未满） */
  const canCreate = computed<boolean>(() =>
    selectedTemplateId.value !== null &&
    selectedCoreTier.value !== null &&
    avatarName.value.trim().length > 0 &&
    avatarStore.canCreateAvatar,
  )

  // ---- 选择操作 ----

  function selectTemplate(id: string) {
    selectedTemplateId.value = id
    // 重置模版专属数据
    extraData.value = {}

    // 克隆自己模版：自动填充名称
    if (id === 'clone-self') {
      const user = authStore.user
      const { t: _t } = i18n.global
      avatarName.value = user?.nickname || user?.username || _t('avatar.create.placeholderCloneSelf')
    }
  }

  function selectCoreTier(tier: AvatarCoreTier) {
    if (isCoreTierLocked(tier)) return
    selectedCoreTier.value = tier
  }

  // ---- 用户画像加载（克隆自己用）----

  async function loadPortrait() {
    if (isLoadingPortrait.value) return
    isLoadingPortrait.value = true
    try {
      const res = await authApi.getUserPortrait(authStore.getAccessToken() ?? undefined)
      if (res.code === 200 && res.data) {
        portrait.value = {
          nickname: res.data.nickname || '用户',
          avatarUrl: res.data.avatarUrl || null,
          traits: res.data.traits ?? [],
          interests: res.data.interests ?? [],
          sufficient: res.data.sufficient ?? false,
        }
      } else {
        // API 返回非正常码：降级到本地用户信息
        const user = authStore.user
        portrait.value = {
          nickname: user?.nickname || user?.username || '用户',
          avatarUrl: user?.avatarUrl || null,
          traits: [],
          interests: [],
          sufficient: false,
        }
      }
    } catch (error) {
      console.error('[useAvatarCreate] loadPortrait failed:', error)
      // 网络/接口异常：降级到本地用户信息
      const user = authStore.user
      portrait.value = {
        nickname: user?.nickname || user?.username || '用户',
        avatarUrl: user?.avatarUrl || null,
        traits: [],
        interests: [],
        sufficient: false,
      }
    } finally {
      isLoadingPortrait.value = false
    }
  }

  // 选择克隆自己时自动加载画像
  watch(selectedTemplateId, (id) => {
    if (id === 'clone-self') {
      loadPortrait()
    }
  })

  // ---- 构建创建请求 ----

  function buildCreateRequest() {
    const template = selectedTemplate.value
    if (!template || !selectedCoreTier.value) return null

    const base = {
      name: avatarName.value.trim(),
      bio: '',
      avatarUrl: '',
      templateId: template.id,
      coreTier: selectedCoreTier.value,
    }

    // 根据模版类型补充 personality
    if (template.defaultPersonality) {
      const personality = { ...template.defaultPersonality }

      // 合并 extraData 中的微调数据
      if (extraData.value.tone) personality.tone = extraData.value.tone as string
      if (extraData.value.interests) personality.interests = extraData.value.interests as string[]
      if (extraData.value.expertise) personality.expertise = extraData.value.expertise as string[]

      return { ...base, personality }
    }

    // 从零开始：直接使用 extraData 中的表单数据
    if (template.id === 'custom' && extraData.value.personality) {
      return { ...base, personality: extraData.value.personality }
    }

    return base
  }

  // ---- 创建 ----
  const isCreating = ref(false)
  const createSuccess = ref(false)
  const createError = ref<string | null>(null)

  async function create(): Promise<string | null> {
    if (isCreating.value || !canCreate.value) return null
    isCreating.value = true
    createSuccess.value = false
    createError.value = null

    try {
      const request = buildCreateRequest()
      if (!request) return null

      // 构建完整请求，传递 personality（不再丢弃用户配置）
      const payload: AvatarConfigRequest = {
        name: request.name,
        bio: request.bio,
        avatarUrl: request.avatarUrl,
      }
      if ('personality' in request && request.personality) {
        const p = request.personality as Record<string, unknown>
        payload.personality = {
          tone: (p.tone as string) ?? '',
          interests: [...(Array.isArray(p.interests) ? (p.interests as string[]) : [])],
          expertise: [...(Array.isArray(p.expertise) ? (p.expertise as string[]) : [])],
          quirks: [...(Array.isArray(p.quirks) ? (p.quirks as string[]) : [])],
        }
      }

      const res = await avatarStore.createAvatar(payload)

      if (res?.data?.id) {
        createSuccess.value = true
        return res.data.id
      }
      return null
    } catch (error) {
      const { t } = i18n.global
      const msg = error instanceof Error ? error.message : t('avatar.create.createFailedDefault')
      createError.value = msg
      console.error('[useAvatarCreate] create failed:', error)
      return null
    } finally {
      isCreating.value = false
    }
  }

  return {
    // 选择状态
    selectedTemplateId,
    selectedCoreTier,
    avatarName,
    extraData,

    // 派生
    selectedTemplate,
    userTier,
    canCreate,

    // 用户画像
    portrait,
    isLoadingPortrait,

    // 方法
    selectTemplate,
    selectCoreTier,
    isCoreTierLocked,
    loadPortrait,

    // 创建
    isCreating,
    createSuccess,
    createError,
    create,
  }
}
