<script setup lang="ts">
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import gsap from 'gsap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useKnowledgeChat } from '../composables/useKnowledgeChat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  datasetIds: string[]
  knowledgeBaseName: string
}>()

const datasetIdsRef = computed(() => props.datasetIds)

const { messages, isStreaming, error, sendMessage, clearMessages } = useKnowledgeChat({
  datasetIds: datasetIdsRef,
})

const { prefersReduced } = useReducedMotion()

const isOpen = ref(false)
const inputText = ref('')
const messagesContainerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const fabRef = ref<HTMLElement | null>(null)

// --- Panel open/close with GSAP (respects prefers-reduced-motion) ---
function openPanel() {
  isOpen.value = true
  nextTick(() => {
    if (panelRef.value) {
      if (prefersReduced.value) {
        gsap.set(panelRef.value, { x: 0, opacity: 1 })
      } else {
        gsap.fromTo(
          panelRef.value,
          { x: 400, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
        )
      }
    }
    if (fabRef.value) {
      gsap.set(fabRef.value, { scale: 0, opacity: 0 })
    }
    scrollToBottom()
  })
}

function closePanel() {
  if (prefersReduced.value) {
    isOpen.value = false
    return
  }
  if (panelRef.value) {
    gsap.to(panelRef.value, {
      x: 400,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        isOpen.value = false
        nextTick(() => {
          if (fabRef.value) {
            gsap.fromTo(
              fabRef.value,
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(1.4)' },
            )
          }
        })
      },
    })
  } else {
    isOpen.value = false
  }
}

// --- Scroll ---
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  })
}

// Auto scroll when messages change
watch(
  () => messages.value.length,
  () => scrollToBottom(),
)
watch(
  () => messages.value[messages.value.length - 1]?.content,
  () => scrollToBottom(),
)

// --- Send ---
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return
  inputText.value = ''
  await sendMessage(text)
}

function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// Escape closes the panel from anywhere
function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closePanel()
  }
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('keydown', handleGlobalKeydown)
  } else {
    document.removeEventListener('keydown', handleGlobalKeydown)
  }
})

const isSendDisabled = computed(() => !inputText.value.trim() || isStreaming.value)

// --- Cleanup ---
onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  if (panelRef.value) gsap.killTweensOf(panelRef.value)
  if (fabRef.value) gsap.killTweensOf(fabRef.value)
  clearMessages()
})
</script>

