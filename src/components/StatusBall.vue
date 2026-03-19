<script setup lang="ts">
import {computed, ref, onMounted, onUnmounted, watch, nextTick} from 'vue'
import {useRoute} from 'vue-router'
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
  ApartmentOutlined
} from '@ant-design/icons-vue'
import {gsap} from 'gsap'
import Vue3DraggableResizable from 'vue3-draggable-resizable'
import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'
import ConversationTreeModal from './ConversationTreeModal.vue'

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
      label: '查看计划',
      action: 'viewPlan',
      // 青绿色系 - 主功能 (Primary Teal)
      gradient: 'linear-gradient(135deg, #6b9a98, #50c8b7)',
      show: true,
      tooltipPlacement: 'right' // 按钮1在右侧
    },
    {
      icon: ThunderboltOutlined,
      label: `进度 ${planProgress.value}%`,
      action: 'progress',
      // Jelly 绿色系 - 状态/进度
      gradient: 'linear-gradient(135deg, #a5d6a7, #81c784)',
      show: true,
      tooltipPlacement: 'rightTop' // 按钮2在右上
    },
    {
      icon: RocketOutlined,
      label: '快速操作',
      action: 'quickAction',
      // Jelly 蓝色系 - 信息/操作
      gradient: 'linear-gradient(135deg, #90caf9, #64b5f6)',
      show: true,
      tooltipPlacement: 'leftTop' // 按钮3在左上
    },
    {
      icon: BellOutlined,
      label: '通知',
      action: 'notifications',
      // Jelly 黄色系 - 警告/待处理
      gradient: 'linear-gradient(135deg, #ffe082, #ffd54f)',
      show: true,
      tooltipPlacement: 'left' // 按钮4在左侧
    },
    {
      icon: SettingOutlined,
      label: '设置',
      action: 'settings',
      // Jelly 粉色系 - 温馨/设置
      gradient: 'linear-gradient(135deg, #f3bddb, #f48fb1)',
      show: true,
      tooltipPlacement: 'leftBottom' // 按钮5在左下
    },
    {
      icon: ApartmentOutlined,
      label: '对话树',
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

// 处理菜单项点击
const handleMenuItemClick = (action: string) => {
  isMenuOpen.value = false

  console.log('菜单项点击:', action)

  switch (action) {
    case 'viewPlan':
    case 'progress':
      chat.setPlanWidgetPosition(position.value)
      chat.setPlanWidgetMode('sidebar')
      break
    case 'quickAction':
      console.log('快速操作')
      break
    case 'settings':
      console.log('打开设置')
      break
    case 'notifications':
      console.log('打开通知')
      break
    case 'conversationTree':
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
})

// 处理对话树节点点击（定位到消息）
const handleTreeNodeClick = (nodeId: string) => {
  console.log('准备定位到消息:', nodeId)

  // 关闭模态框
  showConversationTreeModal.value = false

  // 等待模态框关闭动画完成 + DOM 更新完成
  setTimeout(async () => {
    // 等待 Vue 完成响应式更新（接收新的 activePath 并重新渲染 turns）
    await nextTick()
    // 额外等待一帧接确保所有 DOM 布局改变完成
    await new Promise(resolve => requestAnimationFrame(resolve))
    scrollToTurn(nodeId)
  }, 300)
}

// 滚动定位到指定 turn
const scrollToTurn = (turnId: string) => {
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
    { backgroundColor: 'rgba(107, 154, 152, 0.3)' },
    { backgroundColor: 'transparent', duration: 1.5, ease: 'power2.out' }
  )
}
</script>

<template>
  <div class="plan-ball-wrapper">
    <!-- 可拖拽的环形菜单 -->
    <Vue3DraggableResizable
        class="plan-ball-draggable"
        :initW="200"
        :initH="200"
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


        <a-tooltip
            v-for="(item, index) in menuItems"
            :key="index"
            :title="item.label"
            :placement="item.tooltipPlacement">

          <!-- 环形菜单项 -->
          <li
              class="circle-item"
              :style="{ '--i': index }"
          >
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
        </a-tooltip>
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
  --menu-size: 200px;
  --toggle-size: 50px;
  --item-size: 45px;
  --orbit-radius: 70px;
  --item-count: 6;

  width: var(--menu-size);
  height: var(--menu-size);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
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
  // 使用项目规范的缓动函数
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  // 项目规范阴影
  box-shadow: 0 2px 8px rgba($primary-color-500, 0.2),
  0 0 0 2px rgba(255, 255, 255, 0.15),
  inset 0 1px 4px rgba(255, 255, 255, 0.3);
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
    // 项目规范: hover 提升 + 增强阴影
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($primary-color-500, 0.3),
    0 0 0 3px rgba(255, 255, 255, 0.2),
    inset 0 1px 4px rgba(255, 255, 255, 0.3);

    &::before {
      opacity: 0.6;
    }
  }

  &:active {
    // 项目规范: 点击缩放
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
  font-size: 20px;
  transition: transform 0.3s ease;
}

/* 菜单展开时旋转 */
.menu-open .toggle-btn {
  transform: rotate(180deg);
  box-shadow: 0 4px 16px rgba($primary-color-500, 0.4),
  0 0 0 3px rgba(255, 255, 255, 0.25),
  inset 0 1px 4px rgba(255, 255, 255, 0.3);
}

/* 环形菜单项 */
.circle-item {
  position: absolute;
  list-style-type: none;
  // 项目规范弹性动画
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
  // 项目规范: 小组件圆角
  border-radius: 50%;
  text-decoration: none;
  cursor: pointer;
  position: relative;
  // 细腻阴影层次
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1),
  inset 0 1px 2px rgba(255, 255, 255, 0.4);
  // 项目规范过渡
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

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
    // 项目规范: hover 提升
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.5);

    &::before {
      inset: -4px;
      opacity: 0.7;
    }
  }
}

.menu-icon {
  font-size: 18px;
  color: white;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
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
// 第一个菜单项 - 青绿色 (Primary Teal)
.circle-item:nth-of-type(1) .menu-anchor {
  box-shadow: 0 2px 8px rgba($primary-color-500, 0.3),
  inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

// 第二个菜单项 - Jelly 绿色
.circle-item:nth-of-type(2) .menu-anchor {
  box-shadow: 0 2px 8px rgba(165, 214, 167, 0.5),
  inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

// 第三个菜单项 - Jelly 蓝色
.circle-item:nth-of-type(3) .menu-anchor {
  box-shadow: 0 2px 8px rgba(144, 202, 249, 0.5),
  inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

// 第四个菜单项 - Jelly 黄色
.circle-item:nth-of-type(4) .menu-anchor {
  box-shadow: 0 2px 8px rgba(255, 224, 130, 0.5),
  inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

// 第五个菜单项 - Jelly 粉色
.circle-item:nth-of-type(5) .menu-anchor {
  box-shadow: 0 2px 8px rgba(243, 189, 219, 0.5),
  inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

// 第六个菜单项 - 辅助青蓝色 (Secondary Cyan)
.circle-item:nth-of-type(6) .menu-anchor {
  box-shadow: 0 2px 8px rgba(51, 207, 210, 0.4),
  inset 0 1px 2px rgba(255, 255, 255, 0.4);
}
</style>
