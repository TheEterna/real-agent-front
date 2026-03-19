<!-- ================================================
  CreateStepFlow — 移动端分步创建流程
  职责：375px 以下将创建流程拆分为多步
  来源：Luke Wroblewski 移动优先建议
================================================ -->
<template>
  <div class="p-4">
    <!-- 进度指示器 -->
    <div class="flex items-center justify-center gap-2 mb-6">
      <div
        v-for="step in 3"
        :key="step"
        class="flex items-center"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
          style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
          :class="getStepIndicatorClass(step)"
        >
          <template v-if="currentStep > step">
            <Check :size="16" />
          </template>
          <template v-else>
            {{ step }}
          </template>
        </div>
        <div
          v-if="step < 3"
          class="w-8 h-0.5 mx-1 transition-all"
          style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
          :class="currentStep > step ? 'bg-primary' : 'bg-muted'"
        />
      </div>
    </div>

    <!-- 步骤标题 -->
    <div class="text-center mb-6">
      <h2 class="text-xl font-semibold text-foreground">
        {{ stepTitle }}
      </h2>
      <p class="text-base text-muted-foreground mt-1">
        {{ stepDescription }}
      </p>
    </div>

    <!-- Step 1: 选择模版 -->
    <div v-if="currentStep === 1" class="space-y-4">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="relative flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all active:scale-[0.98]"
        style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
        :class="selectedTemplateId === tpl.id
          ? 'border-primary bg-primary/5 shadow-[var(--glow-subtle)]'
          : 'border-border bg-card hover:border-foreground/20 hover:shadow-sm'
        "
        @click="selectTemplate(tpl.id)"
      >
        <!-- 选中标记 -->
        <div
          v-if="selectedTemplateId === tpl.id"
          class="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
        >
          <Check :size="14" class="text-primary-foreground" />
        </div>

        <!-- 图标 -->
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0"
          :class="selectedTemplateId === tpl.id ? 'bg-primary/10' : 'bg-muted'"
        >
          {{ tpl.icon }}
        </div>

        <!-- 内容 -->
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-foreground">{{ tpl.name }}</h3>
          <p class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {{ tpl.description }}
          </p>
          <!-- 能力示例 -->
          <div v-if="tpl.examples?.length" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="(example, idx) in tpl.examples.slice(0, 2)"
              :key="idx"
              class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/80"
            >
              {{ example }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: 命名分身 -->
    <div v-if="currentStep === 2" class="space-y-6">
      <div class="text-center">
        <div class="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-4xl mb-4">
          {{ selectedTemplate?.icon || '✨' }}
        </div>
        <p class="text-base text-muted-foreground">
          {{ t('avatar.stepFlow.youChose') }}<span class="text-foreground font-medium">{{ selectedTemplate?.name }}</span>
        </p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">
          {{ t('avatar.stepFlow.nameLabel') }}
        </label>
        <input
          ref="nameInputRef"
          v-model="localName"
          type="text"
          :placeholder="namePlaceholder"
          maxlength="20"
          class="w-full h-14 text-lg rounded-lg border bg-card px-4 outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          @keyup.enter="canProceed && nextStep()"
        />
        <p class="text-xs text-muted-foreground text-right">
          {{ localName.length }}/20
        </p>
      </div>

      <!-- 快速建议 -->
      <div v-if="!localName" class="space-y-2">
        <p class="text-xs text-muted-foreground">{{ t('avatar.stepFlow.quickSuggestion') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="suggestion in nameSuggestions"
            :key="suggestion"
            class="px-3 py-2 min-h-[44px] text-xs rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors active:scale-[0.97]"
            style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
            @click="localName = suggestion"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: 完成创建 -->
    <div v-if="currentStep === 3" class="text-center space-y-6">
      <div class="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center dark:bg-emerald-500/15">
        <Check :size="40" class="text-emerald-500 dark:text-emerald-400" />
      </div>

      <div>
        <h3 class="text-xl font-semibold text-foreground">
          {{ t('avatar.stepFlow.successTitle') }}
        </h3>
        <p class="text-base text-muted-foreground mt-1">
          {{ t('avatar.stepFlow.successReady', { name: localName }) }}
        </p>
      </div>

      <!-- 下一步引导 -->
      <div class="space-y-3 pt-4">
        <p class="text-xs text-muted-foreground">{{ t('avatar.stepFlow.nextSteps') }}</p>
        <div class="space-y-2">
          <button
            class="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 transition-all hover:bg-primary/90 active:scale-[0.98]"
            style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
            @click="goToChat"
          >
            <MessageSquare :size="18" />
            {{ t('avatar.stepFlow.startChat') }}
          </button>
          <button
            class="w-full py-3 rounded-lg border bg-card text-foreground font-medium flex items-center justify-center gap-2 transition-all hover:bg-muted/50 active:scale-[0.98]"
            style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
            @click="goToSettings"
          >
            <Settings :size="18" />
            {{ t('avatar.stepFlow.configPermissions') }}
          </button>
        </div>
      </div>

      <!-- 高级设置入口 -->
      <button
        class="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 mx-auto py-2 transition-colors"
        style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
        @click="expandAdvanced"
      >
        <ChevronDown :size="14" :class="{ 'rotate-180': showAdvanced }" />
        {{ t('avatar.stepFlow.advancedSettings') }}
      </button>

      <!-- 高级设置面板 -->
      <div v-show="showAdvanced" class="text-left space-y-4 pt-2">
        <slot name="advanced-settings" />
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="flex items-center justify-between mt-8 pt-4 border-t">
      <button
        v-if="currentStep > 1 && currentStep < 3"
        class="px-4 py-2.5 min-h-[44px] text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg transition-colors active:scale-[0.98] hover:bg-muted/50"
        style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
        @click="prevStep"
      >
        <ArrowLeft :size="16" />
        {{ t('avatar.stepFlow.prevStep') }}
      </button>
      <div v-else class="w-16" />

      <span class="text-xs text-muted-foreground">
        {{ currentStep }} / 3
      </span>

      <button
        v-if="currentStep < 3"
        :disabled="!canProceed"
        class="px-6 py-2.5 min-h-[44px] rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-all hover:bg-primary/90 active:scale-[0.98]"
        style="transition-duration: var(--duration-normal); transition-timing-function: var(--ease-fluid)"
        @click="nextStep"
      >
        {{ t('avatar.stepFlow.nextStep') }}
        <ArrowRight :size="16" />
      </button>
      <div v-else class="w-16" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  Check,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Settings,
  ChevronDown,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { AvatarTemplate } from '../types'

// ---- Props & Emits ----
const props = defineProps<{
  templates: AvatarTemplate[]
  modelValue: {
    step: number
    templateId: string | null
    name: string
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue]
  'complete': []
  'go-chat': []
  'go-settings': []
}>()

// ---- Local State ----
const { t } = useI18n()
const currentStep = ref(props.modelValue.step || 1)
const selectedTemplateId = ref<string | null>(props.modelValue.templateId)
const localName = ref(props.modelValue.name || '')
const showAdvanced = ref(false)
const nameInputRef = ref<HTMLInputElement>()

// ---- Computed ----
const selectedTemplate = computed(() =>
  props.templates.find(t => t.id === selectedTemplateId.value)
)

const stepTitle = computed(() => {
  switch (currentStep.value) {
    case 1: return t('avatar.stepFlow.step1Title')
    case 2: return t('avatar.stepFlow.step2Title')
    case 3: return t('avatar.stepFlow.step3Title')
    default: return ''
  }
})

const stepDescription = computed(() => {
  switch (currentStep.value) {
    case 1: return t('avatar.stepFlow.step1Desc')
    case 2: return t('avatar.stepFlow.step2Desc')
    case 3: return t('avatar.stepFlow.step3Desc')
    default: return ''
  }
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return !!selectedTemplateId.value
    case 2: return localName.value.trim().length > 0
    default: return false
  }
})

const namePlaceholder = computed(() => {
  if (selectedTemplateId.value === 'clone-self') {
    return t('avatar.stepFlow.nameClonePlaceholder')
  }
  return t('avatar.stepFlow.nameDefaultPlaceholder')
})

const nameSuggestions = computed(() => {
  const map: Record<string, string[]> = {
    'clone-self': [t('avatar.stepFlow.suggestCloneSelf'), t('avatar.stepFlow.suggestCloneDigital'), t('avatar.stepFlow.suggestCloneAI')],
    'humor': [t('avatar.stepFlow.suggestHumor1'), t('avatar.stepFlow.suggestHumor2'), t('avatar.stepFlow.suggestHumor3')],
    'tech': [t('avatar.stepFlow.suggestTech1'), t('avatar.stepFlow.suggestTech2'), t('avatar.stepFlow.suggestTech3')],
    'literary': [t('avatar.stepFlow.suggestLiterary1'), t('avatar.stepFlow.suggestLiterary2'), t('avatar.stepFlow.suggestLiterary3')],
    'social': [t('avatar.stepFlow.suggestSocial1'), t('avatar.stepFlow.suggestSocial2'), t('avatar.stepFlow.suggestSocial3')],
    'custom': [t('avatar.stepFlow.suggestCustom1'), t('avatar.stepFlow.suggestCustom2'), t('avatar.stepFlow.suggestCustom3')],
  }
  return map[selectedTemplateId.value || ''] || [t('avatar.stepFlow.suggestDefault1'), t('avatar.stepFlow.suggestDefault2')]
})

// ---- Methods ----
function getStepIndicatorClass(step: number): string {
  if (currentStep.value === step) {
    return 'bg-primary text-primary-foreground'
  }
  if (currentStep.value > step) {
    return 'bg-emerald-500 text-white dark:bg-emerald-600'
  }
  return 'bg-muted text-muted-foreground'
}

function selectTemplate(id: string) {
  selectedTemplateId.value = id
  // 自动进入下一步（移动端优化）
  setTimeout(() => {
    if (canProceed.value) {
      nextStep()
    }
  }, 200)
}

function nextStep() {
  if (!canProceed.value) return
  if (currentStep.value < 3) {
    currentStep.value++
    // Step 2 自动聚焦输入框
    if (currentStep.value === 2) {
      nextTick(() => {
        nameInputRef.value?.focus()
      })
    }
    emitUpdate()
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    emitUpdate()
  }
}

function emitUpdate() {
  emit('update:modelValue', {
    step: currentStep.value,
    templateId: selectedTemplateId.value,
    name: localName.value,
  })
}

function expandAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function goToChat() {
  emit('go-chat')
}

function goToSettings() {
  emit('go-settings')
}

// ---- Watchers ----
watch(() => props.modelValue, (newVal) => {
  currentStep.value = newVal.step
  selectedTemplateId.value = newVal.templateId
  localName.value = newVal.name
}, { deep: true })

watch([currentStep, selectedTemplateId, localName], emitUpdate, { deep: true })
</script>

<style scoped>
/* prefers-reduced-motion 降级 */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  /* Step1 模版卡片选中态 glow 降低亮度 */
  .shadow-\[var\(--glow-subtle\)\] {
    --tw-shadow-color: rgba(99, 102, 241, 0.12);
  }

  /* Step3 完成状态圆圈 */
  .bg-emerald-500\/10 {
    background: rgba(16, 185, 129, 0.15);
  }
}
</style>

