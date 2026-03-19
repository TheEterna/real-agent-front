<template>
  <div class="h-[100dvh] sm:h-screen w-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
    <!-- 顶部工具栏 -->
    <CanvasToolbar
      :can-undo="canUndo"
      :can-redo="canRedo"
      :is-saving="isSaving"
      :has-unsaved-changes="hasUnsavedChanges"
      :zoom="viewport.zoom"
      @undo="handleUndo"
      @redo="handleRedo"
      @save="handleSave"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @zoom-reset="handleZoomReset"
      @toggle-grid="handleToggleGrid"
    />

    <!-- 主内容区 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 左侧节点面板 - 移动端隐藏，桌面端显示 -->
      <NodePalette
        v-if="showNodePalette"
        class="hidden sm:flex w-64 border-r border-border bg-white dark:bg-zinc-900"
        @drag-start="handleNodeDragStart"
      />

      <!-- 画布区域 -->
      <div
        ref="canvasContainer"
        class="flex-1 relative"
        @drop="handleDrop"
        @dragover.prevent
      >
        <VueFlow
          v-model:nodes="flowNodes"
          v-model:edges="flowEdges"
          :node-types="nodeTypes"
          :default-viewport="viewport"
          :min-zoom="0.1"
          :max-zoom="4"
          :snap-to-grid="settings.snapToGrid"
          :snap-grid="[settings.gridSize, settings.gridSize]"
          :connection-mode="ConnectionMode.Loose"
          :delete-key-code="['Backspace', 'Delete']"
          fit-view-on-init
          class="canvas-flow"
          @node-click="handleNodeClick"
          @node-drag-stop="handleNodeDragStop"
          @edge-click="handleEdgeClick"
          @connect="handleConnect"
          @pane-click="handlePaneClick"
          @viewport-change="handleViewportChange"
        >
          <!-- 背景 -->
          <Background
            v-if="settings.gridEnabled"
            :pattern-color="gridPatternColor"
            :gap="settings.gridSize"
          />

          <!-- 控制器 -->
          <Controls position="bottom-right" />

          <!-- 小地图 -->
          <MiniMap
            position="bottom-right"
            :style="{ marginBottom: '50px' }"
            :pannable="true"
            :zoomable="true"
          />
        </VueFlow>

        <!-- 空状态提示 -->
        <div
          v-if="nodes.length === 0 && !isLoading"
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Layers :size="32" class="text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 class="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">{{ t('playgroundCanvas.empty.title') }}</h3>
            <p class="text-base text-zinc-500 dark:text-zinc-400 max-w-xs">
              {{ t('playgroundCanvas.empty.description') }}
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 - 移动端隐藏，桌面端显示 -->
      <PropertyPanel
        v-if="showPropertyPanel && selectedNodes.length > 0"
        class="hidden md:flex w-72 border-l border-border bg-white dark:bg-zinc-900"
        :selected-nodes="selectedNodes"
        @update-node="handleUpdateNode"
        @delete-node="handleDeleteNode"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, markRaw, onUnmounted } from 'vue'
import { VueFlow, useVueFlow, ConnectionMode } from '@vue-flow/core'
import type { Node, Edge, Connection, NodeMouseEvent, NodeDragEvent, EdgeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Layers } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

// 样式
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

// Store
import { useCanvasStore } from '@/stores/canvasStore'
import { storeToRefs } from 'pinia'

// 类型
import type { CanvasNode, CanvasEdge } from '@/types/canvas'
import { CanvasNodeType } from '@/types/canvas'

// 组件
import CanvasToolbar from './components/CanvasToolbar.vue'
import NodePalette from './components/NodePalette.vue'
import PropertyPanel from './components/PropertyPanel.vue'

// 自定义节点
import TextNode from './components/nodes/TextNode.vue'
import StickyNode from './components/nodes/StickyNode.vue'
import ImageNode from './components/nodes/ImageNode.vue'
import VideoNode from './components/nodes/VideoNode.vue'
import AudioNode from './components/nodes/AudioNode.vue'
import AiChatNode from './components/nodes/AiChatNode.vue'
import AiImageNode from './components/nodes/AiImageNode.vue'
import AiVideoNode from './components/nodes/AiVideoNode.vue'
import AiAudioNode from './components/nodes/AiAudioNode.vue'

