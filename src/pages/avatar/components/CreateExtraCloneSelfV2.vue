<!-- ================================================
  CreateExtraCloneSelfV2 — 克隆自己：多方案支持
  职责：系统画像 + 用户补充（自传/聊天记录/手动）
  来源：Indi Young 心智模型优化
  版本：v2 多方案
================================================ -->
<template>
  <div ref="rootRef" class="space-y-6">
    <!-- 方案选择标签页 -->
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        v-for="option in cloneOptions"
        :key="option.id"
        class="clone-option-btn flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border active:scale-95 min-h-[44px]"
        :class="selectedOption === option.id
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:bg-accent/50'
        "
        @click="selectedOption = option.id"
      >
        <component :is="option.icon" :size="16" class="inline mr-1.5" />
        {{ option.label }}
      </button>
    </div>

    <!-- 方案 1: 系统画像 -->
    <div v-if="selectedOption === 'system'" class="space-y-4">
      <div v-if="isLoadingPortrait" class="text-center py-8">
        <Loader2 :size="24" class="animate-spin mx-auto text-muted-foreground" />
        <p class="text-base text-muted-foreground mt-3">{{ t('avatar.cloneSelf.analyzingData') }}</p>
      </div>

      <div v-else-if="portrait" class="rounded-lg border bg-card p-5 space-y-4"
      >
        <!-- 画像预览 -->
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User :size="28" class="text-primary" />
          </div>
          <div class="flex-1">
            <h4 class="font-medium text-foreground">{{ portrait.nickname || t('avatar.cloneSelf.portraitOrigin') }}</h4>
            <p class="text-xs text-muted-foreground">{{ t('avatar.cloneSelf.portraitAutoGen') }}</p>
          </div>
        </div>

        <!-- 画像详情 -->
        <div class="space-y-3">
          <div v-if="portrait.traits?.length">
            <p class="text-xs text-muted-foreground mb-2">{{ t('avatar.cloneSelf.traitsLabel') }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="trait in portrait.traits"
                :key="trait"
                class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
              >
                {{ trait }}
              </span>
            </div>
          </div>

          <div v-if="portrait.interests?.length">
            <p class="text-xs text-muted-foreground mb-2">{{ t('avatar.cloneSelf.interestsLabel') }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="interest in portrait.interests"
                :key="interest"
                class="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs"
              >
                {{ interest }}
              </span>
            </div>
          </div>
        </div>

        <!-- 精确度提示 -->
        <div
          v-if="!portrait.sufficient"
          class="clone-warning rounded-lg px-3 py-2"
        >
          <p class="clone-warning-text text-xs">
            <AlertTriangle :size="14" class="inline mr-1" />
            {{ t('avatar.cloneSelf.insufficientData') }}
          </p>
        </div>

        <!-- 数据来源说明 -->
        <p class="text-xs text-muted-foreground">
          <Info :size="12" class="inline mr-1" />
          {{ t('avatar.cloneSelf.dataSource') }}
        </p>
      </div>

      <div v-else class="text-center py-8 rounded-lg border border-dashed">
        <User :size="40" class="mx-auto text-muted-foreground/50" />
        <p class="text-base text-muted-foreground mt-3">{{ t('avatar.cloneSelf.noData') }}</p>
        <p class="text-xs text-muted-foreground mt-1">{{ t('avatar.cloneSelf.noDataHint') }}</p>
      </div>
    </div>

    <!-- 方案 2: 上传自传 -->
    <div v-if="selectedOption === 'autobiography'" class="space-y-4">
      <div
        class="relative rounded-lg border-2 border-dashed p-8 text-center transition-colors"
        :class="isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-foreground/30'
        "
        @dragenter.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @dragover.prevent
        @drop.prevent="handleFileDrop"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".txt,.md,.doc,.docx"
          class="hidden"
          @change="handleFileSelect"
        />

        <div v-if="!selectedFile"
          class="cursor-pointer"
          @click="fileInputRef?.click()"
        >
          <FileText :size="40" class="mx-auto text-muted-foreground/50" />
          <p class="text-base font-medium text-foreground mt-4">
            {{ t('avatar.cloneSelf.uploadFileTitle') }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('avatar.cloneSelf.uploadFileFormats') }}
          </p>
        </div>

        <div v-else class="text-left">
          <div class="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <FileText :size="24" class="text-primary" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-foreground truncate">
                {{ selectedFile.name }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ formatFileSize(selectedFile.size) }}
              </p>
            </div>
            <button
              class="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              :aria-label="t('avatar.cloneSelf.removeFile')"
              @click="clearFile"
            >
              <X :size="16" />
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl bg-muted/50 p-4 space-y-2">
        <p class="text-xs font-medium text-foreground"><Lightbulb :size="14" class="inline mr-1" />{{ t('avatar.cloneSelf.suggestTitle') }}</p>
        <ul class="text-xs text-muted-foreground space-y-1 ml-4">
          <li>{{ t('avatar.cloneSelf.suggest1') }}</li>
          <li>{{ t('avatar.cloneSelf.suggest2') }}</li>
          <li>{{ t('avatar.cloneSelf.suggest3') }}</li>
          <li>{{ t('avatar.cloneSelf.suggest4') }}</li>
        </ul>
      </div>
    </div>

    <!-- 方案 3: 导入聊天记录 -->
    <div v-if="selectedOption === 'chat-history'" class="space-y-4">
      <div class="rounded-lg border bg-card p-5 space-y-4">
        <h4 class="font-medium text-foreground flex items-center gap-2">
          <MessageCircle :size="18" class="text-primary" />
          {{ t('avatar.cloneSelf.importWechat') }}
        </h4>

        <div class="space-y-3">
          <!-- WeFlow 方案 -->
          <div class="rounded-xl bg-muted/50 p-4">
            <div class="flex items-center gap-3 mb-2">
              <div class="clone-tool-icon clone-tool-icon--weflow w-8 h-8 rounded-lg flex items-center justify-center">
                <span class="text-sm font-bold">W</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-foreground">{{ t('avatar.cloneSelf.weflowTitle') }}</p>
              </div>
              <a
                href="https://weflow.chat/"
                target="_blank"
                class="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                {{ t('avatar.cloneSelf.weflowGo') }}
                <ExternalLink :size="12" />
              </a>
            </div>
            <ol class="text-xs text-muted-foreground space-y-1 ml-4">
              <li>{{ t('avatar.cloneSelf.weflowStep1') }}</li>
              <li>{{ t('avatar.cloneSelf.weflowStep2') }}</li>
              <li>{{ t('avatar.cloneSelf.weflowStep3') }}</li>
              <li>{{ t('avatar.cloneSelf.weflowStep4') }}</li>
            </ol>
          </div>

          <!-- 密语方案 -->
          <div class="rounded-xl bg-muted/50 p-4">
            <div class="flex items-center gap-3 mb-2">
              <div class="clone-tool-icon clone-tool-icon--miyu w-8 h-8 rounded-lg flex items-center justify-center">
                <span class="text-sm font-bold">密</span>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-foreground">{{ t('avatar.cloneSelf.miyuTitle') }}</p>
              </div>
              <a
                href="#"
                class="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                {{ t('avatar.cloneSelf.miyuLink') }}
                <ExternalLink :size="12" />
              </a>
            </div>
            <ol class="text-xs text-muted-foreground space-y-1 ml-4">
              <li>{{ t('avatar.cloneSelf.miyuStep1') }}</li>
              <li>{{ t('avatar.cloneSelf.miyuStep2') }}</li>
              <li>{{ t('avatar.cloneSelf.miyuStep3') }}</li>
              <li>{{ t('avatar.cloneSelf.miyuStep4') }}</li>
            </ol>
          </div>
        </div>

        <!-- 文件上传 -->
        <div class="pt-2">
          <input
            ref="chatFileInputRef"
            type="file"
            accept=".json,.txt,.csv"
            class="hidden"
            @change="handleChatFileSelect"
          />
          <button
            class="w-full py-3 rounded-lg border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
            @click="chatFileInputRef?.click()"
          >
            <Upload :size="18" />
            <span class="text-sm">{{ chatFile ? chatFile.name : t('avatar.cloneSelf.uploadChatFile') }}</span>
          </button>
        </div>
      </div>

      <div class="clone-warning rounded-lg px-3 py-2">
        <p class="clone-warning-text text-xs">
          <Shield :size="14" class="inline mr-1" />
          {{ t('avatar.cloneSelf.privacyNotice') }}
        </p>
      </div>
    </div>

    <!-- 方案 4: 手动填写 -->
    <div v-if="selectedOption === 'manual'" class="space-y-4">
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium text-foreground mb-1.5 block">
            {{ t('avatar.cloneSelf.toneLabel') }}
          </label>
          <textarea
            v-model="manualData.tone"
            :placeholder="t('avatar.cloneSelf.tonePlaceholder')"
            rows="3"
            maxlength="200"
            class="w-full resize-none rounded-xl border bg-transparent p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          <p class="text-xs text-muted-foreground text-right mt-1">
            {{ manualData.tone.length }}/200
          </p>
        </div>

        <div>
          <label class="text-sm font-medium text-foreground mb-1.5 block">{{ t('avatar.cloneSelf.interestTagsLabel') }}</label>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(tag, i) in manualData.interests"
              :key="i"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs"
            >
              {{ tag }}
              <button
                class="p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 active:scale-95"
                :aria-label="t('avatar.cloneSelf.deleteInterestTag', { tag })"
                @click="manualData.interests.splice(i, 1)"
              >
                <X :size="12" />
              </button>
            </span>
            <input
              v-model="newInterest"
              :placeholder="t('avatar.cloneSelf.addInterest')"
              class="min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              @keydown.enter.prevent="addInterest"
            />
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-foreground mb-1.5 block">{{ t('avatar.cloneSelf.expertiseLabel') }}</label>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(tag, i) in manualData.expertise"
              :key="i"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs"
            >
              {{ tag }}
              <button
                class="p-0.5 rounded-full hover:bg-primary/20 hover:text-primary/70 transition-colors duration-150 active:scale-95"
                :aria-label="t('avatar.cloneSelf.deleteExpertiseTag', { tag })"
                @click="manualData.expertise.splice(i, 1)"
              >
                <X :size="12" />
              </button>
            </span>
            <input
              v-model="newExpertise"
              :placeholder="t('avatar.cloneSelf.addExpertise')"
              class="min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              @keydown.enter.prevent="addExpertise"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="pt-2">
      <button
        :disabled="!canSubmit || isSubmitting"
        class="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
        @click="submitData"
      >
        <Loader2 v-if="isSubmitting" :size="18" class="animate-spin" />
        <Check v-else :size="18" />
        {{ isSubmitting ? t('avatar.cloneSelf.analyzing') : t('avatar.cloneSelf.confirmUse') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type ComputedRef } from 'vue'
import {
  User,
  FileText,
  MessageCircle,
  Edit3,
  Loader2,
  Check,
  X,
  ExternalLink,
  Upload,
  Lightbulb,
  Shield,
  AlertTriangle,
  Info,
  type LucideIcon,
} from 'lucide-vue-next'
import gsap from 'gsap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useI18n } from 'vue-i18n'
import type { UserPortrait } from '../types'

// ---- Props & Emits ----
const props = defineProps<{
  portrait: UserPortrait | null
  isLoadingPortrait: boolean
}>()

const emit = defineEmits<{
  'update:data': [data: CloneSelfData]
}>()

// ---- Types ----
interface CloneOption {
  id: 'system' | 'autobiography' | 'chat-history' | 'manual'
  label: string
  icon: LucideIcon
}

interface CloneSelfData {
  source: 'system' | 'autobiography' | 'chat-history' | 'manual'
  file?: File
  chatFile?: File
  manualData?: {
    tone: string
    interests: string[]
    expertise: string[]
  }
}

// ---- Refs & Motion ----
const { t } = useI18n()
const { prefersReduced } = useReducedMotion()
const rootRef = ref<HTMLElement>()

// ---- State ----
const selectedOption = ref<CloneOption['id']>('system')
const isSubmitting = ref(false)
const isDragging = ref(false)

// 文件上传
const fileInputRef = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const chatFileInputRef = ref<HTMLInputElement>()
const chatFile = ref<File | null>(null)

// 手动填写
const newInterest = ref('')
const newExpertise = ref('')
const manualData = ref({
  tone: '',
  interests: [] as string[],
  expertise: [] as string[],
})

// ---- Options ----
const cloneOptions = computed<CloneOption[]>(() => [
  { id: 'system', label: t('avatar.cloneSelf.systemPortrait'), icon: User },
  { id: 'autobiography', label: t('avatar.cloneSelf.uploadAutobiography'), icon: FileText },
  { id: 'chat-history', label: t('avatar.cloneSelf.chatHistory'), icon: MessageCircle },
  { id: 'manual', label: t('avatar.cloneSelf.manualInput'), icon: Edit3 },
])

// ---- Computed ----
const canSubmit = computed(() => {
  switch (selectedOption.value) {
    case 'system':
      return props.portrait?.sufficient ?? false
    case 'autobiography':
      return !!selectedFile.value
    case 'chat-history':
      return !!chatFile.value
    case 'manual':
      return manualData.value.tone.trim().length > 0
    default:
      return false
  }
})

// ---- Methods ----
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    selectedFile.value = files[0]
  }
}

