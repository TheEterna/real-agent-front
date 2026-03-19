<!-- ================================================
  SkillBindingTab — 技能绑定面板
  职责：展示已绑定技能 + 可绑定技能列表
================================================ -->
<template>
  <div class="space-y-4">
    <!-- 已绑定技能 -->
    <section class="rounded-2xl border bg-card p-5 shadow-sm">
      <h4 class="mb-3 text-sm font-semibold text-foreground">{{ t('avatar.skillBinding.boundTitle') }}</h4>

      <div v-if="isLoadingBound" class="flex justify-center py-8">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="boundSkills.length === 0" class="py-8 text-center">
        <Sparkles :size="32" class="mx-auto mb-3 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground">{{ t('avatar.skillBinding.noSkills') }}</p>
        <p class="mt-1 text-xs text-muted-foreground/60">{{ t('avatar.skillBinding.noSkillsHint') }}</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="skill in boundSkills"
          :key="skill.id"
          class="group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:bg-muted/30"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
            :class="categoryStyle(skill.category)"
          >
            {{ categoryIcon(skill.category) }}
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-foreground truncate">{{ skill.skillName }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ skill.description }}</p>
          </div>

          <button
            role="switch"
            :aria-checked="skill.isEnabled"
            :aria-label="skill.isEnabled ? t('avatar.skillBinding.disableSkill', { name: skill.skillName }) : t('avatar.skillBinding.enableSkill', { name: skill.skillName })"
            class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            :class="skill.isEnabled ? 'bg-primary' : 'bg-muted'"
            style="min-width: 48px; min-height: 44px; padding-block: 8px"
            @click="$emit('toggle', skill.skillId, !skill.isEnabled)"
          >
            <span
              class="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200"
              :class="skill.isEnabled ? 'left-[26px]' : 'left-[3px]'"
            />
          </button>

          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="shrink-0 rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 active:scale-95"
                  :aria-label="t('avatar.skillBinding.removeSkill', { name: skill.skillName })"
                  @click="$emit('unbind', skill.skillId)"
                >
                  <X :size="14" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" :side-offset="6">{{ t('avatar.skillBinding.remove') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </section>

    <!-- 可用技能 -->
    <section class="rounded-2xl border bg-card p-5 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <h4 class="text-sm font-semibold text-foreground">{{ t('avatar.skillBinding.availableTitle') }}</h4>
        <span class="text-xs text-muted-foreground">
          {{ t('avatar.skillBinding.availableCount', { n: availableUnbound.length }) }}
        </span>
      </div>

      <div v-if="isLoadingAvailable" class="flex justify-center py-8">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else-if="availableUnbound.length === 0" class="py-8 text-center">
        <p class="text-sm text-muted-foreground">{{ t('avatar.skillBinding.allBound') }}</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="skill in availableUnbound"
          :key="skill.id"
          :disabled="!canBind"
          class="flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          @click="$emit('bind', skill)"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
            :class="categoryStyle(skill.category)"
          >
            {{ categoryIcon(skill.category) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <p class="text-sm font-medium text-foreground truncate">{{ skill.name }}</p>
              <span
                v-if="skill.isOfficial"
                class="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
              >
                {{ t('avatar.skillBinding.official') }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground truncate">{{ skill.description }}</p>
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
import { Loader2, Sparkles, Plus, X } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AvatarSkill, AvailableSkill, CapabilityQuota, SkillCategory } from '../types'

const { t } = useI18n()
const props = defineProps<{
  boundSkills: AvatarSkill[]
  availableSkills: AvailableSkill[]
  quota: CapabilityQuota
  isLoadingBound: boolean
  isLoadingAvailable: boolean
}>()

defineEmits<{
  bind: [skill: AvailableSkill]
  unbind: [skillId: string]
  toggle: [skillId: string, enabled: boolean]
}>()

const availableUnbound = computed(() =>
  props.availableSkills.filter((s) => !s.isBound),
)

const canBind = computed(() =>
  props.quota.maxSkills === null || props.quota.usedSkills < props.quota.maxSkills,
)

function categoryIcon(cat: SkillCategory): string {
  const map: Record<SkillCategory, string> = {
    writing: '✍️', code: '💻', analysis: '📈', research: '🔬', productivity: '⚡', creative: '🎨',
  }
  return map[cat] ?? '✨'
}

function categoryStyle(cat: SkillCategory): string {
  const map: Record<SkillCategory, string> = {
    writing: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    code: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    analysis: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    research: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    productivity: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    creative: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
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
