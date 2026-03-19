<script setup lang="ts">
/**
 * ChatArea — V3 共生风格对话区域
 * 排版优先，含里程碑标记和呼吸圆点思考态
 */
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { gsap } from 'gsap'
import { Flag } from 'lucide-vue-next'
import MessageBubble from './MessageBubble.vue'
import type { Message } from '../types'

const props = defineProps<{
  messages: readonly Message[]
  isStreaming: boolean
  hasMore?: boolean
  /** 加载更多回调（返回 Promise，await 后恢复滚动位置） */
  onLoadMore?: () => Promise<void>
}>()

const { t } = useI18n()
const containerRef = ref<HTMLElement>()
const prevMessageCount = ref(0)
const isLoadingMore = ref(false)

function scrollToBottom(smooth = true) {
  const el = containerRef.value
  if (!el) return
  if (smooth) {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  } else {
    el.scrollTop = el.scrollHeight
  }
}

function animateLastMessage() {
  const el = containerRef.value
  if (!el) return
  const items = el.querySelectorAll('.msg-item')
  const last = items[items.length - 1]
  if (!last) return

  const isUser = last.classList.contains('is-user')
  gsap.fromTo(
    last,
    { opacity: 0, x: isUser ? 20 : -20, y: 8 },
    { opacity: 1, x: 0, y: 0, duration: 0.35, ease: 'power2.out' },
  )
}

watch(
  () => props.messages.length,
  (newLen) => {
    if (newLen > prevMessageCount.value) {
      nextTick(() => {
        animateLastMessage()
        scrollToBottom()
      })
    }
    prevMessageCount.value = newLen
  },
)

watch(
  () => props.isStreaming && props.messages.length > 0 && props.messages[props.messages.length - 1]?.content,
  () => {
    if (props.isStreaming) {
      nextTick(() => scrollToBottom(false))
    }
  },
)

async function handleScroll() {
  const el = containerRef.value
  if (!el || !props.hasMore || isLoadingMore.value || !props.onLoadMore) return
  if (el.scrollTop < 80) {
    isLoadingMore.value = true
    const oldScrollHeight = el.scrollHeight
    try {
      await props.onLoadMore()
      await nextTick()
      el.scrollTop = el.scrollHeight - oldScrollHeight
    } finally {
      setTimeout(() => { isLoadingMore.value = false }, 300)
    }
  }
}

onMounted(() => nextTick(() => scrollToBottom(false)))

onUnmounted(() => {
  if (containerRef.value) gsap.killTweensOf(containerRef.value.querySelectorAll('.msg-item'))
})

defineExpose({ scrollToBottom })
</script>

<template>
  <div ref="containerRef" class="conversation" role="log" aria-live="polite" :aria-label="t('playgroundChat.chatArea.ariaLabel')" @scroll="handleScroll">
    <div class="conversation-inner">
      <!-- 加载更多指示器 -->
      <div v-if="isLoadingMore" class="load-more-indicator">
        <span class="load-dot"></span>
        <span class="load-dot"></span>
        <span class="load-dot"></span>
        {{ t('playgroundChat.chatArea.loading') }}
      </div>

      <!-- 里程碑标记 -->
      <div class="milestone">
        <span class="milestone-label">
          <Flag :size="10" :stroke-width="2" />
          {{ t('playgroundChat.chatArea.memoryArchive') }} · {{ new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) }}
        </span>
      </div>

      <!-- 消息列表 -->
      <template v-for="msg in messages" :key="msg.id">
        <!-- Checkpoint 分隔符 -->
        <div v-if="msg.role === 'checkpoint'" class="milestone checkpoint">
          <span class="milestone-label">
            <Flag :size="10" :stroke-width="2" />
            {{ msg.content || t('playgroundChat.chatArea.chatMemoryReset') }}
          </span>
        </div>
        <!-- 普通消息 -->
        <div
          v-else
          class="msg-item"
          :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
        >
          <MessageBubble :message="msg" />
        </div>
      </template>

      <!-- 思考指示器 — 呼吸圆点 -->
      <div
        v-if="isStreaming && messages.length > 0 && !messages[messages.length - 1]?.content"
        class="thinking-state"
        aria-live="assertive"
        :aria-label="t('playgroundChat.chatArea.aiThinking')"
      >
        <div class="thinking-breath">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation {
  flex: 1; overflow-y: auto;
  padding: 0 24px;
  scroll-behavior: smooth;
}
.conversation-inner {
  max-width: 840px;
  margin: 0 auto;
  padding: 24px 0 64px;
}

