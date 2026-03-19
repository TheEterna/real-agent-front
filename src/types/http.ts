/**
 * 统一的 HTTP 响应包装类型
 *
 * 后端所有接口的标准响应格式。timestamp 为可选字段，部分接口返回。
 */
export interface ResponseResult<T> {
  code: number
  message: string
  data: T
  timestamp?: number
}
