<!-- ================================================
  AvatarCreateDialog -- 数字分身创建弹窗
  职责：大号居中 Dialog，组合模版选择、内核选择、
        模版专属配置、底部操作栏
  触发：AvatarList 中"创建分身"按钮
================================================ -->
<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent
      class="flex h-[100dvh] w-[100dvw] max-h-none max-w-none flex-col gap-0 overflow-hidden rounded-none border-none p-0 sm:h-[96dvh] sm:w-[96dvw] sm:max-w-none sm:rounded-xl sm:border"
      @open-auto-focus.prevent
    >
      <!-- 头部 -->
      <DialogHeader class="shrink-0 border-b px-6 py-4">
        <DialogTitle class="text-lg font-semibold">{{ t('avatar.create.dialogTitle') }}</DialogTitle>
        <DialogDescription class="text-base text-muted-foreground">
          {{ t('avatar.create.dialogDesc') }}
        </DialogDescription>
      </DialogHeader>

      <!-- ====== 移动端：分步流程（< sm） ====== -->
      <div class="flex-1 overflow-y-auto sm:hidden">
        <CreateStepFlow
          v-model="stepFlowModel"
          :templates="AVATAR_TEMPLATES"
          @complete="handleStepFlowComplete"
          @go-chat="handleStepFlowGoChat"
          @go-settings="handleStepFlowGoSettings"
        >
          <template #advanced-settings>
            <CreateExtraStep
              :template-id="ctx.selectedTemplateId.value"
              :portrait="ctx.portrait.value"
              :is-loading-portrait="ctx.isLoadingPortrait.value"
              :model-value="ctx.extraData.value"
              @update:model-value="handleExtraData"
            />
          </template>
        </CreateStepFlow>
      </div>

      <!-- ====== 桌面端：原有三段式布局（≥ sm） ====== -->
      <div ref="scrollRef" class="hidden flex-1 overflow-y-auto px-6 py-6 space-y-8 sm:block">
        <!-- Section 1: 模版选择 -->
        <div ref="section1Ref">
          <CreateTemplateSection
            :selected-id="ctx.selectedTemplateId.value"
            @select="ctx.selectTemplate"
          />
        </div>

        <!-- Section 2: 内核选择 -->
        <div ref="section2Ref">
          <CreateCoreTierSection
            :selected-tier="ctx.selectedCoreTier.value"
            :user-tier="ctx.userTier.value"
            @select="ctx.selectCoreTier"
            @upgrade="openPricing"
          />
        </div>

        <!-- Section 3: 模版专属配置 -->
        <div ref="section3Ref">
          <CreateExtraStep
            :template-id="ctx.selectedTemplateId.value"
            :portrait="ctx.portrait.value"
            :is-loading-portrait="ctx.isLoadingPortrait.value"
            :model-value="ctx.extraData.value"
            @update:model-value="handleExtraData"
          />
        </div>
      </div>

      <!-- 底部栏（桌面端可见，移动端 StepFlow 自带导航） -->
      <div class="hidden shrink-0 border-t bg-background px-6 py-4 sm:block">
        <div class="flex items-center gap-3">
          <!-- 名称输入框 -->
          <input
            ref="nameInputRef"
            type="text"
            :value="ctx.avatarName.value"
            :placeholder="inputPlaceholder"
            :disabled="ctx.selectedTemplateId.value === null"
            maxlength="20"
            class="h-11 flex-1 rounded-lg border bg-card px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            @input="handleNameInput"
            @keydown.enter="handleCreate"
          />

          <!-- 创建按钮 -->
          <button
            ref="createBtnRef"
            :disabled="!ctx.canCreate.value || ctx.isCreating.value"
            class="flex h-11 shrink-0 items-center gap-2 rounded-lg px-5 text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            :class="ctx.createSuccess.value
              ? 'bg-emerald-500 dark:bg-emerald-600 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'"
            @click="handleCreate"
          >
            <Loader2 v-if="ctx.isCreating.value" :size="16" class="animate-spin" />
            <Check v-else-if="ctx.createSuccess.value" :size="16" />
            <Sparkles v-else :size="16" />
            <span>{{ buttonLabel }}</span>
          </button>
        </div>

        <!-- 配额提示 -->
        <p
          v-if="!avatarStore.avatarQuota.isUltra"
          class="mt-2 text-center text-xs text-muted-foreground/50"
        >
          {{ t('avatar.create.quotaUsed', { current: avatarStore.avatarQuota.current, max: avatarStore.avatarQuota.max }) }}
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, Loader2, Check } from 'lucide-vue-next'
import gsap from 'gsap'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { notification } from 'ant-design-vue'
import { useModalRoute } from '@/composables/useModalRoute'
import { useAvatarStore } from '@/stores/avatarStore'
import { useAuthStore } from '@/stores/authStore'
import { useAvatarCreate } from './composables/useAvatarCreate'
import CreateTemplateSection from './components/CreateTemplateSection.vue'
import CreateCoreTierSection from './components/CreateCoreTierSection.vue'
import CreateExtraStep from './components/CreateExtraStep.vue'
import CreateStepFlow from './components/CreateStepFlow.vue'
import { AVATAR_TEMPLATES } from './constants/templates'
import { useI18n } from 'vue-i18n'

// ---- Props & Emits ----
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// ---- Dependencies ----
const { t } = useI18n()
const router = useRouter()
const avatarStore = useAvatarStore()
const authStore = useAuthStore()
const ctx = useAvatarCreate()
const { openPricing } = useModalRoute()
const { prefersReduced } = useReducedMotion()