/* 加载更多指示器 */
.load-more-indicator {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 12px 0;
  font-size: 0.75rem;
  color: var(--ink-soft, rgba(45,43,41,0.6));
  font-family: var(--font-sans);
  letter-spacing: 0.5px;
}
.load-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--soul, #6B9A98);
  opacity: 0.4;
  animation: load-bounce 1.2s ease-in-out infinite;
}
.load-dot:nth-child(2) { animation-delay: 0.15s; }
.load-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes load-bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.3; }
  40% { transform: scale(1.2); opacity: 0.7; }
}

/* 里程碑 */
.milestone {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 24px 0; opacity: 0.5;
  transition: opacity 0.15s;
}
.milestone:hover { opacity: 0.8; }
.milestone.checkpoint { opacity: 0.6; }
.milestone::before, .milestone::after {
  content: ''; flex: 1; max-width: 60px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--soul, #6B9A98), transparent);
  opacity: 0.3;
}
.milestone-label {
  font-family: var(--font-sans);
  font-size: 0.75rem; font-weight: 500;
  color: var(--soul, #6B9A98);
  letter-spacing: 0.5px; white-space: nowrap;
  display: flex; align-items: center; gap: 4px;
}

/* 思考呼吸圆点 */
.thinking-state {
  display: flex; align-items: center; justify-content: center;
  padding: 16px 0;
}
.thinking-breath {
  display: flex; gap: 6px; align-items: center;
}
.thinking-breath span {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--soul, #6B9A98);
  opacity: 0.25;
  animation: breath-dot 8s cubic-bezier(0.4,0,0.2,1) infinite;
}
.thinking-breath span:nth-child(2) { animation-delay: 0.6s; }
.thinking-breath span:nth-child(3) { animation-delay: 1.2s; }
@keyframes breath-dot {
  0%, 100% { transform: scale(1); opacity: 0.15; }
  50%      { transform: scale(1.6); opacity: 0.5; }
}

/* 滚动条 */
.conversation::-webkit-scrollbar { width: 2px; }
.conversation::-webkit-scrollbar-track { background: transparent; }
.conversation::-webkit-scrollbar-thumb { background: rgba(45,43,41,0.08); border-radius: 2px; }
.conversation::-webkit-scrollbar-thumb:hover { background: rgba(45,43,41,0.25); }

@media (min-width: 1024px) {
  .conversation-inner { max-width: 900px; }
  .conversation { padding: 0 32px; }
}
@media (max-width: 640px) {
  .conversation { padding: 0 12px; }
}

/* ═══ Reduced Motion ═══ */
@media (prefers-reduced-motion: reduce) {
  .thinking-breath span { animation: none; opacity: 0.35; }
  .load-dot { animation: none; opacity: 0.5; }
}
</style>

<!-- ═══ 暗色模式（非 scoped，避免 Vue SFC :global 编译 Bug） ═══ -->
<style>
.dark .conversation .load-more-indicator {
  color: rgba(224,231,235,0.5);
}
.dark .conversation .milestone-label {
  color: rgba(124,183,180,0.8);
}
.dark .conversation .milestone::before,
.dark .conversation .milestone::after {
  background: linear-gradient(90deg, transparent, rgba(124,183,180,0.6), transparent);
}
.dark .conversation .thinking-breath span {
  background: rgba(124,183,180,0.8);
}
.dark .conversation .load-dot {
  background: rgba(124,183,180,0.8);
}
.dark .conversation::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }
.dark .conversation::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
</style>
