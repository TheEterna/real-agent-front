/**
 * Ant Design 主题颜色 Token
 * 与 :root / .dark CSS 变量 (--ant-*) 保持同步
 *
 * 使用方式：
 *   import { getAntThemeTokens, getIconEditTint } from '@/styles/ant-theme-tokens'
 *   const tokens = computed(() => getAntThemeTokens(isDark.value))
 */

// ── Light Mode Tokens ──
export const ANT_THEME_TOKENS = {
  colorPrimaryBg: '#f0f7f7',
  colorPrimaryBgHover: '#e4f1f1',
  colorPrimaryBorder: '#d8ebea',
  colorPrimaryBorderHover: '#b8ddd9',
  colorPrimaryHover: 'rgba(80, 200, 183, 0.9)',
  colorPrimary: 'rgba(109, 184, 172, 0.9)',
  colorInfo: '#00bac4',
  colorSuccess: '#52c41a',
  colorText: 'rgba(44, 54, 68, 0.9)',
  colorTextSecondary: 'rgba(51, 65, 85, 0.75)',
  colorTextTertiary: 'rgba(51, 65, 85, 0.5)',
  colorTextQuaternary: 'rgba(51, 65, 85, 0.3)',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#fafafa',
  colorBorder: '#e5e7eb',
  colorBorderSecondary: '#f0f0f0',
} as const

// ── Dark Mode Tokens ──
export const ANT_THEME_TOKENS_DARK = {
  colorPrimaryBg: '#0d1a1a',
  colorPrimaryBgHover: '#112322',
  colorPrimaryBorder: '#162d2c',
  colorPrimaryBorderHover: '#1f3f3d',
  colorPrimaryHover: 'rgba(124, 183, 180, 0.9)',
  colorPrimary: 'rgba(124, 183, 180, 0.9)',
  colorInfo: '#00b8c7',
  colorSuccess: '#4ade80',
  colorText: 'rgba(224, 231, 235, 0.9)',
  colorTextSecondary: 'rgba(224, 231, 235, 0.72)',
  colorTextTertiary: 'rgba(224, 231, 235, 0.48)',
  colorTextQuaternary: 'rgba(224, 231, 235, 0.28)',
  colorBgContainer: '#141c1e',
  colorBgElevated: '#1e2a2e',
  colorBgLayout: '#0c1214',
  colorBorder: '#243035',
  colorBorderSecondary: '#1e2a2e',
} as const

/** 根据暗色模式状态返回对应 Ant Design Token */
export function getAntThemeTokens(isDark: boolean) {
  return isDark ? ANT_THEME_TOKENS_DARK : ANT_THEME_TOKENS
}

/** 图标颜色 Token — 与 :root CSS 变量 (--icon-*) 保持同步 */
export const ICON_EDIT_TINT = 'rgba(0, 96, 107, 0.7)'
export const ICON_EDIT_TINT_DARK = 'rgba(124, 183, 180, 0.8)'

/** 根据暗色模式状态返回对应图标颜色 */
export function getIconEditTint(isDark: boolean) {
  return isDark ? ICON_EDIT_TINT_DARK : ICON_EDIT_TINT
}
