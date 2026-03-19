import http from '@/services/http'
import type { ResponseResult } from '@/api/session'
import type {
  AvatarVO,
  AvatarConfigRequest,
  AvatarPersonality,
  AvatarAutonomyRequest,
  AvatarPermissions,
  PendingActionVO,
  AvatarActionLogVO,
  AvatarMemoryVO,
  AddMemoryRequest,
  AvatarConversationVO,
  AvatarChatMessageVO,
} from '@/types/avatar'

// ===== 分身列表与 CRUD =====

export function getMyAvatars(): Promise<ResponseResult<AvatarVO[]>> {
  return http.get('/avatars')
}

export function createAvatar(data: AvatarConfigRequest): Promise<ResponseResult<AvatarVO>> {
  return http.post('/avatars', data)
}

export function updateAvatar(avatarId: string, data: AvatarConfigRequest): Promise<ResponseResult<AvatarVO>> {
  return http.put(`/avatars/${avatarId}`, data)
}

export function deleteAvatar(avatarId: string): Promise<ResponseResult<void>> {
  return http.delete(`/avatars/${avatarId}`)
}

// ===== 人设与自主配置 =====

export function updatePersonality(avatarId: string, data: AvatarPersonality): Promise<ResponseResult<AvatarVO>> {
  return http.put(`/avatars/${avatarId}/personality`, data)
}

export function updateAutonomy(avatarId: string, data: AvatarAutonomyRequest): Promise<ResponseResult<AvatarVO>> {
  return http.put(`/avatars/${avatarId}/autonomy`, data)
}

export function updatePermissions(avatarId: string, data: AvatarPermissions): Promise<ResponseResult<AvatarVO>> {
  return http.put(`/avatars/${avatarId}/permissions`, data)
}

// ===== 记忆管理 =====

export function getMemories(avatarId: string): Promise<ResponseResult<AvatarMemoryVO[]>> {
  return http.get(`/avatars/${avatarId}/memories`)
}

export function addMemory(avatarId: string, data: AddMemoryRequest): Promise<ResponseResult<AvatarMemoryVO>> {
  return http.post(`/avatars/${avatarId}/memories`, data)
}

export function deleteMemory(avatarId: string, memoryId: string): Promise<ResponseResult<void>> {
  return http.delete(`/avatars/${avatarId}/memories/${memoryId}`)
}

// ===== 待审批队列 =====

export function getPendingActions(avatarId: string): Promise<ResponseResult<PendingActionVO[]>> {
  return http.get(`/avatars/${avatarId}/pending`)
}

export function approveAction(avatarId: string, actionId: string): Promise<ResponseResult<PendingActionVO>> {
  return http.post(`/avatars/${avatarId}/pending/${actionId}/approve`)
}

export function rejectAction(avatarId: string, actionId: string): Promise<ResponseResult<PendingActionVO>> {
  return http.post(`/avatars/${avatarId}/pending/${actionId}/reject`)
}

// ===== 行为日志 =====

export function getActivityLog(avatarId: string): Promise<ResponseResult<AvatarActionLogVO[]>> {
  return http.get(`/avatars/${avatarId}/activity`)
}

// ===== 分身聊天 =====

/** 获取会话列表 */
export function getAvatarConversations(avatarId: string): Promise<ResponseResult<AvatarConversationVO[]>> {
  return http.get(`/avatars/${avatarId}/chat/conversations`)
}

/** 获取会话消息 */
export function getAvatarMessages(
  avatarId: string,
  conversationId: string,
  page = 0,
  size = 50,
): Promise<ResponseResult<AvatarChatMessageVO[]>> {
  return http.get(`/avatars/${avatarId}/chat/conversations/${conversationId}/messages`, {
    params: { page, size },
  })
}

/** 删除会话 */
export function deleteAvatarConversation(
  avatarId: string,
  conversationId: string,
): Promise<ResponseResult<void>> {
  return http.delete(`/avatars/${avatarId}/chat/conversations/${conversationId}`)
}

// ===== 能力插件系统 =====

/** 获取分身已绑定的工具列表 */
export function getAvatarTools(avatarId: string): Promise<ResponseResult<any[]>> {
  return http.get(`/avatars/${avatarId}/tools`)
}

/** 获取可绑定的工具列表 */
export function getAvailableToolsForAvatar(avatarId: string): Promise<ResponseResult<any[]>> {
  return http.get(`/avatars/${avatarId}/tools/available`)
}

/** 绑定工具到分身 */
export function bindToolToAvatar(
  avatarId: string,
  toolId: string,
  config?: Record<string, unknown>,
): Promise<ResponseResult<any>> {
  return http.post(`/avatars/${avatarId}/tools/${toolId}`, { config })
}

/** 解绑工具 */
export function unbindToolFromAvatar(avatarId: string, toolId: string): Promise<ResponseResult<void>> {
  return http.delete(`/avatars/${avatarId}/tools/${toolId}`)
}

/** 更新工具配置 */
export function updateToolConfig(
  avatarId: string,
  toolId: string,
  config: Record<string, unknown>,
): Promise<ResponseResult<any>> {
  return http.put(`/avatars/${avatarId}/tools/${toolId}`, { config })
}

/** 切换工具启用状态 */
export function toggleToolEnabled(
  avatarId: string,
  toolId: string,
  enabled: boolean,
): Promise<ResponseResult<any>> {
  return http.patch(`/avatars/${avatarId}/tools/${toolId}`, { enabled })
}

/** 获取分身已绑定的技能列表 */
export function getAvatarSkills(avatarId: string): Promise<ResponseResult<any[]>> {
  return http.get(`/avatars/${avatarId}/skills`)
}

/** 获取可绑定的技能列表 */
export function getAvailableSkillsForAvatar(avatarId: string): Promise<ResponseResult<any[]>> {
  return http.get(`/avatars/${avatarId}/skills/available`)
}

/** 绑定技能到分身 */
export function bindSkillToAvatar(
  avatarId: string,
  skillId: string,
  config?: Record<string, unknown>,
): Promise<ResponseResult<any>> {
  return http.post(`/avatars/${avatarId}/skills/${skillId}`, { config })
}

/** 解绑技能 */
export function unbindSkillFromAvatar(avatarId: string, skillId: string): Promise<ResponseResult<void>> {
  return http.delete(`/avatars/${avatarId}/skills/${skillId}`)
}

/** 更新技能配置 */
export function updateSkillConfig(
  avatarId: string,
  skillId: string,
  config: Record<string, unknown>,
): Promise<ResponseResult<any>> {
  return http.put(`/avatars/${avatarId}/skills/${skillId}`, { config })
}

/** 切换技能启用状态 */
export function toggleSkillEnabled(
  avatarId: string,
  skillId: string,
  enabled: boolean,
): Promise<ResponseResult<any>> {
  return http.patch(`/avatars/${avatarId}/skills/${skillId}`, { enabled })
}
