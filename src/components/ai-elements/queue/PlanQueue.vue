<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chatStore'
import { PlanPhaseStatus, TaskPhaseStatus } from '@/types/events'
import { gsap } from 'gsap'
import { CheckCircleOutlined, LoadingOutlined, ClockCircleOutlined, CloseCircleOutlined, UnorderedListOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()
const chat = useChatStore()
const route = useRoute()

// 当前会话ID
const sessionId = computed(() => route.params.sessionId as string || chat.currentEditingSession.id)

// 当前计划数据
const currentPlan = computed(() => chat.getPlan(sessionId.value))

// 是否展开
const isExpanded = ref(false)

// 计算统计信息
const stats = computed(() => {
  if (!currentPlan.value?.phases) {
    return { total: 0, completed: 0, running: 0, todo: 0, failed: 0 }
  }

  const phases = currentPlan.value.phases
  return {
    total: phases.length,
    completed: phases.filter(p => p.status === PlanPhaseStatus.COMPLETED).length,
    running: phases.filter(p => p.status === PlanPhaseStatus.RUNNING).length,
    todo: phases.filter(p => p.status === PlanPhaseStatus.TODO).length,
    failed: phases.filter(p => p.status === PlanPhaseStatus.FAILED).length
  }
})

// 当前执行的任务
const currentTask = computed(() => {
  if (!currentPlan.value?.phases) return null
  return currentPlan.value.phases.find(p => p.status === PlanPhaseStatus.RUNNING)
})

// 进度百分比
const progressPercent = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.completed / stats.value.total) * 100)
})

// 获取状态图标
const getStatusIcon = (status?: PlanPhaseStatus) => {
  switch (status) {
    case PlanPhaseStatus.COMPLETED:
      return CheckCircleOutlined
    case PlanPhaseStatus.RUNNING:
      return LoadingOutlined
    case PlanPhaseStatus.FAILED:
      return CloseCircleOutlined
    default:
      return ClockCircleOutlined
  }
}

// 获取状态颜色
const getStatusColor = (status?: PlanPhaseStatus) => {
  switch (status) {
    case PlanPhaseStatus.COMPLETED:
      return '#52c41a'
    case PlanPhaseStatus.RUNNING:
      return '#1677ff'
    case PlanPhaseStatus.FAILED:
      return '#ff4d4f'
    default:
      return '#8c8c8c'
  }
}

// 获取状态文本（a11y：不能仅靠颜色区分状态）
const getStatusText = (status?: PlanPhaseStatus) => {
  switch (status) {
    case PlanPhaseStatus.COMPLETED:
      return t('aiElements.planQueue.statusCompleted')
    case PlanPhaseStatus.RUNNING:
      return t('aiElements.planQueue.statusRunning')
    case PlanPhaseStatus.FAILED:
      return t('aiElements.planQueue.statusFailed')
    default:
      return t('aiElements.planQueue.statusTodo')
  }
}

// 切换展开状态
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 监听计划变化，添加动画
watch(currentPlan, (newPlan, oldPlan) => {
  if (newPlan && newPlan !== oldPlan) {
    gsap.fromTo('.plan-queue-container',
      { scale: 0.98, opacity: 0.8 },
      { scale: 1, opacity: 1, duration: 0.2, ease: 'power2.out' }
    )
  }
}, { deep: true })

