<!-- ================================================
  AvatarProfile — 分身主页（替代 Dashboard）
  职责：薄编排层，组合 Header + Tabs + Feed/Settings
  路由：/avatar/:avatarId
================================================ -->
<template>
  <div class="flex h-full flex-col bg-background">
    <!-- 加载态 -->
    <div v-if="isLoadingAvatars && !cacheHydrated" class="flex h-full items-center justify-center">
      <Loader2 :size="24" class="animate-spin text-muted-foreground" />
    </div>

    <!-- 分身不存在 -->
    <template v-else-if="!avatar && !isLoadingAvatars">
      <div ref="emptyStateRef" class="flex h-full flex-col items-center justify-center text-center px-4">
        <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
          <Bot :size="36" class="text-primary/40" />
        </div>
        <h2 class="text-xl font-semibold text-foreground">{{ t('avatar.profile.notExistTitle') }}</h2>
        <p class="mt-2 max-w-sm text-base text-muted-foreground">
          {{ t('avatar.profile.notExistDesc') }}
        </p>
        <button
          class="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          @click="router.push('/avatar')"
        >
          {{ t('avatar.profile.backToList') }}
        </button>
      </div>
    </template>

    <!-- 主内容 -->
    <template v-else-if="avatar">
      <main class="flex-1 overflow-y-auto">
        <AvatarProfileHeader :avatar="avatar" :avatar-id="avatarId" />

        <AvatarProfileTabs :active-tab="activeTab" @change="handleTabChange" />

        <div ref="tabContentRef">
          <AvatarFeedTab v-if="activeTab === 'feed'" :avatar-id="avatarId" />
          <AvatarCapabilityTab v-else-if="activeTab === 'capability'" :avatar-id="avatarId" />
          <AvatarSettingsTab v-else :avatar-id="avatarId" />
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Loader2, Bot } from "lucide-vue-next"
import gsap from "gsap"
import { useAvatarStore } from "@/stores/avatarStore"
import { useReducedMotion } from "@/composables/useReducedMotion"
import AvatarProfileHeader from "./components/AvatarProfileHeader.vue"
import AvatarProfileTabs from "./components/AvatarProfileTabs.vue"
import AvatarFeedTab from "./components/AvatarFeedTab.vue"
import AvatarCapabilityTab from "./components/AvatarCapabilityTab.vue"
import AvatarSettingsTab from "./components/AvatarSettingsTab.vue"
import { useI18n } from 'vue-i18n'
import type { AvatarProfileTab } from "./types"

const route = useRoute()
const router = useRouter()
const store = useAvatarStore()
const { t } = useI18n()
const { prefersReduced } = useReducedMotion()

// ---- 路由参数 ----
const avatarId = computed(() => route.params.avatarId as string)

// ---- 通知 Store 当前活跃分身 ----
watch(avatarId, (id) => {
  if (id) store.setActiveAvatarId(id)
}, { immediate: true })

// ---- Store 数据 ----
const avatar = computed(() => store.activeAvatar)
const isLoadingAvatars = computed(() => store.isLoadingAvatars)
const cacheHydrated = computed(() => store.cacheHydrated)

// ---- Tab 状态 ----
const activeTab = ref<AvatarProfileTab>("feed")

// ---- Template refs ----
const tabContentRef = ref<HTMLElement>()
const emptyStateRef = ref<HTMLElement>()
let tweens: gsap.core.Tween[] = []

// ---- Tab 切换 + crossfade 动画 ----
function handleTabChange(tab: AvatarProfileTab) {
  if (tab === activeTab.value) return

  if (prefersReduced.value || !tabContentRef.value) {
    activeTab.value = tab
    return
  }

  // 淡出旧内容
  gsap.to(tabContentRef.value, {
    opacity: 0,
    duration: 0.1,
    ease: "power2.out",
    onComplete: () => {
      activeTab.value = tab
      nextTick(() => {
        if (!tabContentRef.value) return
        // 淡入新内容
        gsap.fromTo(
          tabContentRef.value,
          { opacity: 0 },
          { opacity: 1, duration: 0.15, ease: "power2.out" },
        )
      })
    },
  })
}

// ---- 空状态入场动画 ----
watch(
  [() => avatar.value, isLoadingAvatars],
  ([av, loading]) => {
    if (!av && !loading) {
      nextTick(() => {
        if (!emptyStateRef.value || prefersReduced.value) return
        const t = gsap.from(emptyStateRef.value, {
          y: 16,
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        })
        tweens.push(t)
      })
    }
  },
  { immediate: true },
)

// ---- SWR 刷新 ----
onMounted(() => {
  store.loadAvatars()
})

// ---- GSAP 清理 ----
onUnmounted(() => {
  tweens.forEach((t) => t.kill())
  tweens = []
  if (tabContentRef.value) gsap.killTweensOf(tabContentRef.value)
  if (emptyStateRef.value) gsap.killTweensOf(emptyStateRef.value)
})
</script>
