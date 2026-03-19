<template>
  <div class="relative group/selector font-sans text-base">
    <button
        type="button"
        :disabled="disabled || loading"
        class="flex items-center gap-2 px-3 py-1.5 bg-transparent border-none text-[15px] font-normal cursor-pointer transition-colors duration-200 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{ 'opacity-50 cursor-not-allowed': disabled || loading }"
        @click.stop="toggleDropdown"
    >
      <template v-if="loading">
        <span>{{ t('compTool.modelSelector.loading') }}</span>
      </template>
      <template v-else-if="selectedModel">
        <ProviderIcon :provider="selectedModel.provider" :size="resolvedIconSize" />
        <span class="text-slate-900 dark:text-white font-medium">{{ selectedModel.displayName }}</span>
        <DownOutlined class="text-xs text-slate-400 dark:text-zinc-500" />
      </template>
      <template v-else>
        <span>{{ t('compTool.modelSelector.selectModel') }}</span>
        <DownOutlined class="text-xs text-slate-400 dark:text-zinc-500" />
      </template>
    </button>

    <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
    >
      <div
          v-show="dropdownVisible"
          class="absolute top-[calc(100%+8px)] left-0 w-44 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-40"
      >
        <div class="py-1">
          <div
              v-for="(modelList, provider) in groupedModels"
              :key="provider"
              class="relative group/provider"
          >
            <div
                class="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-zinc-700"
                :class="{ 'bg-slate-50 dark:bg-zinc-700': expandedProvider === provider }"
                @mouseenter="setProvider(provider)"
                @click="setProvider(provider)"
            >
              <span class="text-sm font-medium text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                <ProviderIcon :provider="String(provider)" :size="resolvedIconSize" />
                {{ providerNames[provider] || provider }}
              </span>
              <RightOutlined
                  class="text-[10px] text-slate-400 dark:text-zinc-500 transition-colors"
                  :class="{ 'text-slate-900 dark:text-white': expandedProvider === provider }"
              />
            </div>

            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-x-2"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 -translate-x-2"
            >
              <div
                  v-show="expandedProvider === provider"
                  class="absolute left-full top-0 ml-1.5 w-[340px] max-h-[400px] overflow-y-auto bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 custom-scrollbar"
              >
                <div class="py-1">
                  <div
                      v-for="model in modelList"
                      :key="model.id"
                      class="flex items-start justify-between px-4 py-2.5 cursor-pointer hover:bg-blue-50/60 dark:hover:bg-zinc-700 transition-colors"
                      :class="{
                      'bg-blue-50 dark:bg-zinc-700': selectedModelId === model.id,
                      'opacity-50 cursor-not-allowed pointer-events-none': !model.available
                    }"
                      @click="selectModel(model)"
                  >
                    <div class="flex-1 min-w-0 pr-3">
                      <div class="flex items-center gap-2 mb-0.5">
                        <ProviderIcon :provider="String(provider)" :size="resolvedIconSize" />
                        <span class="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {{ model.displayName }}
                        </span>
                        <span
                            v-if="model.minTier !== 'free'"
                            class="shrink-0 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded leading-none"
                            :class="getTierClasses(model.minTier)"
                        >
                          {{ model.minTier }}
                        </span>
                      </div>
                      <div v-if="model.description" class="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {{ model.description }}
                      </div>
                    </div>

                    <CheckOutlined
                        v-if="selectedModelId === model.id"
                        class="mt-1 text-sm text-blue-600 shrink-0"
                    />
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div v-if="Object.keys(groupedModels).length === 0 && !loading" class="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">
          {{ t('compTool.modelSelector.noModels') }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DownOutlined, CheckOutlined, RightOutlined } from '@ant-design/icons-vue'
// 假设这些类型和API从你的项目中导入
import type { LlmConfig } from '@/types/llm'
import { useChatStore } from '@/stores/chatStore'
import ProviderIcon from '@/components/ProviderIcon.vue'

