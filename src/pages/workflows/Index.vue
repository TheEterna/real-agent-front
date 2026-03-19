<template>
  <div class="workflows-page flex flex-col items-center justify-center min-h-[60vh] py-16 text-center">
    <div class="workflows-icon mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
      <Workflow class="h-10 w-10 text-muted-foreground" />
    </div>
    <h2 class="text-xl font-semibold text-foreground mb-2">{{ t('workflowsPage.title') }}</h2>
    <p class="text-muted-foreground text-sm max-w-md mb-8">
      {{ t('workflowsPage.description') }}
    </p>
    <button
      disabled
      class="inline-flex items-center gap-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 px-5 py-2.5 text-sm font-medium text-primary-500 cursor-not-allowed opacity-60"
    >
      <Plus class="h-4 w-4" />
      {{ t('workflowsPage.createBtn') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Workflow, Plus } from 'lucide-vue-next'

const { t } = useI18n()
</script>

<style lang="scss">
.dark {
  .workflows-icon {
    background: rgba(255, 255, 255, 0.04);
  }
}
</style>
