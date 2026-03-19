
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MessageOutlined,
  DashboardOutlined,
  ToolOutlined,
  RobotOutlined,
  ApartmentOutlined,
  SettingOutlined,
  EditTwoTone,
  FileTextOutlined,
  ExperimentOutlined,
  LogoutOutlined, MenuOutlined, SearchOutlined, AppstoreOutlined
} from '@ant-design/icons-vue'
import { getRandomGlassColor } from '@/utils/ColorUtils'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { authApi } from '@/api/auth'
import AgentSelector from '@/components/AgentSelector.vue'
import {AgentType} from "@/types/session";
import SidebarActionBar from "@/components/ui/SidebarActionBar.vue";
import ChatSider from "@/pages/chat/ChatSider.vue";

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const currentLocale = ref(locale.value || 'zh')
const collapsed = ref(false)


// Agent选择弹窗显示状态
const showAgentSelector = ref(false)
const chat = useChatStore()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

// 选择Agent并创建会话
const handleAgentSelect = (type: AgentType) => {
  const newSession = chat.resetEditingSession(type)
  showAgentSelector.value = false

  // 临时会话不在 URL 中显示，跳转到 /chat (不带参数)
  // 当用户发送第一条消息后，后端返回真实 sessionId，再更新 URL
  if (newSession) {
    router.push({ name: 'Chat' })  // 不传 sessionId 参数
  }
}

// 关闭Agent选择器
const handleCloseSelector = () => {
  showAgentSelector.value = false
}
const changeLanguage = (lang: string) => {
  locale.value = lang
}
// 打开新建会话弹窗
const handleNewConversation = () => {
  showAgentSelector.value = true
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
    message.success('已退出登录')
    router.push('/login')
  }
}


const isStandalone = computed(() => Boolean(route.meta && (route.meta as any).standalone))
// 悬停自动展开：折叠状态下鼠标移入暂时展开
const effectiveCollapsed = computed(() => collapsed.value )



const toggleCollapse = () => {
  // 点击切换时取消悬停展开，避免视觉抖动
  collapsed.value = !collapsed.value
}

// 随机图标背景色（玻璃色），进入时生成一次即可
const iconBg = {
  chat: getRandomGlassColor(),
  dashboard: getRandomGlassColor(),
  tools: getRandomGlassColor(),
  agents: getRandomGlassColor(),
  workflows: getRandomGlassColor(),
  config: getRandomGlassColor(),
  playground: getRandomGlassColor(),
}
</script>


<template>
  <!-- Agent选择弹窗 -->
  <AgentSelector
      :visible="showAgentSelector"
      @select="handleAgentSelect"
      @close="handleCloseSelector"
  />

  <a-config-provider
      :theme="{
      token: {
    'colorPrimaryBg': '#f0f7f7',
    'colorPrimaryBgHover': '#e4f1f1',
    'colorPrimaryBorder': '#d8ebea',
    'colorPrimaryBorderHover': '#b8ddd9',
    'colorPrimaryHover': 'rgba(80,200,183,0.9)',
    'colorPrimary': 'rgba(109,184,172,0.9)',
    'colorInfo': '#00bac4',
    'colorSuccess': '#52c41a',
    'colorText': 'rgba(51, 65, 85, 0.9)',
    'colorTextSecondary': 'rgba(51, 65, 85, 0.75)',
    'colorTextTertiary': 'rgba(51, 65, 85, 0.5)',
    'colorTextQuaternary': 'rgba(51, 65, 85, 0.3)'
  },
    }"
  >

    <a-layout v-if="!isStandalone" style="overflow: hidden;min-height: 100vh;height: 100vh;">
      <a-layout-sider
          theme="light"
          :width="300"
          :collapsed-width="0"
          :collapsed="effectiveCollapsed"
          :collapsible="false"
      >
        <div class="flex flex-col justify-between bg-primary-50 h-full px-4.5 w-[300px] overflow-y-auto overflow-x-hidden">
          <!--          <div class="sider-top">-->
          <!--            <button class="collapse-btn rounded-br-full" @click="toggleCollapse" :title="collapsed ? '展开' : '折叠'">-->
          <!--              <MenuFoldOutlined />-->
          <!--            </button>-->
          <!--            <div class="lang" v-show="!effectiveCollapsed">-->
          <!--              <a-select-->
          <!--                  v-model:value="currentLocale"-->
          <!--                  @change="changeLanguage"-->
          <!--                  size="small"-->
          <!--              >-->
          <!--                <a-select-option value="zh">中文</a-select-option>-->
          <!--                <a-select-option value="en">English</a-select-option>-->
          <!--              </a-select>-->
          <!--            </div>-->
          <!--          </div>-->

          <div class="flex-shrink-0 sticky top-0 pt-4.5 !bg-inherit">
            <div class="flex items-center justify-between mb-4 ">
              <!-- 左侧：汉堡菜单（可选） -->
              <a-button type="text" shape="circle"  @click="toggleCollapse" >
                <template #icon>
                  <MenuFoldOutlined />
                </template>
              </a-button>

              <!-- 右侧：搜索按钮 -->
              <a-button type="text" shape="circle">
                <template #icon>
                  <search-outlined />
                </template>
              </a-button>
            </div>
            <!-- 新建聊天按钮 -->
            <div class="flex-shrink-0 mb-4">
              <a-button
                  type="text"
                  class="new-chat-btn"
                  @click="handleNewConversation"
                  block
              >
                <template #icon>
                  <EditTwoTone twoToneColor="rgba(0, 96, 107, 0.7)" />
                </template>
                <span class="ml-2">新会话</span>
              </a-button>
            </div>
          </div>



          <!-- per-page sidebar content -->
