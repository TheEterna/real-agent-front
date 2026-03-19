<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { gsap } from 'gsap'
import type { StepsArgs, StepItem } from '@/types/ui-event'

const props = defineProps<{
  args: StepsArgs
}>()

const containerRef = ref<HTMLElement>()

function getStepStatus(item: StepItem, index: number): string {
  if (item.status) return item.status
  if (index < props.args.current) return 'finish'
  if (index === props.args.current) return 'process'
  return 'wait'
}

const statusColors = {
  finish: 'var(--color-emerald-500, #10b981)',
  process: 'var(--color-indigo-500, #6366f1)',
  error: 'var(--color-rose-500, #f43f5e)',
  wait: 'rgba(255, 255, 255, 0.2)',
}

const steps = computed(() =>
  props.args.items.map((item, i) => ({
    ...item,
    resolvedStatus: getStepStatus(item, i),
  }))
)

onMounted(() => {
  if (!containerRef.value) return
  const items = containerRef.value.querySelectorAll('.step-item')
  gsap.fromTo(items, {
    opacity: 0,
    y: 8,
  }, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    stagger: 0.08,
    ease: 'power2.out',
  })
})

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
    gsap.killTweensOf(containerRef.value.querySelectorAll('.step-item'))
  }
})
</script>

<template>
  <div ref="containerRef" class="ui-steps">
    <div
      v-for="(step, i) in steps"
      :key="i"
      class="step-item"
      :class="'status-' + step.resolvedStatus"
    >
      <!-- Connector line (before) -->
      <div v-if="i > 0" class="step-connector" :class="{ completed: step.resolvedStatus === 'finish' || step.resolvedStatus === 'process' }">
        <div class="connector-fill" />
      </div>

      <!-- Step indicator -->
      <div class="step-indicator" :style="{ borderColor: statusColors[step.resolvedStatus as keyof typeof statusColors] }">
        <!-- Finish: checkmark -->
        <svg v-if="step.resolvedStatus === 'finish'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-emerald-500, #10b981)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <!-- Error: X -->
        <svg v-else-if="step.resolvedStatus === 'error'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-rose-500, #f43f5e)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <!-- Process: filled dot -->
        <div v-else-if="step.resolvedStatus === 'process'" class="step-dot-active" />
        <!-- Wait: number -->
        <span v-else class="step-number">{{ i + 1 }}</span>
      </div>

      <!-- Step content -->
      <div class="step-content">
        <div class="step-title">{{ step.title }}</div>
        <div v-if="step.description" class="step-desc">{{ step.description }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  min-width: 100px;
  opacity: 0;
}

.step-connector {
  position: absolute;
  top: 16px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 0;
}

.step-connector.completed .connector-fill {
  width: 100%;
  height: 100%;
  background: var(--color-indigo-500, #6366f1);
  transition: width 0.5s ease;
}

.step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
  flex-shrink: 0;
  transition: border-color 0.3s ease;
}

.step-dot-active {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-indigo-500, #6366f1);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.85); }
}

.step-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
  font-family: 'JetBrains Mono', monospace;
}

.step-content {
  margin-top: 8px;
  text-align: center;
  padding: 0 4px;
}

.step-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary, rgba(255, 255, 255, 0.85));
  line-height: 1.3;
}

.status-wait .step-title {
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
}

.step-desc {
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
  margin-top: 4px;
  line-height: 1.4;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .ui-steps {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .step-connector {
    background: rgba(255, 255, 255, 0.1);
  }

  .step-indicator {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
  }

  .step-number {
    color: rgba(255, 255, 255, 0.4);
  }

  .step-title {
    color: rgba(255, 255, 255, 0.85);
  }

  .status-wait .step-title {
    color: rgba(255, 255, 255, 0.4);
  }

  .step-desc {
    color: rgba(255, 255, 255, 0.4);
  }
}
</style>
