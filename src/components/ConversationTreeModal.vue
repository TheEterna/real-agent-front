<template>
  <a-modal
      v-model:open="internalVisible"
      title="对话树视图"
      width="95vw"
      :footer="null"
      :centered="true"
      :destroy-on-close="true"
      wrap-class-name="conversation-tree-modal-wrapper"
      @cancel="handleClose"
      class="ios-style-modal"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <span class="text-2xl text-[#6b9a98] flex items-center">
          <ApartmentOutlined />
        </span>
        <div class="flex flex-col">
          <span class="text-lg font-semibold text-gray-900">对话树视图</span>
          <span v-if="tree" class="text-xs text-gray-500 font-normal">{{ sessionTitle }}</span>
        </div>
      </div>
    </template>

    <!-- 工具栏 - iOS 风格 -->
    <div class="flex flex-col gap-4 p-4 bg-gradient-to-b from-gray-50 to-white rounded-2xl mb-4 border border-gray-200">
      <!-- 第一行：控制按钮 -->
      <div class="flex flex-wrap items-center gap-2 md:gap-3">
        <a-tooltip title="居中视图">
            <button class="ios-button" @click="handleFitView">
              <CompressOutlined class="text-lg"/>
            </button>
        </a-tooltip>

        <a-tooltip title="刷新数据">
            <button class="ios-button" @click="handleRefresh">
              <ReloadOutlined class="text-lg"/>
            </button>
        </a-tooltip>

        <a-divider type="vertical" class="hidden md:block" />

        <a-radio-group v-model:value="layoutDirection" size="small" @change="handleLayoutChange" button-style="solid" class="ios-button-group">
          <a-radio-button value="TB" class="ios-radio-button">
            <DownOutlined />
            <span class="hidden sm:inline ml-1">竖直</span>
          </a-radio-button>
          <a-radio-button value="LR" class="ios-radio-button">
            <RightOutlined />
            <span class="hidden sm:inline ml-1">水平</span>
          </a-radio-button>
        </a-radio-group>

        <a-divider type="vertical" class="hidden md:block" />

        <!-- 搜索框 -->
        <div class="flex-1 min-w-[200px] max-w-xs">
          <div class="search-box">
            <SearchOutlined class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索节点..."
              class="search-input"
              @keyup.enter="handleSearch(searchQuery)"
            />
            <CloseOutlined
              v-if="searchQuery"
              class="clear-icon"
              @click="searchQuery = ''; handleSearch('')"
            />
          </div>
        </div>
      </div>

      <!-- 第二行：信息提示 -->
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-2 text-gray-600">
          <InfoCircleOutlined class="text-[#6b9a98]" />
          <span>点击节点可切换分支 • 拖拽可移动视图 • 滚轮可缩放</span>
        </div>
        <div v-if="filteredNodeCount > 0" class="text-gray-500">
          {{ filteredNodeCount }} 个节点
        </div>
      </div>
    </div>

    <!-- 树形图 -->
    <a-spin :spinning="loading" tip="加载对话树中..." class="ios-spin">
      <div class="w-full h-[65vh] md:h-[75vh] min-h-[400px] md:min-h-[500px] bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl overflow-hidden relative border border-gray-200 shadow-lg">
        <ConversationTreeView
            v-if="tree"
            :key="tree.sessionId"
            :tree="filteredTree"
            :layout-config="layoutConfig"
            :show-statistics="true"
            class="flex-1 w-full"
            @node-click="handleNodeClick"
        />
        <div v-else class="flex flex-col items-center justify-center flex-1 w-full gap-3">
          <a-empty description="暂无对话树数据" />
          <a-button type="primary" size="small" @click="handleRefresh">刷新</a-button>
        </div>
      </div>
    </a-spin>

    <!-- 错误提示 -->
    <a-alert
        v-if="error"
        type="error"
        :message="error"
        show-icon
        closable
        class="mt-4"
        @close="error = ''"
    />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  Modal as AModal,
  Button as AButton,
  Tooltip as ATooltip,
  Space as ASpace,
  RadioGroup as ARadioGroup,
  RadioButton as ARadioButton,
  Divider as ADivider,
  Empty as AEmpty,
  Spin as ASpin,
  Alert as AAlert
} from 'ant-design-vue'
import {
  ApartmentOutlined,
  CompressOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  DownOutlined,
  RightOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import ConversationTreeView from './ConversationTreeView.vue'
import { useChatStore } from '@/stores/chatStore'
import type { ConversationTree, TreeLayoutConfig, ConversationNode } from '@/types/conversation'
import { useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'

// Props
interface Props {
  visible: boolean
  sessionId: string
}

const props = defineProps<Props>()

// Emits
interface Emits {
  'update:visible': [value: boolean]
  nodeClick: [nodeId: string]
}

const emit = defineEmits<Emits>()

// Store & Router
const chatStore = useChatStore()

// 内部状态
const internalVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const tree = ref<ConversationTree | null>(null)
const loading = ref(false)
const error = ref('')
const layoutDirection = ref<'TB' | 'LR'>('TB')
const searchQuery = ref('')

// 布局配置
const layoutConfig = computed<Partial<TreeLayoutConfig>>(() => ({
  direction: layoutDirection.value,
  nodeSpacing: layoutDirection.value === 'TB' ? 40 : 60,
  rankSpacing: layoutDirection.value === 'TB' ? 80 : 120
}))

// 会话标题
const sessionTitle = computed(() => {
  const session = chatStore.getSession(props.sessionId)
  return session?.title || '未命名对话'
})

/**
 * 搜索树节点
 */
function searchNodes(node: ConversationNode, query: string): ConversationNode | null {
  const lowercaseQuery = query.toLowerCase()
  const nodeText = node.turn?.content?.toLowerCase() || ''
  const matches = nodeText.includes(lowercaseQuery)

  // 递归搜索子节点
  const matchedChildren = node.children
    .map(child => searchNodes(child, query))
    .filter((child): child is ConversationNode => child !== null)

  // 如果节点本身匹配或子节点匹配，保留该节点
  if (matches || matchedChildren.length > 0) {
    return {
      ...node,
      children: matchedChildren
    }
  }

  return null
}

// 过滤后的树
const filteredTree = computed<ConversationTree | null>(() => {
  if (!tree.value || !searchQuery.value.trim()) {
    return tree.value
  }

  const query = searchQuery.value.trim()
  if (!tree.value.root) return tree.value

  const filteredRoot = searchNodes(tree.value.root, query)
  if (!filteredRoot) {
    return null
  }

  return {
    ...tree.value,
    root: filteredRoot
  }
})

// 统计过滤后的节点数
const filteredNodeCount = computed(() => {
  if (!filteredTree.value || !filteredTree.value.root) return 0

  let count = 0
  function traverse(node: ConversationNode) {
    if (node.id !== 'root') count++
    node.children.forEach(child => traverse(child))
  }
  traverse(filteredTree.value.root)
  return count
})

// 加载对话树
const loadTree = async () => {
  if (!props.sessionId) {
    error.value = '会话 ID 无效'
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log("对话树加载的id:" + props.sessionId)
    const loadedTree = await chatStore.fetchConversationTree(props.sessionId)

    if (loadedTree) {
      tree.value = loadedTree
      console.log('对话树加载成功:', loadedTree)
      
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
    } else {
      error.value = '加载对话树失败，请重试'
    }
  } catch (err: any) {
    console.error('加载对话树失败:', err)
    error.value = err.message || '加载对话树失败'
  } finally {
    loading.value = false
  }
}

// 处理节点点击
const handleNodeClick = async (nodeId: string) => {
  console.log('模态框：节点点击', nodeId)
  loading.value = true
  try {
    const success = await chatStore.switchToPath(props.sessionId, nodeId)
    if (success) {
      message.success('已切换到该分支')
      tree.value = chatStore.getConversationTree(props.sessionId)
      emit('nodeClick', nodeId)
    } else {
      message.error('切换分支失败')
    }
  } catch (error: any) {
    console.error('切换分支失败:', error)
    message.error(error.message || '切换分支失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = (value: string) => {
  searchQuery.value = value
  console.log('搜索节点:', value)
}

// 处理布局变化
const handleLayoutChange = async () => {
  console.log('布局方向切换:', layoutDirection.value)
  await nextTick()
  message.success(`已切换至${layoutDirection.value === 'TB' ? '竖直' : '水平'}布局`)
}

// 居中视图
const handleFitView = () => {
  message.info('视图已居中')
}

// 刷新数据
const handleRefresh = async () => {
  await loadTree()
  message.success('数据已刷新')
}

// 处理关闭
const handleClose = () => {
  internalVisible.value = false
  searchQuery.value = ''
}

// 监听可见性变化
watch(
    () => props.visible,
    async (newVisible) => {
      console.log('ConversationTreeModal 可见性变化:', newVisible)
      if (newVisible) {
        await nextTick()
        console.log('准备加载对话树，sessionId:', props.sessionId)
        await loadTree()
        // 入场动画
        const modalContent = document.querySelector('.conversation-tree-modal-wrapper .ant-modal-content')
        if (modalContent) {
          gsap.fromTo(
              modalContent,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
          )
        }
      } else {
        tree.value = null
        error.value = ''
        searchQuery.value = ''
      }
    }
)
</script>

<style scoped>
/* === iOS 风格样式 === */

:deep(.ios-style-modal) {
  /* ... */
}

:deep(.ant-modal-content) {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-radius: 24px;
  border: 2px solid rgba(107, 154, 152, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}

/* iOS 按钮样式 */
.ios-button {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(107, 154, 152, 0.2);
  background: linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%);
  color: #6b9a98;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ios-button:hover {
  background: linear-gradient(135deg, #eef2ff 0%, #f5f7ff 100%);
  border-color: #6b9a98;
  box-shadow: 0 4px 12px rgba(107, 154, 152, 0.15);
  transform: translateY(-2px);
}

.ios-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(107, 154, 152, 0.1);
}

/* iOS 单选按钮组 */
:deep(.ios-button-group .ant-radio-button-wrapper) {
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%);
  border: 1px solid rgba(107, 154, 152, 0.2);
}

:deep(.ios-button-group .ant-radio-button-wrapper-checked) {
  background: linear-gradient(135deg, #6b9a98 0%, #5a8a88 100%);
  border-color: #6b9a98;
  color: white;
  box-shadow: 0 4px 12px rgba(107, 154, 152, 0.3);
}

/* iOS 输入框 */
:deep(.ios-input .ant-input) {
  border-radius: 12px;
  border: 1.5px solid rgba(107, 154, 152, 0.2);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
  padding: 8px 14px;
  transition: all 0.3s ease;
}

:deep(.ios-input .ant-input:focus) {
  border-color: #6b9a98;
  box-shadow: 0 0 0 3px rgba(107, 154, 152, 0.1);
}

:deep(.ios-input .ant-input:hover) {
  border-color: #6b9a98;
}

/* 原简搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #6b9a98;
  font-size: 14px;
  pointer-events: none;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  padding: 8px 38px 8px 36px;
  border-radius: 12px;
  border: 1.5px solid rgba(107, 154, 152, 0.2);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.search-input:focus {
  border-color: #6b9a98;
  box-shadow: 0 0 0 3px rgba(107, 154, 152, 0.1);
}

.search-input:hover {
  border-color: #6b9a98;
}

.search-input::placeholder {
  color: #999;
}

.clear-icon {
  position: absolute;
  right: 12px;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px;
}

.clear-icon:hover {
  color: #6b9a98;
  transform: scale(1.1);
}

/* iOS Spin */
:deep(.ios-spin .ant-spin-text) {
  color: #6b9a98;
  font-weight: 500;
}

:deep(.ant-alert) {
  border-radius: 12px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff8f8 100%);
  border: 1px solid rgba(245, 101, 101, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.ant-modal-content) {
    border-radius: 20px;
    padding: 16px;
  }

  .ios-button {
    padding: 8px 10px;
    font-size: 14px;
  }
}
</style>
