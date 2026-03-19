<script setup lang="ts">
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { Slider } from '@/components/ui/slider'
import type { SliderArgs, UIInteractMode, UIEventMeta } from '@/types/ui-event'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  args: SliderArgs
  interact: UIInteractMode
  meta?: UIEventMeta
  turnId?: string
}>(), {
  interact: 'ui',
})

const emit = defineEmits<{
  submit: [value: number]
}>()

const insideForm = inject<boolean>('uiFormContext', false)
const sliderValue = ref<number[]>([props.args.defaultValue ?? props.args.min])
const containerRef = ref<HTMLElement>()

const isElicitation = props.interact === 'elicitation'
const isDisabled = props.interact === 'ui' && !insideForm

const displayValue = computed(() => {
  const v = sliderValue.value[0]
  return props.args.unit ? `${v}${props.args.unit}` : String(v)
})

watch(sliderValue, (v) => {
  if (insideForm) {
    emit('submit', v[0])
  }
}, { deep: true })

if (insideForm) {
  emit('submit', sliderValue.value[0])
}

function handleSubmit() {
  emit('submit', sliderValue.value[0])
}

function handleCancel() {
  emit('submit', props.args.min)
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
  <div ref="containerRef" class="flex flex-col gap-3 w-full" :class="insideForm ? '' : 'max-w-md'">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-foreground/90">
        {{ args.label }}
      </label>
      <span class="text-sm font-mono text-muted-foreground tabular-nums">
        {{ displayValue }}
      </span>
    </div>

    <Slider
      v-model="sliderValue"
      :min="args.min"
      :max="args.max"
      :step="args.step ?? 1"
      :disabled="isDisabled"
    />

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span>{{ args.min }}{{ args.unit ?? '' }}</span>
      <span>{{ args.max }}{{ args.unit ?? '' }}</span>
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
