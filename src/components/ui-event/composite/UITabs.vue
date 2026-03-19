<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent, provide, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import type { TabsArgs, UIEventPayload } from '@/types/ui-event'

const { t } = useI18n()

// Async import to avoid circular dependency with UIRenderer
const UIRenderer = defineAsyncComponent(() =>
  import('@/components/ui-event/UIRenderer.vue')
)

const UI_DEPTH_KEY = 'ui-event-depth'
const MAX_DEPTH = 3

const props = defineProps<{
  args: TabsArgs
}>()

const currentDepth = inject<number>(UI_DEPTH_KEY, 0)
provide(UI_DEPTH_KEY, currentDepth + 1)

const containerRef = ref<HTMLElement>()
const activeKey = ref(props.args.activeKey || props.args.items[0]?.key || '')
const indicatorStyle = ref({ left: '0px', width: '0px' })

function switchTab(key: string) {
  activeKey.value = key
  updateIndicator()

  // Animate content transition
  if (containerRef.value) {
    const content = containerRef.value.querySelector('.tab-content-active')
    if (content) {
      gsap.fromTo(content, {
        opacity: 0,
        y: 6,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  }
}

function updateIndicator() {
  if (!containerRef.value) return
  const btn = containerRef.value.querySelector(`.tab-btn[data-key="${activeKey.value}"]`) as HTMLElement
  if (btn) {
    indicatorStyle.value = {
      left: `${btn.offsetLeft}px`,
      width: `${btn.offsetWidth}px`,
    }
  }
}

onMounted(() => {
  updateIndicator()
  if (containerRef.value) {
    gsap.fromTo(containerRef.value, {
      opacity: 0,
      y: 8,
    }, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
    })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
    gsap.killTweensOf(containerRef.value.querySelectorAll('.tab-content-active'))
  }
})

const depthExceeded = currentDepth >= MAX_DEPTH
</script>

<template>
  <div ref="containerRef" class="ui-tabs" style="opacity: 0">
    <div v-if="depthExceeded" class="depth-warning">
      {{ t('uiEvent.tabs.depthWarning', { max: MAX_DEPTH }) }}
    </div>
    <template v-else>
      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          v-for="item in args.items"
          :key="item.key"
          :data-key="item.key"
          class="tab-btn"
          :class="{ active: activeKey === item.key }"
          @click="switchTab(item.key)"
        >
          {{ item.label }}
        </button>
        <div class="tab-indicator" :style="indicatorStyle" />
      </div>

      <!-- Tab content -->
      <div class="tab-content">
        <template v-for="item in args.items" :key="item.key">
          <div
            v-show="activeKey === item.key"
            class="tab-pane"
            :class="{ 'tab-content-active': activeKey === item.key }"
          >
            <UIRenderer :payload="item.content" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ui-tabs {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.tab-bar {
  display: flex;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 4px;
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 16px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary, rgba(255, 255, 255, 0.5));
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  transition: color 0.2s ease;
}

.tab-btn:hover {
  color: var(--color-text-primary, rgba(255, 255, 255, 0.8));
}

.tab-btn.active {
  color: var(--color-text-primary, rgba(255, 255, 255, 0.95));
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: var(--color-indigo-500, #6366f1);
  border-radius: 1px;
  transition: left 0.3s ease, width 0.3s ease;
}

.tab-content {
  padding: 16px;
}

.tab-pane {
  min-height: 40px;
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
  .ui-tabs {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .tab-bar {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .tab-btn {
    color: rgba(255, 255, 255, 0.5);

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    &.active {
      color: rgba(255, 255, 255, 0.95);
    }
  }

  .depth-warning {
    color: rgba(255, 255, 255, 0.4);
  }
}
</style>
