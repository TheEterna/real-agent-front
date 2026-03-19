<script setup lang="ts">
/**
 * ImportWizard - 空状态导入引导页
 *
 * 联系人预设表单(可选) + 文件上传区(拖拽) + 粘贴文本区 + 导出教程入口 + [开始分析]
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Upload, ClipboardPaste, BookOpen, ArrowRight, X,
  FileText, Plus, Trash2, Loader2, AlertCircle,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useChatImport } from '../composables/useChatImport'
import type { ContactPreset, RelationType } from '../types'
import gsap from 'gsap'
import ExportGuide from './ExportGuide.vue'

const { t } = useI18n()

const emit = defineEmits<{
  importComplete: []
}>()

const {
  selectedFile,
  pasteText,
  detectedFormat,
  contactPresets,
  isUploading,
  uploadError,
  canSubmit,
  isPasteMode,
  selectFile,
  clearFile,
  addPreset,
  removePreset,
  submitImport,
} = useChatImport()

// Tab: 'upload' | 'paste'
const activeTab = ref<'upload' | 'paste'>('upload')
const showExportGuide = ref(false)
const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

// Contact presets form
const presetName = ref('')
const presetRelation = ref<RelationType | ''>('')
const presetMyName = ref('')
const showPresetForm = ref(false)

const relationOptions = computed<Array<{ value: RelationType; label: string }>>(() => [
  { value: 'lover', label: t('chatAnalyzer.importWizard.relationLover') },
  { value: 'family', label: t('chatAnalyzer.importWizard.relationFamily') },
  { value: 'friend', label: t('chatAnalyzer.importWizard.relationFriend') },
  { value: 'colleague', label: t('chatAnalyzer.importWizard.relationColleague') },
  { value: 'other', label: t('chatAnalyzer.importWizard.relationOther') },
])

const formatLabel = computed(() => {
  switch (detectedFormat.value) {
    case 'chatlab': return 'ChatLab'
    case 'csv': return 'CSV'
    case 'txt': return 'TXT'
    default: return ''
  }
})

function handleAddPreset() {
  if (!presetName.value.trim()) return
  addPreset({
    name: presetName.value.trim(),
    relationType: (presetRelation.value as RelationType) || undefined,
    myName: presetMyName.value.trim() || undefined,
  })
  presetName.value = ''
  presetRelation.value = ''
  presetMyName.value = ''
  showPresetForm.value = false
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) selectFile(file)
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) selectFile(file)
  input.value = ''
}

async function handleSubmit() {
  if (!canSubmit.value) return
  const success = await submitImport()
  if (success) {
    emit('importComplete')
  }
}

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// GSAP entrance animation (respects prefers-reduced-motion)
onMounted(() => {
  if (!containerRef.value || prefersReduced) return
  const children = containerRef.value.querySelectorAll('[data-animate]')
  gsap.from(children, {
    y: 16,
    opacity: 0,
    duration: 0.4,
    stagger: 0.06,
    ease: 'power2.out',
  })
})

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value.querySelectorAll('[data-animate]'))
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="flex items-center justify-center min-h-full p-4 sm:p-8"
  >
    <div class="w-full max-w-2xl">
      <!-- Title -->
      <div data-animate class="text-center mb-8">
        <h2 class="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          {{ t('chatAnalyzer.importWizard.title') }}
        </h2>
        <p class="text-base text-muted-foreground">
          {{ t('chatAnalyzer.importWizard.subtitle') }}
        </p>
      </div>

      <!-- Contact Presets (Optional) -->
      <div data-animate class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <Label class="text-sm font-medium text-foreground">
            {{ t('chatAnalyzer.importWizard.contactInfo') }}
            <span class="text-muted-foreground font-normal ml-1">{{ t('chatAnalyzer.importWizard.optional') }}</span>
          </Label>
          <Button
            v-if="!showPresetForm && contactPresets.length === 0"
            variant="ghost"
            size="sm"
            class="text-xs gap-1 active:scale-95"
            @click="showPresetForm = true"
          >
            <Plus :size="14" />
            {{ t('chatAnalyzer.importWizard.addBtn') }}
          </Button>
        </div>
        <p class="text-xs text-muted-foreground mb-3">
          {{ t('chatAnalyzer.importWizard.contactInfoHint') }}
        </p>

        <!-- Existing presets -->
        <div v-if="contactPresets.length > 0" class="space-y-2 mb-3">
          <div
            v-for="(preset, idx) in contactPresets"
            :key="idx"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
          >
            <span class="text-sm text-foreground flex-1">
              {{ preset.name }}
              <span
                v-if="preset.relationType"
                class="ml-2 text-xs text-muted-foreground"
              >
                {{ relationOptions.find(r => r.value === preset.relationType)?.label }}
              </span>
            </span>
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-accent active:scale-95"
                  :aria-label="t('chatAnalyzer.importWizard.removeContact')"
                  @click="removePreset(idx)"
                >
                  <Trash2 :size="14" class="text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="4">{{ t('chatAnalyzer.importWizard.removeTooltip') }}</TooltipContent>
            </Tooltip>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="text-xs gap-1 active:scale-95"
            @click="showPresetForm = true"
          >
            <Plus :size="14" />
            {{ t('chatAnalyzer.importWizard.addMore') }}
          </Button>
        </div>

        <!-- Add preset form -->
        <div
          v-if="showPresetForm"
          class="p-3 rounded-lg border border-border space-y-3"
        >
          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label class="text-xs text-muted-foreground mb-1">{{ t('chatAnalyzer.importWizard.otherNickname') }}</Label>
              <Input
                v-model="presetName"
                :placeholder="t('chatAnalyzer.importWizard.otherNicknamePlaceholder')"
                class="h-8 text-sm"
              />
            </div>
            <div>
              <Label class="text-xs text-muted-foreground mb-1">{{ t('chatAnalyzer.importWizard.relation') }}</Label>
              <Select v-model="presetRelation">
                <SelectTrigger class="h-8 text-sm">
                  <SelectValue :placeholder="t('chatAnalyzer.importWizard.selectRelation')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="opt in relationOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label class="text-xs text-muted-foreground mb-1">{{ t('chatAnalyzer.importWizard.myNickname') }}</Label>
            <Input
              v-model="presetMyName"
              :placeholder="t('chatAnalyzer.importWizard.myNicknamePlaceholder')"
              class="h-8 text-sm"
            />
          </div>
          <div class="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="text-xs active:scale-95"
              @click="showPresetForm = false"
            >
              {{ t('common.button.cancel') }}
            </Button>
            <Button
              size="sm"
              class="text-xs active:scale-95"
              :disabled="!presetName.trim()"
              @click="handleAddPreset"
            >
              {{ t('common.button.ok') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Import Method Tabs -->
      <div data-animate class="mb-4">
        <div class="flex gap-1 p-1 rounded-lg bg-muted" role="tablist" :aria-label="t('chatAnalyzer.importWizard.importMethodAria')">
          <button
            role="tab"
            :aria-selected="activeTab === 'upload'"
            :tabindex="activeTab === 'upload' ? 0 : -1"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium active:scale-[0.98]"
            :class="activeTab === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'upload'"
          >
            <Upload :size="16" />
            {{ t('chatAnalyzer.importWizard.uploadTab') }}
          </button>
          <button
            role="tab"
            :aria-selected="activeTab === 'paste'"
            :tabindex="activeTab === 'paste' ? 0 : -1"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium active:scale-[0.98]"
            :class="activeTab === 'paste'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'"
            @click="activeTab = 'paste'"
          >
            <ClipboardPaste :size="16" />
            {{ t('chatAnalyzer.importWizard.pasteTab') }}
          </button>
        </div>
      </div>

      <!-- Upload Zone -->
      <div v-if="activeTab === 'upload'" data-animate>
        <div
          class="relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer active:scale-[0.99]"
          :class="[
            isDragOver
              ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
              : selectedFile
                ? 'border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10'
                : 'border-border hover:border-primary-300 dark:hover:border-primary-600 bg-muted/50',
          ]"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="fileInputRef?.click()"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".json,.jsonl,.csv,.txt"
            class="hidden"
            @change="handleFileChange"
          />

          <template v-if="!selectedFile">
            <Upload :size="32" class="mx-auto mb-3 text-muted-foreground" />
            <p class="text-base font-medium text-foreground mb-1">
              {{ t('chatAnalyzer.importWizard.dropHint') }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t('chatAnalyzer.importWizard.supportedFormats') }}
            </p>
          </template>

          <template v-else>
            <div class="flex items-center justify-center gap-3">
              <FileText :size="24" class="text-primary-600 dark:text-primary-400 shrink-0" />
              <div class="text-left min-w-0">
                <p class="text-sm font-medium text-foreground truncate">
                  {{ selectedFile.name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ (selectedFile.size / 1024).toFixed(1) }}KB
                  <span v-if="formatLabel" class="ml-2 px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-medium">
                    {{ formatLabel }}
                  </span>
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-accent active:scale-95"
                    :aria-label="t('chatAnalyzer.importWizard.removeFile')"
                    @click.stop="clearFile"
                  >
                    <X :size="16" class="text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" :side-offset="4">{{ t('chatAnalyzer.importWizard.removeFile') }}</TooltipContent>
              </Tooltip>
            </div>
          </template>
        </div>

        <p class="mt-2 text-xs text-muted-foreground text-center">
          {{ t('chatAnalyzer.importWizard.recommendPrefix') }}
          <button
            class="text-primary-600 dark:text-primary-400 hover:underline focus-visible:underline active:scale-95"
            @click="showExportGuide = true"
          >
            CipherTalk
          </button>
          {{ t('chatAnalyzer.importWizard.recommendCipherTalk') }}
        </p>
      </div>

      <!-- Paste Zone -->
      <div v-if="activeTab === 'paste'" data-animate>
        <Textarea
          v-model="pasteText"
          placeholder="将聊天记录粘贴到这里...&#10;&#10;支持多种格式：&#10;小明 10:30&#10;今天吃什么？&#10;小红 10:32&#10;随便吧"
          class="min-h-[200px] text-sm"
          :rows="8"
        />
        <div class="flex justify-between items-center mt-2">
          <p
            class="text-xs"
            :class="pasteText.length > 50000 ? 'text-destructive font-medium' : 'text-muted-foreground'"
          >
            {{ t('chatAnalyzer.importWizard.charCount', { count: pasteText.length.toLocaleString(), limit: (50000).toLocaleString() }) }}
            <span v-if="pasteText.length > 50000">{{ t('chatAnalyzer.importWizard.charExceed') }}</span>
          </p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="uploadError"
        data-animate
        class="mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20"
        role="alert"
      >
        <AlertCircle :size="16" class="text-destructive shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-destructive">{{ uploadError }}</p>
          <p class="text-xs text-destructive/70 mt-1">
            {{ t('chatAnalyzer.importWizard.errorHint') }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div data-animate class="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          size="sm"
          class="gap-1.5 text-muted-foreground active:scale-95"
          @click="showExportGuide = true"
        >
          <BookOpen :size="16" />
          {{ t('chatAnalyzer.importWizard.exportGuideBtn') }}
        </Button>

        <Button
          class="gap-2 px-6 active:scale-95"
          :disabled="!canSubmit || isUploading"
          @click="handleSubmit"
        >
          <Loader2 v-if="isUploading" :size="16" class="animate-spin" />
          <span v-if="isUploading">{{ t('chatAnalyzer.importWizard.importing') }}</span>
          <template v-else>
            {{ t('chatAnalyzer.importWizard.startAnalysis') }}
            <ArrowRight :size="16" />
          </template>
        </Button>
      </div>
    </div>
  </div>

  <!-- Export Guide Dialog -->
  <ExportGuide v-model:open="showExportGuide" />
</template>
