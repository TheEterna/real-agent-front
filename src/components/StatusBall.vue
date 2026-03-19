<script setup lang="ts">
import {computed, ref, onMounted, onUnmounted, watch, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute} from 'vue-router'
import { Tooltip as ATooltip, Popover } from 'ant-design-vue'
import {useChatStore} from '@/stores/chatStore'
import {PlanStatus} from '@/types/events'
import {
  AppstoreOutlined,
  SettingOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  PlusOutlined,
  CloseOutlined,
  ApartmentOutlined,
  FileOutlined
} from '@ant-design/icons-vue'
import {gsap} from 'gsap'
import Vue3DraggableResizable from 'vue3-draggable-resizable'
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'
import ConversationTreeModal from './ConversationTreeModal.vue'

// 定义 emit
const emit = defineEmits<{
  openArtifactPanel: []
}>()

const {t} = useI18n()
const chat = useChatStore()
const route = useRoute()
const menuRef = ref<HTMLElement | null>(null)

// 菜单展开状态
const isMenuOpen = ref(false)

// 对话树模态框状态
const showConversationTreeModal = ref(false)

// 当前计划
const sessionId = computed(() => route.params.sessionId as string || chat.currentEditingSession.id)
const currentPlan = computed(() => chat.getPlan(sessionId.value))

// 计算进度
const planProgress = computed(() => {
  if (!currentPlan.value?.phases.length) return 0
  const completedPhases = currentPlan.value.phases.filter(
      phase => phase.status === 'COMPLETED'
  ).length
  return Math.round((completedPhases / currentPlan.value.phases.length) * 100)
})

// 获取状态颜色
const getStatusColor = (status?: PlanStatus) => {
  const colorMap = {
    PLANNING: '#1677ff',
    EXECUTING: '#52c41a',
    COMPLETED: '#00b96b',
    PAUSED: '#fa8c16',
    FAILED: '#ff4d4f'
  }
  return colorMap[status || 'PLANNING'] || '#666'
}

// 菜单项配置 - 6个菜单项 (使用项目 Jelly 色彩系统)
const menuItems = computed(() => {
  const items = [
    {
      icon: AppstoreOutlined,
      label: t('compTool.statusBall.viewPlan'),
      action: 'viewPlan',
      // 青绿色系 - 主功能 (Primary Teal)
      gradient: 'linear-gradient(135deg, #6b9a98, #50c8b7)',
      show: true,
      tooltipPlacement: 'right' // 按钮1在右侧
    },
    {
      icon: ThunderboltOutlined,
      label: t('compTool.statusBall.progress', { percent: planProgress.value }),
      action: 'progress',
      // Jelly 绿色系 - 状态/进度
      gradient: 'linear-gradient(135deg, #a5d6a7, #81c784)',
      show: true,
      tooltipPlacement: 'rightTop' // 按钮2在右上
    },
    {
      icon: FileOutlined,
      label: t('compTool.statusBall.generatedFiles'),
      action: 'generatedFiles',
      // Jelly 蓝色系 - 信息/操作
      gradient: 'linear-gradient(135deg, #90caf9, #64b5f6)',
      show: true,
      tooltipPlacement: 'leftTop' // 按钮3在左上
    },
    {
      icon: BellOutlined,
      label: t('compTool.statusBall.notifications'),
      action: 'notifications',
      // Jelly 黄色系 - 警告/待处理
      gradient: 'linear-gradient(135deg, #ffe082, #ffd54f)',
      show: true,
      tooltipPlacement: 'left' // 按钮4在左侧
    },
    {
      icon: SettingOutlined,
      label: t('compTool.statusBall.settings'),
      action: 'settings',
      // Jelly 粉色系 - 温馨/设置
      gradient: 'linear-gradient(135deg, #f3bddb, #f48fb1)',
      show: true,
      tooltipPlacement: 'leftBottom' // 按钮5在左下
    },
    {
      icon: ApartmentOutlined,
      label: t('compTool.statusBall.conversationTree'),
      action: 'conversationTree',
      // 辅助青蓝色系 - 树形结构 (Secondary Cyan)
      gradient: 'linear-gradient(135deg, #33cfd2, #009aa7)',
      show: true,
      tooltipPlacement: 'rightBottom' // 按钮6在右下
    },
  ]
  console.log('menuItems computed, 对话树按钮配置:', items[5])
  return items
})

