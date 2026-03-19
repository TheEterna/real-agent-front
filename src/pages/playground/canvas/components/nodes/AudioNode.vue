<template>
  <div
    class="audio-node bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500/50': selected }"
    style="width: 280px"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border/60">
      <div class="flex items-center gap-2">
        <Music :size="14" class="text-emerald-500" />
        <span class="text-xs font-medium text-zinc-500">{{ t('playgroundCanvas.audio.title') }}</span>
      </div>
      <span v-if="data.duration" class="text-xs text-zinc-400">
        {{ formatDuration(data.duration) }}
      </span>
    </div>

    <!-- 音频区域 -->
    <div class="p-3">
      <!-- 有音频 -->
      <template v-if="data.url">
        <audio ref="audioRef" :src="data.url" class="hidden" @loadedmetadata="handleLoadedMetadata" @ended="handleEnded" />

        <!-- 播放控制 -->
        <div class="flex items-center gap-3">
          <button
            class="w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95"
            :class="isPlaying ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'"
            :aria-label="isPlaying ? t('playgroundCanvas.playControl.pause') : t('playgroundCanvas.playControl.play')"
            @click="togglePlay"
          >
            <Pause v-if="isPlaying" :size="18" />
            <Play v-else :size="18" class="ml-0.5" />
          </button>

          <!-- 进度条 -->
          <div class="flex-1">
            <div class="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-emerald-500 transition-all duration-100"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-xs text-zinc-400">{{ formatDuration(currentTime) }}</span>
              <span class="text-xs text-zinc-400">{{ formatDuration(data.duration || 0) }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 无音频 - 上传区域 -->
      <template v-else>
        <div
          class="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-zinc-50 rounded-lg transition-colors"
          @click="handleUploadClick"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
            <Upload :size="18" class="text-emerald-500" />
          </div>
          <p class="text-sm text-zinc-600">{{ t('playgroundCanvas.audio.uploadAudio') }}</p>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="audio/*"
          class="hidden"
          @change="handleFileChange"
        />
      </template>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-emerald-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-emerald-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import { Music, Upload, Play, Pause } from 'lucide-vue-next'
import type { AudioNodeData } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: AudioNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const progress = ref(0)

let animationFrame: number | null = null

// 格式化时长
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 更新进度
function updateProgress() {
  if (audioRef.value && isPlaying.value) {
    currentTime.value = audioRef.value.currentTime
    progress.value = (audioRef.value.currentTime / (props.data.duration || 1)) * 100
    animationFrame = requestAnimationFrame(updateProgress)
  }
}

// 切换播放
function togglePlay() {
  if (!audioRef.value) return

  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  } else {
    audioRef.value.play()
    isPlaying.value = true
    updateProgress()
  }
}

// 播放结束
function handleEnded() {
  isPlaying.value = false
  currentTime.value = 0
  progress.value = 0
}

// 音频元数据加载完成
function handleLoadedMetadata() {
  if (audioRef.value) {
    store.updateNodeData(props.id, {
      duration: audioRef.value.duration
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
  if (file && file.type.startsWith('audio/')) {
    processFile(file)
  }
}

// 处理文件
function processFile(file: File) {
  const url = URL.createObjectURL(file)
  store.updateNodeData(props.id, { url })
  store.pushHistory()
}

// 清理
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped>
.audio-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .audio-node {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .audio-node .border-b {
    border-color: rgba(255, 255, 255, 0.06);
  }

  .audio-node .text-zinc-400 {
    color: rgba(161, 161, 170, 0.7);
  }

  .audio-node .text-zinc-500 {
    color: rgba(161, 161, 170, 0.8);
  }

  .audio-node .text-zinc-600 {
    color: rgba(161, 161, 170, 0.9);
  }

  .audio-node .bg-zinc-200 {
    background: rgba(255, 255, 255, 0.1);
  }

  .audio-node .bg-emerald-50 {
    background: rgba(16, 185, 129, 0.15);
  }

  .audio-node .bg-emerald-100 {
    background: rgba(16, 185, 129, 0.2);
  }

  .audio-node .text-emerald-600 {
    color: rgba(52, 211, 153, 0.9);
  }

  .audio-node .hover\:bg-emerald-200:hover {
    background: rgba(16, 185, 129, 0.3);
  }

  .audio-node .hover\:bg-zinc-50:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}
</style>