<template>
  <!-- Floating Action Button -->
  <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          v-if="!isOpen"
          ref="fabRef"
          class="fixed bottom-6 right-6 z-50 min-h-[44px] min-w-[44px] w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl active:scale-95 transition-shadow"
          :aria-label="t('knowledge.chat.openAssistant')"
          @click="openPanel"
        >
          <MessageCircle :size="22" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" :side-offset="8">{{ t('knowledge.chat.assistantName') }}</TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <!-- Chat Panel -->
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="panelRef"
      class="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] z-50 flex flex-col backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border-l border-white/40 dark:border-zinc-700/40 shadow-2xl"
    >
      <!-- Header -->
      <div class="h-14 px-5 flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-700/60 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center">
            <Bot :size="16" class="text-white" />
          </div>
          <div>
            <div class="text-[0.8125rem] font-bold text-slate-800 dark:text-zinc-100">{{ t('knowledge.chat.assistantName') }}</div>
            <div class="text-xs text-slate-400 dark:text-zinc-500">{{ knowledgeBaseName }}</div>
          </div>
        </div>
        <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100/60 dark:hover:bg-zinc-800/60 active:scale-95 transition-all"
                :aria-label="t('knowledge.chat.closePanel')"
                @click="closePanel"
              >
                <X :size="18" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6">{{ t('knowledge.chat.closeTooltip') }}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <!-- Messages -->
      <div
        ref="messagesContainerRef"
        class="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar"
        role="log"
        aria-live="polite"
        :aria-label="t('knowledge.chat.dialogMessages')"
      >
        <!-- Welcome message -->
        <div v-if="messages.length === 0" class="flex items-start gap-3 pt-4">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shrink-0">
            <Bot :size="16" class="text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100/80 dark:bg-zinc-800/80 text-[0.8125rem] text-slate-700 dark:text-zinc-200 leading-relaxed">
              {{ t('knowledge.chat.welcome') }}
            </div>
          </div>
        </div>

        <!-- Message list -->
        <template v-for="msg in messages" :key="msg.id">
          <!-- User message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="flex items-start gap-3 max-w-[85%] flex-row-reverse">
              <div class="w-8 h-8 rounded-lg bg-slate-700 dark:bg-zinc-600 flex items-center justify-center shrink-0">
                <User :size="16" class="text-white" />
              </div>
              <div class="px-4 py-3 rounded-2xl rounded-tr-md bg-slate-800 dark:bg-zinc-700 text-white text-[0.8125rem] leading-relaxed">
                {{ msg.content }}
              </div>
            </div>
          </div>

          <!-- Assistant message -->
          <div v-else-if="msg.role === 'assistant'" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shrink-0">
              <Bot :size="16" class="text-white" />
            </div>
            <div class="flex-1 min-w-0 space-y-2">
              <div class="px-4 py-3 rounded-2xl rounded-tl-md bg-slate-100/80 dark:bg-zinc-800/80 text-[0.8125rem] text-slate-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                <template v-if="msg.content">{{ msg.content }}</template>
                <span v-else class="inline-flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
                  <Loader2 :size="14" class="animate-spin" />
                  <span>{{ t('knowledge.chat.thinking') }}</span>
                </span>
              </div>
              <!-- Sources -->
              <div v-if="msg.sources && msg.sources.length > 0" class="flex flex-wrap gap-1.5 px-1">
                <span
                  v-for="(source, idx) in msg.sources"
                  :key="idx"
                  class="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50"
                  :title="source.content"
                >
                  {{ t('knowledge.chat.citation', { index: idx + 1, similarity: (source.similarity * 100).toFixed(0) }) }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Streaming indicator -->
        <div v-if="isStreaming && messages.length > 0 && messages[messages.length - 1]?.content" class="flex items-center gap-2 px-2">
          <Loader2 :size="12" class="animate-spin text-emerald-500" />
          <span class="text-xs text-slate-400 dark:text-zinc-500">{{ t('knowledge.chat.generating') }}</span>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="px-4 py-2 bg-destructive/5 dark:bg-destructive/10 border-t border-destructive/20 flex items-center justify-between gap-2">
        <div class="text-xs text-destructive flex-1">{{ error }}</div>
        <button class="shrink-0 text-destructive/60 hover:text-destructive active:scale-95 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all" :aria-label="t('knowledge.chat.closeError')" @click="error = null">
          <X :size="14" />
        </button>
      </div>

      <!-- Input -->
      <div class="px-4 py-3 border-t border-slate-200/60 dark:border-zinc-700/60 shrink-0">
        <div class="flex items-end gap-2">
          <textarea
            v-model="inputText"
            :disabled="isStreaming"
            class="flex-1 min-h-[44px] max-h-[120px] px-4 py-3 bg-slate-100/60 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-zinc-700/50 rounded-2xl text-[0.8125rem] text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none resize-none transition-all focus:border-emerald-300 focus:bg-white dark:focus:bg-zinc-800 disabled:opacity-60"
            :placeholder="t('knowledge.chat.inputPlaceholder')"
            rows="1"
            @keydown="handleInputKeydown"
          />
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  :disabled="isSendDisabled"
                  :class="[
                    'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all active:scale-95',
                    isSendDisabled
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
                  ]"
                  :aria-label="t('knowledge.chat.sendMessage')"
                  @click="handleSend"
                >
                  <Loader2 v-if="isStreaming" :size="18" class="animate-spin" />
                  <Send v-else :size="18" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">{{ t('knowledge.chat.send') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
</style>

<style lang="scss">
.dark {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