const { t } = useI18n()

// ==================== Dark mode ====================

const isDarkMode = ref(document.documentElement.classList.contains('dark'))
let darkModeObserver: MutationObserver | null = null

onMounted(() => {
  darkModeObserver = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark')
  })
  darkModeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  darkModeObserver?.disconnect()
})

const gridPatternColor = computed(() => isDarkMode.value ? '#27272a' : '#e4e4e7')

// ==================== Store ====================

const store = useCanvasStore()
const {
  nodes,
  edges,
  selectedNodeIds,
  selectedNodes,
  viewport,
  settings,
  isLoading,
  isSaving,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  showNodePalette,
  showPropertyPanel
} = storeToRefs(store)

// ==================== Vue Flow ====================

const { fitView } = useVueFlow()

// 注册自定义节点类型
const nodeTypes: Record<string, any> = {
  [CanvasNodeType.TEXT]: markRaw(TextNode),
  [CanvasNodeType.STICKY]: markRaw(StickyNode),
  [CanvasNodeType.IMAGE]: markRaw(ImageNode),
  [CanvasNodeType.VIDEO]: markRaw(VideoNode),
  [CanvasNodeType.AUDIO]: markRaw(AudioNode),
  [CanvasNodeType.AI_CHAT]: markRaw(AiChatNode),
  [CanvasNodeType.AI_IMAGE]: markRaw(AiImageNode),
  [CanvasNodeType.AI_VIDEO]: markRaw(AiVideoNode),
  [CanvasNodeType.AI_AUDIO]: markRaw(AiAudioNode)
}

// 转换 Store 节点为 Vue Flow 节点
const flowNodes = computed<Node[]>({
  get: () => nodes.value.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    selected: selectedNodeIds.value.includes(node.id),
    style: node.style ? {
      width: node.style.width ? `${node.style.width}px` : undefined,
      height: node.style.height ? `${node.style.height}px` : undefined
    } : undefined
  })),
  set: (newNodes) => {
    // 同步位置变化
    newNodes.forEach(flowNode => {
      const storeNode = nodes.value.find(n => n.id === flowNode.id)
      if (storeNode && (
        storeNode.position.x !== flowNode.position.x ||
        storeNode.position.y !== flowNode.position.y
      )) {
        store.moveNode(flowNode.id, flowNode.position)
      }
    })
  }
})

// 转换 Store 边为 Vue Flow 边
const flowEdges = computed<Edge[]>({
  get: () => edges.value.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    animated: edge.animated,
    style: edge.style
  })),
  set: () => {
    // 边的变化通过事件处理
  }
})

// ==================== 拖拽相关 ====================

const canvasContainer = ref<HTMLElement | null>(null)
const draggedNodeType = ref<CanvasNodeType | null>(null)

function handleNodeDragStart(type: CanvasNodeType) {
  draggedNodeType.value = type
}

function handleDrop(event: DragEvent) {
  if (!draggedNodeType.value || !canvasContainer.value) return

  const bounds = canvasContainer.value.getBoundingClientRect()
  const position = {
    x: (event.clientX - bounds.left - viewport.value.x) / viewport.value.zoom,
    y: (event.clientY - bounds.top - viewport.value.y) / viewport.value.zoom
  }

  store.createAndAddNode(draggedNodeType.value, position)
  draggedNodeType.value = null
}

// ==================== 事件处理 ====================

function handleNodeClick(event: NodeMouseEvent) {
  const isMultiSelect = event.event.shiftKey || event.event.metaKey || event.event.ctrlKey
  store.selectNode(event.node.id, isMultiSelect)
}

function handleNodeDragStop(event: NodeDragEvent) {
  store.moveNode(event.node.id, event.node.position)
  store.pushHistory()
}

