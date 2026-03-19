<!-- ================================================
  AvatarProfileTabs — 分身主页 Tab 切换（设计稿对齐版）
  职责：居中 Tab 栏，GSAP 滑动指示器
  设计语言：居中排列、清晰分隔、底部指示线
================================================ -->
<template>
  <div class="flex justify-center border-b border-border/50 px-4">
    <div
      class="relative flex items-center gap-0"
      role="tablist"
      :aria-label="t('avatar.profile.tabAriaLabel')"
    >
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :ref="(el) => setTabRef(tab.value, el as HTMLElement)"
        role="tab"
        :aria-selected="activeTab === tab.value"
        :tabindex="activeTab === tab.value ? 0 : -1"
        class="relative z-10 px-5 py-3 text-sm font-medium transition-colors duration-200"
        :class="[
          activeTab === tab.value
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground/70',
        ]"
        @click="handleTabClick(tab.value)"
      >
        {{ tab.label }}
      </button>
      <!-- 滑动指示线 -->
      <div
        ref="indicatorRef"
        class="absolute bottom-0 left-0 h-[2px] rounded-full bg-foreground"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue"
import gsap from "gsap"
import { useI18n } from 'vue-i18n'
import type { AvatarProfileTab } from "../types"

const props = defineProps<{ activeTab: AvatarProfileTab }>()
const { t } = useI18n()
const emit = defineEmits<{ change: [tab: AvatarProfileTab] }>()

const tabs = computed(() => [
  { value: "feed" as AvatarProfileTab, label: t('avatar.profile.tabFeed') },
  { value: "capability" as AvatarProfileTab, label: t('avatar.profile.tabCapability') },
  { value: "settings" as AvatarProfileTab, label: t('avatar.profile.tabSettings') },
])

const indicatorRef = ref<HTMLElement | null>(null)
const tabRefs = ref<Record<string, HTMLElement>>({})

function setTabRef(key: string, el: HTMLElement | null) {
  if (el) tabRefs.value[key] = el
}

function updateIndicator(animate = true) {
  const activeEl = tabRefs.value[props.activeTab]
  const indicator = indicatorRef.value
  if (!activeEl || !indicator) return

  const { offsetLeft, offsetWidth } = activeEl
  if (animate) {
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

function handleTabClick(tab: AvatarProfileTab) {
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

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  [role="tablist"] > .absolute.bg-foreground {
    background: rgba(224, 231, 235, 0.9);
  }
}
</style>
