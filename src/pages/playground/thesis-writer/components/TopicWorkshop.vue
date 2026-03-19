<script setup lang="ts">
/**
 * 智能选题工坊
 * 基于专业和兴趣推荐论文选题，炫酷的卡片式展示
 */
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import {
  Sparkles,
  Search,
  Lightbulb,
  BookOpen,
  ChevronRight,
  Loader2,
  X,
  Check,
  Flame,
  Zap,
  TrendingUp,
  Plus
} from 'lucide-vue-next'
import { message } from 'ant-design-vue'
import type { TopicSuggestion } from '@/types/thesis-writer'
import { recommendTopics } from '@/api/thesis-writer'

const emit = defineEmits<{
  (e: 'select', topic: TopicSuggestion): void
  (e: 'close'): void
}>()

const { t } = useI18n()
const isLoading = ref(false)

// 表单状态
const major = ref('')
const interestInput = ref('')
const interests = ref<string[]>([])
const suggestions = ref<TopicSuggestion[]>([])
const selectedTopic = ref<TopicSuggestion | null>(null)
const showResults = ref(false)

// 热门专业
const popularMajors = computed(() => [
  t('thesisWriter.topicWorkshop.popularMajors.cs'),
  t('thesisWriter.topicWorkshop.popularMajors.edu'),
  t('thesisWriter.topicWorkshop.popularMajors.biz'),
  t('thesisWriter.topicWorkshop.popularMajors.ee'),
  t('thesisWriter.topicWorkshop.popularMajors.mech'),
  t('thesisWriter.topicWorkshop.popularMajors.fin'),
])

// 热门关键词
const hotKeywords = computed(() => [
  t('thesisWriter.topicWorkshop.hotKeywords.deepLearning'),
  t('thesisWriter.topicWorkshop.hotKeywords.blockchain'),
  t('thesisWriter.topicWorkshop.hotKeywords.bigData'),
  t('thesisWriter.topicWorkshop.hotKeywords.iot'),
  t('thesisWriter.topicWorkshop.hotKeywords.cloud'),
  t('thesisWriter.topicWorkshop.hotKeywords.ai'),
  t('thesisWriter.topicWorkshop.hotKeywords.nlp'),
  t('thesisWriter.topicWorkshop.hotKeywords.edTech'),
])

// 难度配置
const difficultyConfig = computed(() => ({
  easy: { label: t('thesisWriter.topicWorkshop.difficultyBeginner'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Zap },
  medium: { label: t('thesisWriter.topicWorkshop.difficultyIntermediate'), color: 'text-amber-500', bg: 'bg-amber-500/10', icon: TrendingUp },
  hard: { label: t('thesisWriter.topicWorkshop.difficultyAdvanced'), color: 'text-red-500', bg: 'bg-red-500/10', icon: Flame },
}))

// 添加兴趣标签
function addInterest(keyword?: string) {
  const value = keyword || interestInput.value.trim()
  if (value && !interests.value.includes(value) && interests.value.length < 5) {
    interests.value.push(value)
    interestInput.value = ''
  }
}

// 移除兴趣标签
function removeInterest(index: number) {
  interests.value.splice(index, 1)
}

// 搜索选题
async function searchTopics() {
  if (!major.value) return

  isLoading.value = true
  try {
    const res = await recommendTopics({
      major: major.value,
      degree: 'bachelor',
      interests: interests.value,
    })
    if (res.code === 200 && res.data) {
      suggestions.value = res.data
    } else {
      message.error(res.message || t('thesisWriter.topicWorkshop.recommendFailed'))
    }
  } catch (e) {
    console.error('选题推荐请求失败:', e)
    message.error(t('thesisWriter.topicWorkshop.recommendFailed'))
  } finally {
    isLoading.value = false
  }

  showResults.value = true

  // 卡片入场动画
  setTimeout(() => {
    gsap.fromTo(
      '.topic-card',
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.2)',
      }
    )
  }, 100)
}

