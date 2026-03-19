/**
 * useTheme — 主题切换组合式函数
 *
 * 职责：管理 light/dark 主题切换，持久化偏好，尊重系统设置
 * 存储：localStorage key = 'volo_ai_theme'
 * 机制：在 <html> 元素上切换 .dark 类（与 tailwind.css @custom-variant 对齐）
 *
 * 使用方式：
 *   const { isDark, toggle, setTheme } = useTheme()
 */
import { ref, watch, onMounted, computed } from 'vue'
import i18n from '@/i18n'

type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'volo_ai_theme'

// ── 同步读取初始状态（防止与 index.html 防闪脚本不一致） ──
function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch { /* localStorage 不可用时静默降级 */ }
  return 'system'
}

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return getSystemPreference()
}

// 全局单例状态（跨组件共享，同步初始化保证首帧正确）
const themeMode = ref<ThemeMode>(getStoredMode())
const isDark = ref(resolveIsDark(themeMode.value))
let initialized = false

function applyTheme(dark: boolean) {
  isDark.value = dark
  const html = document.documentElement
  if (dark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

function resolveAndApply() {
  applyTheme(resolveIsDark(themeMode.value))
}

function initTheme() {
  if (initialized) return
  initialized = true

  // 确保 DOM 与 ref 同步（index.html 防闪脚本可能已添加 .dark）
  resolveAndApply()

  // 监听系统主题变化（仅 system 模式下响应）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (themeMode.value === 'system') {
      applyTheme(mediaQuery.matches)
    }
  })

  // 监听 themeMode 变化 → 持久化 + 应用
  watch(themeMode, (mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch { /* 静默 */ }
    resolveAndApply()
  })
}

/** 主题模式的人类可读标签 */
const themeModeLabel = computed(() => {
  const t = i18n.global.t
  const labels: Record<ThemeMode, string> = {
    system: t('composable.theme.followSystem'),
    dark: t('composable.theme.darkMode'),
    light: t('composable.theme.lightMode'),
  }
  return labels[themeMode.value]
})

export function useTheme() {
  onMounted(() => {
    initTheme()
  })

  function setTheme(mode: ThemeMode) {
    themeMode.value = mode
  }

  function toggle() {
    // light → dark → system 循环（最常用的 light/dark 切换放在前面）
    const cycle: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = cycle.indexOf(themeMode.value)
    themeMode.value = cycle[(currentIndex + 1) % cycle.length]
  }

  return {
    /** 当前是否为暗色模式（响应式） */
    isDark,
    /** 当前主题模式：'light' | 'dark' | 'system'（响应式） */
    themeMode,
    /** 主题模式的人类可读标签（响应式） */
    themeModeLabel,
    /** 切换主题：light → dark → system 循环 */
    toggle,
    /** 设置指定主题模式 */
    setTheme,
  }
}
