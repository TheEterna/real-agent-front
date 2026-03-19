<template>
  <div class="rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 sm:p-5 transition-all hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-sm">
    <!-- Question Header -->
    <div class="flex items-start gap-2 sm:gap-3 mb-3">
      <span class="shrink-0 w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center justify-center">
        {{ index + 1 }}
      </span>
      <p class="text-base font-medium text-slate-800 dark:text-white leading-relaxed">{{ question.question }}</p>
    </div>

    <!-- Single Choice Options + Custom Input -->
    <div v-if="question.type === 'single_choice' && question.options" class="ml-9 sm:ml-9 space-y-2">
      <label
        v-for="option in question.options"
        :key="option"
        class="flex items-center gap-2.5 px-3 py-2.5 sm:py-2 rounded-lg cursor-pointer transition-all"
        :class="modelValue === option && !isCustomMode
          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
          : 'bg-slate-50 dark:bg-zinc-800 border border-transparent hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300'"
        @click="selectOption(option)"
      >
        <span
          class="shrink-0 w-5 h-5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center transition-colors"
          :class="modelValue === option && !isCustomMode ? 'border-amber-500 dark:border-amber-500' : 'border-slate-300 dark:border-zinc-600'"
        >
          <span
            v-if="modelValue === option && !isCustomMode"
            class="w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full bg-amber-500"
          />
        </span>
        <span class="text-base">{{ option }}</span>
      </label>

      <!-- Custom input toggle -->
      <div class="pt-1">
        <button
          v-if="!isCustomMode"
          class="text-xs text-slate-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors active:scale-95"
          @click="enterCustomMode"
        >
          {{ t('thesisWriter.guideQuestionCard.customMode') }}
        </button>
        <div v-else class="space-y-2">
          <textarea
            ref="customInputRef"
            :value="modelValue"
            class="w-full px-3 py-2.5 text-sm border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/30 dark:bg-amber-900/10 resize-none
                   focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-800 focus:ring-1 focus:ring-amber-100 dark:focus:ring-amber-900/50
                   placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all
                   text-slate-700 dark:text-zinc-200"
            :placeholder="t('thesisWriter.guideQuestionCard.customPlaceholder')"
            rows="2"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
          />
          <button
            class="text-xs text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors active:scale-95"
            @click="exitCustomMode"
          >
            {{ t('thesisWriter.guideQuestionCard.backToOptions') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Text Input (open-ended question) -->
    <div v-else class="ml-9">
      <textarea
        :value="modelValue"
        class="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 resize-none
               focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-amber-100 dark:focus:ring-amber-900/50
               placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all
               text-slate-700 dark:text-zinc-200"
        :placeholder="t('thesisWriter.guideQuestionCard.inputPlaceholder')"
        rows="2"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GuidedQuestionItem } from '@/types/thesis-writer'

const { t } = useI18n()

const props = defineProps<{
  index: number
  question: GuidedQuestionItem
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isCustomMode = ref(false)
const customInputRef = ref<HTMLTextAreaElement | null>(null)

function selectOption(option: string) {
  isCustomMode.value = false
  emit('update:modelValue', option)
}

function enterCustomMode() {
  isCustomMode.value = true
  emit('update:modelValue', '')
  nextTick(() => {
    customInputRef.value?.focus()
  })
}

function exitCustomMode() {
  isCustomMode.value = false
  emit('update:modelValue', '')
}
</script>