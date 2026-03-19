<!-- ================================================
  CreateExtraLiterary — 兴趣方向多选
  职责：预置标签多选（pill 样式），emit interests 数组
================================================ -->
<template>
  <div ref="rootRef" class="space-y-3">
    <h4 class="text-sm font-medium text-foreground">{{ t('avatar.literary.title') }}</h4>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="tag in availableTags"
        :key="tag"
        type="button"
        class="rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-95 min-h-[44px]"
        :class="[
          selectedTags.has(tag)
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-muted/60 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:border-foreground/10',
        ]"
        @click="toggle(tag)"
      >
        {{ tag }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from "vue"
import gsap from "gsap"
import { useReducedMotion } from "@/composables/useReducedMotion"
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  "update:data": [data: { interests: string[] }]
}>()

const { t } = useI18n()
const { prefersReduced } = useReducedMotion()
const rootRef = ref<HTMLElement>()

const availableTagKeys = ['literature', 'film', 'music', 'photography', 'drama', 'design', 'poetry', 'philosophy'] as const

const availableTags = computed(() =>
  availableTagKeys.map(key => t(`avatar.literary.${key}`))
)

const selectedTags = reactive(new Set<string>())

function toggle(tag: string) {
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag)
  } else {
    selectedTags.add(tag)
  }
  emit("update:data", { interests: [...selectedTags] })
}

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
  /* Literary tags use semantic Tailwind tokens (bg-primary/10, text-primary, bg-muted/60, etc.)
     which adapt via CSS variables. No additional dark overrides needed. */
}
</style>
