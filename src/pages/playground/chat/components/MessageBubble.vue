<script setup lang="ts">
/**
 * MessageBubble — V3 共生风格
 * AI: 左对齐 + soul-line 竖线 accent
 * User: 右对齐纯文字
 */
import { computed, ref, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { Copy, Check } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import DOMPurify from 'dompurify'
import type { Message } from '../types'

const { t } = useI18n()

const props = defineProps<{
  message: Message
}>()

const copied = ref(false)
const copyBtnRef = ref<HTMLButtonElement>()
const isUser = computed(() => props.message.role === 'user')

const timeLabel = computed(() => {
  const d = props.message.timestamp
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

/** 对内容进行 sanitize，防止 XSS */
function sanitize(html: string): string {
  return DOMPurify.sanitize(html)
}

/** 流式渲染时的 sanitized 内容 */
const sanitizedStreamingContent = computed(() =>
  sanitize(props.message.content.replace(/\n/g, '<br/>')),
)

/** 非流式渲染时的 sanitized 段落 */
const sanitizedParagraphs = computed(() =>
  props.message.content
    .split('\n')
    .filter(Boolean)
    .map((para) => sanitize(para)),
)

async function copyContent() {
  if (copied.value) return  // Guard: 防 2s 冷却期内重复触发
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    // 成功确认动效：scale pulse
    nextTick(() => {
      if (copyBtnRef.value) {
        gsap.timeline()
          .to(copyBtnRef.value, { scale: 1.3, duration: 0.15, ease: 'power2.out' })
          .to(copyBtnRef.value, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
      }
    })
    setTimeout(() => (copied.value = false), 2000)
  } catch (err) {
    console.error('[MessageBubble] 复制失败:', err)
  }
}

onUnmounted(() => {
  if (copyBtnRef.value) gsap.killTweensOf(copyBtnRef.value)
})
</script>

<template>
  <div class="msg" :class="{ assistant: !isUser, user: isUser }">
    <!-- AI Avatar — only for assistant messages -->
    <div v-if="!isUser" class="msg-avatar">
      <img src="/logo.png" alt="AI" class="msg-avatar-img" />
    </div>

    <div class="msg-body">
      <div class="msg-bubble">
        <template v-if="message.isStreaming && !isUser">
          <span v-html="sanitizedStreamingContent"></span>
          <span class="streaming-cursor"></span>
        </template>
        <template v-else>
          <p
            v-for="(para, i) in sanitizedParagraphs"
            :key="i"
            v-html="para"
          ></p>
        </template>
      </div>

      <div class="msg-time">
        {{ timeLabel }}
        <TooltipProvider v-if="!isUser && !message.isStreaming" :delay-duration="300" :skip-delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                ref="copyBtnRef"
                class="copy-btn"
                :aria-label="copied ? t('playgroundChat.messageBubble.copied') : t('playgroundChat.messageBubble.copyContent')"
                @click="copyContent"
              >
                <Check v-if="copied" :size="12" />
                <Copy v-else :size="12" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="6">
              {{ copied ? t('playgroundChat.messageBubble.copied') : t('playgroundChat.messageBubble.copy') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: msg-appear 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes msg-appear {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ═══ Avatar ═══ */
.msg-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 18px;
  background: var(--soul-soft, rgba(107,154,152,0.10));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  margin-top: 2px;
}
.msg-avatar-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.msg-body {
  flex: 1;
  min-width: 0;
  max-width: 520px;
}

/* ═══ Bubble ═══ */
.msg-bubble {
  font-size: 1rem;
  line-height: 1.7;
  letter-spacing: -0.01em;
  padding: 12px 16px;
  border-radius: 12px;
}
.msg-bubble p { margin-bottom: 0.5em; }
.msg-bubble p:last-child { margin-bottom: 0; }

/* AI — light bubble */
.msg.assistant .msg-bubble {
  background: var(--paper-warm, #F5F3EE);
  color: var(--ink, #2D2B29);
}

/* User — dark bubble, right-aligned */
.msg.user {
  flex-direction: row-reverse;
}
.msg.user .msg-body {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.msg.user .msg-bubble {
  background: var(--ink, #2D2B29);
  color: #fff;
  max-width: 100%;
}
.msg.user .msg-time {
  justify-content: flex-end;
}

/* ═══ 时间戳 ═══ */
.msg-time {
  font-size: 0.75rem;
  color: rgba(45,43,41,0.25);
  margin-top: 6px;
  padding-left: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  display: flex; align-items: center; gap: 6px;
}
.msg:hover .msg-time { opacity: 1; }

.copy-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 4px;
  color: rgba(45,43,41,0.25);
  cursor: pointer; border: none; background: none;
  transition: all 0.15s;
  position: relative;
}
.copy-btn::before {
  content: '';
  position: absolute;
  inset: -12px;
}
.copy-btn:hover {
  color: rgba(45,43,41,0.6);
  background: rgba(45,43,41,0.08);
}
.copy-btn:active { transform: scale(0.92); }

.streaming-cursor {
  display: inline-block; width: 2px; height: 1em;
  background: var(--soul, #6B9A98);
  margin-left: 2px; vertical-align: text-bottom;
  animation: cursor-blink 1.2s ease-in-out infinite;
  border-radius: 1px;
}
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}

@media (min-width: 1024px) {
  .msg-bubble { font-size: 1rem; line-height: 1.75; }
  .msg-body { max-width: 560px; }
}

@media (max-width: 640px) {
  .msg-body { max-width: 85%; }
  .msg-avatar { width: 30px; height: 30px; min-width: 30px; border-radius: 15px; }
  .msg-avatar-img { width: 18px; height: 18px; }
}

/* ═══ Reduced Motion ═══ */
@media (prefers-reduced-motion: reduce) {
  .msg { animation: none; }
  .streaming-cursor { animation: none; opacity: 0.6; }
}
</style>

<!-- ═══ 暗色模式（非 scoped，避免 Vue SFC :global 编译 Bug） ═══ -->
<style>
.dark .msg.assistant .msg-bubble {
  background: rgba(255,255,255,0.06);
  color: rgba(224,231,235,0.9);
}
.dark .msg.user .msg-bubble {
  background: rgba(224,231,235,0.85);
  color: #1a1a1a;
}
.dark .msg-avatar {
  background: rgba(124,183,180,0.12);
}
.dark .msg-time {
  color: rgba(224,231,235,0.2);
}
.dark .copy-btn {
  color: rgba(224,231,235,0.2);
}
.dark .copy-btn:hover {
  color: rgba(224,231,235,0.6);
  background: rgba(255,255,255,0.06);
}
.dark .streaming-cursor {
  background: rgba(124,183,180,0.8);
}
</style>
