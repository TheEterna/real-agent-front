<template>
  <div
    class="ai-audio-node bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500/50': selected }"
    :style="{ width: selected ? '260px' : '240px' }"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-gradient-to-r from-emerald-50 to-teal-50">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <AudioLines :size="12" class="text-white" />
        </div>
        <span class="text-xs font-medium text-zinc-700">{{ t('playgroundCanvas.aiAudio.title') }}</span>
      </div>
      <div
        class="w-2 h-2 rounded-full"
        :class="statusDotClass"
      />
    </div>

    <!-- 内容区 -->
    <div class="p-3 space-y-3">
      <!-- 类型选择 -->
      <div>
        <label class="block text-xs font-medium text-zinc-500 mb-1.5">{{ t('playgroundCanvas.aiAudio.labelGenerateType') }}</label>
        <div class="flex gap-1">
          <button
            v-for="option in typeOptions"
            :key="option.value"
            class="flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors"
            :class="localType === option.value
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'"
            @click="handleTypeChange(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 提示词输入 -->
      <div>
        <label class="block text-xs font-medium text-zinc-500 mb-1">
          {{ promptLabel }}
        </label>
        <textarea
          v-model="localPrompt"
          class="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          :rows="localType === 'tts' ? 3 : 2"
          :placeholder="promptPlaceholder"
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
        <component :is="generateIcon" v-else :size="14" />
        <span class="hidden sm:inline">{{ generateButtonText }}</span>
        <span class="sm:hidden">{{ isGenerating ? '...' : t('playgroundCanvas.aiGenerate.generateBtn') }}</span>
      </button>

      <!-- 进度条 -->
      <div v-if="isGenerating" class="space-y-1">
        <div class="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
            :style="{ width: `${data.progress || 0}%` }"
          />
        </div>
        <p class="text-xs text-zinc-500 text-center">{{ data.progressMessage || t('playgroundCanvas.aiGenerate.processing') }}</p>
      </div>

      <!-- 结果展示 - 音频播放器 -->
      <div v-if="data.result?.url" class="p-3 bg-zinc-50 rounded-lg">
        <audio ref="audioRef" :src="data.result.url" class="hidden" @ended="handleEnded" />

        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors active:scale-95"
            :class="isPlaying ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'"
            :aria-label="isPlaying ? t('playgroundCanvas.playControl.pause') : t('playgroundCanvas.playControl.play')"
            @click="togglePlay"
          >
            <Pause v-if="isPlaying" :size="18" />
            <Play v-else :size="18" class="ml-0.5" />
          </button>

          <div class="flex-1">
            <div class="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-emerald-500 transition-all duration-100"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-xs text-zinc-400">{{ formatDuration(currentTime) }}</span>
              <span class="text-xs text-zinc-400">{{ formatDuration(data.result.duration || 0) }}</span>
            </div>
          </div>

          <!-- 下载按钮 -->
          <button
            class="w-11 h-11 sm:w-9 sm:h-9 p-2 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors active:scale-95 flex items-center justify-center"
            :aria-label="t('playgroundCanvas.aiAudio.downloadAudio')"
            @click="handleDownload"
          >
            <Download :size="16" />
          </button>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="data.error" class="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
        <p class="text-xs font-medium text-destructive mb-1">{{ t('playgroundCanvas.aiAudio.errorTitle') }}</p>
        <p class="text-sm text-destructive/80">{{ data.error }}</p>
      </div>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-emerald-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-emerald-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import { AudioLines, Loader2, Play, Pause, Download, Mic, Music, Zap } from 'lucide-vue-next'
import type { AiAudioNodeData } from '@/types/canvas'
import { AiGenerationStatus } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'
import { aiAudioGenerate } from '@/composables/useCanvasAi'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: AiAudioNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()

// 类型选项
const typeOptions = computed(() => [
  { value: 'tts' as const, label: t('playgroundCanvas.aiAudio.typeTts') },
  { value: 'music' as const, label: t('playgroundCanvas.aiAudio.typeMusic') },
  { value: 'sfx' as const, label: t('playgroundCanvas.aiAudio.typeSfx') },
])

// 本地状态
const localPrompt = ref(props.data.prompt || '')
const localType = ref<'tts' | 'music' | 'sfx'>(props.data.type || 'tts')
const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const progress = ref(0)
let abortController: AbortController | null = null
let animationFrame: number | null = null

