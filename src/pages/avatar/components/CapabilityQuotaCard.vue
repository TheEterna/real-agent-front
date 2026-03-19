<!-- ================================================
  CapabilityQuotaCard — 能力配额卡片
  职责：展示已用/最大工具数、技能数
================================================ -->
<template>
  <div class="rounded-2xl border bg-card p-5 shadow-sm">
    <div class="flex items-center gap-6">
      <div class="flex-1">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-medium text-muted-foreground">{{ t('avatar.capability.tools') }}</span>
          <span class="text-xs font-semibold text-foreground tabular-nums">
            {{ quota.usedTools }} / {{ isToolsUnlimited ? '∞' : quota.maxTools }}
          </span>
        </div>
        <div v-if="!isToolsUnlimited" class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            :style="{ width: `${toolsPercent}%` }"
            class="h-full rounded-full transition-all duration-500"
            :class="quota.usedTools >= (quota.maxTools || 0) ? 'bg-red-500' : 'bg-primary'"
          />
        </div>
        <div v-else class="h-1.5 w-full rounded-full bg-primary/30" />
      </div>

      <div class="w-px h-10 bg-border/50" />

      <div class="flex-1">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-medium text-muted-foreground">{{ t('avatar.capability.skills') }}</span>
          <span class="text-xs font-semibold text-foreground tabular-nums">
            {{ quota.usedSkills }} / {{ isSkillsUnlimited ? '∞' : quota.maxSkills }}
          </span>
        </div>
        <div v-if="!isSkillsUnlimited" class="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            :style="{ width: `${skillsPercent}%` }"
            class="h-full rounded-full transition-all duration-500"
            :class="quota.usedSkills >= (quota.maxSkills || 0) ? 'bg-red-500' : 'bg-emerald-500'"
          />
        </div>
        <div v-else class="h-1.5 w-full rounded-full bg-emerald-500/30" />
      </div>
    </div>

    <div v-if="isFull" class="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
      <AlertTriangle :size="14" class="text-amber-600 dark:text-amber-400" />
      <span class="text-xs text-amber-700 dark:text-amber-300">
        {{ t('avatar.capability.quotaFull') }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle } from 'lucide-vue-next'
import type { CapabilityQuota } from '../types'

const { t } = useI18n()
const props = defineProps<{
  quota: CapabilityQuota
}>()

const isToolsUnlimited = computed(() => props.quota.maxTools === null)
const isSkillsUnlimited = computed(() => props.quota.maxSkills === null)

const toolsPercent = computed(() => {
  if (isToolsUnlimited.value || !props.quota.maxTools) return 0
  return Math.min(100, (props.quota.usedTools / props.quota.maxTools) * 100)
})

const skillsPercent = computed(() => {
  if (isSkillsUnlimited.value || !props.quota.maxSkills) return 0
  return Math.min(100, (props.quota.usedSkills / props.quota.maxSkills) * 100)
})

const isFull = computed(() => {
  const toolsFull = !isToolsUnlimited.value && props.quota.usedTools >= (props.quota.maxTools || 0)
  const skillsFull = !isSkillsUnlimited.value && props.quota.usedSkills >= (props.quota.maxSkills || 0)
  return toolsFull && skillsFull
})
</script>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .rounded-2xl.border.bg-card {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: none;
  }

  .w-px.bg-border\/50 {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
