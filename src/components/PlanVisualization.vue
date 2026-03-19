<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { PlanData, PlanPhase, PlanPhaseStatus } from '@/types/events'
import { useChatStore } from '@/stores/chatStore'
import { gsap } from 'gsap'
import { Button as AButton } from 'ant-design-vue'
import PlanPhaseCard from './PlanPhaseCard.vue'

interface Props {
  plan: PlanData
}

const props = defineProps<Props>()

const { t } = useI18n()
const chat = useChatStore()
const route = useRoute()
const sessionId = computed(() => route.params.sessionId as string || chat.currentEditingSession.id)

// 展示模式：'timeline' | 'grid' | 'compact'
const viewMode = ref<'timeline' | 'grid' | 'compact'>('timeline')

// 计算阶段状态统计
const phaseStats = computed(() => {
  const phases = props.plan.phases
  return {
    total: phases.length,
    todo: phases.filter(p => p.status === PlanPhaseStatus.TODO).length,
    running: phases.filter(p => p.status === PlanPhaseStatus.RUNNING).length,
    completed: phases.filter(p => p.status === PlanPhaseStatus.COMPLETED).length,
    failed: phases.filter(p => p.status === PlanPhaseStatus.FAILED).length
  }
})

// 计算当前阶段索引
const currentPhaseIndex = computed(() => {
  return props.plan.phases.findIndex(phase =>
    phase.status === PlanPhaseStatus.RUNNING ||
    (phase.status === PlanPhaseStatus.TODO &&
     !props.plan.phases.slice(0, phase.index).some(p => p.status === PlanPhaseStatus.TODO))
  )
})

// 处理阶段点击
const handlePhaseClick = (phase: PlanPhase) => {
  // 这里可以添加阶段详情查看逻辑
  console.log('Phase clicked:', phase)
}

// 处理阶段编辑
const handlePhaseEdit = (phase: PlanPhase, updates: Partial<PlanPhase>) => {
  if (phase.id && sessionId.value) {
    chat.updatePhase(sessionId.value, phase.id, updates)
  }
}

// 切换视图模式
const switchViewMode = (mode: 'timeline' | 'grid' | 'compact') => {
  viewMode.value = mode

  // 视图切换动画
  gsap.fromTo('.phases-container',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
  )
}

// 获取连接线路径
const getConnectionPath = (fromIndex: number, toIndex: number) => {
  const startX = fromIndex * 120 + 60
  const endX = toIndex * 120 + 60
  const startY = 40
  const endY = 40

  // 连接线：带箭头的直线
  return `M ${startX} ${startY} L ${endX} ${endY}`
}

