<template>
  <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
  <div class="flex w-full h-[100dvh] sm:h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-800 dark:text-zinc-200">
    <!-- ==================== 左侧 History 面板 ==================== -->
    <aside class="hidden sm:flex w-[280px] border-r border-zinc-200 dark:border-zinc-800 flex-col bg-white dark:bg-zinc-900 shrink-0 h-full overflow-hidden">
      <!-- 头部 -->
      <div class="h-14 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 justify-between">
        <div class="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon-sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" :aria-label="t('playgroundBasic.speech.back.back')" " @click="goBack">
                <ArrowLeft class="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t("playgroundBasic.speech.back") }}</p>
            </TooltipContent>
          </Tooltip>
          <span class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">History</span>
        </div>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon-sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" :aria-label="t('playgroundBasic.speech.newTask.newTask')" " @click="createNewTask">
              <Plus class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" :side-offset="6">
            <p class="text-xs">{{ t("playgroundBasic.speech.newTask") }}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <!-- 历史列表 -->
      <ScrollArea class="flex-1">
        <div class="p-2 space-y-1">
          <!-- 加载中 -->
          <div v-if="loadingHistory" class="flex items-center justify-center py-8">
            <Loader2 class="w-5 h-5 text-zinc-400 animate-spin" />
          </div>

          <!-- 空状态 -->
          <div v-else-if="history.length === 0" class="flex flex-col items-center justify-center py-12 text-zinc-400">
            <AudioWaveform class="w-8 h-8 mb-2 opacity-50" />
            <span class="text-xs">No history yet</span>
          </div>

          <!-- 历史项 -->
          <div
            v-for="item in history"
            :key="item.id"
            class="group flex gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            @click="viewHistoryItem(item)"
          >
            <!-- 图标 -->
            <div class="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
              <Volume2 v-if="item.modelType === 'tts'" class="w-4 h-4 text-amber-500" />
              <Mic v-else class="w-4 h-4 text-amber-500" />
            </div>
            <!-- 信息 -->
            <div class="flex-1 min-w-0 py-0.5">
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="text-xs font-bold text-amber-500 uppercase">{{ item.modelType }}</span>
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {{ item.modelType === 'tts' ? item.inputText : item.outputText }}
              </p>
              <span class="text-xs text-zinc-400 dark:text-zinc-600">{{ formatTime(item.createdTime) }}</span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>

    <!-- ==================== 中央主视图 ==================== -->
    <div class="flex-1 flex flex-col relative min-w-0 bg-zinc-50 dark:bg-zinc-950">
      <!-- Tab 切换 + 返回按钮 (移动端) -->
      <div class="h-14 flex items-center justify-between sm:justify-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 sm:px-0">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="w-11 h-11 sm:hidden" :aria-label="t('playgroundBasic.speech.back.back')" " @click="goBack">
              <ArrowLeft class="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" :side-offset="6">
            <p class="text-xs">{{ t("playgroundBasic.speech.back") }}</p>
          </TooltipContent>
        </Tooltip>
        <div class="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          <button
            type="button"
            class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs font-medium transition-all"
            :class="activeTab === 'tts' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
            @click="activeTab = 'tts'"
          >
            <Volume2 class="w-4 h-4" />
            <span class="hidden md:inline whitespace-nowrap">Text to Speech</span>
            <span class="sm:hidden">TTS</span>
          </button>
          <button
            type="button"
            class="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs font-medium transition-all"
            :class="activeTab === 'asr' ? 'bg-amber-500 text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
            @click="activeTab = 'asr'"
          >
            <Mic class="w-4 h-4" />
            <span class="hidden md:inline whitespace-nowrap">Speech to Text</span>
            <span class="sm:hidden">ASR</span>
          </button>
        </div>
        <div class="w-11 sm:hidden"></div>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- TTS 面板 -->
        <template v-if="activeTab === 'tts'">
          <div class="flex-1 flex flex-col p-3 sm:p-6 overflow-auto">
            <div class="max-w-2xl mx-auto w-full space-y-4 sm:space-y-6">
              <!-- 文本输入 -->
              <div class="space-y-2">
                <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Text to Convert</label>
                <textarea
                  v-model="ttsText"
                  rows="6"
                  placeholder="Enter the text you want to convert to speech..."
                  :aria-label="t('playgroundBasic.speech.textLabel.textLabel')" "
                  class="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-base text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                ></textarea>
                <div class="flex justify-end">
                  <span class="text-xs text-zinc-400">{{ ttsText.length }} characters</span>
                </div>
              </div>

              <!-- 生成按钮 -->
              <div class="flex justify-center">
                <button
                  type="button"
                  :disabled="!ttsText.trim() || !selectedTtsModelId || generatingTts"
                  :aria-label="generatingTts ? t('playgroundBasic.speech.generatingTts') : t('playgroundBasic.speech.generateSpeech')"
                  class="w-11 h-11 sm:w-auto sm:h-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  @click="generateTts"
                >
                  <Loader2 v-if="generatingTts" class="w-4 h-4 animate-spin" />
                  <Volume2 v-else class="w-4 h-4" />
                  <span class="hidden md:inline whitespace-nowrap">{{ generatingTts ? 'Generating...' : 'Generate Speech' }}</span>
                </button>
              </div>

              <!-- TTS 结果 -->
              <div v-if="ttsResult" class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Result</label>
                  <Badge
                    variant="outline"
                    class="text-xs"
                    :class="ttsResult.status === 'completed' ? 'text-green-600 border-green-300 dark:text-green-400 dark:border-green-800' : 'text-destructive border-destructive/30'"
                  >
                    {{ ttsResult.status === 'completed' ? 'Completed' : 'Failed' }}
                  </Badge>
                </div>

                <div v-if="ttsResult.status === 'completed' && ttsResult.outputUrl" class="bg-white dark:bg-zinc-800 rounded-xl p-4 space-y-3 border border-zinc-200 dark:border-zinc-700">
                  <audio :src="ttsResult.outputUrl" controls class="w-full" />
                  <div class="flex items-center justify-between text-xs text-zinc-500">
                    <span>Duration: {{ ttsResult.durationSec?.toFixed(1) || '-' }}s</span>
                    <Button variant="ghost" size="sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" :aria-label="t('playgroundBasic.speech.downloadAudio.downloadAudio')" " @click="downloadAudio(ttsResult.outputUrl!)">
                      <Download class="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <div v-else-if="ttsResult.status === 'failed'" class="bg-destructive/5 dark:bg-destructive/10 rounded-xl p-4 text-center border border-destructive/20">
                  <AlertCircle class="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p class="text-sm text-destructive">{{ ttsResult.errorMessage || 'Generation failed' }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ASR 面板 -->
        <template v-else>
          <div class="flex-1 flex flex-col p-3 sm:p-6 overflow-auto">
            <div class="max-w-2xl mx-auto w-full space-y-4 sm:space-y-6">
              <!-- 音频上传 -->
              <div class="space-y-2">
                <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Upload Audio</label>
                <div
                  class="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors cursor-pointer"
                  @click="triggerFileInput"
                  @dragover.prevent
                  @drop.prevent="handleFileDrop"
                >
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="audio/*"
                    :aria-label="t('playgroundBasic.speech.uploadAudioLabel.uploadAudioLabel')" "
                    class="hidden"
                    @change="handleFileSelect"
                  />
                  <Mic class="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p class="text-base text-zinc-500 dark:text-zinc-400">Click or drag audio file here</p>
                  <p class="text-xs text-zinc-400 dark:text-zinc-600 mt-1">MP3, WAV, M4A supported</p>
                </div>

                <!-- 已选文件 -->
                <div v-if="audioFile" class="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileAudio class="w-5 h-5 text-amber-500" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{{ audioFile.name }}</p>
                    <p class="text-xs text-zinc-400">{{ formatFileSize(audioFile.size) }}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button variant="ghost" size="icon-sm" class="text-zinc-400 hover:text-red-500" :aria-label="t('playgroundBasic.speech.removeFile.removeFile')" " @click="clearAudioFile">
                        <X class="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" :side-offset="6">
                      <p class="text-xs">{{ t("playgroundBasic.speech.removeFile") }}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <!-- 识别按钮 -->
              <div class="flex justify-center">
                <button
                  type="button"
                  :disabled="!audioFile || !selectedAsrModelId || generatingAsr"
                  :aria-label="generatingAsr ? t('playgroundBasic.speech.recognizing') : t('playgroundBasic.speech.transcribeAudio')"
                  class="w-11 h-11 sm:w-auto sm:h-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  @click="recognizeSpeech"
                >
                  <Loader2 v-if="generatingAsr" class="w-4 h-4 animate-spin" />
                  <Mic v-else class="w-4 h-4" />
                  <span class="hidden md:inline whitespace-nowrap">{{ generatingAsr ? 'Transcribing...' : 'Transcribe Audio' }}</span>
                </button>
              </div>

              <!-- ASR 结果 -->
              <div v-if="asrResult" class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">Transcription Result</label>
                  <Badge
                    variant="outline"
                    class="text-xs"
                    :class="asrResult.status === 'completed' ? 'text-green-600 border-green-300 dark:text-green-400 dark:border-green-800' : 'text-destructive border-destructive/30'"
                  >
                    {{ asrResult.status === 'completed' ? 'Completed' : 'Failed' }}
                  </Badge>
                </div>

                <div v-if="asrResult.status === 'completed'" class="bg-white dark:bg-zinc-800 rounded-xl p-4 space-y-3 border border-zinc-200 dark:border-zinc-700">
                  <p class="text-base text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{{ asrResult.outputText || '(No result)' }}</p>
                  <div class="flex justify-end">
                    <Button variant="ghost" size="sm" class="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" :aria-label="t('playgroundBasic.speech.copyText.copyText')" " @click="copyText(asrResult.outputText || '')">
                      <Copy class="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div v-else-if="asrResult.status === 'failed'" class="bg-destructive/5 dark:bg-destructive/10 rounded-xl p-4 text-center border border-destructive/20">
                  <AlertCircle class="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p class="text-sm text-destructive">{{ asrResult.errorMessage || 'Transcription failed' }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ==================== 右侧 Parameters 面板 ==================== -->
    <aside class="hidden sm:flex w-[300px] border-l border-zinc-200 dark:border-zinc-800 flex-col bg-white dark:bg-zinc-900 shrink-0 h-full overflow-hidden">
      <!-- 头部 -->
      <div class="h-14 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
        <span class="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Parameters</span>
      </div>

      <ScrollArea class="flex-1">
        <div class="p-4 space-y-6">
          <!-- TTS 参数 -->
          <template v-if="activeTab === 'tts'">
            <!-- Model 选择 -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">TTS Model</label>
              <Popover>
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    class="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                  >
                    <div class="flex items-center gap-2">
                      <ProviderIcon v-if="selectedTtsModel" :provider="selectedTtsModel.provider" size="xs" colored />
                      <span>{{ selectedTtsModel?.displayName || 'Select Model' }}</span>
                    </div>
                    <ChevronDown class="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent class="w-[268px] p-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg" align="start">
                  <div class="space-y-0.5">
                    <div v-if="loadingModels" class="flex items-center justify-center py-4">
                      <Loader2 class="w-4 h-4 animate-spin text-zinc-400" />
                    </div>
                    <button
                      v-for="model in ttsModels"
                      v-else
                      :key="model.id"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                      :class="selectedTtsModelId === model.id ? 'bg-amber-500 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                      @click="selectTtsModel(model)"
                    >
                      <ProviderIcon :provider="model.provider" size="xs" :colored="selectedTtsModelId !== model.id" />
                      <span class="text-xs font-medium">{{ model.displayName }}</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <!-- TTS 动态参数 -->
            <ParamPanelRenderer
              :model="ttsParams"
              :schema="activeTtsParamSchema"
              @update="updateTtsParam"
            />
          </template>

          <!-- ASR 参数 -->
          <template v-else>
            <!-- Model 选择 -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-zinc-500 uppercase tracking-wider">ASR Model</label>
              <Popover>
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    class="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                  >
                    <div class="flex items-center gap-2">
                      <ProviderIcon v-if="selectedAsrModel" :provider="selectedAsrModel.provider" size="xs" colored />
                      <span>{{ selectedAsrModel?.displayName || 'Select Model' }}</span>
                    </div>
                    <ChevronDown class="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent class="w-[268px] p-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg" align="start">
                  <div class="space-y-0.5">
                    <div v-if="loadingModels" class="flex items-center justify-center py-4">
                      <Loader2 class="w-4 h-4 animate-spin text-zinc-400" />
                    </div>
                    <button
                      v-for="model in asrModels"
                      v-else
                      :key="model.id"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
                      :class="selectedAsrModelId === model.id ? 'bg-amber-500 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                      @click="selectAsrModel(model)"
                    >
                      <ProviderIcon :provider="model.provider" size="xs" :colored="selectedAsrModelId !== model.id" />
                      <span class="text-xs font-medium">{{ model.displayName }}</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <!-- ASR 动态参数 -->
            <ParamPanelRenderer
              :model="asrParams"
              :schema="activeAsrParamSchema"
              @update="updateAsrParam"
            />
          </template>
        </div>
      </ScrollArea>
    </aside>
  </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Plus, AudioWaveform, Volume2, Mic, Loader2,
  Download, AlertCircle, FileAudio, X, Copy, ChevronDown
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import ProviderIcon from '@/components/ProviderIcon.vue'
import ParamPanelRenderer from '@/components/playground/ParamPanelRenderer.vue'
import { useSpeechPlayground } from '@/composables/useSpeechPlayground'

