<script setup lang="ts">
/**
 * Avatar - 统一头像组件
 *
 * 功能：
 * - 自动兜底：avatarUrl 为空或加载失败时显示首字母占位符
 * - 支持多种尺寸、形状
 * - 支持徽章/状态指示器
 * - 支持渐变背景色
 */
import { ref, computed, watch } from 'vue'
import { withAvatarVersion } from '@/utils/avatarUrl'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type AvatarShape = 'circle' | 'rounded' | 'square'

interface Props {
  /** 头像图片URL */
  src?: string | null
  /** 用户名称（用于生成占位符文字和alt） */
  name?: string
  /** 尺寸 */
  size?: AvatarSize
  /** 形状 */
  shape?: AvatarShape
  /** 是否显示边框 */
  bordered?: boolean
  /** 边框颜色类名（如 'border-white', 'border-zinc-800'） */
  borderColor?: string
  /** 自定义背景色（用于占位符） */
  bgColor?: string
  /** 是否显示在线状态 */
  online?: boolean
  /** 在线状态位置 */
  onlinePosition?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left'
  /** 自定义徽章内容 */
  badge?: string
  /** 徽章颜色 */
  badgeColor?: string
  /** 图片缓存版本号 */
  cacheKey?: string | number | null
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: '',
  size: 'md',
  shape: 'circle',
  bordered: false,
  borderColor: 'border-white',
  bgColor: '',
  online: false,
  onlinePosition: 'bottom-right',
  badge: '',
  badgeColor: 'bg-purple-500',
  cacheKey: null
})

const isError = ref(false)
const isLoaded = ref(false)
const displaySrc = computed(() => withAvatarVersion(props.src, props.cacheKey))

/** 是否显示图片 */
const showImage = computed(() => {
  return !!displaySrc.value && !isError.value
})

/** 获取首字母 */
const initials = computed(() => {
  if (!props.name) return '?'
  return props.name.charAt(0).toUpperCase()
})

/** 尺寸配置 */
const sizeConfig = computed(() => {
  const configs: Record<AvatarSize, { container: string; font: string; badge: string; online: string }> = {
    xs: { container: 'h-6 w-6', font: 'text-[10px]', badge: 'h-2.5 w-2.5', online: 'h-1.5 w-1.5' },
    sm: { container: 'h-7 w-7', font: 'text-xs', badge: 'h-3 w-3', online: 'h-2 w-2' },
    md: { container: 'h-9 w-9', font: 'text-sm', badge: 'h-3.5 w-3.5', online: 'h-2.5 w-2.5' },
    lg: { container: 'h-12 w-12', font: 'text-base', badge: 'h-4 w-4', online: 'h-3 w-3' },
    xl: { container: 'h-14 w-14', font: 'text-lg', badge: 'h-5 w-5', online: 'h-3.5 w-3.5' },
    '2xl': { container: 'h-16 w-16', font: 'text-xl', badge: 'h-5 w-5', online: 'h-4 w-4' }
  }
  return configs[props.size]
})

/** 形状配置 */
const shapeClass = computed(() => {
  const shapes: Record<AvatarShape, string> = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none'
  }
  return shapes[props.shape]
})

/** 在线状态位置 */
const onlinePositionClass = computed(() => {
  const positions: Record<string, string> = {
    'bottom-right': '-bottom-0.5 -right-0.5',
    'top-right': '-top-0.5 -right-0.5',
    'bottom-left': '-bottom-0.5 -left-0.5',
    'top-left': '-top-0.5 -left-0.5'
  }
  return positions[props.onlinePosition]
})

/** 默认背景渐变色（基于名字生成） */
const defaultBgGradient = computed(() => {
  if (props.bgColor) return props.bgColor

  // 基于名字生成固定的渐变色
  const gradients = [
    'from-orange-400 to-rose-500',
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-purple-400 to-pink-500',
    'from-cyan-400 to-blue-500',
    'from-amber-400 to-orange-500',
    'from-violet-400 to-purple-500',
    'from-rose-400 to-pink-500'
  ]
  const index = props.name ? props.name.charCodeAt(0) % gradients.length : 0
  return `bg-gradient-to-br ${gradients[index]}`
})

/** 处理图片加载错误 */
const handleError = () => {
  isError.value = true
}

/** 处理图片加载成功 */
const handleLoad = () => {
  isLoaded.value = true
}

watch(
  () => [props.src, props.cacheKey],
  () => {
    isError.value = false
    isLoaded.value = false
  }
)
</script>

<template>
  <div class="relative inline-block shrink-0">
    <!-- 头像主体 -->
    <div
      class="relative overflow-hidden flex items-center justify-center font-bold text-white transition-all duration-200"
      :class="[
        sizeConfig.container,
        shapeClass,
        bordered ? `border-2 ${borderColor} shadow-sm` : '',
        showImage ? '' : defaultBgGradient
      ]"
    >
      <!-- 图片 -->
      <img
        v-if="showImage"
        :src="displaySrc"
        :alt="name || 'Avatar'"
        class="h-full w-full object-cover"
        :class="[shapeClass, isLoaded ? 'opacity-100' : 'opacity-0']"
        @error="handleError"
        @load="handleLoad"
      />

      <!-- 占位符 -->
      <span v-if="!showImage" class="select-none">
        {{ initials }}
      </span>
    </div>

    <!-- 在线状态指示器 -->
    <span
      v-if="online"
      class="absolute rounded-full border-2 border-white dark:border-zinc-900 bg-green-500"
      :class="[onlinePositionClass, sizeConfig.online]"
    />

    <!-- 自定义徽章 -->
    <div
      v-if="badge"
      class="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 text-white"
      :class="[badgeColor, sizeConfig.badge]"
    >
      <span v-if="badge.length <= 2" class="text-[8px] font-bold">{{ badge }}</span>
    </div>
  </div>
</template>
