<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { UIMessage } from '@/types/events.js'

const { t } = useI18n()

const props = defineProps<{
  message: UIMessage
}>()

// 控制展开/收起状态
const showArguments = ref(false)
const showResponse = ref(false)

// 提取工具名称
const toolName = computed(() => {
  const data = props.message.data as any
  return data?.name || props.message.message || t('compTool.toolBox.defaultName')
})

// 提取工具调用ID
const toolCallId = computed(() => {
  const data = props.message.data as any
  return data?.id || ''
})

// 解析入参
const argumentsData = computed(() => {
  try {
    const meta = props.message.meta as any
    if (!meta?.arguments) return null
    
    if (typeof meta.arguments === 'string') {
      const trimmed = meta.arguments.trim()
      if (!trimmed) return null
      return JSON.parse(trimmed)
    }
    return meta.arguments
  } catch (e) {
    console.warn('Failed to parse arguments:', e)
    // 返回原始字符串以便展示
    const meta = props.message.meta as any
    return meta?.arguments || null
  }
})

// 计算入参数量
const argumentsCount = computed(() => {
  if (!argumentsData.value) return 0
  if (typeof argumentsData.value === 'object' && argumentsData.value !== null) {
    return Object.keys(argumentsData.value).length
  }
  return 0
})

// 解析响应数据
const responseData = computed(() => {
  try {
    const data = props.message.data as any
    if (!data?.responseData) return null
    
    let response = data.responseData
    
    // 如果是字符串，尝试解析
    if (typeof response === 'string') {
      const trimmed = response.trim()
      if (!trimmed) return null
      response = JSON.parse(trimmed)
    }
    
    // 如果是数组，提取第一个元素
    if (Array.isArray(response) && response.length > 0) {
      const firstItem = response[0]
      // 如果第一个元素有 text 属性，尝试解析它
      if (firstItem.text && typeof firstItem.text === 'string') {
        try {
          return JSON.parse(firstItem.text)
        } catch {
          return firstItem
        }
      }
      return firstItem
    }
    
    return response
  } catch (e) {
    console.warn('Failed to parse response:', e)
    // 返回原始数据
    const data = props.message.data as any
    return data?.responseData || null
  }
})

// 检查是否有可展示的内容
const hasContent = computed(() => {
  return !!argumentsData.value || !!responseData.value
})

// 格式化 JSON
const formatJSON = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

// 工具图标映射
const getToolIcon = (name: string): string => {
  const iconMap: Record<string, string> = {
    'map_geocode': '📍',
    'map_directions': '🗺️',
    'map_search': '🔍',
    'map_weather': '🌤️',
    'map_ip_location': '🌐',
    'default': '🛠️'
  }
  return iconMap[name] || iconMap.default
}
</script>

