<template>
  <div class="h-[100dvh] sm:h-screen w-full bg-slate-50 dark:bg-zinc-900 flex flex-col">
    <!-- Header -->
    <header class="bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="w-9 h-9 sm:w-10 sm:h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white! shadow-md">
          <BookOpenCheck :size="18" />
        </div>
        <div>
          <h1 class="text-base sm:text-xl font-semibold text-slate-800 dark:text-zinc-200">{{ t("academicResearch.title") }}</h1>
          <p class="hidden sm:block text-xs text-slate-500 dark:text-zinc-400">{{ t("academicResearch.subtitle") }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 sm:gap-3">
        <button class="hidden sm:flex px-4 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors active:scale-95">
          {{ t("academicResearch.history") }}
        </button>
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('academicResearch.newResearch')" class="w-11 h-11 sm:w-auto sm:px-4 sm:py-2 flex items-center justify-center bg-primary-500 text-white! rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-md active:scale-95">
                <span class="sm:hidden">
                  <Plus :size="16" />
                </span>
                <span class="hidden md:inline whitespace-nowrap">{{ t("academicResearch.newResearch") }}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6" class="sm:hidden">{{ t("academicResearch.newResearch") }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden flex flex-col sm:flex-row">
      <!-- Sidebar / Search - 移动端隐藏，桌面端显示 -->
      <aside class="hidden sm:flex w-64 lg:w-80 bg-white dark:bg-zinc-800 border-r border-slate-200 dark:border-zinc-700 flex-col z-10">
        <div class="p-4 border-b border-slate-100 dark:border-zinc-700">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" :size="16" />
            <input
              type="text"
              :placeholder="t('academicResearch.searchPlaceholder')"
              class="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-700 dark:text-zinc-200"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-2">
          <div v-for="i in 5" :key="i" class="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer group transition-colors">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                <FileText :size="16" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-slate-700 dark:text-zinc-200 line-clamp-2 leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-400">Deep Learning in Medical Image Analysis</h4>
                <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">2024 • IEEE Transactions</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Content Area -->
      <section class="flex-1 bg-slate-50/50 dark:bg-zinc-900/50 p-4 sm:p-6 overflow-y-auto">
        <div class="max-w-4xl mx-auto space-y-4 sm:space-y-6">

          <!-- Search/Chat Input Area -->
          <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-4 sm:p-6">
            <h2 class="text-base sm:text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-3 sm:mb-4 flex items-center gap-2">
              <Sparkles class="text-primary-500" :size="18" />
              {{ t("academicResearch.researchGoal") }}
            </h2>
            <textarea
              class="w-full h-32 p-4 bg-slate-50 dark:bg-zinc-700 rounded-xl border border-slate-200 dark:border-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 dark:text-zinc-200 text-sm"
              :placeholder="t('academicResearch.textareaPlaceholder')"
            ></textarea>
            <div class="flex justify-between items-center mt-4">
              <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                <div class="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button :aria-label="t('academicResearch.uploadDoc')" class="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-muted-foreground hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors active:scale-95">
                        <Upload :size="18" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" :side-offset="6">{{ t("academicResearch.uploadDoc") }}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button :aria-label="t('academicResearch.filterSource')" class="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-muted-foreground hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors active:scale-95">
                        <Filter :size="18" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" :side-offset="6">{{ t("academicResearch.filterSource") }}</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
              <button class="px-5 sm:px-6 py-2 sm:py-2.5 bg-primary-500 text-white! rounded-xl text-sm font-medium hover:bg-primary-600 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2">
                <span class="hidden md:inline whitespace-nowrap">{{ t("academicResearch.startResearch") }}</span>
                <span class="sm:hidden">{{ t("academicResearch.start") }}</span>
                <ArrowRight :size="16" />
              </button>
            </div>
          </div>

          <!-- Results Preview -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <!-- Summary Card -->
            <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-slate-800 dark:text-zinc-200">{{ t("academicResearch.literatureReview") }}</h3>
                <span class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">{{ t("academicResearch.aiGenerated") }}</span>
              </div>
              <div class="space-y-3">
                <div class="h-2 bg-slate-100 dark:bg-zinc-700 rounded-full w-3/4"></div>
                <div class="h-2 bg-slate-100 dark:bg-zinc-700 rounded-full w-full"></div>
                <div class="h-2 bg-slate-100 dark:bg-zinc-700 rounded-full w-5/6"></div>
                <div class="h-2 bg-slate-100 dark:bg-zinc-700 rounded-full w-4/5"></div>
              </div>
              <p class="mt-4 text-sm text-slate-400 dark:text-zinc-500">{{ t("academicResearch.reviewPlaceholder") }}</p>
            </div>

            <!-- Key Papers -->
            <div class="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-medium text-slate-800 dark:text-zinc-200">{{ t("academicResearch.corePapers") }}</h3>
                <span class="text-xs text-slate-500 dark:text-zinc-400">{{ t("academicResearch.paperCount", { n: 0 }) }}</span>
              </div>
              <div class="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-zinc-500 text-sm border-2 border-dashed border-slate-100 dark:border-zinc-700 rounded-xl">
                <Library :size="24" class="mb-2 opacity-50" />
                {{ t("academicResearch.noPapers") }}
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  BookOpenCheck,
  Search,
  FileText,
  Sparkles,
  Upload,
  Filter,
  ArrowRight,
  Library,
  Plus
} from 'lucide-vue-next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
const { t } = useI18n()
</script>

<style scoped>
/* Custom scrollbar if needed */
</style>










