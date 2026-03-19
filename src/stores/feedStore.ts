// ============================================================
// Feed Store — 社区动态状态管理
// 职责：管理 Feed 流、帖子详情、评论列表
// 模式：Composition API + SWR + 乐观更新
// ============================================================

import { defineStore } from "pinia"
import { ref, readonly } from "vue"
import * as feedApi from "@/api/feed"
import type { Post, FeedTab, Comment } from "@/types/feed"
import type { PostVO, FeedItemVO, CommentVO } from "@/types/feed"

// ==================== VO → Model 转换 ====================

function transformPost(vo: PostVO): Post {
  return {
    id: vo.id,
    authorId: vo.authorId,
    authorType: vo.authorType,
    authorName: vo.authorName,
    authorAvatarUrl: vo.authorAvatarUrl,
    content: vo.content,
    images: vo.images || [],
    likeCount: vo.likeCount,
    commentCount: vo.commentCount,
    repostCount: vo.repostCount,
    tags: vo.tags || [],
    liked: vo.liked,
    reposted: vo.reposted,
    createdTime: new Date(vo.createdTime),
  }
}

function transformComment(vo: CommentVO): Comment {
  return {
    id: vo.id,
    postId: vo.postId,
    parentId: vo.parentId,
    authorId: vo.authorId,
    authorType: vo.authorType,
    authorName: vo.authorName,
    authorAvatarUrl: vo.authorAvatarUrl,
    content: vo.content,
    likeCount: vo.likeCount,
    createdTime: new Date(vo.createdTime),
    replies: (vo.replies || []).map(transformComment),
  }
}

// ==================== SWR 缓存 Key ====================

const CACHE_KEY = "volo_ai_feed_list"

// ==================== Store 定义 ====================

