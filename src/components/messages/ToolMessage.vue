<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tooltip as ATooltip } from 'ant-design-vue'
import { UIMessage, EventType } from '@/types/events.js'
import WebSearchToolMessage from './WebSearchToolMessage.vue'
import {
  CaretUpOutlined,
  EnvironmentOutlined,
  AimOutlined,
  SearchOutlined,
  CloudOutlined,
  GlobalOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'
import { getRandomGlassColor } from '@/utils/colorUtils'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  message: UIMessage
}>()

const emit = defineEmits(['show-details'])

// 控制响应数据展开/收起状态
const showResponse = ref(false)

// 提取工具名称
const toolName = computed(() => {
  const data = props.message.data as any
  return data?.name || props.message.message || t('messages.tool.toolCall')
})

const isWebSearch = computed(() => {
  const name = String(toolName.value || '').trim().toLowerCase()
  return name === 'web_search' || name === 'websearch' || name === 'web-search'
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

// 格式化入参为工具提示显示
const formatArgumentsForTooltip = computed(() => {
  if (!argumentsData.value) return t('messages.tool.noParams')
  try {
    return JSON.stringify(argumentsData.value, null, 2)
  } catch {
    return String(argumentsData.value)
  }
})

// 工具图标映射（Ant Design Icons）
const getToolIcon = (name: string) => {
  const iconMap: Record<string, any> = {
    'map_geocode': EnvironmentOutlined,
    'map_directions': AimOutlined,
    'map_search': SearchOutlined,
    'map_weather': CloudOutlined,
    'map_ip_location': GlobalOutlined,
    'default': ToolOutlined,
  }
  return iconMap[name] || iconMap.default
}

// 随机图标背景色
const iconBg = ref<string>(getRandomGlassColor())

// 提取并规范化耗时 (ms)
const elapsedMs = computed<number | null>(() => {
  try {
    const meta = (props.message.meta as any) ?? {}
    console.log('meta:', meta)
    const v = meta.elapsedMs
    console.log('elapsedMs:', v)
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v)
    if (typeof v === 'string') {
      const n = Number(v)
      return Number.isFinite(n) ? Math.round(n) : null
    }
    return null
  } catch {
    return null
  }
})

// 格式化响应数据
const formatResponseData = computed(() => {
  if (!responseData.value) return t('messages.tool.noResponse')
  try {
    // 如果响应数据是字符串，直接返回（保留换行符）
    if (typeof responseData.value === 'string') {
      return responseData.value
    }
    // 如果是对象，格式化为 JSON（保留换行符）
    return JSON.stringify(responseData.value, null, 2)
  } catch {
    // 如果解析失败，转为字符串并保留换行符
    const str = String(responseData.value)
    return str
  }
})

// 切换响应数据展开状态
const toggleResponse = () => {
  showResponse.value = !showResponse.value
}

/**
 * 递归提取 JSON 对象中所有值，用逗号拼接成字符串
 * @param {Object|Array} data - 要提取值的 JSON 对象/数组
 * @returns {string} 所有值用逗号分隔的字符串（空值/undefined 会被过滤）
 */
function extractValuesToString(data: unknown): string {
  // 存储所有提取到的基本类型值
  const values: (string | number | boolean | null)[] = [];

  // 递归处理函数
  function traverse(item: unknown): void {
    // 处理 null
    if (item === null) {
      values.push(null);
      return;
    }

    // 处理基本类型（字符串、数字、布尔）
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      values.push(item);
      return;
    }

    // 处理数组：递归遍历每个元素
    if (Array.isArray(item)) {
      item.forEach((elem) => traverse(elem));
      return;
    }

    // 处理纯对象（排除 null 和数组，因为上面已处理）
    if (typeof item === 'object') {
      // 遍历对象所有可枚举属性，递归处理属性值
      Object.values(item).forEach((value) => traverse(value));
      return;
    }

    // 忽略函数、Symbol 等非 JSON 兼容类型
  }

  // 开始递归处理输入数据
  traverse(data);

  // 将所有值转为字符串并拼接（null 转为 'null'，其他基本类型自然转为字符串）
  return values.join(', ');
}