function handleEdgeClick(event: EdgeMouseEvent) {
  // 可以在这里处理边的选中
  console.log('Edge clicked:', event.edge.id)
}

function handleConnect(connection: Connection) {
  if (connection.source && connection.target) {
    store.createAndAddEdge(connection.source, connection.target)
  }
}

function handlePaneClick() {
  store.clearSelection()
}

function handleViewportChange(newViewport: { x: number; y: number; zoom: number }) {
  store.updateViewport(newViewport)
}

// ==================== 工具栏事件 ====================

function handleUndo() {
  store.undo()
}

function handleRedo() {
  store.redo()
}

async function handleSave() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await store.saveCurrentProject()
  } finally {
    isSaving.value = false
  }
}

function handleZoomIn() {
  const newZoom = Math.min(viewport.value.zoom * 1.2, 4)
  store.updateViewport({ zoom: newZoom })
}

function handleZoomOut() {
  const newZoom = Math.max(viewport.value.zoom / 1.2, 0.1)
  store.updateViewport({ zoom: newZoom })
}

function handleZoomReset() {
  store.resetViewport()
  fitView()
}

function handleToggleGrid() {
  store.updateSettings({ gridEnabled: !settings.value.gridEnabled })
}

// ==================== 属性面板事件 ====================

function handleUpdateNode(nodeId: string, data: Partial<CanvasNode['data']>) {
  store.updateNodeData(nodeId, data)
}

function handleDeleteNode(nodeId: string) {
  store.removeNode(nodeId)
}

// ==================== 快捷键 ====================

function handleKeyDown(event: KeyboardEvent) {
  // Cmd/Ctrl + Z: 撤销
  if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    handleUndo()
  }
  // Cmd/Ctrl + Shift + Z: 重做
  if ((event.metaKey || event.ctrlKey) && event.key === 'z' && event.shiftKey) {
    event.preventDefault()
    handleRedo()
  }
  // Cmd/Ctrl + S: 保存
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    handleSave()
  }
  // Cmd/Ctrl + A: 全选
  if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
    event.preventDefault()
    store.selectAll()
  }
  // Escape: 取消选择
  if (event.key === 'Escape') {
    store.clearSelection()
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  // 初始化 Store
  await store.initialize()

  // 如果没有当前项目，创建一个新项目
  if (!store.currentProjectId) {
    await store.createNewProject(t('playgroundCanvas.defaultProjectName'))
  }

  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
})

// 清理
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// 监听节点变化，标记未保存
watch([nodes, edges], () => {
  // 变化已在 store 中处理
}, { deep: true })
</script>

<style>
.canvas-flow {
  background-color: var(--background, #fafafa);
}

.canvas-flow .vue-flow__node {
  cursor: grab;
}

.canvas-flow .vue-flow__node:active {
  cursor: grabbing;
}

.canvas-flow .vue-flow__node.selected {
  box-shadow: 0 0 0 2px var(--color-primary-500, #6366f1);
}

.canvas-flow .vue-flow__edge-path {
  stroke: var(--muted-foreground, #94a3b8);
  stroke-width: 2;
}

.canvas-flow .vue-flow__edge.selected .vue-flow__edge-path {
  stroke: var(--color-primary-500, #6366f1);
}

.canvas-flow .vue-flow__handle {
  width: 8px;
  height: 8px;
  background-color: var(--color-primary-500, #6366f1);
  border: 2px solid var(--background, white);
}

.canvas-flow .vue-flow__controls {
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}

.canvas-flow .vue-flow__minimap {
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
</style>

<!-- 暗色模式 -->
<style lang="scss">
.dark {
  .canvas-flow {
    background-color: var(--background);
  }

  .canvas-flow .vue-flow__controls {
    background: rgba(39, 39, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .canvas-flow .vue-flow__controls-button {
    background: transparent;
    border-bottom-color: rgba(255, 255, 255, 0.06);
    fill: rgba(224, 231, 235, 0.7);

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .canvas-flow .vue-flow__minimap {
    background: rgba(39, 39, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .canvas-flow .vue-flow__handle {
    border-color: var(--background);
  }
}
</style>
