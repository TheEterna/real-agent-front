<template>
  <div
    class="text-node bg-white rounded-xl border border-border shadow-sm min-w-[200px] max-w-[400px] hover:shadow-md"
    :class="{ 'ring-2 ring-primary-500/50': selected }"
  >
    <!-- 头部 -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-border/60">
      <Type :size="14" class="text-zinc-400" />
      <span class="text-xs font-medium text-zinc-500">{{ t('playgroundCanvas.text.title') }}</span>
    </div>

    <!-- 内容区 -->
    <div class="p-3">
      <!-- 编辑模式 -->
      <textarea
        v-if="isEditing"
        ref="textareaRef"
        v-model="localContent"
        class="w-full min-h-[80px] text-sm text-zinc-700 bg-transparent resize-none focus:outline-none"
        :placeholder="t('playgroundCanvas.text.placeholder')"
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
        <span v-else class="text-zinc-400 italic">{{ t('playgroundCanvas.text.editHint') }}</span>
      </div>
    </div>

    <!-- 连接点 -->
    <Handle type="target" :position="Position.Left" class="!bg-indigo-500 !border-white" />
    <Handle type="source" :position="Position.Right" class="!bg-indigo-500 !border-white" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Handle, Position } from '@vue-flow/core'
import { Type } from 'lucide-vue-next'
import type { TextNodeData } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvasStore'

const { t } = useI18n()

// Props
const props = defineProps<{
  id: string
  data: TextNodeData
  selected?: boolean
}>()

// Store
const store = useCanvasStore()

// 本地状态
const isEditing = ref(props.data.isEditing || false)
const localContent = ref(props.data.content || '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

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
.text-node {
  transition: box-shadow var(--duration-normal) var(--ease-fluid);
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .text-node {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .text-node .border-b {
    border-color: rgba(255, 255, 255, 0.06);
  }

  .text-node .text-zinc-400 {
    color: rgba(161, 161, 170, 0.7);
  }

  .text-node .text-zinc-500 {
    color: rgba(161, 161, 170, 0.8);
  }

  .text-node .text-zinc-700 {
    color: rgba(224, 231, 235, 0.85);
  }

  .text-node textarea {
    color: rgba(224, 231, 235, 0.85);

    &::placeholder {
      color: rgba(161, 161, 170, 0.5);
    }
  }
}
</style>
