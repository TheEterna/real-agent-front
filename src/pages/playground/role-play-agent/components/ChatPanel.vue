<script setup lang="ts">
import { nextTick, ref, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, InputSearch, Button as AButton, Tooltip as ATooltip, Card as ACard, List as AList, ListItem, Tag as ATag, Space, Alert, Switch as ASwitch, Skeleton } from 'ant-design-vue'
import { fetchSessionMessages, fetchUserSessions, createSession } from '@/services/roleplay'
import { DEFAULT_ROLEPLAY_USER_ID } from '@/constants/roleplay'
import type { SessionMessage, SessionDetail } from '@/types/roleplay'

interface Message { id: string; role: 'user' | 'agent'; content: string }

function newMsgId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function selectSession(s: SessionDetail) {
  if (!s || !s.sessionCode) return
  if (s.sessionCode === props.sessionId) return
  // 切换前关闭当前流
  if (sseAbort) {
    try { sseAbort.abort() } catch {}
    sseAbort = null
  }
  activeSession.value = s.sessionCode
  emit('update:sessionId', s.sessionCode)
  emit('sessionSelected', s)
}

interface RecordTestState {
  active: boolean
  lastCheckAt: string
  duration: number
  audioUrl: string | null
  chunkCount: number
  totalSamples: number
  totalBytes: number
}

const props = defineProps<{
  sessionId: string
  roleId?: number
  recordTest?: RecordTestState
  onStartTest?: () => void
  onStopTest?: () => void
}>()

const emit = defineEmits<{
  (e: 'update:sessionId', value: string): void
  (e: 'sessionSelected', value: SessionDetail): void
}>()

const { t } = useI18n()
const messages = ref<Message[]>([])
const draft = ref('')
const messagesRef = ref<HTMLElement | null>(null)
const loading = ref(false)
let sseAbort: AbortController | null = null
// 会话列表
const sessions = ref<SessionDetail[]>([])
const sessionsLoading = ref(false)
const sessionsActiveOnly = ref(false)
const activeSession = ref("")
function formatTime(t?: string | null) {
  if (!t) return ''
  try { return new Date(t).toLocaleString() } catch { return String(t) }
}

async function loadSessions() {
  sessionsLoading.value = true
  try {
    const resp = await fetchUserSessions(1, sessionsActiveOnly.value)
    const arr = Array.isArray(resp) ? resp : (resp as any)
    const list: SessionDetail[] = (arr || [])
        .map((it: any) => it?.data)
        .filter((x: any) => !!x)
        .sort((a: SessionDetail, b: SessionDetail) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return tb - ta
        })
    sessions.value = list
  } catch (e) {
    console.error('[ChatPanel] 加载会话列表失败:', e)
  } finally {
    sessionsLoading.value = false
  }
}

// 加载会话消息历史
async function loadMessages() {
  if (!props.sessionId) return

  try {
    const response = await fetchSessionMessages(props.sessionId, { limit: 100 })
    const sessionMessages = response.data

    // 转换为组件所需的消息格式（后端角色枚举为大写）
    messages.value = sessionMessages.map((msg: SessionMessage) => ({
      id: String(msg.id),
      role: msg.role === 'USER' ? 'user' : 'agent',
      content: msg.content || ''
    }))

  } catch (error) {
    console.error('[ChatPanel] 加载消息失败:', error)
  }
}

watchEffect(() => {
  // 当 sessionId 变化时，重新加载消息历史
  if (props.sessionId) {
    // 注意：不要在加载前清空消息，避免加载失败时列表为空
    // 加载成功后会覆盖 messages，失败时保留原有数据
    loadMessages()
  }
})

watch(messages, () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
})

