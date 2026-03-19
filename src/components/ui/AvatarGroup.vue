<script setup lang="ts">
/**
 * AvatarGroup - 头像组组件
 *
 * 用于展示多个堆叠的头像，常用于显示群组成员
 */
interface Props {
  /** 头像列表 */
  avatars: Array<{
    src?: string
    name: string
  }>
  /** 最大显示数量 */
  max?: number
  /** 尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** 堆叠间距 */
  spacing?: 'tight' | 'normal' | 'loose'
}

const props = withDefaults(defineProps<Props>(), {
  max: 3,
  size: 'md',
  spacing: 'normal'
})

const spacingClass = computed(() => {
  const spacings = {
    tight: '-space-x-2',
    normal: '-space-x-3',
    loose: '-space-x-1'
  }
  return spacings[props.spacing]
})

const displayAvatars = computed(() => {
  return props.avatars.slice(0, props.max)
})

const remainingCount = computed(() => {
  return Math.max(0, props.avatars.length - props.max)
})
</script>

<script lang="ts">
import { computed } from 'vue'
import Avatar from './Avatar.vue'
</script>

<template>
  <div class="flex items-center" :class="spacingClass">
    <Avatar
      v-for="(avatar, index) in displayAvatars"
      :key="index"
      :src="avatar.src"
      :name="avatar.name"
      :size="size"
      bordered
      border-color="border-white dark:border-zinc-900"
    />

    <!-- 剩余数量显示 -->
    <div
      v-if="remainingCount > 0"
      class="flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium border-2 border-white dark:border-zinc-900"
      :class="size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'"
    >
      +{{ remainingCount }}
    </div>
  </div>
</template>