// 文件列表 Popover 状态
const showFilesPopover = ref(false)

// 获取生成的文件列表
const generatedFiles = computed(() => {
  return chat.getArtifactHistory(sessionId.value)
})

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('compTool.statusBall.justNow')
  if (minutes < 60) return t('compTool.statusBall.minutesAgo', { count: minutes })
  if (hours < 24) return t('compTool.statusBall.hoursAgo', { count: hours })
  if (days < 7) return t('compTool.statusBall.daysAgo', { count: days })

  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// 处理文件项点击
const handleFileClick = (file: any) => {
  showFilesPopover.value = false
  chat.openArtifactFromHistory(file)
}

// 处理菜单项点击
const handleMenuItemClick = (action: string, event?: Event) => {
  console.log('菜单项点击:', action)

  switch (action) {
    case 'viewPlan':
    case 'progress':
      isMenuOpen.value = false
      chat.setPlanWidgetPosition(position.value)
      chat.setPlanWidgetMode('sidebar')
      break
    case 'generatedFiles':
      // 不关闭菜单，显示文件列表 Popover
      showFilesPopover.value = !showFilesPopover.value
      break
    case 'settings':
      isMenuOpen.value = false
      console.log('打开设置')
      break
    case 'notifications':
      isMenuOpen.value = false
      console.log('打开通知')
      break
    case 'conversationTree':
      isMenuOpen.value = false
      // 打开对话树模态框
      console.log('准备打开对话树模态框，当前 sessionId:', sessionId.value)
      showConversationTreeModal.value = true
      console.log('showConversationTreeModal 已设置为:', showConversationTreeModal.value)
      break
  }
}

// 位置和拖拽
const position = ref(chat.getPlanWidgetPosition())
const dragStartPos = ref({x: 0, y: 0})
const isDragging = ref(false)

watch(() => chat.getPlanWidgetPosition(), (p) => {
  position.value = {...p}
})

const onDragStart = () => {
  dragStartPos.value = {...position.value}
  isDragging.value = false
  // 拖拽时关闭菜单
  isMenuOpen.value = false
}

const onDrag = (pos: { x: number, y: number }) => {
  position.value = pos

  const deltaX = Math.abs(pos.x - dragStartPos.value.x)
  const deltaY = Math.abs(pos.y - dragStartPos.value.y)
  if (deltaX > 5 || deltaY > 5) {
    isDragging.value = true
  }
}

const onDragStop = () => {
  chat.setPlanWidgetPosition(position.value)
  setTimeout(() => {
    isDragging.value = false
  }, 0)
}

// 点击切换菜单展开/收起
const handleToggleClick = (event: Event) => {

  event.stopPropagation()
  if (isDragging.value) {
    return
  }
  isMenuOpen.value = !isMenuOpen.value
}

// 进入动画
onMounted(() => {
  console.log('StatusBall 组件已挂载')
  console.log('showConversationTreeModal 初始值:', showConversationTreeModal.value)
  console.log('sessionId:', sessionId.value)

  if (menuRef.value) {
    gsap.from(menuRef.value, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'back.out(1.7)'
    })
  }
})

// 监听计划变化，添加脉冲动画
watch(currentPlan, (newPlan, oldPlan) => {
  if (newPlan && newPlan !== oldPlan && menuRef.value) {
    gsap.fromTo(
        menuRef.value,
        {scale: 1},
        {scale: 1.1, duration: 0.2, yoyo: true, repeat: 1}
    )
  }
}, {deep: true})

// 点击外部关闭菜单
const handleClickOutside = (e: MouseEvent) => {
  const wrapper = document.querySelector('.radial-menu-wrapper')
  if (wrapper && !wrapper.contains(e.target as Node)) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (menuRef.value) gsap.killTweensOf(menuRef.value)
})

