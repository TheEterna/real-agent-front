<template>
  <aside
    role="navigation"
    :aria-label="t('compPlayground.sidebar.navAriaLabel')"
    class="flex flex-col h-full bg-white dark:bg-zinc-900 shrink-0 relative z-30 transition-[width] duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-[4px_0_24px_-12px_rgba(0,0,0,0.02)]"
    :class="[
      collapsed ? 'w-[88px]' : 'w-[280px]',
      side === 'right' ? 'border-l border-zinc-200 dark:border-zinc-800' : 'border-r border-zinc-200 dark:border-zinc-800'
    ]"
  >
    <!-- Toggle Button -->
    <button
      class="absolute top-8 w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm z-50 transition-colors"
      :class="side === 'right' ? '-left-3' : '-right-3'"
      :aria-label="collapsed ? t('compPlayground.sidebar.expandSidebar') : t('compPlayground.sidebar.collapseSidebar')"
      @click="$emit('update:collapsed', !collapsed)"
    >
      <ChevronRight v-if="(side === 'left' && collapsed) || (side === 'right' && !collapsed)" class="w-3.5 h-3.5" />
      <PanelLeftClose v-else class="w-3 h-3" />
    </button>

    <!-- Top Section -->
    <div class="py-6 flex flex-col items-center gap-6 shrink-0" :class="{ 'px-6': !collapsed }">


      <!-- Divider -->
      <div class="h-px bg-zinc-100 dark:bg-zinc-800" :class="collapsed ? 'w-10' : 'w-full'"></div>
    </div>

    <!-- List -->
    <ScrollArea class="flex-1 w-full">
      <div class="flex flex-col gap-3 px-3 pb-6 w-full">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-4">
          <Loader2 class="w-5 h-5 animate-spin text-zinc-400" />
        </div>

        <div
          v-for="item in items"
          v-else
          :key="item.id"
          role="button"
          tabindex="0"
          :aria-label="item.title || item.prompt || 'Untitled'"
          class="group relative flex items-center gap-3 rounded-2xl cursor-pointer transition-all duration-200 w-full min-h-[48px]"
          :class="[
            activeItemId === item.id ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
            collapsed ? 'justify-center p-0' : 'p-2'
          ]"
          @click="$emit('select-item', item)"
          @keydown.enter="$emit('select-item', item)"
          @keydown.space.prevent="$emit('select-item', item)"
          @mouseenter="(e) => handleItemMouseEnter(item.id, e)"
          @mouseleave="handleItemMouseLeave"
        >
          <!-- Icon/Thumbnail Container -->
          <div
            class="shrink-0 rounded-2xl overflow-hidden border flex items-center justify-center transition-all relative z-10 w-12 h-12"
            :class="[
              getThumbnail(item)
                ? 'border-zinc-200 dark:border-zinc-700'
                : (activeItemId === item.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 group-hover:text-indigo-500')
            ]"
          >
            <img
              v-if="getThumbnail(item)"
              :src="getThumbnail(item)"
              alt=""
              class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <component :is="getIcon(mode)" v-else class="w-5 h-5" />

            <!-- Active Selection Ring for images -->
            <div
              v-if="getThumbnail(item) && activeItemId === item.id"
              class="absolute inset-0 border-2 border-indigo-500 rounded-2xl"
            ></div>
          </div>

          <!-- Text Details (Expanded Only) -->
          <div v-if="!collapsed" class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span
              class="text-sm font-bold truncate transition-colors"
              :class="activeItemId === item.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'"
            >
              {{ item.title || item.prompt || 'Untitled' }}
            </span>
            <div class="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
              <Clock class="w-2.5 h-2.5" />
              <span>{{ formatDate(item.timestamp || item.createdAt || item.createdTime) }}</span>
            </div>
          </div>

          <!-- Actions (Expanded Only - Hover) -->
          <div
            v-if="!collapsed"
            class="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-1 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm"
          >
            <!-- <button class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors" title="Rename">
              <Settings2 class="w-3 h-3" />
            </button> -->
            <button
              class="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors"
              title="Delete"
              :aria-label="t('common.tooltip.delete')"
              @click.stop="$emit('delete-item', item.id)"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- Tooltip Portal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 -translate-x-2 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 -translate-x-2 scale-95"
      >
        <div
          v-if="collapsed && hoveredItemId && hoverPosition"
          class="fixed z-9999 w-60"
          :style="{ top: hoverPosition.top + 'px', left: hoverPosition.left + 'px' }"
          @mouseenter="handleTooltipMouseEnter"
          @mouseleave="handleTooltipMouseLeave"
        >
          <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-3 flex items-start gap-3 relative min-w-[200px]">
            <!-- Arrow -->
            <div 
              class="absolute top-4 w-3 h-3 bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 rotate-45 transform"
              :class="[
                side === 'right' 
                  ? '-right-1.5 border-t border-r' 
                  : '-left-1.5 border-b border-l'
              ]"
            ></div>
            
            <div class="flex-1 min-w-0">
              <div class="font-bold text-zinc-800 dark:text-zinc-200 text-sm leading-snug line-clamp-2 mb-1">
                {{ getHoveredItemTitle() }}
              </div>
              <div class="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                <Clock class="w-2.5 h-2.5" />
                <span>{{ getHoveredItemDate() }}</span>
              </div>
            </div>
            
            <!-- Tooltip Actions -->
            <button
              class="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors shrink-0"
              :aria-label="t('common.tooltip.delete')"
              @click.stop="handleDeleteFromTooltip(hoveredItemId)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  PanelLeftClose,
  ChevronRight,
  Clock,
  Settings2,
  Trash2,
  MessageSquare,
  ImageIcon,
  Video,
  Mic2,
  Eye,
  Loader2
} from 'lucide-vue-next'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SidebarItem {
  id: string
  title?: string // or prompt
  prompt?: string
  createdAt?: string | number
  createdTime?: string | number // Basic playground (image/video/speech) uses createdTime
  timestamp?: string | number
  result?: { urls?: string[] }
  images?: string[]
  imageUrls?: string[] // Basic image history
  // Add other properties as needed
  [key: string]: any
}

