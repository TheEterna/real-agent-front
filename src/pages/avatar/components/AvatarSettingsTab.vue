<!-- ================================================
  AvatarSettingsTab — 分身设置 Tab
  职责：合并人设 + 行为权限 + 记忆管理
  替代：Personality.vue + Autonomy.vue + Memory.vue
================================================ -->
<template>
  <div ref="settingsRef" class="mx-auto max-w-5xl px-6 py-8 space-y-5">
    <!-- ==================== 人设 Section ==================== -->
    <section ref="personalitySectionRef" class="settings-section rounded-2xl border bg-card p-6 shadow-sm">
      <h3 class="mb-5 text-base font-semibold text-foreground">{{ t('avatar.settings.personalityTitle') }}</h3>

      <!-- 预设选择器 -->
      <PersonalityPresets class="mb-4" @select="applyPreset" />

      <!-- 语气风格 -->
      <label for="tone-input" class="mb-1.5 block text-sm font-medium text-foreground">{{ t('avatar.settings.toneLabel') }}</label>
      <textarea
        id="tone-input"
        v-model="tone"
        :placeholder="t('avatar.settings.tonePlaceholder')"
        class="w-full resize-none rounded-xl border bg-transparent p-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
        rows="3"
      />

      <!-- 兴趣爱好 -->
      <h4 class="mt-4 mb-2 text-sm font-medium text-foreground">{{ t('avatar.settings.interestsTitle') }}</h4>
      <div class="flex flex-wrap gap-2" role="list" :aria-label="t('avatar.settings.interestsList')">
        <span
          v-for="(item, i) in interests"
          :key="i"
          role="listitem"
          class="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs transition-all"
        >
          {{ item }}
          <button
            class="rounded-full p-0.5 text-muted-foreground/50 transition-colors hover:bg-muted-foreground/10 hover:text-foreground active:scale-95"
            :aria-label="t('avatar.settings.removeInterest', { item })"
            @click="interests.splice(i, 1)"
          >
            <XIcon :size="12" />
          </button>
        </span>
        <label class="sr-only" for="new-interest-input">{{ t('avatar.settings.addInterestLabel') }}</label>
        <input
          id="new-interest-input"
          v-model="newInterest"
          :placeholder="t('avatar.settings.addPlaceholder')"
          class="min-h-[28px] w-20 bg-transparent text-xs outline-none transition-colors placeholder:text-muted-foreground/50"
          @keydown.enter.prevent="addTag('interest')"
        />
      </div>

      <!-- 专业领域 -->
      <h4 class="mt-4 mb-2 text-sm font-medium text-foreground">{{ t('avatar.settings.expertiseTitle') }}</h4>
      <div class="flex flex-wrap gap-2" role="list" :aria-label="t('avatar.settings.expertiseList')">
        <span
          v-for="(item, i) in expertise"
          :key="i"
          role="listitem"
          class="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary transition-all"
        >
          {{ item }}
          <button
            class="rounded-full p-0.5 text-primary/50 transition-colors hover:bg-primary/10 hover:text-primary active:scale-95"
            :aria-label="t('avatar.settings.removeExpertise', { item })"
            @click="expertise.splice(i, 1)"
          >
            <XIcon :size="12" />
          </button>
        </span>
        <label class="sr-only" for="new-expertise-input">{{ t('avatar.settings.addExpertiseLabel') }}</label>
        <input
          id="new-expertise-input"
          v-model="newExpertise"
          :placeholder="t('avatar.settings.addPlaceholder')"
          class="min-h-[28px] w-20 bg-transparent text-xs outline-none transition-colors placeholder:text-muted-foreground/50"
          @keydown.enter.prevent="addTag('expertise')"
        />
      </div>
    </section>

    <!-- ==================== 行为权限 Section (新版细粒度权限) ==================== -->
    <section ref="autonomySectionRef" class="settings-section rounded-2xl border bg-card p-6 shadow-sm">
      <h3 class="mb-5 text-base font-semibold text-foreground">{{ t('avatar.settings.permissionsTitle') }}</h3>

      <!-- 细粒度权限设置 -->
      <PermissionSettings
        v-model:base-permissions="basePermissions"
        v-model:mcp-capabilities="mcpCapabilities"
        v-model:global-daily-limit="globalDailyLimit"
        v-model:max-content-length="maxContentLength"
      />

      <!-- 激活开关 -->
      <div class="mt-6 flex items-center justify-between gap-4 rounded-xl border p-4">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-foreground">{{ t('avatar.settings.activateTitle') }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {{ t('avatar.settings.activateDesc') }}
          </p>
        </div>
        <button
          role="switch"
          :aria-checked="active"
          :aria-label="t('avatar.settings.activateLabel')"
          class="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          :class="active ? 'bg-primary' : 'bg-muted'"
          style="min-width: 48px; min-height: 44px; padding-block: 8px"
          @click="active = !active"
        >
          <span
            class="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200"
            :class="active ? 'left-[26px]' : 'left-[3px]'"
            aria-hidden="true"
          />
        </button>
      </div>
    </section>

    <!-- ==================== 记忆 Section (Collapsible) ==================== -->
    <section ref="memorySectionRef" class="settings-section">
      <Collapsible v-model:open="memoryOpen">
        <div class="rounded-2xl border bg-card">
          <CollapsibleTrigger as-child>
            <button
              class="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/30 rounded-2xl min-h-[44px]"
              :aria-label="t('avatar.settings.expandMemory')"
            >
              <div class="flex items-center gap-2">
                <Brain :size="18" class="text-muted-foreground" />
                <span class="text-base font-semibold text-foreground">{{ t('avatar.settings.memoryTitle') }}</span>
                <span class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {{ memories.length }}
                </span>
              </div>
              <ChevronDown
                :size="18"
                class="text-muted-foreground transition-transform duration-200"
                :class="{ 'rotate-180': memoryOpen }"
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div ref="memoryContentRef" class="border-t px-6 pb-6 pt-4">
              <!-- 加载态 -->
              <div v-if="isLoadingMemories" class="flex justify-center py-6">
                <Loader2 :size="20" class="animate-spin text-muted-foreground" />
              </div>

              <!-- 空状态 -->
              <div v-else-if="memories.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
                <Brain :size="28" class="mb-3 text-muted-foreground/30" />
                <p class="text-base text-muted-foreground">{{ t('avatar.settings.noMemory') }}</p>
                <p class="mt-1 text-xs text-muted-foreground/60">{{ t('avatar.settings.memoryHint') }}</p>
              </div>

              <!-- 记忆列表（按类型分组） -->
              <div v-else class="space-y-4">
                <div v-for="group in groupedMemories" :key="group.type">
                  <!-- 分类标题 -->
                  <div class="mb-2 flex items-center gap-2">
                    <component
                      :is="memoryTypeConfig[group.type]?.icon ?? Brain"
                      :size="15"
                      :class="memoryTypeConfig[group.type]?.color ?? 'text-muted-foreground'"
                    />
                    <span class="text-xs font-medium text-muted-foreground">
                      {{ memoryTypeLabel(group.type) }}
                    </span>
                    <span class="text-xs text-muted-foreground/60">{{ group.items.length }}</span>
                  </div>

                  <!-- 该分类下的记忆项 -->
                  <div class="space-y-2 pl-[23px]">
                    <div
                      v-for="memory in group.items"
                      :key="memory.id"
                      class="group flex items-start justify-between gap-3 rounded-xl border p-3 transition-all duration-200"
                    >
                      <div class="flex-1 min-w-0">
                        <p class="text-base text-foreground/90 leading-relaxed break-words">
                          {{ formatMemoryContent(memory.content) }}
                        </p>
                        <p v-if="memory.source || memory.createdTime" class="mt-1 text-xs text-muted-foreground/60">
                          <span v-if="memory.source">{{ memory.source }}</span>
                          <span v-if="memory.source && memory.createdTime"> · </span>
                          <span v-if="memory.createdTime">{{ memory.createdTime.toLocaleDateString() }}</span>
                        </p>
                      </div>
                      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <button
                              class="shrink-0 rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground opacity-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 active:scale-95"
                              :disabled="deletingMemoryIds.has(memory.id)"
                              :aria-label="t('avatar.settings.deleteMemoryLabel', { type: memoryTypeLabel(memory.type) })"
                              @click="handleDeleteMemory(memory.id)"
                            >
                              <Loader2 v-if="deletingMemoryIds.has(memory.id)" :size="16" class="animate-spin" />
                              <Trash2 v-else :size="16" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            :side-offset="6"
                            class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                          >
                            {{ t('avatar.settings.deleteMemory') }}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </section>

    <!-- ==================== 保存按钮 ==================== -->
    <div class="settings-section flex justify-center py-4">
      <button
        ref="saveBtnRef"
        :disabled="isSaving || !hasChanges"
        class="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 shadow-sm"
        @click="handleSave"
      >
        <Loader2 v-if="isSaving" :size="14" class="animate-spin" aria-hidden="true" />
        {{ isSaving ? t('avatar.settings.saving') : t('avatar.settings.saveSettings') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted, onUnmounted, nextTick } from "vue"
import {
  X as XIcon,
  Brain,
  ChevronDown,
  Loader2,
  Trash2,
  Palette,
  BookOpen,
  Heart,
  Zap,
} from "lucide-vue-next"
import gsap from "gsap"
import { message } from "ant-design-vue"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAvatarStore } from "@/stores/avatarStore"
import { useI18n } from 'vue-i18n'
import { useFluidAnimation } from "@/composables/useFluidAnimation"
import { useReducedMotion } from "@/composables/useReducedMotion"
import PersonalityPresets from "./PersonalityPresets.vue"
import PermissionSettings from "./PermissionSettings.vue"
import type { PersonalityPresetData, BasePermissions, McpCapabilityPermission } from "../types"