// 监听 data 变化
watch(() => props.data.prompt, (newPrompt) => {
  localPrompt.value = newPrompt || ''
})

watch(() => props.data.type, (newType) => {
  localType.value = newType || 'tts'
})

// 计算属性
const isGenerating = computed(() => props.data.status === AiGenerationStatus.GENERATING)

const canGenerate = computed(() => {
  return localPrompt.value.trim().length > 0 && !isGenerating.value
})

const promptLabel = computed(() => {
  switch (localType.value) {
    case 'tts':
      return t('playgroundCanvas.aiAudio.labelTts')
    case 'music':
      return t('playgroundCanvas.aiAudio.labelMusic')
    case 'sfx':
      return t('playgroundCanvas.aiAudio.labelSfx')
    default:
      return t('playgroundCanvas.aiAudio.labelDefault')
  }
})

const promptPlaceholder = computed(() => {
  switch (localType.value) {
    case 'tts':
      return t('playgroundCanvas.aiAudio.placeholderTts')
    case 'music':
      return t('playgroundCanvas.aiAudio.placeholderMusic')
    case 'sfx':
      return t('playgroundCanvas.aiAudio.placeholderSfx')
    default:
      return t('playgroundCanvas.aiAudio.placeholderDefault')
  }
})

const generateIcon = computed(() => {
  switch (localType.value) {
    case 'tts':
      return Mic
    case 'music':
      return Music
    case 'sfx':
      return Zap
    default:
      return AudioLines
  }
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
  return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm'
})

const generateButtonText = computed(() => {
  if (isGenerating.value) return t('playgroundCanvas.aiGenerate.generatingBtn')
  if (props.data.result) return t('playgroundCanvas.aiGenerate.regenerateBtn')
  return t('playgroundCanvas.aiAudio.generateAudio')
})

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
    progress.value = (audioRef.value.currentTime / (props.data.result?.duration || 1)) * 100
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

// 事件处理
function handleTypeChange(type: 'tts' | 'music' | 'sfx') {
  localType.value = type
  store.updateNodeData(props.id, { type })
}

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
  abortController = aiAudioGenerate(
    localPrompt.value,
    localType.value,
    // 进度回调
    (progressVal, message) => {
      store.updateNodeData(props.id, {
        progress: progressVal,
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

function handleDownload() {
  if (props.data.result?.url) {
    const link = document.createElement('a')
    link.href = props.data.result.url
    link.download = `ai-audio-${Date.now()}.mp3`
    link.click()
  }
}

// 清理
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped>
.ai-audio-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .ai-audio-node {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .ai-audio-node .border-b {
    border-color: rgba(255, 255, 255, 0.06);
  }

  // 头部渐变
  .ai-audio-node .from-emerald-50 {
    background: linear-gradient(to right, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.12));
  }

  .ai-audio-node .text-zinc-700 {
    color: rgba(224, 231, 235, 0.9);
  }

  .ai-audio-node .text-zinc-500 {
    color: rgba(161, 161, 170, 0.8);
  }

  .ai-audio-node .text-zinc-400 {
    color: rgba(161, 161, 170, 0.7);
  }

  .ai-audio-node .text-zinc-600 {
    color: rgba(161, 161, 170, 0.9);
  }

  // textarea
  .ai-audio-node textarea {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(224, 231, 235, 0.9);

    &::placeholder {
      color: rgba(161, 161, 170, 0.5);
    }
  }

  // 类型选择按钮
  .ai-audio-node .bg-zinc-100 {
    background: rgba(255, 255, 255, 0.06);
  }

  .ai-audio-node .text-zinc-600.hover\:bg-zinc-200:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .ai-audio-node .bg-emerald-100 {
    background: rgba(16, 185, 129, 0.2);
  }

  .ai-audio-node .text-emerald-700 {
    color: rgba(52, 211, 153, 0.9);
  }

  .ai-audio-node .text-emerald-600 {
    color: rgba(52, 211, 153, 0.9);
  }

  .ai-audio-node .hover\:bg-emerald-200:hover {
    background: rgba(16, 185, 129, 0.3);
  }

  // 进度条底色
  .ai-audio-node .bg-zinc-200 {
    background: rgba(255, 255, 255, 0.1);
  }

  // 结果播放器区
  .ai-audio-node .bg-zinc-50 {
    background: rgba(255, 255, 255, 0.04);
  }

  // 错误区
  .ai-audio-node .bg-red-50 {
    background: rgba(239, 68, 68, 0.1);
  }
}
</style>
