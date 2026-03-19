<script setup lang="ts">
/**
 * Playground Chat Assistant V3 — 共生 (Symbiosis) 主容器
 *
 * 布局结构：
 * - Ambient Layer (全屏情绪渐变背景)
 * - Soul Avatar (固定右侧，hover 展开内心世界)
 * - App Shell (居中列：top-bar + conversation + input-zone)
 * - Overlay Panels (MemoryBoard / EmotionCalendar / SettingsPanel)
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArchiveRestore } from 'lucide-vue-next'
import ChatArea from './components/ChatArea.vue'
import ChatInput from './components/ChatInput.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import EmotionCalendar from './components/EmotionCalendar.vue'
import MemoryBoard from './components/MemoryBoard.vue'
import SoulAvatar from './components/SoulAvatar.vue'
import OnboardingScreen from './components/OnboardingScreen.vue'
import { useChatAssistant } from './composables/useChatAssistant'
import { useChatAssistantStore } from '@/stores/chatAssistantStore'
import { useGreeting } from './composables/useGreeting'
import { useSoul } from './composables/useSoul'
import { useMemory } from './composables/useMemory'
import type { Personality } from './types'

const { t } = useI18n()

// ========== Onboarding ==========
const chatAssistantStore = useChatAssistantStore()
/**
 * 用 ref 控制引导切换时机：onboarding 完成后先设 false 触发 v-else，
 * 再 nextTick 初始化主界面。初始值从 store.needsOnboarding 派生。
 */
const showOnboarding = ref(chatAssistantStore.needsOnboarding)

function handleOnboardingComplete(config: { assistantName: string; personality: Personality }) {
  chatAssistantStore.updateSettings({
    assistantName: config.assistantName,
    personality: config.personality,
  })
  showOnboarding.value = false
  nextTick(() => initializeMainUI())
}

// ========== Composables ==========
const {
  messages, isStreaming, isSending,
  sendMessage, clearMessages, loadHistory, cleanup,
  loadMore, hasMore, hasOlderMessages, revealOlderMessages,
} = useChatAssistant()
const { greeting, topicFlowHtml, placeholderText } = useGreeting()
const { mood, feeling, isThinking, moodClass, milestone, memories: soulStateMemories, soulGreeting, isGreetingStreaming, inferMood, setThinking, loadSoulState, loadStreamingGreeting } = useSoul()
const { loadMemories, loadStats, getTopMemories } = useMemory()

// ========== UI 状态 ==========
const showSettings = ref(false)
const showEmoCal = ref(false)
const showMemory = ref(false)
const chatInputRef = ref<InstanceType<typeof ChatInput>>()
const chatAreaRef = ref<InstanceType<typeof ChatArea>>()
const assistantName = computed(() => chatAssistantStore.settings.assistantName || t('playgroundChat.onboarding.defaultName'))

/** 历史消息是否已完成首次加载（防止加载前闪现 WelcomeScreen） */
const historyLoaded = ref(false)
/** AI 问候流的 AbortController */
let greetingController: AbortController | null = null

// ========== 计算属性 ==========
const hasMessages = computed(() => messages.value.length > 0)

/** Soul World 展示用的记忆摘要 */
const soulMemories = computed(() =>
  soulStateMemories.value.length > 0 ? soulStateMemories.value : getTopMemories(3),
)

// ========== 方法 ==========
async function handleSend(content: string) {
  await sendMessage(content)
  await Promise.all([loadMemories(), loadStats(), loadSoulState()])
  // 情绪推断仅在 AI 回复完成时触发（见下方 watch），避免双重调用
}

function handleSelectTopic(prompt: string) {
  chatInputRef.value?.setValue(prompt)
}

// assistantName 通过 computed 派生自 store，SettingsPanel 更新 → store → computed 自动刷新

async function handleLoadMore(): Promise<void> {
  // 如果有被 24h 折叠的旧消息，先展开它们
  if (hasOlderMessages.value) {
    await revealOlderMessages()
    return
  }
  await loadMore()
}

async function handleRevealOlder() {
  await revealOlderMessages()
}

async function handleResetConversation() {
  await clearMessages()
  await Promise.all([loadMemories(), loadStats(), loadSoulState()])
}

// ========== 监听流式状态 → Soul 思考态 ==========
watch(isStreaming, (streaming) => {
  setThinking(streaming)
})

// 当 AI 回复完成时，根据内容推断情绪
watch(
  () => {
    if (messages.value.length === 0) return ''
    const last = messages.value[messages.value.length - 1]
    return (!last.isStreaming && last.role === 'assistant') ? last.content : ''
  },
  (content) => {
    if (content) inferMood(content)
  },
)

// ========== Escape 关闭浮层 ==========
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showMemory.value) { showMemory.value = false; return }
    if (showEmoCal.value) { showEmoCal.value = false; return }
    if (showSettings.value) { showSettings.value = false; return }
  }
}

