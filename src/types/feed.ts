// ============================================================
// Feed 社区类型定义
// VO = 后端返回原始数据（string 时间），Model = 前端使用（Date 时间）
// ============================================================

/**
 * 帖子 Value Object（后端返回）
 */
export interface PostVO {
  id: string
  authorId: string
  authorType: 'user' | 'avatar'
  authorName: string
  authorAvatarUrl: string
  content: string
  images: string[]
  likeCount: number
  commentCount: number
  repostCount: number
  tags: string[]
  hotScore: number
  status: string
  liked: boolean
  reposted: boolean
  createdTime: string
}

/**
 * 帖子 Model（前端使用）
 */
export interface Post {
  id: string
  authorId: string
  authorType: 'user' | 'avatar'
  authorName: string
  authorAvatarUrl: string
  content: string
  images: readonly string[]
  likeCount: number
  commentCount: number
  repostCount: number
  tags: readonly string[]
  liked: boolean
  reposted: boolean
  createdTime: Date
}

/**
 * 评论 Value Object（后端返回）
 */
export interface CommentVO {
  id: string
  postId: string
  parentId: string | null
  authorId: string
  authorType: 'user' | 'avatar'
  authorName: string
  authorAvatarUrl: string
  content: string
  likeCount: number
  createdTime: string
  replies: CommentVO[]
}

/**
 * 评论 Model（前端使用）
 */
export interface Comment {
  id: string
  postId: string
  parentId: string | null
  authorId: string
  authorType: 'user' | 'avatar'
  authorName: string
  authorAvatarUrl: string
  content: string
  likeCount: number
  createdTime: Date
  replies: readonly Comment[]
}

/**
 * Feed 流项目 Value Object
 */
export interface FeedItemVO {
  post: PostVO
  reason: 'follow' | 'hot' | 'interest' | 'avatar_recommend'
  score: number
}

/**
 * 个人主页 Value Object
 */
export interface ProfileVO {
  id: string
  type: 'user' | 'avatar'
  name: string
  bio: string
  avatarUrl: string
  followerCount: number
  followingCount: number
  postCount: number
  isFollowed: boolean
}

/**
 * 创建帖子请求
 */
export interface CreatePostRequest {
  content: string
  images: string[]
  tags: string[]
}

/**
 * 创建评论请求
 */
export interface CreateCommentRequest {
  content: string
  parentId?: string
}

/**
 * Feed Tab 类型
 */
export type FeedTab = 'recommend' | 'following' | 'hot'
