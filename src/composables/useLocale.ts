import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type SupportedLocale = 'zh' | 'en'

const LOCALE_STORAGE_KEY = 'volo_ai_locale'

/**
 * 语言切换组合式函数
 * 提供语言切换、持久化、初始化功能
 */
export function useLocale() {
  const { locale, t, availableLocales } = useI18n()

  const currentLocale = computed<SupportedLocale>({
    get: () => locale.value as SupportedLocale,
    set: (val: SupportedLocale) => {
      locale.value = val
      localStorage.setItem(LOCALE_STORAGE_KEY, val)
      document.documentElement.setAttribute('lang', val)
    }
  })

  function toggleLocale() {
    currentLocale.value = currentLocale.value === 'zh' ? 'en' : 'zh'
  }

  function setLocale(lang: SupportedLocale) {
    currentLocale.value = lang
  }

  /**
   * 从 localStorage 恢复语言设置
   * 应在 App.vue onMounted 中调用
   */
  function initLocale() {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null
    if (saved && availableLocales.includes(saved)) {
      locale.value = saved
      document.documentElement.setAttribute('lang', saved)
    }
  }

  return {
    currentLocale,
    toggleLocale,
    setLocale,
    initLocale,
    t
  }
}