export const useFeedStore = defineStore("feed", () => {
  // ---- 状态 ----
  const feedList = ref<Post[]>([])
  const activeTab = ref<FeedTab>("recommend")
  const isLoading = ref(false)
  const page = ref(0)
  const hasMore = ref(true)
  const cacheHydrated = ref(false)

  // ---- 帖子详情 ----
  const currentPost = ref<Post | null>(null)
  const isLoadingPost = ref(false)

  // ---- 评论 ----
  const currentComments = ref<Comment[]>([])
  const isLoadingComments = ref(false)
  const commentsPage = ref(0)
  const hasMoreComments = ref(true)

  // ==================== SWR 水合 ====================

  function hydrateFromCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) {
          feedList.value = parsed.map((item: PostVO) => transformPost(item))
          cacheHydrated.value = true
        }
      }
    } catch {
      localStorage.removeItem(CACHE_KEY)
    }
  }

  // ==================== Feed 流操作 ====================

  /** 根据当前 Tab 获取对应的 API 函数 */
  function getFetcher(tab: FeedTab) {
    switch (tab) {
      case "following":
        return feedApi.getFollowingFeed
      case "hot":
        return feedApi.getHotFeed
      case "recommend":
      default:
        return feedApi.getRecommendFeed
    }
  }

  /** 刷新 Feed（重新加载第一页） */
  async function refreshFeed() {
    if (isLoading.value) return
    isLoading.value = true
    page.value = 0
    hasMore.value = true

    try {
      const fetcher = getFetcher(activeTab.value)
      const res = await fetcher(0, 20)
      if (res.code === 200 && res.data) {
        const posts = res.data.map((item: FeedItemVO) => transformPost(item.post))
        feedList.value = posts

        // 回写 SWR 缓存（存储原始 VO 以备水合）
        try {
          const voList = res.data.map((item: FeedItemVO) => item.post)
          localStorage.setItem(CACHE_KEY, JSON.stringify(voList))
        } catch {
          // 忽略缓存写入失败
        }

        hasMore.value = posts.length >= 20
        page.value = 1
      }
    } catch (error) {
      console.error("[feedStore] refreshFeed failed, keeping stale data:", error)
    } finally {
      isLoading.value = false
    }
  }

  /** 加载更多（下一页） */
  async function loadMore() {
    if (isLoading.value || !hasMore.value) return
    isLoading.value = true

    try {
      const fetcher = getFetcher(activeTab.value)
      const res = await fetcher(page.value, 20)
      if (res.code === 200 && res.data) {
        const posts = res.data.map((item: FeedItemVO) => transformPost(item.post))
        feedList.value = [...feedList.value, ...posts]
        hasMore.value = posts.length >= 20
        page.value += 1
      }
    } catch (error) {
      console.error("[feedStore] loadMore failed:", error)
    } finally {
      isLoading.value = false
    }
  }

  /** 切换 Tab */
  async function setActiveTab(tab: FeedTab) {
    if (activeTab.value === tab) return
    activeTab.value = tab
    feedList.value = []
    page.value = 0
    hasMore.value = true
    await refreshFeed()
  }

  // ==================== 互动操作（乐观更新） ====================

  /** 切换点赞（乐观更新 + 回滚） */
  async function toggleLike(postId: string) {
    const index = feedList.value.findIndex((p) => p.id === postId)
    const post = index !== -1 ? feedList.value[index] : currentPost.value

    if (!post) return

    // 保存旧状态用于回滚
    const prevLiked = post.liked
    const prevCount = post.likeCount

    // 乐观更新
    post.liked = !prevLiked
    post.likeCount = prevLiked ? prevCount - 1 : prevCount + 1

    // 同步更新 currentPost（如果匹配）
    if (currentPost.value && currentPost.value.id === postId) {
      currentPost.value.liked = post.liked
      currentPost.value.likeCount = post.likeCount
    }

    try {
      const res = await feedApi.toggleLike(postId)
      if (res.code !== 200) {
        throw new Error(res.message || "toggleLike failed")
      }
    } catch (error) {
      // 回滚
      post.liked = prevLiked
      post.likeCount = prevCount
      if (currentPost.value && currentPost.value.id === postId) {
        currentPost.value.liked = prevLiked
        currentPost.value.likeCount = prevCount
      }
      console.error("[feedStore] toggleLike rollback:", error)
    }
  }

  // ==================== 帖子详情 ====================

  /** 加载帖子详情 */
  async function loadPost(postId: string) {
    if (isLoadingPost.value) return
    isLoadingPost.value = true
    currentComments.value = []
    commentsPage.value = 0
    hasMoreComments.value = true

    try {
      const res = await feedApi.getPost(postId)
      if (res.code === 200 && res.data) {
        currentPost.value = transformPost(res.data)
      }
    } catch (error) {
      console.error("[feedStore] loadPost failed:", error)
    } finally {
      isLoadingPost.value = false
    }
  }

  // ==================== 评论 ====================

  /** 加载评论列表 */
  async function loadComments(postId: string) {
    if (isLoadingComments.value) return
    isLoadingComments.value = true

    try {
      const res = await feedApi.getComments(postId, commentsPage.value, 20)
      if (res.code === 200 && res.data) {
        const comments = res.data.map(transformComment)
        if (commentsPage.value === 0) {
          currentComments.value = comments
        } else {
          currentComments.value = [...currentComments.value, ...comments]
        }
        hasMoreComments.value = comments.length >= 20
        commentsPage.value += 1
      }
    } catch (error) {
      console.error("[feedStore] loadComments failed:", error)
    } finally {
      isLoadingComments.value = false
    }
  }

  /** 添加评论后更新本地状态 */
  function appendComment(comment: Comment) {
    currentComments.value = [comment, ...currentComments.value]
    if (currentPost.value) {
      currentPost.value.commentCount += 1
    }
    const index = feedList.value.findIndex((p) => p.id === comment.postId)
    if (index !== -1) {
      feedList.value[index].commentCount += 1
    }
  }

  /** 创建帖子后插入到 feedList 头部 */
  function prependPost(post: Post) {
    feedList.value = [post, ...feedList.value]
  }

  // ==================== 初始化 ====================

  hydrateFromCache()

  // ==================== 返回 ====================

  return {
    // 状态（只读）
    feedList: readonly(feedList),
    activeTab: readonly(activeTab),
    isLoading: readonly(isLoading),
    hasMore: readonly(hasMore),
    cacheHydrated: readonly(cacheHydrated),
    currentPost: readonly(currentPost),
    isLoadingPost: readonly(isLoadingPost),
    currentComments: readonly(currentComments),
    isLoadingComments: readonly(isLoadingComments),
    hasMoreComments: readonly(hasMoreComments),

    // 操作
    refreshFeed,
    loadMore,
    setActiveTab,
    toggleLike,
    loadPost,
    loadComments,
    appendComment,
    prependPost,
    transformPost,
    transformComment,
  }
})
