import http from '@/services/http'

export interface TextConfigVO {
  key: string
  value: string
  sortOrder: number
}

export interface TextConfigResponse {
  [language: string]: TextConfigVO[]
}

/** 标准响应结构 */
interface ResponseResult<T> {
  code: number
  message: string
  data: T
}

/**
 * 根据页面类型获取文案配置
 * @param type 页面类型（路由 name，如 chat、dashboard）
 * @returns ResponseResult<TextConfigResponse> - 按语言分组的文案列表
 */
export const getTextsByType = (type: string) => {
  return http.get<ResponseResult<TextConfigResponse>>(`/config/texts/${type}`)
}
