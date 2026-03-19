<!-- ================================================
  CreateExtraTech — 知识库选择
  职责：展示 mock 知识库列表，多选 checkbox，
       emit 选中的 knowledgeBaseIds
================================================ -->
<template>
  <div ref="rootRef" class="space-y-3">
    <div>
      <h4 class="text-sm font-medium text-foreground">{{ t('avatar.tech.title') }}</h4>
      <p class="mt-0.5 text-xs text-muted-foreground">
        {{ t('avatar.tech.subtitle') }}
      </p>
    </div>

    <!-- 加载态 -->
    <div v-if="isLoading" class="flex items-center justify-center py-6">
      <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      <span class="ml-2 text-xs text-muted-foreground">{{ t('avatar.tech.loadingKB') }}</span>
    </div>

    <!-- 错误态 -->
    <div v-else-if="loadError" class="text-center py-4">
      <p class="text-xs text-muted-foreground mb-2">{{ t('avatar.tech.loadFailed') }}</p>
      <button
        type="button"
        class="text-xs text-primary hover:underline"
        @click="loadKnowledgeBases"
      >
        {{ t('avatar.tech.retry') }}
      </button>
    </div>

    <!-- 空态 -->
    <div v-else-if="knowledgeBases.length === 0" class="text-center py-4">
      <p class="text-xs text-muted-foreground">{{ t('avatar.tech.noKB') }}</p>
    </div>

    <!-- 知识库列表 -->
    <div v-else class="space-y-2">
      <button
        v-for="kb in knowledgeBases"
        :key="kb.id"
        type="button"
        class="flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.98] min-h-[44px]"
        :class="[
          selectedIds.has(kb.id)
            ? 'border-primary/40 bg-primary/5'
            : 'border-border bg-card hover:border-border/80 hover:bg-accent/30',
        ]"
        @click="toggle(kb.id)"
      >
        <!-- Checkbox -->
        <div
          class="flex size-4.5 shrink-0 items-center justify-center rounded border transition-colors duration-150"
          :class="[
            selectedIds.has(kb.id)
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/30 bg-background',
          ]"
        >
          <Check
            v-if="selectedIds.has(kb.id)"
            :size="12"
            class="text-primary-foreground"
          />
        </div>

        <!-- 图标 -->
        <BookOpen
          :size="18"
          class="shrink-0"
          :class="[
            selectedIds.has(kb.id)
              ? 'text-primary'
              : 'text-muted-foreground',
          ]"
        />

        <!-- 内容 -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground truncate">
            {{ kb.name }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ t('avatar.tech.docCount', { n: kb.documentCount ?? 0 }) }}
          </p>
        </div>
      </button>
    </div>

    <!-- 稍后添加 -->
    <button
      type="button"
      class="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-95 py-2 min-h-[44px]"
      @click="skipSelection"
    >
      {{ t('avatar.tech.skipSelection') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue"
import { Check, BookOpen, Loader2 } from "lucide-vue-next"
import gsap from "gsap"
import { useReducedMotion } from "@/composables/useReducedMotion"
import { useI18n } from 'vue-i18n'
import { listKnowledgeBases, type KnowledgeBase } from "@/api/knowledgeBaseAPI"

const emit = defineEmits<{
  "update:data": [data: { knowledgeBaseIds: string[] }]
}>()

const { t } = useI18n()
const { prefersReduced } = useReducedMotion()
const rootRef = ref<HTMLElement>()

const knowledgeBases = ref<KnowledgeBase[]>([])
const isLoading = ref(false)
const loadError = ref(false)

const selectedIds = reactive(new Set<string>())

function toggle(id: string) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id)
  } else {
    selectedIds.add(id)
  }
  emit("update:data", { knowledgeBaseIds: [...selectedIds] })
}

function skipSelection() {
  selectedIds.clear()
  emit("update:data", { knowledgeBaseIds: [] })
}

// --- 加载知识库 ---
async function loadKnowledgeBases() {
  if (isLoading.value) return
  isLoading.value = true
  loadError.value = false
  try {
    const res = await listKnowledgeBases()
    if (res.data) {
      knowledgeBases.value = res.data
    }
  } catch {
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}

// --- GSAP ---
onMounted(() => {
  loadKnowledgeBases()
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
  /* Tech knowledge base list uses semantic Tailwind tokens (border-primary/40, bg-primary/5,
     border-border, bg-card, etc.) which adapt via CSS variables. No additional dark overrides needed. */
}
</style>
