// ============================================================
// usePostInteraction — 帖子互动 Composable
// 职责：点赞、评论、转发等帖子交互逻辑
// ============================================================

import { ref } from "vue"
import { useFeedStore } from "@/stores/feedStore"
import * as feedApi from "@/api/feed"
import type { CommentVO } from "@/types/feed"

export function usePostInteraction() {
  const store = useFeedStore()

  const isCommenting = ref(false)
  const isReposting = ref(false)
  const commentContent = ref("")

  // ---- 点赞 ----
  async function handleToggleLike(postId: string) {
    await store.toggleLike(postId)
  }

  // ---- 评论 ----
  async function handleAddComment(postId: string, parentId?: string): Promise<boolean> {
    if (!commentContent.value.trim()) return false
    if (isCommenting.value) return false
    isCommenting.value = true

    try {
      const res = await feedApi.addComment(postId, {
        content: commentContent.value.trim(),
        parentId,
      })
      if (res.code === 200 && res.data) {
        const comment = store.transformComment(res.data)
        store.appendComment(comment)
        commentContent.value = ""
        return true
      }
      return false
    } catch (error) {
      console.error("[usePostInteraction] addComment failed:", error)
      return false
    } finally {
      isCommenting.value = false
    }
  }

  // ---- 转发 ----
  async function handleRepost(postId: string, content?: string): Promise<boolean> {
    if (isReposting.value) return false
    isReposting.value = true

    try {
      const res = await feedApi.repost(postId, content)
      return res.code === 200
    } catch (error) {
      console.error("[usePostInteraction] repost failed:", error)
      return false
    } finally {
      isReposting.value = false
    }
  }

  return {
    isCommenting,
    isReposting,
    commentContent,
    handleToggleLike,
    handleAddComment,
    handleRepost,
  }
}
