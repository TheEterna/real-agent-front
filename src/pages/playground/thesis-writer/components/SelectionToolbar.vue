<template>
  <Teleport to="body">
    <div
      v-show="visible"
      ref="toolbarRef"
      class="selection-toolbar fixed z-50 flex items-center gap-0.5 rounded-xl border border-slate-200/50 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 py-1 shadow-lg"
      :style="toolbarStyle"
    >
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip v-for="item in actions" :key="item.action">
          <TooltipTrigger as-child>
            <button
              :aria-label="item.label"
              class="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white active:scale-95"
              @click="handleAction(item.action)"
            >
              <component :is="item.icon" class="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 transition-colors group-hover:text-slate-600 dark:group-hover:text-zinc-300" />
              <span class="hidden sm:inline">{{ item.label }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" :side-offset="6">{{ item.label }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <!-- arrow pointing down -->
      <div
        class="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-200/50 dark:border-zinc-700 bg-white dark:bg-zinc-900"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  GraduationCap,
  Quote,
  Pencil,
} from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import gsap from 'gsap'
import type { InlineAction } from '@/types/thesis-writer'
import { useReducedMotion } from '@/composables/useReducedMotion'

interface Props {
  visible: boolean
  position: { top: number; left: number }
  selectedText: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'action', action: InlineAction, selectedText: string): void
}>()

const { t } = useI18n()
const toolbarRef = ref<HTMLElement | null>(null)
const { duration, ease } = useReducedMotion()

const actions = computed<{ action: InlineAction; label: string; icon: typeof Sparkles }[]>(() => [
  { action: 'polish', label: t('thesisWriter.selectionToolbar.polish'), icon: Sparkles },
  { action: 'expand', label: t('thesisWriter.selectionToolbar.expand'), icon: ArrowUpRight },
  { action: 'condense', label: t('thesisWriter.selectionToolbar.condense'), icon: ArrowDownRight },
  { action: 'academize', label: t('thesisWriter.selectionToolbar.academicize'), icon: GraduationCap },
  { action: 'cite', label: t('thesisWriter.selectionToolbar.cite'), icon: Quote },
  { action: 'custom', label: t('thesisWriter.selectionToolbar.custom'), icon: Pencil },
])

const toolbarStyle = computed(() => ({
  top: `${props.position.top - 8}px`,
  left: `${props.position.left}px`,
  transform: 'translate(-50%, -100%)',
}))

function handleAction(action: InlineAction) {
  emit('action', action, props.selectedText)
}

// GSAP animation for show/hide
watch(
  () => props.visible,
  async (newVal) => {
    await nextTick()
    const el = toolbarRef.value
    if (!el) return

    if (newVal) {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.9, y: 4 },
        { opacity: 1, scale: 1, y: 0, duration: duration.value, ease: ease.value },
      )
    } else {
      gsap.to(el, {
        opacity: 0,
        scale: 0.95,
        y: 4,
        duration: duration.value,
        ease: ease.value,
      })
    }
  },
)

onBeforeUnmount(() => {
  const el = toolbarRef.value
  if (el) gsap.killTweensOf(el)
})
</script>
