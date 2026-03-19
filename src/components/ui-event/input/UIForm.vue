<script setup lang="ts">
import { ref, computed, provide, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import type {
  FormArgs,
  UIInteractMode,
  UIEventMeta,
  UIFormField,
  UIComponentType,
} from '@/types/ui-event'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  args: FormArgs
  interact: UIInteractMode
  meta?: UIEventMeta
  turnId?: string
}>(), {
  interact: 'ui',
})

const emit = defineEmits<{
  submit: [value: Record<string, unknown>]
}>()

// Signal to child components that they're inside a form
provide('uiFormContext', true)

const containerRef = ref<HTMLElement>()
const isElicitation = props.interact === 'elicitation'
const isHorizontal = props.args.layout === 'horizontal'

// Collect field values -- keyed by field.name
const fieldValues = ref<Record<string, unknown>>({})

// Validation state
const validationErrors = ref<Record<string, string>>({})

// Map of component type to async component loader
const FIELD_COMPONENTS: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  text_input: defineAsyncComponent(() => import('./UITextInput.vue')),
  select: defineAsyncComponent(() => import('./UISelect.vue')),
  multi_select: defineAsyncComponent(() => import('./UIMultiSelect.vue')),
  radio: defineAsyncComponent(() => import('./UIRadio.vue')),
  checkbox: defineAsyncComponent(() => import('./UICheckbox.vue')),
  slider: defineAsyncComponent(() => import('./UISlider.vue')),
  date_picker: defineAsyncComponent(() => import('./UIDatePicker.vue')),
  file_upload: defineAsyncComponent(() => import('./UIFileUpload.vue')),
  confirm: defineAsyncComponent(() => import('./UIConfirm.vue')),
}

function resolveFieldComponent(type: UIComponentType) {
  return FIELD_COMPONENTS[type] ?? null
}

function handleFieldSubmit(field: UIFormField, value: unknown) {
  fieldValues.value[field.name] = value
  if (validationErrors.value[field.name]) {
    delete validationErrors.value[field.name]
  }
}

function validate(): boolean {
  const errors: Record<string, string> = {}
  for (const field of props.args.fields) {
    if (field.required) {
      const val = fieldValues.value[field.name]
      if (val === undefined || val === null || val === '') {
        errors[field.name] = t('uiEvent.form.requiredField')
      } else if (Array.isArray(val) && val.length === 0) {
        errors[field.name] = t('uiEvent.form.selectAtLeastOne')
      }
    }
  }
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', { ...fieldValues.value })
}

function handleCancel() {
  emit('submit', {})
}

onMounted(() => {
  if (containerRef.value) {
    gsap.from(containerRef.value, {
      opacity: 0,
      y: 10,
      duration: 0.35,
      ease: 'power2.out',
    })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
  }
})
</script>

<template>
  <div ref="containerRef" class="flex flex-col gap-4 w-full max-w-lg">
    <div
      class="flex gap-4"
      :class="isHorizontal ? 'flex-row flex-wrap' : 'flex-col'"
    >
      <div
        v-for="field in args.fields"
        :key="field.name"
        class="flex flex-col gap-0.5"
        :class="isHorizontal ? 'flex-1 min-w-[200px]' : 'w-full'"
      >
        <component
          :is="resolveFieldComponent(field.type)"
          v-if="resolveFieldComponent(field.type)"
          :args="field.args"
          interact="elicitation"
          :meta="meta"
          :turn-id="turnId"
          @submit="(val: unknown) => handleFieldSubmit(field, val)"
        />
        <div v-else class="text-xs text-muted-foreground p-2 border border-dashed rounded">
          {{ t('uiEvent.form.unsupportedField', { type: field.type }) }}
        </div>
        <div v-if="field.required" class="text-xs text-muted-foreground ml-0.5">
          * {{ t('uiEvent.form.required') }}
        </div>
        <div v-if="validationErrors[field.name]" class="text-xs text-destructive ml-0.5">
          {{ validationErrors[field.name] }}
        </div>
      </div>
    </div>

    <div v-if="isElicitation" class="flex items-center gap-2 pt-3 border-t border-input">
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-95"
        @click="handleSubmit"
      >
        {{ args.submitText ?? t('common.button.submit') }}
      </button>
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-all active:scale-95"
        @click="handleCancel"
      >
        {{ args.cancelText ?? t('common.button.cancel') }}
      </button>
    </div>
  </div>
</template>
