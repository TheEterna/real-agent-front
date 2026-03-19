<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { gsap } from 'gsap'
import { notification } from 'ant-design-vue'
import {
  CheckCircle,
  Send,
  MessageSquare,
  ListChecks,
  FileUp,
  FormInput,
  Loader2
} from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import ToolApprovalMessage from './ToolApprovalMessage.vue'
import { sendInteractionResponse } from '@/api/agent'
import type { UIMessage, InteractionRequestData, FieldDefinition } from '@/types/events'
import { InteractionType } from '@/types/events'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  message: UIMessage
}>()

const emit = defineEmits<{
  approved: [result: any]
  rejected: [reason: string]
  error: [error: Error]
  terminateRequested: [reason: string]
}>()

// ---- Refs ----
const cardRef = ref<HTMLElement>()
const successRef = ref<HTMLElement>()

// ---- State ----
const submitting = ref(false)
const submitted = ref(false)

// ---- Derived ----
const interaction = computed<InteractionRequestData | null>(() => {
  if (!props.message.data) return null
  return props.message.data as InteractionRequestData
})

const turnId = computed(() => props.message.data?.turnId || props.message.turnId || '')

// ---- Form state per type ----
const textInputValue = ref('')
const selectedOption = ref('')
const formValues = reactive<Record<string, string>>({})

// ---- Computed helpers ----
const isToolApproval = computed(() => interaction.value?.type === InteractionType.TOOL_APPROVAL)
const isConfirm = computed(() => interaction.value?.type === InteractionType.CONFIRM)
const isTextInput = computed(() => interaction.value?.type === InteractionType.TEXT_INPUT)
const isSelect = computed(() => interaction.value?.type === InteractionType.SELECT)
const isForm = computed(() => interaction.value?.type === InteractionType.FORM)
const isFileUpload = computed(() => interaction.value?.type === InteractionType.FILE_UPLOAD)

const confirmText = computed(() => interaction.value?.confirmText || t('messages.interaction.confirm'))
const cancelText = computed(() => interaction.value?.cancelText || t('messages.interaction.cancel'))
const textPlaceholder = computed(() => interaction.value?.fields?.[0]?.placeholder || t('messages.interaction.inputPlaceholder'))

const typeIcon = computed(() => {
  switch (interaction.value?.type) {
    case InteractionType.CONFIRM: return MessageSquare
    case InteractionType.TEXT_INPUT: return FormInput
    case InteractionType.SELECT: return ListChecks
    case InteractionType.FORM: return FormInput
    case InteractionType.FILE_UPLOAD: return FileUp
    default: return MessageSquare
  }
})

const typeLabel = computed(() => {
  switch (interaction.value?.type) {
    case InteractionType.CONFIRM: return t('messages.interaction.typeConfirm')
    case InteractionType.TEXT_INPUT: return t('messages.interaction.typeTextInput')
    case InteractionType.SELECT: return t('messages.interaction.typeSelect')
    case InteractionType.FORM: return t('messages.interaction.typeForm')
    case InteractionType.FILE_UPLOAD: return t('messages.interaction.typeFileUpload')
    default: return t('messages.interaction.typeDefault')
  }
})