const props = defineProps<{
  mode: 'chat' | 'image' | 'video' | 'speech' | 'vision'
  collapsed: boolean
  items: SidebarItem[]
  activeItemId: string | null
  loading?: boolean
  side?: 'left' | 'right'
}>()

const { side = 'left' } = props

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
  (e: 'new-session'): void
  (e: 'select-item', item: SidebarItem): void
  (e: 'delete-item', id: string): void
}>()

// Tooltip State
const hoveredItemId = ref<string | null>(null)
const hoverPosition = ref<{ top: number; left: number } | null>(null)
let hoverTimeout: any = null

function getIcon(mode: string) {
  switch (mode) {
    case 'chat': return MessageSquare
    case 'image': return ImageIcon
    case 'video': return Video
    case 'speech': return Mic2
    case 'vision': return Eye
    default: return MessageSquare
  }
}

function getThumbnail(item: SidebarItem): string | undefined {
  if (item.result?.urls?.[0]) return item.result.urls[0]
  if (item.images?.[0]) return item.images[0]
  if (item.imageUrls?.[0]) return item.imageUrls[0] // Basic image history
  if (item.preview) return item.preview
  return undefined
}

function formatDate(val: string | number | undefined): string {
  if (!val) return ''
  const d = new Date(val)
  return t('compPlayground.sidebar.dateFormat', { month: d.getMonth() + 1, day: d.getDate() })
}

function handleItemMouseEnter(itemId: string, e: MouseEvent) {
  if (!props.collapsed) return
  if (hoverTimeout) clearTimeout(hoverTimeout)
  
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  
  hoveredItemId.value = itemId
  
  // Calculate tooltip position based on sidebar side
  if (props.side === 'right') {
    // Show to the left of the sidebar
    // Tooltip width is fixed at w-60 (15rem = 240px)
    // Add some gap (14px)
    hoverPosition.value = {
      top: rect.top,
      left: rect.left - 240 - 14
    }
  } else {
    // Show to the right of the sidebar
    hoverPosition.value = {
      top: rect.top,
      left: rect.right + 14
    }
  }
}

function handleItemMouseLeave() {
  hoverTimeout = setTimeout(() => {
    hoveredItemId.value = null
    hoverPosition.value = null
  }, 150)
}

function handleTooltipMouseEnter() {
  if (hoverTimeout) clearTimeout(hoverTimeout)
}

function handleTooltipMouseLeave() {
  handleItemMouseLeave()
}

function getHoveredItemTitle() {
  const item = props.items.find(i => i.id === hoveredItemId.value)
  return item?.title || item?.prompt || 'Untitled'
}

function getHoveredItemDate() {
  const item = props.items.find(i => i.id === hoveredItemId.value)
  return formatDate(item?.timestamp || item?.createdAt || item?.createdTime)
}

function handleDeleteFromTooltip(id: string) {
  emit('delete-item', id)
  hoveredItemId.value = null
  hoverPosition.value = null
}
</script>

<style scoped>
/* Ensure button colors are explicit */
button {
  color: inherit; /* This might be the issue user warned about, but we are setting text-zinc-xxx explicitly in classes */
}
</style>