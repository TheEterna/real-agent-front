<template>
  <div
    class="ai-video-node bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500/50': selected }"
    :style="{ width: selected ? '280px' : '260px' }"
  >
    <!-- 头部 -->
    <div class="ai-video-header flex items-center justify-between px-3 py-2 border-b border-border/60 bg-gradient-to-r from-violet-50 to-cyan-50">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
          <Clapperboard :size="12" class="text-white" />
        </div>
        <span class="ai-video-title text-xs font-medium text-zinc-700">{{ t('playgroundCanvas.aiVideo.title') }}</span>
      </div>
      <div
        class="w-2 h-2 rounded-full"
        :class="statusDotClass"
      />
    </div>

    <!-- 内容区 -->
    <div class="p-3 space-y-3">
      <!-- 输入素材提示 -->
      <div class="ai-video-input-hint p-2 bg-zinc-50 rounded-lg">
        <div class="flex items-center gap-2 text-xs text-zinc-500">
          <Link :size="12" />
          <span>{{ t('playgroundCanvas.aiVideo.connectHint') }}</span>
        </div>
        <div v-if="connectedImages.length > 0" class="mt-2 flex gap-1">
          <div
            v-for="(img, index) in connectedImages"
            :key="index"
            class="ai-video-thumb w-10 h-10 rounded-md bg-zinc-200 overflow-hidden"
          >
            <img :src="img" :alt="t('playgroundCanvas.aiVideo.connectedAlt')" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <!-- 提示词输入 -->
      <div>
        <label class="ai-video-label block text-xs font-medium text-zinc-500 mb-1">{{ t('playgroundCanvas.aiVideo.promptLabel') }}</label>
        <textarea
          v-model="localPrompt"
          class="ai-video-textarea w-full px-3 py-2 text-sm border border-border bg-white text-zinc-900 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          rows="2"
          :placeholder="t('playgroundCanvas.aiVideo.promptPlaceholder')"
          :disabled="isGenerating"
          @blur="handlePromptBlur"
        />
      </div>

      <!-- 生成按钮 -->
      <button
        class="w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
        :class="generateButtonClass"
        :disabled="!canGenerate"
        @click="handleGenerate"
      >
        <Loader2 v-if="isGenerating" :size="14" class="animate-spin" />
        <Film v-else :size="14" />
        <span class="hidden sm:inline">{{ generateButtonText }}</span>
        <span class="sm:hidden">{{ isGenerating ? '...' : t('playgroundCanvas.aiGenerate.generateBtn') }}</span>
      </button>

      <!-- 进度条 -->
      <div v-if="isGenerating" class="space-y-1">
        <div class="ai-video-progress-track h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300"
            :style="{ width: `${data.progress || 0}%` }"
          />
        </div>
        <p class="ai-video-progress-msg text-xs text-zinc-500 text-center">{{ data.progressMessage || t('playgroundCanvas.aiGenerate.processing') }}</p>
      </div>

      <!-- 结果展示 -->
      <div v-if="data.result?.url" class="relative rounded-lg overflow-hidden bg-zinc-900">
        <video
          ref="videoRef"
          :src="data.result.url"
          :poster="data.result.thumbnailUrl"
          class="w-full h-auto"
          style="max-height: 180px"
          preload="metadata"
        />
        <!-- 播放控制覆盖层 -->
        <div
          class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          @click="togglePlay"
        >
          <div class="ai-video-play-btn w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Pause v-if="isPlaying" :size="16" class="text-zinc-700" />
            <Play v-else :size="16" class="text-zinc-700 ml-0.5" />
          </div>
        </div>
        <!-- 时长标签 -->
        <div v-if="data.result.duration" class="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white">
          {{ formatDuration(data.result.duration) }}
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="data.error" class="ai-video-error p-3 bg-destructive/5 rounded-lg border border-destructive/20">
        <p class="text-xs font-medium text-destructive mb-1">{{ t('playgroundCanvas.aiVideo.errorTitle') }}</p>
        <p class="text-sm text-destructive/80">{{ data.error }}</p>
      </div>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-violet-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-violet-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import { Clapperboard, Film, Loader2, Link, Play, Pause } from 'lucide-vue-next'
import type { AiVideoNodeData } from '@/types/canvas'
import { AiGenerationStatus } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'
import { aiVideoGenerate } from '@/composables/useCanvasAi'
import { storeToRefs } from 'pinia'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: AiVideoNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()
const { edges, nodes } = storeToRefs(store)

