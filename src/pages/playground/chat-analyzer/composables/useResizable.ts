/**
 * useResizable
 *
 * 拖拽分割线逻辑（mousedown/mousemove/mouseup 事件）。
 * 控制上下两个面板的高度比例。
 */

import { ref, onUnmounted } from 'vue'

export interface UseResizableOptions {
  /** Initial ratio of the top panel (0-1), default 0.5 */
  initialRatio?: number
  /** Minimum ratio for top panel, default 0.2 */
  minRatio?: number
  /** Maximum ratio for top panel, default 0.8 */
  maxRatio?: number
}

export function useResizable(options: UseResizableOptions = {}) {
  const {
    initialRatio = 0.5,
    minRatio = 0.2,
    maxRatio = 0.8,
  } = options

  const ratio = ref(initialRatio)
  const isDragging = ref(false)

  let containerEl: HTMLElement | null = null
  let startY = 0
  let startRatio = 0

  /**
   * Bind the container element
   */
  function setContainerRef(el: HTMLElement | null) {
    containerEl = el
  }

  /**
   * Handle mousedown on the splitter
   */
  function onSplitterMouseDown(event: MouseEvent) {
    event.preventDefault()
    isDragging.value = true
    startY = event.clientY
    startRatio = ratio.value

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }

  function onMouseMove(event: MouseEvent) {
    if (!isDragging.value || !containerEl) return

    const containerRect = containerEl.getBoundingClientRect()
    const containerHeight = containerRect.height
    if (containerHeight <= 0) return

    const deltaY = event.clientY - startY
    const deltaRatio = deltaY / containerHeight
    let newRatio = startRatio + deltaRatio

    // Clamp
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio))
    ratio.value = newRatio
  }

  function onMouseUp() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  // Cleanup on unmount
  onUnmounted(() => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })

  return {
    ratio,
    isDragging,
    setContainerRef,
    onSplitterMouseDown,
  }
}
