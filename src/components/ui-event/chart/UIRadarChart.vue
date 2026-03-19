<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { gsap } from 'gsap'
import type { RadarChartArgs } from '@/types/ui-event'

const props = defineProps<{
  args: RadarChartArgs
}>()

const containerRef = ref<HTMLElement>()

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4',
]

const size = 300
const cx = size / 2
const cy = size / 2
const radius = size / 2 - 40

const axes = computed(() => {
  const { indicators } = props.args
  const count = indicators.length
  return indicators.map((ind, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2
    return {
      name: ind.name,
      max: ind.max,
      angle,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      labelX: cx + (radius + 18) * Math.cos(angle),
      labelY: cy + (radius + 18) * Math.sin(angle),
    }
  })
})

// Grid rings (levels)
const levels = 5
const gridPaths = computed(() => {
  return Array.from({ length: levels }, (_, level) => {
    const r = radius * ((level + 1) / levels)
    const points = axes.value.map(a => {
      return `${cx + r * Math.cos(a.angle)},${cy + r * Math.sin(a.angle)}`
    })
    return `M ${points.join(' L ')} Z`
  })
})

const seriesPolygons = computed(() => {
  return props.args.series.map((s, si) => {
    const points = s.values.map((v, i) => {
      const max = props.args.indicators[i]?.max || 1
      const ratio = Math.min(v / max, 1)
      const r = radius * ratio
      const angle = axes.value[i]?.angle ?? 0
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
    return {
      name: s.name,
      color: COLORS[si % COLORS.length],
      path,
      points,
    }
  })
})

function animateChart() {
  if (!containerRef.value) return
  const polygons = containerRef.value.querySelectorAll('.radar-polygon')
  gsap.fromTo(polygons, {
    scale: 0,
    transformOrigin: `${cx}px ${cy}px`,
    opacity: 0,
  }, {
    scale: 1,
    opacity: 1,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out',
  })

  const dots = containerRef.value.querySelectorAll('.radar-dot')
  gsap.fromTo(dots, {
    scale: 0,
    transformOrigin: 'center',
  }, {
    scale: 1,
    duration: 0.3,
    stagger: 0.02,
    delay: 0.4,
    ease: 'back.out(2)',
  })
}

onMounted(animateChart)
watch(() => props.args, () => requestAnimationFrame(animateChart), { deep: true })

const hoveredSeries = ref<number | null>(null)

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
    gsap.killTweensOf(containerRef.value.querySelectorAll('.radar-polygon'))
    gsap.killTweensOf(containerRef.value.querySelectorAll('.radar-dot'))
  }
})
</script>

<template>
  <div ref="containerRef" class="ui-radar-chart">
    <div v-if="args.title" class="chart-title">{{ args.title }}</div>
    <svg :viewBox="`0 0 ${size} ${size}`" class="chart-svg" preserveAspectRatio="xMidYMid meet">
      <!-- Grid rings -->
      <path
        v-for="(gp, i) in gridPaths"
        :key="'grid-' + i"
        :d="gp"
        fill="none"
        stroke="currentColor"
        :stroke-opacity="0.08 + i * 0.02"
        stroke-width="1"
      />

      <!-- Axis lines -->
      <line
        v-for="(axis, i) in axes"
        :key="'axis-' + i"
        :x1="cx"
        :y1="cy"
        :x2="axis.x"
        :y2="axis.y"
        stroke="currentColor"
        stroke-opacity="0.1"
        stroke-width="1"
      />

      <!-- Series polygons (filled) -->
      <path
        v-for="(sp, si) in seriesPolygons"
        :key="'poly-fill-' + si"
        class="radar-polygon"
        :d="sp.path"
        :fill="sp.color"
        fill-opacity="0.15"
        :stroke="sp.color"
        stroke-width="2"
        :opacity="hoveredSeries === null || hoveredSeries === si ? 1 : 0.3"
      />

      <!-- Data dots -->
      <template v-for="(sp, si) in seriesPolygons" :key="'dots-' + si">
        <circle
          v-for="(pt, pi) in sp.points"
          :key="'dot-' + si + '-' + pi"
          class="radar-dot"
          :cx="pt.x"
          :cy="pt.y"
          r="3"
          :fill="sp.color"
          stroke="rgba(0,0,0,0.3)"
          stroke-width="1"
        />
      </template>

      <!-- Axis labels -->
      <text
        v-for="(axis, i) in axes"
        :key="'label-' + i"
        :x="axis.labelX"
        :y="axis.labelY"
        text-anchor="middle"
        dominant-baseline="central"
        class="axis-label"
      >{{ axis.name }}</text>
    </svg>

    <!-- Legend -->
    <div v-if="args.series.length > 1" class="chart-legend">
      <div
        v-for="(sp, si) in seriesPolygons"
        :key="sp.name"
        class="legend-item"
        @mouseenter="hoveredSeries = si"
        @mouseleave="hoveredSeries = null"
      >
        <span class="legend-dot" :style="{ background: sp.color }" />
        <span class="legend-label">{{ sp.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-radar-chart {
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
  max-width: 320px;
  max-height: 320px;
  margin: 0 auto;
  display: block;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
}

.radar-polygon {
  transition: opacity 0.2s ease;
}

.axis-label {
  font-size: 0.75rem;
  fill: var(--color-text-secondary, rgba(255, 255, 255, 0.6));
  font-family: 'Inter', sans-serif;
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
  cursor: pointer;
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
  .ui-radar-chart {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .chart-title {
    color: rgba(255, 255, 255, 0.9);
  }

  .chart-svg {
    color: rgba(255, 255, 255, 0.5);
  }

  .axis-label {
    fill: rgba(255, 255, 255, 0.6);
  }

  .legend-item {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>
