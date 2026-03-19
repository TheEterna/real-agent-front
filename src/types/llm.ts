/**
 * LLM 模型配置类型定义
 */

import { PROVIDER_COLORS } from '@/styles/provider-colors'

/**
 * 用户会员等级
 */
export enum UserTier {
    FREE = 'free',
    PRO = 'pro',
    TURBO = 'turbo'
}

/**
 * 模型能力配置
 */
export interface ModelCapabilities {
    text?: boolean
    vision?: boolean
    tools?: boolean
    reasoning?: boolean
}

/**
 * LLM 模型配置
 */
export interface LlmConfig {
    /** 数据库主键 */
    id: string
    /** 提供商 */
    provider: string
    /** 显示名称 */
    displayName: string
    /** 模型描述 */
    description?: string
    /** 上下文窗口大小 */
    contentWindow: number
    /** 能力配置 */
    capabilities: ModelCapabilities
    /** 每千 tokens 消耗的 credit */
    creditPrice: number
    /** 最低会员等级要求 */
    minTier: UserTier | string
    /** 最大输出 tokens */
    maxOutputTokens: number
    /** 图标 URL */
    iconUrl?: string
    /** 排序顺序 */
    sortOrder: number
    /** 当前用户是否可用 */
    available: boolean
}

/**
 * 模型选择状态
 */
export interface ModelSelectionState {
    /** 当前选中的模型 ID */
    selectedModelId: string | null
    /** 可用模型列表 */
    models: LlmConfig[]
    /** 是否正在加载 */
    loading: boolean
    /** 错误信息 */
    error: string | null
}

/**
 * 提供商图标映射（Emoji 版本，作为 fallback）
 */
export const PROVIDER_ICONS: Record<string, string> = {
    openai: '🤖',
    anthropic: '🦙',
    aliyun: '☁️',
    deepseek: '🐋',
    google: '🔮',
    moonshot: '🌙',
    moonshotai: '🌙',
    zhipu: '🧩',
    '智谱清言': '🧩',
    baidu: '🔵',
    doubao: '🫛',
    bytedance: '🫛',
    mistral: '🌀',
    meta: '🦋',
    cohere: '🔷',
    minimax: '🎯',
    '01ai': '🔢',
    yi: '🔢',
    xai: '✖️',
    groq: '⚡',
    perplexity: '🔍',
    // Kolors 页：图像/视频模型 @see https://icons.lobehub.com/components/kolors
    kolors: '🎨',
    kling: '🎬',
    flux: '⚡',
    recraft: '🖌️',
    midjourney: '✨',
    dalle: '🖼️',
    ideogram: '🔤',
    pika: '🎞️',
    replicate: '🔄',
    runway: '🎥',
    default: '🧠'
}

/**
 * Lobe Icons CDN 配置
 * @see https://github.com/lobehub/lobe-icons
 * @see https://icons.lobehub.com
 */
export const LOBE_ICONS_CDN = {
    /** npmmirror (国内推荐) */
    NPMMIRROR: 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files',
    /** unpkg (国际) */
    UNPKG: 'https://unpkg.com/@lobehub/icons-static-png@latest',
} as const

/**
 * 提供商到 Lobe Icons 图标名的映射
 * 图标名可在 https://icons.lobehub.com 查看
 */
export const PROVIDER_ICON_SLUGS: Record<string, string> = {
    openai: 'openai',
    anthropic: 'anthropic',
    aliyun: 'qwen-color',
    deepseek: 'deepseek-color',
    google: 'gemini-color',
    moonshot: 'moonshot',
    zhipu: 'zhipu-color',
    baidu: 'wenxin-color',
    doubao: 'doubao-color',
    mistral: 'mistral-color',
    meta: 'meta-color',
    cohere: 'cohere-color',
    minimax: 'minimax-color',
    yi: 'yi-color',
    xai: 'grok',
    groq: 'groq',
    perplexity: 'perplexity-color',
    kolors: 'kolors-color',
    kling: 'kling-color',
    flux: 'flux',
    recraft: 'recraft',
    midjourney: 'midjourney',
    dalle: 'dalle-color',
    ideogram: 'ideogram',
    pika: 'pika',
    replicate: 'replicate',
    runway: 'runway',
    default: 'ai'
}