const props = defineProps<{ avatarId: string }>()

const { t } = useI18n()
const store = useAvatarStore()
const { confirmSuccess, shakeError } = useFluidAnimation()
const { prefersReduced } = useReducedMotion()

// ---- Store 数据 ----
const avatar = computed(() => store.activeAvatar)
const memories = computed(() => store.memories)
const isLoadingMemories = computed(() => store.isLoadingMemories)

// ---- 表单状态（人设） ----
const tone = ref("")
const interests = ref<string[]>([])
const expertise = ref<string[]>([])
const newInterest = ref("")
const newExpertise = ref("")

// ---- 表单状态（行为权限） ----
const autonomy = ref<"auto" | "approval" | "off">("approval")
const active = ref(false)

// ---- 细粒度权限状态（新版） ----
const basePermissions = ref<BasePermissions>({
  post: "approval",
  comment: "approval",
  like: "approval",
  follow: "approval",
})
const mcpCapabilities = ref<McpCapabilityPermission[]>([])
const globalDailyLimit = ref(100)
const maxContentLength = ref(500)

// ---- UI 状态 ----
const isSaving = ref(false)
const memoryOpen = ref(false)
const deletingMemoryIds = reactive(new Set<string>())

// ---- Template refs ----
const settingsRef = ref<HTMLElement>()
const personalitySectionRef = ref<HTMLElement>()
const autonomySectionRef = ref<HTMLElement>()
const memorySectionRef = ref<HTMLElement>()
const saveBtnRef = ref<HTMLElement>()
const memoryContentRef = ref<HTMLElement>()

