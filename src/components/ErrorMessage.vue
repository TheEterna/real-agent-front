<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { UIMessage } from '@/types/events'

interface Props {
  message: UIMessage
  collapsible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: true
})

const { t } = useI18n()
const isExpanded = ref(false)

// 从错误消息中提取错误类型
const errorType = computed(() => {
  const msg = props.message.message || ''

  if (msg.includes('超时') || msg.includes('timeout') || msg.includes('timed out')) {
    return {
      type: 'timeout',
      icon: '⏱️',
      title: t('compTool.errorMsg.timeout'),
      severity: 'warning'
    }
  }
  else if (msg.includes('rate limit') || msg.includes('频率限制') || msg.includes('quota')) {
    return {
      type: 'rate_limit',
      icon: '🚦',
      title: t('compTool.errorMsg.rateLimit'),
      severity: 'warning'
    }
  }
  else if (msg.includes('authentication') || msg.includes('认证失败') || msg.includes('unauthorized')) {
    return {
      type: 'auth',
      icon: '🔑',
      title: t('compTool.errorMsg.authFailed'),
      severity: 'error'
    }
  }
  else if (msg.includes('connection') || msg.includes('连接失败') || msg.includes('connect')) {
    return {
      type: 'network',
      icon: '📡',
      title: t('compTool.errorMsg.networkFailed'),
      severity: 'error'
    }
  }
  else if (msg.includes('工具') || msg.includes('tool')) {
    return {
      type: 'tool',
      icon: '🔧',
      title: t('compTool.errorMsg.toolError'),
      severity: 'error'
    }
  }
  else if (msg.includes('LLM')) {
    return {
      type: 'llm',
      icon: '🤖',
      title: t('compTool.errorMsg.llmError'),
      severity: 'error'
    }
  }
  else {
    return {
      type: 'unknown',
      icon: '❌',
      title: t('compTool.errorMsg.unknownError'),
      severity: 'error'
    }
  }
})

// 生成建议操作
const suggestions = computed(() => {
  const type = errorType.value.type
  const suggestions: string[] = []

  switch (type) {
    case 'timeout':
      suggestions.push(t('compTool.errorMsg.timeoutSug1'))
      suggestions.push(t('compTool.errorMsg.timeoutSug2'))
      suggestions.push(t('compTool.errorMsg.timeoutSug3'))
      break
    case 'rate_limit':
      suggestions.push(t('compTool.errorMsg.rateLimitSug1'))
      suggestions.push(t('compTool.errorMsg.rateLimitSug2'))
      suggestions.push(t('compTool.errorMsg.rateLimitSug3'))
      break
    case 'auth':
      suggestions.push(t('compTool.errorMsg.authSug1'))
      suggestions.push(t('compTool.errorMsg.authSug2'))
      suggestions.push(t('compTool.errorMsg.authSug3'))
      break
    case 'network':
      suggestions.push(t('compTool.errorMsg.networkSug1'))
      suggestions.push(t('compTool.errorMsg.networkSug2'))
      suggestions.push(t('compTool.errorMsg.networkSug3'))
      break
    case 'tool':
      suggestions.push(t('compTool.errorMsg.toolSug1'))
      suggestions.push(t('compTool.errorMsg.toolSug2'))
      suggestions.push(t('compTool.errorMsg.toolSug3'))
      break
    case 'llm':
      suggestions.push(t('compTool.errorMsg.llmSug1'))
      suggestions.push(t('compTool.errorMsg.llmSug2'))
      suggestions.push(t('compTool.errorMsg.llmSug3'))
      break
    default:
      suggestions.push(t('compTool.errorMsg.defaultSug1'))
      suggestions.push(t('compTool.errorMsg.defaultSug2'))
      suggestions.push(t('compTool.errorMsg.defaultSug3'))
  }

  return suggestions
})

const toggleExpand = () => {
  if (props.collapsible) {
    isExpanded.value = !isExpanded.value
  }
}

