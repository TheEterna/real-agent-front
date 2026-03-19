
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message, Button as AButton, ConfigProvider as AConfigProvider } from 'ant-design-vue'
import {
  EditTwoTone,
  ExperimentOutlined,
  MenuOutlined,
} from '@ant-design/icons-vue'
import {
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Bot,
  PencilLine,
  LayoutGrid,
  UserCog
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { authApi } from '@/api/auth'
import AgentSelector from '@/components/AgentSelector.vue'
import {AgentType} from "@/types/session";
import SidebarActionBar from "@/components/ui/SidebarActionBar.vue";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import ChatSider from "@/pages/chat/ChatSider.vue";
import SettingsModal from '@/components/ui/SettingsModal.vue'
import PricingModal from '@/components/ui/PricingModal.vue'
import { useTextConfigStore } from './stores/textConfigStore'
import { useModalRoute } from '@/composables/useModalRoute'
import { useChat } from '@/composables/useChat'
import { useTheme } from '@/composables/useTheme'
import { useLocale } from '@/composables/useLocale'
import { getAntThemeTokens, getIconEditTint } from '@/styles/ant-theme-tokens'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

// 等待路由初始导航完成（含守卫重定向），防止未认证时侧边栏闪烁
const isRouterReady = ref(false)
router.isReady().then(() => { isRouterReady.value = true })

const routeTransitionName = ref('')
watch(
	() => route.path,
	(toPath, fromPath) => {
		if (fromPath === '/knowledge' && toPath === '/knowledge/retrieve') {
			routeTransitionName.value = 'route-slide-left'
			return
		}
		if (fromPath === '/knowledge/retrieve' && toPath === '/knowledge') {
			routeTransitionName.value = 'route-slide-right'
			return
		}
		if (fromPath === '/knowledge' && toPath === '/knowledge/document') {
			routeTransitionName.value = 'route-slide-left'
			return
		}
		if (fromPath === '/knowledge/document' && toPath === '/knowledge') {
			routeTransitionName.value = 'route-slide-right'
			return
		}
		routeTransitionName.value = ''
	},
	{ immediate: true }
)

const currentLocale = ref(locale.value || 'zh')
const collapsed = ref(false)
const isMobile = ref(false)
const sidebarDrawerOpen = ref(false)

// 使用 URL hash 驱动的弹窗管理
const {
  settingsVisible,
  settingsTab,
  pricingVisible,
  openSettings,
  openPricing,
  closeModal,
  switchSettingsTab
} = useModalRoute()


// Agent选择弹窗显示状态
const chat = useChatStore()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const {
  isNewChatDialogOpen,
  openNewChatDialog,
  closeNewChatDialog,
  handleAgentSelect
} = useChat()

// ── 主题切换 ──
const { isDark } = useTheme()
const { initLocale } = useLocale()
const antThemeTokens = computed(() => getAntThemeTokens(isDark.value))
const iconEditTint = computed(() => getIconEditTint(isDark.value))

// 关闭Agent选择器（全局状态）
const handleCloseSelector = () => {
  closeNewChatDialog()
}
const changeLanguage = (lang: string) => {
  locale.value = lang
}
// 打开新建会话弹窗
const handleNewConversation = () => {
  openNewChatDialog()
}

// ── VOLO AI 品牌文字交互 ──
const brandRef = ref<HTMLElement>()
const brandWaving = ref(false)
const brandPopping = ref(false)

function handleBrandHover() {
  if (brandPopping.value) return // click 动画优先
  brandWaving.value = false
  // 强制重置：先关再开，nextTick 保证 DOM 刷新
  requestAnimationFrame(() => { brandWaving.value = true })
  // 动画结束后自动关闭
  setTimeout(() => { brandWaving.value = false }, 600)
}

function handleBrandClick() {
  brandWaving.value = false
  brandPopping.value = false
  requestAnimationFrame(() => { brandPopping.value = true })
  setTimeout(() => { brandPopping.value = false }, 800)
}


// 登出处理
const handleLogout = async () => {
  const authStore = useAuthStore()
  try {
    const accessToken = authStore.accessToken
    if (accessToken) {
      await authApi.logout(accessToken)
    }
  } catch (error) {
    console.error('退出登录失败:', error)
  } finally {
    // 无论API调用成功与否，都清除本地token并跳转
    authStore.clearAuth()
    message.success(t('constants.auth.logoutSuccess'))
    router.push('/')
  }
}


const isStandalone = computed(() => Boolean(route.meta?.standalone))
// 全屏沉浸式模式：隐藏侧边栏，保留全局弹窗（数字分身等页面）
const isFullscreen = computed(() => Boolean(route.meta?.fullscreen))
// 悬停自动展开：折叠状态下鼠标移入暂时展开
const effectiveCollapsed = computed(() => collapsed.value )

const updateIsMobile = () => {
  isMobile.value = window.matchMedia('(max-width: 768px)').matches
  if (isMobile.value) {
    collapsed.value = true
  }
}



const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const closeSider = () => {
  collapsed.value = true
}

// 响应式守卫：后台 token 验证失效时，立即重定向到登录页
// 场景：init() 在后台发现 token 过期 → clearAuth() → 此 watch 触发
watch(() => authStore.isAuthenticated, (isAuth, wasAuth) => {
  if (wasAuth && !isAuth && route.meta.requiresAuth !== false) {
    router.replace('/')
  }
})

// 移动端：路由变化时自动关闭侧边栏抽屉
watch(() => route.path, () => {
  if (isMobile.value) sidebarDrawerOpen.value = false
})

onMounted(async () => {
  initLocale()
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  // init() 已在路由守卫中 fire-and-forget 启动
  // 此处额外刷新用户资料（头像、昵称等展示信息），isRefreshingProfile 防重复
  if (authStore.isAuthenticated) {
    authStore.refreshUserProfile()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})

// 处理设置弹窗的 tab 变化
const handleSettingsTabChange = (tab: string) => {
  switchSettingsTab(tab as any)
}

// 处理从设置弹窗打开定价弹窗
const handleOpenPricingFromSettings = () => {
  openPricing()
}

// 订阅变更后刷新用户状态
const handleSubscriptionChanged = () => {
  authStore.refreshUserProfile()
}
</script>


<template>
  <!-- Agent选择弹窗 -->
  <AgentSelector
      :visible="isNewChatDialogOpen"
      @select="handleAgentSelect"
      @close="handleCloseSelector"
  />

  <!-- Settings Modal - URL hash 驱动 -->
  <SettingsModal
    v-model:visible="settingsVisible"
    :initial-tab="settingsTab"
    @tab-change="handleSettingsTabChange"
    @open-pricing="handleOpenPricingFromSettings"
  />

  <!-- Pricing Modal - URL hash 驱动 -->
  <PricingModal
    v-model:visible="pricingVisible"
    :current-tier="user?.tier"
    :current-billing="user?.billing"
    @subscription-changed="handleSubscriptionChanged"
  />

  <AConfigProvider
      :theme="{ token: antThemeTokens }"
  >

    <div v-if="isRouterReady && !isStandalone" class="app-shell">
      <!-- ═══ PC 侧边栏（纯 CSS flex + width transition，无 Ant LayoutSider） ═══ -->
      <aside
          v-if="!isFullscreen && !isMobile"
          class="app-sidebar"
          :class="{ 'is-collapsed': effectiveCollapsed }"
      >
        <div class="sidebar-inner flex flex-col h-full">
          <TooltipProvider :delay-duration="300">
          <!-- Header Area -->
          <div class="flex items-center shrink-0 nav-item" :class="effectiveCollapsed ? 'items-center flex-col pt-3.5 gap-1.5' : 'justify-between p-4'">
            <!-- Logo + Brand（v-show 避免展开时 DOM 重建开销） -->
            <div v-show="!effectiveCollapsed" class="flex items-center gap-1 overflow-hidden whitespace-nowrap">
              <img
                src="/mascot.png"
                class="w-15 h-15 object-contain cursor-pointer"
                alt="Mascot"
                @click="router.push('/')"
              />
              <span
                ref="brandRef"
                class="volo-brand font-bold text-xl text-gray-900 dark:text-white tracking-wide select-none cursor-pointer"
                :class="{ 'is-waving': brandWaving, 'is-popping': brandPopping }"
                @click="handleBrandClick"
                @mouseenter="handleBrandHover"
              >
                <span
                  v-for="(ch, i) in 'VOLO AI'.split('')"
                  :key="i"
                  class="volo-char"
                  :style="{ '--i': i }"
                >{{ ch === ' ' ? '\u00A0' : ch }}</span>
              </span>
            </div>
            <img
              v-show="effectiveCollapsed"
              src="/mascot.png"
              class="w-15 h-15 cursor-pointer"
              alt="Mascot"
              @click="router.push('/')"
            />

            <!-- Toggle Button -->
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-zinc-400 transition-colors collapsed-icon-btn"
                  @click="toggleCollapse"
                  :aria-label="effectiveCollapsed ? t('constants.sidebar.expandSidebar') : t('constants.sidebar.collapseSidebar')"
                >
                  <PanelLeftOpen v-if="effectiveCollapsed" />
                  <PanelLeftClose v-else />
                </button>
              </TooltipTrigger>
              <TooltipContent :side="effectiveCollapsed ? 'right' : 'bottom'">
                <p>{{ effectiveCollapsed ? t('constants.sidebar.expand') : t('constants.sidebar.collapse') }}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <!-- 新建聊天按钮 -->
          <div v-show="!effectiveCollapsed" class="mb-4 py-0 px-4 nav-item">
            <AButton
                type="text"
                class="new-chat-btn"
                block
                @click="handleNewConversation"
            >
              <template #icon>
                <EditTwoTone :two-tone-color="iconEditTint" />
              </template>
              <span class="ml-2">{{ t('constants.sidebar.newChat') }}</span>
            </AButton>
          </div>
          <div v-show="!effectiveCollapsed" class="mb-2 py-0 px-4 nav-item">
            <router-link
                to="/playground"
                class="playground-entry"
            >
              <div class="entry-icon">
                <ExperimentOutlined />
              </div>
              <span class="entry-label">{{ t('constants.sidebar.explorePlayground') }}</span>
            </router-link>
          </div>
          <!-- Content Area -->
          <div class="flex-1 overflow-hidden relative border-none">

            <!-- Expanded Content -->
            <div v-show="!effectiveCollapsed" class="h-full flex flex-col w-full px-4.5">
               <!-- Main Content (Session List) -->
               <ChatSider />

               <!-- Footer -->
               <div class="mt-auto pt-4 mb-3" style="overflow: visible;">
                 <SidebarActionBar
                   :avatar-url="user?.avatarUrl"
                   :avatar-version="authStore.profileVersion"
                   :username="user?.nickname"
                   :tier="user?.tier"
                   :credits="user?.credits ?? 0"
                   :max-credits="user?.subscription?.plan?.monthlyCredits ?? 100"
                   :is-sidebar-open="!effectiveCollapsed"
                   @open-settings="openSettings"
                   @open-pricing="openPricing"
                 />
               </div>
            </div>

            <!-- Collapsed Content (Mini Icons) -->
            <div v-show="effectiveCollapsed" class="flex flex-col items-center gap-6 pt-4 w-full h-full animate-fade-in relative">
               <Tooltip>
                 <TooltipTrigger as-child>
                   <button
                     class="p-3 rounded-xl transition-all collapsed-icon-btn"
                     @click="handleNewConversation"
                   >
                     <PencilLine />
                   </button>
                 </TooltipTrigger>
                 <TooltipContent side="right">
                   <p>{{ t('constants.sidebar.newChat') }}</p>
                 </TooltipContent>
               </Tooltip>

               <Tooltip>
                 <TooltipTrigger as-child>
                   <router-link
                     to="/chat"
                     class="relative p-3 rounded-xl transition-all collapsed-icon-btn group"
                     :class="{ 'collapsed-icon-btn-active': route.path.startsWith('/chat') }"
                   >
                     <MessageSquare />
                     <div class="collapsed-indicator" :class="{ 'active': route.path.startsWith('/chat') }"></div>
                   </router-link>
                 </TooltipTrigger>
                 <TooltipContent side="right">
                   <p>Chat</p>
                 </TooltipContent>
               </Tooltip>

               <Tooltip>
                 <TooltipTrigger as-child>
                   <router-link
                     to="/avatar"
                     class="relative p-3 rounded-xl transition-all collapsed-icon-btn group"
                     :class="{ 'collapsed-icon-btn-active': route.path.startsWith('/avatar') }"
                   >
                     <Bot />
                     <div class="collapsed-indicator" :class="{ 'active': route.path.startsWith('/avatar') }"></div>
                   </router-link>
                 </TooltipTrigger>
                 <TooltipContent side="right">
                   <p>{{ t('constants.sidebar.digitalAvatar') }}</p>
                 </TooltipContent>
               </Tooltip>

               <Tooltip>
                 <TooltipTrigger as-child>
                   <router-link
                     to="/playground"
                     class="relative p-3 rounded-xl transition-all collapsed-icon-btn group"
                     :class="{ 'collapsed-icon-btn-active': route.path.startsWith('/playground') }"
                   >
                     <LayoutGrid />
                     <div class="collapsed-indicator" :class="{ 'active': route.path.startsWith('/playground') }"></div>
                   </router-link>
                 </TooltipTrigger>
                 <TooltipContent side="right">
                   <p>Playground</p>
                 </TooltipContent>
               </Tooltip>

               <div class="h-px w-8 bg-gray-200/50 dark:bg-white/8 my-1"></div>

               <Tooltip>
                 <TooltipTrigger as-child>
                   <button
                     class="p-3 rounded-xl transition-all collapsed-icon-btn"
                     @click="openSettings()"
                   >
                     <UserCog />
                   </button>
                 </TooltipTrigger>
                 <TooltipContent side="right">
                   <p>Settings</p>
                 </TooltipContent>
               </Tooltip>

               <!-- 折叠状态下的用户头像按钮 -->
               <div class="mt-auto mb-3">
                 <SidebarActionBar
                   :avatar-url="user?.avatarUrl"
                   :avatar-version="authStore.profileVersion"
                   :username="user?.nickname"
                   :tier="user?.tier"
                   :credits="user?.credits ?? 0"
                   :max-credits="user?.subscription?.plan?.monthlyCredits ?? 100"
                   :is-sidebar-open="false"
                   @open-settings="openSettings"
                   @open-pricing="openPricing"
                 />
               </div>
            </div>

          </div>
          </TooltipProvider>
        </div>
      </aside>

      <!-- 移动端侧边栏抽屉 -->
      <Dialog v-if="isMobile && !isFullscreen" v-model:open="sidebarDrawerOpen">
        <DialogContent class="sidebar-drawer" :show-close-button="false">
          <!-- 头部：Logo + 关闭按钮 -->
          <div class="sidebar-drawer-header">
            <div class="flex items-center gap-1">
              <img
                src="/mascot.png"
                class="w-10 h-10 object-contain cursor-pointer"
                alt="Mascot"
                @click="router.push('/'); sidebarDrawerOpen = false"
              />
              <span class="font-bold text-lg text-gray-900 dark:text-white tracking-wide">VOLO AI</span>
            </div>
            <button
              class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-zinc-400 transition-colors"
              :aria-label="t('constants.sidebar.closeMenu')"
              @click="sidebarDrawerOpen = false"
            >
              <PanelLeftClose :size="20" />
            </button>
          </div>

          <!-- 新建会话 + Playground 入口 -->
          <div class="sidebar-drawer-actions">
            <AButton
              type="text"
              class="new-chat-btn"
              block
              @click="handleNewConversation(); sidebarDrawerOpen = false"
            >
              <template #icon>
                <EditTwoTone :two-tone-color="iconEditTint" />
              </template>
              <span class="ml-2">{{ t('constants.sidebar.newChat') }}</span>
            </AButton>
            <router-link
              to="/playground"
              class="playground-entry"
              @click="sidebarDrawerOpen = false"
            >
              <div class="entry-icon">
                <ExperimentOutlined />
              </div>
              <span class="entry-label">{{ t('constants.sidebar.explorePlayground') }}</span>
            </router-link>
          </div>

          <!-- 会话列表（可滚动区域） -->
          <div class="sidebar-drawer-content">
            <ChatSider />
          </div>

          <!-- 底部操作栏 -->
          <div class="sidebar-drawer-footer">
            <SidebarActionBar
              :avatar-url="user?.avatarUrl"
              :avatar-version="authStore.profileVersion"
              :username="user?.nickname"
              :tier="user?.tier"
              :credits="user?.credits ?? 0"
              :max-credits="user?.subscription?.plan?.monthlyCredits ?? 100"
              :is-sidebar-open="true"
              @open-settings="openSettings"
              @open-pricing="openPricing"
            />
          </div>
        </DialogContent>
      </Dialog>

      <!-- ═══ 主内容区 ═══ -->
      <main class="app-main" :class="{ 'bg-background': !isFullscreen }">
          <TooltipProvider v-if="isMobile && !isFullscreen" :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="mobile-sider-trigger"
                  :aria-label="t('constants.sidebar.openMenu')"
                  :aria-expanded="sidebarDrawerOpen"
                  @click="sidebarDrawerOpen = true"
                >
                  <MenuOutlined />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{{ t('constants.sidebar.openMenu') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <router-view v-slot="{ Component, route: viewRoute }">
            <Transition :name="routeTransitionName" mode="out-in">
              <component :is="Component" :key="viewRoute.path" :class="isFullscreen ? 'w-full' : 'bg-background w-full'" />
            </Transition>
          </router-view>
      </main>
    </div>

    <div v-else-if="isRouterReady">
      <router-view v-slot="{ Component, route: viewRoute }">
        <component :is="Component" :key="viewRoute.path" />
      </router-view>
    </div>
    
  </AConfigProvider>

</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as v;
@use "sass:color";
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// ── VOLO AI 品牌文字基础样式 ──
.volo-brand {
  display: inline-flex;
}

.volo-char {
  display: inline-block;
  transition: color 0.25s ease, transform 0.25s ease;
}

// hover 静态效果 — 字符微微上浮 + 变色（交错延迟）
.volo-brand:hover .volo-char {
  color: $primary-color-500;
  transform: translateY(-1px);
  transition-delay: calc(var(--i) * 25ms);
}
.volo-brand:not(:hover) .volo-char {
  transition-delay: calc((6 - var(--i)) * 25ms); // 收回时反向延迟
}

// ── App Shell：flex 布局替代 Ant Layout ──
.app-shell {
  display: flex;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.app-sidebar {
  width: 280px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--color-primary-50);
  // 仅过渡 width —— 不用 transition:all，避免触发全属性 reflow
  transition: width 280ms var(--ease-fluid, cubic-bezier(0.23, 1, 0.32, 1));
  will-change: width;

  &.is-collapsed {
    width: 80px;
  }

  // 内部内容宽度随折叠态瞬间切换（无 transition），
  // aside 的 overflow:hidden + width transition 做"幕布揭示"效果
  .sidebar-inner {
    width: 280px;
  }

  &.is-collapsed .sidebar-inner {
    width: 80px;
  }
}

.app-main {
  flex: 1;
  min-width: 0; // 防止 flex 子元素撑破
  overflow: auto;
  position: relative;
  display: flex;
}

:deep(.ant-btn){
  span {
    svg {
      display: block !important;
    }
  }
}




// 3. 新建聊天按钮样式
.new-chat-btn {
  height: 44px;
  box-sizing: border-box;
  border-radius: 22px;
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  background: rgba($primary-color-900, 0.04);
  color: rgba($primary-color-900, 0.85);
  transition: all 0.2s ease;

  &:hover {
    background: rgba($primary-color-900, 0.08) !important;
    color: rgba($primary-color-900, 0.95);
  }

  &:active {
    background: rgba($primary-color-900, 0.12) !important;
  }
}

// Playground 入口样式
.playground-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 22px;
  background: linear-gradient(to right, color.mix(white, $primary-color-50, 40%), color.mix(white, $primary-color-50, 10%));
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

.mobile-sider-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  z-index: 1500;
}

.mobile-sider-trigger {
  position: absolute;
  left: 12px;
  top: 12px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.06);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

// 折叠状态下的图标按钮样式
.collapsed-icon-btn {
  color: $primary-color-500 !important;

  &:hover {
    background: rgba($secondary-color-100, 0.5) !important;
    color: $primary-color-500 !important;
  }

  &.collapsed-icon-btn-active {
    background: rgba($secondary-color-100, 0.8) !important;
    color: $secondary-color-400 !important;
  }
}

// 指示器样式
.collapsed-indicator {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  border-radius: 4px;
  background-color: $secondary-color-600;
  box-shadow: 0 0 12px rgba($secondary-color-600, 0.4);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &.active {
    opacity: 1;
    height: 20px;
  }
}

/* 暗色模式适配已移至非 scoped <style> 块
   原因：:global(.dark) 在 Vue scoped SCSS 中有编译 bug，子选择器会丢失 */

// ── 入场动画：仅首次加载时播放，展开/折叠切换不重播 ──

// nav-item 从左滑入动画（每次渲染都播放，包括刷新和展开）
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
  animation: slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: opacity, transform;
  transition: background 0.2s ease, color 0.2s ease;
}

// 交错延迟
@for $i from 1 through 30 {
  .nav-item:nth-child(#{$i}) {
    animation-delay: #{0.05s + $i * 0.03s};
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item {
    animation: none;
    opacity: 1;
  }
}

:deep(.route-slide-left-enter-active),
:deep(.route-slide-left-leave-active),
:deep(.route-slide-right-enter-active),
:deep(.route-slide-right-leave-active) {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

:deep(.route-slide-left-enter-from) {
  transform: translateX(16px);
  opacity: 0;
}

:deep(.route-slide-left-leave-to) {
  transform: translateX(-16px);
  opacity: 0;
}

:deep(.route-slide-right-enter-from) {
  transform: translateX(-16px);
  opacity: 0;
}

:deep(.route-slide-right-leave-to) {
  transform: translateX(16px);
  opacity: 0;
}

// 默认 fade 过渡（无 mode 时使用）
:deep(.fade-enter-active),
:deep(.fade-leave-active) {
  transition: opacity 0.15s ease;
}

:deep(.fade-enter-from),
:deep(.fade-leave-to) {
  opacity: 0;
}


</style>

<!-- 非 scoped 样式：侧边栏暗色模式 + 品牌动画 + 移动端抽屉
     注意：.dark 嵌套选择器必须在非 scoped 块中（Vue scoped 的 :global(.dark) 有编译 bug） -->
<style lang="scss">
.dark {
  // ---- 侧边栏暗色适配 ----
  .app-sidebar {
    background: #18181b;
  }

  .ant-tooltip-inner {
    background: #1a2426;
  }
  .ant-tooltip-arrow::before {
    background: #1a2426;
  }

  // ---- 侧边栏组件暗色适配 ----
  .new-chat-btn {
    background: rgba(255, 255, 255, 0.05) !important;
    color: rgba(224, 231, 235, 0.8) !important;

    &:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: rgba(224, 231, 235, 0.9) !important;
    }

    &:active {
      background: rgba(255, 255, 255, 0.14) !important;
    }
  }

  .playground-entry {
    background: linear-gradient(to right, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)) !important;
    color: rgba(224, 231, 235, 0.75) !important;
    border-color: transparent !important;

    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      border-color: rgba(255, 255, 255, 0.08) !important;
    }

    &.router-link-active {
      background: rgba(124, 183, 180, 0.12) !important;
      color: rgba(124, 183, 180, 0.9) !important;
      border-color: rgba(124, 183, 180, 0.2) !important;
    }
  }

  .entry-icon {
    background: rgba(124, 183, 180, 0.12) !important;
    color: rgba(124, 183, 180, 0.8) !important;
  }

  .collapsed-icon-btn {
    color: rgba(124, 183, 180, 0.65) !important;

    &:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: rgba(124, 183, 180, 0.9) !important;
    }

    &.collapsed-icon-btn-active {
      background: rgba(124, 183, 180, 0.1) !important;
      color: rgba(124, 183, 180, 0.9) !important;
    }
  }

  .collapsed-indicator {
    background-color: rgba(124, 183, 180, 0.7);
    box-shadow: 0 0 12px rgba(124, 183, 180, 0.25);
  }

  .mobile-sider-backdrop {
    background: rgba(0, 0, 0, 0.6);
  }

  .mobile-sider-trigger {
    background: rgba(20, 28, 30, 0.92);
    border-color: rgba(255, 255, 255, 0.06);
    color: rgba(224, 231, 235, 0.8);
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

/* ── VOLO AI 品牌文字动画（非 scoped，避免 keyframe 名被 hash） ── */

/* Hover 波浪：字符依次弹起，像钢琴键被轻触 */
@keyframes volo-wave {
  0%   { transform: translateY(0); }
  35%  { transform: translateY(-6px); }
  65%  { transform: translateY(1px); }
  100% { transform: translateY(0); }
}

/* Click 果冻弹跳：字符膨胀→压扁→回弹，参考 Slack emoji 反应动画 */
@keyframes volo-pop {
  0%   { transform: scale(1) translateY(0); }
  20%  { transform: scale(1.3, 0.8) translateY(2px); }
  40%  { transform: scale(0.85, 1.2) translateY(-8px); }
  55%  { transform: scale(1.1, 0.9) translateY(-2px); }
  70%  { transform: scale(0.95, 1.05) translateY(1px); }
  100% { transform: scale(1) translateY(0); }
}

.volo-brand.is-waving .volo-char {
  animation: volo-wave 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 45ms);
}

.volo-brand.is-popping .volo-char {
  animation: volo-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--i) * 55ms);
}