// ---- 入场动画追踪 ----
let entryAnims: gsap.core.Tween[] = []

// ---- 变更检测 ----
const hasChanges = computed(() => {
  if (!avatar.value) return false
  const p = avatar.value.personality
  const personalityChanged =
    tone.value !== (p?.tone ?? "") ||
    JSON.stringify(interests.value) !== JSON.stringify(p?.interests ?? []) ||
    JSON.stringify(expertise.value) !== JSON.stringify(p?.expertise ?? [])
  const autonomyChanged =
    autonomy.value !== (avatar.value.autonomy ?? "approval") ||
    active.value !== (avatar.value.active ?? false)
  // 细粒度权限变更检测
  const currentPerms = avatar.value.permissions
  const permissionsChanged =
    JSON.stringify(basePermissions.value) !== JSON.stringify(currentPerms?.base ?? { post: "approval", comment: "approval", like: "approval", follow: "approval" }) ||
    globalDailyLimit.value !== (currentPerms?.globalDailyLimit ?? 100) ||
    maxContentLength.value !== (currentPerms?.maxContentLength ?? 500)
  return personalityChanged || autonomyChanged || permissionsChanged
})

// ---- 水合表单数据 ----
watch(
  avatar,
  (val) => {
    if (val) {
      tone.value = val.personality?.tone ?? ""
      interests.value = [...(val.personality?.interests ?? [])]
      expertise.value = [...(val.personality?.expertise ?? [])]
      autonomy.value = val.autonomy ?? "approval"
      active.value = val.active ?? false
      // 初始化细粒度权限
      const perms = val.permissions
      basePermissions.value = {
        post: perms?.base?.post ?? "approval",
        comment: perms?.base?.comment ?? "approval",
        like: perms?.base?.like ?? "approval",
        follow: perms?.base?.follow ?? "approval",
      }
      globalDailyLimit.value = perms?.globalDailyLimit ?? 100
      maxContentLength.value = perms?.maxContentLength ?? 500
    }
  },
  { immediate: true },
)

// ---- 预设应用 ----
function applyPreset(preset: PersonalityPresetData) {
  tone.value = preset.tone
  interests.value = [...preset.interests]
  expertise.value = [...preset.expertise]
}

// ---- 标签添加 ----
function addTag(type: "interest" | "expertise") {
  if (type === "interest" && newInterest.value.trim()) {
    interests.value.push(newInterest.value.trim())
    newInterest.value = ""
  } else if (type === "expertise" && newExpertise.value.trim()) {
    expertise.value.push(newExpertise.value.trim())
    newExpertise.value = ""
  }
}

