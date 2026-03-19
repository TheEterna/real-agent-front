<template>
  <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
    <div class="h-[100dvh] sm:h-screen w-full flex flex-col bg-white dark:bg-zinc-950">
      <!-- 顶部导航栏 -->
      <header class="mt-4 flex items-center justify-between bg-white dark:bg-zinc-900 relative">
        <div class="flex z-9 items-center gap-2 sm:gap-4 ml-3 sm:ml-4">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto" :aria-label="t('playgroundBasic.chat.back')" @click="goBack">
                <ArrowLeft class="w-4 h-4 text-zinc-600 dark:text-zinc-400"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t('playgroundBasic.chat.back') }}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <h1 class="text-sm sm:text-base font-medium z-0 text-zinc-900 dark:text-zinc-100 flex-1 text-center absolute w-full px-12">
          Chat Playground
        </h1>
        <div class="flex z-9 items-center gap-1.5 sm:gap-3 mr-3 sm:mr-4">
          <!-- 上下文 Token 使用进度 -->
          <Tooltip>
            <TooltipTrigger as-child>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 cursor-default">
                <!-- 圆环进度 -->
                <div class="relative w-4 h-4">
                  <svg class="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
                    <!-- 背景圆环 -->
                    <circle
                        cx="8"
                        cy="8"
                        r="6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="text-zinc-300 dark:text-zinc-600"
                    />
                    <!-- 进度圆环 -->
                    <circle
                        cx="8"
                        cy="8"
                        r="6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        :stroke-dasharray="`${contextProgress * 37.7} 37.7`"
                        stroke-linecap="round"
                        :class="contextProgressColor"
                    />
                  </svg>
                  <!-- 百分比文字（太小不显示） -->
                </div>
                <span class="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {{ formatTokenCount(usedContextTokens) }} / {{ formatTokenCount(maxContextTokens) }}
              </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">
              <p class="text-xs font-medium">Context Usage: {{ contextPercentage }}%</p>
              <p class="text-xs text-zinc-400">Used: {{ usedContextTokens.toLocaleString() }} tokens</p>
              <p class="text-xs text-zinc-400">Max: {{ maxContextTokens.toLocaleString() }} tokens</p>
            </TooltipContent>
          </Tooltip>

          <!-- 模型选择器 -->
          <Popover v-model:open="showModelDropdown">
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" class="gap-1.5 sm:gap-2">
                <ProviderIcon
                    v-if="selectedModel"
                    :provider="currentModel?.provider || selectedModel"
                    size="sm"
                    colored
                />
                <span class="max-w-[80px] sm:max-w-[120px] truncate">
                {{ currentModel?.displayName || 'Select Model' }}
              </span>
                <ChevronDown class="w-3 h-3 text-zinc-500"/>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-0" align="end">
              <div class="max-h-96 overflow-auto">
                <div
                    v-for="model in models"
                    :key="model.id"
                    class="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    :class="{ 'bg-emerald-50 dark:bg-emerald-900/20': selectedModel === model.id }"
                    @click="selectModel(model)"
                >
                  <ProviderIcon :provider="model.provider" size="md" colored/>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {{ model.displayName }}
                    </div>
                    <div class="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>{{ model.provider }}</span>
                      <span v-if="model.contentWindow">· {{ formatContext(model.contentWindow) }}</span>
                    </div>
                  </div>
                  <Check
                      v-if="selectedModel === model.id"
                      class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <!-- 记忆开关 -->
          <Tooltip>
            <TooltipTrigger as-child>
              <div