function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) {
    selectedFile.value = files[0]
  }
}

function clearFile() {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleChatFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) {
    chatFile.value = files[0]
  }
}

function addInterest() {
  const tag = newInterest.value.trim()
  if (tag && !manualData.value.interests.includes(tag)) {
    manualData.value.interests.push(tag)
    newInterest.value = ''
  }
}

function addExpertise() {
  const tag = newExpertise.value.trim()
  if (tag && !manualData.value.expertise.includes(tag)) {
    manualData.value.expertise.push(tag)
    newExpertise.value = ''
  }
}

async function submitData() {
  if (!canSubmit.value) return

  const data: CloneSelfData = {
    source: selectedOption.value,
  }

  switch (selectedOption.value) {
    case 'autobiography':
      data.file = selectedFile.value || undefined
      break
    case 'chat-history':
      data.chatFile = chatFile.value || undefined
      break
    case 'manual':
      data.manualData = { ...manualData.value }
      break
  }

  emit('update:data', data)
}

// ---- Watchers ----
watch(selectedOption, () => {
  // 切换选项时重置提交状态
  isSubmitting.value = false
})

// 自动提交系统画像（如果数据充足）
watch(() => props.portrait, (portrait) => {
  if (selectedOption.value === 'system' && portrait?.sufficient) {
    submitData()
  }
}, { immediate: true })

// ---- GSAP ----
onMounted(() => {
  if (prefersReduced.value || !rootRef.value) return
  gsap.from(rootRef.value, {
    opacity: 0,
    y: 8,
    duration: 0.25,
    ease: 'power2.out',
  })
})

onUnmounted(() => {
  if (rootRef.value) gsap.killTweensOf(rootRef.value)
})
</script>

<style lang="scss" scoped>
.clone-warning {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.15);
}

.clone-warning-text {
  color: rgb(180, 120, 20);
}

.clone-tool-icon {
  &--weflow {
    background: rgba(34, 197, 94, 0.08);
    color: rgb(22, 163, 74);
  }

  &--miyu {
    background: rgba(59, 130, 246, 0.08);
    color: rgb(37, 99, 235);
  }
}
</style>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  .clone-warning {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.2);
  }

  .clone-warning-text {
    color: rgb(251, 191, 36);
  }

  .clone-tool-icon {
    &--weflow {
      background: rgba(34, 197, 94, 0.12);
      color: rgb(74, 222, 128);
    }

    &--miyu {
      background: rgba(59, 130, 246, 0.12);
      color: rgb(96, 165, 250);
    }
  }
}
</style>
