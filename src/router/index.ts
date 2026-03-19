import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useTextConfigStore } from '@/stores/textConfigStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/pages/login/LoginNew.vue'),
    meta: { standalone: true, requiresAuth: false }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/pages/onboarding/Index.vue'),
    meta: { standalone: true, requiresAuth: true }
  },
  {
    path: '/chat/:sessionId?',
    name: 'Chat',
    components: {
      default: () => import('@/pages/chat/ChatGateway.vue'),
      sider: () => import('@/pages/chat/ChatSider.vue')
    },
    meta: { requiresAuth: true }
  },
  { path: '/tools', component: () => import('@/pages/tools/Index.vue'), meta: { requiresAuth: true } },
  { path: '/workflows', component: () => import('@/pages/workflows/Index.vue'), meta: { requiresAuth: true } },
  // TODO: 考虑使用 children 嵌套路由共享 playground 布局
  { path: '/playground', name: 'Playground', component: () => import('@/pages/playground/Playground.vue'), meta: { requiresAuth: true } },
  { path: '/playground/role-play-agent', component: () => import('@/pages/playground/role-play-agent/RoleSelect.vue'), meta: { requiresAuth: true } },
  { path: '/playground/role-play-agent/:roleId', component: () => import('@/pages/playground/role-play-agent/Index.vue'), meta: { requiresAuth: true } },
  { path: '/playground/academic-research', component: () => import('@/pages/playground/academic-research/Index.vue'), meta: { requiresAuth: true } },
  { path: '/playground/mind-map', component: () => import('@/pages/playground/mind-map/Index.vue'), meta: { requiresAuth: true } },
  { path: '/playground/thesis-writer', name: 'ThesisWriter', component: () => import('@/pages/playground/thesis-writer/Index.vue'), meta: { requiresAuth: true } },
  { path: '/knowledge', name: 'KnowledgeBase', component: () => import('@/pages/knowledgeBase/KnowledgeBasePage.vue'), meta: { requiresAuth: true } },
  { path: '/knowledge/drive', name: 'Drive', component: () => import('@/pages/knowledgeBase/DrivePage.vue'), meta: { requiresAuth: true } },
  { path: '/knowledge/retrieve', name: 'KnowledgeRetrieve', component: () => import('@/pages/knowledgeBase/KnowledgeRetrieve.vue'), meta: { requiresAuth: true } },
  { path: '/knowledge/document', name: 'KnowledgeDocument', component: () => import('@/pages/knowledgeBase/KnowledgeDocument.vue'), meta: { requiresAuth: true } },
  { path: '/playground/tools', name: 'ToolsHub', component: () => import('@/pages/playground/tools/ToolsPage.vue'), meta: { requiresAuth: true } },
  { path: '/playground/skills', name: 'SkillsHub', component: () => import('@/pages/playground/skills/SkillsPage.vue'), meta: { requiresAuth: true } },
  // 聊天助手 - 人性化陪伴功能
  { path: '/playground/chat', name: 'ChatAssistant', component: () => import('@/pages/playground/chat/ChatAssistant.vue'), meta: { requiresAuth: true } },
  // 基础模型测试 - 主入口 + 子页面
  { path: '/playground/basic/chat/:sessionId?', name: 'BasicChat', component: () => import('@/pages/playground/basic/ChatPage.vue'), meta: { requiresAuth: true } },
  { path: '/playground/basic/image', name: 'BasicImage', component: () => import('@/pages/playground/basic/ImagePage.vue'), meta: { requiresAuth: true } },
  { path: '/playground/basic/video', name: 'BasicVideo', component: () => import('@/pages/playground/basic/VideoPage.vue'), meta: { requiresAuth: true } },
  { path: '/playground/basic/speech', name: 'BasicSpeech', component: () => import('@/pages/playground/basic/SpeechPage.vue'), meta: { requiresAuth: true } },
  // Chat Analyzer - 对话分析/AI情感顾问
  { path: '/playground/chat-analyzer', name: 'ChatAnalyzer', component: () => import('@/pages/playground/chat-analyzer/Index.vue'), meta: { requiresAuth: true } },
  // VOLO Canvas - 无限画布 AI 创作平台
  { path: '/playground/canvas', name: 'VOLOCanvas', component: () => import('@/pages/playground/canvas/Index.vue'), meta: { requiresAuth: true } },
  // 个人资料页面 - 使用主布局（带侧边栏）
  { path: '/profile', name: 'Profile', component: () => import('@/pages/profile/ProfilePage.vue'), meta: { requiresAuth: true } },
    // Feed 社区
  { path: "/feed", name: "Feed", component: () => import("@/pages/feed/Index.vue"), meta: { hideHeader: true, requiresAuth: true } },
  { path: "/feed/create", name: "CreatePost", component: () => import("@/pages/feed/CreatePost.vue"), meta: { hideHeader: true, requiresAuth: true } },
  { path: "/feed/:postId", name: "PostDetail", component: () => import("@/pages/feed/PostDetail.vue"), meta: { hideHeader: true, requiresAuth: true } },
  { path: "/feed/profile/:type/:id", name: "FeedProfile", component: () => import("@/pages/feed/ProfilePage.vue"), meta: { hideHeader: true, requiresAuth: true } },
  // 数字分身 - 列表页
  { path: '/avatar', name: 'AvatarList', component: () => import('@/pages/avatar/AvatarList.vue'), meta: { requiresAuth: true } },
  // 数字分身 - 分身主页
  { path: '/avatar/:avatarId', name: 'AvatarProfile', component: () => import('@/pages/avatar/AvatarProfile.vue'), meta: { requiresAuth: true } },
  // 分身聊天
  { path: '/avatar/:avatarId/chat/:conversationId?', name: 'AvatarChat', component: () => import('@/pages/chat/AvatarChat/Index.vue'), meta: { requiresAuth: true } },
  // 记忆相册
  { path: '/memory-album', name: 'MemoryAlbum', component: () => import('@/pages/memoryAlbum/Index.vue'), meta: { hideHeader: true, requiresAuth: true } },