// 处理对话树节点点击（定位到消息）
const handleTreeNodeClick = (turnId: string) => {
  console.log('准备定位到消息:', turnId)

  // 关闭模态框
  showConversationTreeModal.value = false

  if (!turnId) {
    console.warn('turnId 无效')
    return
  }

  // 在聊天容器中查找 turn 元素
  const element = document.getElementById(turnId)

  if (!element) {
    console.warn('[scrollToTurn] 未找到元素:', turnId)
    return
  }

  // 获取聊天内容容器（从页面中查找）
  const chatContainer = document.querySelector('[data-chat-content]') as HTMLElement

  if (chatContainer) {
    // 在容器内滚动到该元素
    const elementRect = element.getBoundingClientRect()
    const containerRect = chatContainer.getBoundingClientRect()
    const scrollDistance = elementRect.top - containerRect.top + chatContainer.scrollTop - 100

    chatContainer.scrollTo({
      top: scrollDistance,
      behavior: 'smooth'
    })
  } else {
    // 降级：使用通用 scrollIntoView
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  // 添加高亮动画（使用 GSAP，遵循项目规范）
  gsap.fromTo(
      element,
      { backgroundColor: 'color-mix(in srgb, var(--color-primary-500) 30%, transparent)' },
      { backgroundColor: 'transparent', duration: 1.5, ease: 'power2.out' }
  )
}


</script>

<template>
  <div class="plan-ball-wrapper">
    <!-- 可拖拽的环形菜单 -->
    <Vue3DraggableResizable
        class="plan-ball-draggable"
        :init-w="200"
        :init-h="200"
        :x="position.x"
        :y="position.y"
        :draggable="true"
        :resizable="false"
        :parent="false"
        @drag-start="onDragStart"
        @drag-end="onDragStop"
        @dragging="onDrag"
    >
      <!-- 环形菜单容器 -->
      <aside
          ref="menuRef"
          class="radial-menu-wrapper"
          :class="{ 'menu-open': isMenuOpen }"
      >
        <!-- 中心触发按钮 -->
        <div
            class="toggle-btn"
            @click="handleToggleClick"
        >
          <div class="toggle-content">
            <CloseOutlined v-if="isMenuOpen" class="toggle-icon"/>
            <PlusOutlined v-else class="toggle-icon"/>
          </div>
        </div>


        <!-- 环形菜单项 -->
        <template v-for="(item, index) in menuItems" :key="index">
          <!-- 生成的文件按钮 - 使用 Popover -->
          <Popover
              v-if="item.action === 'generatedFiles'"
              v-model:open="showFilesPopover"
              trigger="click"
              placement="left"
              overlay-class-name="files-popover"
          >
            <template #content>
              <div class="files-list-container">
                <div class="files-header">
                  <FileOutlined class="header-icon"/>
                  <span class="header-title">{{ t('compTool.statusBall.filesHeader') }}</span>
                  <span class="files-count">{{ generatedFiles.length }}</span>
                </div>

                <div v-if="generatedFiles.length === 0" class="empty-state">
                  <FileOutlined class="empty-icon"/>
                  <p class="empty-text">{{ t('compTool.statusBall.noFiles') }}</p>
                </div>

                <div v-else class="files-list">
                  <div
                      v-for="file in generatedFiles"
                      :key="file.id"
                      class="file-item"
                      @click="handleFileClick(file)"
                  >
                    <div class="file-icon-wrapper">
                      <FileOutlined class="file-icon"/>
                    </div>
                    <div class="file-info">
                      <div class="file-name">{{ file.title }}</div>
                      <div class="file-time">{{ t('compTool.statusBall.createdAt', { time: formatTime(file.createdTime) }) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <li class="circle-item" :style="{ '--i': index }">
              <div
                  class="menu-anchor"
                  :style="{ background: item.gradient }"
                  @click="handleMenuItemClick(item.action)"
                  @mousedown.stop
                  @touchstart.stop
              >
                <component :is="item.icon" class="menu-icon"/>
              </div>
            </li>
          </Popover>

          <!-- 其他菜单项 - 使用 Tooltip -->
          <ATooltip
              v-else
              :title="item.label"
              :placement="item.tooltipPlacement"
          >
            <li class="circle-item" :style="{ '--i': index }">
              <div
                  class="menu-anchor"
                  :style="{ background: item.gradient }"
                  @click="handleMenuItemClick(item.action)"
                  @mousedown.stop
                  @touchstart.stop
              >
                <component :is="item.icon" class="menu-icon"/>
              </div>
            </li>
          </ATooltip>
        </template>
      </aside>
    </Vue3DraggableResizable>
  </div>

  <!-- 对话树模态框（移到最外层，不受拖拽组件影响） -->
  <ConversationTreeModal
      :visible="showConversationTreeModal"
      :session-id="sessionId"
      @update:visible="(val) => showConversationTreeModal = val"
      @node-click="handleTreeNodeClick"
  />
</template>

<style scoped lang="scss">
/* ── StatusBall 局部 Design Tokens ── */
.plan-ball-wrapper {
  /* 通用色彩 */
  --sb-white-15: rgba(255, 255, 255, 0.15);
  --sb-white-20: rgba(255, 255, 255, 0.2);
  --sb-white-25: rgba(255, 255, 255, 0.25);
  --sb-white-30: rgba(255, 255, 255, 0.3);
  --sb-white-40: rgba(255, 255, 255, 0.4);
  --sb-white-50: rgba(255, 255, 255, 0.5);
  --sb-black-10: rgba(0, 0, 0, 0.1);
  --sb-black-12: rgba(0, 0, 0, 0.12);
  --sb-black-15: rgba(0, 0, 0, 0.15);

  /* 品牌色阴影 */
  --sb-primary-shadow-20: rgba(107, 154, 152, 0.2);
  --sb-primary-shadow-30: rgba(107, 154, 152, 0.3);
  --sb-primary-shadow-40: rgba(107, 154, 152, 0.4);
  --sb-primary-shadow-15: rgba(107, 154, 152, 0.15);

  /* Jelly 色彩系统 */
  --sb-jelly-green: rgba(165, 214, 167, 0.5);
  --sb-jelly-blue: rgba(144, 202, 249, 0.5);
  --sb-jelly-yellow: rgba(255, 224, 130, 0.5);
  --sb-jelly-pink: rgba(243, 189, 219, 0.5);
  --sb-jelly-cyan: rgba(51, 207, 210, 0.4);

  /* 文件列表色彩 */
  --sb-border-light: #f3f4f6;
  --sb-text-heading: #1f2937;
  --sb-text-muted: #999;
  --sb-bg-hover: #ecfeff;
  --sb-file-icon-gradient: linear-gradient(135deg, #90caf9, #64b5f6);

  /* 滚动条 */
  --sb-scrollbar-thumb: rgba(0, 0, 0, 0.1);
  --sb-scrollbar-thumb-hover: rgba(0, 0, 0, 0.2);
}

.plan-ball-wrapper {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}

.plan-ball-draggable,
.plan-ball-wrapper :deep(.vdr) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* 环形菜单样式 - 遵循项目设计规范 */
.radial-menu-wrapper {
  // 使用项目主色调: 青绿色系 (Teal)
  --toggle-color: linear-gradient(135deg, $primary-color-500 0%, #50c8b7 100%);
  --toggle-size: 50px;
  --item-size: 45px;
  --orbit-radius: 70px;
  --item-count: 6;

  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.875rem;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  pointer-events: auto;
}

/* 中心触发按钮 - 遵循按钮规范 */
.toggle-btn {
  width: var(--toggle-size);
  height: var(--toggle-size);
  background: var(--toggle-color);
  border-radius: 50%;
  z-index: 999;
  position: absolute;
  transition: all 0.3s var(--ease-snap, cubic-bezier(0.4, 0, 0.2, 1));
  cursor: pointer;
  box-shadow: 0 2px 8px var(--sb-primary-shadow-20),
    0 0 0 2px var(--sb-white-15),
    inset 0 1px 4px var(--sb-white-30);
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    position: absolute;
    inset: -3px;
    background: var(--toggle-color);
    border-radius: 50%;
    z-index: -1;
    filter: blur(12px);
    opacity: 0.4;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--sb-primary-shadow-30),
      0 0 0 3px var(--sb-white-20),
      inset 0 1px 4px var(--sb-white-30);

    &::before {
      opacity: 0.6;
    }
  }

  &:active {
    transform: scale(0.98);
  }
}

/* 进度环 */
.progress-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring-fill {
  transition: stroke-dashoffset 0.5s ease;
}

/* 中心内容 */
.toggle-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.toggle-icon {
  font-size: 1.25rem;
  transition: transform 0.3s ease;
}

/* 菜单展开时旋转 */
.menu-open .toggle-btn {
  transform: rotate(180deg);
  box-shadow: 0 4px 16px var(--sb-primary-shadow-40),
    0 0 0 3px var(--sb-white-25),
    inset 0 1px 4px var(--sb-white-30);
}

/* 环形菜单项 */
.circle-item {
  position: absolute;
  list-style-type: none;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transition-delay: calc(0.05s * var(--i));
  transform: rotate(0deg) translateX(0);
  opacity: 0;
  pointer-events: none;
}

/* 菜单展开时的位置计算 */
.menu-open .circle-item {
  $total: 6;
  transform: rotate(calc(360deg / #{$total} * var(--i))) translateX(var(--orbit-radius));
  opacity: 1;
  pointer-events: auto;
}

/* 菜单项锚点 - Jelly 质感 */
.menu-anchor {
  width: var(--item-size);
  height: var(--item-size);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  text-decoration: none;
  cursor: pointer;
  position: relative;
  box-shadow: 0 2px 8px var(--sb-black-10),
    inset 0 1px 2px var(--sb-white-40);
  transition: all 0.3s var(--ease-snap, cubic-bezier(0.4, 0, 0.2, 1));

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: inherit;
    border-radius: inherit;
    z-index: -1;
    filter: blur(8px);
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--sb-black-15),
      inset 0 1px 2px var(--sb-white-50);

    &::before {
      inset: -4px;
      opacity: 0.7;
    }
  }
}

.menu-icon {
  font-size: 1.125rem;
  color: white;
  filter: drop-shadow(0 1px 1px var(--sb-black-15));
}

/* 为每个菜单项设置反向旋转（保持图标正向）*/
@for $i from 1 through 6 {
  .circle-item:nth-of-type(#{$i}) .menu-anchor {
    transform: rotate(calc(-60deg * #{$i - 1}));

    &:hover {
      transform: rotate(calc(-60deg * #{$i - 1})) translateY(-2px) scale(1.08);
    }

    &:active {
      transform: rotate(calc(-60deg * #{$i - 1})) scale(0.95);
    }
  }
}

/* Jelly 色彩系统阴影 - 与渐变色协调 */
.circle-item:nth-of-type(1) .menu-anchor {
  box-shadow: 0 2px 8px var(--sb-primary-shadow-30),
    inset 0 1px 2px var(--sb-white-40);
}

.circle-item:nth-of-type(2) .menu-anchor {
  box-shadow: 0 2px 8px var(--sb-jelly-green),
    inset 0 1px 2px var(--sb-white-40);
}

.circle-item:nth-of-type(3) .menu-anchor {
  box-shadow: 0 2px 8px var(--sb-jelly-blue),
    inset 0 1px 2px var(--sb-white-40);
}

.circle-item:nth-of-type(4) .menu-anchor {
  box-shadow: 0 2px 8px var(--sb-jelly-yellow),
    inset 0 1px 2px var(--sb-white-40);
}

.circle-item:nth-of-type(5) .menu-anchor {
  box-shadow: 0 2px 8px var(--sb-jelly-pink),
    inset 0 1px 2px var(--sb-white-40);
}

.circle-item:nth-of-type(6) .menu-anchor {
  box-shadow: 0 2px 8px var(--sb-jelly-cyan),
    inset 0 1px 2px var(--sb-white-40);
}

/* 文件列表 Popover 样式 - 遵循项目设计规范 */
:deep(.files-popover) {
  .ant-popover-inner {
    padding: 0;
    border-radius: 12px;
    box-shadow: 0 4px 16px var(--sb-black-12);
  }
}

.files-list-container {
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

/* 文件列表头部 */
.files-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--sb-border-light);
  background: linear-gradient(135deg, var(--sb-bg-hover), #ffffff);

  .header-icon {
    font-size: 1rem;
    color: $primary-color-500;
  }

  .header-title {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--sb-text-heading);
  }

  .files-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: $primary-color-500;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 10px;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--sb-text-muted);

  .empty-icon {
    font-size: 3rem;
    opacity: 0.3;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 0.875rem;
    margin: 0;
  }
}

/* 文件列表 */
.files-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--sb-scrollbar-thumb);
    border-radius: 3px;
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: var(--sb-scrollbar-thumb-hover);
  }
}

/* 文件项 */
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 4px;
  background: white;
  border: 1px solid var(--sb-border-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s var(--ease-snap, cubic-bezier(0.4, 0, 0.2, 1));

  &:hover {
    background: var(--sb-bg-hover);
    border-color: $primary-color-500;
    transform: translateX(-2px);
    box-shadow: 0 2px 8px var(--sb-primary-shadow-15);
  }

  &:active {
    transform: translateX(-2px) scale(0.98);
  }

  .file-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--sb-file-icon-gradient);
    border-radius: 8px;
    flex-shrink: 0;

    .file-icon {
      font-size: 1.125rem;
      color: white;
    }
  }

  .file-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .file-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--sb-text-heading);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-time {
      font-size: 0.75rem;
      color: var(--sb-text-muted);
    }
  }
}