class="flex items-center gap-1 px-1.5 py-1 rounded-md"
                   :class="enableMemory ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''">
                <Switch
                    :checked="enableMemory"
                    class="scale-75"
                    @update:checked="enableMemory = $event"
                />
                <span class="text-xs text-zinc-500 dark:text-zinc-400 hidden md:inline whitespace-nowrap">{{ t('playgroundBasic.chat.memory') }}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t('playgroundBasic.chat.memoryTip') }}</p>
            </TooltipContent>
          </Tooltip>

          <!-- 记忆面板入口 -->
          <Tooltip v-if="enableMemory">
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon-sm" @click="openMemoryPanel">
                <BrainCircuit class="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t('playgroundBasic.chat.memoryManage') }}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto" :aria-label="t('playgroundBasic.chat.chatHistory')" @click="showHistory = !showHistory">
                <History class="w-4 h-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t('playgroundBasic.chat.chatHistory') }}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto" :aria-label="t('playgroundBasic.chat.newSession')" @click="newSession">
                <Plus class="w-4 h-4"/>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              <p class="text-xs">{{ t('playgroundBasic.chat.newSession') }}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      <!-- 主内容区 -->
      <div class="flex-1 flex overflow-hidden relative">
        <!-- 对话区域 -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

          <!-- 消息列表 -->
          <ScrollArea class="flex-1 overflow-auto">
            <div ref="messagesContainer" class="p-3 sm:p-4 py-4 sm:py-6">
              <!-- 空状态 -->
              <div v-if="messages.length === 0 && !streaming" class="h-[60vh] flex items-center justify-center">
                <div class="text-center max-w-lg px-4">
                  <div
                      class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                    <MessageSquare class="w-8 h-8 text-emerald-600 dark:text-emerald-400"/>
                  </div>
                  <h3 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Start a conversation</h3>
                  <p class="text-base text-zinc-500 dark:text-zinc-400 mb-8">
                    Experience the raw power of large language models. Select a model and start chatting.
                  </p>
                  <div class="flex flex-wrap justify-center gap-2">
                    <Button
                        v-for="prompt in quickPrompts"
                        :key="prompt"
                        variant="outline"
                        size="sm"
                        class="text-xs rounded-full"
                        @click="inputMessage = prompt"
                    >
                      {{ prompt }}
                    </Button>
                  </div>
                </div>
              </div>

              <!-- 消息列表 -->
              <div v-else class="space-y-6 max-w-3xl mx-auto" role="log" aria-live="polite" :aria-label="t('playgroundBasic.chat.messageInput')">
                <div
                    v-for="msg in messages"
                    :key="msg.id"
                    class="group"
                >
                  <!-- 用户消息 -->
                  <div v-if="msg.role === 'user'" class="flex justify-end">
                    <div class="max-w-[85%] flex items-end gap-3">
                      <div class="px-4 py-3 rounded-2xl rounded-br-sm bg-emerald-600 text-white">
                        <p class="text-base leading-relaxed whitespace-pre-wrap">{{ msg.content }}</p>
                      </div>
                      <div
                          class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                        <User class="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
                      </div>
                    </div>
                  </div>

                  <!-- AI 消息 -->
                  <div v-else class="flex justify-start">
                    <div class="max-w-[85%] flex items-start gap-3">
                      <div
                          class="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <ProviderIcon
                            v-if="currentModel"
                            :provider="currentModel.provider"
                            size="sm"
                            colored
                        />
                        <Sparkles v-else class="w-4 h-4 text-zinc-400"/>
                      </div>
                      <div
                          class="px-4 py-3 rounded-2xl rounded-tl-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <p class="text-base leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                          {{ msg.content }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 流式响应 -->
                <div v-if="streaming" class="flex justify-start">
                  <div class="max-w-[85%] flex items-start gap-3">
                    <div
                        class="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <ProviderIcon
                          v-if="currentModel"
                          :provider="currentModel.provider"
                          size="sm"
                          colored
                      />
                      <Sparkles v-else class="w-4 h-4 text-zinc-400"/>
                    </div>
                    <div
                        class="px-4 py-3 rounded-2xl rounded-tl-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      <p class="text-base leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                        {{ streamingContent }}<span
                          class="inline-block w-0.5 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle"></span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <!-- 输入区域 -->
          <div class="shrink-0 p-3 sm:p-4 bg-white dark:bg-zinc-900">
            <div class="max-w-3xl mx-auto">
              <!-- 附件预览区 -->
              <div v-if="attachments.length > 0" class="mb-3 flex flex-wrap gap-2">
                <div
                    v-for="(file, index) in attachments"
                    :key="index"
                    class="relative group"
                >
                  <img
                      :src="file.preview"
                      :alt="file.name || t('playgroundBasic.chat.attachmentPreview')"
                      class="w-16 h-16 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                  />
                  <button
                      :aria-label="t('playgroundBasic.chat.removeAttachment')"
                      class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 dark:bg-zinc-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="removeAttachment(index)"
                  >
                    <X class="w-3 h-3 text-white"/>
                  </button>
                </div>
              </div>

              <!-- 输入框主体 -->
              <div
                  class="relative rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <!-- 文本输入 -->
                <Textarea
                    v-model="inputMessage"
                    placeholder="Message..."
                    :aria-label="t('playgroundBasic.chat.messageInput')"
                    class="w-full min-h-[52px] max-h-[200px] px-4 pt-3 pb-12 bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                    :rows="1"
                    @keydown.enter.exact.prevent="sendMessage"
                />

                <!-- 底部工具栏 -->
                <div class="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between">
                  <!-- 左侧：附件和参数按钮 -->
                  <div class="flex items-center gap-1">
                    <input
                        ref="fileInputRef"
                        type="file"
                        accept="image/*"
                        multiple
                        class="hidden"
                        @change="handleFileSelect"
                    />
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto" :aria-label="t('playgroundBasic.chat.uploadImage')" @click="fileInputRef?.click()">
                          <ImageIcon class="w-4 h-4 text-zinc-400 hover:text-zinc-600"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" :side-offset="6">
                        <p class="text-xs">{{ t('playgroundBasic.chat.uploadImage') }}</p>
                      </TooltipContent>
                    </Tooltip>

                    <!-- 参数面板 Popover -->
                    <Popover v-model:open="showParamsPanel">
                      <PopoverTrigger as-child>
                        <Tooltip>
                          <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto" :aria-label="t('playgroundBasic.chat.genParams')">
                              <SlidersHorizontal class="w-4 h-4 text-zinc-400 hover:text-zinc-600"/>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" :side-offset="6">
                            <p class="text-xs">{{ t('playgroundBasic.chat.genParams') }}</p>
                          </TooltipContent>
                        </Tooltip>
                      </PopoverTrigger>
                      <PopoverContent class="w-80 p-4" align="start" side="top">
                        <div class="space-y-4">
                          <h4 class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Generation Parameters</h4>

                          <!-- Temperature -->
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <Label class="text-xs text-zinc-600 dark:text-zinc-400">Temperature</Label>
                              <span class="text-xs font-mono text-zinc-900 dark:text-zinc-100">{{
                                  temperature.toFixed(1)
                                }}</span>
                            </div>
                            <Slider v-model="temperatureArray" :min="0" :max="2" :step="0.1"/>
                          </div>

                          <!-- Top P -->
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <Label class="text-xs text-zinc-600 dark:text-zinc-400">Top P</Label>
                              <span class="text-xs font-mono text-zinc-900 dark:text-zinc-100">{{
                                  topP.toFixed(2)
                                }}</span>
                            </div>
                            <Slider v-model="topPArray" :min="0" :max="1" :step="0.05"/>
                          </div>

                          <!-- Max Tokens -->
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <Label class="text-xs text-zinc-600 dark:text-zinc-400">Max Tokens</Label>
                              <span class="text-xs font-mono text-zinc-900 dark:text-zinc-100">{{ maxTokens }}</span>
                            </div>
                            <Slider v-model="maxTokensArray" :min="100" :max="8192" :step="100"/>
                          </div>

                          <!-- Frequency Penalty -->
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <Label class="text-xs text-zinc-600 dark:text-zinc-400">Frequency Penalty</Label>
                              <span class="text-xs font-mono text-zinc-900 dark:text-zinc-100">{{
                                  frequencyPenalty.toFixed(1)
                                }}</span>
                            </div>
                            <Slider v-model="frequencyPenaltyArray" :min="-2" :max="2" :step="0.1"/>
                          </div>

                          <!-- Presence Penalty -->
                          <div class="space-y-2">
                            <div class="flex justify-between">
                              <Label class="text-xs text-zinc-600 dark:text-zinc-400">Presence Penalty</Label>
                              <span class="text-xs font-mono text-zinc-900 dark:text-zinc-100">{{
                                  presencePenalty.toFixed(1)
                                }}</span>
                            </div>
                            <Slider v-model="presencePenaltyArray" :min="-2" :max="2" :step="0.1"/>
                          </div>

                          <!-- System Prompt -->
                          <div class="space-y-2">
                            <Label class="text-xs text-zinc-600 dark:text-zinc-400">System Prompt</Label>
                            <Textarea
                                v-model="systemPrompt"
                                placeholder="Set AI behavior or role..."
                                class="min-h-[80px] text-xs"
                                :rows="3"
                            />
                          </div>

                          <!-- 预设快捷选择 -->
                          <div class="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                            <Label class="text-xs text-zinc-600 dark:text-zinc-400 mb-2 block">Presets</Label>
                            <div class="flex flex-wrap gap-1.5">
                              <Button
                                  v-for="preset in presets"
                                  :key="preset.name"
                                  variant="outline"
                                  size="sm"
                                  class="text-xs h-7"
                                  @click="applyPreset(preset)"
                              >
                                {{ preset.name }}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <!-- 右侧：字数 + 发送/停止 -->
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-zinc-400">{{ inputMessage.length }}</span>
                    <!-- 停止生成按钮（流式生成时显示） -->
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <Button
                            v-if="streaming"
                            size="icon"
                            class="w-11 h-11 sm:w-auto sm:h-auto rounded-xl bg-red-500 hover:bg-red-600"
                            :aria-label="t('playgroundBasic.chat.stopGenerate')"
                            @click="stopGeneration"
                        >
                          <Square class="w-3.5 h-3.5 text-white fill-white"/>
                        </Button>
                        <!-- 发送按钮（非流式时显示） -->
                        <Button
                            v-else
                            size="icon"
                            class="w-11 h-11 sm:w-auto sm:h-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700"
                            :disabled="!canSend"
                            :aria-label="t('playgroundBasic.chat.sendMessage')"
                            @click="sendMessage"
                        >
                          <ArrowUp class="w-4 h-4 text-white"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" :side-offset="6">
                        <p class="text-xs">{{ streaming ? t('playgroundBasic.chat.stopGenerate') : t('playgroundBasic.chat.sendMessage') }}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录面板 (覆盖层) -->
        <transition name="slide-right">
          <div v-if="showHistory" class="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden flex flex-col z-10">
            <div class="p-3 sm:p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
              <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Chat History</h3>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button variant="ghost" size="icon" class="w-11 h-11 sm:w-auto sm:h-auto" :aria-label="t('playgroundBasic.chat.closePanel')" @click="showHistory = false">
                    <X class="w-4 h-4 text-zinc-500"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" :side-offset="6">
                  <p class="text-xs">{{ t('playgroundBasic.chat.closePanel') }}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <ScrollArea class="flex-1">
              <div class="p-3">
                <div v-if="loadingSessions" class="flex items-center justify-center py-8">
                  <Loader2 class="w-5 h-5 animate-spin text-zinc-400"/>
                </div>
                <div v-else-if="sessions.length === 0" class="text-center py-8">
                  <MessageSquare class="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2"/>
                  <p class="text-xs text-zinc-400">No conversations yet</p>
                </div>
                <div v-else class="space-y-1">
                  <button
                      v-for="session in sessions"
                      :key="session.id"
                      class="w-full p-3 rounded-lg text-left transition-colors"
                      :class="[
                    currentSessionId === session.id
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                  ]"
                      @click="loadSession(session)"
                  >
                    <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {{ session.title || 'New conversation' }}
                    </div>
                    <div class="text-xs text-zinc-400 mt-1">{{ formatTime(session.updatedTime) }}</div>
                  </button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </transition>
      </div>
    </div>

    <!-- 记忆面板 -->
    <MemoryPanel
        :open="showMemoryPanel"
        :memories="memoryList"
        :loading="memoryLoading"
        @update:open="showMemoryPanel = $event"
        @search="searchMemories"
        @edit="updateMemory"
        @delete="deleteMemory"
    />
  </TooltipProvider>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted, onUnmounted, nextTick} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {message} from 'ant-design-vue'
