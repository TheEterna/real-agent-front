// ============================================================
// useFeed — Feed 页面核心 Composable
// 职责：无限滚动、下拉刷新、Tab 切换、GSAP 动画编排
// ============================================================

import { computed, onMounted, onUnmounted, ref } from "vue"
import gsap from "gsap"
import { useFeedStore } from "@/stores/feedStore"
import { useFluidAnimation } from "@/composables/useFluidAnimation"
import type { FeedTab } from "@/types/feed"

export function useFeed() {
  const store = useFeedStore()
  const { springIn } = useFluidAnimation()

  const scrollContainerRef = ref<HTMLElement | null>(null)
  const feedCardsRef = ref<HTMLElement[]>([])

  // ---- 响应式数据（只读） ----
  const feedList = computed(() => store.feedList)
  const activeTab = computed(() => store.activeTab)
  const isLoading = computed(() => store.isLoading)
  const hasMore = computed(() => store.hasMore)

  // ---- 初始化加载 ----
  onMounted(() => {
    store.refreshFeed()
    setupInfiniteScroll()
  })

  // ---- 无限滚动 ----
  let scrollCleanup: (() => void) | null = null

  function setupInfiniteScroll() {
    const container = scrollContainerRef.value
    if (!container) return

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      // 距离底部 200px 时触发加载
      if (scrollHeight - scrollTop - clientHeight < 200) {
        store.loadMore()
      }
    }

    container.addEventListener("scroll", onScroll, { passive: true })
    scrollCleanup = () => container.removeEventListener("scroll", onScroll)
  }

  onUnmounted(() => {
    if (scrollCleanup) scrollCleanup()
    // 清理 GSAP 动画
    feedCardsRef.value.forEach((el) => gsap.killTweensOf(el))
  })

  // ---- Tab 切换 ----
  async function switchTab(tab: FeedTab) {
    await store.setActiveTab(tab)
  }

  // ---- 下拉刷新 ----
  async function refresh() {
    await store.refreshFeed()
  }

  // ---- 卡片入场动画 ----
  function animateCardEntry(el: Element, index: number) {
    gsap.from(el, {
      y: 20,
      opacity: 0,
      scale: 0.97,
      duration: 0.35,
      delay: index * 0.04,
      ease: "back.out(1.2)",
    })
  }

  return {
    scrollContainerRef,
    feedCardsRef,
    feedList,
    activeTab,
    isLoading,
    hasMore,
    switchTab,
    refresh,
    animateCardEntry,
  }
}
