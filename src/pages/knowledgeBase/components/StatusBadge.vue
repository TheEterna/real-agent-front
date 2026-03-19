<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

type ParseStatus = 'success' | 'parsing' | 'error' | 'pending'

interface Props {
  status?: ParseStatus
}

const props = defineProps<Props>()

const config = computed(() => {
  if (!props.status) return null
  const configs = {
    success: {
      color: 'kb-badge--success',
      icon: CheckCircle2,
      text: t('knowledge.status.indexed'),
      dotColor: 'bg-emerald-500 dark:bg-emerald-400'
    },
    parsing: {
      color: 'kb-badge--parsing',
      icon: Loader2,
      text: t('knowledge.status.parsing'),
      dotColor: 'bg-amber-500 dark:bg-amber-400'
    },
    error: {
      color: 'kb-badge--error',
      icon: AlertCircle,
      text: t('knowledge.status.failed'),
      dotColor: 'bg-rose-500 dark:bg-rose-400'
    },
    pending: {
      color: 'kb-badge--pending',
      icon: Clock,
      text: t('knowledge.status.pending'),
      dotColor: 'bg-slate-400 dark:bg-zinc-500'
    }
  }
  return configs[props.status]
})
</script>

<template>
  <span v-if="config" :class="['kb-badge', config.color]">
    <span :class="['kb-badge__dot', config.dotColor, status === 'parsing' ? 'animate-pulse' : '']"></span>
    {{ config.text }}
  </span>
</template>

<style scoped>
.kb-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition: all 200ms;
}

.kb-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.kb-badge--success {
  color: var(--color-emerald-700, #047857);
  background: var(--color-emerald-50, #ecfdf5);
  border: 1px solid var(--color-emerald-200, #a7f3d0);
}

.kb-badge--parsing {
  color: var(--color-amber-700, #b45309);
  background: var(--color-amber-50, #fffbeb);
  border: 1px solid var(--color-amber-200, #fde68a);
}

.kb-badge--error {
  color: var(--color-rose-700, #be123c);
  background: var(--color-rose-50, #fff1f2);
  border: 1px solid var(--color-rose-200, #fecdd3);
}

.kb-badge--pending {
  color: var(--color-slate-500, #64748b);
  background: var(--color-slate-50, #f8fafc);
  border: 1px solid var(--color-slate-200, #e2e8f0);
}
</style>

<style lang="scss">
.dark {
  .kb-badge--success {
    color: #6ee7b7;
    background: rgba(6, 78, 59, 0.3);
    border-color: rgba(6, 78, 59, 0.5);
  }
  .kb-badge--parsing {
    color: #fbbf24;
    background: rgba(120, 53, 15, 0.3);
    border-color: rgba(120, 53, 15, 0.5);
  }
  .kb-badge--error {
    color: #fb7185;
    background: rgba(136, 19, 55, 0.3);
    border-color: rgba(136, 19, 55, 0.5);
  }
  .kb-badge--pending {
    color: #a1a1aa;
    background: rgba(39, 39, 42, 0.8);
    border-color: rgba(63, 63, 70, 0.7);
  }
}
</style>
