<script setup lang="ts">
import { ref, watch, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import type { TextInputArgs, UIInteractMode, UIEventMeta } from '@/types/ui-event'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  args: TextInputArgs
  interact: UIInteractMode
  meta?: UIEventMeta
  turnId?: string
}>(), {
  interact: 'ui',
})

const emit = defineEmits<{
  submit: [value: string]
}>()

const insideForm = inject<boolean>('uiFormContext', false)
const value = ref(props.args.defaultValue ?? '')
const containerRef = ref<HTMLElement>()

const isElicitation = props.interact === 'elicitation'
const isDisabled = props.interact === 'ui' && !insideForm

// When inside a form, emit value on every change so the form can collect it
watch(value, (v) => {
  if (insideForm) {
    emit('submit', v)
  }
})

// Emit default value on mount if inside form and has default
if (insideForm && value.value) {
  emit('submit', value.value)
}

function handleSubmit() {
  emit('submit', value.value)
}

function handleCancel() {
  emit('submit', '')
}

const showButtons = isElicitation && !insideForm

onMounted(() => {
  if (containerRef.value) {
    gsap.from(containerRef.value, {
      opacity: 0,
      y: 8,
      duration: 0.3,
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
  <div ref="containerRef" class="flex flex-col gap-2 w-full" :class="insideForm ? '' : 'max-w-md'">
    <label class="text-sm font-medium text-foreground/90">
      {{ args.label }}
    </label>

    <textarea
      v-if="args.multiline"
      v-model="value"
      :placeholder="args.placeholder"
      :maxlength="args.maxLength"
      :disabled="isDisabled"
      :readonly="isDisabled"
      rows="4"
      class="border-input placeholder:text-muted-foreground flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[80px]"
    />
    <input
      v-else
      v-model="value"
      type="text"
      :placeholder="args.placeholder"
      :maxlength="args.maxLength"
      :disabled="isDisabled"
      :readonly="isDisabled"
      class="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
    />

    <div v-if="args.maxLength" class="text-xs text-muted-foreground text-right">
      {{ value.length }} / {{ args.maxLength }}
    </div>

    <div v-if="showButtons" class="flex items-center gap-2 mt-1">
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-95"
        @click="handleSubmit"
      >
        {{ t('common.button.submit') }}
      </button>
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-all active:scale-95"
        @click="handleCancel"
      >
        {{ t('common.button.cancel') }}
      </button>
    </div>
  </div>
</template>