onUnmounted(() => {
  gsap.killTweensOf('.plan-queue-container')
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="currentPlan && stats.total > 0" class="plan-queue-container">
      <!-- 折叠状态：显示简要信息 -->
      <div
        class="plan-queue-header"
        role="button"
        tabindex="0"
        :aria-expanded="isExpanded"
        :aria-label="t('aiElements.planQueue.headerAriaLabel', { completed: stats.completed, total: stats.total, detail: isExpanded ? t('aiElements.planQueue.headerExpanded') : t('aiElements.planQueue.headerCollapsed') })"
        @click="toggleExpand"
        @keydown.enter.prevent="toggleExpand"
        @keydown.space.prevent="toggleExpand"
      >
        <div class="header-left">
          <UnorderedListOutlined class="header-icon" aria-hidden="true" />
          <span class="header-title">{{ t('aiElements.planQueue.title') }}</span>
          <span class="header-stats">
            {{ stats.completed }}/{{ stats.total }}
          </span>
        </div>

        <div class="header-right">
          <!-- 进度条 -->
          <div
            class="mini-progress"
            role="progressbar"
            :aria-valuenow="progressPercent"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="t('aiElements.planQueue.progressAriaLabel', { percent: progressPercent })"
          >
            <div class="mini-progress-bar" :style="{ width: `${progressPercent}%` }"></div>
          </div>

          <!-- 当前任务提示 -->
          <span v-if="currentTask" class="current-task-hint" role="status">
            <LoadingOutlined spin class="running-icon" aria-hidden="true" />
            {{ currentTask.title }}
          </span>

          <!-- 展开/折叠图标 -->
          <span class="expand-icon" :class="{ expanded: isExpanded }" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>
      </div>

      <!-- 展开状态：显示任务列表 -->
      <transition name="expand">
        <div v-if="isExpanded" class="plan-queue-content">
          <!-- 目标 -->
          <div class="plan-goal">
            <span class="goal-label">{{ t('aiElements.planQueue.goalLabel') }}</span>
            <span class="goal-text">{{ currentPlan.goal }}</span>
          </div>

          <!-- 任务列表 -->
          <div class="task-list" role="list" :aria-label="t('aiElements.planQueue.taskListAriaLabel')">
            <div
              v-for="(phase, index) in currentPlan.phases"
              :key="phase.id || index"
              class="task-item"
              role="listitem"
              :aria-label="`${phase.title} - ${getStatusText(phase.status)}`"
              :class="{
                'is-running': phase.status === PlanPhaseStatus.RUNNING,
                'is-completed': phase.status === PlanPhaseStatus.COMPLETED,
                'is-failed': phase.status === PlanPhaseStatus.FAILED
              }"
            >
              <div class="task-indicator" aria-hidden="true">
                <component
                  :is="getStatusIcon(phase.status)"
                  :style="{ color: getStatusColor(phase.status) }"
                  :spin="phase.status === PlanPhaseStatus.RUNNING"
                />
              </div>
              <div class="task-content">
                <div class="task-title">{{ phase.title }}</div>
                <span class="sr-only">{{ getStatusText(phase.status) }}</span>
                <div v-if="phase.description && phase.status === PlanPhaseStatus.RUNNING" class="task-desc">
                  {{ phase.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss';

/* ── PlanQueue 局部 Design Tokens ── */
.plan-queue-container {
  /* 容器 */
  --pq-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
  --pq-border: rgba(107, 154, 152, 0.15);
  --pq-shadow: rgba(0, 0, 0, 0.06);

  /* 主色交互 */
  --pq-primary-05: rgba(107, 154, 152, 0.05);
  --pq-primary-10: rgba(107, 154, 152, 0.1);
  --pq-primary-15: rgba(107, 154, 152, 0.15);

  /* 文本 */
  --pq-text: #{$text-color};
  --pq-muted: #{$muted-color};

  /* 任务状态 */
  --pq-task-bg: rgba(255, 255, 255, 0.6);
  --pq-running-bg: rgba(22, 119, 255, 0.05);
  --pq-running-border: rgba(22, 119, 255, 0.2);
  --pq-running-icon: #1677ff;
  --pq-failed-bg: rgba(255, 77, 79, 0.05);
  --pq-failed-border: rgba(255, 77, 79, 0.2);

  background: var(--pq-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--pq-border);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--pq-shadow);
}

.plan-queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--pq-primary-05);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: $primary-color-500;
  font-size: 0.875rem;
}

.header-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--pq-text);
}

.header-stats {
  font-size: 0.75rem;
  color: var(--pq-muted);
  background: var(--pq-primary-10);
  padding: 2px 8px;
  border-radius: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-progress {
  width: 60px;
  height: 4px;
  background: var(--pq-primary-15);
  border-radius: 2px;
  overflow: hidden;
}

.mini-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, $primary-color-500, $primary-color-400);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.current-task-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--pq-muted);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.running-icon {
  color: var(--pq-running-icon);
  font-size: 0.75rem;
}

.expand-icon {
  color: var(--pq-muted);
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;

  &.expanded {
    transform: rotate(180deg);
  }
}

.plan-queue-content {
  padding: 0 14px 14px;
  border-top: 1px solid var(--pq-primary-10);
}

.plan-goal {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 0;
  font-size: 0.75rem;
}

.goal-label {
  color: var(--pq-muted);
  flex-shrink: 0;
}

.goal-text {
  color: var(--pq-text);
  font-weight: 500;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: var(--pq-task-bg);
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &.is-running {
    background: var(--pq-running-bg);
    border-color: var(--pq-running-border);
  }

  &.is-completed {
    opacity: 0.7;

    .task-title {
      text-decoration: line-through;
      color: var(--pq-muted);
    }
  }

  &.is-failed {
    background: var(--pq-failed-bg);
    border-color: var(--pq-failed-border);
  }
}

.task-indicator {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 0.8125rem;
  color: var(--pq-text);
  line-height: 1.4;
}

.task-desc {
  font-size: 0.75rem;
  color: var(--pq-muted);
  margin-top: 2px;
  line-height: 1.3;
}

// 动画
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>

<style lang="scss">
/* Dark mode — PlanQueue Token 覆写 */
.dark {
  .plan-queue-container {
    --pq-bg: linear-gradient(135deg, rgba(30, 42, 46, 0.95) 0%, rgba(24, 36, 40, 0.95) 100%);
    --pq-border: rgba(107, 154, 152, 0.2);
    --pq-shadow: rgba(0, 0, 0, 0.25);
    --pq-primary-05: rgba(107, 154, 152, 0.08);
    --pq-primary-10: rgba(107, 154, 152, 0.15);
    --pq-primary-15: rgba(107, 154, 152, 0.2);
    --pq-text: #e0e7eb;
    --pq-muted: #8a9caa;
    --pq-task-bg: rgba(255, 255, 255, 0.04);
    --pq-running-bg: rgba(22, 119, 255, 0.1);
    --pq-running-border: rgba(77, 159, 255, 0.3);
    --pq-running-icon: #4d9fff;
    --pq-failed-bg: rgba(255, 77, 79, 0.1);
    --pq-failed-border: rgba(255, 77, 79, 0.3);
  }

  .header-stats {
    color: #a0b0b8;
  }

  .current-task-hint {
    color: #a0b0b8;
  }

  .expand-icon {
    color: #8a9caa;
  }

  .goal-label {
    color: #8a9caa;
  }

  .task-item.is-completed {
    opacity: 0.6;

    .task-title {
      color: #6b7e88;
    }
  }
}
</style>
