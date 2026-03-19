<template>
  <div class="h-full flex flex-col">
    <!-- 标题 -->
    <div class="px-4 py-3 border-b border-border flex items-center justify-between">
      <div>
        <h2 class="text-sm font-semibold text-foreground">{{ t('playgroundCanvas.property.title') }}</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ selectedNodes.length === 1 ? t('playgroundCanvas.property.editNode') : t('playgroundCanvas.property.selectedCount', { count: selectedNodes.length }) }}
        </p>
      </div>
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors active:scale-95"
              :aria-label="t('playgroundCanvas.property.deleteNode')"
              @click="handleDelete"
            >
              <Trash2 :size="16" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" :side-offset="6">{{ t('playgroundCanvas.property.deleteNode') }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- 属性编辑区 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 单节点编辑 -->
      <template v-if="selectedNodes.length === 1">
        <div class="space-y-4">
          <!-- 节点类型 -->
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelType') }}</label>
            <div class="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <component :is="nodeTypeIcon" :size="16" class="text-muted-foreground" />
              <span class="text-sm text-foreground">{{ nodeTypeLabel }}</span>
            </div>
          </div>

          <!-- 位置 -->
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelPosition') }}</label>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <span class="text-xs text-muted-foreground/60 font-mono">X</span>
                <span class="text-sm text-foreground font-mono">{{ Math.round(currentNode.position.x) }}</span>
              </div>
              <div class="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <span class="text-xs text-muted-foreground/60 font-mono">Y</span>
                <span class="text-sm text-foreground font-mono">{{ Math.round(currentNode.position.y) }}</span>
              </div>
            </div>
          </div>

          <!-- 文本节点属性 -->
          <template v-if="currentNode.type === CanvasNodeType.TEXT">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelContent') }}</label>
              <textarea
                :value="(currentNode.data as TextNodeData).content"
                class="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                rows="6"
                :placeholder="t('playgroundCanvas.property.textPlaceholder')"
                @input="handleTextChange"
              />
            </div>
          </template>

          <!-- 便签节点属性 -->
          <template v-if="currentNode.type === CanvasNodeType.STICKY">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelContent') }}</label>
              <textarea
                :value="(currentNode.data as StickyNodeData).content"
                class="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                rows="4"
                :placeholder="t('playgroundCanvas.property.stickyPlaceholder')"
                @input="handleStickyContentChange"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelColor') }}</label>
              <div class="flex gap-2">
                <button
                  v-for="color in stickyColors"
                  :key="color.value"
                  class="w-9 h-9 rounded-lg border-2 transition-all active:scale-95"
                  :class="[
                    color.bg,
                    (currentNode.data as StickyNodeData).color === color.value
                      ? 'border-foreground/30 scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  ]"
                  :aria-label="color.label"
                  @click="handleStickyColorChange(color.value)"
                />
              </div>
            </div>
          </template>

          <!-- AI 图像节点属性 -->
          <template v-if="currentNode.type === CanvasNodeType.AI_IMAGE">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelPrompt') }}</label>
              <textarea
                :value="(currentNode.data as AiImageNodeData).prompt"
                class="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                rows="4"
                :placeholder="t('playgroundCanvas.property.aiImagePlaceholder')"
                @input="handleAiPromptChange"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelStatus') }}</label>
              <div class="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="statusColorClass"
                />
                <span class="text-sm text-foreground">{{ statusLabel }}</span>
              </div>
            </div>
          </template>

          <!-- AI 视频节点属性 -->
          <template v-if="currentNode.type === CanvasNodeType.AI_VIDEO">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelPrompt') }}</label>
              <textarea
                :value="(currentNode.data as AiVideoNodeData).prompt"
                class="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                rows="4"
                :placeholder="t('playgroundCanvas.property.aiVideoPlaceholder')"
                @input="handleAiPromptChange"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelInputMaterial') }}</label>
              <p class="text-xs text-muted-foreground">
                {{ t('playgroundCanvas.property.inputMaterialHint') }}
              </p>
            </div>
          </template>

          <!-- AI 对话节点属性 -->
          <template v-if="currentNode.type === CanvasNodeType.AI_CHAT">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1.5">{{ t('playgroundCanvas.property.labelPrompt') }}</label>
              <textarea
                :value="(currentNode.data as AiChatNodeData).prompt"
                class="w-full px-3 py-2 text-sm text-foreground bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                rows="4"
                :placeholder="t('playgroundCanvas.property.aiChatPlaceholder')"
                @input="handleAiPromptChange"
              />
            </div>
          </template>
        </div>
      </template>

      <!-- 多节点选中 -->
      <template v-else>
        <div class="text-center py-8">
          <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
            <Layers :size="24" class="text-muted-foreground" />
          </div>
          <p class="text-base text-foreground/80">{{ t('playgroundCanvas.property.multiSelectTitle', { count: selectedNodes.length }) }}</p>
          <p class="text-xs text-muted-foreground mt-1">{{ t('playgroundCanvas.property.multiSelectHint') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Trash2,
  Layers,
  Type,
  StickyNote,
  Image,
  Video,
  Music,
  MessageSquare,
  Sparkles,
  Clapperboard,
  AudioLines,
  Group
} from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type { CanvasNode, TextNodeData, StickyNodeData, AiImageNodeData, AiVideoNodeData, AiChatNodeData } from '@/types/canvas'
import { CanvasNodeType, StickyColor, AiGenerationStatus } from '@/types/canvas'

const { t } = useI18n()

// Props
const props = defineProps<{
  selectedNodes: CanvasNode[]
}>()

// Emits
const emit = defineEmits<{
  'update-node': [nodeId: string, data: Partial<CanvasNode['data']>]
  'delete-node': [nodeId: string]
}>()

// 当前节点
const currentNode = computed(() => props.selectedNodes[0])

// 节点类型图标映射
const nodeTypeIconMap: Record<CanvasNodeType, typeof Type> = {
  [CanvasNodeType.TEXT]: Type,
  [CanvasNodeType.STICKY]: StickyNote,
  [CanvasNodeType.IMAGE]: Image,
  [CanvasNodeType.VIDEO]: Video,
  [CanvasNodeType.AUDIO]: Music,
  [CanvasNodeType.GROUP]: Group,
  [CanvasNodeType.AI_CHAT]: MessageSquare,
  [CanvasNodeType.AI_IMAGE]: Sparkles,
  [CanvasNodeType.AI_VIDEO]: Clapperboard,
  [CanvasNodeType.AI_AUDIO]: AudioLines
}

// 节点类型标签映射
const nodeTypeLabelMap = computed<Record<CanvasNodeType, string>>(() => ({
  [CanvasNodeType.TEXT]: t('playgroundCanvas.nodeType.text'),
  [CanvasNodeType.STICKY]: t('playgroundCanvas.nodeType.sticky'),
  [CanvasNodeType.IMAGE]: t('playgroundCanvas.nodeType.image'),
  [CanvasNodeType.VIDEO]: t('playgroundCanvas.nodeType.video'),
  [CanvasNodeType.AUDIO]: t('playgroundCanvas.nodeType.audio'),
  [CanvasNodeType.GROUP]: t('playgroundCanvas.nodeType.group'),
  [CanvasNodeType.AI_CHAT]: t('playgroundCanvas.nodeType.aiChat'),
  [CanvasNodeType.AI_IMAGE]: t('playgroundCanvas.nodeType.aiImage'),
  [CanvasNodeType.AI_VIDEO]: t('playgroundCanvas.nodeType.aiVideo'),
  [CanvasNodeType.AI_AUDIO]: t('playgroundCanvas.nodeType.aiAudio'),
}))

// 便签颜色选项
const stickyColors = computed(() => [
  { value: StickyColor.YELLOW, label: t('playgroundCanvas.stickyColor.yellow'), bg: 'bg-yellow-200' },
  { value: StickyColor.PINK, label: t('playgroundCanvas.stickyColor.pink'), bg: 'bg-pink-200' },
  { value: StickyColor.BLUE, label: t('playgroundCanvas.stickyColor.blue'), bg: 'bg-blue-200' },
  { value: StickyColor.GREEN, label: t('playgroundCanvas.stickyColor.green'), bg: 'bg-green-200' },
  { value: StickyColor.PURPLE, label: t('playgroundCanvas.stickyColor.purple'), bg: 'bg-purple-200' },
  { value: StickyColor.ORANGE, label: t('playgroundCanvas.stickyColor.orange'), bg: 'bg-orange-200' },
])

// 计算属性
const nodeTypeIcon = computed(() => {
  if (!currentNode.value) return Type
  return nodeTypeIconMap[currentNode.value.type] || Type
})

const nodeTypeLabel = computed(() => {
  if (!currentNode.value) return ''
  return nodeTypeLabelMap.value[currentNode.value.type] || t('playgroundCanvas.property.unknownNode')
})

// AI 节点状态
const statusColorClass = computed(() => {
  if (!currentNode.value) return 'bg-zinc-400'
  const data = currentNode.value.data as AiImageNodeData | AiVideoNodeData | AiChatNodeData
  if (!('status' in data)) return 'bg-zinc-400'

  switch (data.status) {
    case AiGenerationStatus.IDLE:
      return 'bg-zinc-400'
    case AiGenerationStatus.GENERATING:
      return 'bg-amber-400 animate-pulse'
    case AiGenerationStatus.SUCCESS:
      return 'bg-green-400'
    case AiGenerationStatus.ERROR:
      return 'bg-red-400'
    default:
      return 'bg-zinc-400'
  }
})

const statusLabel = computed(() => {
  if (!currentNode.value) return ''
  const data = currentNode.value.data as AiImageNodeData | AiVideoNodeData | AiChatNodeData
  if (!('status' in data)) return ''

  switch (data.status) {
    case AiGenerationStatus.IDLE:
      return t('playgroundCanvas.aiStatus.idle')
    case AiGenerationStatus.GENERATING:
      return t('playgroundCanvas.aiStatus.generating')
    case AiGenerationStatus.SUCCESS:
      return t('playgroundCanvas.aiStatus.success')
    case AiGenerationStatus.ERROR:
      return t('playgroundCanvas.aiStatus.error')
    default:
      return ''
  }
})

// 事件处理
function handleDelete() {
  props.selectedNodes.forEach(node => {
    emit('delete-node', node.id)
  })
}

function handleTextChange(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update-node', currentNode.value.id, { content: target.value })
}

function handleStickyContentChange(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update-node', currentNode.value.id, { content: target.value })
}

function handleStickyColorChange(color: StickyColor) {
  emit('update-node', currentNode.value.id, { color })
}

function handleAiPromptChange(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update-node', currentNode.value.id, { prompt: target.value })
}
</script>
