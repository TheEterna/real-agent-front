<template>
  <div
    class="video-node bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500/50': selected }"
    style="width: 320px"
  >
    <!-- 头部 -->
    <div class="video-node-header flex items-center justify-between px-3 py-2 border-b border-border/60">
      <div class="flex items-center gap-2">
        <VideoIcon :size="14" class="text-purple-500" />
        <span class="video-node-title text-xs font-medium text-zinc-500">{{ t('playgroundCanvas.video.title') }}</span>
      </div>
      <span v-if="data.duration" class="video-node-duration text-xs text-zinc-400">
        {{ formatDuration(data.duration) }}
      </span>
    </div>

    <!-- 视频区域 -->
    <div class="relative bg-zinc-900">
      <!-- 有视频 -->
      <template v-if="data.url">
        <video
          ref="videoRef"
          :src="data.url"
          class="w-full h-auto"
          style="max-height: 200px"
          :poster="data.thumbnailUrl"
          preload="metadata"
          @loadedmetadata="handleLoadedMetadata"
        />
        <!-- 播放控制覆盖层 -->
        <div
          class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          @click="togglePlay"
        >
          <div class="video-play-btn w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Pause v-if="isPlaying" :size="20" class="text-zinc-700" />
            <Play v-else :size="20" class="text-zinc-700 ml-0.5" />
          </div>
        </div>
      </template>

      <!-- 无视频 - 上传区域 -->
      <template v-else>
        <div
          class="flex flex-col items-center justify-center py-10 px-4 cursor-pointer hover:bg-zinc-800 transition-colors bg-zinc-900"
          @click="handleUploadClick"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
            <Upload :size="20" class="text-purple-400" />
          </div>
          <p class="text-sm text-zinc-300 mb-1">{{ t('playgroundCanvas.video.uploadVideo') }}</p>
          <p class="text-xs text-zinc-500">{{ t('playgroundCanvas.video.uploadHint') }}</p>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="video/*"
          class="hidden"
          @change="handleFileChange"
        />
      </template>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-purple-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-purple-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import { Video as VideoIcon, Upload, Play, Pause } from 'lucide-vue-next'
import type { VideoNodeData } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: VideoNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)

// 格式化时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 切换播放
function togglePlay() {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
    isPlaying.value = false
  } else {
    videoRef.value.play()
    isPlaying.value = true
  }
}

// 视频元数据加载完成
function handleLoadedMetadata() {
  if (videoRef.value) {
    store.updateNodeData(props.id, {
      duration: videoRef.value.duration,
      width: videoRef.value.videoWidth,
      height: videoRef.value.videoHeight
    })
  }
}

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
  if (file && file.type.startsWith('video/')) {
    processFile(file)
  }
}

// 处理文件
function processFile(file: File) {
  const url = URL.createObjectURL(file)
  store.updateNodeData(props.id, { url })
  store.pushHistory()
}
</script>

<style scoped>
.video-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .video-node {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .video-node-header {
    border-color: rgba(255, 255, 255, 0.06);
  }

  .video-node-title {
    color: rgba(161, 161, 170, 0.8);
  }

  .video-node-duration {
    color: rgba(113, 113, 122, 0.8);
  }

  .video-play-btn {
    background: rgba(39, 39, 42, 0.9);

    .text-zinc-700 {
      color: rgba(224, 231, 235, 0.9);
    }
  }
}
</style>
