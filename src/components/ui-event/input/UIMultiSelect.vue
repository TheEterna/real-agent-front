<script setup lang="ts">
import { ref, watch, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { Check } from 'lucide-vue-next'
import type { MultiSelectArgs, UIInteractMode, UIEventMeta } from '@/types/ui-event'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  args: MultiSelectArgs
  interact: UIInteractMode
  meta?: UIEventMeta
  turnId?: string
}>(), {
  interact: 'ui',
})

const emit = defineEmits<{
  submit: [value: string[]]
}>()

const insideForm = inject<boolean>('uiFormContext', false)
const selected = ref<string[]>([...(props.args.defaultValues ?? [])])
const containerRef = ref<HTMLElement>()

const isElicitation = props.interact === 'elicitation'
const isDisabled = props.interact === 'ui' && !insideForm

watch(selected, (v) => {
  if (insideForm) {
    emit('submit', [...v])
  }
}, { deep: true })

if (insideForm && selected.value.length > 0) {
  emit('submit', [...selected.value])
}

function toggle(val: string) {
  if (isDisabled) return
  const idx = selected.value.indexOf(val)
  if (idx >= 0) {
    if (props.args.min && selected.value.length <= props.args.min) return
    selected.value.splice(idx, 1)
  } else {
    if (props.args.max && selected.value.length >= props.args.max) return
    selected.value.push(val)
  }
}

function isSelected(val: string) {
  return selected.value.includes(val)
}

function handleSubmit() {
  emit('submit', [...selected.value])
}

function handleCancel() {
  emit('submit', [])
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

    <div class="flex flex-col gap-1">
      <button
        v-for="option in args.options"
        :key="option.value"
        :disabled="option.disabled || isDisabled"
        class="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-all hover:bg-accent/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        :class="isSelected(option.value) ? 'border-primary bg-primary/5' : 'border-input bg-transparent'"
        @click="toggle(option.value)"
      >
        <div
          class="flex items-center justify-center size-4 rounded border transition-colors shrink-0"
          :class="isSelected(option.value) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'"
        >
          <Check v-if="isSelected(option.value)" class="size-3" />
        </div>
        <div class="flex flex-col items-start">
          <span>{{ option.label }}</span>
          <span v-if="option.description" class="text-xs text-muted-foreground">
            {{ option.description }}
          </span>
        </div>
      </button>
    </div>

    <div v-if="args.min || args.max" class="text-xs text-muted-foreground">
      <span v-if="args.min && args.max">{{ t('uiEvent.multiSelect.rangeHint', { min: args.min, max: args.max }) }}</span>
      <span v-else-if="args.min">{{ t('uiEvent.multiSelect.minHint', { min: args.min }) }}</span>
      <span v-else-if="args.max">{{ t('uiEvent.multiSelect.maxHint', { max: args.max }) }}</span>
      <span class="ml-1">({{ t('uiEvent.multiSelect.selectedCount', { count: selected.length }) }})</span>
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
