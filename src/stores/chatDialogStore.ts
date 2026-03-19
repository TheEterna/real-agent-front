import { defineStore } from 'pinia'

/**
 * Chat Dialog UI Store
 * 
 * 设计目标：
 * - 只负责 UI 状态（是否打开新建聊天/Agent 选择弹窗）
 * - 不直接耦合路由/业务创建逻辑（这些由 hooks/useChat 统一调度）
 * 
 * 这样做的好处：
 * - App.vue 只负责“挂载弹窗”，不再承载业务逻辑
 * - 任意组件都可通过 hooks/useChat 打开弹窗（全局一致）
 */
export const useChatDialogStore = defineStore('chatDialog', {
  state: () => ({
    /**
     * 是否展示“新建聊天 / 选择 Agent”弹窗
     */
    isNewChatDialogOpen: false,
  }),

  actions: {
    /**
     * 打开“新建聊天”弹窗
     */
    openNewChatDialog() {
      this.isNewChatDialogOpen = true
    },

    /**
     * 关闭“新建聊天”弹窗
     */
    closeNewChatDialog() {
      this.isNewChatDialogOpen = false
    },
  },
})
