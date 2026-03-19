<template>
  <div class="w-full h-full mx-auto px-12 pt-8 pb-12 bg-background overflow-auto">
    <!-- 页面头部 -->
    <div class="mb-12 flex flex-col gap-5">
      <div>
        <h1 class="text-3xl font-extralight text-foreground mb-1.5">{{ t('playground.index.title') }}</h1>
        <p class="text-sm text-muted-foreground leading-relaxed">{{ t('playground.index.subtitle') }}</p>
      </div>

      <!-- 搜索框 -->
      <div class="relative w-[400px]">
        <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          v-model="searchQuery"
          :placeholder="t('playground.index.searchPlaceholder')"
          class="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <!-- 筛选标签 -->
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="tag in filterTags"
          :key="tag.value"
          class="inline-block px-3.5 py-1.5 rounded-full text-sm cursor-pointer transition-all duration-200 active:scale-95"
          :class="isTagActive(tag.value)
            ? 'bg-primary text-primary-foreground font-medium'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'"
          @click="setActiveTag(tag.value)"
        >
          {{ tag.label }}
        </button>
      </div>
    </div>

    <!-- System 系统应用区域 -->
    <section class="mb-14">
      <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{{ t('playground.index.systemAppsTitle') }}</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="app in systemApps"
          :key="app.id"
          class="bg-gradient-to-b from-primary/5 to-primary/[0.01] dark:from-primary/10 dark:to-primary/[0.02] border border-border rounded-lg p-5 transition-all duration-300 group relative overflow-hidden"
          :class="app.comingSoon ? 'opacity-60 cursor-default' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'"
          :role="app.comingSoon ? undefined : 'button'"
          :tabindex="app.comingSoon ? -1 : 0"
          :aria-label="app.name + ' - ' + app.description"
          @click="navigateToApp(app)"
          @keydown.enter="navigateToApp(app)"
        >
          <div class="flex items-start gap-5 relative z-10">
            <div class="w-14 h-14 shrink-0 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
              <img :src="app.icon" :alt="app.name" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-base font-medium text-foreground group-hover:text-primary transition-colors">{{ app.name }}</h3>
                <span v-if="app.comingSoon" class="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full tracking-wider">{{ t('playground.index.comingSoon') }}</span>
                <span v-else class="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{{ t('playground.index.core') }}</span>
              </div>
              <p class="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{{ app.creator }}</p>
              <p class="text-sm text-muted-foreground leading-relaxed">{{ app.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Basic 基础模型区域 -->
    <section class="mb-14">
      <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{{ t('playground.index.basicAppsTitle') }}</div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="app in basicApps"
          :key="app.id"
          class="bg-card dark:bg-card border border-border rounded-lg p-5 transition-all duration-300 group"
          :class="app.comingSoon ? 'opacity-60 cursor-default' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'"
          :role="app.comingSoon ? undefined : 'button'"
          :tabindex="app.comingSoon ? -1 : 0"
          :aria-label="app.name"
          @click="navigateToApp(app)"
          @keydown.enter="navigateToApp(app)"
        >
          <div class="w-10 h-10 mb-4 rounded-[10px] bg-muted flex items-center justify-center overflow-hidden relative">
            <span v-if="app.comingSoon" class="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium rounded-[10px]">{{ t('playground.index.comingSoon') }}</span>
            <img :src="app.icon" :alt="app.name" class="w-full h-full object-cover" />
          </div>
          <h3 class="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors truncate">{{ app.name }}</h3>
          <p class="text-xs text-muted-foreground mb-2 truncate">{{ app.creator }}</p>
          <p class="text-sm text-muted-foreground leading-relaxed line-clamp-2">{{ app.description }}</p>
        </div>
      </div>
    </section>

    <!-- Research & Writing 研究与写作区域 -->
    <section class="mb-14">
      <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{{ t('playground.index.featuredTitle') }}</div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="app in featuredApps"
          :key="app.id"
          class="bg-card dark:bg-card border border-border rounded-lg p-5 transition-all duration-300 group"
          :class="app.comingSoon ? 'opacity-60 cursor-default' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'"
          :role="app.comingSoon ? undefined : 'button'"
          :tabindex="app.comingSoon ? -1 : 0"
          :aria-label="app.name"
          @click="navigateToApp(app)"
          @keydown.enter="navigateToApp(app)"
        >
          <div class="w-10 h-10 mb-4 rounded-full overflow-hidden flex items-center justify-center">
            <img :src="app.icon" :alt="app.name" class="w-full h-full object-cover" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{{ app.name }}</h3>
              <span v-if="app.comingSoon" class="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{{ t('playground.index.comingSoon') }}</span>
            </div>
            <p class="text-xs text-muted-foreground mb-2">{{ app.creator }}</p>
            <p class="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {{ app.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trending 热门区域 -->
    <section class="mb-14">
      <div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">{{ t('playground.index.trendingTitle') }}</div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="app in trendingApps"
          :key="app.id"
          class="flex gap-4 bg-card dark:bg-card border border-border rounded-lg p-5 transition-all duration-300 group"
          :class="app.comingSoon ? 'opacity-60 cursor-default' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2'"
          :role="app.comingSoon ? undefined : 'button'"
          :tabindex="app.comingSoon ? -1 : 0"
          :aria-label="app.name"
          @click="navigateToApp(app)"
          @keydown.enter="navigateToApp(app)"
        >
          <div class="w-10 h-10 shrink-0 rounded-full overflow-hidden flex items-center justify-center">
            <img :src="app.icon" :alt="app.name" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{{ app.name }}</h3>
              <span v-if="app.comingSoon" class="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{{ t('playground.index.comingSoon') }}</span>
            </div>
            <p class="text-sm text-muted-foreground leading-relaxed mb-1.5 line-clamp-2">
              {{ app.description }}
            </p>
            <p class="text-xs text-muted-foreground">{{ app.creator }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { usePlayground } from './usePlayground'

const { t } = useI18n()
const {
  filterTags,
  systemApps,
  basicApps,
  featuredApps,
  trendingApps,
  searchQuery,
  isTagActive,
  setActiveTag,
  navigateToApp,
} = usePlayground()
</script>

<style scoped>

</style>
