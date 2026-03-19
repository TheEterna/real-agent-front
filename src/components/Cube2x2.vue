<template>
  <div :class="['inline-flex items-center justify-center', className]" :style="{ width: `${size}px`, height: `${size}px`, color: color }">
    <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50, 50) rotate(195)">
        <circle
          cx="0"
          cy="0"
          :r="radius"
          fill="none"
          stroke="currentColor"
          :stroke-width="strokeWidth"
          :stroke-dasharray="`${circumference * 0.98} ${circumference * 0.02}`"
          stroke-dashoffset="0"
          class="opacity-20"
          stroke-linecap="round"
        />
        <path
          :d="`M ${radius} 0 A ${radius} ${radius} 0 0 0 0 ${-radius}`"
          fill="none"
          stroke="currentColor"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
          class="opacity-90"
        />
        <circle cx="0" cy="0" r="3" fill="currentColor" class="opacity-30" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 40
  },
  color: {
    type: String,
    default: '#10b981'
  },
  className: {
    type: String,
    default: ''
  }
});

const strokeWidth = 10;
const radius = 38;
const circumference = 2 * Math.PI * radius;
</script>

