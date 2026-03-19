<!-- ================================================
  FeedTabs — Feed Tab 切换组件
  职责：推荐/关注/热门 Tab 切换，GSAP 指示器滑动动画
================================================ -->
<template>
  <div class="feed-tabs relative flex items-center gap-1 rounded-md bg-muted p-1" role="tablist" :aria-label="t('feed.tabs.ariaLabel')">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      :ref="(el) => setTabRef(tab.value, el as HTMLElement)"
      class="relative z-10 min-h-[36px] min-w-[44px] rounded-[5px] px-3 py-1.5 text-base font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      :class="[
        activeTab === tab.value
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground/70'
      ]"
      :aria-selected="activeTab === tab.value"
      :tabindex="activeTab === tab.value ? 0 : -1"
      role="tab"
      @click="handleTabClick(tab.value)"
    >
      {{ tab.label }}
    </button>
    <div
      ref="indicatorRef"
      class="feed-tabs-indicator absolute left-0 top-1 h-[calc(100%-8px)] rounded-[5px] bg-background shadow-sm"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue"
import { useI18n } from "vue-i18n"
import gsap from "gsap"
import type { FeedTab } from "@/types/feed"

const { t } = useI18n()

const props = defineProps<{ activeTab: FeedTab }>()
const emit = defineEmits<{ change: [tab: FeedTab] }>()

const tabs = computed(() => [
  { value: "recommend" as FeedTab, label: t('feed.tabs.recommend') },
  { value: "following" as FeedTab, label: t('feed.tabs.following') },
  { value: "hot" as FeedTab, label: t('feed.tabs.hot') },
])

const indicatorRef = ref<HTMLElement | null>(null)
const tabRefs = ref<Record<string, HTMLElement>>({})

function setTabRef(key: string, el: HTMLElement | null) {
  if (el) tabRefs.value[key] = el
}

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function updateIndicator(animate = true) {
  const activeEl = tabRefs.value[props.activeTab]
  const indicator = indicatorRef.value
  if (!activeEl || !indicator) return

  const { offsetLeft, offsetWidth } = activeEl
  if (animate && !prefersReduced) {
    gsap.to(indicator, {
      x: offsetLeft,
      width: offsetWidth,
      duration: 0.25,
      ease: "power2.out",
    })
  } else {
    gsap.set(indicator, { x: offsetLeft, width: offsetWidth })
  }
}

function handleTabClick(tab: FeedTab) {
  emit("change", tab)
}

watch(() => props.activeTab, () => {
  nextTick(() => updateIndicator(true))
})

onMounted(() => {
  nextTick(() => updateIndicator(false))
})

onUnmounted(() => {
  if (indicatorRef.value) gsap.killTweensOf(indicatorRef.value)
})
</script>

<style lang="scss">
.dark {
  .feed-tabs {
    background-color: rgba(255, 255, 255, 0.06);
  }

  .feed-tabs-indicator {
    background-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}
</style>