</script>

<template>
  <div class="tool-message-container">
    <WebSearchToolMessage 
      v-if="isWebSearch" 
      :message="message" 
      @show-details="$emit('show-details', $event)"
    />

    <!-- 工具调用卡片 - 悬停显示入参，点击展开响应数据 -->
    <ATooltip v-else placement="topRight" :mouse-enter-delay="0.3">
      <template #title>
        <div class="max-w-md">
          <div class="text-xs font-semibold mb-1">{{ t('messages.tool.inputParams') }}</div>
          <pre class="text-xs whitespace-pre-wrap">{{ formatArgumentsForTooltip }}</pre>
        </div>
      </template>

    <div
        role="button"
        tabindex="0"
        :aria-expanded="showResponse"
        :aria-label="t('messages.tool.expandResponse', { name: toolName })"
        class="tool-card group transition-all duration-200 ease-in-out active:scale-[0.99] hover:shadow-lg rounded-4xl px-2.5 py-2 flex items-center gap-1 self-start"
        @click="toggleResponse"
        @keydown.enter="toggleResponse"
        @keydown.space.prevent="toggleResponse"
      >
        <span class="tool-icon" :style="{ backgroundColor: iconBg }">
          <component :is="getToolIcon(toolName as any)" />
        </span>
        <span class="text-md text-primary-600 font-bold leading-6.5">{{ toolName }}</span>
        <span class="text-xs text-primary-400 font-thin ml-1 leading-5 w-70 overflow-hidden line-clamp-1">
          {{ extractValuesToString(argumentsData) }}
        </span>

        <!-- Hover-only elapsed time on the right -->
        <span v-if="elapsedMs !== null" class="ml-auto text-xs text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
          {{ elapsedMs }} ms
        </span>

        <!-- 展开指示器 -->
       
        <CaretUpOutlined
class="self-center transition-transform text-primary-400 dark:text-primary-500 duration-200 text-primary-400"
        :class="{ 'rotate-180': showResponse }"/>

      </div>
    </ATooltip>

    <!-- 响应数据展开区域 - 拉帘效果 -->
    <Transition
      v-if="!isWebSearch"
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-96"
      leave-from-class="opacity-100 max-h-96"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-show="showResponse" class="overflow-hidden mt-2">
        <div class="response-container rounded-2xl p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
          <div class="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">{{ t('messages.tool.responseData') }}</div>
          <pre class="response-data bg-slate-100 dark:bg-zinc-800 text-xs text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words"><code>{{ formatResponseData }}</code></pre>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.tool-message-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  cursor: pointer;
}

.tool-card {
  border: 1px solid #d1e7ff;
  background: linear-gradient(to right bottom, var(--primary-color-50) 0%, var(--jelly-yellow-lightest) 50%, var(--jelly-teal-lightest) 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);

  &:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  &:active {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

.response-container {
  animation: slideDown 0.3s ease-out;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.response-data {
  margin: 0;
  padding: 8px;
  border-radius: 8px;
  font-family: var(--font-mono);
  max-height: 300px;
  max-width: 100%;
  overflow-y: auto;
  overflow-x: auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 2px;

    &:hover {
      background: rgba(156, 163, 175, 0.5);
    }
  }

  code {
    color: inherit;
    background: transparent;
    padding: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    display: block;
  }
}

/* 圆形随机色背景的工具图标容器 */
.tool-icon{
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  .tool-message-container .tool-card {
    border-color: rgba(255, 255, 255, 0.08);
    background: linear-gradient(to right bottom, rgba(30, 42, 56, 0.9) 0%, rgba(38, 40, 34, 0.9) 50%, rgba(28, 44, 42, 0.9) 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);

    &:hover {
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.35), 0 4px 6px rgba(0, 0, 0, 0.2);
    }

    &:active {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  }

  .tool-message-container .response-data {
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }
}
</style>
