/**
 * Canvas 颜色集中管理
 *
 * 将 Canvas、ConversationTree、Glass 色板等硬编码颜色统一收口到此文件，
 * 方便主题切换和全局维护。
 *
 * @author Han
 * @since 2026-02-25
 */

// ==================== Sticky Note 颜色 ====================

/** Canvas 便签颜色 Token */
export const STICKY_COLORS = {
  yellow: { bg: '#fef9c3', border: '#fde047' },
  pink: { bg: '#fce7f3', border: '#f9a8d4' },
  blue: { bg: '#dbeafe', border: '#93c5fd' },
  green: { bg: '#dcfce7', border: '#86efac' },
  purple: { bg: '#f3e8ff', border: '#d8b4fe' },
  orange: { bg: '#ffedd5', border: '#fdba74' },
} as const

// ==================== 对话树节点颜色 ====================

/** 对话树节点颜色 Token */
export const TREE_COLORS = {
  edgeActive: '#6b9a98',
  edgeInactive: '#d0d0d0',
  userActive: { start: '#90caf9', end: '#64b5f6' },
  userInactive: { start: '#bbdefb', end: '#90caf9' },
  assistantActive: { start: '#a5d6a7', end: '#81c784' },
  assistantInactive: { start: '#c8e6c9', end: '#a5d6a7' },
} as const

// ==================== Glass 效果色板 ====================

/** Glass 效果色板 Token */
export const GLASS_PALETTE = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#EC4899', // pink
  '#84CC16', // lime
] as const

// ==================== Canvas 边/连接颜色 ====================

/** Canvas 默认边颜色 */
export const CANVAS_EDGE_COLOR = '#94a3b8'
