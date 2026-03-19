<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import type { PieChartArgs } from '@/types/ui-event'

const { t } = useI18n()

const props = defineProps<{
  args: PieChartArgs
}>()

const containerRef = ref<HTMLElement>()

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f43f5e', '#84cc16',
  '#a78bfa', '#fbbf24',
]

const size = 300
const cx = size / 2
const cy = size / 2
const outerRadius = size / 2 - 10
const innerRadius = computed(() => props.args.donut ? outerRadius * 0.55 : 0)

const total = computed(() => props.args.data.reduce((sum, d) => sum + d.value, 0) || 1)

const slices = computed(() => {
  let startAngle = -Math.PI / 2
  return props.args.data.map((d, i) => {
    const angle = (d.value / total.value) * Math.PI * 2
    const endAngle = startAngle + angle
    const midAngle = startAngle + angle / 2

    const largeArc = angle > Math.PI ? 1 : 0

    const x1 = cx + outerRadius * Math.cos(startAngle)
    const y1 = cy + outerRadius * Math.sin(startAngle)
    const x2 = cx + outerRadius * Math.cos(endAngle)
    const y2 = cy + outerRadius * Math.sin(endAngle)

    const ir = innerRadius.value
    const ix1 = cx + ir * Math.cos(endAngle)
    const iy1 = cy + ir * Math.sin(endAngle)
    const ix2 = cx + ir * Math.cos(startAngle)
    const iy2 = cy + ir * Math.sin(startAngle)

    let path: string
    if (ir > 0) {
      // Donut
      path = [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ')
    } else {
      // Full pie
      path = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ')
    }

    const labelRadius = ir > 0 ? (outerRadius + ir) / 2 : outerRadius * 0.65
    const labelX = cx + labelRadius * Math.cos(midAngle)
    const labelY = cy + labelRadius * Math.sin(midAngle)

    const percent = ((d.value / total.value) * 100).toFixed(1)

    const result = {
      path,
      color: COLORS[i % COLORS.length],
      name: d.name,
      value: d.value,
      percent,
      labelX,
      labelY,
      showLabel: angle > 0.3,
    }

    startAngle = endAngle
    return result
  })
})

function animateChart() {
  if (!containerRef.value) return
  const paths = containerRef.value.querySelectorAll('.pie-slice')
  gsap.fromTo(paths, {
    scale: 0,
    transformOrigin: `${cx}px ${cy}px`,
    opacity: 0,
  }, {
    scale: 1,
    opacity: 1,
    duration: 0.7,
    stagger: 0.06,
    ease: 'back.out(1.2)',
  })
}

onMounted(animateChart)
watch(() => props.args, () => requestAnimationFrame(animateChart), { deep: true })

const hoveredIndex = ref<number | null>(null)

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
    gsap.killTweensOf(containerRef.value.querySelectorAll('.pie-slice'))
  }
})
</script>

<template>
  <div ref="containerRef" class="ui-pie-chart">
    <div v-if="args.title" class="chart-title">{{ args.title }}</div>
    <div class="chart-body">
      <svg :viewBox="`0 0 ${size} ${size}`" class="chart-svg" preserveAspectRatio="xMidYMid meet">
        <path
          v-for="(slice, i) in slices"
          :key="'slice-' + i"
          class="pie-slice"
          :d="slice.path"
          :fill="slice.color"
          :opacity="hoveredIndex === null || hoveredIndex === i ? 1 : 0.4"
          :stroke="hoveredIndex === i ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'"
          stroke-width="1.5"
          @mouseenter="hoveredIndex = i"
          @mouseleave="hoveredIndex = null"
        />
        <!-- Percentage labels inside slices -->
        <text
          v-for="(slice, i) in slices"
          v-show="slice.showLabel"
          :key="'label-' + i"
          :x="slice.labelX"
          :y="slice.labelY"
          text-anchor="middle"
          dominant-baseline="central"
          class="slice-label"
        >{{ slice.percent }}%</text>

        <!-- Donut center text -->
        <text
          v-if="args.donut"
          :x="cx"
          :y="cy - 6"
          text-anchor="middle"
          class="center-total-label"
        >{{ t('uiEvent.pie.total') }}</text>
        <text
          v-if="args.donut"
          :x="cx"
          :y="cy + 14"
          text-anchor="middle"
          class="center-total-value"
        >{{ total }}</text>
      </svg>

      <!-- Legend sidebar -->
      <div class="chart-legend-side">
        <div
          v-for="(slice, i) in slices"
          :key="slice.name"
          class="legend-row"
          :class="{ active: hoveredIndex === i }"
          @mouseenter="hoveredIndex = i"
          @mouseleave="hoveredIndex = null"
        >
          <span class="legend-dot" :style="{ background: slice.color }" />
          <span class="legend-name">{{ slice.name }}</span>
          <span class="legend-value">{{ slice.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-pie-chart {
  position: relative;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.chart-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, rgba(255, 255, 255, 0.9));
  margin-bottom: 12px;
}

.chart-body {
  display: flex;
  align-items: center;
  gap: 24px;
}

.chart-svg {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

.pie-slice {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.slice-label {
  font-size: 0.75rem;
  fill: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.center-total-label {
  font-size: 0.75rem;
  fill: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
  font-family: 'Inter', sans-serif;
}

.center-total-value {
  font-size: 1.125rem;
  fill: var(--color-text-primary, rgba(255, 255, 255, 0.9));
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.chart-legend-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.legend-row:hover,
.legend-row.active {
  background: rgba(255, 255, 255, 0.05);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.7));
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary, rgba(255, 255, 255, 0.9));
  font-family: 'JetBrains Mono', monospace;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .ui-pie-chart {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .chart-title {
    color: rgba(255, 255, 255, 0.9);
  }

  .slice-label {
    fill: rgba(255, 255, 255, 0.9);
  }

  .center-total-label {
    fill: rgba(255, 255, 255, 0.5);
  }

  .center-total-value {
    fill: rgba(255, 255, 255, 0.9);
  }

  .legend-row:hover,
  .legend-row.active {
    background: rgba(255, 255, 255, 0.05);
  }

  .legend-name {
    color: rgba(255, 255, 255, 0.7);
  }

  .legend-value {
    color: rgba(255, 255, 255, 0.9);
  }
}
</style>
