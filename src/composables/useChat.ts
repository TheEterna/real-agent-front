import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import { useChatDialogStore } from '@/stores/chatDialogStore'
import type { AgentType } from '@/types/session'

/**
 * useChat
 * 
 * 设计目标（面向全局复用）：
 * 1) “新建聊天 / 选择 Agent”属于典型的全局业务入口：侧边栏、顶部按钮、快捷键、搜索弹窗都可能触发。
 * 2) Dialog/Modal 必须挂在 App.vue（避免多个页面重复挂载，且保证路由切换时状态一致）。
 * 3) UI 状态（是否打开弹窗）交给 Pinia 统一管理；业务动作（创建会话、路由跳转）由本 Hook 负责调度。
 * 
 * 使用方式：
 * - 任意组件：
 *   const { openNewChatDialog } = useChat()
 *   openNewChatDialog()
 * 
 * - App.vue：
 *   把 AgentSelector 的 v-model/visible 绑定到 isNewChatDialogOpen
 *   然后在 @select 时调用 handleAgentSelect
 */
export const useChat = () => {
  const router = useRouter()
  const chatStore = useChatStore()
  const dialogStore = useChatDialogStore()

  /**
   * 是否打开“新建聊天 / Agent选择”弹窗
   * 
   * 注意：这里用 computed 只读映射，避免业务组件直接修改 store。
   */
  const isNewChatDialogOpen = computed(() => dialogStore.isNewChatDialogOpen)

  /**
   * 打开“新建聊天 / Agent选择”弹窗
   */
  const openNewChatDialog = () => {
    dialogStore.openNewChatDialog()
  }

  /**
   * 关闭弹窗
   */
  const closeNewChatDialog = () => {
    dialogStore.closeNewChatDialog()
  }

  /**
   * 选择 Agent 并创建会话（临时会话），随后跳转到 /chat
   * 
   * 这里保持与原 App.vue 行为一致：
   * - resetEditingSession(type)
   * - 关闭弹窗
   * - 跳转到 Chat（不携带 sessionId，让后端首次消息后回填真实 sessionId）
   */
  const handleAgentSelect = async (type: AgentType) => {
    const newSession = chatStore.resetEditingSession(type)
    dialogStore.closeNewChatDialog()

    if (newSession) {
      await router.push({ name: 'Chat' })
    }
  }

  return {
    isNewChatDialogOpen,
    openNewChatDialog,
    closeNewChatDialog,
    handleAgentSelect,
  }
}
