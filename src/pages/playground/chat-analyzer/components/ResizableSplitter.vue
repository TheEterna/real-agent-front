<script setup lang="ts">
/**
 * ResizableSplitter - 可拖拽分割线
 *
 * 水平分割线，用户可拖拽调整上下面板比例。
 * 拖拽时高亮提示，支持键盘可访问性。
 */

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  isDragging?: boolean
}>()

const emit = defineEmits<{
  mousedown: [event: MouseEvent]
  keyResize: [direction: 'up' | 'down']
}>()

function handleMouseDown(event: MouseEvent) {
  emit('mousedown', event)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    emit('keyResize', 'up')
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    emit('keyResize', 'down')
  }
}
</script>

<template>
  <div
    class="splitter-zone group flex items-center justify-center py-0.5 cursor-row-resize select-none shrink-0"
    role="separator"
    aria-orientation="horizontal"
    :aria-label="t('chatAnalyzer.splitter.ariaLabel')"
    tabindex="0"
    @mousedown="handleMouseDown"
    @keydown="handleKeyDown"
  >
    <div
      class="splitter-line h-[3px] rounded-full transition-all duration-150"
      :class="isDragging
        ? 'w-16 bg-zinc-400 dark:bg-zinc-500'
        : 'w-10 bg-zinc-200 dark:bg-zinc-700 group-hover:w-14 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-600'"
    />
  </div>
</template>

<style scoped>
.splitter-zone {
  min-height: 20px;
}

/* Mobile: ensure 44px touch target */
@media (pointer: coarse) {
  .splitter-zone {
    min-height: 44px;
  }
}

.splitter-zone:focus-visible .splitter-line {
  width: 3.5rem;
  background-color: var(--color-primary-400, #6B9A98);
  box-shadow: var(--glow-focus, 0 0 0 3px rgba(107, 154, 152, 0.25));
}
</style>
