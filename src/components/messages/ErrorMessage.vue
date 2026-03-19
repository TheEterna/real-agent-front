
<script setup lang="ts">
import { ref, computed} from 'vue'
import { notification } from 'ant-design-vue'
import type { UIMessage } from '@/types/events'

// Props 定义
interface Props {
  message: UIMessage
}

// Emits 定义
interface Emits {
  copied: [success: boolean]
}

const props = withDefaults(defineProps<Props>(), {
})

const emit = defineEmits<Emits>()

// 状态管理
const isCopying = ref(false)
const copySuccess = ref(false)


// 计算属性 - 错误描述
const errorMessage = computed(() => {
  // 提取消息的核心描述部分，去除Markdown标记和表情符号
  let description = props.message.message
  description = description.replace(/^#+\s*/gm, '') // 移除标题标记
  description = description.replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
  description = description.replace(/^[🚨❌⚠️💥🔥]+\s*/, '') // 移除表情符号开头

  // 取第一行或第一段作为描述，保持简洁
  const firstLine = description.split('\n')[0]
  return firstLine.trim()
})


// 处理复制
const handleCopy = async () => {
  isCopying.value = true

  try {
    const errorText = `${errorMessage.value}`
    await navigator.clipboard.writeText(errorText)

    copySuccess.value = true
    emit('copied', true)


    // 2秒后重置复制状态
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)

  } catch (error) {
    emit('copied', false)
    notification.error({
      message: '复制失败',
      duration: 2
    })
  } finally {
    isCopying.value = false
  }
}

</script>
<template>
  <div
    ref="containerRef"
    class="group relative bg-red-50 rounded-xl py-3.5 pl-5 pr-15 text-red-800"
  >
    <!-- 复制按钮 - 右上角，hover时显示 -->
    <button
      @click="handleCopy"
      :disabled="isCopying"
      class="absolute top-3 right-3 opacity-0 transition-all duration-200 ease-in-out
             flex items-center gap-1.5 px-2 py-1 text-xs
             border border-red-300 rounded-md bg-white text-red-700
             hover:text-white hover:-translate-y-0.5
             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
      <span>{{ isCopying ? '复制中...' : copySuccess ? '已复制' : '复制' }}</span>
    </button>

    <!-- 错误内容 -->
    <div>
      <div class="text-sm leading-relaxed text-red-800 break-words">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>
<style scoped>
.group:hover>button {
  opacity: 1!important;
}
</style>
