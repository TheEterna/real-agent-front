<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-b border-border/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="p-2 hover:bg-amber-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95" :aria-label="t('memoryAlbum.backTooltip')" @click="$router.back()">
                  <ArrowLeft class="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" :side-offset="6" class="animate-in fade-in-0 zoom-in-95">
                {{ t('memoryAlbum.backTooltip') }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <h1 class="text-2xl font-cinzel font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
            {{ t('memoryAlbum.title') }}
          </h1>
        </div>

        <!-- 搜索框 -->
        <div class="flex-1 max-w-md mx-8">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('memoryAlbum.searchPlaceholder')"
              class="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-zinc-800 border border-border focus:outline-none focus:ring-2 focus:ring-amber-500"
              @keydown.enter="handleSearch"
            />
          </div>
        </div>

        <!-- 上传按钮 -->
        <button class="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all" @click="triggerUpload">
          <Upload class="w-5 h-5 inline mr-2" />
          {{ t('memoryAlbum.uploadBtn') }}
        </button>
        <input ref="fileInput" type="file" accept="image/*,video/*" multiple class="hidden" @change="handleFileSelect" />
      </div>
    </header>

    <!-- 瀑布流网格 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="memoryStore.isLoading && memoryStore.memories.length === 0" class="text-center py-20">
        <div class="memory-album-loading-spinner inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>

      <div v-else-if="memoryStore.memories.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <ImageIcon class="w-20 h-20 text-muted-foreground/50 mb-4" />
        <p class="text-base text-muted-foreground">{{ t('memoryAlbum.emptyTitle') }}</p>
        <p class="mt-1 text-[0.8125rem] text-muted-foreground/60">{{ t('memoryAlbum.emptySubtitle') }}</p>
      </div>

      <div v-else class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        <div
          v-for="memory in memoryStore.memories"
          :key="memory.id"
          class="break-inside-avoid mb-4 group cursor-pointer"
          @click="openMemory(memory)"
        >
          <div class="relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
            <img :src="memory.fileUrl" :alt="memory.fileName" class="w-full h-auto" />

            <!-- 悬浮信息 -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p v-if="memory.aiCaption" class="text-base mb-2">{{ memory.aiCaption }}</p>
                <div class="flex flex-wrap gap-2">
                  <span v-for="tag in memory.aiTags.slice(0, 3)" :key="tag" class="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMemoryAlbumStore } from '@/stores/memoryAlbumStore'
import { ArrowLeft, Search, Upload, ImageIcon } from 'lucide-vue-next'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { MemoryAlbum } from '@/types/memoryAlbum'

const { t } = useI18n()

const memoryStore = useMemoryAlbumStore()
const searchQuery = ref('')
const fileInput = ref<HTMLInputElement>()

onMounted(() => {
  memoryStore.loadMemories(0)
})

const triggerUpload = () => {
  fileInput.value?.click()
}

const isUploading = ref(false)

const handleFileSelect = async (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files || isUploading.value) return
  isUploading.value = true
  try {
    for (const file of Array.from(files)) {
      await memoryStore.uploadMemory(file)
    }
  } finally {
    isUploading.value = false
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    memoryStore.searchMemories({ query: searchQuery.value, limit: 20 })
  } else {
    memoryStore.loadMemories(0)
  }
}

const openMemory = (memory: MemoryAlbum) => {
  console.log('打开记忆详情:', memory)
}
</script>

<style scoped>
.font-cinzel {
  font-family: var(--font-display);
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  .memory-album-loading-spinner {
    border-color: rgba(255, 255, 255, 0.1);
    border-top-color: var(--color-primary-400);
  }
}
</style>
