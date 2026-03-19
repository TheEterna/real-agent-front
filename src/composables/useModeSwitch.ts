import {ref, computed, watch} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {notification} from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

// 支持的输入模式
export type InputMode = 'geek' | 'multimodal' | 'default'

// 模式配置
// 模式配置 - 使用函数延迟求值以支持 i18n
function getModeConfig(t: (key: string) => string) {
    return {
        geek: {
            name: t('composable.modeSwitch.geekModeName'),
            description: t('composable.modeSwitch.geekModeDesc'),
            themeClass: 'theme-geek'
        },
        multimodal: {
            name: t('composable.modeSwitch.multimodalModeName'),
            description: t('composable.modeSwitch.multimodalModeDesc'),
            themeClass: 'theme-default'
        },
        default: {
            name: t('composable.modeSwitch.defaultModeName'),
            description: t('composable.modeSwitch.defaultModeDesc'),
            themeClass: 'theme-default'
        }
    }
}

export function useModeSwitch() {
    const router = useRouter()
    const route = useRoute()
    const { t } = useI18n()

    // 当前模式状态
    const currentMode = ref<InputMode>('multimodal')

    // 从 URL 参数读取模式
    const getModeFromRoute = (): InputMode => {
        const modeParam = route.query.mode as string
        if (modeParam && ['geek', 'multimodal', 'default'].includes(modeParam)) {
            return modeParam as InputMode
        }
        return 'multimodal' // 默认模式
    }

    // 同步模式状态与 URL
    const syncModeFromRoute = () => {
        const routeMode = getModeFromRoute()
        if (routeMode !== currentMode.value) {
            currentMode.value = routeMode
        }
    }

    // 切换模式
    const switchMode = async (mode: InputMode) => {
        if (mode === currentMode.value) {
            return
        }

        try {
            // 构建新的查询参数
            const newQuery = {...route.query}

            // 设置或移除模式参数
            newQuery.mode = mode

            // 更新 URL（保持当前路径和其他查询参数）
            await router.push({
                path: route.path,
                query: newQuery
            })

            // 更新本地状态
            currentMode.value = mode

            // 显示切换成功提示
            const config = getModeConfig(t)
            notification.success({
                message: t('composable.modeSwitch.switchSuccess'),
                description: t('composable.modeSwitch.switchedTo', { mode: config[mode].name }),
                duration: 2,
                placement: 'bottomRight'
            })

        } catch (error) {
            console.error('模式切换失败:', error)
            notification.error({
                message: t('composable.modeSwitch.switchFailed'),
                description: error instanceof Error ? error.message : t('composable.modeSwitch.unknownError'),
                duration: 3,
                placement: 'bottomRight'
            })
        }
    }

    // 获取当前模式配置
    const MODE_CONFIG = computed(() => getModeConfig(t))
    const currentModeConfig = computed(() => getModeConfig(t)[currentMode.value])

    // 获取当前主题类名
    const currentThemeClass = computed(() => currentModeConfig.value.themeClass)

    // 判断是否为特定模式
    const isGeekMode = computed(() => currentMode.value === 'geek')
    const isMultimodalMode = computed(() => currentMode.value === 'multimodal')

    // 监听路由变化，同步模式状态
    watch(
        () => route.query.mode,
        () => {
            syncModeFromRoute()
        },
        {immediate: true}
    )

    // 初始化时同步模式
    syncModeFromRoute()

    return {
        // 状态
        currentMode,
        currentModeConfig,
        currentThemeClass,

        // 计算属性
        isGeekMode,
        isMultimodalMode,

        // 方法
        switchMode,
        syncModeFromRoute,
        getModeFromRoute,

        // 配置
        MODE_CONFIG: MODE_CONFIG
    }
}