const router = useRouter()
const { t } = useI18n()

// =====================================================
// Composable
// =====================================================
const {
  loadingModels,
  loadingHistory,
  generatingTts,
  generatingAsr,
  history,
  activeTab,
  // TTS
  selectedTtsModelId,
  selectedTtsModel,
  ttsModels,
  ttsText,
  ttsParams,
  ttsResult,
  activeTtsParamSchema,
  // ASR
  selectedAsrModelId,
  selectedAsrModel,
  asrModels,
  audioFile,
  asrParams,
  asrResult,
  activeAsrParamSchema,
  // Actions
  loadModels,
  loadHistory,
  selectTtsModel,
  selectAsrModel,
  generateTts,
  recognizeSpeech,
  updateTtsParam,
  updateAsrParam,
  clearAudioFile,
  // Utils
  downloadAudio,
  copyText,
  formatFileSize,
  formatTime
} = useSpeechPlayground()

// =====================================================
// 本地状态
// =====================================================
const fileInputRef = ref<HTMLInputElement>()

// =====================================================
// 操作函数
// =====================================================
const goBack = () => {
  router.push('/playground')
}

const createNewTask = () => {
  ttsText.value = ''
  ttsResult.value = null
  audioFile.value = null
  asrResult.value = null
}

const viewHistoryItem = (item: typeof history.value[0]) => {
  if (item.modelType === 'tts') {
    activeTab.value = 'tts'
    ttsResult.value = item
    if (item.inputText) {
      ttsText.value = item.inputText
    }
  } else {
    activeTab.value = 'asr'
    asrResult.value = item
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.length) {
    audioFile.value = target.files[0]
  }
}

const handleFileDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (files?.length) {
    audioFile.value = files[0]
  }
}

// =====================================================
// 生命周期
// =====================================================
onMounted(() => {
  loadModels()
  loadHistory()
})
</script>
