<template>
  <div
    class="image-node bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500/50': selected }"
    :style="{ width: nodeWidth + 'px' }"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border/60">
      <div class="flex items-center gap-2">
        <ImageIcon :size="14" class="text-blue-500" />
        <span class="text-xs font-medium text-zinc-500">{{ t('playgroundCanvas.image.title') }}</span>
      </div>
      <button
        v-if="data.url"
        class="p-1 text-zinc-400 hover:text-zinc-600 rounded-md transition-colors active:scale-95"
        :aria-label="t('playgroundCanvas.image.fullPreview')"
        @click="handlePreview"
      >
        <Maximize2 :size="12" />
      </button>
    </div>

    <!-- 图像区域 -->
    <div class="relative">
      <!-- 有图像 -->
      <template v-if="data.url">
        <img
          :src="data.url"
          :alt="data.alt || t('playgroundCanvas.image.defaultAlt')"
          class="w-full h-auto object-cover"
          :style="{ maxHeight: '300px' }"
          @error="handleImageError"
        />
      </template>

      <!-- 无图像 - 上传区域 -->
      <template v-else>
        <div
          class="flex flex-col items-center justify-center py-8 px-4 cursor-pointer hover:bg-zinc-50 transition-colors"
          @click="handleUploadClick"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <Upload :size="20" class="text-blue-500" />
          </div>
          <p class="text-sm text-zinc-600 mb-1">{{ t('playgroundCanvas.image.uploadImage') }}</p>
          <p class="text-xs text-zinc-400">{{ t('playgroundCanvas.image.uploadHint') }}</p>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
      </template>
    </div>

    <!-- 图像信息 -->
    <div v-if="data.url && (data.width || data.height)" class="px-3 py-2 border-t border-border/60 bg-zinc-50">
      <p class="text-xs text-zinc-500">
        {{ data.width }} × {{ data.height }}
      </p>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-blue-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-blue-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import { Image as ImageIcon, Upload, Maximize2 } from 'lucide-vue-next'
import type { ImageNodeData } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: ImageNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)

// 计算节点宽度
const nodeWidth = computed(() => {
  if (props.data.width && props.data.width < 300) {
    return Math.max(props.data.width, 200)
  }
  return 280
})

// 点击上传
function handleUploadClick() {
  fileInputRef.value?.click()
}

// 文件选择
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

// 拖拽上传
function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

// 处理文件
function processFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const url = e.target?.result as string

    // 获取图像尺寸
    const img = new Image()
    img.onload = () => {
      store.updateNodeData(props.id, {
        url,
        thumbnailUrl: url,
        width: img.width,
        height: img.height
      })
      store.pushHistory()
    }
    img.src = url
  }
  reader.readAsDataURL(file)
}

// 图像加载错误
function handleImageError() {
  console.warn('图像加载失败:', props.data.url)
}

// 预览图像
function handlePreview() {
  if (props.data.url) {
    window.open(props.data.url, '_blank')
  }
}
</script>

<style scoped>
.image-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .image-node {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .image-node .border-b,
  .image-node .border-t {
    border-color: rgba(255, 255, 255, 0.06);
  }

  .image-node .text-zinc-400 {
    color: rgba(161, 161, 170, 0.7);
  }

  .image-node .text-zinc-500 {
    color: rgba(161, 161, 170, 0.8);
  }

  .image-node .text-zinc-600 {
    color: rgba(161, 161, 170, 0.9);
  }

  .image-node .bg-zinc-50 {
    background: rgba(255, 255, 255, 0.04);
  }

  .image-node .bg-blue-50 {
    background: rgba(59, 130, 246, 0.15);
  }

  .image-node .hover\:bg-zinc-50:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}
</style>
