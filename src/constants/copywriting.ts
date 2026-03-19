/**
 * UI 文案常量 — 按钮、错误提示等通用文案
 * 导出 i18n key，调用处通过 t() 获取翻译
 */
import i18n from '@/i18n'
const { t } = i18n.global

export const BUTTON_COPY = {
  get CONFIRM() { return t('constants.button.confirm') },
  get CANCEL() { return t('constants.button.cancel') },
} as const

export const ERROR_COPY = {
  get GENERIC() { return t('constants.error.generic') },
  get OPERATION_FAILED() { return t('constants.error.operationFailed') },
} as const
