import { createI18n } from 'vue-i18n'
import zh from '@/locales/zh'
import en from '@/locales/en'

const messages = {
    en: { ...en, dynamic: {} },  // 预留 dynamic 命名空间用于动态文案
    zh: { ...zh, dynamic: {} }
}

const i18n = createI18n({
    legacy: false, // 添加此行以禁用legacy模式
    locale: 'zh', // 默认语言
    fallbackLocale: 'en', // 回退语言
    messages
})

export default i18n