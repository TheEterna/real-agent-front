<template>
  <div class="h-full flex flex-col">
    <!-- 标题 -->
    <div class="px-4 py-3 border-b border-border">
      <h2 class="text-sm font-semibold text-foreground">{{ t('playgroundCanvas.palette.title') }}</h2>
      <p class="text-xs text-muted-foreground mt-0.5">{{ t('playgroundCanvas.palette.description') }}</p>
    </div>

    <!-- 节点列表 -->
    <div class="flex-1 overflow-y-auto p-3 space-y-4">
      <!-- 基础节点 -->
      <div>
        <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {{ t('playgroundCanvas.palette.categoryBasic') }}
        </h3>
        <div class="space-y-1">
          <NodePaletteItem
            v-for="item in basicNodes"
            :key="item.type"
            :item="item"
            @drag-start="handleDragStart"
          />
        </div>
      </div>

      <!-- 媒体节点 -->
      <div>
        <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {{ t('playgroundCanvas.palette.categoryMedia') }}
        </h3>
        <div class="space-y-1">
          <NodePaletteItem
            v-for="item in mediaNodes"
            :key="item.type"
            :item="item"
            @drag-start="handleDragStart"
          />
        </div>
      </div>

      <!-- AI 节点 -->
      <div>
        <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {{ t('playgroundCanvas.palette.categoryAi') }}
        </h3>
        <div class="space-y-1">
          <NodePaletteItem
            v-for="item in aiNodes"
            :key="item.type"
            :item="item"
            @drag-start="handleDragStart"
          />
        </div>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="px-4 py-3 border-t border-border bg-muted/50">
      <p class="text-xs text-muted-foreground">
        <kbd class="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">{{ t('playgroundCanvas.palette.hintKey') }}</kbd>
        {{ t('playgroundCanvas.palette.hint') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NODE_PALETTE_CONFIG, CanvasNodeType } from '@/types/canvas'
import type { NodePaletteItem as NodePaletteItemType } from '@/types/canvas'
import NodePaletteItem from './NodePaletteItem.vue'

const { t } = useI18n()

// Emits
const emit = defineEmits<{
  'drag-start': [type: CanvasNodeType]
}>()

// 按类别分组节点
const basicNodes = computed(() =>
  NODE_PALETTE_CONFIG.filter(item => item.category === 'basic')
)

const mediaNodes = computed(() =>
  NODE_PALETTE_CONFIG.filter(item => item.category === 'media')
)

const aiNodes = computed(() =>
  NODE_PALETTE_CONFIG.filter(item => item.category === 'ai')
)

// 处理拖拽开始
function handleDragStart(type: CanvasNodeType) {
  emit('drag-start', type)
}
</script>
