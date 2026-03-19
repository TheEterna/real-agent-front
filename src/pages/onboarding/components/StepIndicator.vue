<!--
  Onboarding 步骤进度指示器

  水平分段进度条（已完成=primary，当前=primary，未来=muted）
  logo 已移至 Index.vue 页面左上角
-->

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OnboardingStep } from '../types'

const { t } = useI18n()

const props = defineProps<{
  currentStep: OnboardingStep
  steps: OnboardingStep[]
}>()

function getStepState(step: OnboardingStep): 'completed' | 'current' | 'upcoming' {
  const currentIndex = props.steps.indexOf(props.currentStep)
  const stepIndex = props.steps.indexOf(step)

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'upcoming'
}
</script>

<template>
  <div
    class="step-indicator"
    role="progressbar"
    :aria-valuenow="steps.indexOf(currentStep) + 1"
    :aria-valuemin="1"
    :aria-valuemax="steps.length"
    :aria-label="t('onboarding.stepIndicator.ariaLabel', { current: steps.indexOf(currentStep) + 1, total: steps.length })"
  >
    <!-- Progress bars -->
    <div class="step-indicator__bars">
      <div
        v-for="step in steps"
        :key="step"
        class="step-bar transition-all duration-500"
        :class="{
          'step-bar--completed': getStepState(step) === 'completed',
          'step-bar--current': getStepState(step) === 'current',
          'step-bar--upcoming': getStepState(step) === 'upcoming',
        }"
        :aria-current="getStepState(step) === 'current' ? 'step' : undefined"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.step-indicator {
  width: 100%;
}

.step-indicator__bars {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.step-bar {
  flex: 1;
  height: 4px;
  border-radius: 9999px;
}

.step-bar--completed {
  background: var(--primary);
}

.step-bar--current {
  background: var(--primary);
}

.step-bar--upcoming {
  background: var(--muted);
}
</style>

<!-- prefers-reduced-motion + dark mode -->
<style>
@media (prefers-reduced-motion: reduce) {
  .step-bar {
    transition: none !important;
  }
}
</style>

<style lang="scss">
.dark {
  .step-bar--upcoming {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