<template>
  <div class="tool-box-container">
    <!-- 工具调用卡片 -->
    <div class="tool-card" role="region" :aria-label="t('compTool.toolBox.ariaLabel', { name: toolName })">
      <!-- 工具头部 -->
      <div class="tool-header">
        <div class="tool-info">
          <span class="tool-icon">{{ getToolIcon(toolName) }}</span>
          <div class="tool-meta">
            <span class="tool-name">{{ toolName }}</span>
            <span v-if="toolCallId" class="tool-id">{{ toolCallId }}</span>
          </div>
        </div>
      </div>

      <!-- 入参区域 -->
      <div v-if="argumentsData" class="tool-section">
        <button class="section-toggle" :aria-expanded="showArguments" :aria-label="t('compTool.toolBox.toggleArgs')" @click="showArguments = !showArguments">
          <span class="toggle-icon" :class="{ expanded: showArguments }">▶</span>
          <span class="section-title">{{ t('compTool.toolBox.arguments') }}</span>
          <span v-if="argumentsCount > 0" class="param-count">{{ t('compTool.toolBox.itemCount', { count: argumentsCount }) }}</span>
        </button>
        <div v-show="showArguments" class="section-content">
          <pre class="json-display"><code>{{ formatJSON(argumentsData) }}</code></pre>
        </div>
      </div>

      <!-- 响应数据区域 -->
      <div v-if="responseData" class="tool-section">
        <button class="section-toggle" :aria-expanded="showResponse" :aria-label="t('compTool.toolBox.toggleResponse')" @click="showResponse = !showResponse">
          <span class="toggle-icon" :class="{ expanded: showResponse }">▶</span>
          <span class="section-title">{{ t('compTool.toolBox.responseData') }}</span>
        </button>
        <div v-show="showResponse" class="section-content">
          <pre class="json-display"><code>{{ formatJSON(responseData) }}</code></pre>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div v-if="!hasContent" class="empty-state">
        <span class="empty-icon">📭</span>
        <span class="empty-text">{{ t('compTool.toolBox.noData') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

.tool-box-container {
  width: 100%;
}

.tool-card {
  background: linear-gradient(135deg, var(--color-blue-50, #f8fbff) 0%, var(--color-blue-50, #f0f7ff) 100%);
  border: 1px solid var(--color-blue-200, #d1e7ff);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(66, 165, 245, 0.08);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(66, 165, 245, 0.12);
  }
}

.tool-header {
  background: linear-gradient(135deg, var(--color-blue-100, #e3f2fd) 0%, var(--color-blue-200, #bbdefb) 100%);
  border-bottom: 1px solid var(--color-blue-200, #d1e7ff);
  padding: 12px 16px;
}

.tool-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.tool-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; // 允许文本截断
}

.tool-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-blue-700, #1565c0);
  word-break: break-word;
}

.tool-id {
  font-size: 0.75rem;
  color: var(--color-blue-300, #64b5f6);
  font-family: var(--font-mono);
  word-break: break-all;
}

.tool-section {
  border-bottom: 1px solid var(--color-blue-100, #e3f2fd);

  &:last-child {
    border-bottom: none;
  }
}

.section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;

  &:hover {
    background: rgba(66, 165, 245, 0.04);
  }

  &:active {
    background: rgba(66, 165, 245, 0.08);
  }
}

.toggle-icon {
  font-size: 0.75rem;
  color: var(--color-blue-400, #42a5f5);
  transition: transform 0.2s ease;
  flex-shrink: 0;

  &.expanded {
    transform: rotate(90deg);
  }
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-blue-600, #1976d2);
  flex-shrink: 0;
}

.param-count {
  font-size: 0.75rem;
  color: var(--color-blue-300, #64b5f6);
  margin-left: auto;
}

.section-content {
  padding: 0 16px 12px;
  animation: slideDown 0.2s ease-out;
}

.json-display {
  margin: 0;
  padding: 12px;
  background: var(--color-slate-900, #0f172a);
  color: var(--color-slate-200, #e2e8f0);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6;
  overflow-x: auto;
  max-width: 100%;
  word-break: break-word;
  white-space: pre-wrap;
  @include pretty-scrollbar;

  code {
    color: inherit;
    background: transparent;
    padding: 0;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 16px;
  color: var(--color-blue-200, #90caf9);
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.6;
}

.empty-text {
  font-size: 0.8125rem;
  color: var(--color-blue-300, #64b5f6);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style lang="scss">
.dark {
  .tool-card {
    background: linear-gradient(135deg, #1a2332 0%, #1e293b 100%);
    border-color: #2a3a4e;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
    }
  }

  .tool-header {
    background: linear-gradient(135deg, #1e3a5f 0%, #1e3050 100%);
    border-bottom-color: #2a3a4e;
  }

  .tool-name {
    color: #93c5fd;
  }

  .tool-id {
    color: #60a5fa;
  }

  .tool-section {
    border-bottom-color: #1e293b;
  }

  .section-toggle {
    &:hover {
      background: rgba(96, 165, 250, 0.08);
    }

    &:active {
      background: rgba(96, 165, 250, 0.14);
    }
  }

  .toggle-icon {
    color: #60a5fa;
  }

  .section-title {
    color: #93c5fd;
  }

  .param-count {
    color: #60a5fa;
  }

  .json-display {
    background: #0c1222;
    color: #e2e8f0;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .empty-state {
    color: #475569;
  }

  .empty-text {
    color: #64748b;
  }
}
</style>
