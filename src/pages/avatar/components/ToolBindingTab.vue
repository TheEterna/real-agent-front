<!-- ================================================
  ToolBindingTab — 工具绑定面板
  职责：展示已绑定工具 + 可绑定工具列表
================================================ -->
<template>
  <div class="space-y-4">
    <!-- 已绑定工具 -->
    <section class="rounded-2xl border bg-card p-5 shadow-sm">
      <h4 class="mb-3 text-sm font-semibold text-foreground">{{ t('avatar.toolBinding.boundTitle') }}</h4>

      <div v-if="isLoadingBound" class="flex justify-center py-8">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="boundTools.length === 0" class="py-8 text-center">
        <Wrench :size="32" class="mx-auto mb-3 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">{{ t('avatar.toolBinding.noTools') }}</p>
        <p class="mt-1 text-xs text-muted-foreground/60">{{ t('avatar.toolBinding.noToolsHint') }}</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="tool in boundTools"
          :key="tool.id"
          class="group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:bg-muted/30"
        >
          <!-- 分类图标 -->
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
            :class="categoryStyle(tool.category)"
          >
            {{ categoryIcon(tool.category) }}
          </div>

          <!-- 信息 -->
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-foreground truncate">{{ tool.toolName }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ tool.description }}</p>
          </div>

          <!-- 启用开关 -->
          <button
            role="switch"
            :aria-checked="tool.isEnabled"
            :aria-label="tool.isEnabled ? t('avatar.toolBinding.disableTool', { name: tool.toolName }) : t('avatar.toolBinding.enableTool', { name: tool.toolName })"
            class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            :class="tool.isEnabled ? 'bg-primary' : 'bg-muted'"
            style="min-width: 48px; min-height: 44px; padding-block: 8px"
            @click="$emit('toggle', tool.toolId, !tool.isEnabled)"
          >
            <span
              class="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200"
              :class="tool.isEnabled ? 'left-[26px]' : 'left-[3px]'"
            />
          </button>

          <!-- 解绑按钮 -->
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 active:scale-95"
                  :aria-label="t('avatar.toolBinding.removeTool', { name: tool.toolName })"
                  @click="$emit('unbind', tool.toolId)"
                >
                  <X :size="14" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" :side-offset="6">{{ t('avatar.toolBinding.remove') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </section>

    <!-- 可用工具 -->
    <section class="rounded-2xl border bg-card p-5 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h4 class="text-sm font-semibold text-foreground">{{ t('avatar.toolBinding.availableTitle') }}</h4>
        <span class="text-xs text-muted-foreground">
          {{ t('avatar.toolBinding.availableCount', { n: availableUnbound.length }) }}
        </span>
      </div>

      <div v-if="isLoadingAvailable" class="flex justify-center py-8">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="availableUnbound.length === 0" class="py-8 text-center">
        <p class="text-sm text-muted-foreground">{{ t('avatar.toolBinding.allBound') }}</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="tool in availableUnbound"
          :key="tool.id"
          :disabled="!canBind"
          class="flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          @click="$emit('bind', tool)"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
            :class="categoryStyle(tool.category)"
          >
            {{ categoryIcon(tool.category) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-foreground truncate">{{ tool.name }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ tool.description }}</p>
          </div>
          <Plus :size="16" class="shrink-0 text-muted-foreground" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, Wrench, Plus, X } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AvatarTool, AvailableTool, CapabilityQuota, ToolCategory } from '../types'

const { t } = useI18n()
const props = defineProps<{
  boundTools: AvatarTool[]
  availableTools: AvailableTool[]
  quota: CapabilityQuota
  isLoadingBound: boolean
  isLoadingAvailable: boolean
}>()

defineEmits<{
  bind: [tool: AvailableTool]
  unbind: [toolId: string]
  toggle: [toolId: string, enabled: boolean]
}>()

const availableUnbound = computed(() =>
  props.availableTools.filter((t) => !t.isBound),
)

const canBind = computed(() =>
  props.quota.maxTools === null || props.quota.usedTools < props.quota.maxTools,
)

function categoryIcon(cat: ToolCategory): string {
  const map: Record<ToolCategory, string> = {
    web: '🌐', data: '📊', ai: '🤖', document: '📄', code: '💻', chat: '💬',
  }
  return map[cat] ?? '🔧'
}

function categoryStyle(cat: ToolCategory): string {
  const map: Record<ToolCategory, string> = {
    web: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    data: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    ai: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    document: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    code: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    chat: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  }
  return map[cat] ?? 'bg-muted'
}
</script>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .rounded-2xl.border.bg-card.shadow-sm {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: none;
  }

  .group.flex.items-center.rounded-xl.border {
    border-color: rgba(255, 255, 255, 0.06);

    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }
  }
}
</style>
