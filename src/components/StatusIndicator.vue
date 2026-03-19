<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  status: 'idle' | 'running' | 'completed' | 'error'
}>()

const getStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    running: 'icon-running',
    completed: 'icon-completed',
    error: 'icon-error',
    idle: ''
  }
  return iconMap[status] || ''
}

const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    running: t('compTool.statusIndicator.running'),
    completed: t('compTool.statusIndicator.completed'),
    error: t('compTool.statusIndicator.error'),
    idle: t('compTool.statusIndicator.idle')
  }
  return textMap[status] || ''
}
</script>

<template>
  <div v-if="props.status !== 'idle'" class="status-indicator" role="status" :aria-label="getStatusText(props.status)">
    <div :class="['status-badge', props.status]">
      <i :class="getStatusIcon(props.status)" aria-hidden="true"></i>
      <span>{{ getStatusText(props.status) }}</span>
      <div v-if="props.status === 'running'" class="status-spinner" aria-hidden="true"></div>
    </div>
    <span class="sr-only">{{ getStatusText(props.status) }}</span>
  </div>
</template>

<style scoped>
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0; }
.status-indicator { position: sticky; top: 0; z-index: 10; margin-bottom: 1rem; display: flex; justify-content: center; }
.status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.1); backdrop-filter: blur(10px); }
.status-badge.running { background: color-mix(in srgb, var(--color-primary-500) 10%, transparent); color: var(--color-primary-500); border: 1px solid color-mix(in srgb, var(--color-primary-500) 30%, transparent); }
.status-badge.completed { background: color-mix(in srgb, var(--color-teal-400) 10%, transparent); color: var(--color-teal-400); border: 1px solid color-mix(in srgb, var(--color-teal-400) 30%, transparent); }
.status-badge.error { background: color-mix(in srgb, var(--color-red-500) 10%, transparent); color: var(--color-red-600); border: 1px solid color-mix(in srgb, var(--color-red-500) 30%, transparent); }
.status-spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
.icon-running::before { content: '🔄'; }
.icon-completed::before { content: '✅'; }
.icon-error::before { content: '❌'; }
</style>
