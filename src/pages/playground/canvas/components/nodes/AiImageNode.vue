<template>
  <div
    class="ai-image-node bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500/50': selected }"
    :style="{ width: selected ? '280px' : '260px' }"
  >
    <!-- 头部 -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-gradient-to-r from-pink-50 to-orange-50">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
          <Sparkles :size="12" class="text-white" />
        </div>
        <span class="text-xs font-medium text-zinc-700">{{ t('playgroundCanvas.aiImage.title') }}</span>
      </div>
      <div
        class="w-2 h-2 rounded-full"
        :class="statusDotClass"
      />
    </div>

    <!-- 内容区 -->
    <div class="p-3 space-y-3">
      <!-- 提示词输入 -->
      <div>
        <label class="block text-xs font-medium text-zinc-500 mb-1">{{ t('playgroundCanvas.aiImage.promptLabel') }}</label>
        <textarea
          v-model="localPrompt"
          class="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          rows="3"
          :placeholder="t('playgroundCanvas.aiImage.promptPlaceholder')"
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
        <Wand2 v-else :size="14" />
        <span class="hidden sm:inline">{{ generateButtonText }}</span>
        <span class="sm:hidden">{{ isGenerating ? '...' : t('playgroundCanvas.aiGenerate.generateBtn') }}</span>
      </button>

      <!-- 进度条 -->
      <div v-if="isGenerating" class="space-y-1">
        <div class="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-pink-500 to-orange-500 transition-all duration-300"
            :style="{ width: `${data.progress || 0}%` }"
          />
        </div>
        <p class="text-xs text-zinc-500 text-center">{{ data.progressMessage || t('playgroundCanvas.aiGenerate.processing') }}</p>
      </div>

      <!-- 结果展示 -->
      <div v-if="data.result?.url" class="relative rounded-lg overflow-hidden">
        <img
          :src="data.result.url"
          :alt="data.result.revisedPrompt || t('playgroundCanvas.aiImage.generatedAlt')"
          class="w-full h-auto"
        />
        <!-- 操作按钮 -->
        <div class="absolute top-2 right-2 flex gap-1">
          <button
            class="w-8 h-8 sm:w-7 sm:h-7 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors flex items-center justify-center active:scale-95"
            :aria-label="t('playgroundCanvas.aiImage.downloadImage')"
            @click="handleDownload"
          >
            <Download :size="14" class="text-white" />
          </button>
          <button
            class="w-8 h-8 sm:w-7 sm:h-7 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors flex items-center justify-center active:scale-95"
            :aria-label="t('playgroundCanvas.aiImage.fullPreview')"
            @click="handlePreview"
          >
            <Maximize2 :size="14" class="text-white" />
          </button>
        </div>
      </div>

      <!-- 修订后的提示词 -->
      <div v-if="data.result?.revisedPrompt" class="p-2 bg-zinc-50 rounded-lg">
        <p class="text-xs text-zinc-500">
          <span class="font-medium">{{ t('playgroundCanvas.aiImage.revisedPrompt') }}</span>
          {{ data.result.revisedPrompt }}
        </p>
      </div>

      <!-- 错误提示 -->
      <div v-if="data.error" class="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
        <p class="text-xs font-medium text-destructive mb-1">{{ t('playgroundCanvas.aiImage.errorTitle') }}</p>
        <p class="text-sm text-destructive/80">{{ data.error }}</p>
      </div>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-pink-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-pink-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import { Sparkles, Wand2, Loader2, Download, Maximize2 } from 'lucide-vue-next'
import type { AiImageNodeData } from '@/types/canvas'
import { AiGenerationStatus } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'
import { aiImageGenerate } from '@/composables/useCanvasAi'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: AiImageNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()

// 本地状态
const localPrompt = ref(props.data.prompt || '')
let abortController: AbortController | null = null

// 监听 data 变化
watch(() => props.data.prompt, (newPrompt) => {
  localPrompt.value = newPrompt || ''
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
  return 'bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 shadow-sm'
})

const generateButtonText = computed(() => {
  if (isGenerating.value) return t('playgroundCanvas.aiGenerate.generatingBtn')
  if (props.data.result) return t('playgroundCanvas.aiGenerate.regenerateBtn')
  return t('playgroundCanvas.aiImage.generateImage')
})

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
  abortController = aiImageGenerate(
    localPrompt.value,
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

function handleDownload() {
  if (props.data.result?.url) {
    const link = document.createElement('a')
    link.href = props.data.result.url
    link.download = `ai-image-${Date.now()}.png`
    link.click()
  }
}

function handlePreview() {
  if (props.data.result?.url) {
    window.open(props.data.result.url, '_blank')
  }
}
</script>

<style scoped>
.ai-image-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .ai-image-node {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .ai-image-node .border-b {
    border-color: rgba(255, 255, 255, 0.06);
  }

  // 头部渐变
  .ai-image-node .from-pink-50 {
    background: linear-gradient(to right, rgba(236, 72, 153, 0.12), rgba(249, 115, 22, 0.12));
  }

  .ai-image-node .text-zinc-700 {
    color: rgba(224, 231, 235, 0.9);
  }

  .ai-image-node .text-zinc-500 {
    color: rgba(161, 161, 170, 0.8);
  }

  // textarea
  .ai-image-node textarea {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(224, 231, 235, 0.9);

    &::placeholder {
      color: rgba(161, 161, 170, 0.5);
    }
  }

  // 禁用按钮/进度条底色
  .ai-image-node .bg-zinc-100 {
    background: rgba(255, 255, 255, 0.06);
  }

  // 修订提示词区
  .ai-image-node .bg-zinc-50 {
    background: rgba(255, 255, 255, 0.04);
  }

  // 错误区
  .ai-image-node .bg-red-50 {
    background: rgba(239, 68, 68, 0.1);
  }
}
</style>
