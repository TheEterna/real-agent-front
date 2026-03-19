<template>
  <div class="h-[100dvh] sm:h-screen w-full flex flex-col bg-slate-50 dark:bg-zinc-900">
    <!-- Header -->
    <header class="bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 px-4 sm:px-6 py-3 flex items-center justify-between z-10">
      <div class="flex items-center gap-2 sm:gap-3">
        <div class="w-9 h-9 sm:w-10 sm:h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white! shadow-md">
          <GitGraph :size="18" />
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-semibold text-slate-800 dark:text-zinc-200">{{ t("mindMap.title") }}</h1>
          <p class="hidden sm:block text-xs text-slate-500 dark:text-zinc-400">{{ t("mindMap.subtitle") }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1 sm:gap-2">
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('mindMap.undo')" class="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg transition-colors active:scale-95">
                <Undo :size="18" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t("mindMap.undo") }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('mindMap.redo')" class="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg transition-colors active:scale-95">
                <Redo :size="18" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t("mindMap.redo") }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div class="hidden sm:block h-6 w-px bg-border mx-2"></div>
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('mindMap.share')" class="w-11 h-11 sm:w-auto sm:px-4 sm:py-2 flex items-center justify-center bg-primary-500 text-white! rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors shadow-md active:scale-95">
                <span class="sm:hidden">
                  <Share2 :size="16" />
                </span>
                <span class="hidden sm:flex items-center gap-2">
                  <Share2 :size="16" />
                  {{ t("mindMap.share") }}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6" class="sm:hidden">{{ t("mindMap.share") }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-4 z-10 overflow-x-auto">
      <div class="flex items-center gap-1 shrink-0">
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button :aria-label="t('mindMap.addNode')" class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm font-medium text-foreground bg-muted hover:bg-accent border border-border rounded-lg transition-colors active:scale-95 whitespace-nowrap" @click="addNode">
                <PlusSquare :size="16" class="text-primary-500 shrink-0" />
                <span class="hidden md:inline whitespace-nowrap">{{ t("mindMap.addNode") }}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6" class="md:hidden">{{ t("mindMap.addNode") }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div class="h-5 w-px bg-border shrink-0"></div>
      <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 shrink-0">
        <span class="hidden md:inline whitespace-nowrap">{{ t("mindMap.layout") }}</span>
        <Select v-model="layoutType">
          <SelectTrigger class="h-8 w-[130px] border-none bg-transparent font-medium text-slate-700 dark:text-zinc-300 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{{ t("mindMap.layoutDefault") }}</SelectItem>
            <SelectItem value="org">{{ t("mindMap.layoutOrg") }}</SelectItem>
            <SelectItem value="fishbone">{{ t("mindMap.layoutFishbone") }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Canvas Area -->
    <div class="flex-1 relative bg-slate-50 dark:bg-zinc-900 overflow-hidden">
      <VueFlow
        v-model="elements"
        :default-viewport="{ zoom: 1.2 }"
        :min-zoom="0.2"
        :max-zoom="4"
        class="h-full w-full"
      >
        <Background :pattern-color="patternColor" :gap="20" />
        <Controls />
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import {
  GitGraph,
  Undo,
  Redo,
  Share2,
  PlusSquare
} from 'lucide-vue-next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDark } from '@vueuse/core';

// Styles
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

const { t } = useI18n();
const isDark = useDark();
const patternColor = computed(() => isDark.value ? '#3f3f46' : '#e2e8f0');
const layoutType = ref('default');

// Initial Elements
const elements = ref([
  { 
    id: '1', 
    type: 'input', 
    label: t('mindMap.coreTheme'), 
    position: { x: 250, y: 5 },
    class: 'bg-primary-500 text-white! font-bold rounded-xl border-2 border-primary-600 shadow-lg w-40 h-16 flex items-center justify-center'
  },
  { 
    id: '2', 
    label: t('mindMap.branchA'), 
    position: { x: 100, y: 150 },
    class: 'bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg border border-slate-300 dark:border-zinc-500 shadow-sm w-32 p-2 text-center'
  },
  { 
    id: '3', 
    label: t('mindMap.branchB'), 
    position: { x: 400, y: 150 },
    class: 'bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg border border-slate-300 dark:border-zinc-500 shadow-sm w-32 p-2 text-center'
  },
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--color-border, #cbd5e1)' } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: 'var(--color-border, #cbd5e1)' } },
]);

const { addNodes } = useVueFlow();

const addNode = () => {
  const id = Date.now().toString();
  const newNode = {
    id,
    label: t('mindMap.newNode', { n: elements.value.length + 1 }),
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    class: 'bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg border border-slate-300 dark:border-zinc-500 shadow-sm w-32 p-2 text-center'
  };
  addNodes([newNode]);
};

</script>

<style>
/* Override or add custom styles for Vue Flow if needed */
.vue-flow__node {
  /* Ensure default text alignment if not using custom node slots yet */
  text-align: center;
}
</style>
















