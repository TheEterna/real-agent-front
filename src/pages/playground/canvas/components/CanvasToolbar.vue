<template>
  <header class="canvas-toolbar bg-white/95 backdrop-blur-xl border-b border-border px-4 py-2 flex items-center justify-between z-20">
    <!-- 左侧：Logo 和标题 -->
    <div class="flex items-center gap-3">
      <div class="toolbar-logo w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white shadow-md">
        <Sparkles :size="18" />
      </div>
      <div>
        <h1 class="text-base font-semibold text-foreground">VOLO Canvas</h1>
        <p class="text-xs text-muted-foreground">Think Visually, Create Infinitely</p>
      </div>
    </div>

    <!-- 中间：操作按钮 -->
    <div class="flex items-center gap-1">
      <!-- 撤销/重做 -->
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <div class="flex items-center bg-muted rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="toolbar-btn p-2 rounded-md transition-colors"
                :class="canUndo ? 'text-foreground hover:bg-background hover:shadow-sm active:scale-95' : 'text-muted-foreground/50 cursor-not-allowed'"
                :disabled="!canUndo"
                :aria-label="t('playgroundCanvas.toolbar.undo')"
                @click="$emit('undo')"
              >
                <Undo2 :size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('playgroundCanvas.toolbar.undo') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="toolbar-btn p-2 rounded-md transition-colors"
                :class="canRedo ? 'text-foreground hover:bg-background hover:shadow-sm active:scale-95' : 'text-muted-foreground/50 cursor-not-allowed'"
                :disabled="!canRedo"
                :aria-label="t('playgroundCanvas.toolbar.redo')"
                @click="$emit('redo')"
              >
                <Redo2 :size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('playgroundCanvas.toolbar.redo') }}</TooltipContent>
          </Tooltip>
        </div>

        <div class="h-6 w-px bg-border mx-2" />

        <!-- 缩放控制 -->
        <div class="flex items-center bg-muted rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="toolbar-btn p-2 text-foreground hover:bg-background hover:shadow-sm active:scale-95 rounded-md transition-colors"
                :aria-label="t('playgroundCanvas.toolbar.zoomOut')"
                @click="$emit('zoom-out')"
              >
                <ZoomOut :size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('playgroundCanvas.toolbar.zoomOut') }}</TooltipContent>
          </Tooltip>
          <span class="px-2 text-xs font-medium text-muted-foreground min-w-[48px] text-center select-none">
            {{ Math.round(zoom * 100) }}%
          </span>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="toolbar-btn p-2 text-foreground hover:bg-background hover:shadow-sm active:scale-95 rounded-md transition-colors"
                :aria-label="t('playgroundCanvas.toolbar.zoomIn')"
                @click="$emit('zoom-in')"
              >
                <ZoomIn :size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('playgroundCanvas.toolbar.zoomIn') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="toolbar-btn p-2 text-foreground hover:bg-background hover:shadow-sm active:scale-95 rounded-md transition-colors"
                :aria-label="t('playgroundCanvas.toolbar.zoomReset')"
                @click="$emit('zoom-reset')"
              >
                <Maximize2 :size="16" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('playgroundCanvas.toolbar.zoomReset') }}</TooltipContent>
          </Tooltip>
        </div>

        <div class="h-6 w-px bg-border mx-2" />

        <!-- 网格切换 -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="toolbar-btn p-2 rounded-lg transition-colors active:scale-95"
              :class="gridEnabled ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-muted-foreground hover:bg-muted'"
              :aria-label="t('playgroundCanvas.toolbar.toggleGrid')"
              @click="$emit('toggle-grid')"
            >
              <Grid3x3 :size="16" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6">{{ t('playgroundCanvas.toolbar.toggleGrid') }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- 右侧：保存和分享 -->
    <div class="flex items-center gap-2">
      <!-- 保存状态指示 -->
      <div v-if="hasUnsavedChanges" class="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
        <div class="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>{{ t('playgroundCanvas.toolbar.unsaved') }}</span>
      </div>

      <!-- 保存按钮 -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors active:scale-95"
        :class="isSaving
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'text-foreground hover:bg-muted'"
        :disabled="isSaving"
        @click="$emit('save')"
      >
        <Loader2 v-if="isSaving" :size="14" class="animate-spin" />
        <Save v-else :size="14" />
        <span>{{ isSaving ? t('playgroundCanvas.toolbar.saving') : t('playgroundCanvas.toolbar.save') }}</span>
      </button>

      <!-- 分享按钮 -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 active:scale-95 transition-colors shadow-sm"
      >
        <Share2 :size="14" />
        <span>{{ t('playgroundCanvas.toolbar.share') }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  Sparkles,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Save,
  Share2,
  Loader2
} from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props
defineProps<{
  canUndo: boolean
  canRedo: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  zoom: number
  gridEnabled?: boolean
}>()

// Emits
defineEmits<{
  undo: []
  redo: []
  save: []
  'zoom-in': []
  'zoom-out': []
  'zoom-reset': []
  'toggle-grid': []
}>()
</script>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .canvas-toolbar {
    background: rgba(24, 24, 27, 0.95);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .toolbar-logo {
    box-shadow: var(--shadow-md);
  }

  .toolbar-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
  }
}
</style>