<!--          <router-view name="sider" v-show="!effectiveCollapsed" />-->

          <ChatSider v-show="!effectiveCollapsed" />

          <div class='sider-bottom' v-show="!effectiveCollapsed">

            <!-- 底部操作栏 -->
            <SidebarActionBar :avatar-url="user?.avatarUrl" :username="user?.nickname"/>
<!--            <div >-->
<!--              &lt;!&ndash; Left: User Profile &ndash;&gt;-->
<!--              <a-popover placement="topLeft" trigger="click" overlayClassName="user-profile-popover">-->
<!--                <template #content>-->
<!--                  <div class="w-64 p-1">-->
<!--                    <div class="flex items-center gap-3 mb-3 px-2 pt-2">-->
<!--                      <a-avatar :size="48" :src="user?.avatarUrl" class="bg-primary-500 text-lg">-->
<!--                        {{ user?.nickname || user?.externalId || 'U' }}-->
<!--                      </a-avatar>-->
<!--                      <div class="overflow-hidden">-->
<!--                        <div class="font-bold text-base truncate text-slate-800">{{ user?.nickname || 'User' }}</div>-->
<!--                        <div class="text-xs text-slate-500 truncate">{{ user?.externalId }}</div>-->
<!--                      </div>-->
<!--                    </div>-->
<!--                    <div class="px-2 pb-2">-->
<!--                      <div class="text-xs text-slate-400 mb-1">Role</div>-->
<!--                      <div class="text-sm text-slate-600">Senior Architect</div>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                </template>-->
<!--                <div class="flex items-center gap-3 cursor-pointer flex-1 min-w-0 hover:bg-black/5 p-2 rounded-lg transition-colors">-->
<!--                  <a-avatar :size="32" :src="user?.avatarUrl" class="flex-shrink-0 bg-primary-500">-->
<!--                    {{ user?.nickname?.[0] || user?.externalId?.[0] || 'U' }}-->
<!--                  </a-avatar>-->
<!--                  <div class="font-medium text-sm truncate text-slate-700 select-none">-->
<!--                    {{ user?.nickname || user?.externalId || 'User' }}-->
<!--                  </div>-->
<!--                </div>-->
<!--              </a-popover>-->

