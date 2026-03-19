<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { gsap } from 'gsap'
import type { StatCardArgs } from '@/types/ui-event'

const props = defineProps<{
  args: StatCardArgs
}>()

const cardRef = ref<HTMLElement>()
const valueRef = ref<HTMLElement>()

const trendIcon = computed(() => {
  if (!props.args.trend) return null
  const dir = props.args.trend.direction
  if (dir === 'up') return 'M7 14l5-5 5 5' // chevron up
  if (dir === 'down') return 'M7 10l5 5 5-5' // chevron down
  return 'M5 12h14' // flat line
})

const trendColorClass = computed(() => {
  if (!props.args.trend) return ''
  const dir = props.args.trend.direction
  if (dir === 'up') return 'trend-up'
  if (dir === 'down') return 'trend-down'
  return 'trend-flat'
})

onMounted(() => {
  if (!cardRef.value) return
  gsap.fromTo(cardRef.value, {
    opacity: 0,
    y: 12,
    scale: 0.97,
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.5,
    ease: 'power2.out',
  })

  // Animate the value number if it's a number
  if (typeof props.args.value === 'number' && valueRef.value) {
    const target = { val: 0 }
    gsap.to(target, {
      val: props.args.value,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => {
        if (valueRef.value) {
          valueRef.value.textContent = Math.round(target.val).toLocaleString()
        }
      },
    })
  }
})

onUnmounted(() => {
  if (cardRef.value) {
    gsap.killTweensOf(cardRef.value)
  }
  if (valueRef.value) {
    gsap.killTweensOf(valueRef.value)
  }
})
</script>

<template>
  <div ref="cardRef" class="ui-stat-card">
    <div class="stat-header">
      <span class="stat-title">{{ args.title }}</span>
      <div v-if="args.trend" class="stat-trend" :class="trendColorClass">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path :d="trendIcon!" />
        </svg>
        <span class="trend-value">{{ args.trend.value }}</span>
      </div>
    </div>

    <div class="stat-value-row">
      <span v-if="args.prefix" class="stat-prefix">{{ args.prefix }}</span>
      <span ref="valueRef" class="stat-value">{{ args.value }}</span>
      <span v-if="args.suffix" class="stat-suffix">{{ args.suffix }}</span>
    </div>

    <div v-if="args.description" class="stat-description">{{ args.description }}</div>
  </div>
</template>

<style scoped>
.ui-stat-card {
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-width: 160px;
  opacity: 0;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-title {
  font-size: 0.8125rem;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  padding: 2px 6px;
  border-radius: 6px;
}

.trend-up {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.trend-down {
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.1);
}

.trend-flat {
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
  background: rgba(255, 255, 255, 0.05);
}

.trend-value {
  font-size: 0.75rem;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.stat-prefix {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
  font-family: 'JetBrains Mono', monospace;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary, rgba(255, 255, 255, 0.95));
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.stat-suffix {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
  font-family: 'JetBrains Mono', monospace;
  margin-left: 2px;
}

.stat-description {
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
  margin-top: 8px;
  line-height: 1.4;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .ui-stat-card {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .stat-title {
    color: rgba(255, 255, 255, 0.5);
  }

  .trend-up {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }

  .trend-down {
    color: #f43f5e;
    background: rgba(244, 63, 94, 0.1);
  }

  .trend-flat {
    color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
  }

  .stat-prefix {
    color: rgba(255, 255, 255, 0.5);
  }

  .stat-value {
    color: rgba(255, 255, 255, 0.95);
  }

  .stat-suffix {
    color: rgba(255, 255, 255, 0.5);
  }

  .stat-description {
    color: rgba(255, 255, 255, 0.4);
  }
}
</style>
