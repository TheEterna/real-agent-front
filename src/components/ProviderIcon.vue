<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    :class="['inline-block', sizeClass]"
    :style="{ color: iconColor }"
  />
  <span v-else :class="['inline-block', sizeClass]">{{ fallbackEmoji }}</span>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { getProviderIcon, getProviderColor, PROVIDER_ICON_SLUGS, resolveProviderFromModel } from '@/types/llm'

/**
 * Lobe Icons 图标组件映射
 * 使用 unplugin-icons 按需加载 SVG
 * @see https://icons.lobehub.com/components/kolors 图像/视频模型图标（Kolors 等）
 */
const iconModules: Record<string, () => Promise<Component>> = {
  // LLM / 通用
  openai: () => import('~icons/lobe/openai'),
  anthropic: () => import('~icons/lobe/anthropic'),
  'qwen-color': () => import('~icons/lobe/qwen-color'),
  'deepseek-color': () => import('~icons/lobe/deepseek-color'),
  'gemini-color': () => import('~icons/lobe/gemini-color'),
  moonshot: () => import('~icons/lobe/moonshot'),
  'zhipu-color': () => import('~icons/lobe/zhipu-color'),
  'wenxin-color': () => import('~icons/lobe/wenxin-color'),
  'doubao-color': () => import('~icons/lobe/doubao-color'),
  'mistral-color': () => import('~icons/lobe/mistral-color'),
  'meta-color': () => import('~icons/lobe/meta-color'),
  'cohere-color': () => import('~icons/lobe/cohere-color'),
  'minimax-color': () => import('~icons/lobe/minimax-color'),
  'yi-color': () => import('~icons/lobe/yi-color'),
  grok: () => import('~icons/lobe/grok'),
  groq: () => import('~icons/lobe/groq'),
  'perplexity-color': () => import('~icons/lobe/perplexity-color'),
  ai: () => import('~icons/lobe/ai2-color'),
  // Kolors 页：图像/视频模型（Lobe Kolors 组件全部包含 + 模糊映射）
  'kolors-color': () => import('~icons/lobe/kolors-color'),
  kolors: () => import('~icons/lobe/kolors'),
  'kling-color': () => import('~icons/lobe/kling-color'),
  kling: () => import('~icons/lobe/kling'),
  flux: () => import('~icons/lobe/flux'),
  recraft: () => import('~icons/lobe/recraft'),
  midjourney: () => import('~icons/lobe/midjourney'),
  'dalle-color': () => import('~icons/lobe/dalle-color'),
  dalle: () => import('~icons/lobe/dalle'),
  ideogram: () => import('~icons/lobe/ideogram'),
  pika: () => import('~icons/lobe/pika'),
  replicate: () => import('~icons/lobe/replicate'),
  'replicate-brand': () => import('~icons/lobe/replicate-brand'),
  runway: () => import('~icons/lobe/runway'),
}

// Props
interface Props {
  /** 提供商名称 */
  provider: string
  /** 图标大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 是否使用品牌色 */
  colored?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  colored: false,
})

// 提供商别名映射（含 Kolors 页相关模糊形式：kling/可图/快手可图 等）
const PROVIDER_ALIASES: Record<string, string> = {
  moonshotai: 'moonshot',
  'moonshot-ai': 'moonshot',
  kimi: 'moonshot',
  '智谱清言': 'zhipu',
  chatglm: 'zhipu',
  glm: 'zhipu',
  bytedance: 'doubao',
  '字节跳动': 'doubao',
  alibaba: 'aliyun',
  tongyi: 'aliyun',
  '通义': 'aliyun',
  'qwen': 'aliyun',
  wenxin: 'baidu',
  '文心': 'baidu',
  gemini: 'google',
  '01ai': 'yi',
  '01-ai': 'yi',
  '零一万物': 'yi',
  // Kolors / 图像·视频模型模糊映射
  '快手可图': 'kolors',
  可图: 'kolors',
  klingai: 'kling',
  'kling ai': 'kling',
  'kling-ai': 'kling',
  'dall-e': 'dalle',
  'dalle-3': 'dalle',
  'dalle-2': 'dalle',
  'midjourney v6': 'midjourney',
  'midjourney v5': 'midjourney',
  'midjourney v7': 'midjourney',
  'flux 1.1': 'flux',
  'flux schnell': 'flux',
  'flux dev': 'flux',
  'flux pro': 'flux',
  'recraft v3': 'recraft',
  'recraft v2': 'recraft',
}

// Provider 到 icon slug 的映射（Kolors 页图标优先用 -color 变体）
const SLUG_MAP: Record<string, string> = {
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
  // Kolors 页：图像/视频模型
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
}

// 规范化 provider 名称（支持别名 + 模型名推断）
const normalizedProvider = computed(() => {
  const lower = props.provider.toLowerCase().trim()
  // 先尝试别名精确匹配
  if (PROVIDER_ALIASES[lower] || PROVIDER_ALIASES[props.provider]) {
    return PROVIDER_ALIASES[lower] || PROVIDER_ALIASES[props.provider]
  }
  // 再尝试已知 provider 直接匹配
  if (SLUG_MAP[lower]) {
    return lower
  }
  // 最后尝试模型名前缀推断（如 "gpt-5.3" → "openai"）
  return resolveProviderFromModel(lower)
})

// 获取图标 slug
const iconSlug = computed(() => {
  return SLUG_MAP[normalizedProvider.value] || 'ai'
})

// 动态加载图标组件
const iconComponent = computed(() => {
  const loader = iconModules[iconSlug.value]
  if (loader) {
    return defineAsyncComponent(loader)
  }
  return null
})

// 获取 fallback emoji
const fallbackEmoji = computed(() => getProviderIcon(props.provider))

// 获取品牌色
const iconColor = computed(() => {
  if (props.colored) {
    return getProviderColor(props.provider)
  }
  return 'currentColor'
})

// 尺寸类名
const sizeClass = computed(() => {
  const sizes: Record<string, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }
  return sizes[props.size]
})
</script>
