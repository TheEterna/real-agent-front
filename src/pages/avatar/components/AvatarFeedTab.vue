<!-- ================================================
  AvatarFeedTab — 分身动态 Tab
  职责：叙事摘要 + 待处理审批 + 动态时间线
  替代：ActivityLog.vue + PendingQueue.vue
================================================ -->
<template>
  <div ref="feedRef" class="mx-auto max-w-5xl px-6 py-8 space-y-6">
    <!-- 叙事摘要卡片 -->
    <div ref="summaryRef" class="rounded-2xl border bg-card p-5">
      <p class="text-base text-foreground leading-relaxed">{{ narrativeSummary }}</p>
    </div>

    <!-- 两栏布局：左侧时间线/审批 + 右侧快捷信息 -->
    <!-- 待处理审批（条件渲染） -->
    <div v-if="pendingActions.length > 0" class="space-y-3">
      <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock :size="12" class="text-amber-600 dark:text-amber-400" />
        </span>
        {{ t('avatar.feed.pending') }}
        <span class="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {{ pendingActions.length }}
        </span>
      </h3>

      <div
        v-for="(action, index) in pendingActions"
        :key="action.id"
        :ref="(el) => setPendingRef(el as HTMLElement | null, index)"
        class="rounded-2xl border border-amber-200/50 bg-card p-4 transition-all duration-200 dark:border-amber-800/30"
      >
        <p class="text-base font-medium text-foreground">{{ actionNarrative(action.actionType) }}</p>
        <p v-if="action.payload && Object.keys(action.payload).length > 0" class="mt-1 text-xs text-muted-foreground break-words line-clamp-2">
          {{ JSON.stringify(action.payload) }}
        </p>

        <div class="mt-3 flex gap-2">
          <button
            class="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95 min-h-[44px] flex items-center justify-center gap-1 disabled:pointer-events-none disabled:opacity-50"
            :disabled="processingIds.has(action.id)"
            @click="handleApprove(action.id, index)"
          >
            <Loader2 v-if="processingIds.get(action.id) === 'approve'" :size="14" class="animate-spin" />
            <CheckCircle v-else-if="succeededIds.get(action.id) === 'approve'" :size="14" />
            <Check v-else :size="14" />
            <span>{{ t('avatar.feed.approve') }}</span>
          </button>
          <button
            class="flex-1 rounded-xl border py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted active:scale-95 min-h-[44px] flex items-center justify-center gap-1 disabled:pointer-events-none disabled:opacity-50"
            :disabled="processingIds.has(action.id)"
            @click="handleReject(action.id, index)"
          >
            <Loader2 v-if="processingIds.get(action.id) === 'reject'" :size="14" class="animate-spin" />
            <XCircle v-else-if="succeededIds.get(action.id) === 'reject'" :size="14" class="text-destructive" />
            <X v-else :size="14" />
            <span>{{ t('avatar.feed.reject') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoadingActivity || isLoadingPending" class="flex justify-center py-8">
      <Loader2 :size="24" class="animate-spin text-muted-foreground" />
    </div>

    <!-- 动态时间线 -->
    <template v-else-if="narrativeTimeline.length > 0">
      <h3 class="text-sm font-semibold text-foreground">{{ t('avatar.feed.timeline') }}</h3>
      <div ref="timelineRef" role="log" aria-live="polite" :aria-label="t('avatar.feed.timelineAriaLabel')">
        <div
          v-for="item in narrativeTimeline"
          :key="item.id"
          class="timeline-item flex items-start gap-3 py-3 border-b border-border/50 last:border-b-0"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
            <component :is="item.icon" :size="14" class="text-muted-foreground" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-base text-foreground leading-relaxed">{{ item.text }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground/60">{{ formatRelativeTime(item.time) }}</p>
          </div>
          <router-link
            v-if="item.postId"
            :to="`/feed/${item.postId}`"
            class="inline-flex items-center gap-0.5 text-xs text-primary hover:underline active:scale-95 transition-all ml-auto shrink-0"
          >
            {{ t('avatar.feed.viewPost') }}
            <ArrowRight :size="12" />
          </router-link>
        </div>
      </div>

      <div class="py-6 text-center">
        <router-link
          :to="`/feed/profile/avatar/${props.avatarId}`"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          {{ t('avatar.feed.viewFullTimeline') }}
          <ArrowRight :size="14" />
        </router-link>
      </div>
    </template>

    <!-- 空状态 -->
    <div
      v-else-if="!isLoadingActivity && !isLoadingPending"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <Activity :size="40" class="mb-3 text-muted-foreground/50" />
      <p class="text-base text-muted-foreground">{{ t('avatar.feed.emptyFeed') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import {
  ArrowRight,
  Clock,
  Loader2,
  Check,
  X,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-vue-next"
import gsap from "gsap"
import { useAvatarStore } from "@/stores/avatarStore"
import { useAvatarFeed } from "../composables/useAvatarFeed"
import { useReducedMotion } from "@/composables/useReducedMotion"
import { useI18n } from 'vue-i18n'

const props = defineProps<{ avatarId: string }>()

const store = useAvatarStore()
const { narrativeSummary, narrativeTimeline } = useAvatarFeed()
const { t } = useI18n()
const { prefersReduced } = useReducedMotion()

// ---- Store 数据 ----
const pendingActions = computed(() => store.pendingActions)
const isLoadingActivity = computed(() => store.isLoadingActivity)
const isLoadingPending = computed(() => store.isLoadingPending)

// ---- 审批异步双保险 ----
const processingIds = reactive(new Map<string, "approve" | "reject">())
const succeededIds = reactive(new Map<string, "approve" | "reject">())

// ---- Template refs ----
const feedRef = ref<HTMLElement>()
const summaryRef = ref<HTMLElement>()
const timelineRef = ref<HTMLElement>()
const pendingRefs = new Map<number, HTMLElement>()

function setPendingRef(el: HTMLElement | null, index: number) {
  if (el) pendingRefs.set(index, el)
  else pendingRefs.delete(index)
}

// ---- Action 叙事映射 ----
function actionNarrative(type: string): string {
  const map: Record<string, string> = {
    CREATE_POST: t('avatar.feed.actionCreatePost'),
    LIKE_POST: t('avatar.feed.actionLikePost'),
    COMMENT_POST: t('avatar.feed.actionCommentPost'),
    SHARE_POST: t('avatar.feed.actionSharePost'),
    FOLLOW_USER: t('avatar.feed.actionFollowUser'),
  }
  return map[type] ?? t('avatar.feed.actionDefault', { type })
}

// ---- 相对时间格式化 ----
function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('avatar.feed.justNow')
  if (mins < 60) return t('avatar.feed.minutesAgo', { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('avatar.feed.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('avatar.feed.daysAgo', { n: days })
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
}

// ---- 审批操作 ----
async function handleApprove(id: string, index: number) {
  if (processingIds.has(id)) return
  processingIds.set(id, "approve")

  try {
    await store.approveAction(props.avatarId, id)
    succeededIds.set(id, "approve")

    const el = pendingRefs.get(index)
    if (el && !prefersReduced.value) {
      await gsap.timeline()
        .to(el, {
          boxShadow: "0 0 20px rgb(from var(--color-primary-300) r g b / 0.25)",
          duration: 0.2,
          ease: "power2.out",
        })
        .to(el, {
          opacity: 0,
          x: 20,
          height: 0,
          paddingTop: 0,
          paddingBottom: 0,
          marginBottom: 0,
          duration: 0.3,
          ease: "power2.in",
        })
    }
  } catch {
    shakeElement(index)
  } finally {
    processingIds.delete(id)
    succeededIds.delete(id)
  }
}

async function handleReject(id: string, index: number) {
  if (processingIds.has(id)) return
  processingIds.set(id, "reject")

  try {
    await store.rejectAction(props.avatarId, id)
    succeededIds.set(id, "reject")

    const el = pendingRefs.get(index)
    if (el && !prefersReduced.value) {
      await gsap.to(el, {
        opacity: 0,
        x: -20,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 0,
        duration: 0.3,
        ease: "power2.in",
      })
    }
  } catch {
    shakeElement(index)
  } finally {
    processingIds.delete(id)
    succeededIds.delete(id)
  }
}

function shakeElement(index: number) {
  const el = pendingRefs.get(index)
  if (el && !prefersReduced.value) {
    gsap.to(el, {
      keyframes: [
        { x: -4, duration: 0.08 },
        { x: 4, duration: 0.08 },
        { x: -2, duration: 0.08 },
        { x: 2, duration: 0.08 },
        { x: 0, duration: 0.08 },
      ],
      ease: "power2.inOut",
    })
  }
}

// ---- 入场动画 ----
let entryAnims: gsap.core.Tween[] = []

function animateEntrance() {
  if (prefersReduced.value) return

  nextTick(() => {
    // 摘要卡片
    if (summaryRef.value) {
      entryAnims.push(gsap.from(summaryRef.value, {
        y: 12,
        opacity: 0,
        scale: 0.97,
        duration: 0.3,
        ease: "back.out(1.4)",
      }))
    }

    // 待审批卡片 stagger
    pendingRefs.forEach((el, i) => {
      entryAnims.push(gsap.from(el, {
        y: 12,
        opacity: 0,
        scale: 0.97,
        duration: 0.3,
        delay: 0.1 + i * 0.04,
        ease: "back.out(1.4)",
      }))
    })

    // 时间线 stagger
    if (timelineRef.value) {
      const items = timelineRef.value.querySelectorAll(".timeline-item")
      items.forEach((item, i) => {
        entryAnims.push(gsap.from(item, {
          y: 12,
          opacity: 0,
          scale: 0.97,
          duration: 0.3,
          delay: 0.15 + i * 0.04,
          ease: "back.out(1.4)",
        }))
      })
    }
  })
}

// ---- 数据加载 ----
onMounted(() => {
  if (props.avatarId) {
    store.ensureActivityLogLoaded(props.avatarId)
    store.ensurePendingActionsLoaded(props.avatarId)
  }
})

// 当数据加载完毕后触发入场动画
watch(
  [() => store.activityLog.length, () => store.pendingActions.length, isLoadingActivity, isLoadingPending],
  ([, , loadingAct, loadingPend]) => {
    if (!loadingAct && !loadingPend) {
      animateEntrance()
    }
  },
)

// ---- GSAP 清理 ----
onUnmounted(() => {
  entryAnims.forEach((t) => t.kill())
  entryAnims = []
  pendingRefs.forEach((el) => gsap.killTweensOf(el))
  pendingRefs.clear()
  if (summaryRef.value) gsap.killTweensOf(summaryRef.value)
  if (timelineRef.value) {
    gsap.killTweensOf(timelineRef.value.querySelectorAll(".timeline-item"))
  }
})
</script>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .rounded-2xl.border.bg-card {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .timeline-item {
    border-color: rgba(255, 255, 255, 0.06);
  }
}
</style>
