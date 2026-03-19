<template>
  <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
    <div class="text-center px-4">
      <!-- 404 图标 -->
      <div class="mb-8 error-animation">
        <div class="text-9xl font-bold bg-linear-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
          404
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          页面未找到
        </h1>
        <p class="text-lg text-slate-600 max-w-md mx-auto">
          抱歉，您访问的页面不存在或已被移除。
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a-button 
          type="primary" 
          size="large"
          class="
            bg-slate-900 hover:bg-slate-800 
            text-white font-medium 
            rounded-lg px-8 h-12
            border-none
          "
          @click="goHome"
        >
          返回首页
        </a-button>
        
        <a-button 
          size="large"
          class="
            bg-white hover:bg-slate-50
            text-slate-700 font-medium 
            rounded-lg px-8 h-12
            border border-slate-200
          "
          @click="goBack"
        >
          返回上一页
        </a-button>
      </div>

      <!-- 装饰性元素 -->
      <div class="mt-12 text-slate-400">
        <svg class="w-48 h-48 mx-auto opacity-20" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M45.3,-76.2C58.9,-69.4,70.5,-57.6,77.8,-43.3C85.1,-29,88.1,-12.2,86.8,4.3C85.5,20.8,79.9,37,70.4,49.8C60.9,62.6,47.5,71.9,33.1,76.8C18.7,81.7,3.3,82.2,-12.3,80.4C-27.9,78.6,-43.7,74.5,-56.8,65.8C-69.9,57.1,-80.3,43.8,-85.4,28.4C-90.5,13,-90.3,-4.5,-84.8,-19.7C-79.3,-34.9,-68.5,-47.8,-55.3,-55C-42.1,-62.2,-26.5,-63.7,-11.8,-64.5C2.9,-65.3,31.7,-83,45.3,-76.2Z" transform="translate(100 100)" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const goHome = () => {
  // 如果已登录，跳转到 /chat，否则跳转到首页
  if (authStore.isAuthenticated) {
    router.push('/chat')
  } else {
    router.push('/')
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.error-animation {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Ant Design 按钮样式覆盖
:deep(.ant-btn-primary) {
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
    transform: translateY(-1px);
  }
}

:deep(.ant-btn) {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
