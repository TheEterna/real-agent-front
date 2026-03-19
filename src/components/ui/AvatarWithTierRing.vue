<script setup lang="ts">
/**
 * AvatarWithTierRing - 带会员光环的头像组件
 *
 * 将 Avatar 组件与 Tier 光环、Tier 徽章整合在一起
 */
import { computed } from 'vue'
import { Crown, Sparkles, TrendingUp } from 'lucide-vue-next'
import Avatar from './Avatar.vue'
import type { TierType } from '@/types/subscription'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface Props {
  /** 头像图片URL */
  src?: string | null
  /** 用户名称 */
  name?: string
  /** 会员等级 */
  tier: TierType
  /** 尺寸 */
  size?: AvatarSize
  /** 是否显示 Tier 徽章（右下角小图标） */
  showBadge?: boolean
  /** 头像缓存版本号 */
  avatarVersion?: string | number | null
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: '',
  size: 'xl',
  showBadge: true,
  avatarVersion: null
})

/** 尺寸配置 - 光环比头像大 4px */
const sizeConfig = computed(() => {
  const configs: Record<AvatarSize, { ringSize: number; padding: number; badge: string; iconSize: number }> = {
    sm: { ringSize: 32, padding: 2, badge: 'h-3.5 w-3.5 p-0.5', iconSize: 8 },   // Avatar 28px + 4px
    md: { ringSize: 40, padding: 2, badge: 'h-4 w-4 p-0.5', iconSize: 10 },      // Avatar 36px + 4px
    lg: { ringSize: 52, padding: 2, badge: 'h-4 w-4 p-0.5', iconSize: 10 },      // Avatar 48px + 4px
    xl: { ringSize: 60, padding: 2, badge: 'h-5 w-5 p-0.5', iconSize: 12 },      // Avatar 56px + 4px
    '2xl': { ringSize: 68, padding: 3, badge: 'h-5 w-5 p-0.5', iconSize: 12 }    // Avatar 64px + 4px
  }
  return configs[props.size]
})

/** 头像实际尺寸 */
const avatarSize = computed(() => props.size)

/** 光环样式 */
const ringStyle = computed(() => {
  const config = sizeConfig.value
  const baseStyle = {
    width: `${config.ringSize}px`,
    height: `${config.ringSize}px`,
    padding: `${config.padding}px`,
    borderRadius: '50%'
  }

  const tierStyles: Record<TierType, Record<string, string>> = {
    ultra: {
      background: 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd)',
      backgroundSize: '300% 300%',
      boxShadow: '0 0 16px rgba(255, 107, 107, 0.4)'
    },
    turbo: {
      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)'
    },
    pro: {
      background: 'linear-gradient(135deg, #34d399, #10b981)',
      boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
    },
    free: {
      background: 'transparent',
      boxShadow: 'none'
    }
  }

  return {
    ...baseStyle,
    ...tierStyles[props.tier]
  }
})

/** 光环动画类 */
const ringClass = computed(() => {
  if (props.tier === 'ultra') {
    return 'animate-ultra-rainbow'
  }
  return ''
})

/** Tier 徽章样式类 */
const badgeClass = computed(() => {
  const classes: Record<TierType, string> = {
    ultra: 'bg-gradient-to-r from-pink-100 dark:from-pink-900/80 to-sky-100 dark:to-sky-900/80 text-violet-600 dark:text-violet-400',
    turbo: 'bg-amber-100 dark:bg-amber-900/80 text-amber-600 dark:text-amber-400',
    pro: 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400',
    free: ''
  }
  return classes[props.tier] || ''
})

/** Tier 徽章图标 */
const badgeIcon = computed(() => {
  const icons: Record<TierType, typeof Crown | null> = {
    ultra: Sparkles,
    turbo: Crown,
    pro: TrendingUp,
    free: null
  }
  return icons[props.tier]
})

/** 是否显示徽章 */
const shouldShowBadge = computed(() => {
  return props.showBadge && props.tier !== 'free'
})

/** 是否为付费会员 */
const isPaidTier = computed(() => props.tier !== 'free')
</script>

<template>
  <div class="relative inline-block shrink-0">
    <!-- 光环容器（仅付费会员显示） -->
    <div
      v-if="isPaidTier"
      :class="['flex items-center justify-center', ringClass]"
      :style="ringStyle"
    >
      <Avatar
        :src="src"
        :name="name"
        :cache-key="avatarVersion"
        :size="avatarSize"
        shape="circle"
      />
    </div>

    <!-- 无光环（free 会员） -->
    <Avatar
      v-else
      :src="src"
      :name="name"
      :cache-key="avatarVersion"
      :size="avatarSize"
      shape="circle"
    />

    <!-- Tier 徽章（非 free 时显示在头像右下角） -->
    <div
      v-if="shouldShowBadge"
      class="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center"
      :class="[badgeClass, sizeConfig.badge]"
    >
      <component :is="badgeIcon" :size="sizeConfig.iconSize" fill="currentColor" />
    </div>
  </div>
</template>

<style scoped>
/* Ultra 彩虹动画 */
@keyframes ultra-rainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-ultra-rainbow {
  animation: ultra-rainbow 4s ease infinite;
}
</style>