// ========== 主界面初始化（引导完成后才执行） ==========
async function initializeMainUI() {
  const soulPromise = loadSoulState()
  await loadHistory()
  historyLoaded.value = true

  // 空状态 → 立即启动 AI 流式问候（不等 Promise.all，与入场动画并行）
  if (!hasMessages.value) {
    greetingController = new AbortController()
    loadStreamingGreeting(greetingController.signal)
  }

  await Promise.all([loadMemories(), loadStats(), soulPromise])
  nextTick(() => chatInputRef.value?.focus())
}

// ========== 生命周期 ==========
onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)

  if (showOnboarding.value) {
    // SWR Revalidate：后端可能有数据（跨设备同步），拉取后再判断
    await chatAssistantStore.loadSettings()
    if (!chatAssistantStore.needsOnboarding) {
      // 后端有数据 → 跳过引导，直接进主界面
      showOnboarding.value = false
      initializeMainUI()
    }
  } else {
    // 本地缓存已有数据（SWR Stale），直接初始化主界面
    initializeMainUI()
    // 后台静默 revalidate，不影响 UI
    chatAssistantStore.loadSettings()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  greetingController?.abort()
  greetingController = null
  chatAssistantStore.flushPendingSync()
  cleanup()
})
</script>

<template>
  <div class="v3-root" :class="moodClass">
    <!-- Ambient Layer — 全屏情绪渐变 -->
    <div class="ambient"></div>

    <!-- ═══ Onboarding — 首次使用引导 ═══ -->
    <div v-if="showOnboarding" class="app">
      <OnboardingScreen
        @complete="handleOnboardingComplete"
      />
    </div>

    <!-- ═══ App Shell — 主界面 ═══ -->
    <div v-else class="app">
      <!-- Chat Header — 设计稿风格 -->
      <header class="chat-header">
        <div class="chat-header-left">
          <div class="chat-header-avatar">
            <img src="/logo.png" alt="AI" class="chat-header-avatar-img" />
          </div>
          <div class="chat-header-info">
            <span class="chat-header-name">{{ assistantName }}</span>
            <span class="chat-header-status">
              <span class="status-dot"></span>
              {{ t('playgroundChat.main.onlineReady') }} · {{ String(feeling) }}
            </span>
          </div>
        </div>
        <div class="chat-header-actions">
          <button
            v-if="hasMessages"
            class="ghost-pill"
            :aria-label="t('playgroundChat.main.newChatAriaLabel')"
            @click="handleResetConversation"
          >
            <ArchiveRestore :size="14" :stroke-width="1.8" />
            <span>{{ t('playgroundChat.main.newChat') }}</span>
          </button>
          <!-- Soul Avatar — hover 展开面板 -->
          <SoulAvatar
            :name="assistantName"
            :feeling="String(feeling)"
            :mood="mood"
            :is-thinking="Boolean(isThinking)"
            :memories="soulMemories"
            :milestone="milestone"
            @open-memory="showMemory = true"
            @open-emo-cal="showEmoCal = true"
            @open-settings="showSettings = true"
          />
        </div>
      </header>

      <!-- 对话区域 / 欢迎页（historyLoaded 前不渲染，防止闪现 WelcomeScreen） -->
      <ChatArea
        v-if="hasMessages"
        ref="chatAreaRef"
        :messages="messages"
        :is-streaming="isStreaming"
        :has-more="hasMore || hasOlderMessages"
        :on-load-more="handleLoadMore"
      />
      <WelcomeScreen
        v-else-if="historyLoaded"
        :greeting="greeting"
        :topic-flow-html="topicFlowHtml"
        :assistant-name="assistantName"
        :has-older-messages="hasOlderMessages"
        :soul-memories="soulMemories"
        :soul-greeting="soulGreeting"
        :is-greeting-streaming="isGreetingStreaming"
        :milestone="milestone"
        @select-topic="handleSelectTopic"
        @reveal-older="handleRevealOlder"
      />

      <!-- Input Zone -->
      <ChatInput
        ref="chatInputRef"
        :disabled="isSending"
        :placeholder="placeholderText"
        @send="handleSend"
      />
    </div>

    <!-- Overlay Panels -->
    <SettingsPanel
      :visible="showSettings"
      @close="showSettings = false"
    />
    <EmotionCalendar
      :visible="showEmoCal"
      @close="showEmoCal = false"
    />
    <MemoryBoard
      :visible="showMemory"
      @close="showMemory = false"
    />
  </div>
</template>