// ---- Refs ----
const scrollRef = ref<HTMLElement>()
const nameInputRef = ref<HTMLInputElement>()
const createBtnRef = ref<HTMLElement>()
const section1Ref = ref<HTMLElement>()
const section2Ref = ref<HTMLElement>()
const section3Ref = ref<HTMLElement>()

// ---- GSAP cleanup tracking ----
const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = []

// ---- Open/Close ----
function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

// 弹窗打开时重置状态 + 入场动画
watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    // 重置 composable 状态
    ctx.selectedTemplateId.value = null
    ctx.selectedCoreTier.value = null
    ctx.avatarName.value = ''
    ctx.extraData.value = {}
    ctx.createSuccess.value = false
    stepFlowModel.value = { step: 1, templateId: null, name: '' }
    createdAvatarId.value = null

    // 加载配额和最新用户资料（确保会员等级正确）
    avatarStore.loadAvatars()
    await authStore.refreshUserProfile()

    // 入场动画
    await nextTick()
    if (!prefersReduced.value) {
      const sections = [section1Ref.value, section2Ref.value, section3Ref.value].filter(Boolean) as HTMLElement[]
      sections.forEach((el, i) => {
        const t = gsap.from(el, {
          y: 12,
          opacity: 0,
          scale: 0.97,
          duration: 0.3,
          delay: i * 0.06,
          ease: 'back.out(1.4)',
        })
        tweens.push(t)
      })
    }
  }
})

// ---- Input ----
function handleNameInput(e: Event) {
  ctx.avatarName.value = (e.target as HTMLInputElement).value
}

const inputPlaceholder = computed(() => {
  if (ctx.selectedTemplateId.value === null) return t('avatar.create.placeholderNoTemplate')
  if (ctx.selectedTemplateId.value === 'clone-self') return t('avatar.create.placeholderCloneSelf')
  return t('avatar.create.placeholderDefault')
})

// ---- Extra Data ----
function handleExtraData(data: Record<string, unknown>) {
  ctx.extraData.value = data
}

// ---- Button Label ----
const buttonLabel = computed(() => {
  if (ctx.createSuccess.value) return t('avatar.create.createSuccess')
  if (ctx.isCreating.value) return t('avatar.create.creating')
  return t('avatar.create.createAvatar')
})

// ---- Create ----
async function handleCreate() {
  if (ctx.isCreating.value || !ctx.canCreate.value) return

  const avatarId = await ctx.create()
  if (avatarId) {
    // 成功动画
    if (createBtnRef.value && !prefersReduced.value) {
      const tl = gsap.timeline()
      tl.to(createBtnRef.value, { scale: 1.15, duration: 0.15, ease: 'power2.out' })
        .to(createBtnRef.value, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
      tweens.push(tl)
    }

    // 延迟后关闭弹窗并跳转
    setTimeout(() => {
      emit('update:open', false)
      router.push(`/avatar/${avatarId}`)
    }, 400)
  } else if (ctx.createError.value) {
    notification.error({ message: t('avatar.create.createFailed'), description: ctx.createError.value || t('avatar.create.createFailedDefault') })
    // 错误抖动反馈
    if (createBtnRef.value && !prefersReduced.value) {
      gsap.to(createBtnRef.value, { keyframes: [{ x: -4 }, { x: 4 }, { x: -2 }, { x: 2 }, { x: 0 }], duration: 0.4, ease: 'power2.inOut' })
    }
  }
}

// ---- 移动端 StepFlow ----
const stepFlowModel = ref({ step: 1, templateId: null as string | null, name: '' })
const createdAvatarId = ref<string | null>(null)

// StepFlow 双向绑定 → 同步到 ctx
watch(stepFlowModel, (val) => {
  if (val.templateId && val.templateId !== ctx.selectedTemplateId.value) {
    ctx.selectTemplate(val.templateId)
  }
  ctx.avatarName.value = val.name

  // Step 2 → 3 过渡：名字填好后自动创建
  if (val.step === 3 && !ctx.createSuccess.value && !ctx.isCreating.value) {
    handleStepFlowCreate()
  }
}, { deep: true })

async function handleStepFlowCreate() {
  // 移动端省略内核选择，自动选默认
  if (!ctx.selectedCoreTier.value) {
    ctx.selectCoreTier('lite')
  }
  const avatarId = await ctx.create()
  if (avatarId) {
    createdAvatarId.value = avatarId
  } else if (ctx.createError.value) {
    notification.error({ message: t('avatar.create.createFailed'), description: ctx.createError.value || t('avatar.create.createFailedDefault') })
  }
}

function handleStepFlowComplete() {
  emit('update:open', false)
}

function handleStepFlowGoChat() {
  emit('update:open', false)
  if (createdAvatarId.value) {
    router.push(`/avatar/${createdAvatarId.value}`)
  }
}

function handleStepFlowGoSettings() {
  emit('update:open', false)
  if (createdAvatarId.value) {
    router.push(`/avatar/${createdAvatarId.value}?tab=settings`)
  }
}

// ---- GSAP Cleanup ----
onUnmounted(() => {
  tweens.forEach((t) => t.kill())
  ;[section1Ref.value, section2Ref.value, section3Ref.value].forEach((el) => {
    if (el) gsap.killTweensOf(el)
  })
  if (createBtnRef.value) gsap.killTweensOf(createBtnRef.value)
})
</script>