/* ── 移动端侧边栏抽屉 ── */
/* 覆盖 DialogContent 的默认样式：center positioning / grid / gap / padding / max-width / zoom animation */
.sidebar-drawer {
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  bottom: 0 !important;
  right: auto !important;
  width: 280px !important;
  height: 100vh !important;
  height: 100dvh !important; /* 移动端安全区域 */
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  border-radius: 0 !important;
  padding: 0 !important;
  /* 覆盖 DialogContent 的 translate-x-[-50%] translate-y-[-50%]（动画关键帧会动态覆盖 transform） */
  translate: none !important;  /* CSS translate 属性独立于 transform */
  /* 覆盖 DialogContent 的 grid + gap-4 */
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
  background: var(--color-primary-50, #f0faf9) !important;
  border: none !important;
  overflow: hidden !important;
}

/* 头部：Logo + 关闭按钮 */
.sidebar-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-shrink: 0;
}

/* 操作按钮区：新会话 + Playground */
.sidebar-drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 8px;
  flex-shrink: 0;
}

/* 可滚动内容区：会话列表 */
.sidebar-drawer-content {
  flex: 1 1 0;
  min-height: 0; /* 关键：允许 flex 子元素缩小以启用滚动 */
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

/* 底部操作栏 */
.sidebar-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* 开关动画 — 覆盖 DialogContent 默认的 zoom-in/zoom-out */
.sidebar-drawer[data-state="open"] {
  animation: slideInFromLeft 300ms cubic-bezier(0.23, 1, 0.32, 1) forwards !important;
}

.sidebar-drawer[data-state="closed"] {
  animation: slideOutToLeft 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
}

@keyframes slideInFromLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutToLeft {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
}

/* 暗色模式 */
.dark .sidebar-drawer {
  background: #18181b !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
}

.dark .sidebar-drawer-footer {
  border-top-color: rgba(255, 255, 255, 0.06);
}
</style>
