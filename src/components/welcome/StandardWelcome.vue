<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { RobotOutlined } from '@ant-design/icons-vue'

const emit = defineEmits(['suggestion-click'])

const containerRef = ref<HTMLElement>()
const iconRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

onMounted(() => {
  const tl = gsap.timeline()

  if (iconRef.value) {
    tl.fromTo(iconRef.value,
      { opacity: 0, scale: 0.5, rotate: -20 },
      { opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.5)" }
    )
  }
  
  if (contentRef.value) {
    tl.fromTo(contentRef.value,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    )
  }
})
</script>

<template>
  <div ref="containerRef" class="h-full w-full flex flex-col items-center justify-center p-8 select-none opacity-80">
    <div ref="iconRef" class="mb-6 p-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
      <RobotOutlined class="text-5xl" />
    </div>
    
    <div ref="contentRef" class="text-center max-w-md">
      <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3">
        AI Agent
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        开始一个新的对话，探索 AI 的无限可能。
      </p>
    </div>
  </div>
</template>
