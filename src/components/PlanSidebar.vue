<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chatStore'
import { PlanStatus, PlanPhaseStatus } from '@/types/events'
import { getRandomGlassColor, getRandomTooltipColor } from '@/utils/ColorUtils'
import { gsap } from 'gsap'
import PlanVisualization from './PlanVisualization.vue'

import { MinusOutlined } from '@ant-design/icons-vue';
const chat = useChatStore()
const route = useRoute()
const sidebarRef = ref<HTMLElement | null>(null)

// 当前计划数据
const sessionId = computed(() => route.params.sessionId as string || chat.currentEditingSession.id)
const currentPlan = computed(() => chat.getPlan(sessionId.value))

// 计算计划总进度
const planProgress = computed(() => {
  if (!currentPlan.value?.phases.length) return 0

  const completedPhases = currentPlan.value.phases.filter(
    phase => phase.status === PlanPhaseStatus.COMPLETED
  ).length

  return Math.round((completedPhases / currentPlan.value.phases.length) * 100)
})

// 获取当前执行阶段
const currentPhase = computed(() => {
  if (!currentPlan.value) return null

  return currentPlan.value.phases.find(
    phase => phase.status === PlanPhaseStatus.RUNNING
  ) || currentPlan.value.phases.find(
    phase => phase.status === PlanPhaseStatus.TODO
  )
})

// 获取计划状态文本
const getPlanStatusText = (status?: PlanStatus) => {
  const statusMap = {
    [PlanStatus.PLANNING]: '规划中',
    [PlanStatus.EXECUTING]: '执行中',
    [PlanStatus.COMPLETED]: '已完成',
    [PlanStatus.PAUSED]: '已暂停',
    [PlanStatus.FAILED]: '执行失败'
  }
  return statusMap[status || PlanStatus.PLANNING] || '未知状态'
}

// 获取状态颜色
const getStatusColor = (status?: PlanStatus) => {
  const colorMap = {
    [PlanStatus.PLANNING]: '#1677ff',
    [PlanStatus.EXECUTING]: '#52c41a',
    [PlanStatus.COMPLETED]: '#00b96b',
    [PlanStatus.PAUSED]: '#fa8c16',
    [PlanStatus.FAILED]: '#ff4d4f'
  }
  return colorMap[status || PlanStatus.PLANNING] || '#666'
}

// 缩为状态球：直接恢复到上次小球位置（已由拖拽时持久化）
const minimizeToBall = () => {
  chat.setPlanWidgetMode('ball')
}



// 监听计划数据变化，添加更新动画
watch(currentPlan, (newPlan, oldPlan) => {
  if (newPlan && newPlan !== oldPlan) {
    // 计划更新动画
    gsap.fromTo('.plan-content',
      { scale: 0.95, opacity: 0.5 },
      { scale: 1, opacity: 1, duration: 0.2, ease: 'power2.out' }
    )
  }
}, { deep: true })
</script>

<template>
  <!-- 固定侧边栏模式 -->
  <transition name="sidebar-slide">
    <div
      ref="sidebarRef"
      class="plan-sidebar"
    >
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <div class="header-content">
          <div class="header-title">
            <span>执行计划</span>
          </div>
          <div class="header-actions">
            
            <a-button
              type="text"
              size="small"
              @click="minimizeToBall"
              class="action-btn"
              title="缩为状态球"
            >
              <template #icon>
                <MinusOutlined />
              </template>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 计划内容区域 -->
      <div class="plan-content">
        <!-- 无计划状态 -->
        <div v-if="!currentPlan" class="no-plan-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">暂无执行计划</div>
          <div class="empty-desc">
            当ReAct+开始执行复杂任务时，<br/>
            这里将显示详细的执行计划
          </div>
        </div>

        <!-- 有计划状态 -->
        <div v-else class="plan-overview">
          <!-- 计划概览 -->
          <div class="plan-header">
            <div class="plan-goal">
              <div class="goal-label">目标</div>
              <div class="goal-text">{{ currentPlan.goal }}</div>
            </div>

            <div class="plan-meta">
              <div class="meta-item">
                <span class="meta-label">状态:</span>
                <span
                  class="meta-value status-badge"
                  :style="{ backgroundColor: getStatusColor(currentPlan.status) }"
                >
                  {{ getPlanStatusText(currentPlan.status) }}
                </span>
              </div>

              <div class="meta-item">
                <span class="meta-label">进度:</span>
                <span class="meta-value">{{ planProgress }}%</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">阶段:</span>
                <span class="meta-value">
                  {{ currentPlan.phases.length }} 个阶段
                </span>
              </div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-section">
            <a-progress
              :percent="planProgress"
              :stroke-color="getStatusColor(currentPlan.status)"
              :trail-color="'rgba(255,255,255,0.1)'"
              :stroke-width="6"
              :show-info="false"
            />
          </div>

          <!-- 当前执行阶段 -->
          <div v-if="currentPhase" class="current-phase">
            <div class="current-phase-label">当前阶段</div>
            <div class="current-phase-card">
              <div class="phase-title">{{ currentPhase.title }}</div>
              <div class="phase-desc">{{ currentPhase.description }}</div>
              <div class="phase-meta">
                <span
                  class="phase-status"
                  :class="`status-${currentPhase.status?.toLowerCase()}`"
                >
                  {{ currentPhase.status === PlanPhaseStatus.RUNNING ? '执行中' : '待执行' }}
                </span>
                <span
                  v-if="currentPhase.isParallel"
                  class="phase-parallel"
                >
                  并行
                </span>
              </div>
            </div>
          </div>

          <!-- 完整计划可视化 -->
          <PlanVisualization :plan="currentPlan" />
        </div>
      </div>


    </div>
  </transition>