// ---- Submit logic ----
async function doSubmit(data: Record<string, unknown>) {
  if (submitting.value || submitted.value) return

  submitting.value = true
  try {
    await sendInteractionResponse(turnId.value, { data })
    submitted.value = true

    // Success animation
    if (successRef.value) {
      gsap.fromTo(successRef.value,
        { opacity: 0, scale: 0.8, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' }
      )
    }
  } catch (error: any) {
    notification.error({
      message: t('messages.interaction.submitFailed'),
      description: error?.message || t('messages.interaction.submitRetry'),
      duration: 5
    })
    emit('error', error instanceof Error ? error : new Error(String(error)))
  } finally {
    submitting.value = false
  }
}

// ---- Handlers ----
function onConfirm() {
  doSubmit({ confirmed: true })
}

function onCancel() {
  doSubmit({ confirmed: false })
}

function onTextSubmit() {
  if (!textInputValue.value.trim()) return
  doSubmit({ text: textInputValue.value.trim() })
}

function onSelectSubmit() {
  if (!selectedOption.value) return
  doSubmit({ selectedOptionId: selectedOption.value })
}

function onFormSubmit() {
  // Validate required fields
  const fields = interaction.value?.fields || []
  for (const field of fields) {
    if (field.required && !formValues[field.name]?.trim()) {
      notification.warning({
        message: t('messages.interaction.fieldRequired', { label: field.label }),
        duration: 3
      })
      return
    }
  }
  doSubmit({ ...formValues })
}

// ---- ToolApproval delegates ----
function onToolApproved(result: any) {
  submitted.value = true
  emit('approved', result)
}

function onToolRejected(reason: string) {
  submitted.value = true
  emit('rejected', reason)
}

// ---- GSAP lifecycle ----
onMounted(() => {
  if (!cardRef.value) return
  gsap.fromTo(cardRef.value,
    { opacity: 0, y: 12, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }
  )
})

onUnmounted(() => {
  if (cardRef.value) gsap.killTweensOf(cardRef.value)
  if (successRef.value) gsap.killTweensOf(successRef.value)
})
</script>

<template>
  <div ref="cardRef" class="interaction-message w-full max-w-2xl">
    <!-- TOOL_APPROVAL: delegate to existing component -->
    <template v-if="isToolApproval">
      <ToolApprovalMessage
        :message="message"
        @approved="onToolApproved"
        @rejected="onToolRejected"
        @error="(e: Error) => emit('error', e)"
        @terminate-requested="(r: string) => emit('terminateRequested', r)"
      />
    </template>

    <!-- Other interaction types: unified card -->
    <template v-else-if="interaction">
      <div class="interaction-card bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-primary-200 dark:border-zinc-600 rounded-2xl overflow-hidden">

        <!-- Header -->
        <div class="interaction-header flex items-center gap-3 px-4 py-3 bg-primary-50/50 dark:bg-zinc-700/50 border-b border-primary-200/60 dark:border-zinc-600/60">
          <div class="header-icon w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <component :is="typeIcon" :size="16" class="text-primary-600 dark:text-primary-300" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="text-xs font-semibold text-primary-600 dark:text-primary-300 uppercase tracking-wide">{{ typeLabel }}</span>
          </div>
        </div>

        <!-- Prompt message -->
        <div v-if="interaction.message" class="interaction-prompt px-4 pt-4 pb-2">
          <p class="text-base text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">{{ interaction.message }}</p>
        </div>

        <!-- Body: routed by type -->
        <div class="interaction-body px-4 pb-4 pt-2">

          <!-- ========== CONFIRM ========== -->
          <template v-if="isConfirm">
            <div class="confirm-actions flex gap-3 mt-2">
              <Button
                :disabled="submitting || submitted"
                class="flex-1"
                @click="onConfirm"
              >
                <Loader2 v-if="submitting" :size="14" class="animate-spin mr-1.5" />
                {{ confirmText }}
              </Button>
              <Button
                variant="outline"
                :disabled="submitting || submitted"
                class="flex-1"
                @click="onCancel"
              >
                {{ cancelText }}
              </Button>
            </div>
          </template>

          <!-- ========== TEXT_INPUT ========== -->
          <template v-else-if="isTextInput">
            <div class="text-input-area mt-2 space-y-3">
              <Textarea
                v-model="textInputValue"
                :placeholder="textPlaceholder"
                :disabled="submitted"
                class="min-h-[80px] resize-y"
              />
              <div class="flex justify-end">
                <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        :disabled="submitting || submitted || !textInputValue.trim()"
                        size="sm"
                        :aria-label="t('messages.interaction.submitTextLabel')"
                        @click="onTextSubmit"
                      >
                        <Loader2 v-if="submitting" :size="14" class="animate-spin mr-1.5" />
                        <Send v-else :size="14" class="mr-1.5" />
                        {{ t('messages.interaction.submit') }}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" :side-offset="6">{{ t('messages.interaction.submitTextLabel') }}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </template>

          <!-- ========== SELECT ========== -->
          <template v-else-if="isSelect">
            <div class="select-area mt-2 space-y-3">
              <RadioGroup v-model="selectedOption" :disabled="submitted" class="space-y-2">
                <div
                  v-for="field in (interaction.fields || [])"
                  :key="field.name"
                  class="select-option flex items-start gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-600 hover:border-primary-300 dark:hover:border-primary-500 transition-colors cursor-pointer"
                  :class="{ 'border-primary-400 dark:border-primary-500 bg-primary-50/50 dark:bg-primary-900/20': selectedOption === field.name }"
                  @click="!submitted && (selectedOption = field.name)"
                >
                  <RadioGroupItem :value="field.name" :id="`opt-${field.name}`" class="mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <Label :for="`opt-${field.name}`" class="text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                      {{ field.label }}
                    </Label>
                    <p v-if="field.description" class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{{ field.description }}</p>
                  </div>
                </div>
              </RadioGroup>

              <div class="flex justify-end">
                <Button
                  :disabled="submitting || submitted || !selectedOption"
                  size="sm"
                  @click="onSelectSubmit"
                >
                  <Loader2 v-if="submitting" :size="14" class="animate-spin mr-1.5" />
                  <CheckCircle v-else :size="14" class="mr-1.5" />
                  {{ t('messages.interaction.confirmSelection') }}
                </Button>
              </div>
            </div>
          </template>

          <!-- ========== FORM ========== -->
          <template v-else-if="isForm">
            <div class="form-area mt-2 space-y-4">
              <div
                v-for="field in (interaction.fields || [])"
                :key="field.name"
                class="form-field space-y-1.5"
              >
                <Label :for="`form-${field.name}`" class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {{ field.label }}
                  <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
                </Label>
                <p v-if="field.description" class="text-xs text-zinc-500 dark:text-zinc-400">{{ field.description }}</p>

                <!-- textarea -->
                <Textarea
                  v-if="field.fieldType === 'textarea'"
                  :id="`form-${field.name}`"
                  v-model="formValues[field.name]"
                  :placeholder="field.placeholder || ''"
                  :disabled="submitted"
                  class="min-h-[60px] resize-y"
                />

                <!-- select (from options) -->
                <RadioGroup
                  v-else-if="field.fieldType === 'radio' && field.options?.length"
                  v-model="formValues[field.name]"
                  :disabled="submitted"
                  class="flex flex-wrap gap-2"
                >
                  <div
                    v-for="opt in field.options"
                    :key="opt"
                    class="flex items-center gap-1.5"
                  >
                    <RadioGroupItem :value="opt" :id="`form-${field.name}-${opt}`" />
                    <Label :for="`form-${field.name}-${opt}`" class="text-sm cursor-pointer">{{ opt }}</Label>
                  </div>
                </RadioGroup>

                <!-- default: text input -->
                <Input
                  v-else
                  :id="`form-${field.name}`"
                  v-model="formValues[field.name]"
                  :type="field.fieldType === 'password' ? 'password' : field.fieldType === 'number' ? 'number' : 'text'"
                  :placeholder="field.placeholder || ''"
                  :disabled="submitted"
                />
              </div>

              <div class="flex justify-end">
                <Button
                  :disabled="submitting || submitted"
                  size="sm"
                  @click="onFormSubmit"
                >
                  <Loader2 v-if="submitting" :size="14" class="animate-spin mr-1.5" />
                  <Send v-else :size="14" class="mr-1.5" />
                  {{ t('messages.interaction.submitForm') }}
                </Button>
              </div>
            </div>
          </template>

          <!-- ========== FILE_UPLOAD (placeholder) ========== -->
          <template v-else-if="isFileUpload">
            <div class="file-upload-placeholder mt-2 flex items-center gap-3 p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-700/30">
              <FileUp :size="20" class="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
              <p class="text-base text-zinc-500 dark:text-zinc-400">
                {{ t('messages.interaction.fileUploadComingSoon') }}
              </p>
            </div>
          </template>
        </div>

        <!-- Submitted indicator (overlaid for non-TOOL_APPROVAL types) -->
        <div
          v-if="submitted && !isToolApproval"
          ref="successRef"
          class="submitted-indicator flex items-center gap-2 px-4 py-3 bg-green-50/80 dark:bg-green-900/20 border-t border-green-200/60 dark:border-green-800/40"
        >
          <CheckCircle :size="16" class="text-green-600 dark:text-green-400 flex-shrink-0" />
          <span class="text-sm font-medium text-green-700 dark:text-green-300">{{ t('messages.common.submitted') }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.interaction-card {
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-lg);
  }
}

.select-option {
  transition: all 0.15s ease;
}

.form-field {
  transition: opacity 0.2s ease;
}
</style>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .interaction-card {
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 2px 4px rgba(0, 0, 0, 0.2);

    &:hover {
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.4),
        0 4px 8px rgba(0, 0, 0, 0.3);
    }
  }

  .interaction-header .header-icon {
    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.06);
  }

  .select-option:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .file-upload-placeholder {
    border-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
