<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <!-- 论文标题 -->
    <div>
      <label for="thesis-title" class="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">
        {{ t('thesisWriter.newProject.thesisTitle') }} <span class="text-red-500">*</span>
      </label>
      <input
        id="thesis-title"
        v-model="form.title"
        type="text"
        class="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 transition-all
               bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-100"
        :placeholder="t('thesisWriter.newProject.titlePlaceholder')"
        required
      />
    </div>

    <!-- 学位类型 -->
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">
        {{ t('thesisWriter.newProject.degreeType') }} <span class="text-red-500">*</span>
      </label>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="option in degreeOptions"
          :key="option.value"
          type="button"
          class="px-4 py-2.5 border rounded-lg text-sm font-medium transition-all"
          :class="{
            'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400': form.degree === option.value,
            'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10': form.degree !== option.value
          }"
          @click="form.degree = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- 专业 & 导师 -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="thesis-major" class="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">{{ t('thesisWriter.newProject.major') }}</label>
        <input
          id="thesis-major"
          v-model="form.major"
          type="text"
          class="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 transition-all
                   bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-100"
          :placeholder="t('thesisWriter.newProject.majorPlaceholder')"
        />
      </div>
      <div>
        <label for="thesis-supervisor" class="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">{{ t('thesisWriter.newProject.advisor') }}</label>
        <input
          id="thesis-supervisor"
          v-model="form.supervisor"
          type="text"
          class="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 transition-all
                   bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-100"
          :placeholder="t('thesisWriter.newProject.advisorPlaceholder')"
        />
      </div>
    </div>

    <!-- 目标字数 -->
    <div>
      <label for="thesis-word-count" class="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">{{ t('thesisWriter.newProject.targetWordCount') }}</label>
      <div class="relative">
        <input
          id="thesis-word-count"
          v-model.number="form.targetWordCount"
          type="number"
          class="w-full px-3 py-2.5 pr-12 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 transition-all
                   bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-100"
          :placeholder="recommendedWordCount"
          min="1000"
          step="1000"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-zinc-500">{{ t('thesisWriter.newProject.targetWordUnit') }}</span>
      </div>
      <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">
        {{ form.degree === 'bachelor' ? t('thesisWriter.newProject.bachelorRecommend') : form.degree === 'master' ? t('thesisWriter.newProject.masterRecommend') : t('thesisWriter.newProject.doctorRecommend') }}
      </p>
    </div>

    <!-- 选择模板 -->
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1.5">{{ t('thesisWriter.newProject.outlineTemplate') }}</label>

      <!-- Loading -->
      <div v-if="templatesLoading" class="grid grid-cols-1 gap-2">
        <div v-for="i in 2" :key="i" class="p-3 rounded-lg border border-slate-100 dark:border-zinc-700 animate-pulse">
          <div class="h-4 bg-slate-100 dark:bg-zinc-800 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-2/3"></div>
        </div>
      </div>

      <!-- Template Cards -->
      <div v-else class="space-y-2 max-h-52 overflow-y-auto pr-1">
        <!-- Blank option -->
        <button
          type="button"
          class="w-full p-3 rounded-lg border text-left transition-all duration-200"
          :class="!form.templateId
            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 ring-1 ring-amber-500/20'
            : 'border-slate-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/30 dark:hover:bg-amber-900/5'"
          @click="form.templateId = ''"
        >
          <div class="flex items-center gap-2">
            <FileText :size="14" class="text-slate-400 dark:text-zinc-500" />
            <span class="text-sm font-medium text-slate-700 dark:text-zinc-200">{{ t('thesisWriter.newProject.fromBlank') }}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1 ml-[22px]">稍后手动创建或由 AI 生成大纲</p>
        </button>

        <!-- Template cards -->
        <button
          v-for="tpl in templates"
          :key="tpl.id"
          type="button"
          class="w-full p-3 rounded-lg border text-left transition-all duration-200"
          :class="form.templateId === tpl.id
            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 ring-1 ring-amber-500/20'
            : 'border-slate-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/30 dark:hover:bg-amber-900/5'"
          @click="form.templateId = tpl.id"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-slate-700 dark:text-zinc-200">{{ tpl.name }}</span>
            <span v-if="form.templateId === tpl.id" class="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded font-medium">
              {{ t('thesisWriter.newProject.selected') }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1">{{ tpl.description }}</p>
          <!-- Structure preview -->
          <div v-if="tpl.structure && tpl.structure.length > 0" class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="node in tpl.structure.slice(0, 5)"
              :key="node.title"
              class="text-xs text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded"
            >
              {{ node.title }}
            </span>
            <span v-if="tpl.structure.length > 5" class="text-xs text-slate-400 dark:text-zinc-500">
              +{{ tpl.structure.length - 5 }} 节
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="flex justify-end gap-3 pt-2">
      <button
        type="button"
        class="px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors active:scale-95"
        @click="handleCancel"
      >
        {{ t('common.button.cancel') }}
      </button>
      <button
        type="submit"
        class="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-amber-200 dark:hover:shadow-amber-900/30 transition-all disabled:opacity-50 active:scale-95"
        :disabled="!isValid || isSubmitting"
      >
        <span v-if="isSubmitting" class="flex items-center gap-2">
          <Loader2 :size="14" class="animate-spin" />
          {{ t('thesisWriter.newProject.creating') }}
        </span>
        <span v-else>{{ t('thesisWriter.newProject.createBtn') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, FileText } from 'lucide-vue-next'
import type { CreateThesisRequest, ThesisTemplate } from '@/types/thesis-writer'
import { listTemplates } from '@/api/thesis-writer'

const props = defineProps<{
  initialTitle?: string
}>()

const emit = defineEmits<{
  submit: [request: CreateThesisRequest]
  cancel: []
}>()

const { t } = useI18n()

// ==================== 表单状态 ====================
const form = reactive<CreateThesisRequest>({
  title: props.initialTitle || '',
  degree: 'bachelor',
  major: '',
  supervisor: '',
  templateId: '',
  targetWordCount: undefined
})

// 监听初始标题变化
watch(() => props.initialTitle, (newTitle) => {
  if (newTitle) {
    form.title = newTitle
  }
})

const isSubmitting = ref(false)

// ==================== 模板 ====================
const templates = ref<ThesisTemplate[]>([])
const templatesLoading = ref(false)

async function loadTemplates(degree: string) {
  templatesLoading.value = true
  try {
    const res = await listTemplates(degree as 'bachelor' | 'master' | 'doctor')
    if (res.code === 200) {
      templates.value = res.data || []
    }
  } catch (e) {
    console.error('Failed to load templates:', e)
    templates.value = []
  } finally {
    templatesLoading.value = false
  }
}

// 当学位类型变更时重新加载模板
watch(() => form.degree, (newDegree) => {
  form.templateId = ''
  loadTemplates(newDegree)
}, { immediate: true })

// ==================== 选项配置 ====================
const degreeOptions = computed(() => [
  { value: 'bachelor', label: t('thesisWriter.newProject.degreeBachelor') },
  { value: 'master', label: t('thesisWriter.newProject.degreeMaster') },
  { value: 'doctor', label: t('thesisWriter.newProject.degreeDoctor') },
] as const)

const wordCountRecommendations: Record<string, string> = {
  bachelor: '8,000 - 15,000',
  master: '30,000 - 50,000',
  doctor: '80,000 - 100,000'
}

// ==================== 计算属性 ====================
const recommendedWordCount = computed(() =>
  wordCountRecommendations[form.degree] || '10,000 - 20,000'
)

const isValid = computed(() => form.title.trim().length > 0)

// ==================== 操作 ====================
async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    emit('submit', { ...form })
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>