</template>

<style scoped lang="scss">
@use '@/styles/variables.scss';
@use "sass:color";

.plan-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: linear-gradient(135deg, $plan-bg-primary 0%, $plan-bg-secondary 100%);
  backdrop-filter: blur(20px);
  border-left: 1px solid $plan-border-light;
  box-shadow: -4px 0 20px rgba(0,0,0,0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  pointer-events: auto;
}


.sidebar-header {
  padding: $space-lg;
  border-bottom: 1px solid $plan-border-light;
  background: linear-gradient(135deg, $plan-bg-active 0%, rgba($primary-color-50, 0.8) 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: $space-sm;
  font-size: 16px;
  font-weight: 600;
  color: $text-color;
}

.title-icon {
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: $space-xs;
}

.action-btn {
  color: $muted-color;
  border: none;
  padding: $space-xs;
  height: auto;
  min-width: auto;
}

.action-btn:hover {
  color: $primary-color-500;
  background: rgba($primary-color-500, 0.1);
}

.plan-content {
  flex: 1;
  padding: $space-lg;
  overflow-y: auto;
  /* 防止滚动条挤压布局 */
  scrollbar-gutter: stable;
  @include pretty-scrollbar;
}

/* 无计划状态样式 */
.no-plan-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: $muted-color;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: $space-lg;
  opacity: 0.5;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: $space-sm;
  color: $text-color;
}

.empty-desc {
  font-size: 14px;
  line-height: 1.5;
  color: color.adjust($muted-color, $lightness: 10%);
}

/* 计划概览样式 */
.plan-overview {
  display: flex;
  flex-direction: column;
  gap: $space-xl;
}

.plan-header {
  @include plan-card-base;
}

.plan-goal {
  margin-bottom: $space-md;
}

.goal-label {
  font-size: 12px;
  color: $muted-color;
  margin-bottom: $space-xs;
  font-weight: 500;
}

.goal-text {
  font-size: 15px;
  font-weight: 600;
  color: $text-color;
  line-height: 1.4;
}

.plan-meta {
  display: flex;
  flex-direction: column;
  gap: $space-sm;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 13px;
  color: $muted-color;
}

.meta-value {
  font-size: 13px;
  font-weight: 500;
  color: $text-color;
}

.status-badge {
  color: white;
  padding: 2px $space-sm;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.progress-section {
  @include plan-card-base;
}

/* 当前阶段样式 */
.current-phase {
  background: linear-gradient(135deg, $plan-bg-active 0%, rgba($primary-color-50, 0.9) 100%);
  border-radius: 12px;
  padding: $space-lg;
  border: 1px solid rgba($primary-color-500, 0.1);
}

.current-phase-label {
  font-size: 12px;
  color: $primary-color-500;
  margin-bottom: $space-sm;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-phase-card {
  background: rgba(255,255,255,0.8);
  border-radius: 8px;
  padding: $space-md;
  border: 1px solid rgba($primary-color-500, 0.1);
}

.phase-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-color;
  margin-bottom: $space-sm;
}

.phase-desc {
  font-size: 13px;
  color: color.adjust($text-color, $lightness: 20%);
  line-height: 1.4;
  margin-bottom: $space-sm;
}

.phase-meta {
  display: flex;
  gap: $space-sm;
  align-items: center;
}

.phase-status {
  font-size: 11px;
  padding: 2px $space-xs;
  border-radius: 8px;
  font-weight: 500;
}

.status-running {
  background: $plan-status-running;
  color: white;
}

.status-todo {
  background: $plan-status-todo-bg;
  color: $muted-color;
}

.phase-parallel {
  font-size: 11px;
  background: $jelly-orange-deep;
  color: white;
  padding: 2px $space-xs;
  border-radius: 8px;
  font-weight: 500;
}

.progress-ring {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: $text-color;
}

.phase-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: $primary-color-500;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}


.empty-indicator {
  font-size: 32px;
  opacity: 0.3;
}

/* 侧边栏过渡动画 */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.sidebar-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.sidebar-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

</style>