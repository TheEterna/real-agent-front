<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {useChatStore} from '@/stores/chatStore'
import {useRouter, useRoute} from 'vue-router'
import {AgentType} from '@/types/session'
import { EditOutlined, ShareAltOutlined, PushpinOutlined, MoreOutlined, DeleteOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { Modal as AModal, Input as AInput, message } from 'ant-design-vue'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuPortal
} from '@/components/ui/dropdown-menu'
import { Pin, Share2, Pencil, Trash2, MoreHorizontal } from 'lucide-vue-next'
import SidebarActionBar from '@/components/ui/SidebarActionBar.vue'
import GlobalSearchModal from './GlobalSearchModal.vue'
import {useAuthStore} from "@/stores/authStore"
import { deleteSession, renameSession, pinSession, unpinSession } from '@/api/session'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Session } from '@/types/session'
import { BUTTON_COPY, ERROR_COPY } from '@/constants/copywriting'
import { isToday, subDays, isAfter, format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const chat = useChatStore()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// 响应式的当前会话ID (从路由获取)
const currentSessionId = computed(() => route.params.sessionId as string | undefined)

onMounted(async () => {
  if (!auth.isAuthenticated) return
  // 等待路由解析完成，避免初始渲染时 route.meta 尚未就绪导致误调用
  await router.isReady()
  // standalone/fullscreen 页面（如 404）不需要 session 数据
  if (route.meta?.standalone || route.meta?.fullscreen) return
  chat.loadSessions()
})

// 操作菜单状态
const isRenamingId = ref<string | null>(null)
const newTitle = ref('')
const operationLoading = ref(false)
const isActive = (id: string) => {
  return currentSessionId.value === id
}

const isFilterModalOpen = ref(false)

// 点击会话时通过路由跳转，利用 URL 参数持久化会话状态
const handleSessionClick = (sessionId: string) => {
  router.push({ name: 'Chat', params: { sessionId } })
}

// 新建对话
const handleNewChat = async () => {
  // 1. 重置编辑会话
  chat.resetEditingSession(AgentType.VoloAI, t('chat.sider.newChat'))
  // 2. 跳转到 /chat（无参数）
  await router.push({ name: 'Chat' })
}

// 开始重命名
const startRename = (session: Session) => {
  isRenamingId.value = session.id
  newTitle.value = session.title
}

// 确认重命名
const confirmRename = async (sessionId: string) => {
  if (operationLoading.value) return    // Guard: 防重入
  if (!newTitle.value.trim()) {
    message.error(t('chat.sider.renameEmptyError'))
    return
  }

  operationLoading.value = true
  try {
    const result = await renameSession(sessionId, newTitle.value)
    if (result.code === 200) {
      message.success(t('chat.sider.renameSuccess'))
      const session = chat.sessions.find(s => s.id === sessionId)
      if (session) {
        session.title = newTitle.value
      }
    } else {
      message.error(result.message || t('chat.sider.renameFailed'))
    }
  } catch (error: any) {
    message.error(error.message || t('chat.sider.renameRetryError'))
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
  if (operationLoading.value) return    // Guard: 防重入
  AModal.confirm({
    title: t('chat.sider.deleteTitle'),
    content: t('chat.sider.deleteConfirm', { title: session.title }),
    okText: t('common.button.delete'),
    cancelText: BUTTON_COPY.CANCEL,
    okButtonProps: { danger: true },
    onOk: async () => {
      operationLoading.value = true
      try {
        const result = await deleteSession(session.id)
        if (result.code === 200) {
          message.success(t('chat.sider.deleteSuccess'))
          // 使用 removeSession 清理会话及所有关联数据（HIGH-02 修复）
          chat.removeSession(session.id)
          // 如果删除的是当前会话，切换到其他会话或主页
          if (currentSessionId.value === session.id) {
            await router.push({name: 'Chat'})
          }
        } else {
          message.error(result.message || t('chat.sider.deleteFailed'))
        }
      } catch (error: any) {
        message.error(error.message || ERROR_COPY.GENERIC)
      } finally {
        operationLoading.value = false
      }
    }
  })
}

// 置顶/取消置顶
const handlePin = async (session: Session) => {
  if (operationLoading.value) return    // Guard: 防重入
  operationLoading.value = true
  try {
    const isCurrentlyPinned = session.isPin
    const result = isCurrentlyPinned
      ? await unpinSession(session.id)
      : await pinSession(session.id)

    if (result.code === 200) {
      message.success(isCurrentlyPinned ? t('chat.sider.unpinSuccess') : t('chat.sider.pinSuccess'))
      session.isPin = !isCurrentlyPinned
    } else {
      message.error(result.message || ERROR_COPY.OPERATION_FAILED)
    }
  } catch (error: any) {
    message.error(error.message || ERROR_COPY.GENERIC)
  } finally {
    operationLoading.value = false
  }
}

// 分享功能(占位)
const handleShare = (session: Session) => {
  message.info(t('chat.sider.shareInDev'))
}

// 刷新会话列表
const handleRefreshSessions = async () => {
  if (chat.isLoadingSessions) return    // Guard: 防重入
  try {
    await chat.loadSessions()
    message.success(t('chat.sider.refreshSuccess'))
  } catch (error: any) {
    message.error(error.message || t('chat.sider.refreshFailed'))
  }
}


interface GroupedSessions {
  label: string
  items: Session[]
}

const groupedSessions = computed(() => {
  const sessions = chat.sessions
  const validSessions = sessions.filter(s => !s.id.startsWith('temp-'))

  // Sort by updatedTime desc
  const sorted = [...validSessions].sort((a, b) => {
      return new Date(b.updatedTime).getTime() - new Date(a.updatedTime).getTime()
  })

  const groups: GroupedSessions[] = []
  const pinned: Session[] = []
  const today: Session[] = []
  const last7Days: Session[] = []
  const last30Days: Session[] = []
  const older: Record<string, Session[]> = {}

  sorted.forEach(s => {
      if (s.isPin) {
          pinned.push(s)
          return
      }

      const date = new Date(s.updatedTime)
      if (isToday(date)) {
          today.push(s)
      } else if (isAfter(date, subDays(new Date(), 7))) {
          last7Days.push(s)
      } else if (isAfter(date, subDays(new Date(), 30))) {
          last30Days.push(s)
      } else {
          const month = format(date, 'MMMM', { locale: zhCN })
          if (!older[month]) older[month] = []
          older[month].push(s)
      }
  })

  if (pinned.length > 0) groups.push({ label: t('chat.sider.pinned'), items: pinned })
  if (today.length > 0) groups.push({ label: t('chat.sider.today'), items: today })
  if (last7Days.length > 0) groups.push({ label: t('chat.sider.last7Days'), items: last7Days })
  if (last30Days.length > 0) groups.push({ label: t('chat.sider.last30Days'), items: last30Days })

  Object.keys(older).forEach(month => {
      groups.push({ label: month, items: older[month] })
  })

  return groups
})

</script>

<template>
  <div class="hover chat-sider-container border-0! overflow-x-hidden">
    <!-- py-3 px-3.5 = padding: 12px 14px -->
    <div class="flex flex-col py-3 pl-1.5 pr-1">
        <!-- 顶部操作栏：汉堡菜单 -->


        <!-- font-semibold text-[13px] mb-2 -->
        <div class="mb-2 sl-title shrink-0 font-bold flex items-center justify-between nav-item text-primary-900/90 dark:text-zinc-200/90">
          <span>{{ t('chat.sider.title') }}</span>
          <div class="flex items-center gap-1">
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                    :disabled="chat.isLoadingSessions"
                    @click="handleRefreshSessions"
                  >
                    <ReloadOutlined :class="{ 'animate-spin': chat.isLoadingSessions }" class="mr-1" />
                    {{ chat.isLoadingSessions ? t('chat.sider.refreshing') : t('chat.sider.refreshBtn') }}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6">
                  <p>{{ t('chat.sider.refreshTooltip') }}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-800/40 transition-all active:scale-95"
                    @click="isFilterModalOpen = true"
                  >
                    <FilterOutlined class="mr-1" />
                    {{ t('chat.sider.filterBtn') }}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" :side-offset="6">
                  <p>{{ t('chat.sider.filterTooltip') }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <!-- Scrollable Session List -->
        <div class="min-h-0 mb-3 -mr-2 pr-2 w-full">
          <!-- Loading Skeleton -->
          <div v-if="chat.isLoadingSessions" class="space-y-4">
            <!-- 分组标题骨架 -->
            <div class="px-2 mb-1">
              <div class="h-3 w-12 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse"></div>
            </div>
            <!-- 置顶会话骨架 -->
            <div v-for="i in 2" :key="`pinned-${i}`" class="px-3">
              <div class="flex items-center gap-2 py-2.5 px-3 rounded-3xl bg-white/40 dark:bg-zinc-800/40">
                <div class="w-3.5 h-3.5 rounded-sm bg-gray-200 dark:bg-zinc-700 animate-pulse shrink-0"></div>
                <div class="flex-1 h-4 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" style="width: 60%"></div>
              </div>
            </div>

            <!-- 今天分组骨架 -->
            <div class="px-2 mt-3 mb-1">
              <div class="h-3 w-10 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse"></div>
            </div>
            <div v-for="i in 3" :key="`today-${i}`" class="px-3">
              <div class="flex items-center gap-2 py-2.5 px-3 rounded-3xl bg-white/40 dark:bg-zinc-800/40">
                <div class="flex-1 h-4 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" style="width: 70%"></div>
              </div>
            </div>

            <!-- 过去7天分组骨架 -->
            <div class="px-2 mt-3 mb-1">
              <div class="h-3 w-16 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse"></div>
            </div>
            <div v-for="i in 2" :key="`week-${i}`" class="px-3">
              <div class="flex items-center gap-2 py-2.5 px-3 rounded-3xl bg-white/40 dark:bg-zinc-800/40">
                <div class="flex-1 h-4 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" style="width: 55%"></div>
              </div>
            </div>
          </div>

          <!-- Session List -->
          <div v-else class="space-y-4">
            <div v-for="group in groupedSessions" :key="group.label">
              <h3 class="text-xs font-medium text-gray-500 dark:text-slate-400 px-2 mb-2 nav-item">{{ group.label }}</h3>
              <div class="grid gap-1.5 w-full overflow-hidden">
                <template
                    v-for="c in group.items"
                    :key="c.id"
                >
                    <div
                        class="sl-conv-item nav-item relative overflow-hidden w-full
                          py-3 px-4 transition-all backdrop-blur-sm h-[45px] text-sm
                          rounded-3xl cursor-pointer flex items-center justify-start active:scale-[0.98]
                          text-primary-900/90 bg-primary-50/60 hover:bg-primary-900/5
                          dark:text-zinc-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                        :class="{
                          'active !bg-primary-100/90 !text-primary-600/90 dark:!bg-primary-500/10 dark:!text-primary-400': isActive(c.id)
                        }"
                        
                     @click="handleSessionClick(c.id)"
                    >
                        <PushpinOutlined v-if="c.isPin" class="text-warning shrink-0 mr-1" />
                        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                          <Tooltip>
                            <TooltipTrigger as-child>
                              <span class="flex-1 min-w-0 text-ellipsis whitespace-nowrap overflow-hidden">{{ c.title }}</span>
                            </TooltipTrigger>
                            <TooltipContent side="right" :side-offset="6">
                              <p>{{ c.title }}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <!-- 操作菜单 (shadcn DropdownMenu，Portal 渲染不受 overflow:hidden 影响) -->
                        <div @click.stop>
                          <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                              <button :aria-label="t('chat.sider.sessionMenuAriaLabel')" class="menu-trigger shrink-0 cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 active:scale-95 transition-all">
                                <MoreHorizontal :size="14" class="text-slate-500 dark:text-zinc-400 rotate-90" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuContent align="end" :side-offset="4" class="min-w-[140px]">
                                <DropdownMenuItem @select="handlePin(c)">
                                  <Pin :size="14" class="mr-2" />
                                  {{ c.isPin ? t('chat.sider.unpin') : t('chat.sider.pin') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @select="handleShare(c)">
                                  <Share2 :size="14" class="mr-2" />
                                  {{ t('chat.sider.share') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @select="startRename(c)">
                                  <Pencil :size="14" class="mr-2" />
                                  {{ t('chat.sider.rename') }}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem class="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20" @select="handleDelete(c)">
                                  <Trash2 :size="14" class="mr-2" />
                                  {{ t('chat.sider.deleteSession') }}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenuPortal>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                </template>
              </div>
            </div>
          </div>
        </div>


      </div>

    <!-- 重命名对话框 -->
    <AModal
      v-model:open="isRenamingId"
      :title="t('chat.sider.renameTitle')"
      :ok-text="BUTTON_COPY.CONFIRM"
      :cancel-text="BUTTON_COPY.CANCEL"
      :loading="operationLoading"
      @ok="confirmRename(isRenamingId!)"
      @cancel="cancelRename"
    >
      <AInput
        v-model:value="newTitle"
        :placeholder="t('chat.sider.renamePlaceholder')"
        @keyup.enter="confirmRename(isRenamingId!)"
      />
    </AModal>

    <!-- 全局搜索弹窗 -->
    <GlobalSearchModal v-model:open="isFilterModalOpen" />

  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";

// 容器布局 - 使用 flex 确保操作栏固定在底部
.chat-sider-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: auto;
}


// 颜色/背景已迁移至模板 Tailwind dark: 类

// 图标按钮样式（仅布局）
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-normal, 200ms) var(--ease-snap);
}

.menu-item {

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: var(--color-slate-600);
  border-radius: var(--radius-lg, 0.5rem);
  transition: all var(--duration-normal, 200ms) var(--ease-snap);
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background-color: var(--color-slate-100);
    color: var(--color-slate-800);
  }

  &.router-link-active {
    background-color: var(--color-primary-100);
    color: var(--color-primary-600);
  }
}

// nav-item 从左滑入（每次渲染都播放）
@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.nav-item {
  opacity: 0;
  animation: slideInLeft 0.5s var(--ease-fluid) forwards;
  will-change: opacity, transform;
  transition: background 0.2s ease, color 0.2s ease;
}

// 交错延迟（+0.1s 偏移，紧跟 App.vue 入场节奏）
@for $i from 1 through 30 {
  .nav-item:nth-child(#{$i}) {
    animation-delay: #{0.08s + $i * 0.02s};
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item {
    animation: none;
    opacity: 1;
  }
}


</style>

