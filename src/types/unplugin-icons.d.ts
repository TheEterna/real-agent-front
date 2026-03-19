/**
 * unplugin-icons 类型声明
 * @see https://github.com/unplugin/unplugin-icons
 */

// Lobe Icons 自定义集合
declare module '~icons/lobe/*' {
    import type { FunctionalComponent, SVGAttributes } from 'vue'
    const component: FunctionalComponent<SVGAttributes>
    export default component
}

// 虚拟模块别名
declare module 'virtual:icons/lobe/*' {
    import type { FunctionalComponent, SVGAttributes } from 'vue'
    const component: FunctionalComponent<SVGAttributes>
    export default component
}
