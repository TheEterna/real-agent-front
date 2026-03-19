import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTextConfigStore } from '@/stores/textConfigStore'

/**
 * 动态文案组合式函数
 * 使用方式: const { getText, getHtml, texts } = useTextConfig()
 */
export function useTextConfig() {
  const { t, locale } = useI18n()
  const route = useRoute()

  // 当前页面类型
  const pageType = computed(() => {
    return (route.name as string)?.toLowerCase() || ''
  })

  /**
   * 获取动态文案（纯文本，经过 vue-i18n 编译器）
   * @param key 文案键名
   * @param fallback 默认值
   */
  function getText(key: string, fallback = ''): string {
    const path = `dynamic.${pageType.value}.${key}`
    const result = t(path)
    return result === path ? fallback : result
  }

  /**
   * 获取 HTML 格式的动态文案（绕过 vue-i18n 编译器）
   *
   * vue-i18n 的 t() 会编译消息模板，HTML 内容（<a> 等）会导致编译失败。
   * 此方法从 textConfigStore.rawTexts 读取原始字符串，完全绕过 i18n。
   * rawTexts 是一个响应式 ref，fetchAndMerge 完成时会更新。
   *
   * @param key 文案键名
   * @param fallback 默认 HTML
   */
  function getHtml(key: string, fallback = ''): string {
    const store = useTextConfigStore()
    const value = store.rawTexts?.[pageType.value]?.[key]
    return (typeof value === 'string' && value) ? value : fallback
  }

  /**
   * 获取当前页面所有文案
   */
  const texts = computed(() => {
    const path = `dynamic.${pageType.value}`
    const result = t(path)
    return typeof result === 'object' ? result : {}
  })

  return {
    getText,
    getHtml,
    texts,
    pageType,
    locale
  }
}
