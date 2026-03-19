<!-- ================================================
  CreateBottomBar -- 分身创建页底部固定栏
  职责：分身名称输入 + 创建按钮 + 配额提示
  位置：sticky bottom-0，bg-gradient-to-t 渐隐
================================================ -->
<template>
  <div class="sticky bottom-0 z-20 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6">
    <div class="mx-auto max-w-[830px] px-4 sm:px-8">
      <!-- 一行：Input + 创建按钮 -->
      <div class="flex items-center gap-3">
        <!-- 名称输入框 -->
        <input
          ref="nameInputRef"
          type="text"
          :value="avatarName"
          :placeholder="inputPlaceholder"
          :disabled="templateId === null"
          maxlength="20"
          class="h-11 flex-1 rounded-lg border bg-card px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          @input="handleInput"
        />

        <!-- 创建按钮 -->
        <button
          ref="createBtnRef"
          :disabled="!canCreate || isCreating"
          class="flex h-11 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          :class="createSuccess
            ? 'bg-emerald-500 text-white dark:bg-emerald-600'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'"
          @click="handleCreate"
        >
          <Loader2 v-if="isCreating" :size="16" class="animate-spin" />
          <Check v-else-if="createSuccess" :size="16" />
          <Sparkles v-else :size="16" />
          <span>{{ buttonLabel }}</span>
        </button>
      </div>

      <!-- 配额提示 -->
      <p
        v-if="!quotaIsUltra"
        class="mt-2 text-center text-xs text-muted-foreground/50"
      >
        {{ t('avatar.create.quotaUsed', { current: quotaCurrent, max: quotaMax }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { Sparkles, Loader2, Check } from 'lucide-vue-next'
import gsap from 'gsap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useI18n } from 'vue-i18n'

// ---- Props & Emits ----
const props = defineProps<{
  avatarName: string
  canCreate: boolean
  isCreating: boolean
  createSuccess: boolean
  quotaCurrent: number
  quotaMax: number
  quotaIsUltra: boolean
  templateId: string | null
}>()

const emit = defineEmits<{
  'update:avatarName': [value: string]
  create: []
}>()

// ---- Refs ----
const nameInputRef = ref<HTMLInputElement>()
const createBtnRef = ref<HTMLElement>()

// ---- Reduced Motion ----
const { t } = useI18n()
const { prefersReduced } = useReducedMotion()

// ---- Input Handling ----
function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:avatarName', target.value)
}

// ---- Dynamic Placeholder ----
const inputPlaceholder = computed(() => {
  if (props.templateId === null) return t('avatar.create.placeholderNoTemplate')
  if (props.templateId === 'clone-self') return t('avatar.create.placeholderCloneSelf')
  return t('avatar.create.placeholderDefault')
})

// ---- Button Label ----
const buttonLabel = computed(() => {
  if (props.createSuccess) return t('avatar.create.createSuccess')
  if (props.isCreating) return t('avatar.create.creating')
  return t('avatar.create.createAvatar')
})

// ---- Create Handler (guard + emit) ----
function handleCreate() {
  if (!props.canCreate || props.isCreating) return
  emit('create')
}

// ---- Success Animation (GSAP confirmSuccess) ----
let successTween: gsap.core.Tween | null = null

watch(
  () => props.createSuccess,
  (success) => {
    if (success && createBtnRef.value && !prefersReduced.value) {
      successTween?.kill()
      const tl = gsap.timeline()
      tl.to(createBtnRef.value, { scale: 1.15, duration: 0.15, ease: 'power2.out' })
        .to(createBtnRef.value, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
      successTween = tl as unknown as gsap.core.Tween
    }
  },
)

// ---- GSAP Cleanup ----
onUnmounted(() => {
  successTween?.kill()
  if (createBtnRef.value) gsap.killTweensOf(createBtnRef.value)
})
</script>

<!-- 暗色模式：独立非 scoped 块 -->
<style lang="scss">
.dark {
  /* CreateBottomBar 底部栏渐变适配 */
  .sticky.bg-gradient-to-t {
    --tw-gradient-from: var(--background);
    --tw-gradient-via: var(--background);
  }
}
</style>
