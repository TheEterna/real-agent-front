<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { BrainCircuitIcon, SparklesIcon, ArrowRightIcon, CheckIcon } from 'lucide-vue-next'
import { message } from 'ant-design-vue'

interface OnboardingData {
  userName: string
  communicationStyle: 'formal' | 'casual' | 'concise'
  useCases: string[]
  interests: string
  customPreferences: string
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'complete', data: OnboardingData): void
}>()

const { t } = useI18n()

const currentStep = ref(0)
const data = ref<OnboardingData>({
  userName: '',
  communicationStyle: 'casual',
  useCases: [],
  interests: '',
  customPreferences: ''
})

const steps = computed(() => [
  { title: t('welcome.onboarding.stepName'), icon: '👤' },
  { title: t('welcome.onboarding.stepStyle'), icon: '💬' },
  { title: t('welcome.onboarding.stepUseCases'), icon: '🎯' },
  { title: t('welcome.onboarding.stepInterests'), icon: '✨' }
])

const useCaseOptions = computed(() => [
  { id: 'coding', label: t('welcome.onboarding.useCoding') },
  { id: 'writing', label: t('welcome.onboarding.useWriting') },
  { id: 'learning', label: t('welcome.onboarding.useLearning') },
  { id: 'assistant', label: t('welcome.onboarding.useAssistant') },
  { id: 'analysis', label: t('welcome.onboarding.useAnalysis') },
  { id: 'translation', label: t('welcome.onboarding.useTranslation') }
])

const communicationStyles = computed(() => [
  { value: 'formal', label: t('welcome.onboarding.styleFormal'), desc: t('welcome.onboarding.styleFormalDesc') },
  { value: 'casual', label: t('welcome.onboarding.styleCasual'), desc: t('welcome.onboarding.styleCasualDesc') },
  { value: 'concise', label: t('welcome.onboarding.styleConcise'), desc: t('welcome.onboarding.styleConciseDesc') }
])

const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === steps.length - 1)
const progress = computed(() => ((currentStep.value + 1) / steps.length) * 100)

function nextStep() {
  if (isLastStep.value) {
    submit()
  } else {
    currentStep.value++
  }
}

function prevStep() {
  if (!isFirstStep.value) {
    currentStep.value--
  }
}

function toggleUseCase(id: string) {
  const index = data.value.useCases.indexOf(id)
  if (index === -1) {
    data.value.useCases.push(id)
  } else {
    data.value.useCases.splice(index, 1)
  }
}

function submit() {
  if (!data.value.userName.trim()) {
    message.warning(t('welcome.onboarding.nameRequired'))
    return
  }

  emit('complete', data.value)
  emit('update:open', false)
  message.success(t('welcome.onboarding.setupComplete'))
}

function skip() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg" :closable="false">
      <!-- 进度条 -->
      <div class="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <BrainCircuitIcon class="size-5 text-primary" />
          {{ isLastStep ? t('welcome.onboarding.finishSetup') : t('welcome.onboarding.getToKnow') }}
        </DialogTitle>
      </DialogHeader>

      <!-- Step 1: 称呼 -->
      <div v-if="currentStep === 0" class="py-4">
        <h3 class="text-lg font-medium mb-2">{{ t('welcome.onboarding.howToCall') }}</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {{ t('welcome.onboarding.howToCallDesc') }}
        </p>
        <Input
          v-model="data.userName"
          :placeholder="t('welcome.onboarding.namePlaceholder')"
          class="text-lg"
          @keyup.enter="nextStep"
        />
        <p class="text-xs text-zinc-400 mt-2">
          {{ t('welcome.onboarding.nameExample') }}
        </p>
      </div>

      <!-- Step 2: 交流风格 -->
      <div v-else-if="currentStep === 1" class="py-4">
        <h3 class="text-lg font-medium mb-2">{{ t('welcome.onboarding.howToCommunicate') }}</h3>
        <RadioGroup v-model="data.communicationStyle" class="space-y-3">
          <div
            v-for="style in communicationStyles"
            :key="style.value"
            class="flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer"
            :class="[
              data.communicationStyle === style.value
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            ]"
            @click="data.communicationStyle = style.value as any"
          >
            <RadioGroupItem :value="style.value" class="mt-1" />
            <div>
              <Label class="font-medium cursor-pointer">{{ style.label }}</Label>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{{ style.desc }}</p>
            </div>
          </div>
        </RadioGroup>
      </div>

      <!-- Step 3: 使用场景 -->
      <div v-else-if="currentStep === 2" class="py-4">
        <h3 class="text-lg font-medium mb-2">{{ t('welcome.onboarding.whatUseCases') }}</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {{ t('welcome.onboarding.useCasesDesc') }}
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="option in useCaseOptions"
            :key="option.id"
            class="flex items-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer"
            :class="[
              data.useCases.includes(option.id)
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            ]"
            @click="toggleUseCase(option.id)"
          >
            <Checkbox :checked="data.useCases.includes(option.id)" class="pointer-events-none" />
            <Label class="cursor-pointer">{{ option.label }}</Label>
          </div>
        </div>
      </div>

      <!-- Step 4: 兴趣偏好 -->
      <div v-else-if="currentStep === 3" class="py-4">
        <h3 class="text-lg font-medium mb-2">{{ t('welcome.onboarding.anythingElse') }}</h3>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          {{ t('welcome.onboarding.anythingElseDesc') }}
        </p>
        <Textarea
          v-model="data.interests"
          :placeholder="t('welcome.onboarding.interestsPlaceholder')"
          :rows="4"
        />
      </div>

      <!-- 底部按钮 -->
      <div class="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          v-if="!isFirstStep"
          variant="ghost"
          @click="prevStep"
        >
          {{ t('common.button.previous') }}
        </Button>
        <div v-else />

        <Button
          :disabled="isFirstStep && !data.userName.trim()"
          @click="nextStep"
        >
          {{ isLastStep ? t('common.button.finish') : t('common.button.next') }}
          <ArrowRightIcon v-if="!isLastStep" class="size-4 ml-1" />
          <CheckIcon v-else class="size-4 ml-1" />
        </Button>
      </div>

      <!-- 跳过按钮 -->
      <div v-if="currentStep === 0" class="text-center">
        <Button variant="link" size="sm" @click="skip">
          {{ t('welcome.onboarding.skipSetup') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
