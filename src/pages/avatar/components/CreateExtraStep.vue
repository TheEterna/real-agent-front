<!-- ================================================
  CreateExtraStep — 模版额外步骤调度器
  职责：根据 templateId 条件渲染对应子组件，
       模版切换时 GSAP fade 过渡，
       汇聚子组件数据 → emit update:modelValue
================================================ -->
<template>
  <div v-if="templateId" ref="containerRef">
    <CreateExtraCloneSelfV2
      v-if="templateId === 'clone-self'"
      :portrait="portrait"
      :is-loading-portrait="isLoadingPortrait"
      @update:data="handleChildData"
    />
    <CreateExtraHumor
      v-else-if="templateId === 'humor'"
      @update:data="handleChildData"
    />
    <CreateExtraTech
      v-else-if="templateId === 'tech'"
      @update:data="handleChildData"
    />
    <CreateExtraLiterary
      v-else-if="templateId === 'literary'"
      @update:data="handleChildData"
    />
    <CreateExtraSocial
      v-else-if="templateId === 'social'"
      @update:data="handleChildData"
    />
    <CreateExtraCustom
      v-else-if="templateId === 'custom'"
      @update:data="handleChildData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue"
import gsap from "gsap"
import { useReducedMotion } from "@/composables/useReducedMotion"
import type { UserPortrait } from "../types"
import CreateExtraCloneSelfV2 from "./CreateExtraCloneSelfV2.vue"
import CreateExtraHumor from "./CreateExtraHumor.vue"
import CreateExtraTech from "./CreateExtraTech.vue"
import CreateExtraLiterary from "./CreateExtraLiterary.vue"
import CreateExtraSocial from "./CreateExtraSocial.vue"
import CreateExtraCustom from "./CreateExtraCustom.vue"

const props = defineProps<{
  templateId: string | null
  portrait: UserPortrait | null
  isLoadingPortrait: boolean
}>()

const modelValue = defineModel<Record<string, unknown>>({ default: () => ({}) })

const { prefersReduced } = useReducedMotion()
const containerRef = ref<HTMLElement>()

// --- 模版切换 GSAP fade 过渡 ---
watch(
  () => props.templateId,
  async (newId, oldId) => {
    if (!containerRef.value || newId === oldId) return

    if (prefersReduced.value) {
      // 降级：无动画直接切换
      return
    }

    // 1. 旧内容 fade out
    await gsap.to(containerRef.value, {
      opacity: 0,
      duration: 0.1,
      ease: "power2.in",
    })

    // 等待 Vue DOM 更新
    await nextTick()

    // 2. 新内容 fade in
    if (containerRef.value) {
      gsap.fromTo(
        containerRef.value,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: "power2.out" }
      )
    }
  }
)

// --- 汇聚子组件数据 ---
function handleChildData(data: unknown) {
  const obj = data as Record<string, unknown>
  modelValue.value = { ...modelValue.value, ...obj }
}

// --- GSAP 清理 ---
onUnmounted(() => {
  if (containerRef.value) gsap.killTweensOf(containerRef.value)
})
</script>