// ---- 记忆类型配置 ----
const memoryTypeConfig: Record<string, { label: string; icon: typeof Palette; color: string; bg: string }> = {
  style: { label: t('avatar.settings.memoryTypeStyle'), icon: Palette, color: "text-violet-500", bg: "bg-violet-500/10" },
  knowledge: { label: t('avatar.settings.memoryTypeKnowledge'), icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
  preference: { label: t('avatar.settings.memoryTypePreference'), icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
  behavior: { label: t('avatar.settings.memoryTypeBehavior'), icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
}

function memoryTypeLabel(type: string): string {
  return memoryTypeConfig[type]?.label ?? type
}

// ---- 记忆分组 ----
type MemoryItem = (typeof memories.value)[number]
const groupedMemories = computed(() => {
  const groups: Record<string, MemoryItem[]> = {}
  for (const mem of memories.value) {
    const key = mem.type || "other"
    if (!groups[key]) groups[key] = []
    groups[key].push(mem)
  }
  // 按配置顺序排列，未知类型放末尾
  const order = ["preference", "style", "knowledge", "behavior"]
  const sorted: { type: string; items: MemoryItem[] }[] = []
  for (const t of order) {
    if (groups[t]) sorted.push({ type: t, items: groups[t] })
  }
  for (const [t, items] of Object.entries(groups)) {
    if (!order.includes(t)) sorted.push({ type: t, items })
  }
  return sorted
})

// ---- 记忆内容格式化 ----
function formatMemoryContent(content: unknown): string {
  if (!content) return t('avatar.settings.memoryEmpty')
  if (typeof content === "string") return content
  if (typeof content === "object") {
    const entries = Object.entries(content as Record<string, unknown>)
    if (entries.length === 0) return t('avatar.settings.memoryEmpty')
    return entries
      .map(([key, val]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()
        const value = typeof val === "object" ? JSON.stringify(val) : String(val ?? "")
        return `${label}: ${value}`
      })
      .join("；")
  }
  return String(content)
}

// ---- 记忆删除 ----
async function handleDeleteMemory(memoryId: string) {
  if (deletingMemoryIds.has(memoryId)) return
  deletingMemoryIds.add(memoryId)

  try {
    await store.deleteMemory(props.avatarId, memoryId)
  } catch {
    message.error(t('avatar.settings.deleteMemoryFailed'))
  } finally {
    deletingMemoryIds.delete(memoryId)
  }
}

// ---- 保存（personality + autonomy + permissions） ----
async function handleSave() {
  if (isSaving.value || !hasChanges.value) return
  isSaving.value = true

  try {
    await store.updatePersonality(props.avatarId, {
      tone: tone.value,
      interests: interests.value,
      expertise: expertise.value,
      quirks: avatar.value?.personality?.quirks ?? [],
    })
    await store.updateAutonomy(props.avatarId, {
      autonomy: autonomy.value,
      active: active.value,
    })
    // 保存细粒度权限
    await store.updatePermissions(props.avatarId, {
      base: basePermissions.value,
      mcpCapabilities: mcpCapabilities.value,
      globalDailyLimit: globalDailyLimit.value,
      maxContentLength: maxContentLength.value,
    })
    message.success(t('avatar.settings.saveSuccess'))
    if (saveBtnRef.value) confirmSuccess(saveBtnRef.value)
  } catch {
    message.error(t('avatar.settings.saveFailed'))
    if (saveBtnRef.value) shakeError(saveBtnRef.value)
  } finally {
    isSaving.value = false
  }
}

// ---- 入场动画 ----
function animateEntrance() {
  if (prefersReduced.value || !settingsRef.value) return

  nextTick(() => {
    const sections = settingsRef.value?.querySelectorAll(".settings-section")
    if (!sections) return
    sections.forEach((section, i) => {
      entryAnims.push(gsap.from(section, {
        y: 16,
        opacity: 0,
        scale: 0.98,
        duration: 0.35,
        delay: i * 0.06,
        ease: "back.out(1.2)",
      }))
    })
  })
}

// ---- 数据加载 ----
onMounted(() => {
  if (props.avatarId) {
    store.ensureMemoriesLoaded(props.avatarId)
  }
})

// 当 avatar 数据就绪后触发入场动画
watch(
  avatar,
  (val, oldVal) => {
    if (val && !oldVal) animateEntrance()
  },
  { immediate: true },
)

// ---- GSAP 清理 ----
onUnmounted(() => {
  entryAnims.forEach((t) => t.kill())
  entryAnims = []
  if (settingsRef.value) {
    gsap.killTweensOf(settingsRef.value.querySelectorAll(".settings-section"))
  }
  if (saveBtnRef.value) gsap.killTweensOf(saveBtnRef.value)
})
</script>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .settings-section.rounded-2xl.border.bg-card.shadow-sm {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: none;
  }

  .settings-section textarea {
    border-color: rgba(255, 255, 255, 0.1);

    &:focus {
      border-color: var(--color-primary-400);
    }
  }

  .settings-section .rounded-xl.border.p-4 {
    border-color: rgba(255, 255, 255, 0.08);
  }
}
</style>
