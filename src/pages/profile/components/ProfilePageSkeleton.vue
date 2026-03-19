<script setup lang="ts">
/**
 * ProfilePageSkeleton - 加载骨架屏
 * 匹配 ProfilePage 的单列布局：Header + Tabs + Content
 */
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 pt-2 pb-4">
    <!-- Header 骨架 -->
    <div class="flex items-center justify-between px-2 py-6">
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 animate-pulse rounded-full bg-muted" />
        <div class="flex flex-col gap-2">
          <div class="h-5 w-28 animate-pulse rounded-lg bg-muted" />
          <div class="h-3 w-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="hidden flex-col items-end gap-1 md:flex">
          <div class="h-7 w-16 animate-pulse rounded-lg bg-muted" />
          <div class="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div class="h-10 w-10 animate-pulse rounded-full bg-muted" />
      </div>
    </div>

    <!-- Tabs 骨架 -->
    <div class="flex items-center gap-6 border-b border-border/60 py-4">
      <div v-for="i in 5" :key="i" class="h-4 animate-pulse rounded bg-muted" :class="i === 5 ? 'w-16' : 'w-10'" />
    </div>

    <!-- Content 骨架 -->
    <div class="flex flex-col items-center justify-center py-20">
      <div class="h-24 w-24 animate-pulse rounded-[32px] bg-muted" />
      <div class="mt-6 h-5 w-40 animate-pulse rounded-lg bg-muted" />
      <div class="mt-3 h-4 w-56 animate-pulse rounded bg-muted" />
      <div class="mt-6 h-10 w-28 animate-pulse rounded-xl bg-muted" />
    </div>
  </div>
</template>
