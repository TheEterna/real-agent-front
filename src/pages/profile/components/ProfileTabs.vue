<script setup lang="ts">
/**
 * ProfileTabs - 标签页导航条
 *
 * 水平标签页按钮行，吸顶 + 毛玻璃，底部指示条
 */
import type { ProfileTab, ProfileTabKey } from '../types'

defineProps<{
  activeTab: ProfileTabKey
  tabs: ProfileTab[]
}>()

const emit = defineEmits<{
  change: [tab: ProfileTabKey]
}>()
</script>

<template>
  <div class="flex items-center justify-between border-b border-border/60">
    <!-- 标签页按钮 -->
    <div class="flex items-center gap-6 overflow-x-auto scrollbar-hide">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="relative shrink-0 py-4 text-sm font-medium transition-colors active:scale-95"
        :class="activeTab === tab.key
          ? 'text-slate-900 dark:text-white font-bold'
          : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'"
        @click="emit('change', tab.key)"
      >
        {{ tab.label }}

        <!-- 底部指示条 -->
        <Transition name="indicator">
          <div
            v-if="activeTab === tab.key"
            class="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-slate-900 dark:bg-white"
          />
        </Transition>
      </button>
    </div>

  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.indicator-enter-active {
  transition: opacity var(--duration-normal) var(--ease-fluid), transform var(--duration-normal) var(--ease-fluid);
}
.indicator-leave-active {
  transition: opacity 150ms var(--ease-snap);
}
.indicator-enter-from {
  opacity: 0;
  transform: scaleX(0.6);
}
.indicator-leave-to {
  opacity: 0;
}
</style>
