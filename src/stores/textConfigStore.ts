import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTextsByType, TextConfigResponse } from '@/api/textConfig'
import i18n from '@/i18n'

export const useTextConfigStore = defineStore('textConfig', () => {
  // 已加载的页面类型缓存
  const loadedTypes = ref<Set<string>>(new Set())

  // 加载中状态
  const loading = ref(false)

  /** 原始文案（不经过 i18n 编译器，用于 HTML 等特殊内容） */
  const rawTexts = ref<Record<string, Record<string, string>>>({})

  /**
   * 获取并合并文案到 i18n
   */
  async function fetchAndMerge(type: string): Promise<void> {
    // 已加载则跳过
    if (loadedTypes.value.has(type)) {
      return
    }

    loading.value = true
    try {
      const response = await getTextsByType(type) as any
      // http 响应拦截器返回的是 ResponseResult，真正的数据在 data 字段中
      const data = (response?.data || response) as TextConfigResponse

      // 合并到 i18n.messages
      if (data && Object.keys(data).length > 0) {
        mergeToI18n(type, data)
        // 同时存一份原始值（供 getHtml 等绕过 i18n 编译器的场景使用）
        const firstLangTexts = Object.values(data)[0]
        if (firstLangTexts) {
          const raw: Record<string, string> = {}
          for (const item of firstLangTexts) {
            raw[item.key] = item.value
          }
          rawTexts.value = { ...rawTexts.value, [type]: raw }
        }
      }

      loadedTypes.value.add(type)
    } catch (error) {
      console.error(`Failed to fetch text config for ${type}:`, error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 合并文案到 i18n.messages
   * 结构: { zh: { dynamic: { chatassistant: { key: 'value' } } } }
   *
   * 使用 vue-i18n 的 mergeLocaleMessage API 而非直接 mutation，
   * 确保 t() 的内部编译缓存正确失效，computed 能响应式更新。
   */
  function mergeToI18n(type: string, data: TextConfigResponse) {
    const langMap: Record<string, string> = {
      'zh-CN': 'zh',
      'en-US': 'en'
    }

    for (const [apiLang, texts] of Object.entries(data)) {
      const i18nLang = langMap[apiLang] || apiLang

      const textObj: Record<string, string> = {}
      for (const item of texts) {
        textObj[item.key] = item.value
      }

      // 使用官方 API 合并，触发 vue-i18n 内部响应式更新
      i18n.global.mergeLocaleMessage(i18nLang, {
        dynamic: { [type]: textObj }
      })
    }
  }

  /**
   * 清除缓存（用于强制刷新）
   */
  function clearCache() {
    loadedTypes.value.clear()
  }

  return {
    loadedTypes,
    loading,
    rawTexts,
    fetchAndMerge,
    clearCache
  }
})
