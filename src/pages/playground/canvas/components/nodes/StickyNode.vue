<template>
  <div
    class="sticky-node rounded-xl shadow-md min-w-[180px] max-w-[280px] p-4"
    :class="[colorClasses.bg, { 'ring-2 ring-primary-500/50': selected }]"
    :style="{ borderLeft: `4px solid ${colorClasses.border}` }"
  >
    <!-- 编辑模式 -->
    <textarea
      v-if="isEditing"
      ref="textareaRef"
      v-model="localContent"
      class="w-full min-h-[60px] text-sm text-zinc-700 bg-transparent resize-none focus:outline-none"
      :placeholder="t('playgroundCanvas.sticky.placeholder')"
      @blur="handleBlur"
      @keydown.escape="handleEscape"
    />

    <!-- 展示模式 -->
    <div
      v-else
      class="min-h-[40px] text-sm text-zinc-700 whitespace-pre-wrap cursor-text"
      @dblclick="handleDoubleClick"
    >
      <template v-if="data.content">
        {{ data.content }}
      </template>
      <span v-else class="text-zinc-500 italic">{{ t('playgroundCanvas.sticky.editHint') }}</span>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-zinc-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-zinc-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import type { StickyNodeData } from '@/types/canvas'
import { StickyColor, STICKY_COLOR_MAP } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: StickyNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()

// 本地状态
const isEditing = ref(props.data.isEditing || false)
const localContent = ref(props.data.content || '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 颜色样式
const colorClasses = computed(() => {
  const color = props.data.color || StickyColor.YELLOW
  const colorConfig = STICKY_COLOR_MAP[color]
  return {
    bg: `bg-[${colorConfig.bg}]`,
    border: colorConfig.border
  }
})

// 监听 data 变化
watch(() => props.data.content, (newContent) => {
  if (!isEditing.value) {
    localContent.value = newContent || ''
  }
})

watch(() => props.data.isEditing, (editing) => {
  isEditing.value = editing || false
  if (editing) {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})

// 双击进入编辑
function handleDoubleClick() {
  isEditing.value = true
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

// 失焦保存
function handleBlur() {
  isEditing.value = false
  if (localContent.value !== props.data.content) {
    store.updateNodeData(props.id, {
      content: localContent.value,
      isEditing: false
    })
    store.pushHistory()
  }
}

// ESC 取消编辑
function handleEscape() {
  isEditing.value = false
  localContent.value = props.data.content || ''
  store.updateNodeData(props.id, { isEditing: false })
}
</script>

<style scoped>
.sticky-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid),
              transform var(--duration-fast) var(--ease-fluid);
}

.sticky-node:hover {
  transform: translateY(-1px);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .sticky-node {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .sticky-node .text-zinc-700 {
    color: rgba(224, 231, 235, 0.85);
  }

  .sticky-node .text-zinc-500 {
    color: rgba(161, 161, 170, 0.7);
  }
}
</style>