// 格式化时间
const formatTime = (ts?: Date | string) => {
  if (!ts) return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div :class="['error-message', `error-${errorType.severity}`]">
    <div class="error-header" role="button" tabindex="0" @click="toggleExpand" @keydown.enter="toggleExpand" @keydown.space.prevent="toggleExpand">
      <div class="error-title-row">
        <span class="error-icon">{{ errorType.icon }}</span>
        <span class="error-title">{{ errorType.title }}</span>
        <span v-if="collapsible" class="expand-icon">
          {{ isExpanded ? '▼' : '▶' }}
        </span>
      </div>
      <span class="error-startTime">{{ formatTime(message.startTime) }}</span>
    </div>

    <div class="error-body">
      <!-- 错误消息摘要 -->
      <div class="error-summary">
        <p class="error-text">{{ message.message }}</p>
      </div>

      <!-- 展开的详细信息 -->
      <div v-if="isExpanded || !collapsible" class="error-details">
        <!-- 建议操作 -->
        <div v-if="suggestions.length > 0" class="error-suggestions">
          <h4 class="suggestions-title">{{ t('compTool.errorMsg.suggestionsTitle') }}</h4>
          <ul class="suggestions-list">
            <li v-for="(suggestion, index) in suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <!-- 技术详情（如果有） -->
        <div v-if="message.data" class="error-technical">
          <h4 class="technical-title">{{ t('compTool.errorMsg.technicalTitle') }}</h4>
          <pre class="technical-data">{{ JSON.stringify(message.data, null, 2) }}</pre>
        </div>

        <!-- Agent 信息 -->
        <div v-if="message.sender" class="error-meta">
          <span class="meta-label">{{ t('compTool.errorMsg.sourceLabel') }}</span>
          <span class="meta-value">{{ message.sender }}</span>
          <span v-if="message.messageId" class="meta-label">{{ t('compTool.errorMsg.nodeIdLabel') }}</span>
          <span v-if="message.messageId" class="meta-value">{{ message.messageId }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-message {
  margin-bottom: 1rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.error-warning {
  background: linear-gradient(135deg, var(--color-amber-50, #fff8e1) 0%, var(--color-amber-100, #ffecb3) 100%);
  border: 2px solid var(--color-amber-500, #ffb300);
}

.error-error {
  background: linear-gradient(135deg, var(--color-red-50, #ffebee) 0%, var(--color-red-100, #ffcdd2) 100%);
  border: 2px solid var(--destructive, #f44336);
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
}

.error-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.error-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.error-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-red-700, #d32f2f);

  .error-warning & {
    color: var(--color-orange-600, #f57c00);
  }
}

.expand-icon {
  font-size: 0.75rem;
  color: var(--muted-foreground);
  transition: transform 0.3s ease;
  margin-left: auto;
}

.error-startTime {
  font-size: 0.85rem;
  color: var(--muted-foreground);
  margin-left: 1rem;
}

.error-body {
  padding: 0 1.25rem 1.25rem;
}

.error-summary {
  margin-bottom: 1rem;
}

.error-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-red-800, #c62828);
  margin: 0;
  word-break: break-word;

  .error-warning & {
    color: var(--color-orange-800, #e65100);
  }
}

.error-details {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 1rem;
  animation: slideDown 0.3s ease;
}

.error-suggestions {
  margin-bottom: 1rem;
}

.suggestions-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-blue-600, #1976d2);
  margin: 0 0 0.5rem 0;
}

.suggestions-list {
  margin: 0;
  padding-left: 1.5rem;

  li {
    font-size: 0.9rem;
    line-height: 1.8;
    color: var(--color-slate-700, #424242);

    &::marker {
      color: var(--color-blue-600, #1976d2);
    }
  }
}

.error-technical {
  margin-bottom: 1rem;
}

.technical-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-purple-700, #6a1b9a);
  margin: 0 0 0.5rem 0;
}

.technical-data {
  background: var(--color-slate-900, #0f172a);
  color: var(--color-slate-200, #e2e8f0);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
  overflow-x: auto;
  margin: 0;
  font-family: var(--font-mono);
}

.error-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.85rem;
  color: var(--muted-foreground);
}

.meta-label {
  font-weight: 600;
  color: var(--color-slate-700, #424242);
}

.meta-value {
  color: var(--muted-foreground);
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}
</style>

<style lang="scss">
/* Dark mode overrides for ErrorMessage */
.dark {
  .error-message {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
  }

  .error-warning {
    background: linear-gradient(135deg, #2d2a1b 0%, #33291a 100%);
    border-color: #b37a00;
  }

  .error-error {
    background: linear-gradient(135deg, #2d1b1b 0%, #331e1e 100%);
    border-color: #d32f2f;
  }

  .error-header {
    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }
  }

  .error-title {
    color: #ef5350;

    .error-warning & {
      color: #ffb74d;
    }
  }

  .error-text {
    color: #ef9a9a;

    .error-warning & {
      color: #ffcc80;
    }
  }

  .error-details {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .suggestions-title {
    color: #64b5f6;
  }

  .suggestions-list {
    li {
      color: #a0aec0;

      &::marker {
        color: #64b5f6;
      }
    }
  }

  .technical-title {
    color: #ce93d8;
  }

  .technical-data {
    background: #0d1117;
    color: #e2e8f0;
  }

  .meta-label {
    color: #a0aec0;
  }
}
</style>
