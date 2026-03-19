<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { gsap } from 'gsap'
import type { BarChartArgs } from '@/types/ui-event'

const props = defineProps<{
  args: BarChartArgs
}>()

const containerRef = ref<HTMLElement>()
const barsReady = ref(false)

const COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#818cf8', '#7c3aed', '#5b21b6', '#4f46e5',
]

const maxValue = computed(() => {
  let max = 0
  for (const s of props.args.series) {
    if (props.args.stacked) {
      // For stacked, sum per x-index
      for (let i = 0; i < s.data.length; i++) {
        const stackSum = props.args.series.reduce((sum, ser) => sum + (ser.data[i] || 0), 0)
        if (stackSum > max) max = stackSum
      }
    } else {
      for (const v of s.data) {
        if (v > max) max = v
      }
    }
  }
  return max || 1
})

// Generate Y-axis ticks (5 ticks)
const yTicks = computed(() => {
  const step = maxValue.value / 4
  return [0, 1, 2, 3, 4].map(i => Math.round(step * i))
})

const chartWidth = 600
const chartHeight = 300
const padding = { top: 20, right: 20, bottom: 40, left: 60 }
const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

const bars = computed(() => {
  const { xAxis, series, stacked } = props.args
  const groupCount = xAxis.length
  const seriesCount = series.length
  const groupWidth = innerWidth / groupCount
  const gap = groupWidth * 0.2
  const barAreaWidth = groupWidth - gap

  const result: { x: number; y: number; width: number; height: number; color: string; value: number; seriesName: string; label: string }[] = []

  if (stacked) {
    const barWidth = barAreaWidth * 0.6
    for (let gi = 0; gi < groupCount; gi++) {
      let cumHeight = 0
      for (let si = 0; si < seriesCount; si++) {
        const val = series[si].data[gi] || 0
        const h = (val / maxValue.value) * innerHeight
        const x = padding.left + gi * groupWidth + (groupWidth - barWidth) / 2
        const y = padding.top + innerHeight - cumHeight - h
        result.push({
          x, y, width: barWidth, height: h,
          color: COLORS[si % COLORS.length],
          value: val,
          seriesName: series[si].name,
          label: xAxis[gi],
        })
        cumHeight += h
      }
    }
  } else {
    const barWidth = barAreaWidth / seriesCount
    for (let gi = 0; gi < groupCount; gi++) {
      for (let si = 0; si < seriesCount; si++) {
        const val = series[si].data[gi] || 0
        const h = (val / maxValue.value) * innerHeight
        const x = padding.left + gi * groupWidth + gap / 2 + si * barWidth
        const y = padding.top + innerHeight - h
        result.push({
          x, y, width: barWidth * 0.85, height: h,
          color: COLORS[si % COLORS.length],
          value: val,
          seriesName: series[si].name,
          label: xAxis[gi],
        })
      }
    }
  }

  return result
})

function animateBars() {
  if (!containerRef.value) return
  const barEls = containerRef.value.querySelectorAll('.bar-rect')
  gsap.fromTo(barEls, {
    scaleY: 0,
    transformOrigin: 'bottom',
  }, {
    scaleY: 1,
    duration: 0.6,
    stagger: 0.03,
    ease: 'power2.out',
    onComplete: () => { barsReady.value = true },
  })
}

onMounted(() => {
  animateBars()
})

watch(() => props.args, () => {
  barsReady.value = false
  requestAnimationFrame(animateBars)
}, { deep: true })

const hoveredIndex = ref<number | null>(null)

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
    gsap.killTweensOf(containerRef.value.querySelectorAll('.bar-rect'))
  }
})
</script>

<template>
  <div ref="containerRef" class="ui-bar-chart">
    <div v-if="args.title" class="chart-title">{{ args.title }}</div>
    <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="chart-svg" preserveAspectRatio="xMidYMid meet">
      <!-- Y-axis grid lines -->
      <g class="grid-lines">
        <line
          v-for="(tick, i) in yTicks"
          :key="'grid-' + i"
          :x1="padding.left"
          :y1="padding.top + innerHeight - (tick / maxValue) * innerHeight"
          :x2="padding.left + innerWidth"
          :y2="padding.top + innerHeight - (tick / maxValue) * innerHeight"
          stroke="currentColor"
          stroke-opacity="0.08"
          stroke-dasharray="4 4"
        />
      </g>

      <!-- Y-axis labels -->
      <g class="y-labels">
        <text
          v-for="(tick, i) in yTicks"
          :key="'ylabel-' + i"
          :x="padding.left - 8"
          :y="padding.top + innerHeight - (tick / maxValue) * innerHeight + 4"
          text-anchor="end"
          class="axis-label"
        >{{ tick }}</text>
      </g>

      <!-- Bars -->
      <g class="bars">
        <rect
          v-for="(bar, i) in bars"
          :key="'bar-' + i"
          class="bar-rect"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="Math.max(bar.height, 0)"
          :fill="bar.color"
          :rx="3"
          :opacity="hoveredIndex === null || hoveredIndex === i ? 1 : 0.4"
          @mouseenter="hoveredIndex = i"
          @mouseleave="hoveredIndex = null"
        />
      </g>

      <!-- X-axis labels -->
      <g class="x-labels">
        <text
          v-for="(label, i) in args.xAxis"
          :key="'xlabel-' + i"
          :x="padding.left + i * (innerWidth / args.xAxis.length) + (innerWidth / args.xAxis.length) / 2"
          :y="padding.top + innerHeight + 24"
          text-anchor="middle"
          class="axis-label"
        >{{ label }}</text>
      </g>

      <!-- Baseline -->
      <line
        :x1="padding.left"
        :y1="padding.top + innerHeight"
        :x2="padding.left + innerWidth"
        :y2="padding.top + innerHeight"
        stroke="currentColor"
        stroke-opacity="0.15"
      />
    </svg>

    <!-- Tooltip -->
    <div v-if="hoveredIndex !== null && bars[hoveredIndex]" class="chart-tooltip">
      <span class="tooltip-dot" :style="{ background: bars[hoveredIndex].color }" />
      <span class="tooltip-series">{{ bars[hoveredIndex].seriesName }}</span>
      <span class="tooltip-value">{{ bars[hoveredIndex].value }}</span>
    </div>

    <!-- Legend -->
    <div v-if="args.series.length > 1" class="chart-legend">
      <div v-for="(s, i) in args.series" :key="s.name" class="legend-item">
        <span class="legend-dot" :style="{ background: COLORS[i % COLORS.length] }" />
        <span class="legend-label">{{ s.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-bar-chart {
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

.chart-svg {
  width: 100%;
  height: auto;
  max-height: 320px;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
}

.axis-label {
  font-size: 0.75rem;
  fill: currentColor;
  opacity: 0.6;
  font-family: 'Inter', sans-serif;
}

.bar-rect {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.chart-tooltip {
  position: absolute;
  top: 8px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  pointer-events: none;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tooltip-series {
  opacity: 0.7;
}

.tooltip-value {
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.6));
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-label {
  white-space: nowrap;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .ui-bar-chart {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .chart-title {
    color: rgba(255, 255, 255, 0.9);
  }

  .chart-svg {
    color: rgba(255, 255, 255, 0.5);
  }

  .chart-tooltip {
    background: rgba(0, 0, 0, 0.7);
    color: rgba(255, 255, 255, 0.9);
  }

  .legend-item {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
