<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chatStore'
import StatusBall from './StatusBall.vue'
import PlanSidebar from './PlanSidebar.vue'

const { t } = useI18n()
const chat = useChatStore()

// 当前小部件模式
const widgetMode = computed(() => chat.getPlanWidgetMode())

// 处理打开 Artifact Panel（通过全局 store）
const handleOpenArtifactPanel = () => {
  chat.openArtifactPanel(t('plan.widget.artifactTitle'), 'document')
}

</script>

<template>
  <div class="plan-widget-container">
    <!-- 状态球模式 -->
    <StatusBall 
      v-if="widgetMode === 'ball'" 
      @open-artifact-panel="handleOpenArtifactPanel"
    />
    <!-- 完整侧边栏模式 -->
    <PlanSidebar v-if="widgetMode === 'sidebar'" />
  </div>
</template>

<style scoped>
.plan-widget-container {
  position: fixed;
  pointer-events: none;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
</style>
