<script setup lang="ts">
import { Database, Pencil, Trash2 } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { KnowledgeBase } from '@/api/knowledgeBaseAPI'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  data: KnowledgeBase
  level: number
  isActive: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  click: []
  edit: []
  delete: []
}>()

const getAvatarSrc = (avatar: string | null) => {
  if (!avatar) return undefined
  if (avatar.startsWith('data:')) return avatar
  return `data:image/png;base64,${avatar}`
}

// Gradient color based on name hash
const getGradientColor = (name: string) => {
  const colors = [
    'from-lime-300 to-lime-500',
    'from-pink-400 to-rose-500',
    'from-pink-300 to-pink-400',
    'from-indigo-400 to-blue-500',
    'from-amber-300 to-orange-500',
    'from-cyan-400 to-teal-500',
    'from-violet-400 to-purple-500',
    'from-emerald-400 to-green-500'
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
</script>

<template>
  <div
    :class="[
      'group flex items-center gap-2.5 py-2 pr-2 rounded-lg cursor-pointer mb-0.5 transition-all duration-200',
      isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
    ]"
    :style="{ paddingLeft: `${level * 12 + 12}px` }"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter="emit('click')"
  >
    <!-- Icon -->
    <div
      :class="[
        'w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-200',
        isActive ? 'ring-1 ring-primary/20' : ''
      ]"
    >
      <img
        v-if="data.avatar"
        :src="getAvatarSrc(data.avatar)"
        alt="icon"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        :class="['w-full h-full bg-gradient-to-br flex items-center justify-center', getGradientColor(data.name)]"
      >
        <Database :size="13" class="text-white/90" />
      </div>
    </div>

    <!-- Name -->
    <span :class="['text-[0.8125rem] truncate flex-1', isActive ? 'font-semibold' : 'font-normal']">
      {{ data.name }}
    </span>

    <!-- Actions (hover reveal) -->
    <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-150 outline-none min-w-[28px] min-h-[28px] flex items-center justify-center"
              :aria-label="t('knowledge.dataset.edit')"
              @click.stop="emit('edit')"
            >
              <Pencil :size="13" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" :side-offset="6">{{ t('knowledge.dataset.edit') }}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-95 transition-all duration-150 outline-none min-w-[28px] min-h-[28px] flex items-center justify-center"
              :aria-label="t('knowledge.dataset.delete')"
              @click.stop="emit('delete')"
            >
              <Trash2 :size="13" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" :side-offset="6">{{ t('knowledge.dataset.delete') }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
</template>