<!--              &lt;!&ndash; Right: Functions Menu &ndash;&gt;-->
<!--              <a-popover placement="topRight" trigger="click" overlayClassName="app-menu-popover">-->
<!--                <template #content>-->
<!--                  <div class="w-56 py-1">-->
<!--                    <div class="px-3 py-2 text-xs font-semibold text-slate-400">Application</div>-->
<!--                    <router-link to="/chat" class="menu-item">-->
<!--                      <MessageOutlined /> <span>{{ t('menu.chat') }}</span>-->
<!--                    </router-link>-->
<!--                    <router-link to="/dashboard" class="menu-item">-->
<!--                      <DashboardOutlined /> <span>{{ t('menu.dashboard') }}</span>-->
<!--                    </router-link>-->
<!--                    <router-link to="/tools" class="menu-item">-->
<!--                      <ToolOutlined /> <span>{{ t('menu.tools') }}</span>-->
<!--                    </router-link>-->
<!--                    <router-link to="/agents" class="menu-item">-->
<!--                      <RobotOutlined /> <span>{{ t('menu.agents') }}</span>-->
<!--                    </router-link>-->
<!--                    <router-link to="/workflows" class="menu-item">-->
<!--                      <ApartmentOutlined /> <span>{{ t('menu.workflows') }}</span>-->
<!--                    </router-link>-->
<!--                    <div class="my-1 border-t border-slate-100"></div>-->
<!--                    <div class="px-3 py-2 text-xs font-semibold text-slate-400">System</div>-->
<!--                    <router-link to="/config" class="menu-item">-->
<!--                      <SettingOutlined /> <span>{{ t('menu.config') }}</span>-->
<!--                    </router-link>-->
<!--                    <router-link to="/playground" class="menu-item">-->
<!--                      <ExperimentOutlined /> <span>{{ t('menu.playground') }}</span>-->
<!--                    </router-link>-->
<!--                    <div class="my-1 border-t border-slate-100"></div>-->
<!--                    <div class="menu-item text-red-500 hover:bg-red-50" @click="handleLogout">-->
<!--                      <LogoutOutlined /> <span>退出登录</span>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                </template>-->
<!--                <div class="p-2 rounded-lg hover:bg-black/5 cursor-pointer text-slate-500 transition-colors flex items-center justify-center">-->
<!--                  <AppstoreOutlined style="font-size: 18px;" />-->
<!--                </div>-->
<!--              </a-popover>-->
<!--            </div>-->
          </div>
        </div>
      </a-layout-sider>


      <!-- Collapsed floating mini bar (expand button + horizontal icons) -->
      <div v-if="effectiveCollapsed" class="sider-mini" aria-label="quick apps">
        <button class="collapse-btn mini" @click="toggleCollapse" :title="'展开'">
          <MenuUnfoldOutlined />
        </button>
        <div class="mini-icons">
          <a-tooltip :title="t('menu.chat')" placement="top">
            <router-link class="mini-icon" to="/chat"><MessageOutlined /></router-link>
          </a-tooltip>
          <a-tooltip :title="t('menu.dashboard')" placement="top">
            <router-link class="mini-icon" to="/dashboard"><DashboardOutlined /></router-link>
          </a-tooltip>
          <a-tooltip :title="t('menu.tools')" placement="top">
            <router-link class="mini-icon" to="/tools"><ToolOutlined /></router-link>
          </a-tooltip>
          <a-tooltip :title="t('menu.agents')" placement="top">
            <router-link class="mini-icon" to="/agents"><RobotOutlined /></router-link>
          </a-tooltip>
          <a-tooltip :title="t('menu.workflows')" placement="top">
            <router-link class="mini-icon" to="/workflows"><ApartmentOutlined /></router-link>
          </a-tooltip>
          <a-tooltip :title="t('menu.config')" placement="top">
            <router-link class="mini-icon" to="/config"><SettingOutlined /></router-link>
          </a-tooltip>
          <!--        <a-tooltip :title="t('menu.logs')" placement="top">-->
          <!--          <router-link class="mini-icon" to="/logs"><FileTextOutlined /></router-link>-->
          <!--        </a-tooltip>-->
          <a-tooltip :title="t('menu.playground')" placement="top">
            <router-link class="mini-icon" to="/playground"><ExperimentOutlined /></router-link>
          </a-tooltip>
        </div>
      </div>

      <a-layout class="bg-primary-0">
        <a-layout-content style="position: relative; overflow: auto; display: flex;">
          <router-view class="bg-white"/>
        </a-layout-content>
      </a-layout>
    </a-layout>

    <div v-else>
      <router-view />
    </div>
  </a-config-provider>

</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as v;

:deep(.ant-btn){
  span {
    svg {
      display: block !important;
    }
  }
}
.sider-top{display:grid;grid-auto-rows:min-content;gap:8px}
.collapse-btn{width:32px;height:32px;border:1px solid #e6eaf0;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;transition:background-color .2s ease}
.collapse-btn:hover{background:#f6f9ff}
.lang{padding:0 0 8px}
.sider-bottom{ background: inherit;display: flex; flex-direction: column; gap: 6px; transition: all .25s ease; position: sticky; bottom: 0; margin-top: auto;}

.nav-item{
  background: rgba(v.$primary-color-75, .35);
}
.nav-item:hover{ background: rgba(v.$primary-color-900, 0.08); }
.nav-item.router-link-active{ background: v.$primary-color-100!important; }

.nav-item__inner{ display:flex; align-items:center; gap: 10px; }
.icon-circle{
  width: 28px; height: 28px;
  border-radius: 999px;
  display:flex; align-items:center; justify-content:center;
}
.nav-label{ font-weight: 600; }


/* Floating mini bar when collapsed */
.sider-mini{position:fixed;left:8px;bottom:12px;z-index:20;display:flex;gap:8px;align-items:center;background:#fff;border:1px solid #eef2f7;border-radius:18px;padding:6px 8px;box-shadow:0 4px 20px rgba(0,0,0,.06);transition:transform .25s ease, opacity .25s ease}
.sider-mini .mini{width:28px;height:28px;border:1px solid #e6eaf0;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
.mini-icons{display:flex;gap:8px}
.mini-icon{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:transparent;border:0;color:#222;text-decoration:none;transition:background-color .2s ease}
.mini-icon:hover{background:#f5faff}
.mini-icon.router-link-active{background:#f0f7ff;color:#1677ff}

// 3. 新建聊天按钮样式 - 淡淡的透明背景
.new-chat-btn {
  height: 44px;
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


.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: #475569;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: #1e293b;
  }

  &.router-link-active {
    background-color: rgba($primary-color-500, 0.08);
    color: $primary-color-600;
  }
}

</style>
