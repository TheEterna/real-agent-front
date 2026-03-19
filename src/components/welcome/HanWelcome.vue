<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { 
  ThunderboltOutlined, 
  CodeOutlined, 
  ReadOutlined, 
  BulbOutlined 
} from '@ant-design/icons-vue'

const emit = defineEmits(['suggestion-click'])

const suggestions = [
  {
    icon: ThunderboltOutlined,
    title: '快速分析',
    desc: '帮我分析这个项目的代码结构',
    prompt: '请帮我分析当前项目的代码结构，并生成一份简要的架构报告。'
  },
  {
    icon: CodeOutlined,
    title: '代码生成',
    desc: '写一个 Vue 3 的组合式函数',
    prompt: '请帮我写一个 Vue 3 的组合式函数 (Composable)，用于处理本地存储 (localStorage) 的响应式读写。'
  },
  {
    icon: ReadOutlined,
    title: '文档解读',
    desc: '解释这段 Java 代码的含义',
    prompt: '请解释一下这段 Java 代码的具体含义和执行流程，并指出可能存在的性能问题。'
  },
  {
    icon: BulbOutlined,
    title: '创意构思',
    desc: '为我的新应用想一个名字',
    prompt: '我正在开发一个基于 AI 的个人知识库应用，请帮我想 5 个有创意、好记且富有科技感的名字。'
  }
]

const containerRef = ref<HTMLElement>()
const titleRef = ref<HTMLElement>()
const descRef = ref<HTMLElement>()
const cardsRef = ref<HTMLElement[]>([])

// 主题色常量
const THEME_PRIMARY = '#5a8482'
const THEME_SECONDARY = '#009aa7'
const THEME_PRIMARY_RGBA = 'rgba(90, 132, 130, 0.6)'
const THEME_PRIMARY_LIGHT = 'rgba(90, 132, 130, 0.3)'
const THEME_PRIMARY_LIGHTER = 'rgba(90, 132, 130, 0.15)'
const THEME_PRIMARY_ICON_BG = 'rgba(90, 132, 130, 0.08)'
const THEME_PRIMARY_ICON_BG_HOVER = 'rgba(90, 132, 130, 0.15)'
const THEME_PRIMARY_ICON_COLOR = 'rgba(90, 132, 130, 0.6)'

onMounted(() => {
  const tl = gsap.timeline()


  
  if (titleRef.value) {
    tl.fromTo(titleRef.value,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )
  }
  
  if (descRef.value) {
    tl.fromTo(descRef.value,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    )
  }

  // 建议卡片动画
  tl.fromTo('.suggestion-card',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
    "-=0.2"
  )
})

const handleCardClick = (prompt: string) => {
  emit('suggestion-click', prompt)
}

const handleCardMouseEnter = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement
  if (card) {
    card.style.borderColor = THEME_PRIMARY_RGBA
  }
}

const handleCardMouseLeave = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement
  if (card) {
    card.style.borderColor = THEME_PRIMARY_LIGHT
  }
}

const handleIconMouseEnter = (event: MouseEvent) => {
  const icon = event.currentTarget as HTMLElement
  if (icon) {
    icon.style.backgroundColor = THEME_PRIMARY_ICON_BG_HOVER
    icon.style.color = THEME_PRIMARY
  }
}

const handleIconMouseLeave = (event: MouseEvent) => {
  const icon = event.currentTarget as HTMLElement
  if (icon) {
    icon.style.backgroundColor = THEME_PRIMARY_ICON_BG
    icon.style.color = THEME_PRIMARY_ICON_COLOR
  }
}

const handleTitleMouseEnter = (event: MouseEvent) => {
  const title = event.currentTarget as HTMLElement
  if (title) {
    title.style.color = THEME_SECONDARY
  }
}

const handleTitleMouseLeave = (event: MouseEvent) => {
  const title = event.currentTarget as HTMLElement
  if (title) {
    title.style.color = THEME_PRIMARY
  }
}
</script>

<template>
  <div ref="containerRef" class="h-full w-full flex flex-col items-center justify-center p-8 select-none">
  

    <!-- Title Area -->
    <h1 ref="titleRef" class="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3 tracking-tight">
      你好，我是 <span class="bg-clip-text text-transparent" style="background: linear-gradient(90deg, #5a8482 0%, #009aa7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent">Han</span>
    </h1>
    <p ref="descRef" class="text-gray-500 dark:text-gray-400 text-lg mb-12 max-w-lg text-center leading-relaxed">
      基于 ReAct+ 架构的智能助手，具备深度推理与工具调用能力，随时准备为您解决复杂问题。
    </p>

    <!-- Suggestions Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
      <div 
        v-for="(item, index) in suggestions" 
        :key="index"
        class="suggestion-card group p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer flex items-start gap-4"
        :style="{borderColor: THEME_PRIMARY_LIGHT}"
        @mouseenter="handleCardMouseEnter"
        @mouseleave="handleCardMouseLeave"
        @click="handleCardClick(item.prompt)"
      >
        <div 
          class="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 transition-colors duration-300"
          :style="{backgroundColor: THEME_PRIMARY_ICON_BG, color: THEME_PRIMARY_ICON_COLOR}"
          @mouseenter="handleIconMouseEnter"
          @mouseleave="handleIconMouseLeave"
        >
          <component :is="item.icon" class="text-xl" />
        </div>
        <div class="flex-1">
          <h3 
            class="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-colors"
            :style="{color: THEME_PRIMARY}"
            @mouseenter="handleTitleMouseEnter"
            @mouseleave="handleTitleMouseLeave"
          >
            {{ item.title }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.suggestion-card {
  backdrop-filter: blur(10px);
}
</style>
