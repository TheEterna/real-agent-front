// ============================================================
// useAvatarFeed — 分身动态数据转换层
// 职责：将 activityLog 原始数据转为叙事风格展示对象
// 层级：Composable（纯数据转换，不调用 API）
// ============================================================

import { computed } from "vue"
import { useI18n } from 'vue-i18n'
import { useAvatarStore } from "@/stores/avatarStore"
import {
  MessageSquare,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  Activity,
} from "lucide-vue-next"
import type { Component } from "vue"
import type { AvatarActionLog } from "@/types/avatar"

interface NarrativeItem {
  icon: Component
  text: string
  time: Date
  id: string
  actionType: string
  postId?: string
}

// ACTION_MAP and DEFAULT_ACTION are now functions that use i18n
// They are constructed inside the composable function below

/** 帖子相关行为类型集合 */
const POST_ACTION_TYPES = new Set(["CREATE_POST", "LIKE_POST", "COMMENT_POST", "SHARE_POST"])

export function useAvatarFeed() {
  const { t } = useI18n()
  const store = useAvatarStore()

  const ACTION_MAP: Record<string, { icon: Component; text: string }> = {
    CREATE_POST: { icon: MessageSquare, text: t('avatar.feed.narCreatePost') },
    LIKE_POST: { icon: Heart, text: t('avatar.feed.narLikePost') },
    COMMENT_POST: { icon: MessageCircle, text: t('avatar.feed.narCommentPost') },
    SHARE_POST: { icon: Share2, text: t('avatar.feed.narSharePost') },
    FOLLOW_USER: { icon: UserPlus, text: t('avatar.feed.narFollowUser') },
  }

  const DEFAULT_ACTION = { icon: Activity, text: t('avatar.feed.narDefault') }

  /** Convert a single actionLog to a narrative display object */
  function formatActionNarrative(log: AvatarActionLog): NarrativeItem {
    const mapped = ACTION_MAP[log.actionType] ?? DEFAULT_ACTION
    const isPostAction = POST_ACTION_TYPES.has(log.actionType)
    return {
      icon: mapped.icon,
      text: log.content ?? mapped.text,
      time: log.createdTime,
      id: log.id,
      actionType: log.actionType,
      postId: isPostAction && log.targetId ? log.targetId : undefined,
    }
  }

  /** 今日活动叙事摘要 */
  const narrativeSummary = computed(() => {
    const summary = store.todayActivitySummary
    if (summary.total === 0) return t('avatar.feed.summaryEmpty')

    const parts: string[] = []
    if (summary.posts > 0) parts.push(t('avatar.feed.summaryPosts', { n: summary.posts }))
    if (summary.likes > 0) parts.push(t('avatar.feed.summaryLikes', { n: summary.likes }))
    if (summary.comments > 0) parts.push(t('avatar.feed.summaryComments', { n: summary.comments }))

    return parts.length > 0
      ? t('avatar.feed.summaryToday', { actions: parts.join(', ') })
      : t('avatar.feed.summaryTodayGeneric', { n: summary.total })
  })

  /** 时间线叙事列表 */
  const narrativeTimeline = computed<NarrativeItem[]>(() =>
    store.activityLog.map(formatActionNarrative),
  )

  return {
    narrativeSummary,
    narrativeTimeline,
    formatActionNarrative,
  }
}
