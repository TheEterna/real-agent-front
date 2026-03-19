import http from '@/services/http'
import type { ResponseResult } from '@/types/http'

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface UserAdminVO {
  id: string
  username: string
  nickname?: string
  avatarUrl?: string
  status?: number
  tier?: string
  credits?: number
  totalCreditsUsed?: number
  createdTime?: string
  updatedTime?: string
  roles?: string[]
}

export interface CreateUserRequest {
  username: string
  password: string
  nickname?: string
  avatarUrl?: string
  tier?: string
}

export interface UpdateUserRequest {
  nickname?: string
  avatarUrl?: string
  status?: number
  tier?: string
  credits?: number
  password?: string
}

export const adminUsersApi = {
  list: (params: {
    keyword?: string
    status?: number | null
    page?: number
    pageSize?: number
  }): Promise<ResponseResult<PageResult<UserAdminVO>>> => {
    return http.get('/admin/users', { params })
  },

  getById: (id: string): Promise<ResponseResult<UserAdminVO>> => {
    return http.get(`/admin/users/${id}`)
  },

  create: (data: CreateUserRequest): Promise<ResponseResult<UserAdminVO>> => {
    return http.post('/admin/users', data)
  },

  update: (id: string, data: UpdateUserRequest): Promise<ResponseResult<UserAdminVO>> => {
    return http.put(`/admin/users/${id}`, data)
  },

  delete: (id: string): Promise<ResponseResult<void>> => {
    return http.delete(`/admin/users/${id}`)
  },

  getRoleIds: (id: string): Promise<ResponseResult<string[]>> => {
    return http.get(`/admin/users/${id}/roles`)
  },

  assignRoles: (id: string, roleIds: string[]): Promise<ResponseResult<void>> => {
    return http.put(`/admin/users/${id}/roles`, { roleIds })
  },
}