/**
 * 生成 Lobe Icons CDN URL
 * @param slug - 图标名称 (如 'openai', 'anthropic')
 * @param options - 配置选项
 * @returns CDN URL
 *
 * @example
 * getLobeIconUrl('openai')
 * // => 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/openai.png'
 *
 * getLobeIconUrl('deepseek-color', { theme: 'light', format: 'webp' })
 * // => 'https://registry.npmmirror.com/@lobehub/icons-static-webp/latest/files/light/deepseek-color.webp'
 */
export function getLobeIconUrl(
    slug: string,
    options: {
        theme?: 'dark' | 'light'
        format?: 'png' | 'svg' | 'webp'
        cdn?: 'npmmirror' | 'unpkg'
    } = {}
): string {
    const { theme = 'dark', format = 'png', cdn = 'npmmirror' } = options

    const cdnBase = cdn === 'npmmirror'
        ? `https://registry.npmmirror.com/@lobehub/icons-static-${format}/latest/files`
        : `https://unpkg.com/@lobehub/icons-static-${format}@latest`

    // SVG 格式没有 theme 目录
    if (format === 'svg') {
        return `${cdnBase}/icons/${slug}.svg`
    }

    return `${cdnBase}/${theme}/${slug}.${format}`
}

// PROVIDER_COLORS 已迁移至 @/styles/provider-colors.ts 集中管理，此处 re-export 保持向后兼容
export { PROVIDER_COLORS }

/**
 * 提供商别名映射（用于统一不同写法）
 */
const PROVIDER_ALIASES: Record<string, string> = {
    // 月之暗面的各种写法
    'moonshotai': 'moonshot',
    'moonshot-ai': 'moonshot',
    'kimi': 'moonshot',
    // 智谱的各种写法
    '智谱清言': 'zhipu',
    'chatglm': 'zhipu',
    'glm': 'zhipu',
    // 字节的各种写法
    'bytedance': 'doubao',
    '字节跳动': 'doubao',
    // 阿里的各种写法
    'alibaba': 'aliyun',
    'tongyi': 'aliyun',
    '通义': 'aliyun',
    // 百度
    'wenxin': 'baidu',
    '文心': 'baidu',
    // Google
    'gemini': 'google',
    // 零一万物
    '01ai': 'yi',
    '01-ai': 'yi',
    '零一万物': 'yi',
    // Kolors 页：图像/视频模型模糊形式
    '快手可图': 'kolors',
    '可图': 'kolors',
    'klingai': 'kling',
    'kling ai': 'kling',
    'kling-ai': 'kling',
    'dall-e': 'dalle',
    'dalle-3': 'dalle',
    'dalle-2': 'dalle',
    'midjourney v6': 'midjourney',
    'midjourney v5': 'midjourney',
    'flux 1.1': 'flux',
    'flux schnell': 'flux',
    'flux dev': 'flux',
    'flux pro': 'flux',
    'recraft v3': 'recraft',
    'recraft v2': 'recraft',
}

/**
 * 模型名前缀 → 提供商映射
 * 用于从模型名（如 "gpt-5.3"）推断出提供商（如 "openai"）
 */
const MODEL_PREFIX_MAP: [RegExp, string][] = [
    [/^(gpt|o[1-9]|dall-?e|chatgpt)/i, 'openai'],
    [/^(claude|opus|sonnet|haiku)/i, 'anthropic'],
    [/^gemini/i, 'google'],
    [/^deepseek/i, 'deepseek'],
    [/^(qwen|tongyi)/i, 'aliyun'],
    [/^(glm|chatglm)/i, 'zhipu'],
    [/^(ernie|wenxin)/i, 'baidu'],
    [/^(moonshot|kimi)/i, 'moonshot'],
    [/^doubao/i, 'doubao'],
    [/^mistral/i, 'mistral'],
    [/^llama/i, 'meta'],
    [/^command/i, 'cohere'],
    [/^grok/i, 'xai'],
    [/^yi-/i, 'yi'],
    [/^flux/i, 'flux'],
    [/^midjourney/i, 'midjourney'],
    [/^(kling|kolors)/i, 'kling'],
    [/^pika/i, 'pika'],
    [/^runway/i, 'runway'],
    [/^recraft/i, 'recraft'],
]