// 发送消息
async function send() {
  if (!draft.value.trim() || loading.value) return

  const userContent = draft.value.trim()
  draft.value = ''

  messages.value.push({ id: newMsgId(), role: 'user', content: userContent })

  loading.value = true

  try {
    // 若当前无会话，则在首次发送时创建文本会话
    let sessionCode = props.sessionId
    if (!sessionCode) {
      if (!props.roleId || props.roleId <= 0) {
        message.error(t('rolePlay.chat.invalidRole'))
        loading.value = false
        return
      }
      const respCreate = await createSession({
        userId: DEFAULT_ROLEPLAY_USER_ID,
        roleId: props.roleId as number,
        // 文本模式固定为 text
        ...( { mode: 'text' } as any )
      })
      sessionCode = respCreate.data.sessionCode
      emit('update:sessionId', sessionCode)
      // 刷新会话列表
      loadSessions().catch(() => {})
    }

    // 若存在未结束的流，先关闭
    if (sseAbort) {
      try { sseAbort.abort() } catch {}
      sseAbort = null
    }

    sseAbort = new AbortController()

    const resp = await fetch(`/api/sessions/${encodeURIComponent(sessionCode)}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        messageType: 'USER_TEXT',
        role: 'USER',
        content: userContent
      }),
      signal: sseAbort.signal
    })

    if (!resp.ok || !resp.body) {
      throw new Error(`SSE 请求失败: ${resp.status} ${resp.statusText}`)
    }

    // 为助手创建一个占位消息，后续增量填充
    messages.value.push({ id: newMsgId(), role: 'agent', content: '' })
    const agentIndex = messages.value.length - 1

    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    const flushEvents = () => {
      let sepIndex = buffer.indexOf('\n\n')
      while (sepIndex !== -1) {
        const raw = buffer.slice(0, sepIndex)
        buffer = buffer.slice(sepIndex + 2)
        const lines = raw.split('\n')
        let evt = 'message'
        const dataLines: string[] = []
        for (const line of lines) {
          if (line.startsWith('event:')) evt = line.slice(6).trim()
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
        }
        const data = dataLines.join('\n')

        if (evt === 'ack') {
          // 用户消息已保存
        } else if (evt === 'delta') {
          messages.value[agentIndex].content += data
        } else if (evt === 'done') {
          // 结束：不主动 abort，避免 BodyStreamBuffer was aborted
          loading.value = false
        } else if (evt === 'error') {
          message.error(data || t('rolePlay.chat.generateError'))
          loading.value = false
        }

        sepIndex = buffer.indexOf('\n\n')
      }
    }

    // 读取并解析 SSE 数据
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      flushEvents()
    }

    // 流自然结束后，若还有残留事件块，尝试解析
    flushEvents()
    loading.value = false

  } catch (error: any) {
    // 忽略因切换会话或新一轮发送而触发的中止异常
    const msg = String(error?.message || error || '')
    if (error?.name === 'AbortError' || /aborted|BodyStreamBuffer was aborted/i.test(msg)) {
      console.warn('[ChatPanel] SSE 读流被中止(预期):', msg)
    } else {
      console.error('[ChatPanel] 发送消息失败:', error)
      message.error(t('rolePlay.chat.sendFailed'))
    }
    loading.value = false
  }
}

const onStart = () => {
  if (props.onStartTest) props.onStartTest()
}

const onStop = () => {
  if (props.onStopTest) props.onStopTest()
}

// 组件初始化
onMounted(() => {
  if (props.sessionId) {
    loadMessages()
  }
  loadSessions()
})

onBeforeUnmount(() => {
  if (sseAbort) {
    try { sseAbort.abort() } catch {}
    sseAbort = null
  }
})

watch(sessionsActiveOnly, () => {
  loadSessions()
})
</script>
<template>
  <div class="chat-layout">
    <section class="chat-panel">
      <div class="chat-shell">
        <header class="chat-header">
          <div class="chat-title">{{ t("rolePlay.chat.title") }}</div>
          <div class="chat-subtitle">{{ t("rolePlay.chat.subtitle") }}</div>
        </header>

        <div ref="messagesRef" class="messages" role="log" aria-live="polite" :aria-label="t('rolePlay.chat.title')">
          <div v-if="!messages.length" class="empty">{{ t("rolePlay.chat.emptyMessages") }}</div>
          <div
            v-for="m in messages"
            :key="m.id"
            class="msg"
            :class="m.role"
          >
            <div class="msg-meta">
              <span class="sender">{{ m.role === 'user' ? t('rolePlay.chat.senderYou') : t('rolePlay.chat.senderAI') }}</span>
            </div>
            <div class="bubble" :class="m.role">
              <div class="bubble-text">{{ m.content }}</div>
            </div>
          </div>
        </div>

        <footer class="composer">
          <InputSearch
            v-model:value="draft"
            :enter-button="t('rolePlay.chat.sendButton')"
            :loading="loading"
            :placeholder="t('rolePlay.chat.inputPlaceholder')"
            @search="send"
          />
        </footer>
      </div>
    </section>

    <aside class="chat-side" :aria-label="t('rolePlay.chat.sessionList')">
      <ACard class="session-card" bordered="false">
        <div class="session-header">
          <div class="session-title">{{ t("rolePlay.chat.sessionList") }}</div>
          <div class="session-actions">
            <ATooltip :title="t('rolePlay.chat.activeOnlyTooltip')">
              <ASwitch v-model:checked="sessionsActiveOnly" size="small" />
            </ATooltip>
            <AButton size="small" :loading="sessionsLoading" @click="loadSessions">{{ t("common.button.refresh") }}</AButton>
          </div>
        </div>

        <div v-if="sessionsLoading" class="session-skeleton">
          <Skeleton active :title="false" :paragraph="{ rows: 6 }" />
        </div>

        <div v-else-if="sessions.length" class="session-body">
          <AList class="session-list">
            <ListItem
              v-for="s in sessions"
              :key="s.sessionCode"
              class="session-item"
              :class="{ current: s.sessionCode === props.sessionId }"
              :aria-label="`${s.sessionCode}`"
              :aria-current="s.sessionCode === props.sessionId ? 'true' : undefined"
              role="button"
              tabindex="0"
              @click="selectSession(s)"
              @keydown.enter="selectSession(s)"
              @keydown.space.prevent="selectSession(s)"
            >
              <div class="session-item-inner">
                <div class="session-dot" :class="{ active: activeSession === s.sessionCode }"></div>
                <div class="session-main">
                  <div class="session-row">
                    <span class="code" :title="s.sessionCode">{{ s.sessionCode }}</span>
                  </div>
                  <div class="session-summary" :title="s.summary || t('rolePlay.chat.noSummary')">{{ s.summary || t('rolePlay.chat.noSummary') }}</div>
                  <div class="session-meta">
                    <span>{{ t("rolePlay.chat.startTime", { time: formatTime(s.createdAt) }) }}</span>
                    <span v-if="s.endedAt">{{ t("rolePlay.chat.endTime", { time: formatTime(s.endedAt) }) }}</span>
                  </div>
                </div>
              </div>
            </ListItem>
          </AList>
        </div>
        <div v-else class="session-empty">{{ t("rolePlay.chat.noSessions") }}</div>
      </ACard>
      <ACard class="record-card" bordered="false">
        <div class="record-header">
          <div class="record-title">
            <span>{{ t("rolePlay.chat.recordDebug") }}</span>
            <ATag v-if="recordTest?.active" color="blue">{{ t("rolePlay.chat.recording") }}</ATag>
          </div>
          <div class="record-hint">{{ t("rolePlay.chat.recordHint") }}</div>
        </div>

        <div v-if="recordTest" class="record-body">
          <div class="record-status" :class="{ active: recordTest.active }">
            <span class="status-light"></span>
            <div class="status-text">
              <span v-if="recordTest.active">{{ `${t("rolePlay.chat.recordingInProgress", { duration: recordTest.duration.toFixed(1) })}` }}</span>
              <span v-else-if="recordTest.lastCheckAt">{{ t("rolePlay.chat.lastTest", { time: recordTest.lastCheckAt }) }}</span>
              <span v-else>{{ t("rolePlay.chat.noTest") }}</span>
            </div>
          </div>

          <Space direction="vertical" style="width:100%">
            <AButton type="primary" block :disabled="recordTest.active" @click="onStart">
              {{ t("rolePlay.chat.startRecordTest") }}
            </AButton>
            <AButton block danger :disabled="!recordTest.active" @click="onStop">
              {{ t("rolePlay.chat.stopManually") }}
            </AButton>
          </Space>

          <div v-if="recordTest.audioUrl" class="record-preview">
            <audio :src="recordTest.audioUrl" controls style="width: 100%;"></audio>
            <div class="record-info">
              <div>{{ t("rolePlay.chat.audioChunks", { n: recordTest.chunkCount }) }}</div>
              <div>{{ t("rolePlay.chat.totalSamples", { n: recordTest.totalSamples }) }}</div>
              <div>{{ t("rolePlay.chat.totalBytes", { n: recordTest.totalBytes }) }}</div>
            </div>
          </div>

          <Alert
              v-else-if="!recordTest.active && recordTest.lastCheckAt"
              type="warning"
              show-icon
              :message="t('rolePlay.chat.noAudioWarning')"
          />
          <div v-else class="record-preview-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-primary-400">
                  <circle cx="24" cy="24" r="20" fill="currentColor" fill-opacity="0.1"/>
                  <path d="M20 16L20 32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M28 16L28 32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="placeholder-text">
                <h3 v-if="recordTest.active">{{ t("rolePlay.chat.recordingNow") }}</h3>
                <h3 v-else>{{ t("rolePlay.chat.waitingAudio") }}</h3>
                <p>{{ t("rolePlay.chat.audioPlayHere") }}</p>
              </div>
            </div>
          </div>

        </div>

        <div v-else class="record-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-primary-400">
                <circle cx="24" cy="24" r="20" fill="currentColor" fill-opacity="0.1"/>
                <path d="M24 34C29.5228 34 34 29.5228 34 24C34 18.4772 29.5228 14 24 14C18.4772 14 14 18.4772 14 24C14 29.5228 18.4772 34 24 34Z" stroke="currentColor" stroke-width="2"/>
                <path d="M20 24L23 27L28 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="placeholder-text">
              <h3>{{ t("rolePlay.chat.recordTestFeature") }}</h3>
              <p>{{ t("rolePlay.chat.loadingFeature") }}</p>
            </div>
          </div>
        </div>
      </ACard>
    </aside>
  </div>
</template>


<style scoped lang="scss">
.chat-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: stretch;
  height: 100%;
}

.chat-panel {
  border-radius: var(--radius-xl, 20px);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  background: linear-gradient(180deg, rgb(from var(--color-primary-100) r g b / 0.9), var(--background, #ffffff) 60%);
  border: 1px solid var(--border, rgba(174, 191, 242, 0.24));
}

.chat-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 520px;
  background: rgba(255, 255, 255, 0.82);
}

.chat-header {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--rp-navy-dark);
}

.chat-subtitle {
  font-size: 0.8125rem;
  color: var(--rp-blue-dark);
}

.messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 24px 8px;
  scrollbar-width: thin;
}

.empty {
  color: var(--rp-blue-light);
  font-size: 0.875rem;
  text-align: center;
  padding: 80px 0;
}

.msg {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 78%;
}

.msg.user {
  align-self: flex-end;
  text-align: right;
}

.msg.agent {
  align-self: flex-start;
}

.msg.user .msg-meta {
  justify-content: flex-end;
}

.msg-meta {
  display: flex;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--rp-blue-bright);
}

.sender {
  font-weight: 600;
  letter-spacing: .2px;
}

.bubble {
  padding: 12px 16px;
  border-radius: var(--radius-lg, 16px);
  line-height: 1.55;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(var(--blur-sm, 8px));
  border: 1px solid rgba(142, 160, 215, 0.2);
  color: var(--rp-navy);
  background: rgba(255, 255, 255, 0.75);
}

.bubble.user {
  background: linear-gradient(135deg, rgba(129, 211, 255, 0.26), rgba(99, 162, 255, 0.24));
  color: var(--rp-accent-teal);
  border-color: rgba(99, 162, 255, 0.28);
}

.bubble.agent {
  background: linear-gradient(135deg, rgba(142, 233, 208, 0.24), rgba(97, 204, 169, 0.18));
  color: var(--rp-accent-green);
  border-color: rgba(97, 204, 169, 0.22);
}

.composer {
  padding: 12px;
  display: flex;
}

.composer :deep(.ant-input) {
  padding: 12px 16px;
  font-size: 1rem;
}

.composer :deep(.ant-btn) {
  border-radius: 0 14px 14px 0;
  padding: 0 18px;
  height: 48px;
}

.composer :deep(.ant-input-search-button) {
  height: 48px;
}

.chat-side {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  max-height: 100%;
  gap: 12px;
}
.session-card {
  border-radius: var(--radius-lg, 18px);
  height: 25%;
  overflow: auto;
}
 .session-card :deep(.ant-card-body) {
   padding: 16px;
 }

 .session-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   margin-bottom: 8px;

 }
 .session-title {
   font-size: 1rem;
   font-weight: 600;
   color: var(--rp-navy);
 }
 .session-actions {
   display: flex;
   align-items: center;
   gap: 10px;
 }
 .session-skeleton {
   padding: 8px 2px 2px 2px;
 }
 .session-list {
   display: flex;
   flex-direction: column;
   gap: 8px;
 }
 .session-item {
  padding: 8px 6px !important;
  border-radius: var(--radius-md, 12px);
  transition: background var(--duration-normal, 200ms) var(--ease-fluid);
  cursor: pointer;
 }
 .session-item.current {
   background: rgba(92, 114, 205, 0.08);
 }
 .session-item:hover {
   background: rgba(92, 114, 205, 0.06);
 }
 .session-item-inner {
   display: flex;
   gap: 10px;
   align-items: flex-start;
 }
 .session-dot {
   margin-top: 6px;
   width: 10px;
   height: 10px;
   border-radius: 50%;
   background: var(--rp-blue-light);
 }
 .session-dot.active {
   background: var(--rp-accent-emerald);
   box-shadow: 0 0 0 4px rgba(15, 139, 114, 0.12);
 }
 .session-main {
   flex: 1;
   min-width: 0;
   display: flex;
   flex-direction: column;
   gap: 6px;
 }
 .session-row {
   display: flex;
   align-items: center;
   gap: 8px;
 }
 .session-row .code {
   max-width: 160px;
   font-weight: 600;
   color: var(--rp-navy);
   white-space: nowrap;
   overflow: hidden;
   text-overflow: ellipsis;
 }
 .session-summary {
   font-size: 0.75rem;
   color: var(--rp-blue-muted);
   line-height: 1.5;
   display: -webkit-box;
   -webkit-line-clamp: 2;
   -webkit-box-orient: vertical;
   overflow: hidden;
 }
 .session-meta {
   display: flex;
   gap: 12px;
   font-size: 0.75rem;
   color: var(--rp-blue-bright);
 }
.record-card {
  border-radius: var(--radius-lg, 18px);
  box-shadow: var(--shadow-lg);
  padding: 20px;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(75% - 12px);
}

.record-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--rp-navy);
}

.record-hint {
  font-size: 0.8125rem;
  color: var(--rp-blue);
}

.record-body {
  display: flex;
  flex-direction: column;

  gap: 16px;
}

.record-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md, 12px);
  background: rgba(92, 114, 205, 0.08);
  border: 1px solid rgba(92, 114, 205, 0.18);
}

.record-status.active {
  background: rgba(92, 114, 205, 0.14);
  border-color: rgba(92, 114, 205, 0.28);
}

.status-light {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full, 50%);
  background: var(--rp-accent-indigo, #8aa4ff);
  box-shadow: 0 0 0 4px rgba(138, 164, 255, 0.22);
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--rp-blue-dark);
}

.record-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md, 12px);
  background: rgba(237, 243, 255, 0.6);
}

.record-info {
  display: grid;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--rp-blue-muted);
}

.record-preview-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 12px;
  border-radius: var(--radius-md, 12px);
  background: rgba(237, 243, 255, 0.6);
  min-height: 120px;
}

.record-preview-placeholder .placeholder-content {
  text-align: center;
  color: var(--rp-blue-light);
}

.record-preview-placeholder .placeholder-icon {
  margin-bottom: 16px;
}

.record-preview-placeholder .placeholder-text h3 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--rp-blue-dark);
}

.record-preview-placeholder .placeholder-text p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--rp-blue-light);
}

@media (max-width: 1024px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .chat-side {
    order: -1;
  }
}
</style>

<!-- Dark mode overrides (non-scoped) -->
<style lang="scss">
.dark {
  /* Chat panel shell */
  .chat-panel {
    background: linear-gradient(180deg, rgba(24, 32, 48, 0.9), #18181b 60%) !important;
    border-color: rgba(255, 255, 255, 0.06) !important;
    box-shadow: 0 26px 40px rgba(0, 0, 0, 0.35) !important;
  }

  .chat-shell {
    background: rgba(24, 24, 27, 0.82) !important;
  }

  /* Header text */
  .chat-header .chat-title {
    color: rgba(224, 231, 235, 0.9);
  }

  .chat-header .chat-subtitle {
    color: rgba(224, 231, 235, 0.5);
  }

  /* Empty state */
  .messages .empty {
    color: rgba(224, 231, 235, 0.35);
  }

  /* Message meta */
  .msg .msg-meta {
    color: rgba(224, 231, 235, 0.45);
  }

  /* Chat bubbles */
  .bubble {
    background: rgba(255, 255, 255, 0.06) !important;
    border-color: rgba(255, 255, 255, 0.08) !important;
    color: rgba(224, 231, 235, 0.85) !important;
    box-shadow: 0 16px 30px rgba(0, 0, 0, 0.25) !important;
  }

  .bubble.user {
    background: linear-gradient(135deg, rgba(99, 162, 255, 0.15), rgba(129, 211, 255, 0.12)) !important;
    border-color: rgba(99, 162, 255, 0.2) !important;
    color: rgba(180, 220, 255, 0.9) !important;
  }

  .bubble.agent {
    background: linear-gradient(135deg, rgba(97, 204, 169, 0.12), rgba(142, 233, 208, 0.1)) !important;
    border-color: rgba(97, 204, 169, 0.15) !important;
    color: rgba(180, 240, 220, 0.9) !important;
  }

  /* Session card */
  .session-card {
    background: rgba(24, 24, 27, 0.9) !important;
  }

  .session-title {
    color: rgba(224, 231, 235, 0.9) !important;
  }

  .session-item.current {
    background: rgba(92, 114, 205, 0.15) !important;
  }

  .session-item:hover {
    background: rgba(92, 114, 205, 0.1) !important;
  }

  .session-row .code {
    color: rgba(224, 231, 235, 0.85) !important;
  }

  .session-summary {
    color: rgba(224, 231, 235, 0.45) !important;
  }

  .session-meta {
    color: rgba(224, 231, 235, 0.4) !important;
  }

  .session-empty {
    color: rgba(224, 231, 235, 0.35);
  }

  /* Record card */
  .record-card {
    background: rgba(24, 24, 27, 0.92) !important;
    box-shadow: 0 20px 36px rgba(0, 0, 0, 0.35) !important;
  }

  .record-title span {
    color: rgba(224, 231, 235, 0.9);
  }

  .record-hint {
    color: rgba(224, 231, 235, 0.5);
  }

  .record-status {
    background: rgba(92, 114, 205, 0.12) !important;
    border-color: rgba(92, 114, 205, 0.2) !important;
  }

  .record-status.active {
    background: rgba(92, 114, 205, 0.2) !important;
    border-color: rgba(92, 114, 205, 0.35) !important;
  }

  .status-text {
    color: rgba(224, 231, 235, 0.7) !important;
  }

  .record-preview {
    background: rgba(255, 255, 255, 0.04) !important;
  }

  .record-info {
    color: rgba(224, 231, 235, 0.45) !important;
  }

  .record-preview-placeholder {
    background: rgba(255, 255, 255, 0.04) !important;
  }

  .record-preview-placeholder .placeholder-text h3 {
    color: rgba(224, 231, 235, 0.7) !important;
  }

  .record-preview-placeholder .placeholder-text p {
    color: rgba(224, 231, 235, 0.4) !important;
  }

  /* SVG placeholder icons - adjust fill for dark */
  .placeholder-icon circle[fill="#F0F6FF"] {
    fill: rgba(92, 114, 205, 0.12);
  }

  .placeholder-icon path[stroke="#8AA4FF"] {
    stroke: rgba(138, 164, 255, 0.6);
  }
}
</style>
