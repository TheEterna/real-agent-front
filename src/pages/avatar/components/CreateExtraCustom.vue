<!-- ================================================
  CreateExtraCustom — 自定义人设表单
  职责：完整表单（tone + interests + expertise），
       标签输入内联实现，实时 emit personality 数据
================================================ -->
<template>
  <div ref="rootRef" class="space-y-5">
    <h4 class="text-sm font-medium text-foreground">{{ t('avatar.custom.title') }}</h4>

    <!-- 1. 人设风格 (tone) -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-foreground">{{ t('avatar.custom.toneLabel') }}</label>
      <textarea
        v-model="tone"
        :placeholder="t('avatar.custom.tonePlaceholder')"
        maxlength="200"
        rows="3"
        class="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <p class="text-right text-xs text-muted-foreground/60">
        {{ tone.length }}/200
      </p>
    </div>

    <!-- 2. 兴趣标签 (interests) -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-foreground">{{ t('avatar.custom.interestLabel') }}</label>
      <div
        class="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 min-h-[40px] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30"
      >
        <span
          v-for="tag in interests"
          :key="tag"
          class="inline-flex items-center gap-1 rounded-full bg-primary/10 pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-primary"
        >
          {{ tag }}
          <button
            type="button"
            class="rounded-full p-0.5 hover:bg-primary/20 active:scale-95"
            :aria-label="t('avatar.custom.deleteInterest', { tag })"
            @click="removeInterest(tag)"
          >
            <X :size="12" />
          </button>
        </span>
        <input
          v-model="interestInput"
          :placeholder="t('avatar.custom.interestPlaceholder')"
          class="min-w-[120px] flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          @keydown.enter.prevent="addInterest"
        />
      </div>
    </div>

    <!-- 3. 专长领域 (expertise) -->
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-foreground">{{ t('avatar.custom.expertiseLabel') }}</label>
      <div
        class="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 min-h-[40px] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30"
      >
        <span
          v-for="tag in expertise"
          :key="tag"
          class="inline-flex items-center gap-1 rounded-full bg-primary/10 pl-2.5 pr-1.5 py-0.5 text-xs font-medium text-primary"
        >
          {{ tag }}
          <button
            type="button"
            class="rounded-full p-0.5 hover:bg-primary/20 active:scale-95"
            :aria-label="t('avatar.custom.deleteExpertise', { tag })"
            @click="removeExpertise(tag)"
          >
            <X :size="12" />
          </button>
        </span>
        <input
          v-model="expertiseInput"
          :placeholder="t('avatar.custom.expertisePlaceholder')"
          class="min-w-[120px] flex-1 border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          @keydown.enter.prevent="addExpertise"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue"
import { X } from "lucide-vue-next"
import gsap from "gsap"
import { useReducedMotion } from "@/composables/useReducedMotion"
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  "update:data": [
    data: {
      personality: {
        tone: string
        interests: string[]
        expertise: string[]
      }
    },
  ]
}>()

const { t } = useI18n()
const { prefersReduced } = useReducedMotion()
const rootRef = ref<HTMLElement>()

// --- 表单状态 ---
const tone = ref("")
const interests = ref<string[]>([])
const expertise = ref<string[]>([])
const interestInput = ref("")
const expertiseInput = ref("")

// --- 兴趣标签操作 ---
function addInterest() {
  const val = interestInput.value.trim()
  if (val && !interests.value.includes(val)) {
    interests.value.push(val)
    interestInput.value = ""
  }
}

function removeInterest(tag: string) {
  interests.value = interests.value.filter((t) => t !== tag)
}

// --- 专长标签操作 ---
function addExpertise() {
  const val = expertiseInput.value.trim()
  if (val && !expertise.value.includes(val)) {
    expertise.value.push(val)
    expertiseInput.value = ""
  }
}

function removeExpertise(tag: string) {
  expertise.value = expertise.value.filter((t) => t !== tag)
}

// --- 实时 emit ---
watch(
  [tone, interests, expertise],
  () => {
    emit("update:data", {
      personality: {
        tone: tone.value,
        interests: [...interests.value],
        expertise: [...expertise.value],
      },
    })
  },
  { deep: true }
)

// --- GSAP ---
onMounted(() => {
  if (prefersReduced.value || !rootRef.value) return
  gsap.from(rootRef.value, {
    opacity: 0,
    y: 8,
    duration: 0.25,
    ease: "power2.out",
  })
})

onUnmounted(() => {
  if (rootRef.value) gsap.killTweensOf(rootRef.value)
})
</script>

<!-- Dark mode: non-scoped block -->
<style lang="scss">
.dark {
  /* Custom form uses semantic Tailwind tokens (border-border, bg-background, text-foreground, etc.)
     which adapt via CSS variables. No additional dark overrides needed. */
}
</style>