</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  /* ── Dark Token 覆写 ── */
  .plan-ball-wrapper {
    --sb-white-15: rgba(255, 255, 255, 0.08);
    --sb-white-20: rgba(255, 255, 255, 0.12);
    --sb-white-25: rgba(255, 255, 255, 0.15);
    --sb-white-30: rgba(255, 255, 255, 0.15);
    --sb-white-40: rgba(255, 255, 255, 0.15);
    --sb-white-50: rgba(255, 255, 255, 0.2);
    --sb-black-10: rgba(0, 0, 0, 0.3);
    --sb-black-12: rgba(0, 0, 0, 0.4);
    --sb-black-15: rgba(0, 0, 0, 0.4);
    --sb-primary-shadow-20: rgba(0, 0, 0, 0.4);
    --sb-primary-shadow-30: rgba(0, 0, 0, 0.5);
    --sb-primary-shadow-40: rgba(0, 0, 0, 0.5);
    --sb-primary-shadow-15: rgba(80, 200, 183, 0.2);
    --sb-jelly-green: rgba(129, 199, 132, 0.55);
    --sb-jelly-blue: rgba(100, 181, 246, 0.55);
    --sb-jelly-yellow: rgba(255, 213, 79, 0.55);
    --sb-jelly-pink: rgba(244, 143, 177, 0.55);
    --sb-jelly-cyan: rgba(51, 207, 210, 0.5);
    --sb-border-light: #2d3748;
    --sb-text-heading: #e0e7eb;
    --sb-text-muted: #6b7b8d;
    --sb-bg-hover: #162d2c;
    --sb-file-icon-gradient: linear-gradient(135deg, #5b9bd5, #3a7bd5);
    --sb-scrollbar-thumb: rgba(255, 255, 255, 0.1);
    --sb-scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
  }

  /* ── 文件列表 Popover 暗色 ── */
  .files-popover {
    .ant-popover-inner {
      background: #1a2332;
    }

    .ant-popover-arrow::before {
      background: #1a2332;
    }
  }

  /* ── 文件列表头部 ── */
  .files-header {
    background: linear-gradient(135deg, #162d2c, #1a2332);
  }

  .empty-state .empty-icon {
    opacity: 0.25;
  }

  /* ── 文件项 ── */
  .file-item {
    background: #1e2a3a;

    &:hover {
      border-color: #50c8b7;
    }
  }

  /* ── 菜单项暗色阴影（更亮饱和） ── */
  .circle-item:nth-of-type(1) .menu-anchor {
    box-shadow: 0 2px 10px rgba(107, 154, 152, 0.45),
      inset 0 1px 2px var(--sb-white-25);
  }

  /* ── 中心按钮暗色阴影 ── */
  .toggle-btn {
    box-shadow: 0 2px 8px var(--sb-black-12),
      0 0 0 2px var(--sb-white-15),
      inset 0 1px 4px var(--sb-white-25);

    &:hover {
      box-shadow: 0 4px 12px var(--sb-black-15),
        0 0 0 3px var(--sb-white-20),
        inset 0 1px 4px var(--sb-white-25);
    }
  }

  .menu-open .toggle-btn {
    box-shadow: 0 4px 16px var(--sb-black-15),
      0 0 0 3px var(--sb-white-25),
      inset 0 1px 4px var(--sb-white-25);
  }
}
</style>