// 选择选题
function selectTopic(topic: TopicSuggestion) {
  selectedTopic.value = topic

  // 高亮动画
  gsap.to('.topic-card.selected', {
    scale: 1.02,
    duration: 0.3,
    ease: 'power2.out'
  })
}

// 确认选题
function confirmSelection() {
  if (selectedTopic.value) {
    emit('select', selectedTopic.value)
  }
}

// 返回搜索
function backToSearch() {
  showResults.value = false
  selectedTopic.value = null
}

onUnmounted(() => {
  gsap.killTweensOf('.topic-card')
})

</script>

<template>
  <div class="topic-workshop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
    <div
      class="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/10"
    >
      <!-- 头部 - 简洁风格 -->
      <div class="absolute top-0 left-0 right-0 h-24 sm:h-28 bg-slate-900 dark:bg-slate-800" />

      <!-- 关闭按钮 -->
      <button
        :aria-label="t('thesisWriter.topicWorkshop.title')"
        class="absolute top-4 right-4 z-10 w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:rotate-90 active:scale-95"
        @click="emit('close')"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div class="relative pt-6 sm:pt-8 px-4 sm:px-6 pb-4 sm:pb-6">
        <!-- 标题 -->
        <div class="text-center mb-4 sm:mb-6">
          <div class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-white text-xs font-mono mb-2 sm:mb-3">
            <Sparkles class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>AI_RECOMMENDATION</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-semibold text-white tracking-tight">{{ t('thesisWriter.topicWorkshop.title') }}</h2>
          <p class="text-white/60 text-xs sm:text-sm mt-1">{{ t('thesisWriter.topicWorkshop.majorPlaceholder') }}</p>
        </div>

        <!-- 搜索表单 / 结果列表 -->
        <div class="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-4 sm:p-6 mt-6 sm:mt-8 max-h-[60vh] overflow-y-auto backdrop-blur-sm">
          <template v-if="!showResults">
            <!-- 专业选择 -->
            <div class="mb-4 sm:mb-6">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <BookOpen class="w-4 h-4 inline mr-1" />
                {{ t('thesisWriter.topicWorkshop.majorLabel') }}
              </label>
              <input
                v-model="major"
                type="text"
                :placeholder="t('thesisWriter.topicWorkshop.majorPlaceholder')"
                class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-900/50 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-500 transition-all text-sm"
              />
              <div class="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                <button
                  v-for="m in popularMajors"
                  :key="m"
                  class="px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs rounded-full transition-all duration-200 active:scale-95"
                  :class="major === m
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'"
                  @click="major = m"
                >
                  {{ m }}
                </button>
              </div>
            </div>

            <!-- 兴趣关键词 -->
            <div class="mb-4 sm:mb-6">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Lightbulb class="w-4 h-4 inline mr-1" />
                {{ t('thesisWriter.topicWorkshop.interestLabel') }} <span class="text-slate-400">(max 5)</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="interestInput"
                  type="text"
                  :placeholder="t('thesisWriter.topicWorkshop.interestPlaceholder')"
                  class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-slate-200/50 dark:border-slate-600/50 bg-white dark:bg-slate-900/50 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 dark:focus:border-slate-500 transition-all text-sm"
                  @keyup.enter="addInterest()"
                />
                <button
                  :disabled="!interestInput.trim() || interests.length >= 5"
                  class="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 text-sm"
                  @click="addInterest()"
                >
                  <span class="hidden sm:inline">{{ t('thesisWriter.topicWorkshop.addBtn') }}</span>
                  <Plus class="w-4 h-4 sm:hidden" />
                </button>
              </div>

              <!-- 已选标签 -->
              <div v-if="interests.length > 0" class="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                <span
                  v-for="(interest, index) in interests"
                  :key="interest"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm transition-all duration-200"
                >
                  {{ interest }}
                  <button :aria-label="t('thesisWriter.topicWorkshop.removeInterest', { interest })" class="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center hover:text-slate-900 dark:hover:text-slate-100 transition-colors" @click="removeInterest(index)">
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </div>

              <!-- 热门关键词 -->
              <div class="mt-3 sm:mt-4">
                <span class="text-xs text-slate-400 mr-1.5 sm:mr-2">{{ t('thesisWriter.topicWorkshop.hotPrefix') }}</span>
                <button
                  v-for="keyword in hotKeywords"
                  :key="keyword"
                  :disabled="interests.includes(keyword) || interests.length >= 5"
                  class="mr-1.5 sm:mr-2 mb-2 px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 transition-all duration-200 active:scale-95"
                  @click="addInterest(keyword)"
                >
                  + {{ keyword }}
                </button>
              </div>
            </div>

            <!-- 搜索按钮 -->
            <button
              :disabled="!major || isLoading"
              class="w-full py-3.5 sm:py-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] text-sm"
              @click="searchTopics"
            >
              <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
              <Search v-else class="w-5 h-5" />
              <span v-if="!isLoading">{{ t('thesisWriter.topicWorkshop.recommendBtn') }}</span>
              <span v-else>{{ t('thesisWriter.topicWorkshop.analyzing') }}</span>
            </button>
          </template>

          <!-- 结果列表 -->
          <template v-else>
            <!-- 返回按钮 -->
            <button
              class="mb-3 sm:mb-4 text-sm text-slate-500 hover:text-violet-500 flex items-center gap-1 transition-colors"
              @click="backToSearch"
            >
              <ChevronRight class="w-4 h-4 rotate-180" />
              {{ t('thesisWriter.topicWorkshop.backToEdit') }}
            </button>

            <!-- 选题卡片列表 -->
            <div class="space-y-3 sm:space-y-4">
              <div
                v-for="topic in suggestions"
                :key="topic.title"
                class="topic-card relative p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-300"
                :class="selectedTopic?.title === topic.title
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 selected'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300'"
                @click="selectTopic(topic)"
              >
                <!-- 选中标记 -->
                <div
                  v-if="selectedTopic?.title === topic.title"
                  class="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-violet-500 flex items-center justify-center"
                >
                  <Check class="w-4 h-4 text-white" />
                </div>

                <!-- 标题 -->
                <h3 class="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 pr-8">
                  {{ topic.title }}
                </h3>
                <p class="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {{ topic.description }}
                </p>

                <!-- 指标 -->
                <div class="flex flex-wrap items-center gap-4 mt-4">
                  <!-- 难度 -->
                  <div
                    class="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                    :class="[difficultyConfig[topic.difficultyLevel].bg, difficultyConfig[topic.difficultyLevel].color]"
                  >
                    <component :is="difficultyConfig[topic.difficultyLevel].icon" class="w-3 h-3" />
                    {{ difficultyConfig[topic.difficultyLevel]?.label }}
                  </div>
                </div>

                <!-- 关键词 -->
                <div class="flex flex-wrap gap-1.5 mt-3">
                  <span
                    v-for="keyword in topic.keywords"
                    :key="keyword"
                    class="px-2 py-0.5 text-xs rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  >
                    {{ keyword }}
                  </span>
                </div>

                <!-- 展开详情 -->
                <div v-if="selectedTopic?.title === topic.title" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p class="text-base text-slate-600 dark:text-slate-300 mb-3">
                    {{ topic.description }}
                  </p>

                  <div v-if="topic.innovationPoint">
                    <h4 class="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <Lightbulb class="w-3 h-3" />
                      {{ t('thesisWriter.topicWorkshop.innovationPoints') }}
                    </h4>
                    <p class="text-base text-slate-600 dark:text-slate-400">
                      {{ topic.innovationPoint }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 确认按钮 -->
            <div v-if="selectedTopic" class="sticky bottom-0 pt-3 sm:pt-4 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
              <button
                class="w-full py-3.5 sm:py-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] text-sm"
                @click="confirmSelection"
              >
                <Check class="w-5 h-5" />
                {{ t('thesisWriter.topicWorkshop.confirmSelect') }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topic-workshop {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.topic-card {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .topic-workshop {
    animation: none;
  }

  .topic-card {
    opacity: 1;
  }
}
</style>