// 本地状态
const localPrompt = ref(props.data.prompt || '')
const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
let abortController: AbortController | null = null

// 监听 data 变化
watch(() => props.data.prompt, (newPrompt) => {
  localPrompt.value = newPrompt || ''
})

// 获取连接的图像节点
const connectedImages = computed(() => {
  const incomingEdges = edges.value.filter(e => e.target === props.id)
  const images: string[] = []

  for (const edge of incomingEdges) {
    const sourceNode = nodes.value.find(n => n.id === edge.source)
    if (sourceNode && sourceNode.type === 'image' && sourceNode.data) {
      const imageData = sourceNode.data as { url?: string }
      if (imageData.url) {
        images.push(imageData.url)
      }
    }
  }

  return images
})

// 计算属性
const isGenerating = computed(() => props.data.status === AiGenerationStatus.GENERATING)

const canGenerate = computed(() => {
  return localPrompt.value.trim().length > 0 && !isGenerating.value
})

const statusDotClass = computed(() => {
  switch (props.data.status) {
    case AiGenerationStatus.GENERATING:
      return 'bg-amber-400 animate-pulse'
    case AiGenerationStatus.SUCCESS:
      return 'bg-green-400'
    case AiGenerationStatus.ERROR:
      return 'bg-red-400'
    default:
      return 'bg-zinc-300'
  }
})

const generateButtonClass = computed(() => {
  if (isGenerating.value) {
    return 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
  }
  if (!canGenerate.value) {
    return 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
  }
  return 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:from-violet-600 hover:to-cyan-600 shadow-sm'
})

const generateButtonText = computed(() => {
  if (isGenerating.value) return t('playgroundCanvas.aiGenerate.generatingBtn')
  if (props.data.result) return t('playgroundCanvas.aiGenerate.regenerateBtn')
  return t('playgroundCanvas.aiVideo.generateVideo')
})

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

// 事件处理
function handlePromptBlur() {
  if (localPrompt.value !== props.data.prompt) {
    store.updateNodeData(props.id, { prompt: localPrompt.value })
  }
}

function handleGenerate() {
  if (!canGenerate.value) return

  // 取消之前的生成
  if (abortController) {
    abortController.abort()
  }

  // 更新状态为生成中
  store.updateNodeData(props.id, {
    status: AiGenerationStatus.GENERATING,
    progress: 0,
    progressMessage: t('playgroundCanvas.aiGenerate.preparing'),
    result: undefined,
    error: undefined
  })

  // 开始生成
  abortController = aiVideoGenerate(
    localPrompt.value,
    connectedImages.value,
    // 进度回调
    (progress, message) => {
      store.updateNodeData(props.id, {
        progress,
        progressMessage: message
      })
    },
    // 完成回调
    (result) => {
      store.updateNodeData(props.id, {
        status: AiGenerationStatus.SUCCESS,
        progress: 100,
        progressMessage: t('playgroundCanvas.aiGenerate.done'),
        result
      })
      store.pushHistory()
    },
    // 错误回调
    (error) => {
      store.updateNodeData(props.id, {
        status: AiGenerationStatus.ERROR,
        error: error.message
      })
    }
  )
}
</script>

<style scoped>
.ai-video-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .ai-video-node {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .ai-video-header {
    border-color: rgba(255, 255, 255, 0.06);
    background: linear-gradient(to right, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.12));
  }

  .ai-video-title {
    color: rgba(224, 231, 235, 0.9);
  }

  .ai-video-input-hint {
    background: rgba(255, 255, 255, 0.04);

    .text-zinc-500 {
      color: rgba(161, 161, 170, 0.8);
    }
  }

  .ai-video-thumb {
    background: rgba(255, 255, 255, 0.08);
  }

  .ai-video-label {
    color: rgba(161, 161, 170, 0.8);
  }

  .ai-video-textarea {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(224, 231, 235, 0.9);
  }

  .ai-video-progress-track {
    background: rgba(255, 255, 255, 0.06);
  }

  .ai-video-progress-msg {
    color: rgba(161, 161, 170, 0.8);
  }

  .ai-video-play-btn {
    background: rgba(39, 39, 42, 0.9);

    .text-zinc-700 {
      color: rgba(224, 231, 235, 0.9);
    }
  }

  .ai-video-error {
    background: rgba(239, 68, 68, 0.1);
  }
}
</style>
