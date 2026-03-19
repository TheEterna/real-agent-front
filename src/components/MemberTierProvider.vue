<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import type { TierType } from '@/types/subscription'

const authStore = useAuthStore()

const tier = computed<TierType>(() => {
  // 优先从订阅信息获取，兼容旧的 tier 字段
  return authStore.user?.subscription?.planId ?? authStore.user?.tier ?? 'free'
})
</script>

<template>
  <slot v-if="tier === 'ultra' && $slots.ultra" name="ultra" />
  <slot v-else-if="tier === 'turbo' && $slots.turbo" name="turbo" />
  <slot v-else-if="tier === 'pro' && $slots.pro" name="pro" />
  <slot v-else-if="tier === 'free' && $slots.free" name="free" />
  <slot v-else />
</template>
