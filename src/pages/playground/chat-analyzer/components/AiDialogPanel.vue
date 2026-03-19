<script setup lang="ts">
/**
 * AiDialogPanel - AI 对话区主体
 *
 * 消息列表 + 模式切换 + 输入框 + 发送按钮
 */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp, Loader2, Square } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import { useAiDialog } from '../composables/useAiDialog'
import AiMessageBubble from './AiMessageBubble.vue'
import ModeSwitch from './ModeSwitch.vue'
import gsap from 'gsap'

const { t } = useI18n()
const store = useChatAnalyzerStore()

const {
  inputText,
  isStreaming,
  canSend,
  sendMessage,
  stopStream,
  switchMode,
} = useAiDialog()

const messagesEndRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const dialogMessages = computed(() => store.activeDialogMessages)
const contactName = computed(() => store.activeContact?.name ?? t('chatAnalyzer.aiDialog.otherFallback'))

// Auto-scroll to bottom when new messages arrive
watch(
  () => dialogMessages.value.length,
  () => {
    nextTick(() => {
      messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
    })
  },
)

// Also scroll when streaming content updates
watch(
  () => {
    const msgs = dialogMessages.value
    return msgs.length > 0 ? msgs[msgs.length - 1]?.content : ''
  },
  () => {
    nextTick(() => {
      messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
    })
  },
)

function handleKeydown(e: KeyboardEvent) {
  // H7: Enter 或 Ctrl+Enter 均可发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  if (!canSend.value) return
  sendMessage()
}

const prefersReduced = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Entrance animation (respects prefers-reduced-motion)
onMounted(() => {
  if (!panelRef.value || prefersReduced) return
  gsap.from(panelRef.value, {
    y: 12,
    opacity: 0,
    duration: 0.35,
    ease: 'power2.out',
  })
})

onUnmounted(() => {
  if (panelRef.value) gsap.killTweensOf(panelRef.value)
})
</script>

<template>
  <div ref="panelRef" class="flex flex-col h-full min-h-0">
    <!-- Mode switch bar -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-border">
      <ModeSwitch
        :disabled="isStreaming"
        @switch="switchMode"
      />
      <span class="text-xs text-muted-foreground">
        {{ t('chatAnalyzer.aiDialog.dialogCount', { count: dialogMessages.length }) }}
      </span>
    </div>

    <!-- H1: 屏幕阅读器流式状态通知 -->
    <div aria-live="assertive" class="sr-only">
      <span v-if="isStreaming">{{ t('chatAnalyzer.aiDialog.streamingAria') }}</span>
    </div>

    <!-- Messages area -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="p-3" role="log" aria-live="polite" :aria-label="t('chatAnalyzer.aiDialog.aiDialogAria')">
        <!-- Empty state -->
        <div
          v-if="dialogMessages.length === 0"
          class="flex items-center justify-center h-32"
        >
          <p class="text-base text-muted-foreground text-center">
            {{ store.dialogMode === 'advisor'
              ? t('chatAnalyzer.aiDialog.advisorEmpty')
              : t('chatAnalyzer.aiDialog.simulatorEmpty', { name: contactName }) }}
          </p>
        </div>

        <!-- Message list -->
        <AiMessageBubble
          v-for="(msg, idx) in dialogMessages"
          :key="msg.id"
          :message="msg"
          :simulated-name="contactName"
          :is-streaming="isStreaming && idx === dialogMessages.length - 1 && msg.role !== 'user'"
        />

        <div ref="messagesEndRef" />
      </div>
    </ScrollArea>

    <!-- Input area -->
    <div class="shrink-0 p-3 border-t border-border bg-background">
      <div
        class="relative rounded-xl bg-muted focus-within:ring-2 focus-within:ring-primary-500/20"
      >
        <Textarea
          v-model="inputText"
          :placeholder="store.dialogMode === 'advisor'
            ? t('chatAnalyzer.aiDialog.advisorPlaceholder')
            : t('chatAnalyzer.aiDialog.simulatorPlaceholder', { name: contactName })"
          :aria-label="t('chatAnalyzer.aiDialog.inputAria')"
          class="w-full min-h-[44px] max-h-[120px] px-3 pt-2.5 pb-10 bg-transparent border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          :rows="1"
          @keydown="handleKeydown"
        />

        <div class="absolute bottom-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between">
          <span class="text-xs text-muted-foreground">
            {{ inputText.length > 0 ? t('chatAnalyzer.aiDialog.charCount', { count: inputText.length }) : t('chatAnalyzer.aiDialog.inputHint') }}
          </span>

          <div class="flex items-center gap-1.5">
            <!-- Stop button -->
            <Tooltip v-if="isStreaming">
              <TooltipTrigger as-child>
                <Button
                  size="icon"
                  variant="ghost"
                  class="w-8 h-8 min-w-[44px] min-h-[44px] active:scale-95"
                  :aria-label="t('chatAnalyzer.aiDialog.stopGenerate')"
                  @click="stopStream"
                >
                  <Square :size="14" class="text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="4">{{ t('chatAnalyzer.aiDialog.stopGenerate') }}</TooltipContent>
            </Tooltip>

            <!-- Send button -->
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  size="icon"
                  class="w-8 h-8 min-w-[44px] min-h-[44px] rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-muted disabled:text-muted-foreground active:scale-95"
                  :disabled="!canSend"
                  :aria-label="isStreaming ? t('chatAnalyzer.aiDialog.generating') : t('chatAnalyzer.aiDialog.sendLabel')"
                  @click="handleSend"
                >
                  <Loader2 v-if="isStreaming" :size="14" class="text-white animate-spin" />
                  <ArrowUp v-else :size="14" class="text-white" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="4">
                {{ isStreaming ? t('chatAnalyzer.aiDialog.generating') : t('chatAnalyzer.aiDialog.sendTooltip') }}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
