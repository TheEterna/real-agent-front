<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { Calendar } from 'lucide-vue-next'
import type { DatePickerArgs, UIInteractMode, UIEventMeta } from '@/types/ui-event'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  args: DatePickerArgs
  interact: UIInteractMode
  meta?: UIEventMeta
  turnId?: string
}>(), {
  interact: 'ui',
})

const emit = defineEmits<{
  submit: [value: string | { start: string; end: string }]
}>()

const insideForm = inject<boolean>('uiFormContext', false)
const mode = props.args.mode ?? 'date'

const dateValue = ref(props.args.defaultValue ?? '')
const dateEndValue = ref('')
const containerRef = ref<HTMLElement>()

const isElicitation = props.interact === 'elicitation'
const isDisabled = props.interact === 'ui' && !insideForm

const inputType = computed(() => {
  if (mode === 'datetime') return 'datetime-local'
  return 'date'
})

function emitCurrent() {
  if (mode === 'range') {
    emit('submit', { start: dateValue.value, end: dateEndValue.value })
  } else {
    emit('submit', dateValue.value)
  }
}

watch([dateValue, dateEndValue], () => {
  if (insideForm) {
    emitCurrent()
  }
})

if (insideForm && dateValue.value) {
  emitCurrent()
}

function handleSubmit() {
  emitCurrent()
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

    <div v-if="mode === 'range'" class="flex items-center gap-2">
      <div class="relative flex-1">
        <Calendar class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="dateValue"
          :type="inputType"
          :min="args.minDate"
          :max="args.maxDate"
          :disabled="isDisabled"
          :placeholder="t('uiEvent.datePicker.startDate')"
          class="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <span class="text-sm text-muted-foreground shrink-0">{{ t('uiEvent.datePicker.rangeSeparator') }}</span>
      <div class="relative flex-1">
        <Calendar class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          v-model="dateEndValue"
          :type="inputType"
          :min="args.minDate"
          :max="args.maxDate"
          :disabled="isDisabled"
          :placeholder="t('uiEvent.datePicker.endDate')"
          class="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>

    <div v-else class="relative">
      <Calendar class="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        v-model="dateValue"
        :type="inputType"
        :min="args.minDate"
        :max="args.maxDate"
        :disabled="isDisabled"
        class="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
      />
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
