<script setup lang="ts">
import {computed, ref, watch, onMounted, onUnmounted} from 'vue'
import {useChatStore} from '@/stores/chatStore'
import {useRouter, useRoute} from 'vue-router'
import {AgentType} from '@/types/session'
import type {Ref} from 'vue'
import {generateGlassColorWithBorder, getRandomGlassColor, getRandomTooltipColor} from '@/utils/ColorUtils'
import { EditTwoTone, ShareAltOutlined, MenuOutlined, SearchOutlined, ExperimentOutlined, PushpinOutlined, MoreOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { Modal, Input, message } from 'ant-design-vue'
import SidebarActionBar from '@/components/ui/SidebarActionBar.vue'
import {useAuthStore} from "@/stores/authStore"
import { deleteSession, renameSession, pinSession, unpinSession } from '@/api/session'
import type { Session } from '@/types/session'

const chat = useChatStore()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const loading = ref<boolean>(true)
// 响应式的当前会话ID (从路由获取)
const currentSessionId = computed(() => route.params.sessionId as string | undefined)

// 操作菜单状态
const isRenamingId = ref<string | null>(null)
const newTitle = ref('')
const operationLoading = ref(false)
const activeMenuId = ref<string | null>(null) // 当前显示操作菜单的会话ID

const isActive = (id: string) => {
  return currentSessionId.value === id
}

// 切换操作菜单
const toggleMenu = (event: Event, sessionId: string) => {
  event.stopPropagation()
  activeMenuId.value = activeMenuId.value === sessionId ? null : sessionId
}

// 关闭菜单
const closeMenu = () => {
  activeMenuId.value = null
}

// 点击会话时通过路由跳转，利用 URL 参数持久化会话状态
const handleSessionClick = (sessionId: string) => {
  // 使用路由跳转到 /chat/:sessionId
  router.push({ name: 'Chat', params: { sessionId } })
  closeMenu() // 切换会话时关闭菜单
}

// 新建对话
const handleNewChat = async () => {
  // 1. 重置编辑会话
  chat.resetEditingSession(AgentType.ReAct_Plus, '新对话')
  // 2. 跳转到 /chat（无参数）
  await router.push({ name: 'Chat' })
}

// 开始重命名
const startRename = (session: Session) => {
  isRenamingId.value = session.id
  newTitle.value = session.title
  closeMenu() // 关闭菜单
}

// 确认重命名
const confirmRename = async (sessionId: string) => {
  if (!newTitle.value.trim()) {
    message.error('会话标题不能为空')
    return
  }

  operationLoading.value = true
  try {
    const result = await renameSession(sessionId, newTitle.value)
    if (result.code === 200) {
      message.success('重命名成功')
      const session = chat.sessions.find(s => s.id === sessionId)
      if (session) {
        session.title = newTitle.value
      }
    } else {
      message.error(result.message || '重命名失败')
    }
  } catch (error: any) {
    message.error(error.message || '重命名失败，请稍后重试')
  } finally {
    operationLoading.value = false
    isRenamingId.value = null
  }
}

// 取消重命名
const cancelRename = () => {
  isRenamingId.value = null
  newTitle.value = ''
}

// 删除会话
const handleDelete = (session: Session) => {
  closeMenu() // 关闭菜单
  Modal.confirm({
    title: '删除会话',
    content: `确定要删除会话 "${session.title}" 吗？此操作不可撤销。`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: async () => {
      operationLoading.value = true
      try {
        const result = await deleteSession(session.id)
        if (result.code === 200) {
          message.success('删除成功')
          chat.sessions = chat.sessions.filter(s => s.id !== session.id)
          // 如果删除的是当前会话，切换到其他会话或主页
          if (currentSessionId.value === session.id) {
            await router.push({name: 'Chat'})
          }
        } else {
          message.error(result.message || '删除失败')
        }
      } catch (error: any) {
        message.error(error.message || '删除失败，请稍后重试')
      } finally {
        operationLoading.value = false
      }
    }
  })
}

// 置顶/取消置顶
const handlePin = async (session: Session) => {
  closeMenu() // 关闭菜单
  operationLoading.value = true
  try {
    const isCurrentlyPinned = session.isPin
    const result = isCurrentlyPinned
      ? await unpinSession(session.id)
      : await pinSession(session.id)

    if (result.code === 200) {
      message.success(isCurrentlyPinned ? '已取消置顶' : '已置顶')
      session.isPin = !isCurrentlyPinned
      // 重新排序会话（置顶的优先）
      reorderSessions()
    } else {
      message.error(result.message || '操作失败')
    }
  } catch (error: any) {
    message.error(error.message || '操作失败，请稍后重试')
  } finally {
    operationLoading.value = false
  }
}

// 分享功能(占位)
const handleShare = (session: Session) => {
  closeMenu()
  message.info('分享功能开发中')
}

// 重新排序会话（置顶的优先）
const reorderSessions = () => {
  chat.sessions.sort((a, b) => {
    if (a.isPin !== b.isPin) {
      return (b.isPin ? 1 : 0) - (a.isPin ? 1 : 0)
    }
    return b.updatedTime.getTime() - a.updatedTime.getTime()
  })
}

// 监听点击外部元素来关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  // 如果点击的不是菜单和操作按钮,就关闭菜单
  if (!target.closest('.session-menu') && !target.closest('.menu-trigger')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// watch 到有了session 数据就取消loading
watch(() => chat.sessions, () => {
  loading.value = false
})

</script>

<template>
  <div class="hover chat-sider-container">
    <!-- py-3 px-3.5 = padding: 12px 14px -->
    <div class="flex flex-col py-3 px-3.5">
        <!-- 顶部操作栏：汉堡菜单 -->

        <!-- Playground 入口 -->
        <div class="mb-3">
          <router-link
              to="/playground"
              class="playground-entry"
          >
            <div class="entry-icon">
              <ExperimentOutlined />
            </div>
            <span class="entry-label">探索 Playground</span>
          </router-link>
        </div>
        <!-- font-semibold text-[13px] mb-2 -->
        <div class="mb-2 sl-title shrink-0 font-bold flex items-center justify-between">
          <span>会话</span>
          <button
            @click="handleNewChat"
            class="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
            title="新建对话"
          >
            + 新建
          </button>
        </div>
        
        <!-- Scrollable Session List -->
        <div class="min-h-0 mb-3 -mr-2 pr-2 ">
          <!-- Loading Skeleton -->
          <div v-if="chat.isLoadingSessions" class="space-y-2">
            <div v-for="i in 5" :key="i" class="px-4 py-3 rounded-3xl bg-white/50">
              <a-skeleton :loading="loading" active avatar :paragraph="{ rows: 1, width: '60%' }" :title="false" />
            </div>
          </div>

          <!-- Session List -->
          <div v-else class="grid gap-1.5">
            <template
                v-for="c in chat.sessions"
                :key="c.id"
            >
              <div
                v-if="!c.id.startsWith('temp-')"
                class="session-item-container relative"
              >
                <div
                     class="sl-conv-item relative overflow-hidden
                      py-3 px-4 transition-all backdrop-blur-sm
                      rounded-3xl cursor-pointer flex items-center justify-between"
                     :class="{ active: isActive(c.id) }"
                     @click="handleSessionClick(c.id)"
                >
                  <!-- 会话标题和置顶标志 -->
                  <div class="whitespace-nowrap overflow-hidden text-ellipsis flex-1 leading-snug flex items-center gap-2">
                    <PushpinOutlined v-if="c.isPin" class="text-warning shrink-0" />
                    <span class="truncate">{{ c.title }}</span>
                  </div>
                  
                  <!-- 操作按钮 -->
                  <MoreOutlined 
                    class="menu-trigger shrink-0"
                    @click.stop="toggleMenu($event, c.id)"
                  />
                </div>

                <!-- 原生弹窗菜单 -->
                <div 
                  v-if="activeMenuId === c.id"
                  class="session-menu absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
                >
                  <!-- 置顶 -->
                  <div 
                    class="menu-item flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    @click="handlePin(c)"
                  >
                    <PushpinOutlined class="text-base text-gray-600" />
                    <span class="text-sm text-gray-800">{{ c.isPin ? '取消置顶' : '置顶' }}</span>
                  </div>

                  <!-- 分享 -->
                  <div 
                    class="menu-item flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    @click="handleShare(c)"
                  >
                    <ShareAltOutlined class="text-base text-gray-600" />
                    <span class="text-sm text-gray-800">分享</span>
                  </div>

                  <!-- 重命名 -->
                  <div 
                    class="menu-item flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                    @click="startRename(c)"
                  >
                    <EditTwoTone class="text-base" />
                    <span class="text-sm text-gray-800">重命名</span>
                  </div>

                  <!-- 分割线 -->
                  <div class="h-px bg-gray-200 my-1"></div>

                  <!-- 删除 -->
                  <div 
                    class="menu-item flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors"
                    @click="handleDelete(c)"
                  >
                    <DeleteOutlined class="text-base text-red-500" />
                    <span class="text-sm text-red-500">删除</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>


      </div>

    <!-- 重命名对话框 -->
    <a-modal
      v-model:open="isRenamingId"
      title="重命名会话"
      ok-text="确定"
      cancel-text="取消"
      :loading="operationLoading"
      @ok="confirmRename(isRenamingId!)"
      @cancel="cancelRename"
    >
      <a-input
        v-model:value="newTitle"
        placeholder="输入新的会话名称"
        @keyup.enter="confirmRename(isRenamingId!)"
      />
    </a-modal>

  </div>
</template>

<style lang="scss" scoped>
// 容器布局 - 使用 flex 确保操作栏固定在底部
.chat-sider-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}


// 1. sl-title 的颜色 - 使用了 SCSS 变量和 rgba
.sl-title {
  color: rgba($primary-color-900, 0.9);
}

// 2. sl-conv-item 的渐变背景 - 使用了 SCSS mix() 函数
.sl-conv-item {
  color: rgba($primary-color-900, 0.9);
  background: linear-gradient(to right, mix(white, $primary-color-50, 40%),  mix(white, $primary-color-50, 10%));
}

.sl-conv-item:hover {
  background: rgba($primary-color-900, 0.05);
}

.sl-conv-item.active {
  color: rgba($primary-color-600, 0.9);
  background: rgba($primary-color-100, 0.9) !important;
}


// 4. 图标按钮样式
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba($primary-color-900, 0.7);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba($primary-color-900, 0.06) !important;
    color: rgba($primary-color-900, 0.9);
  }
}

// Playground 入口样式
.playground-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 22px;
  background: linear-gradient(to right, mix(white, $primary-color-50, 40%), mix(white, $primary-color-50, 10%));
  color: rgba($primary-color-900, 0.85);
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    background: rgba($primary-color-100, 0.6);
    border-color: rgba($primary-color-300, 0.4);
  }

  &.router-link-active {
    background: rgba($primary-color-100, 0.9);
    color: rgba($primary-color-600, 0.9);
    border-color: rgba($primary-color-400, 0.5);
  }
}

.entry-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba($primary-color-500, 0.12);
  font-size: 16px;
  color: rgba($primary-color-700, 0.9);
}

.entry-label {
  font-size: 14px;
  font-weight: 500;
}

// 原生菜单样式
.session-menu {
  border: 1px solid rgba($primary-color-300, 0.2);
  
  .menu-item {
    user-select: none;
  }
}
</style>