/**
 * 从模型名推断提供商
 * 支持多种 source 格式：
 *   - 纯模型名：      "gpt-5.3" → "openai"
 *   - provider/model： "aliyun/qwen-max" → "aliyun"
 *   - 中文provider：   "智谱清言/zai-org/GLM-4.6" → "zhipu"
 *   - 工具调用：       "exa/..." → "exa"（fallback）
 */
export function resolveProviderFromModel(source: string): string {
    const s = source.trim()

    // 处理 "provider/model" 格式：先取第一段尝试匹配
    if (s.includes('/')) {
        const firstSegment = s.split('/')[0].toLowerCase().trim()
        // 尝试别名匹配（如 "智谱清言" → "zhipu"）
        if (PROVIDER_ALIASES[firstSegment]) return PROVIDER_ALIASES[firstSegment]
        // 尝试已知 provider 直接匹配（如 "aliyun"）
        if (PROVIDER_ICON_SLUGS[firstSegment]) return firstSegment

        // 尝试对 "/" 后的模型名做前缀匹配（如 "org/qwen-max" 中的 "qwen-max"）
        const modelPart = s.split('/').pop()!
        for (const [pattern, provider] of MODEL_PREFIX_MAP) {
            if (pattern.test(modelPart)) return provider
        }
    }

    // 纯模型名：前缀正则匹配
    for (const [pattern, provider] of MODEL_PREFIX_MAP) {
        if (pattern.test(s)) return provider
    }
    return s
}

/**
 * 规范化提供商名称（忽略大小写，处理别名，兼容模型名推断）
 */
function normalizeProvider(provider: string): string {
    const lower = provider.toLowerCase().trim()
    // 先尝试别名精确匹配
    if (PROVIDER_ALIASES[lower] || PROVIDER_ALIASES[provider]) {
        return PROVIDER_ALIASES[lower] || PROVIDER_ALIASES[provider]
    }
    // 再尝试已知 provider 直接匹配
    if (PROVIDER_ICON_SLUGS[lower]) {
        return lower
    }
    // 最后尝试模型名前缀推断
    return resolveProviderFromModel(lower)
}

/**
 * 获取提供商图标（Emoji）
 */
export function getProviderIcon(provider: string): string {
    const normalized = normalizeProvider(provider)
    return PROVIDER_ICONS[normalized] || PROVIDER_ICONS[provider] || PROVIDER_ICONS.default
}

/**
 * 获取提供商 Logo URL（PNG 图片）
 * @param provider - 提供商名称
 * @param options - 可选配置 (theme, format, cdn)
 * @returns Lobe Icons CDN URL
 *
 * @example
 * getProviderLogoUrl('openai')
 * // => 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/dark/openai.png'
 *
 * getProviderLogoUrl('deepseek', { theme: 'light' })
 * // => 'https://registry.npmmirror.com/@lobehub/icons-static-png/latest/files/light/deepseek-color.png'
 */
export function getProviderLogoUrl(
    provider: string,
    options?: Parameters<typeof getLobeIconUrl>[1]
): string {
    const normalized = normalizeProvider(provider)
    const slug = PROVIDER_ICON_SLUGS[normalized] || PROVIDER_ICON_SLUGS[provider] || PROVIDER_ICON_SLUGS.default
    return getLobeIconUrl(slug, options)
}

/**
 * 获取提供商颜色
 */
export function getProviderColor(provider: string): string {
    const normalized = normalizeProvider(provider)
    return PROVIDER_COLORS[normalized] || PROVIDER_COLORS[provider] || PROVIDER_COLORS.default
}

/**
 * 格式化上下文窗口大小
 */
export function formatContextWindow(size: number): string {
    if (size >= 1000000) {
        return `${(size / 1000000).toFixed(1)}M`
    }
    if (size >= 1000) {
        return `${(size / 1000).toFixed(0)}K`
    }
    return size.toString()
}

/**
 * 检查用户等级是否可以访问模型
 */
export function canAccessModel(userTier: UserTier, requiredTier: UserTier | string): boolean {
    const tierLevels: Record<string, number> = {
        [UserTier.FREE]: 0,
        [UserTier.PRO]: 1,
        [UserTier.TURBO]: 2
    }
    const userLevel = tierLevels[userTier] ?? 0
    const requiredLevel = tierLevels[requiredTier] ?? 0
    return userLevel >= requiredLevel
}
