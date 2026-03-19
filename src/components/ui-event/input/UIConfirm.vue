<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { AlertTriangle } from 'lucide-vue-next'
import type { ConfirmArgs, UIInteractMode, UIEventMeta } from '@/types/ui-event'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  args: ConfirmArgs
  interact: UIInteractMode
  meta?: UIEventMeta
  turnId?: string
}>(), {
  interact: 'ui',
})

const emit = defineEmits<{
  submit: [value: boolean]
}>()

const insideForm = inject<boolean>('uiFormContext', false)
const containerRef = ref<HTMLElement>()
const isElicitation = props.interact === 'elicitation'
const showButtons = isElicitation && !insideForm

function handleConfirm() {
  emit('submit', true)
}

function handleCancel() {
  emit('submit', false)
}

onMounted(() => {
  if (containerRef.value) {
    gsap.from(containerRef.value, {
      opacity: 0,
      scale: 0.96,
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
  <div
    ref="containerRef"
    class="w-full rounded-lg border p-4 shadow-xs"
    :class="[
      args.danger ? 'border-destructive/30 bg-destructive/5' : 'border-input bg-background',
      insideForm ? '' : 'max-w-md',
    ]"
  >
    <div class="flex gap-3">
      <div
        v-if="args.danger"
        class="flex items-center justify-center size-9 rounded-full shrink-0 bg-destructive/10 text-destructive"
      >
        <AlertTriangle class="size-5" />
      </div>
      <div class="flex-1 flex flex-col gap-1">
        <h4 class="text-sm font-semibold text-foreground">
          {{ args.title }}
        </h4>
        <p v-if="args.description" class="text-sm text-muted-foreground leading-relaxed">
          {{ args.description }}
        </p>
      </div>
    </div>

    <div v-if="showButtons" class="flex items-center justify-end gap-2 mt-4">
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-all active:scale-95"
        @click="handleCancel"
      >
        {{ args.cancelText ?? t('common.button.cancel') }}
      </button>
      <button
        class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 shadow-xs transition-all active:scale-95"
        :class="args.danger
          ? 'bg-destructive text-white hover:bg-destructive/90'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'"
        @click="handleConfirm"
      >
        {{ args.confirmText ?? t('common.button.confirm') }}
      </button>
    </div>
  </div>
</template>
