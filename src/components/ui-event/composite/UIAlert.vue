<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { gsap } from 'gsap'
import type { AlertArgs } from '@/types/ui-event'

const props = defineProps<{
  args: AlertArgs
}>()

const alertRef = ref<HTMLElement>()
const visible = ref(true)

const typeConfig = computed(() => {
  const configs = {
    info: {
      bg: 'rgba(99, 102, 241, 0.08)',
      border: 'rgba(99, 102, 241, 0.2)',
      color: '#818cf8',
      icon: 'M12 16v-4m0-4h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.2)',
      color: '#34d399',
      icon: 'M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.2)',
      color: '#fbbf24',
      icon: 'M12 9v2m0 4h.01M10.29 3.86l-8.58 14.58A1 1 0 002.58 20h18.84a1 1 0 00.86-1.56L13.71 3.86a2 2 0 00-3.42 0z',
    },
    error: {
      bg: 'rgba(244, 63, 94, 0.08)',
      border: 'rgba(244, 63, 94, 0.2)',
      color: '#fb7185',
      icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a10 10 0 11-20 0 10 10 0 0120 0z',
    },
  }
  return configs[props.args.type] || configs.info
})

function close() {
  if (!alertRef.value) return
  gsap.to(alertRef.value, {
    opacity: 0,
    height: 0,
    padding: 0,
    margin: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => { visible.value = false },
  })
}

onMounted(() => {
  if (!alertRef.value) return
  gsap.fromTo(alertRef.value, {
    opacity: 0,
    y: -8,
    scale: 0.98,
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.4,
    ease: 'power2.out',
  })
})

onUnmounted(() => {
  if (alertRef.value) {
    gsap.killTweensOf(alertRef.value)
  }
})
</script>

<template>
  <div
    v-if="visible"
    ref="alertRef"
    class="ui-alert"
    :style="{
      background: typeConfig.bg,
      borderColor: typeConfig.border,
    }"
    role="alert"
  >
    <!-- Icon -->
    <svg
      class="alert-icon"
      :style="{ color: typeConfig.color }"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path :d="typeConfig.icon" />
    </svg>

    <!-- Content -->
    <div class="alert-body">
      <div class="alert-message" :style="{ color: typeConfig.color }">{{ args.message }}</div>
      <div v-if="args.description" class="alert-description">{{ args.description }}</div>
    </div>

    <!-- Close button -->
    <button v-if="args.closable" class="alert-close" @click="close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.ui-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid;
  opacity: 0;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.alert-body {
  flex: 1;
  min-width: 0;
}

.alert-message {
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.4;
}

.alert-description {
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.6));
  margin-top: 4px;
  line-height: 1.5;
}

.alert-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
  transition: background 0.15s ease, color 0.15s ease;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary, rgba(255, 255, 255, 0.8));
}

.alert-close:active {
  transform: scale(0.95);
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .alert-description {
    color: rgba(255, 255, 255, 0.6);
  }

  .alert-close {
    color: rgba(255, 255, 255, 0.4);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
  }
}
</style>
