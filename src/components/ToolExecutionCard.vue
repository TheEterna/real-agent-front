<script setup lang="ts">
import { computed, ref } from 'vue'
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const CodeBlock = defineAsyncComponent(() => import('./CodeBlock.vue'))

interface ToolExecutionData {
  toolCallId?: string
  toolName: string
  status: 'pending' | 'executing' | 'success' | 'error'
  args: Record<string, any>
  result?: any
  executionTime?: number
  error?: string
  startTime?: Date
}

interface Props {
  data: ToolExecutionData
  collapsible?: boolean  // 是否可折叠，默认 true
  defaultOpen?: boolean  // 默认是否展开，默认根据状态决定
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: true,
  defaultOpen: undefined
})

// 控制折叠状态
const isArgsOpen = ref(props.defaultOpen ?? (props.data.status === 'error'))
const isResultOpen = ref(props.defaultOpen ?? (props.data.status === 'success'))

// 状态图标
const statusIcon = computed(() => {
  switch (props.data.status) {
    case 'pending':
      return '⏳'
    case 'executing':
      return '⚙️'
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    default:
      return '❓'
  }
})

// 状态文本
const statusText = computed(() => {
  switch (props.data.status) {
    case 'pending':
      return t('compTool.execution.statusPending')
    case 'executing':
      return t('compTool.execution.statusExecuting')
    case 'success':
      return t('compTool.execution.statusSuccess')
    case 'error':
      return t('compTool.execution.statusError')
    default:
      return t('compTool.execution.statusUnknown')
  }
})

// 状态颜色类
const statusColorClass = computed(() => {
  return `status-${props.data.status}`
})

// 格式化时间
const formatTime = (ms?: number) => {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// 格式化 JSON
const formatJson = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

// 切换折叠状态
const toggleArgs = () => {
  if (props.collapsible) {
    isArgsOpen.value = !isArgsOpen.value
  }
}

const toggleResult = () => {
  if (props.collapsible) {
    isResultOpen.value = !isResultOpen.value
  }
}
</script>

<template>
  <div class="tool-execution-card" :class="statusColorClass">
    <!-- 工具头部 -->
    <div class="tool-header">
      <div class="tool-info">
        <span class="status-icon">{{ statusIcon }}</span>
        <span class="tool-name">{{ data.toolName }}</span>
        <span class="status-badge" :class="statusColorClass">
          {{ statusText }}
        </span>
      </div>

      <div class="tool-meta">
        <!-- 执行时间 -->
        <span v-if="data.executionTime" class="execution-time">
          <span class="icon">⏱️</span>
          {{ formatTime(data.executionTime) }}
        </span>

        <!-- 时间戳 -->
        <span v-if="data.startTime" class="startTime">
          {{ new Date(data.startTime).toLocaleTimeString('zh-CN') }}
        </span>
      </div>
    </div>

    <!-- 工具参数 -->
    <div class="tool-section">
      <div
        class="section-header"
        :class="{ clickable: collapsible }"
        @click="toggleArgs"
      >
        <span class="section-title">
          <span v-if="collapsible" class="collapse-icon">
            {{ isArgsOpen ? '▼' : '▶' }}
          </span>
          {{ t('compTool.execution.arguments') }}
        </span>
        <span class="section-count">{{ t('compTool.execution.itemCount', { count: Object.keys(data.args).length }) }}</span>
      </div>

      <div v-show="isArgsOpen" class="section-content">
        <CodeBlock
          v-if="Object.keys(data.args).length > 0"
          :code="formatJson(data.args)"
          language="json"
          :show-line-numbers="false"
        />
        <div v-else class="empty-content">{{ t('compTool.execution.noArgs') }}</div>
      </div>
    </div>

    <!-- 工具结果 -->
    <div v-if="data.result || data.status === 'success'" class="tool-section">
      <div
        class="section-header"
        :class="{ clickable: collapsible }"
        @click="toggleResult"
      >
        <span class="section-title">
          <span v-if="collapsible" class="collapse-icon">
            {{ isResultOpen ? '▼' : '▶' }}
          </span>
          {{ t('compTool.execution.result') }}
        </span>
      </div>

      <div v-show="isResultOpen" class="section-content">
        <!-- 字符串结果 -->
        <div v-if="typeof data.result === 'string'" class="text-result">
          {{ data.result }}
        </div>

        <!-- 对象结果 -->
        <CodeBlock
          v-else-if="data.result"
          :code="formatJson(data.result)"
          language="json"
          :show-line-numbers="false"
        />

        <div v-else class="empty-content">{{ t('compTool.execution.noResult') }}</div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="data.error" class="tool-section error-section">
      <div class="section-header">
        <span class="section-title">
          <span class="error-icon">⚠️</span>
          {{ t('compTool.execution.errorInfo') }}
        </span>
      </div>
      <div class="section-content">
        <div class="error-message">{{ data.error }}</div>
      </div>
    </div>

    <!-- 执行中的加载动画 -->
    <div v-if="data.status === 'executing'" class="executing-indicator">
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tool-execution-card {
  border: 1px solid var(--border-color, #e8e8e8);
  border-radius: 8px;
  padding: 12px 16px;
  margin: 8px 0;
  background: var(--card-bg, #ffffff);
  transition: all 0.3s ease;

  &.status-pending {
    border-left: 4px solid #f97316;
  }

  &.status-executing {
    border-left: 4px solid #3b82f6;
    background: linear-gradient(90deg, rgba(24, 144, 255, 0.05) 0%, transparent 100%);
  }

  &.status-success {
    border-left: 4px solid #16a34a;
  }

  &.status-error {
    border-left: 4px solid #ef4444;
    background: rgba(255, 77, 79, 0.03);
  }
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
}

.tool-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.status-icon {
  font-size: 1.125rem;
}

.tool-name {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color, #333);
}

.status-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;

  &.status-pending {
    background: #fff7ed;
    color: #f97316;
  }

  &.status-executing {
    background: #eff6ff;
    color: #3b82f6;
  }

  &.status-success {
    background: #f0fdf4;
    color: #16a34a;
  }

  &.status-error {
    background: #fef2f2;
    color: #ef4444;
  }
}

.tool-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--text-secondary, #8c8c8c);
}

.execution-time {
  display: flex;
  align-items: center;
  gap: 4px;

  .icon {
    font-size: 0.875rem;
  }
}

.tool-section {
  margin-top: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  user-select: none;

  &.clickable {
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      padding-left: 4px;
      padding-right: 4px;
    }
  }
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-color, #595959);
  display: flex;
  align-items: center;
  gap: 6px;
}

