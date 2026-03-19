import http from '@/services/http'
import type { ResponseResult } from '@/types/http'

export interface RoleVO {
  id: string
  roleCode: string
  roleName: string
  description?: string
  status?: boolean
  createdTime?: string
  updatedTime?: string
  userCount?: number
}

export const adminRolesApi = {
  list: (): Promise<ResponseResult<RoleVO[]>> => {
    return http.get('/admin/roles')
  },
}

