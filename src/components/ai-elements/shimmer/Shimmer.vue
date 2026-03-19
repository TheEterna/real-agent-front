<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { cn } from '@repo/shadcn-vue/lib/utils'
import { motion } from 'motion-v'
import { useI18n } from 'vue-i18n'
import { computed, useSlots } from 'vue'

const { t } = useI18n()

export interface TextShimmerProps {
  as?: keyof HTMLElementTagNameMap
  class?: string
  duration?: number
  spread?: number
}

const props = withDefaults(defineProps<TextShimmerProps>(), {
  as: 'p',
  duration: 2,
  spread: 4,
})

const slots = useSlots()

const textContent = computed(() => {
  const defaultSlot = slots.default?.()
  if (!defaultSlot || defaultSlot.length === 0)
    return ''

  return defaultSlot
      .map((vnode) => {
        if (typeof vnode.children === 'string') {
          return vnode.children
        }
        return ''
      })
      .join('')
})

const dynamicSpread = computed(() => {
  return (textContent.value?.length ?? 0) * props.spread
})

const componentClasses = computed(() => cn(
  'relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent text-base',
  '[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)*1.5),rgb(from_var(--color-primary-400)_r_g_b_/_0.3)_calc(50%-var(--spread)*0.8),var(--color-primary-50)_50%,rgb(from_var(--color-primary-400)_r_g_b_/_0.5)_calc(50%+var(--spread)*0.8),#0000_calc(50%+var(--spread)*1.5))] [background-repeat:no-repeat,padding-box]',
  props.class
))

const componentStyle = computed((): CSSProperties => ({
  '--spread': `${dynamicSpread.value}px`,
  'backgroundImage':
      'var(--bg), linear-gradient(#8B9D9D, #8B9D9D)',
}))

const MotionComponent = computed(() => {
  return motion[props.as as keyof typeof motion] || motion.p
})
</script>

<template>
  <component
      :is="MotionComponent"
      :class="componentClasses"
      :style="componentStyle"
      :initial="{ backgroundPosition: '100% center' }"
      :animate="{ backgroundPosition: '0% center' }"
      :transition="{
      repeat: Number.POSITIVE_INFINITY,
      duration,
      ease: 'linear',
    }"
      role="status"
      :aria-label="t('aiElements.shimmer.loadingAriaLabel')"
  >
    <slot />
  </component>
</template>

<style scoped>
</style>