<!-- ================================================
  PermissionSettings — 细粒度行为权限设置
  职责：基础权限 + MCP 扩展能力权限 + 安全限制
  来源：Indi Young 心智模型优化 + Hall 暗模式规避
================================================ -->
<template>
  <div class="space-y-6">
    <!-- 基础权限 -->
    <section>
      <h4 class="text-sm font-medium text-foreground mb-3">{{ t('avatar.permissions.baseTitle') }}</h4>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div
          v-for="perm in basePermissions"
          :key="perm.key"
          class="flex items-center justify-between rounded-xl border p-3 transition-colors duration-200"
          :class="getPermissionBorderClass(perm.value)"
        >
          <div class="flex items-center gap-3">
            <component :is="perm.icon" :size="18" class="text-muted-foreground" />
            <div>
              <p class="text-sm font-medium text-foreground">{{ perm.label }}</p>
              <p class="text-xs text-muted-foreground">{{ perm.desc }}</p>
            </div>
          </div>
          <Select
            :model-value="perm.value"
            @update:model-value="(val: PermissionMode) => { perm.value = val; handleBasePermissionChange(perm.key, val) }"
          >
            <SelectTrigger class="h-9 min-h-[44px] w-[120px] rounded-lg text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{{ t('avatar.permissions.modeAuto') }}</SelectItem>
              <SelectItem value="approval">{{ t('avatar.permissions.modeApproval') }}</SelectItem>
              <SelectItem value="off">{{ t('avatar.permissions.modeOff') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>

    <!-- 扩展 MCP 能力权限 -->
    <section v-if="mcpPermissions.length > 0">
      <h4 class="text-sm font-medium text-foreground mb-3">{{ t('avatar.permissions.extTitle') }}</h4>
      <div class="space-y-2">
        <div
          v-for="perm in mcpPermissions"
          :key="perm.capabilityId"
          class="flex items-center justify-between rounded-xl border p-3"
          :class="getPermissionBorderClass(perm.mode)"
        >
          <div class="flex items-center gap-3">
            <component :is="getMcpIcon(perm.category)" :size="18" class="text-muted-foreground" />
            <div>
              <p class="text-sm font-medium text-foreground">{{ perm.name }}</p>
              <p class="text-xs text-muted-foreground">{{ perm.description }}</p>
            </div>
          </div>
          <Select v-model="perm.mode">
            <SelectTrigger class="h-9 min-h-[44px] w-[120px] rounded-lg text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">{{ t('avatar.permissions.modeAuto') }}</SelectItem>
              <SelectItem value="approval">{{ t('avatar.permissions.modeApproval') }}</SelectItem>
              <SelectItem value="off">{{ t('avatar.permissions.modeOff') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>

    <!-- 安全限制 -->
    <section class="rounded-xl border border-amber-200/50 bg-amber-50/5 dark:border-amber-800/40 dark:bg-amber-900/10 p-4">
      <div class="flex items-center gap-2 mb-3">
        <ShieldAlert :size="18" class="text-amber-500" />
        <h4 class="text-sm font-medium text-foreground">{{ t('avatar.permissions.safetyTitle') }}</h4>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-muted-foreground mb-1">{{ t('avatar.permissions.dailyLimitLabel') }}</label>
          <div class="flex items-center gap-2">
            <Input
              v-model.number="localGlobalDailyLimit"
              type="number"
              min="1"
              max="1000"
              class="h-9 w-20"
            />
            <span class="text-xs text-muted-foreground">{{ t('avatar.permissions.dailyLimitUnit') }}</span>
          </div>
          <p class="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">
            {{ t('avatar.permissions.dailyLimitHint') }}
          </p>
        </div>

        <div>
          <label class="block text-xs text-muted-foreground mb-1">{{ t('avatar.permissions.contentLengthLabel') }}</label>
          <div class="flex items-center gap-2">
            <Input
              v-model.number="localMaxContentLength"
              type="number"
              min="100"
              max="5000"
              step="100"
              class="h-9 w-20"
            />
            <span class="text-xs text-muted-foreground">{{ t('avatar.permissions.contentLengthUnit') }}</span>
          </div>
        </div>
      </div>

      <!-- 全自动警告 -->
      <div
        v-if="hasAutoPermission"
        class="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 dark:border-amber-700/30 px-3 py-2"
      >
        <p class="text-xs text-amber-600 dark:text-amber-400">
          <span class="font-medium">{{ t('avatar.permissions.autoWarningPrefix') }}</span>
          {{ t('avatar.permissions.autoWarning') }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  FileText,
  MessageCircle,
  Heart,
  UserPlus,
  ShieldAlert,
  Mail,
  Calendar,
  FileSpreadsheet,
  type LucideIcon,
} from 'lucide-vue-next'
import type { PermissionMode, BasePermissions, McpCapabilityPermission } from '../types'

// ---- Props & Emits ----
const props = defineProps<{
  basePermissions: BasePermissions
  mcpCapabilities?: McpCapabilityPermission[]
  globalDailyLimit: number
  maxContentLength: number
}>()

const emit = defineEmits<{
  'update:basePermissions': [value: BasePermissions]
  'update:mcpCapabilities': [value: McpCapabilityPermission[]]
  'update:globalDailyLimit': [value: number]
  'update:maxContentLength': [value: number]
}>()

const { t } = useI18n()

// ---- Local State ----
interface BasePermissionItem {
  key: keyof BasePermissions
  label: string
  desc: string
  icon: LucideIcon
  value: PermissionMode
}

const basePermissions = ref<BasePermissionItem[]>([
  {
    key: 'post',
    label: t('avatar.permissions.postLabel'),
    desc: t('avatar.permissions.postDesc'),
    icon: FileText,
    value: props.basePermissions.post,
  },
  {
    key: 'comment',
    label: t('avatar.permissions.commentLabel'),
    desc: t('avatar.permissions.commentDesc'),
    icon: MessageCircle,
    value: props.basePermissions.comment,
  },
  {
    key: 'like',
    label: t('avatar.permissions.likeLabel'),
    desc: t('avatar.permissions.likeDesc'),
    icon: Heart,
    value: props.basePermissions.like,
  },
  {
    key: 'follow',
    label: t('avatar.permissions.followLabel'),
    desc: t('avatar.permissions.followDesc'),
    icon: UserPlus,
    value: props.basePermissions.follow,
  },
])

const mcpPermissions = ref<McpCapabilityPermission[]>(props.mcpCapabilities || [])
const localGlobalDailyLimit = ref(props.globalDailyLimit)
const localMaxContentLength = ref(props.maxContentLength)

// ---- Computed ----
const hasAutoPermission = computed(() => {
  const baseHasAuto = basePermissions.value.some(p => p.value === 'auto')
  const mcpHasAuto = mcpPermissions.value.some(p => p.mode === 'auto')
  return baseHasAuto || mcpHasAuto
})

// ---- Methods ----
function getPermissionBorderClass(mode: PermissionMode): string {
  switch (mode) {
    case 'auto':
      return 'border-green-200/50 bg-green-50/5 dark:border-green-800/40 dark:bg-green-900/10'
    case 'approval':
      return 'border-amber-200/50 bg-amber-50/5 dark:border-amber-800/40 dark:bg-amber-900/10'
    case 'off':
      return 'border-muted bg-muted/5 dark:border-muted dark:bg-muted/5'
    default:
      return 'border-border'
  }
}

function getMcpIcon(category: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    email: Mail,
    calendar: Calendar,
    spreadsheet: FileSpreadsheet,
  }
  return iconMap[category] || FileText
}

function handleBasePermissionChange(key: keyof BasePermissions, value: PermissionMode) {
  const updated: BasePermissions = {
    ...props.basePermissions,
    [key]: value,
  }
  emit('update:basePermissions', updated)
}

// ---- Watchers ----
watch(
  () => props.basePermissions,
  (newVal) => {
    basePermissions.value.forEach(p => {
      p.value = newVal[p.key]
    })
  },
  { deep: true }
)

watch(
  localGlobalDailyLimit,
  (val) => emit('update:globalDailyLimit', val)
)

watch(
  localMaxContentLength,
  (val) => emit('update:maxContentLength', val)
)
</script>

<!-- Dark mode: shadcn components handle dark mode via design tokens -->