<style scoped>
/* ═══ V3 Root — 共生容器 ═══ */
.v3-root {
  position: relative;
  width: 100%; height: 100%;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--ink, #2D2B29);
  background: var(--paper, #FAFAF7);
}

/* ═══ CSS Variables ═══ */
.v3-root {
  --paper: #FAFAF7;
  --paper-warm: #F5F3EE;
  --ink: #2D2B29;
  --ink-soft: rgba(45,43,41,0.6);
  --ink-ghost: rgba(45,43,41,0.25);
  --ink-whisper: rgba(45,43,41,0.08);
  --soul: #6B9A98;
  --soul-soft: rgba(107,154,152,0.10);
  --soul-glow: rgba(107,154,152,0.30);
  --soul-deep: #4A7A78;
  --mood-calm:    linear-gradient(170deg, #FAFAF7 0%, #F0F5F4 40%, #F5F7F2 100%);
  --mood-happy:   linear-gradient(170deg, #FAFAF7 0%, #FDF8F0 40%, #FFF8E7 100%);
  --mood-tender:  linear-gradient(170deg, #FAFAF7 0%, #F8F0F5 40%, #FDF5F8 100%);
  --mood-focused: linear-gradient(170deg, #FAFAF7 0%, #F0F0F8 40%, #EEF0F8 100%);
}

/* ═══ Ambient Layer ═══ */
.ambient {
  position: absolute; inset: 0; z-index: 0;
  background: var(--mood-calm);
  transition: background 3s cubic-bezier(0.4,0,0.2,1);
  pointer-events: none;
}
.mood-happy  .ambient { background: var(--mood-happy); }
.mood-tender .ambient { background: var(--mood-tender); }
.mood-focused .ambient { background: var(--mood-focused); }
.mood-calm   .ambient { background: var(--mood-calm); }

/* ═══ App Shell ═══ */
.app {
  position: relative; z-index: 1;
  display: flex; flex-direction: column;
  height: 100%; width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0;
}

/* ═══ Chat Header ═══ */
.chat-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 24px;
  height: 64px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--ink-whisper, rgba(45,43,41,0.08));
}
.chat-header-left {
  display: flex; align-items: center; gap: 12px;
}
.chat-header-avatar {
  width: 40px; height: 40px;
  border-radius: 20px;
  background: var(--soul-soft, rgba(107,154,152,0.10));
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.chat-header-avatar-img {
  width: 24px; height: 24px;
  object-fit: contain;
}
.chat-header-info {
  display: flex; flex-direction: column; gap: 2px;
}
.chat-header-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink, #2D2B29);
}
.chat-header-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem;
  color: var(--ink-soft, rgba(45,43,41,0.6));
}
.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}
.chat-header-actions {
  display: flex; align-items: center; gap: 8px;
}
.ghost-pill {
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(45,43,41,0.08);
  background: rgba(255,255,255,0.55);
  color: rgba(45,43,41,0.5);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.22,1,0.36,1);
}
.ghost-pill:hover {
  background: rgba(255,255,255,0.8);
  color: rgba(45,43,41,0.7);
  border-color: rgba(45,43,41,0.12);
}
.ghost-pill:active { transform: scale(0.96); }

/* ═══ Scrollbar ═══ */
.v3-root ::-webkit-scrollbar { width: 2px; }
.v3-root ::-webkit-scrollbar-track { background: transparent; }
.v3-root ::-webkit-scrollbar-thumb { background: rgba(45,43,41,0.08); border-radius: 2px; }
.v3-root ::-webkit-scrollbar-thumb:hover { background: rgba(45,43,41,0.25); }

/* ═══ Responsive ═══ */
@media (max-width: 640px) {
  .app { max-width: 100%; }
  .chat-header { padding: 0 12px; }
}
@media (min-width: 1024px) {
  .app { max-width: 1080px; }
}
@media (min-width: 1440px) {
  .app { max-width: 1120px; }
}
@media (min-width: 1920px) {
  .app { max-width: 1200px; }
}

/* ═══ Reduced Motion ═══ */
@media (prefers-reduced-motion: reduce) {
  .ambient { transition-duration: 0.01ms !important; }
}
</style>

<!-- ═══ 暗色模式（非 scoped，避免 Vue SFC :global 编译 Bug） ═══ -->
<style>
.dark .v3-root {
  --paper: #1a1a1a;
  --paper-warm: #1e1e1e;
  --ink: rgba(224,231,235,0.9);
  --ink-soft: rgba(224,231,235,0.6);
  --ink-ghost: rgba(224,231,235,0.25);
  --ink-whisper: rgba(224,231,235,0.08);
  --soul: #7cb7b4;
  --soul-soft: rgba(124,183,180,0.10);
  --soul-glow: rgba(124,183,180,0.30);
  --soul-deep: #9dd0cd;
  --mood-calm:    linear-gradient(170deg, #1a1a1a 0%, #1a2322 40%, #1c1e1a 100%);
  --mood-happy:   linear-gradient(170deg, #1a1a1a 0%, #221e18 40%, #24201a 100%);
  --mood-tender:  linear-gradient(170deg, #1a1a1a 0%, #221a1e 40%, #241c20 100%);
  --mood-focused: linear-gradient(170deg, #1a1a1a 0%, #1a1a22 40%, #1c1c24 100%);
  color: var(--ink);
  background: var(--paper);
}

.dark .chat-header {
  border-bottom-color: rgba(255,255,255,0.06);
}
.dark .chat-header-avatar {
  background: rgba(124,183,180,0.12);
}
.dark .chat-header-name {
  color: rgba(224,231,235,0.9);
}
.dark .chat-header-status {
  color: rgba(224,231,235,0.5);
}
.dark .ghost-pill {
  border-color: rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  color: rgba(224,231,235,0.5);
}
.dark .ghost-pill:hover {
  background: rgba(255,255,255,0.1);
  color: rgba(224,231,235,0.8);
  border-color: rgba(255,255,255,0.12);
}

.dark .v3-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); }
.dark .v3-root ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
</style>