import {
  ArrowLeft, MessageSquare, History, Plus, User, Sparkles, ArrowUp, Square,
  Loader2, X, ChevronDown, Check, ImageIcon, SlidersHorizontal, BrainCircuit
} from 'lucide-vue-next'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Slider} from '@/components/ui/slider'
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover'
import {Tooltip, TooltipProvider, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip'
import {Switch} from '@/components/ui/switch'
import {chatApi} from '@/api/playground-basic'
import type {ChatModelConfig, BasicChatMessage, BasicChatSession} from '@/types/playground-basic'
import ProviderIcon from "@/components/ProviderIcon.vue"
import MemoryPanel from "@/components/memory/panel/MemoryPanel.vue"
import { useMemory } from '@/composables/useMemory'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// 状态
const loadingModels = ref(false)
const loadingSessions = ref(false)
const models = ref<ChatModelConfig[]>([])
const sessions = ref<BasicChatSession[]>([])
const selectedModel = ref<string>()
const messages = ref<BasicChatMessage[]>([])
const inputMessage = ref('')
const streaming = ref(false)
const streamingContent = ref('')
const showHistory = ref(false)
const showModelDropdown = ref(false)
const showParamsPanel = ref(false)
const messagesContainer = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()

// URL 持久化：会话 ID 从 URL 读取（保持 URL 是唯一数据源）
const currentSessionId = computed(() => route.params.sessionId as string | undefined)

// URL 变化时自动加载对应会话
watch(currentSessionId, async (newSessionId) => {
  if (!newSessionId) {
    // 无 sessionId 时清空当前会话
    messages.value = []
    inputMessage.value = ''
    attachments.value = []
    totalInputTokens.value = 0
    totalOutputTokens.value = 0
    return
  }

  // 加载会话消息
  try {
    const res = await chatApi.getMessages(newSessionId)
    if (res.code === 200) {
      messages.value = res.data
      // 计算历史消息的 token 统计
      totalInputTokens.value = res.data.reduce((sum, msg) => sum + (msg.inputTokens || 0), 0)
      totalOutputTokens.value = res.data.reduce((sum, msg) => sum + (msg.outputTokens || 0), 0)
      await nextTick()
      scrollToBottom()
    }
  } catch {
    message.error('Failed to load conversation')
  }
}, { immediate: true })
// 移除 local state，改为从 URL 读取
// const currentSessionId = ref<string>()

// LLM API 参数
const temperature = ref(0.7)
const maxTokens = ref(2048)
const topP = ref(1)
const frequencyPenalty = ref(0)
const presencePenalty = ref(0)
const systemPrompt = ref('')

// AbortController 用于取消流式请求
let abortController: AbortController | null = null

// 记忆优化（localStorage 封装）
const MEMORY_STORAGE_KEY = 'volo_ai_playground_memory_enabled'
const enableMemory = ref(localStorage.getItem(MEMORY_STORAGE_KEY) === 'true')
watch(enableMemory, (val) => {
  localStorage.setItem(MEMORY_STORAGE_KEY, String(val))
})

// 记忆管理（composable）
const {
  memories: memoryList,
  showMemoryPanel,
  memoryLoading,
  openMemoryPanel,
  searchMemories,
  updateMemory,
  deleteMemory
} = useMemory()

// Token 统计
const totalInputTokens = ref(0)
const totalOutputTokens = ref(0)

// 上下文 Token 计算
// 已用上下文 = 累计的 (input + output) tokens
const usedContextTokens = computed(() => totalInputTokens.value + totalOutputTokens.value)

// 当前模型的最大上下文窗口
const maxContextTokens = computed(() => currentModel.value?.contentWindow || 128000)

// 上下文使用进度 (0-1)
const contextProgress = computed(() => {
  if (maxContextTokens.value === 0) return 0
  return Math.min(usedContextTokens.value / maxContextTokens.value, 1)
})

// 上下文使用百分比
const contextPercentage = computed(() => Math.round(contextProgress.value * 100))

// 进度条颜色（根据使用率变化）
const contextProgressColor = computed(() => {
  const percent = contextPercentage.value
  if (percent >= 90) return 'text-red-500'
  if (percent >= 70) return 'text-amber-500'
  return 'text-emerald-500'
})

// 格式化 token 数量
const formatTokenCount = (tokens: number): string => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`
  return tokens.toString()
}

// 附件管理
const attachments = ref<Array<{
  file: File
  preview: string
  type: string
}>>([])

// 预设方案
const presets = [
  {name: 'Precise', temperature: 0.2, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0},
  {name: 'Balanced', temperature: 0.7, topP: 0.9, frequencyPenalty: 0.2, presencePenalty: 0.2},
  {name: 'Creative', temperature: 1.2, topP: 0.95, frequencyPenalty: 0.5, presencePenalty: 0.5},
  {name: 'Code', temperature: 0.3, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0},
]

// 应用预设
const applyPreset = (preset: typeof presets[0]) => {
  temperature.value = preset.temperature
  topP.value = preset.topP
  frequencyPenalty.value = preset.frequencyPenalty
  presencePenalty.value = preset.presencePenalty
}

// 是否可以发送
const canSend = computed(() => {
  return (inputMessage.value.trim() || attachments.value.length > 0) && selectedModel.value && !streaming.value
})

// Slider 需要数组格式
const temperatureArray = computed({
  get: () => [temperature.value],
  set: (val) => {
    temperature.value = val[0]
  }
})

const maxTokensArray = computed({
  get: () => [maxTokens.value],
  set: (val) => {
    maxTokens.value = val[0]
  }
})

const topPArray = computed({
  get: () => [topP.value],
  set: (val) => {
    topP.value = val[0]
  }
})

const frequencyPenaltyArray = computed({
  get: () => [frequencyPenalty.value],
  set: (val) => {
    frequencyPenalty.value = val[0]
  }
})

const presencePenaltyArray = computed({
  get: () => [presencePenalty.value],
  set: (val) => {
    presencePenalty.value = val[0]
  }
})

// 当前选中模型
const currentModel = computed(() => {
  if (!selectedModel.value) return null
  return models.value.find(m => m.id === selectedModel.value) || null
})

// 快捷提示
const quickPrompts = [
  'Write some code',
  'Explain a concept',
  'Translate text',
  'Summarize content'
]

// 格式化上下文窗口
const formatContext = (tokens: number) => {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M ctx`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}k ctx`
  return `${tokens} ctx`
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return

  for (const file of input.files) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        attachments.value.push({
          file,
          preview: e.target?.result as string,
          type: file.type
        })
      }
      reader.readAsDataURL(file)
    }
  }
  input.value = '' // 重置 input
}

// 移除附件
const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

// 返回
const goBack = () => {
  // 关闭所有打开的弹出层，避免 Portal 残留导致路由渲染问题
  showModelDropdown.value = false
  showParamsPanel.value = false
  showHistory.value = false
  router.push('/playground')
}

// 新对话
const newSession = async () => {
  // 清理当前会话状态（通过 URL 持久化机制自动清空）
  await router.replace({ name: 'BasicChat' })
}

// 选择模型
const selectModel = (model: ChatModelConfig) => {
  selectedModel.value = model.id
  showModelDropdown.value = false
}

// 加载模型列表
const loadModels = async () => {
  loadingModels.value = true
  try {
    const res = await chatApi.getModels()
    if (res.code === 200) {
      models.value = res.data
      if (res.data.length > 0) {
        selectedModel.value = res.data[0].id
      }
    }
  } catch {
    message.error('Failed to load models')
  } finally {
    loadingModels.value = false
  }
}

// 加载会话列表
const loadSessions = async () => {
  loadingSessions.value = true
  try {
    const res = await chatApi.getSessions()
    if (res.code === 200) {
      sessions.value = res.data
    }
  } catch {
    // 静默失败
  } finally {
    loadingSessions.value = false
  }
}

// 加载会话（通过 URL 持久化）
const loadSession = async (session: BasicChatSession) => {
  // 更新 URL，触发 watch 自动加载
  await router.push({ name: 'BasicChat', params: { sessionId: session.id } })
}

// 停止生成
const stopGeneration = () => {
  abortController?.abort()
  abortController = null
}

// 发送消息
const sendMessage = async () => {
  if (!canSend.value) return

  // 构建 attachments 对象数组（F3: 图片放入 attachments 字段）
  const messageAttachments: Array<{ type: string; url: string; name?: string }> = []
  for (const attachment of attachments.value) {
    if (attachment.type.startsWith('image/')) {
      messageAttachments.push({
        type: 'image',
        url: attachment.preview,
        name: attachment.file.name
      })
    }
  }

  // message 字段始终为纯文本字符串
  const messageText = inputMessage.value.trim() || (messageAttachments.length > 0 ? '[Image]' : '')

  const userMessage: BasicChatMessage = {
    id: `user-${Date.now()}`,
    sessionId: currentSessionId.value || '',
    role: 'user',
    content: messageText,
    attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    inputTokens: 0,
    outputTokens: 0,
    creditsCharged: 0,
    createdTime: new Date().toISOString()
  }
  messages.value.push(userMessage)

  inputMessage.value = ''
  attachments.value = []
  streaming.value = true
  streamingContent.value = ''

  // 创建 AbortController（L2）
  abortController = new AbortController()

  await nextTick()
  scrollToBottom()

  try {
    // 使用带认证的请求头
    const response = await fetch(chatApi.getStreamUrl(), {
      method: 'POST',
      headers: chatApi.getStreamHeaders(),
      signal: abortController.signal,
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        modelId: selectedModel.value,
        message: messageText,
        attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
        temperature: temperature.value,
        maxTokens: maxTokens.value,
        topP: topP.value,
        frequencyPenalty: frequencyPenalty.value,
        presencePenalty: presencePenalty.value,
        systemPrompt: systemPrompt.value || undefined,
        enableMemoryOptimization: enableMemory.value || undefined
      })
    })

    if (!response.ok) {
      if (response.status === 401) {
        message.error('Session expired, please login again')
        router.push('/')
        return
      }
      throw new Error('Request failed')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    let responseInputTokens = 0
    let responseOutputTokens = 0
    let responseCreditsCharged = 0

    if (reader) {
      // SSE 解析缓冲区（C8: 处理跨 chunk 的 data: 行）
      let sseBuffer = ''

      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        sseBuffer += chunk
        const lines = sseBuffer.split('\n')

        // 保留最后一行（可能是不完整的行）
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5))
              if (data.type === 'STARTED' && data.sessionId) {
                // URL 持久化：新创建的会话需要同步到 URL
                if (!currentSessionId.value) {
                  await router.replace({ name: 'BasicChat', params: { sessionId: data.sessionId } })
                }
              } else if (data.type === 'CONTENT' && data.content) {
                streamingContent.value += data.content
                scrollToBottom()
              } else if (data.type === 'DONE') {
                // F1: 使用 DONE（非 COMPLETED），读取正确的 token 统计字段
                responseInputTokens = data.inputTokens || 0
                responseOutputTokens = data.outputTokens || 0
                responseCreditsCharged = data.creditsCharged || 0
                totalInputTokens.value += responseInputTokens
                totalOutputTokens.value += responseOutputTokens
              } else if (data.type === 'ERROR') {
                // F1: 使用 data.error（非 data.errorMessage）
                message.error(data.error || 'Generation failed')
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // C8: 处理 buffer 中残留的最后一条数据
      if (sseBuffer.startsWith('data:')) {
        try {
          const data = JSON.parse(sseBuffer.slice(5))
          if (data.type === 'CONTENT' && data.content) {
            streamingContent.value += data.content
          } else if (data.type === 'DONE') {
            responseInputTokens = data.inputTokens || 0
            responseOutputTokens = data.outputTokens || 0
            responseCreditsCharged = data.creditsCharged || 0
            totalInputTokens.value += responseInputTokens
            totalOutputTokens.value += responseOutputTokens
          } else if (data.type === 'ERROR') {
            message.error(data.error || 'Generation failed')
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    if (streamingContent.value) {
      const assistantMessage: BasicChatMessage = {
        id: `assistant-${Date.now()}`,
        sessionId: currentSessionId.value || '',
        role: 'assistant',
        content: streamingContent.value,
        inputTokens: responseInputTokens,
        outputTokens: responseOutputTokens,
        creditsCharged: responseCreditsCharged,
        createdTime: new Date().toISOString()
      }
      messages.value.push(assistantMessage)
    }

    // 刷新会话列表
    loadSessions()
  } catch (err: unknown) {
    // AbortError 是用户主动取消，不提示错误
    if (err instanceof DOMException && err.name === 'AbortError') {
      // 用户主动停止，将已生成的内容保存为消息
      if (streamingContent.value) {
        const assistantMessage: BasicChatMessage = {
          id: `assistant-${Date.now()}`,
          sessionId: currentSessionId.value || '',
          role: 'assistant',
          content: streamingContent.value,
          inputTokens: 0,
          outputTokens: 0,
          creditsCharged: 0,
          createdTime: new Date().toISOString()
        }
        messages.value.push(assistantMessage)
      }
    } else {
      message.error('Failed to send message')
    }
  } finally {
    streaming.value = false
    streamingContent.value = ''
    abortController = null
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  loadModels()
  loadSessions()
})

// L2: 组件卸载时取消进行中的流式请求
onUnmounted(() => {
  abortController?.abort()
  abortController = null
})
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.2s var(--ease-fluid);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
