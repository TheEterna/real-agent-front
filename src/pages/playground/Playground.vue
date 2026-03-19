<template>
  <div class="mx-auto px-20 py-12 bg-white overflow-auto">
    <!-- 页面头部 -->
    <div class="mb-12">
      <h1 class="text-3xl font-bold text-slate-800 mb-2">探索 Playground</h1>
      <p class="text-base text-slate-600 mb-6">探索并组合各类数据与智能体的有趣应用，轻松验证你的创意</p>
      
      <!-- 搜索框 -->
      <div class="mb-5">
        <a-input
          placeholder="搜索 Playground 应用..."
          size="large"
          class="!w-150 !border-primary-100 !rounded-xl"
        >
          <template #prefix>
            <search-outlined class="text-lg text-teal-600/60" />
          </template>
        </a-input>
      </div>

      <!-- 筛选标签 -->
      <div class="flex gap-2.5 flex-wrap">
        <span 
          class="inline-block px-4 py-1.5 rounded-full text-sm cursor-pointer border border-teal-200/50 bg-white text-slate-700 hover:border-teal-400/80 hover:bg-teal-50/50 transition-all duration-200"
          :class="{'!bg-teal-100/80 !border-teal-500/60 !text-teal-900 !font-medium': true}"
        >
          最热门
        </span>
        <span class="inline-block px-4 py-1.5 rounded-full text-sm cursor-pointer border border-teal-200/50 bg-white text-slate-700 hover:border-teal-400/80 hover:bg-teal-50/50 transition-all duration-200">
          写作
        </span>
        <span class="inline-block px-4 py-1.5 rounded-full text-sm cursor-pointer border border-teal-200/50 bg-white text-slate-700 hover:border-teal-400/80 hover:bg-teal-50/50 transition-all duration-200">
          工作效率
        </span>
        <span class="inline-block px-4 py-1.5 rounded-full text-sm cursor-pointer border border-teal-200/50 bg-white text-slate-700 hover:border-teal-400/80 hover:bg-teal-50/50 transition-all duration-200">
          研究
        </span>
        <span class="inline-block px-4 py-1.5 rounded-full text-sm cursor-pointer border border-teal-200/50 bg-white text-slate-700 hover:border-teal-400/80 hover:bg-teal-50/50 transition-all duration-200">
          数据分析
        </span>
        <span class="inline-block px-4 py-1.5 rounded-full text-sm cursor-pointer border border-teal-200/50 bg-white text-slate-700 hover:border-teal-400/80 hover:bg-teal-50/50 transition-all duration-200">
          编程
        </span>
      </div>
    </div>

    <!-- Featured 精选区域 -->
    <section class="mb-14">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-1">精选</h2>
        <p class="text-sm text-slate-500">本周精选推荐</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        <div 
          v-for="app in featuredApps" 
          :key="app.id"
          class="bg-white border border-teal-200/40 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(109,184,172,0.12)] hover:border-teal-400/60"
          @click="navigateToApp(app)"
        >
          <div class="w-16 h-16 mb-4 rounded-xl overflow-hidden">
            <img :src="app.icon" :alt="app.name" class="w-full h-full object-cover" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-800 mb-1">{{ app.name }}</h3>
            <p class="text-[13px] text-slate-500 mb-3">{{ app.creator }}</p>
            <p class="text-sm text-slate-700 leading-relaxed line-clamp-2">
              {{ app.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trending 热门区域 -->
    <section class="mb-14">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800 mb-1">热门</h2>
        <p class="text-sm text-slate-500">社区最受欢迎的应用</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
        <div 
          v-for="app in trendingApps" 
          :key="app.id"
          class="flex gap-4 bg-white border border-teal-200/40 rounded-xl p-5 cursor-pointer transition-all hover:bg-teal-50/30 hover:border-teal-400/60 hover:shadow-[0_4px_12px_rgba(109,184,172,0.08)]"
          @click="navigateToApp(app)"
        >
          <div class="w-12 h-12 shrink-0 rounded-[10px] overflow-hidden">
            <img :src="app.icon" :alt="app.name" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-slate-800 mb-1.5">{{ app.name }}</h3>
            <p class="text-sm text-slate-700 leading-normal mb-2 line-clamp-2">
              {{ app.description }}
            </p>
            <p class="text-[13px] text-slate-500">{{ app.creator }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SearchOutlined } from '@ant-design/icons-vue'

const router = useRouter()

// 应用数据类型(简化版本)
interface App {
  id: string
  name: string
  description: string
  icon: string
  creator: string
  route?: string
}

// 精选应用数据
const featuredApps = ref<App[]>([
  {
    id: 'video-ai',
    name: 'Video AI by Invideo',
    description: '使用 AI 轻松创建专业水准的视频内容，自动生成脚本和配音',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%23000"/><path d="M24 20 L24 44 L44 32 Z" fill="%23fff"/></svg>',
    creator: 'invideo.io'
  },
  {
    id: 'expedia',
    name: 'Expedia',
    description: '智能旅行规划助手，帮你快速找到最佳航班、酒店和旅游路线',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%23FFEC00"/><circle cx="32" cy="24" r="8" fill="%231a1a1a"/><path d="M20 36 Q32 44 44 36" stroke="%231a1a1a" stroke-width="4" fill="none"/></svg>',
    creator: 'expedia.com'
  },
  {
    id: 'canva',
    name: 'Canva',
    description: '轻松设计任何内容 - 演示文稿、Logo、社交媒体帖子等等',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect rx="16" width="64" height="64" fill="%2300C4CC"/><path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="%23fff"/></svg>',
    creator: 'community builder'
  }
])

// 热门应用数据
const trendingApps = ref<App[]>([
  {
    id: 'scholar-gpt',
    name: 'Scholar GPT',
    description: '学术研究助手，帮你查找200M+学术资源、分析文献、提供深度研究支持',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%239333EA"/><path d="M14 20 L24 14 L34 20 V28 L24 34 L14 28 Z" stroke="%23fff" stroke-width="2" fill="none"/></svg>',
    creator: 'scholarai.io'
  },
  {
    id: 'fitness-coach',
    name: '健身教练 & 饮食顾问',
    description: '个性化健身计划和营养建议，帮你达成健康目标',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%23EA4335"/><circle cx="24" cy="18" r="6" fill="%23fff"/><path d="M12 36 Q24 28 36 36" stroke="%23fff" stroke-width="3" fill="none"/></svg>',
    creator: 'Nourish Coach'
  },
  {
    id: 'consensus',
    name: 'Consensus',
    description: '基于AI的研究助手，快速找到并理解科学研究文献中的共识观点',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%2334A853"/><circle cx="18" cy="24" r="4" fill="%23fff"/><circle cx="30" cy="24" r="4" fill="%23fff"/></svg>',
    creator: 'consensus.app'
  },
  {
    id: 'data-lab',
    name: 'Data Lab',
    description: '数据实验室：用最小代价验证数据与可视化的想法',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%231677ff"/><circle cx="16" cy="28" r="3" fill="%23fff"/><circle cx="24" cy="20" r="3" fill="%23fff"/><circle cx="32" cy="30" r="3" fill="%23fff"/><path d="M16 28 L24 20 L32 30" stroke="%23fff" stroke-width="2" fill="none"/></svg>',
    route: '/playground/data-lab',
    creator: 'Real Agent'
  },
  {
    id: 'logo-creator',
    name: 'Logo Creator',
    description: '快速生成专业级Logo设计，支持自定义风格和配色',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%23000"/><text x="24" y="32" font-size="24" font-weight="bold" text-anchor="middle" fill="%23fff">L</text></svg>',
    creator: 'Design Studio'
  },
  {
    id: 'role-play',
    name: 'Role Play Agent',
    description: '角色扮演智能体（文本/语音），沉浸式对话体验',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect rx="12" width="48" height="48" fill="%23ff7a45"/><circle cx="24" cy="18" r="6" fill="%23fff"/><path d="M12 36 Q24 28 36 36" stroke="%23fff" stroke-width="2" fill="none"/></svg>',
    route: '/playground/role-play-agent',
    creator: 'Real Agent'
  }
])

// 导航到应用
const navigateToApp = (app: App) => {
  if (app.route) {
    router.push(app.route)
  } else {
    console.log('Navigate to:', app.name)
  }
}
</script>

<style scoped>

</style>
