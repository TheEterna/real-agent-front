<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { gsap } from 'gsap'
import type { LineChartArgs } from '@/types/ui-event'

const props = defineProps<{
  args: LineChartArgs
}>()

const containerRef = ref<HTMLElement>()

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f43f5e', '#84cc16',
]

const chartWidth = 600
const chartHeight = 300
const padding = { top: 20, right: 20, bottom: 40, left: 60 }
const innerWidth = chartWidth - padding.left - padding.right
const innerHeight = chartHeight - padding.top - padding.bottom

const maxValue = computed(() => {
  let max = 0
  for (const s of props.args.series) {
    for (const v of s.data) {
      if (v > max) max = v
    }
  }
  return max || 1
})

const yTicks = computed(() => {
  const step = maxValue.value / 4
  return [0, 1, 2, 3, 4].map(i => Math.round(step * i))
})

function getX(index: number, total: number): number {
  if (total <= 1) return padding.left + innerWidth / 2
  return padding.left + (index / (total - 1)) * innerWidth
}

function getY(value: number): number {
  return padding.top + innerHeight - (value / maxValue.value) * innerHeight
}

const lines = computed(() => {
  return props.args.series.map((s, si) => {
    const points = s.data.map((v, i) => ({
      x: getX(i, props.args.xAxis.length),
      y: getY(v),
      value: v,
    }))

    let path = ''
    if (props.args.smooth && points.length > 1) {
      // Catmull-Rom to Bezier conversion for smooth curves
      path = `M ${points[0].x} ${points[0].y}`
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[Math.min(points.length - 1, i + 2)]

        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
      }
    } else {
      path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    }

    // Area path (for gradient fill)
    const areaPath = path +
      ` L ${points[points.length - 1].x} ${padding.top + innerHeight}` +
      ` L ${points[0].x} ${padding.top + innerHeight} Z`

    return {
      name: s.name,
      color: COLORS[si % COLORS.length],
      path,
      areaPath,
      points,
    }
  })
})

function animateLines() {
  if (!containerRef.value) return
  const paths = containerRef.value.querySelectorAll('.line-path')
  paths.forEach(path => {
    const el = path as SVGPathElement
    const length = el.getTotalLength()
    gsap.fromTo(el, {
      strokeDasharray: length,
      strokeDashoffset: length,
    }, {
      strokeDashoffset: 0,
      duration: 1,
      ease: 'power2.out',
    })
  })

  const areas = containerRef.value.querySelectorAll('.area-path')
  gsap.fromTo(areas, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.3, ease: 'power1.out' })

  const dots = containerRef.value.querySelectorAll('.data-dot')
  gsap.fromTo(dots, { scale: 0, transformOrigin: 'center' }, {
    scale: 1, duration: 0.3, stagger: 0.02, delay: 0.5, ease: 'back.out(1.7)',
  })
}

onMounted(animateLines)
watch(() => props.args, () => requestAnimationFrame(animateLines), { deep: true })

const hoveredPoint = ref<{ x: number; y: number; value: number; series: string; color: string } | null>(null)

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
    gsap.killTweensOf(containerRef.value.querySelectorAll('.line-path'))
    gsap.killTweensOf(containerRef.value.querySelectorAll('.area-path'))
    gsap.killTweensOf(containerRef.value.querySelectorAll('.data-dot'))
  }
})
</script>

<template>
  <div ref="containerRef" class="ui-line-chart">
    <div v-if="args.title" class="chart-title">{{ args.title }}</div>
    <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="chart-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient v-for="(line, i) in lines" :id="'area-grad-' + i" :key="'grad-' + i" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="line.color" stop-opacity="0.2" />
          <stop offset="100%" :stop-color="line.color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
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

      <!-- Area fills -->
      <path
        v-for="(line, i) in lines"
        :key="'area-' + i"
        class="area-path"
        :d="line.areaPath"
        :fill="`url(#area-grad-${i})`"
      />

      <!-- Lines -->
      <path
        v-for="(line, i) in lines"
        :key="'line-' + i"
        class="line-path"
        :d="line.path"
        :stroke="line.color"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Data dots -->
      <template v-for="(line, li) in lines" :key="'dots-group-' + li">
        <circle
          v-for="(pt, pi) in line.points"
          :key="'dot-' + li + '-' + pi"
          class="data-dot"
          :cx="pt.x"
          :cy="pt.y"
          r="3.5"
          :fill="line.color"
          stroke="rgba(0,0,0,0.3)"
          stroke-width="1"
          @mouseenter="hoveredPoint = { x: pt.x, y: pt.y, value: pt.value, series: line.name, color: line.color }"
          @mouseleave="hoveredPoint = null"
        />
      </template>

      <!-- X-axis labels -->
      <g class="x-labels">
        <text
          v-for="(label, i) in args.xAxis"
          :key="'xlabel-' + i"
          :x="getX(i, args.xAxis.length)"
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
    <div v-if="hoveredPoint" class="chart-tooltip">
      <span class="tooltip-dot" :style="{ background: hoveredPoint.color }" />
      <span class="tooltip-series">{{ hoveredPoint.series }}</span>
      <span class="tooltip-value">{{ hoveredPoint.value }}</span>
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
.ui-line-chart {
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

.data-dot {
  cursor: pointer;
  transition: r 0.15s ease;
}

.data-dot:hover {
  r: 5.5;
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
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  white-space: nowrap;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .ui-line-chart {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .chart-title {
    color: rgba(255, 255, 255, 0.9);
  }

  .chart-svg {
    color: rgba(255, 255, 255, 0.5);
  }

  .data-dot {
    stroke: rgba(0, 0, 0, 0.3);
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
