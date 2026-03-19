<!-- ================================================
  PersonalityPresets — 人设预设模板选择器
  职责：提供 4 个预设人设模板，点击填充表单
================================================ -->
<template>
  <div class="flex flex-wrap gap-2 pb-1">
    <button
      v-for="preset in presets"
      :key="preset.name"
      class="shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 active:scale-95 min-h-[44px] flex items-center shadow-sm"
      :class="[
        selectedName === preset.name
          ? 'bg-primary text-primary-foreground border-primary shadow-primary/10'
          : 'bg-card text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground hover:bg-primary/5',
      ]"
      @click="handleSelect(preset)"
    >
      {{ preset.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from 'vue-i18n'
import type { PersonalityPresetData } from "../types"

const emit = defineEmits<{ select: [preset: PersonalityPresetData] }>()

const { t } = useI18n()
const selectedName = ref("")

const presets: PersonalityPresetData[] = [
  {
    name: t('avatar.presets.humorName'),
    tone: t('avatar.presets.humorTone'),
    interests: ["脱口秀", "热梗", "搞笑视频", "日常吐槽"],
    expertise: ["段子创作", "评论互动"],
  },
  {
    name: t('avatar.presets.techName'),
    tone: t('avatar.presets.techTone'),
    interests: ["AI", "编程", "数码产品", "开源项目"],
    expertise: ["技术评测", "行业分析", "教程创作"],
  },
  {
    name: t('avatar.presets.literaryName'),
    tone: t('avatar.presets.literaryTone'),
    interests: ["阅读", "摄影", "咖啡", "旅行", "电影"],
    expertise: ["文案写作", "书评影评", "生活美学"],
  },
  {
    name: t('avatar.presets.socialName'),
    tone: t('avatar.presets.socialTone'),
    interests: ["社交", "美食", "时尚", "热点话题"],
    expertise: ["话题引导", "粉丝互动", "社区运营"],
  },
]

function handleSelect(preset: PersonalityPresetData) {
  selectedName.value = preset.name
  emit("select", preset)
}
</script>

<!-- Dark mode: independent non-scoped block -->
<style lang="scss">
.dark {
  .flex.flex-wrap.gap-2 button.bg-card {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: none;

    &:hover {
      border-color: rgba(255, 255, 255, 0.15);
      color: rgba(224, 231, 235, 0.9);
      background: rgba(255, 255, 255, 0.06);
    }
  }
}
</style>