.collapse-icon {
  display: inline-block;
  font-size: 0.625rem;
  color: var(--text-secondary, #8c8c8c);
  transition: transform 0.2s ease;
}

.section-count {
  font-size: 0.75rem;
  color: var(--text-secondary, #8c8c8c);
}

.section-content {
  margin-top: 8px;
  padding-left: 16px;
}

.text-result {
  padding: 8px 12px;
  background: var(--code-bg, #f5f5f5);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-content {
  padding: 8px 12px;
  color: var(--text-secondary, #8c8c8c);
  font-size: 0.8125rem;
  font-style: italic;
}

.error-section {
  .error-message {
    padding: 8px 12px;
    background: #fef2f2;
    border-left: 3px solid #ef4444;
    border-radius: 4px;
    color: #b91c1c;
    font-size: 0.8125rem;
    line-height: 1.6;
  }
}

.executing-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color, #d9d9d9);
}

.loading-dots {
  display: flex;
  gap: 6px;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #3b82f6;
    animation: bounce 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  /* ── Card base & status borders (brighter/more saturated in dark) ── */
  .tool-execution-card {
    background: #1a2332;
    border-color: #2d3748;

    &.status-pending {
      border-left-color: #fb923c;
    }

    &.status-executing {
      border-left-color: #60a5fa;
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%);
    }

    &.status-success {
      border-left-color: #22c55e;
    }

    &.status-error {
      border-left-color: #f87171;
      background: rgba(239, 68, 68, 0.06);
    }
  }

  /* ── Header border ── */
  .tool-header {
    border-bottom-color: #2d3748;
  }

  /* ── Tool name text ── */
  .tool-name {
    color: #e0e7eb;
  }

  /* ── Status badges (dark bg + brighter text) ── */
  .status-badge {
    &.status-pending {
      background: rgba(251, 146, 60, 0.15);
      color: #fb923c;
    }

    &.status-executing {
      background: rgba(96, 165, 250, 0.15);
      color: #60a5fa;
    }

    &.status-success {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    &.status-error {
      background: rgba(248, 113, 113, 0.15);
      color: #f87171;
    }
  }

  /* ── Meta text ── */
  .tool-meta {
    color: #6b7b8d;
  }

  /* ── Section header hover ── */
  .section-header {
    &.clickable:hover {
      background: rgba(255, 255, 255, 0.04);
    }
  }

  /* ── Section title text ── */
  .section-title {
    color: #b0bec5;
  }

  /* ── Collapse icon & section count ── */
  .collapse-icon,
  .section-count {
    color: #6b7b8d;
  }

  /* ── Text result block ── */
  .text-result {
    background: #141c28;
    color: #c8d6e0;
  }

  /* ── Empty content ── */
  .empty-content {
    color: #6b7b8d;
  }

  /* ── Error section ── */
  .error-section {
    .error-message {
      background: rgba(239, 68, 68, 0.1);
      border-left-color: #f87171;
      color: #fca5a5;
    }
  }

  /* ── Executing indicator ── */
  .executing-indicator {
    border-top-color: #2d3748;
  }

  /* ── Loading dots (brighter blue in dark) ── */
  .loading-dots span {
    background: #60a5fa;
  }
}
</style>
