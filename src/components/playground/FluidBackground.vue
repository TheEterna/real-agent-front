<template>
  <div class="fluid-background-container">
    <div ref="fluidRef" class="fluid-background"></div>
    <div class="fluid-overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'

interface Props {
  speed?: number
  intensity?: 'low' | 'medium' | 'high'
}

const props = withDefaults(defineProps<Props>(), {
  speed: 1,
  intensity: 'medium'
})

const fluidRef = ref<HTMLElement>()
let animation: gsap.core.Tween | null = null

const intensityMap = {
  low: { duration: 20, scale: 1.2 },
  medium: { duration: 15, scale: 1.5 },
  high: { duration: 10, scale: 2 }
}

onMounted(() => {
  if (!fluidRef.value) return

  const config = intensityMap[props.intensity]

  animation = gsap.to(fluidRef.value, {
    backgroundPosition: '200% 50%',
    duration: config.duration / props.speed,
    ease: 'none',
    repeat: -1,
    yoyo: true
  })
})

onUnmounted(() => {
  animation?.kill()
})

defineExpose({
  setSpeed: (speed: number) => {
    if (animation) {
      animation.timeScale(speed)
    }
  }
})
</script>

<style scoped>
.fluid-background-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.fluid-background {
  position: absolute;
  inset: -50%;
  background: linear-gradient(
    135deg,
    #18181b 0%,
    #27272a 25%,
    #3f3f46 50%,
    #27272a 75%,
    #18181b 100%
  );
  background-size: 200% 200%;
  background-position: 0% 50%;
  filter: blur(60px);
  opacity: 0.6;
}

.fluid-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    transparent 0%,
    rgba(9, 9, 11, 0.4) 100%
  );
  pointer-events: none;
}

@media (prefers-color-scheme: light) {
  .fluid-background {
    background: linear-gradient(
      135deg,
      #fafafa 0%,
      #f4f4f5 25%,
      #e4e4e7 50%,
      #f4f4f5 75%,
      #fafafa 100%
    );
    opacity: 0.8;
  }

  .fluid-overlay {
    background: radial-gradient(
      circle at 50% 50%,
      transparent 0%,
      rgba(250, 250, 250, 0.6) 100%
    );
  }
}
</style>
