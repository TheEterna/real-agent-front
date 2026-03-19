<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent, provide, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import type { CollapseArgs } from '@/types/ui-event'

const { t } = useI18n()

// Async import to avoid circular dependency with UIRenderer
const UIRenderer = defineAsyncComponent(() =>
  import('@/components/ui-event/UIRenderer.vue')
)

const UI_DEPTH_KEY = 'ui-event-depth'
const MAX_DEPTH = 3

const props = defineProps<{
  args: CollapseArgs
}>()

const currentDepth = inject<number>(UI_DEPTH_KEY, 0)
provide(UI_DEPTH_KEY, currentDepth + 1)

const containerRef = ref<HTMLElement>()

// Track open states
const openKeys = ref<Set<number>>(new Set(
  props.args.items
    .map((item, i) => item.defaultOpen ? i : -1)
    .filter(i => i >= 0)
))

function togglePanel(index: number) {
  if (props.args.accordion) {
    if (openKeys.value.has(index)) {
      openKeys.value.delete(index)
    } else {
      openKeys.value.clear()
      openKeys.value.add(index)
    }
  } else {
    if (openKeys.value.has(index)) {
      openKeys.value.delete(index)
    } else {
      openKeys.value.add(index)
    }
  }
  // Force reactivity
  openKeys.value = new Set(openKeys.value)

  // Animate the content
  if (containerRef.value) {
    const panel = containerRef.value.querySelector(`.panel-content[data-index="${index}"]`) as HTMLElement
    if (panel && openKeys.value.has(index)) {
      gsap.fromTo(panel, {
        height: 0,
        opacity: 0,
      }, {
        height: 'auto',
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out',
      })
    }
  }
}

function isOpen(index: number): boolean {
  return openKeys.value.has(index)
}

onMounted(() => {
  if (!containerRef.value) return
  const panels = containerRef.value.querySelectorAll('.collapse-panel')
  gsap.fromTo(panels, {
    opacity: 0,
    y: 6,
  }, {
    opacity: 1,
    y: 0,
    duration: 0.4,
    stagger: 0.05,
    ease: 'power2.out',
  })
})

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
    gsap.killTweensOf(containerRef.value.querySelectorAll('.collapse-panel'))
    gsap.killTweensOf(containerRef.value.querySelectorAll('.panel-content'))
  }
})

const depthExceeded = currentDepth >= MAX_DEPTH
</script>

<template>
  <div ref="containerRef" class="ui-collapse">
    <div v-if="depthExceeded" class="depth-warning">
      {{ t('uiEvent.collapse.depthWarning', { max: MAX_DEPTH }) }}
    </div>
    <template v-else>
      <div
        v-for="(item, i) in args.items"
        :key="i"
        class="collapse-panel"
        :class="{ open: isOpen(i) }"
      >
        <button class="panel-header" @click="togglePanel(i)">
          <svg
            class="panel-arrow"
            :class="{ rotated: isOpen(i) }"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span class="panel-title">{{ item.title }}</span>
        </button>

        <div
          v-show="isOpen(i)"
          class="panel-content"
          :data-index="i"
        >
          <div class="panel-body">
            <UIRenderer :payload="item.content" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ui-collapse {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.collapse-panel {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.collapse-panel:last-child {
  border-bottom: none;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-primary, rgba(255, 255, 255, 0.85));
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;
  transition: background 0.15s ease;
}

.panel-header:hover {
  background: rgba(255, 255, 255, 0.03);
}

.panel-arrow {
  flex-shrink: 0;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
  transition: transform 0.3s ease;
}

.panel-arrow.rotated {
  transform: rotate(90deg);
}

.panel-title {
  flex: 1;
  min-width: 0;
}

.panel-content {
  overflow: hidden;
}

.panel-body {
  padding: 0 16px 16px 40px;
}

.depth-warning {
  padding: 12px 16px;
  font-size: 0.75rem;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.4));
  text-align: center;
  font-style: italic;
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .ui-collapse {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .collapse-panel {
    border-bottom-color: rgba(255, 255, 255, 0.04);
  }

  .panel-header {
    color: rgba(255, 255, 255, 0.85);

    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }
  }

  .panel-arrow {
    color: rgba(255, 255, 255, 0.4);
  }

  .depth-warning {
    color: rgba(255, 255, 255, 0.4);
  }
}
</style>