// Props & Emits
const props = defineProps<{
  modelValue?: string | null
  disabled?: boolean
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', model: LlmConfig): void
}>()

// i18n
const { t } = useI18n()

// Store
const chatStore = useChatStore()

// State
const models = ref<LlmConfig[]>([])
const loading = ref(false)
const dropdownVisible = ref(false)
const expandedProvider = ref<string | null>(null)

const resolvedIconSize = computed(() => props.iconSize || 'md')

// Provider Names Mapping
const providerNames = computed<Record<string, string>>(() => ({
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  aliyun: t('compTool.modelSelector.providerAliyun'),
  deepseek: 'DeepSeek',
  google: 'Google Gemini',
  moonshot: t('compTool.modelSelector.providerMoonshot'),
  moonshotai: t('compTool.modelSelector.providerMoonshot'),
  zhipu: t('compTool.modelSelector.providerZhipu'),
  '智谱清言': t('compTool.modelSelector.providerZhipu'),
  baidu: t('compTool.modelSelector.providerBaidu'),
  doubao: t('compTool.modelSelector.providerDoubao'),
  bytedance: t('compTool.modelSelector.providerDoubao'),
  mistral: 'Mistral AI',
  meta: 'Meta Llama',
  cohere: 'Cohere',
  minimax: 'MiniMax',
  '01ai': t('compTool.modelSelector.provider01ai'),
  yi: t('compTool.modelSelector.provider01ai'),
  xai: 'xAI Grok',
  groq: 'Groq',
  perplexity: 'Perplexity'
}))

// Computeds
const selectedModelId = computed({
  get: () => props.modelValue || null,
  set: (val) => val && emit('update:modelValue', val)
})

const selectedModel = computed(() =>
    models.value.find(m => m.id === selectedModelId.value) || null
)

const groupedModels = computed(() => {
  const grouped: Record<string, LlmConfig[]> = {}
  models.value.forEach(model => {
    if (!grouped[model.provider]) grouped[model.provider] = []
    grouped[model.provider].push(model)
  })
  // 排序逻辑...
  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => a.sortOrder - b.sortOrder)
  })
  return grouped
})

// Methods
const loadModels = async () => {
  loading.value = true
  try {
    // ⚠️ 核心逻辑：优先使用 Store 的缓存策略（5分钟内不重复请求）
    // 1. 从 Store 获取（内部会检查缓存时间）
    const modelList = await chatStore.refreshModels(false)
    
    if (modelList.length > 0) {
      models.value = modelList
      console.log('[ModelSelector] 加载模型:', modelList.length, '个')
      
      // 如果没有选中模型，自动选择第一个可用的
      if (!selectedModelId.value && models.value.length > 0) {
        const available = models.value.find(m => m.available) || models.value[0]
        selectModel(available)
      }
    } else {
      console.warn('[ModelSelector] 没有可用模型')
    }
  } catch (error) {
    console.error('[ModelSelector] 获取模型列表异常:', error)
  } finally {
    loading.value = false
  }
}

const selectModel = (model: LlmConfig) => {
  if (!model.available) return
  selectedModelId.value = model.id
  emit('change', model)
  dropdownVisible.value = false
}

const toggleDropdown = () => {
  if (!props.disabled) {
    dropdownVisible.value = !dropdownVisible.value
    // 关闭时重置展开项
    if (!dropdownVisible.value) expandedProvider.value = null
  }
}

// 既支持点击，也支持 hover (Mouse Enter) 切换，提升桌面端体验
const setProvider = (provider: string) => {
  expandedProvider.value = provider
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative.group\\/selector')) {
    dropdownVisible.value = false
    expandedProvider.value = null
  }
}

// Tailwind Class Helper
const getTierClasses = (tier: string) => {
  switch (tier) {
    case 'pro': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
    case 'turbo': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
    default: return 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
  }
}

onMounted(() => {
  loadModels()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* 暗色模式已移至下方非 scoped 块 */
</style>

<style lang="scss">
.dark {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #3f3f46;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #52525b;
  }
}
</style>