// 404 Not Found - 必须放在最后
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/pages/NotFound.vue'), meta: { standalone: true, requiresAuth: false } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局路由守卫 - 鉴权检查 + 动态文案获取
let authInitialized = false

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 首次导航：同步迁移 + 异步验证（绝不阻塞导航）
  // init() 的同步部分（legacy migration）在事件循环内立即执行，
  // 异步部分（fetchCurrentUser / refreshUserProfile）在后台运行。
  // 若后台验证发现 token 失效 → clearAuth() → App.vue watch 捕获并重定向。
  if (!authInitialized) {
    authInitialized = true
    authStore.init()
  }

  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  // init() 可能已清除无效 token，重新读取认证状态
  const hasToken = authStore.isAuthenticated
  const onboardingDone = authStore.isOnboardingCompleted

  if (requiresAuth && !hasToken) {
    // 需要认证但没有token，跳转到首页(Landing)
    next({ path: '/', query: { redirect: to.fullPath } })
  } else if (to.path === '/' && hasToken) {
    // 已登录用户访问首页，根据 onboarding 状态决定跳转
    next({ path: onboardingDone ? '/chat' : '/onboarding' })
  } else if (to.name === 'Onboarding' && hasToken && onboardingDone) {
    // 已完成 onboarding，不允许重新进入
    next({ path: '/chat' })
  } else if (requiresAuth && hasToken && to.name !== 'Onboarding' && !onboardingDone) {
    // 未完成 onboarding，强制引导到 onboarding
    next({ path: '/onboarding' })
  } else {
    // 获取动态文案（仅对需要认证的页面，且有路由名称）
    if (to.meta.requiresAuth !== false && to.name) {
      const textConfigStore = useTextConfigStore()
      // 异步获取，不阻塞路由跳转
      textConfigStore.fetchAndMerge(String(to.name).toLowerCase())
    }
    next()
  }
})

export default router

