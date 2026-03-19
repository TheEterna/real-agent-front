<script setup lang="ts">
import { ref, watch, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import type { RadioArgs, UIInteractMode, UIEventMeta } from '@/types/ui-event'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  args: RadioArgs
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
const isHorizontal = props.args.direction === 'horizontal'

watch(value, (v) => {
  if (insideForm) {
    emit('submit', v)
  }
})

if (insideForm && value.value) {
  emit('submit', value.value)
}

function select(val: string) {
  if (isDisabled) return
  value.value = val
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

    <div
      class="flex gap-1.5"
      :class="isHorizontal ? 'flex-row flex-wrap' : 'flex-col'"
    >
      <button
        v-for="option in args.options"
        :key="option.value"
        :disabled="option.disabled || isDisabled"
        class="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-all hover:bg-accent/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        :class="value === option.value ? 'border-primary bg-primary/5' : 'border-input bg-transparent'"
        @click="select(option.value)"
      >
        <div
          class="flex items-center justify-center size-4 rounded-full border-2 transition-colors shrink-0"
          :class="value === option.value ? 'border-primary' : 'border-muted-foreground/40'"
        >
          <div
            v-if="value === option.value"
            class="size-2 rounded-full bg-primary"
          />
        </div>
        <div class="flex flex-col items-start">
          <span>{{ option.label }}</span>
          <span v-if="option.description" class="text-xs text-muted-foreground">
            {{ option.description }}
          </span>
        </div>
      </button>
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