// 监听plan变化，触发动画
watch(() => props.plan, (newPlan, oldPlan) => {
  if (newPlan && oldPlan && newPlan !== oldPlan) {
    // 计划更新动画
    gsap.fromTo('.phase-item',
      { scale: 0.95, opacity: 0.5 },
      { scale: 1, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
    )
  }
}, { deep: true, immediate: true })

onMounted(() => {
  // 初始入场动画
  gsap.fromTo('.phase-item',
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out', delay: 0.1 }
  )
})

onUnmounted(() => {
  gsap.killTweensOf('.phase-item')
  gsap.killTweensOf('.phases-container')
})
</script>

<template>
  <div class="plan-visualization">
    <!-- 视图控制栏 -->
    <div class="view-controls">
      <div class="control-group">
        <AButton
          type="text"
          size="small"
          :class="{ active: viewMode === 'timeline' }"
          class="view-btn"
          @click="switchViewMode('timeline')"
        >
          <template #icon></template>
          {{ t('plan.visualization.timeline') }}
        </AButton>
        <AButton
          type="text"
          size="small"
          :class="{ active: viewMode === 'grid' }"
          class="view-btn"
          @click="switchViewMode('grid')"
        >
          <template #icon>⚏</template>
          {{ t('plan.visualization.grid') }}
        </AButton>
        <AButton
          type="text"
          size="small"
          :class="{ active: viewMode === 'compact' }"
          class="view-btn"
          @click="switchViewMode('compact')"
        >
          <template #icon>☰</template>
          {{ t('plan.visualization.compact') }}
        </AButton>
      </div>
      <div class="stats-summary">
        <span class="stat-item completed">{{ phaseStats.completed }}</span>
        <span class="stat-divider">/</span>
        <span class="stat-item total">{{ phaseStats.total }}</span>
      </div>
    </div>

    <!-- 阶段统计 -->
    <div class="phase-stats">
      <div class="stat-badge todo">
        <span class="badge-dot"></span>
        {{ t('plan.phaseStatus.todo') }} {{ phaseStats.todo }}
      </div>
      <div class="stat-badge running">
        <span class="badge-dot"></span>
        {{ t('plan.phaseStatus.running') }} {{ phaseStats.running }}
      </div>
      <div class="stat-badge completed">
        <span class="badge-dot"></span>
        {{ t('plan.phaseStatus.completed') }} {{ phaseStats.completed }}
      </div>
      <div v-if="phaseStats.failed > 0" class="stat-badge failed">
        <span class="badge-dot"></span>
        {{ t('plan.phaseStatus.failed') }} {{ phaseStats.failed }}
      </div>
    </div>

    <!-- 阶段列表 -->
    <div class="phases-container" :class="`view-${viewMode}`">
      <!-- 时间线视图 -->
      <div v-if="viewMode === 'timeline'" class="timeline-view">
        <div class="timeline-line"></div>
        <div
          v-for="(phase, index) in plan.phases"
          :key="phase.id || index"
          class="timeline-item phase-item"
          :class="{
            current: currentPhaseIndex === index,
            completed: phase.status === PlanPhaseStatus.COMPLETED,
            running: phase.status === PlanPhaseStatus.RUNNING,
            failed: phase.status === PlanPhaseStatus.FAILED
          }"
        >
          <div class="timeline-marker">
            <div class="marker-number">{{ index + 1 }}</div>
          </div>
          <div class="timeline-content">
            <PlanPhaseCard
              :phase="phase"
              :is-current="currentPhaseIndex === index"
              @click="handlePhaseClick(phase)"
              @edit="(updates) => handlePhaseEdit(phase, updates)"
            />
          </div>
        </div>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div
          v-for="(phase, index) in plan.phases"
          :key="phase.id || index"
          class="grid-item phase-item"
          :class="{
            current: currentPhaseIndex === index,
            completed: phase.status === PlanPhaseStatus.COMPLETED,
            running: phase.status === PlanPhaseStatus.RUNNING,
            failed: phase.status === PlanPhaseStatus.FAILED
          }"
        >
          <PlanPhaseCard
            :phase="phase"
            :is-current="currentPhaseIndex === index"
            @click="handlePhaseClick(phase)"
            @edit="(updates) => handlePhaseEdit(phase, updates)"
          />
        </div>
      </div>

      <!-- 紧凑视图 -->
      <div v-else class="compact-view">
        <div
          v-for="(phase, index) in plan.phases"
          :key="phase.id || index"
          class="compact-item phase-item"
          :class="{
            current: currentPhaseIndex === index,
            completed: phase.status === PlanPhaseStatus.COMPLETED,
            running: phase.status === PlanPhaseStatus.RUNNING,
            failed: phase.status === PlanPhaseStatus.FAILED
          }"
          @click="handlePhaseClick(phase)"
        >
          <div class="compact-marker">
            <span class="compact-number">{{ index + 1 }}</span>
          </div>
          <div class="compact-content">
            <div class="compact-title">{{ phase.title }}</div>
            <div class="compact-meta">
              <span
                class="compact-status"
                :class="`status-${phase.status?.toLowerCase()}`"
              >
                {{ phase.status === PlanPhaseStatus.RUNNING ? t('plan.phaseStatus.running') :
                   phase.status === PlanPhaseStatus.COMPLETED ? t('plan.phaseStatus.completedShort') :
                   phase.status === PlanPhaseStatus.FAILED ? t('plan.phaseStatus.failed') : t('plan.phaseStatus.todo') }}
              </span>
            </div>
          </div>
          <div class="compact-actions">
            <AButton type="text" size="small">
              <template #icon>⋯</template>
            </AButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-visualization {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 视图控制栏 */
.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.control-group {
  display: flex;
  gap: 2px;
}

.view-btn {
  border-radius: 6px;
  font-size: 0.75rem;
  padding: 4px 8px;
  color: var(--muted-foreground);
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-btn.active {
  background: var(--color-primary-500);
  color: white;
}

.stats-summary {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.stat-item.completed {
  color: var(--ant-color-success, #52c41a);
}

.stat-item.total {
  color: var(--muted-foreground);
}

.stat-divider {
  color: var(--border);
  font-weight: 400;
}

/* 阶段统计 */
.phase-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255,255,255,0.8);
  border: 1px solid var(--border);
  font-weight: 500;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.stat-badge.todo .badge-dot {
  background: var(--color-slate-300, #d9d9d9);
}

.stat-badge.running .badge-dot {
  background: var(--ant-color-success, #52c41a);
}

.stat-badge.completed .badge-dot {
  background: var(--color-emerald-500, #00b96b);
}

.stat-badge.failed .badge-dot {
  background: var(--destructive, #ff4d4f);
}

/* 时间线视图 */
.timeline-view {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-left: 32px;
}

.timeline-line {
  position: absolute;
  left: 16px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: linear-gradient(to bottom, var(--color-primary-75), var(--color-primary-300), var(--color-primary-75));
  border-radius: 1px;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.timeline-marker {
  position: absolute;
  left: -32px;
  top: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-slate-100, #f0f0f0), var(--color-slate-300, #d9d9d9));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid white;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.1));
  z-index: 2;
}

.marker-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.timeline-item.current .timeline-marker {
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-300));
  animation: pulse 2s infinite;
}

.timeline-item.current .marker-number {
  color: white;
}

.timeline-item.completed .timeline-marker {
  background: linear-gradient(135deg, var(--ant-color-success, #52c41a), var(--color-emerald-400, #95de64));
}

.timeline-item.completed .marker-number {
  color: white;
}

.timeline-item.failed .timeline-marker {
  background: linear-gradient(135deg, var(--destructive, #ff4d4f), var(--color-red-400, #ff7875));
}

.timeline-item.failed .marker-number {
  color: white;
}

.timeline-content {
  flex: 1;
}

/* 网格视图 */
.grid-view {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.grid-item {
  transition: all 0.3s ease;
}

.grid-item.current {
  transform: scale(1.02);
}

/* 紧凑视图 */
.compact-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.compact-item:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
}

.compact-item.current {
  background: linear-gradient(135deg, rgba(240,248,255,0.9) 0%, rgba(245,250,255,0.9) 100%);
  border-color: var(--color-primary-500);
}

.compact-item.completed {
  background: linear-gradient(135deg, rgba(246,255,237,0.9) 0%, rgba(251,255,245,0.9) 100%);
  border-color: var(--ant-color-success, #52c41a);
}

.compact-item.failed {
  background: linear-gradient(135deg, rgba(255,241,240,0.9) 0%, rgba(255,247,247,0.9) 100%);
  border-color: var(--destructive, #ff4d4f);
}

.compact-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-slate-100, #f0f0f0), var(--color-slate-300, #d9d9d9));
  flex-shrink: 0;
}

.compact-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-foreground);
}

.compact-item.current .compact-marker {
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-300));
}

.compact-item.current .compact-number {
  color: white;
}

.compact-item.completed .compact-marker {
  background: linear-gradient(135deg, var(--ant-color-success, #52c41a), var(--color-emerald-400, #95de64));
}

.compact-item.completed .compact-number {
  color: white;
}

.compact-item.failed .compact-marker {
  background: linear-gradient(135deg, var(--destructive, #ff4d4f), var(--color-red-400, #ff7875));
}

.compact-item.failed .compact-number {
  color: white;
}

.compact-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compact-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--foreground);
  line-height: 1.3;
}

.compact-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.compact-status {
  font-size: 0.75rem;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.compact-status.status-todo {
  background: var(--color-slate-100, #f0f0f0);
  color: var(--muted-foreground);
}

.compact-status.status-running {
  background: var(--ant-color-success, #52c41a);
  color: white;
}

.compact-status.status-completed {
  background: var(--color-emerald-500, #00b96b);
  color: white;
}

.compact-status.status-failed {
  background: var(--destructive, #ff4d4f);
  color: white;
}

.compact-actions {
  flex-shrink: 0;
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(from var(--color-primary-500) r g b / 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgb(from var(--color-primary-500) r g b / 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgb(from var(--color-primary-500) r g b / 0);
  }
}
</style>

<style lang="scss">
/* Dark mode overrides for PlanVisualization */
.dark {
  /* View controls bar */
  .plan-visualization .view-controls {
    background: linear-gradient(135deg, rgba(30, 42, 46, 0.9) 0%, rgba(26, 32, 44, 0.9) 100%);
    border-color: rgba(255, 255, 255, 0.08);
  }

  /* View mode buttons */
  .plan-visualization .view-btn {
    color: rgba(224, 231, 235, 0.6);

    &.active {
      color: white;
    }
  }

  /* Stats summary text */
  .plan-visualization .stat-divider {
    color: rgba(255, 255, 255, 0.15);
  }

  /* Phase stat badges */
  .plan-visualization .stat-badge {
    background: rgba(30, 42, 46, 0.8);
    border-color: rgba(255, 255, 255, 0.08);
    color: rgba(224, 231, 235, 0.85);

    &.running .badge-dot {
      background: #5fd35f;
    }

    &.completed .badge-dot {
      background: #10d094;
    }

    &.failed .badge-dot {
      background: #ff6b6b;
    }

    &.todo .badge-dot {
      background: #52525b;
    }
  }

  /* Timeline line */
  .plan-visualization .timeline-line {
    background: linear-gradient(
      to bottom,
      rgba(from var(--color-primary-500) r g b / 0.15),
      rgba(from var(--color-primary-500) r g b / 0.4),
      rgba(from var(--color-primary-500) r g b / 0.15)
    );
  }

  /* Timeline marker (default / todo state) */
  .plan-visualization .timeline-marker {
    background: linear-gradient(135deg, #2d3748, #3f3f46);
    border-color: #1a1a2e;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  }

  .plan-visualization .marker-number {
    color: rgba(224, 231, 235, 0.7);
  }

  /* Timeline marker states */
  .plan-visualization .timeline-item.completed .timeline-marker {
    background: linear-gradient(135deg, #10d094, #5fd35f);
  }

  .plan-visualization .timeline-item.failed .timeline-marker {
    background: linear-gradient(135deg, #ff6b6b, #ff9b9b);
  }

  /* Compact item backgrounds */
  .plan-visualization .compact-item {
    background: linear-gradient(135deg, rgba(30, 42, 46, 0.9) 0%, rgba(26, 32, 44, 0.9) 100%);
    border-color: rgba(255, 255, 255, 0.08);

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }

    &.current {
      background: linear-gradient(135deg, rgba(30, 50, 70, 0.9) 0%, rgba(26, 42, 60, 0.9) 100%);
      border-color: var(--color-primary-500);
    }

    &.completed {
      background: linear-gradient(135deg, rgba(16, 52, 40, 0.9) 0%, rgba(20, 60, 46, 0.9) 100%);
      border-color: #10d094;
    }

    &.failed {
      background: linear-gradient(135deg, rgba(60, 20, 20, 0.9) 0%, rgba(50, 26, 26, 0.9) 100%);
      border-color: #ff6b6b;
    }
  }

  /* Compact marker (default / todo state) */
  .plan-visualization .compact-marker {
    background: linear-gradient(135deg, #2d3748, #3f3f46);
  }

  .plan-visualization .compact-number {
    color: rgba(224, 231, 235, 0.7);
  }

  /* Compact marker states */
  .plan-visualization .compact-item.completed .compact-marker {
    background: linear-gradient(135deg, #10d094, #5fd35f);
  }

  .plan-visualization .compact-item.failed .compact-marker {
    background: linear-gradient(135deg, #ff6b6b, #ff9b9b);
  }

  /* Compact text */
  .plan-visualization .compact-title {
    color: rgba(224, 231, 235, 0.9);
  }

  /* Compact status badges */
  .plan-visualization .compact-status {
    &.status-todo {
      background: #2d3748;
      color: rgba(224, 231, 235, 0.6);
    }

    &.status-running {
      background: #5fd35f;
      color: #0a1a0a;
    }

    &.status-completed {
      background: #10d094;
      color: #0a1a0a;
    }

    &.status-failed {
      background: #ff6b6b;
      color: #1a0a0a;
    }
  }
}
</style>