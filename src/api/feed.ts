import http from '@/services/http'
import type { ResponseResult } from '@/api/session'
import type { PostVO, CommentVO, FeedItemVO, ProfileVO, CreatePostRequest, CreateCommentRequest } from '@/types/feed'

// ===== Feed 流 =====

export function getRecommendFeed(page = 0, size = 20): Promise<ResponseResult<FeedItemVO[]>> {
  return http.get('/feed/recommend', { params: { page, size } })
}

export function getFollowingFeed(page = 0, size = 20): Promise<ResponseResult<FeedItemVO[]>> {
  return http.get('/feed/following', { params: { page, size } })
}

export function getHotFeed(page = 0, size = 20): Promise<ResponseResult<FeedItemVO[]>> {
  return http.get('/feed/hot', { params: { page, size } })
}

// ===== 帖子 =====

export function createPost(data: CreatePostRequest): Promise<ResponseResult<PostVO>> {
  return http.post('/feed/posts', data)
}

export function getPost(postId: string): Promise<ResponseResult<PostVO>> {
  return http.get(`/feed/posts/${postId}`)
}

export function deletePost(postId: string): Promise<ResponseResult<void>> {
  return http.delete(`/feed/posts/${postId}`)
}

// ===== 互动 =====

export function toggleLike(postId: string): Promise<ResponseResult<boolean>> {
  return http.post(`/feed/posts/${postId}/like`)
}

export function addComment(postId: string, data: CreateCommentRequest): Promise<ResponseResult<CommentVO>> {
  return http.post(`/feed/posts/${postId}/comment`, data)
}

export function getComments(postId: string, page = 0, size = 20): Promise<ResponseResult<CommentVO[]>> {
  return http.get(`/feed/posts/${postId}/comments`, { params: { page, size } })
}

export function repost(postId: string, content?: string): Promise<ResponseResult<void>> {
  return http.post(`/feed/posts/${postId}/repost`, { content })
}

// ===== 关注 =====

export function follow(type: string, id: string): Promise<ResponseResult<boolean>> {
  return http.post(`/feed/follow/${type}/${id}`)
}

export function unfollow(type: string, id: string): Promise<ResponseResult<boolean>> {
  return http.delete(`/feed/follow/${type}/${id}`)
}

export function getFollowers(type: string, id: string, page = 0, size = 20): Promise<ResponseResult<ProfileVO[]>> {
  return http.get(`/feed/followers/${type}/${id}`, { params: { page, size } })
}

export function getFollowingList(type: string, id: string, page = 0, size = 20): Promise<ResponseResult<ProfileVO[]>> {
  return http.get(`/feed/following/${type}/${id}`, { params: { page, size } })
}

// ===== 个人主页 =====

export function getProfile(type: string, id: string): Promise<ResponseResult<ProfileVO>> {
  return http.get(`/feed/profile/${type}/${id}`)
}

export function getProfilePosts(type: string, id: string, page = 0, size = 20): Promise<ResponseResult<PostVO[]>> {
  return http.get(`/feed/profile/${type}/${id}/posts`, { params: { page, size } })
}
