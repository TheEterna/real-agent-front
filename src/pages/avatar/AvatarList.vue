<!-- ================================================
  AvatarList — 数字分身英雄选择页
  职责：展示分身列表、创建/删除分身、配额管理
  路由：/avatar
  设计：两栏布局（主网格 + 右侧详情面板）
================================================ -->
<template>
  <div class="flex h-full bg-background">
    <!-- ====== 左侧主区域 ====== -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <main class="flex-1 overflow-y-auto">
        <div class="px-6 py-8 sm:px-10">
          <!-- 页面标题 + 创建按钮 -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-[2rem] font-semibold tracking-tight text-foreground leading-tight">
                {{ t('avatar.list.title') }}
              </h1>
              <p class="mt-1 text-base text-muted-foreground">
                <template v-if="!avatarQuota.isUltra">
                  {{ t('avatar.list.created', { current: avatarQuota.current, max: avatarQuota.max }) }}
                </template>
                <template v-else>
                  {{ t('avatar.list.plazaDesc') }}
                </template>
              </p>
            </div>

            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    :disabled="!canCreateAvatar"
                    class="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    :aria-label="t('avatar.list.createNewTooltip')"
                    @click="openCreateDialog()"
                  >
                    <Plus :size="16" />
                    <span>{{ t('avatar.list.createBtn') }}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  :side-offset="6"
                  class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                  {{ canCreateAvatar ? t('avatar.list.createNewTooltip') : t('avatar.list.quotaFull') }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <!-- 搜索栏 + 筛选按钮 -->
          <div class="flex items-center gap-3 mb-6">
            <div class="relative flex-1">
              <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('avatar.list.searchPlaceholder', 'Search avatars...')"
                class="h-10 w-full rounded-lg border bg-card pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
            <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    :aria-label="t('avatar.list.filter', 'Filter')"
                  >
                    <SlidersHorizontal :size="16" />
                    <span class="hidden sm:inline">{{ t('avatar.list.filter', 'Filter') }}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  :side-offset="6"
                  class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                  {{ t('avatar.list.filter', 'Filter') }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <!-- 加载中（仅在无缓存时显示） -->
          <div v-if="isLoadingAvatars && !cacheHydrated" class="flex justify-center py-20">
            <Loader2 :size="24" class="animate-spin text-muted-foreground" />
          </div>

          <!-- 空状态：无分身时显示引导 -->
          <template v-else-if="filteredAvatars.length === 0 && !isLoadingAvatars">
            <div ref="emptyStateRef" class="flex flex-col items-center justify-center py-20 text-center">
              <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Bot :size="36" class="text-muted-foreground" />
              </div>
              <h2 class="text-xl font-semibold text-foreground">{{ t('avatar.list.emptyTitle') }}</h2>
              <p class="mt-2 max-w-sm text-base text-muted-foreground">
                {{ t('avatar.list.emptyDesc') }}
              </p>
              <button
                class="mt-8 flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                @click="openCreateDialog()"
              >
                <Plus :size="16" />
                {{ t('avatar.list.startCreate') }}
              </button>
            </div>
          </template>

          <!-- 分身卡片网格（3列） -->
          <template v-else>
            <div ref="gridRef" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <!-- 分身卡片 -->
              <div
                v-for="av in filteredAvatars"
                :key="av.id"
                class="avatar-card group relative flex flex-col rounded-lg border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                :class="{ 'ring-2 ring-primary': selectedAvatar?.id === av.id }"
                tabindex="0"
                role="button"
                :aria-label="t('avatar.list.enterAvatar', { name: av.name || t('avatar.list.unnamed') })"
                @click="selectAvatar(av)"
                @keydown.enter="selectAvatar(av)"
                @keydown.space.prevent="selectAvatar(av)"
              >
                <!-- 更多菜单按钮（右上角） -->
                <div class="absolute right-2 top-2 z-10" @click.stop @keydown.stop>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <button
                        class="flex h-8 w-8 items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-muted active:scale-95 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        :aria-label="t('avatar.list.moreActions')"
                      >
                        <MoreHorizontal :size="14" class="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" :side-offset="4" class="w-40">
                      <DropdownMenuItem
                        class="cursor-pointer"
                        @click="router.push(`/avatar/${av.id}/chat`)"
                      >
                        <MessageSquare :size="14" class="mr-2" />
                        {{ t('avatar.list.startChat') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="cursor-pointer"
                        @click="router.push(`/avatar/${av.id}?tab=settings`)"
                      >
                        <Settings :size="14" class="mr-2" />
                        {{ t('avatar.list.configSettings') }}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class="cursor-pointer"
                        @click="toggleActive(av)"
                      >
                        <Power :size="14" class="mr-2" />
                        {{ av.active ? t('avatar.list.stopAvatar') : t('avatar.list.startAvatar') }}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        class="text-destructive focus:text-destructive cursor-pointer"
                        @click="confirmDeleteAvatar(av)"
                      >
                        <Trash2 :size="14" class="mr-2" />
                        {{ t('avatar.list.deleteAvatar') }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <!-- 卡片上部：居中图标 + 名称 + 标签 -->
                <div class="flex flex-col items-center gap-3 px-5 pb-4 pt-5">
                  <!-- 圆形头像 -->
                  <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <img
                      v-if="av.avatarUrl"
                      :src="av.avatarUrl"
                      :alt="av.name || t('avatar.list.avatarAlt')"
                      class="h-16 w-16 rounded-full object-cover"
                    />
                    <User v-else :size="28" class="text-muted-foreground" />
                  </div>

                  <!-- 名称 -->
                  <h3 class="text-base font-semibold text-foreground text-center truncate max-w-full">
                    {{ av.name || t('avatar.list.unnamed') }}
                  </h3>

                  <!-- 特征标签 -->
                  <div class="flex flex-wrap items-center justify-center gap-1.5">
                    <span
                      v-if="av.active"
                      class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                    >
                      {{ t('avatar.list.running') }}
                    </span>
                    <span
                      class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                    >
                      {{ autonomyLabel(av.autonomy) }}
                    </span>
                  </div>
                </div>

                <!-- 卡片底部：对话数 + Chat 按钮（分割线分隔） -->
                <div class="flex items-center justify-between border-t px-5 py-3">
                  <span class="text-xs text-muted-foreground">
                    {{ t('avatar.list.conversations', { count: (av as any).conversationCount ?? 0 }, (av as any).conversationCount ?? 0) }}
                  </span>
                  <button
                    class="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    :aria-label="t('avatar.list.startChat')"
                    @click.stop="router.push(`/avatar/${av.id}/chat`)"
                  >
                    {{ t('avatar.list.chatBtn', 'Chat') }}
                  </button>
                </div>
              </div>

              <!-- 空槽位 / 创建按钮 -->
              <div
                v-if="canCreateAvatar"
                class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                tabindex="0"
                role="button"
                :aria-label="t('avatar.list.createNewTooltip')"
                @click="openCreateDialog()"
                @keydown.enter="openCreateDialog()"
                @keydown.space.prevent="openCreateDialog()"
              >
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Plus :size="24" class="text-muted-foreground" />
                </div>
                <span class="mt-3 text-sm font-medium text-muted-foreground">{{ t('avatar.list.createNew') }}</span>
              </div>

              <!-- 配额已满槽位 -->
              <div
                v-else-if="avatars.length > 0"
                class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-10 transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-foreground/30 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                tabindex="0"
                role="button"
                :aria-label="t('avatar.list.upgradeTooltip')"
                @click="handleUpgrade"
                @keydown.enter="handleUpgrade"
                @keydown.space.prevent="handleUpgrade"
              >
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Zap :size="24" class="text-muted-foreground" />
                </div>
                <span class="mt-3 text-sm font-medium text-muted-foreground">{{ t('avatar.list.upgradeUnlock') }}</span>
              </div>
            </div>
          </template>
        </div>
      </main>
    </div>

    <!-- ====== 右侧详情面板 ====== -->
    <aside
      v-if="selectedAvatar"
      class="avatar-detail-panel hidden w-[400px] shrink-0 flex-col border-l bg-card overflow-y-auto lg:flex"
    >
      <div class="flex flex-col gap-6 px-7 py-8">
        <!-- 面板头部 -->
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">
            {{ t('avatar.list.avatarProfile', 'Avatar Profile') }}
          </h2>
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  :aria-label="t('common.button.close', 'Close')"
                  @click="selectedAvatar = null"
                >
                  <X :size="16" class="text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                :side-offset="6"
                class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
              >
                {{ t('common.button.close', 'Close') }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- 头像信息区 -->
        <div class="flex flex-col items-center gap-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <img
              v-if="selectedAvatar.avatarUrl"
              :src="selectedAvatar.avatarUrl"
              :alt="selectedAvatar.name"
              class="h-20 w-20 rounded-full object-cover"
            />
            <User v-else :size="36" class="text-muted-foreground" />
          </div>
          <h3 class="text-2xl font-semibold text-foreground text-center">
            {{ selectedAvatar.name || t('avatar.list.unnamed') }}
          </h3>
          <p class="text-base leading-relaxed text-muted-foreground text-center">
            {{ selectedAvatar.bio || t('avatar.list.noDescription', 'No description available.') }}
          </p>
          <!-- 特征标签 -->
          <div class="flex flex-wrap justify-center gap-1.5">
            <span
              v-for="interest in (selectedAvatar.personality?.interests || []).slice(0, 3)"
              :key="interest"
              class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {{ interest }}
            </span>
            <span
              v-if="!selectedAvatar.personality?.interests?.length"
              class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {{ autonomyLabel(selectedAvatar.autonomy) }}
            </span>
          </div>
        </div>

        <!-- 分割线 -->
        <div class="h-px w-full bg-border" />

        <!-- 性格滑块区 -->
        <div class="flex flex-col gap-4">
          <h4 class="text-sm font-semibold text-foreground">
            {{ t('avatar.list.personality', 'Personality') }}
          </h4>
          <div
            v-for="trait in personalityTraits"
            :key="trait.name"
            class="flex flex-col gap-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="text-[0.8125rem] text-foreground">{{ trait.name }}</span>
              <span class="text-[0.8125rem] text-muted-foreground">{{ trait.value }}%</span>
            </div>
            <div class="h-2 w-full rounded-full bg-secondary">
              <div
                class="h-2 rounded-full bg-primary transition-all duration-300"
                :style="{ width: `${trait.value}%` }"
              />
            </div>
          </div>
        </div>

        <!-- 分割线 -->
        <div class="h-px w-full bg-border" />

        <!-- 最近对话 -->
        <div class="flex flex-col gap-3">
          <h4 class="text-sm font-semibold text-foreground">
            {{ t('avatar.list.recentConversations', 'Recent Conversations') }}
          </h4>
          <div
            v-if="!(selectedAvatar as any).recentConversations?.length"
            class="py-4 text-center text-xs text-muted-foreground"
          >
            {{ t('avatar.list.noConversations', 'No conversations yet') }}
          </div>
          <div
            v-for="conv in ((selectedAvatar as any).recentConversations || []).slice(0, 3)"
            :key="conv.id"
            class="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer"
            @click="router.push(`/avatar/${selectedAvatar!.id}/chat/${conv.id}`)"
          >
            <MessageCircle :size="16" class="shrink-0 text-muted-foreground" />
            <div class="flex-1 min-w-0">
              <p class="text-[0.8125rem] font-medium text-foreground truncate">
                {{ conv.title || t('avatar.list.untitledConversation', 'Untitled') }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ conv.timeAgo || '' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 底部 CTA 按钮 -->
        <button
          class="mt-auto flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          @click="navigateToAvatar(selectedAvatar!.id)"
        >
          <MessageCircle :size="16" />
          {{ t('avatar.list.startConversation', 'Start Conversation') }}
        </button>
      </div>
    </aside>

    <!-- 创建分身弹窗（完整流程） -->
    <AvatarCreateDialog v-model:open="showCreateDialog" />

    <!-- 删除确认弹窗 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('avatar.list.deleteTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('avatar.list.deleteConfirm', { name: avatarToDelete?.name || t('avatar.list.unnamed') }) }}
          </DialogDescription>
        </DialogHeader>

        <div class="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-base text-foreground">
          <p>{{ t('avatar.list.deleteConsequence') }}</p>
          <ul class="mt-1 list-disc pl-4 text-muted-foreground">
            <li>{{ t('avatar.list.deleteConsequence1') }}</li>
            <li>{{ t('avatar.list.deleteConsequence2') }}</li>
            <li>{{ t('avatar.list.deleteConsequence3') }}</li>
          </ul>
        </div>

        <DialogFooter>
          <button
            class="rounded-lg border px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98]"
            @click="showDeleteDialog = false"
          >
            {{ t('common.button.cancel') }}
          </button>
          <button
            :disabled="isDeleting"
            class="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-all hover:bg-destructive/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            @click="handleDelete"
          >
            <Loader2 v-if="isDeleting" :size="14" class="animate-spin" />
            {{ isDeleting ? t('avatar.list.deleting') : t('avatar.list.confirmDelete') }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from "vue"
import { useRouter } from "vue-router"
import { Bot, Plus, Loader2, MoreHorizontal, Trash2, Zap, Power, MessageSquare, Settings, Search, SlidersHorizontal, User, X, MessageCircle } from "lucide-vue-next"
import gsap from "gsap"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAvatarStore } from "@/stores/avatarStore"
import { useReducedMotion } from "@/composables/useReducedMotion"
import { useModalRoute } from "@/composables/useModalRoute"
import AvatarCreateDialog from "./AvatarCreateDialog.vue"
import { useI18n } from 'vue-i18n'
import type { Avatar } from "@/types/avatar"

const { t } = useI18n()
const router = useRouter()
const store = useAvatarStore()
const { openPricing } = useModalRoute()
const { prefersReduced, duration } = useReducedMotion()

// ---- Store 数据 ----
const avatars = computed(() => store.avatars)
const isLoadingAvatars = computed(() => store.isLoadingAvatars)
const cacheHydrated = computed(() => store.cacheHydrated)
const canCreateAvatar = computed(() => store.canCreateAvatar)
const avatarQuota = computed(() => store.avatarQuota)

// ---- Search & Filter ----
const searchQuery = ref('')
const filteredAvatars = computed(() => {
  if (!searchQuery.value.trim()) return avatars.value
  const q = searchQuery.value.toLowerCase().trim()
  return avatars.value.filter(av =>
    (av.name || '').toLowerCase().includes(q)
  )
})

// ---- Detail Panel ----
const selectedAvatar = ref<Avatar | null>(null)

function selectAvatar(av: { id: string; name: string; bio: string; avatarUrl: string; autonomy: 'auto' | 'approval' | 'off'; active: boolean; personality: { tone: string; interests: readonly string[]; expertise: readonly string[]; quirks: readonly string[] } }) {
  selectedAvatar.value = av as Avatar
}

/** Personality traits derived from selected avatar for detail panel display */
const personalityTraits = computed(() => {
  if (!selectedAvatar.value) return []
  // Use interests/expertise count to derive approximate personality values
  const p = selectedAvatar.value.personality
  const interestCount = p?.interests?.length ?? 0
  const expertiseCount = p?.expertise?.length ?? 0
  const hasQuirks = (p?.quirks?.length ?? 0) > 0
  return [
    { name: t('avatar.list.traitCreativity', 'Creativity'), value: Math.min(100, 50 + interestCount * 10) },
    { name: t('avatar.list.traitEmpathy', 'Empathy'), value: Math.min(100, 60 + expertiseCount * 8) },
    { name: t('avatar.list.traitHumor', 'Humor'), value: hasQuirks ? 80 : 50 },
  ]
})

// ---- Template refs for GSAP ----
const gridRef = ref<HTMLElement>()
const emptyStateRef = ref<HTMLElement>()
const tweens: gsap.core.Tween[] = []

// ---- 创建分身弹窗 (hash-synced: #create) ----
const showCreateDialog = ref(false)

function openCreateDialog() {
  showCreateDialog.value = true
  const newUrl = `${window.location.pathname}${window.location.search}#create`
  window.history.replaceState(null, '', newUrl)
}

watch(showCreateDialog, (visible) => {
  if (!visible && window.location.hash === '#create') {
    const newUrl = `${window.location.pathname}${window.location.search}`
    window.history.replaceState(null, '', newUrl)
  }
})

function onHashChange() {
  showCreateDialog.value = window.location.hash === '#create'
}

// ---- 删除分身 ----
const showDeleteDialog = ref(false)
const avatarToDelete = ref<Avatar | null>(null)
const isDeleting = ref(false)

function confirmDeleteAvatar(av: { id: string; name: string }) {
  avatarToDelete.value = av as Avatar
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (isDeleting.value || !avatarToDelete.value) return
  isDeleting.value = true
  try {
    await store.deleteAvatar(avatarToDelete.value.id)
    showDeleteDialog.value = false
    avatarToDelete.value = null
  } catch (error) {
    console.error("[AvatarList] delete avatar failed:", error)
  } finally {
    isDeleting.value = false
  }
}

// ---- 导航 ----
function navigateToAvatar(avatarId: string) {
  router.push(`/avatar/${avatarId}`)
}

function handleUpgrade() {
  openPricing()
}

// navigateToPlaza preserved for future use
function navigateToPlaza() {
  router.push('/feed')
}

const togglingActiveId = ref<string | null>(null)

async function toggleActive(av: { id: string; autonomy: 'auto' | 'approval' | 'off'; active: boolean }) {
  if (togglingActiveId.value === av.id) return
  togglingActiveId.value = av.id
  try {
    await store.updateAutonomy(av.id, {
      autonomy: av.autonomy,
      active: !av.active,
    })
  } catch (error) {
    console.error("[AvatarList] toggle active failed:", error)
  } finally {
    togglingActiveId.value = null
  }
}

// ---- 辅助函数 ----
function autonomyLabel(mode: string): string {
  switch (mode) {
    case "auto": return t('avatar.autonomy.auto')
    case "approval": return t('avatar.autonomy.approval')
    case "off": return t('avatar.autonomy.off')
    default: return "-"
  }
}

// ---- 入场动画 ----
function animateGrid() {
  if (prefersReduced.value) return

  nextTick(() => {
    if (!gridRef.value) return
    const cards = gridRef.value.querySelectorAll(".avatar-card")
    cards.forEach((card, i) => {
      const t = gsap.from(card, {
        y: 16,
        opacity: 0,
        scale: 0.97,
        duration: duration.value,
        delay: 0.06 + i * 0.06,
        ease: "back.out(1.4)",
      })
      tweens.push(t)
    })
  })
}

function animateEmptyState() {
  if (prefersReduced.value) return

  nextTick(() => {
    if (!emptyStateRef.value) return
    const t = gsap.from(emptyStateRef.value, {
      y: 16,
      opacity: 0,
      duration: duration.value,
      ease: "power2.out",
    })
    tweens.push(t)
  })
}

// SWR Revalidate: 先 hydrateFromCache（store 初始化时已完成），再后台刷新
let mounted = false
let gridAnimated = false
let emptyAnimated = false

onMounted(() => {
  mounted = true
  store.loadAvatars()
  // 从 hash 恢复创建弹窗状态
  if (window.location.hash === '#create') {
    showCreateDialog.value = true
  }
  window.addEventListener('hashchange', onHashChange)

  // 挂载后立即尝试触发动画（SWR 缓存场景：数据已就绪）
  tryAnimateAll()
})

function tryAnimateAll() {
  if (!mounted) return
  nextTick(() => {
    if (!gridAnimated && gridRef.value && avatars.value.length > 0) {
      gridAnimated = true
      animateGrid()
    }
    if (!emptyAnimated && emptyStateRef.value && avatars.value.length === 0 && !isLoadingAvatars.value) {
      emptyAnimated = true
      animateEmptyState()
    }
  })
}

// 数据变化时重新尝试动画（覆盖异步加载完成的场景）
watch(
  [() => avatars.value.length, isLoadingAvatars],
  () => tryAnimateAll(),
)

// GSAP 清理（ 4.5 性能铁律）
onUnmounted(() => {
  window.removeEventListener('hashchange', onHashChange)
  tweens.forEach((t) => t.kill())
  if (gridRef.value) {
    const cards = gridRef.value.querySelectorAll(".avatar-card")
    cards.forEach((card) => gsap.killTweensOf(card))
  }
  if (emptyStateRef.value) gsap.killTweensOf(emptyStateRef.value)
})
</script>
