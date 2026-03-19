<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chatStore'
import { PlanStatus, PlanPhaseStatus } from '@/types/events'
import { getRandomGlassColor, getRandomTooltipColor } from '@/utils/colorUtils'
import { gsap } from 'gsap'
import PlanVisualization from './PlanVisualization.vue'

import { Button as AButton, Progress } from 'ant-design-vue'
import { MinusOutlined } from '@ant-design/icons-vue';
const { t } = useI18n()
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
    [PlanStatus.PLANNING]: t('plan.status.planning'),
    [PlanStatus.EXECUTING]: t('plan.status.executing'),
    [PlanStatus.COMPLETED]: t('plan.status.completed'),
    [PlanStatus.PAUSED]: t('plan.status.paused'),
    [PlanStatus.FAILED]: t('plan.status.failed')
  }
  return statusMap[status || PlanStatus.PLANNING] || t('plan.status.unknown')
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

onUnmounted(() => {
  gsap.killTweensOf('.plan-content')
})
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
            <span class="text-slate-800 dark:text-zinc-200">{{ t('plan.sidebar.title') }}</span>
          </div>
          <div class="header-actions">
            
            <AButton
              type="text"
              size="small"
              class="action-btn"
              :title="t('plan.sidebar.minimizeToBall')"
              @click="minimizeToBall"
            >
              <template #icon>
                <MinusOutlined />
              </template>
            </AButton>
          </div>
        </div>
      </div>

      <!-- 计划内容区域 -->
      <div class="plan-content">
        <!-- 无计划状态 -->
        <div v-if="!currentPlan" class="no-plan-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title dark:text-zinc-200">{{ t('plan.sidebar.emptyTitle') }}</div>
          <div class="empty-desc dark:text-zinc-400">
            {{ t('plan.sidebar.emptyDesc') }}
          </div>
        </div>

        <!-- 有计划状态 -->
        <div v-else class="plan-overview">
          <!-- 计划概览 -->
          <div class="plan-header">
            <div class="plan-goal">
              <div class="goal-label">{{ t('plan.sidebar.goalLabel') }}</div>
              <div class="goal-text dark:text-zinc-200">{{ currentPlan.goal }}</div>
            </div>

            <div class="plan-meta">
              <div class="meta-item">
                <span class="meta-label">{{ t('plan.sidebar.statusLabel') }}</span>
                <span
                  class="meta-value status-badge"
                  :style="{ backgroundColor: getStatusColor(currentPlan.status) }"
                >
                  {{ getPlanStatusText(currentPlan.status) }}
                </span>
              </div>

              <div class="meta-item">
                <span class="meta-label">{{ t('plan.sidebar.progressLabel') }}</span>
                <span class="meta-value">{{ planProgress }}%</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">{{ t('plan.sidebar.phaseLabel') }}</span>
                <span class="meta-value">
                  {{ t('plan.sidebar.phaseCount', { count: currentPlan.phases.length }) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-section">
            <Progress
              :percent="planProgress"
              :stroke-color="getStatusColor(currentPlan.status)"
              :trail-color="'rgba(255,255,255,0.1)'"
              :stroke-width="6"
              :show-info="false"
            />
          </div>

          <!-- 当前执行阶段 -->
          <div v-if="currentPhase" class="current-phase">
            <div class="current-phase-label">{{ t('plan.sidebar.currentPhase') }}</div>
            <div class="current-phase-card">
              <div class="phase-title dark:text-zinc-200">{{ currentPhase.title }}</div>
              <div class="phase-desc dark:text-zinc-400">{{ currentPhase.description }}</div>
              <div class="phase-meta">
                <span
                  class="phase-status"
                  :class="`status-${currentPhase.status?.toLowerCase()}`"
                >
                  {{ currentPhase.status === PlanPhaseStatus.RUNNING ? t('plan.phaseStatus.running') : t('plan.phaseStatus.todo') }}
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

  /* Dark mode support */
  :root.dark & {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
    border-left-color: rgba(255, 255, 255, 0.1);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
  }
}


.sidebar-header {
  padding: $space-lg;
  border-bottom: 1px solid $plan-border-light;
  background: linear-gradient(135deg, $plan-bg-active 0%, rgba($primary-color-50, 0.8) 100%);

  /* Dark mode support */
  :root.dark & {
    border-bottom-color: rgba(255, 255, 255, 0.1);
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  }
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
  font-size: 1rem;
  font-weight: 600;
  color: $text-color;
}

.title-icon {
  font-size: 1.125rem;
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

  /* Dark mode support */
  :root.dark & {
    color: rgba(148, 163, 184, 0.8);
  }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: $space-lg;
  opacity: 0.5;
}

.empty-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: $space-sm;
  color: $text-color;

  /* Dark mode support */
  :root.dark & {
    color: #e2e8f0;
  }
}

.empty-desc {
  font-size: 0.875rem;
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

  /* Dark mode support */
  :root.dark & {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.plan-goal {
  margin-bottom: $space-md;
}

.goal-label {
  font-size: 0.75rem;
  color: $muted-color;
  margin-bottom: $space-xs;
  font-weight: 500;

  /* Dark mode support */
  :root.dark & {
    color: #94a3b8;
  }
}

.goal-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: $text-color;
  line-height: 1.4;

  /* Dark mode support */
  :root.dark & {
    color: #e2e8f0;
  }
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
  font-size: 0.8125rem;
  color: $muted-color;

  /* Dark mode support */
  :root.dark & {
    color: #94a3b8;
  }
}

.meta-value {
  font-size: 0.8125rem;
  font-weight: 500;
  color: $text-color;

  /* Dark mode support */
  :root.dark & {
    color: #e2e8f0;
  }
}

.status-badge {
  color: white;
  padding: 2px $space-sm;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.progress-section {
  @include plan-card-base;

  /* Dark mode support */
  :root.dark & {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 当前阶段样式 */
.current-phase {
  background: linear-gradient(135deg, $plan-bg-active 0%, rgba($primary-color-50, 0.9) 100%);
  border-radius: 12px;
  padding: $space-lg;
  border: 1px solid rgba($primary-color-500, 0.1);

  /* Dark mode support */
  :root.dark & {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-color: rgba(107, 154, 152, 0.3);
  }
}

.current-phase-label {
  font-size: 0.75rem;
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

  /* Dark mode support */
  :root.dark & {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(107, 154, 152, 0.2);
  }
}

.phase-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: $text-color;
  margin-bottom: $space-sm;

  /* Dark mode support */
  :root.dark & {
    color: #e2e8f0;
  }
}

.phase-desc {
  font-size: 0.8125rem;
  color: color.adjust($text-color, $lightness: 20%);
  line-height: 1.4;
  margin-bottom: $space-sm;

  /* Dark mode support */
  :root.dark & {
    color: #94a3b8;
  }
}

.phase-meta {
  display: flex;
  gap: $space-sm;
  align-items: center;
}

.phase-status {
  font-size: 0.75rem;
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
  font-size: 0.75rem;
  font-weight: 600;
  color: $text-color;

  /* Dark mode support */
  :root.dark & {
    color: #e2e8f0;
  }
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
  font-size: 0.75rem;
  font-weight: 600;
}


.empty-indicator {
  font-size: 2rem;
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