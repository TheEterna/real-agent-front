<template>
  <div
    class="palette-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab hover:bg-muted active:scale-[0.98] transition-all group"
    draggable="true"
    @dragstart="handleDragStart"
  >
    <!-- 图标 -->
    <div
      class="palette-item-icon w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0"
      :class="iconBgClass"
    >
      <component :is="iconComponent" :size="16" :class="iconClass" />
    </div>

    <!-- 文字 -->
    <div class="flex-1 min-w-0">
      <div class="palette-item-label text-sm font-medium text-foreground/80 group-hover:text-foreground">
        {{ t(`playgroundCanvas.paletteItem.${typeToLocaleKey[item.type]}.label`) }}
      </div>
      <div class="palette-item-desc text-xs text-muted-foreground truncate">
        {{ t(`playgroundCanvas.paletteItem.${typeToLocaleKey[item.type]}.description`) }}
      </div>
    </div>

    <!-- 拖拽提示 -->
    <GripVertical :size="14" class="text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Type,
  StickyNote,
  Group,
  Image,
  Video,
  Music,
  MessageSquare,
  Sparkles,
  Clapperboard,
  AudioLines,
  GripVertical
} from 'lucide-vue-next'
import type { NodePaletteItem } from '@/types/canvas'
import { CanvasNodeType } from '@/types/canvas'

const { t } = useI18n()

// CanvasNodeType 枚举值到 locale key 的映射
const typeToLocaleKey: Record<CanvasNodeType, string> = {
  [CanvasNodeType.TEXT]: 'text',
  [CanvasNodeType.STICKY]: 'sticky',
  [CanvasNodeType.IMAGE]: 'image',
  [CanvasNodeType.VIDEO]: 'video',
  [CanvasNodeType.AUDIO]: 'audio',
  [CanvasNodeType.GROUP]: 'group',
  [CanvasNodeType.AI_CHAT]: 'aiChat',
  [CanvasNodeType.AI_IMAGE]: 'aiImage',
  [CanvasNodeType.AI_VIDEO]: 'aiVideo',
  [CanvasNodeType.AI_AUDIO]: 'aiAudio',
}

// Props
const props = defineProps<{
  item: NodePaletteItem
}>()

// Emits
const emit = defineEmits<{
  'drag-start': [type: CanvasNodeType]
}>()

// 图标映射
const iconMap: Record<string, typeof Type> = {
  Type,
  StickyNote,
  Group,
  Image,
  Video,
  Music,
  MessageSquare,
  Sparkles,
  Clapperboard,
  AudioLines
}

// 图标组件
const iconComponent = computed(() => iconMap[props.item.icon] || Type)

// 图标背景样式
const iconBgClass = computed(() => {
  switch (props.item.category) {
    case 'basic':
      return 'bg-muted group-hover:bg-muted/80'
    case 'media':
      return 'bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-950/40 dark:group-hover:bg-blue-900/40'
    case 'ai':
      return 'bg-purple-50 group-hover:bg-purple-100 dark:bg-purple-950/40 dark:group-hover:bg-purple-900/40'
    default:
      return 'bg-muted'
  }
})

// 图标颜色样式
const iconClass = computed(() => {
  switch (props.item.category) {
    case 'basic':
      return 'text-muted-foreground'
    case 'media':
      return 'text-blue-600 dark:text-blue-400'
    case 'ai':
      return 'text-purple-600 dark:text-purple-400'
    default:
      return 'text-muted-foreground'
  }
})

// 处理拖拽开始
function handleDragStart(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', props.item.type)
  }
  emit('drag-start', props.item.type)
}
</script>
