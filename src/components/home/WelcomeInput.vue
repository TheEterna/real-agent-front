<template>
  <div class="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4">
    <!-- 欢迎标题 -->
    <div class="text-center mb-12 landing-title-animation">
      <h1 class="
        text-4xl md:text-5xl lg:text-6xl 
        font-bold text-slate-900 
        mb-4 tracking-tight
      ">
        {{ title }}
      </h1>
      <p class="text-lg text-slate-500 font-normal">
        {{ subtitle }}
      </p>
    </div>

    <!-- 模拟/真实聊天输入框 -->
    <div 
      class="
        w-full max-w-2xl 
        relative 
        group 
        landing-input-animation
      "
      :class="isAuthenticated ? 'cursor-text' : 'cursor-pointer'"
      @click="handleContainerClick"
    >
      <div class="
        w-full h-14 md:h-16 
        bg-white 
        rounded-3xl 
        border border-slate-200 
        shadow-[0_4px_20px_rgba(0,0,0,0.05)]
        flex items-center px-6 
        transition-all duration-300
        group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        group-hover:border-slate-300
        focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        focus-within:border-primary-500
      ">
        <!-- 真实输入框 (已登录) -->
        <input
          v-if="isAuthenticated"
          v-model="inputValue"
          type="text"
          class="
            w-full h-full 
            bg-transparent 
            border-none outline-none 
            text-lg text-slate-800 
            placeholder-slate-400
          "
          placeholder="Ask me anything..."
          @keydown.enter="handleEnter"
        />
        
        <!-- 模拟占位符 (未登录) -->
        <span v-else class="text-slate-400 text-lg w-full">
          Ask me anything...
        </span>
        
        <!-- 发送按钮图标 -->
        <div class="absolute right-4 top-1/2 -translate-y-1/2">
          <button 
            class="
              w-8 h-8 md:w-10 md:h-10 
              bg-slate-100 
              rounded-full 
              flex items-center justify-center
              text-slate-400
              transition-all duration-300
              hover:bg-slate-900 hover:text-white
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            :class="{ '!bg-slate-900 !text-white': inputValue.trim() }"
            :disabled="isAuthenticated && !inputValue.trim()"
            @click.stop="handleSend"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部功能标签 -->
    <div class="mt-8 flex flex-wrap justify-center gap-3 landing-tags-animation">
      <div v-for="(tag, index) in features" :key="index" class="
        px-4 py-2 
        bg-slate-50 
        rounded-full 
        text-sm text-slate-600 
        border border-slate-100
        cursor-pointer
        transition-colors hover:bg-slate-100
      " @click="handleTagClick(tag)">
        {{ tag }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'

const props = defineProps({
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '有什么可以帮忙的？'
  },
  subtitle: {
    type: String,
    default: 'Real Agent，你的私人 AI 助手'
  }
})

const emit = defineEmits(['click-input', 'send-message'])

const inputValue = ref('')
const features = ['🎨 创意写作', '💻 代码助手', '📊 数据分析', '🌍 多语言翻译', '🧠 逻辑推理']

const handleContainerClick = () => {
  if (!props.isAuthenticated) {
    emit('click-input')
  }
}

const handleEnter = () => {
  if (inputValue.value.trim()) {
    handleSend()
  }
}

const handleSend = () => {
  if (props.isAuthenticated) {
    if (inputValue.value.trim()) {
      emit('send-message', inputValue.value)
      inputValue.value = ''
    }
  } else {
    emit('click-input')
  }
}

const handleTagClick = (tag: string) => {
  if (props.isAuthenticated) {
    emit('send-message', tag)
  } else {
    emit('click-input')
  }
}

// 入场动画
onMounted(() => {
  const tl = gsap.timeline()
  
  tl.fromTo('.landing-title-animation', 
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
  )
  .fromTo('.landing-input-animation',
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.2)' },
    '-=0.4'
  )
  .fromTo('.landing-tags-animation > div',
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
    '-=0.2'
  )
})
</script>
