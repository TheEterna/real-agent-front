<script setup lang="ts">
/**
 * ProfileTabContent - 标签页内容区
 *
 * 负责标签页切换的方向感知动画
 * 通过具名插槽分发各标签页内容
 */
import { computed } from 'vue'
import type { ProfileTabKey } from '../types'

const props = defineProps<{
  activeTab: ProfileTabKey
  tabDirection: 'left' | 'right'
}>()

const transitionName = computed(() =>
  props.tabDirection === 'right' ? 'tab-slide-right' : 'tab-slide-left'
)
</script>

<template>
  <div class="flex flex-col pt-4">
    <Transition :name="transitionName" mode="out-in">
      <div :key="activeTab" class="flex-1 min-h-0 flex flex-col">
        <slot :name="activeTab" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 向右切换：新内容从右侧滑入 */
.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
  transition: all 250ms var(--ease-fluid);
}
.tab-slide-right-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.tab-slide-right-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 向左切换：新内容从左侧滑入 */
.tab-slide-left-enter-active,
.tab-slide-left-leave-active {
  transition: all 250ms var(--ease-fluid);
}
.tab-slide-left-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.tab-slide-left-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
