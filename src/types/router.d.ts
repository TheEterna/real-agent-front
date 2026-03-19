import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录认证 */
    requiresAuth?: boolean
    /** 隐藏顶部头 */
    hideHeader?: boolean
    /** 独立页面，不使用主布局（无侧边栏、无全局弹窗） */
    standalone?: boolean
    /** 全屏沉浸式模式：隐藏侧边栏但保留全局弹窗（如数字分身页面） */
    fullscreen?: boolean
  }
}
