<template>
  <div class="rpa">
    <header class="hero">
      <div class="hero-main">
        <div class="hero-actions">
          <AButton type="default" shape="circle" :title="t('rolePlay.index.backToPlayground')" :aria-label="t('rolePlay.index.backToPlayground')" @click="goBack">
            <template #icon>
              <ArrowLeftOutlined />
            </template>
          </AButton>
        </div>
        <div class="hero-content">
          <div class="hero-title">{{ t("rolePlay.index.title") }}</div>
          <div class="hero-subtitle">{{ t("rolePlay.index.subtitle") }}</div>
          <div class="hero-controls">
            <Segmented v-model:value="mode" :options="[t('rolePlay.index.modeText'), t('rolePlay.index.modeVoice')]" size="default" />
            <AButton type="link" size="small" :disabled="!currentRole" @click="openIntro">{{ t('rolePlay.index.viewRoleDetail') }}</AButton>
          </div>
        </div>
      </div>

      <ACard class="hero-role-card" bordered="false">
        <div class="card-title">{{ t("rolePlay.index.currentRole") }}</div>
        <div class="role-overview" :class="{ 'role-overview--empty': !currentRole }">
          <template v-if="currentRole">
            <img :src="currentRole.avatarUrl || undefined" :alt="currentRole.name || ''" />
            <div class="role-meta">
              <div class="role-name">{{ currentRole.name }}</div>
              <div class="role-badges">
                <ATag v-if="currentRole.voice" color="blue">{{ t("rolePlay.index.voiceLabel", { voice: currentRole.voice }) }}</ATag>
                <ATag v-if="currentRole.new" color="red">{{ t("rolePlay.index.newRole") }}</ATag>
              </div>
              <div class="role-desc">{{ currentRole.description || t('rolePlay.index.defaultDesc') }}</div>
            </div>
          </template>
          <template v-else>
            <div class="placeholder">{{ t("rolePlay.index.noRoleSelected") }}</div>
          </template>
        </div>
      </ACard>
    </header>

    <main class="workspace" :class="{ 'workspace--voice': mode === t('rolePlay.index.modeVoice') }" :aria-label="t('rolePlay.index.title')">
        <transition >
          <VoiceMode
            v-if="mode === t('rolePlay.index.modeVoice') && currentRole && sessionId"
            :session-id="sessionId"
            :role-id="currentRole.id"
            @exit="mode = t('rolePlay.index.modeText')"
          />
          <ChatPanel
            v-else
            v-model:session-id="sessionId"
            :role-id="currentRole?.id"
            :record-test="recordTest"
            :on-start-test="startRecordTest"
            :on-stop-test="stopRecordTest"
            @session-selected="onSessionSelected"
          />
        </transition>
    </main>

    <AModal v-model:open="introVisible" :title="currentRole?.name || t('rolePlay.index.roleIntro')" :footer="null" width="520px">
      <p v-if="currentRole">{{ currentRole.description }}</p>
      <p v-else>{{ t("rolePlay.index.noRoleIntro") }}</p>
    </AModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { message, Button as AButton, Modal as AModal, Card as ACard, Tag as ATag, Segmented } from 'ant-design-vue'
import ChatPanel from "@/pages/playground/role-play-agent/components/ChatPanel.vue";
import VoiceMode from "@/pages/playground/role-play-agent/components/VoiceMode.vue";
import { createSession, fetchSession, endSession, fetchRoleById } from '@/services/roleplay'
import type { SessionDetail, RoleDetail } from '@/types/roleplay'

const router = useRouter()
const { t } = useI18n()
const route = useRoute()
const goBack = () => router.back()

// 会话管理
const sessionId = ref<string>('')
const sessionDetail = ref<SessionDetail | null>(null)
const sessionLoading = ref(false)
const mode = ref<string>(t('rolePlay.index.modeText'))

const roleId = computed(() => Number(route.params.roleId) || 0)
const currentRole = ref<RoleDetail | null>(null)
const roleLoading = ref(false)
const introVisible = ref(false)

const recordTest = reactive({
  active: false,
  lastCheckAt: '',
  duration: 0,
  audioUrl: null as string | null,
  chunkCount: 0,
  totalSamples: 0,
  totalBytes: 0,
})

let recordTestChunks: Int16Array[] = []
let recordTestTimer: number | null = null
let recordTestTimeout: number | null = null
let recordTestStream: MediaStream | null = null
let recordTestAudioCtx: AudioContext | null = null
let recordTestSource: MediaStreamAudioSourceNode | null = null
let recordTestWorklet: AudioWorkletNode | null = null

function openIntro() {
  if (!currentRole.value) return
  introVisible.value = true
}

function onSessionSelected(s: SessionDetail) {
  // 将父组件中的当前会话信息更新为选中的会话
  sessionDetail.value = s
}

// 加载角色信息
async function loadRole() {
  if (!roleId.value) {
    message.error(t('rolePlay.index.invalidRoleId'))
    router.push('/playground/role-play-agent')
    return
  }

  roleLoading.value = true
  try {
    const response = await fetchRoleById(roleId.value)
    currentRole.value = response.data
    console.log('[RolePlay] 角色加载成功:', currentRole.value)
  } catch (error) {
    console.error('[RolePlay] 角色加载失败:', error)
    message.error(t('rolePlay.index.loadRoleFailed'))
    router.push('/playground/role-play-agent')
  } finally {
    roleLoading.value = false
  }
}

// 会话管理函数
async function initializeSession() {
  if (!currentRole.value) {
    message.error(t('rolePlay.index.selectRoleFirst'))
    router.push('/playground/role-play-agent')
    return
  }

  sessionLoading.value = true
  try {
    // 创建新会话
    const sessionResponse = await createSession({
      userId: 1, // 临时使用固定用户ID，后续可从用户状态获取
      roleId: roleId.value,
      mode: mode.value === t('rolePlay.index.modeVoice') ? 'voice' : 'text'
    })

    sessionDetail.value = sessionResponse.data
    sessionId.value = sessionResponse.data.sessionCode

    console.log('[RolePlay] 会话创建成功:', sessionDetail.value)
  } catch (error) {
    console.error('[RolePlay] 会话创建失败:', error)
    message.error(t('rolePlay.index.sessionCreateFailed'))
  } finally {
    sessionLoading.value = false
  }
}

async function handleEndSession() {
  if (!sessionId.value) return

  try {
    await endSession(sessionId.value, 'User ended session')
    console.log('[RolePlay] 会话已结束')
  } catch (error) {
    console.error('[RolePlay] 结束会话失败:', error)
  }
}

// 监听模式变化
watch(mode, async (newMode) => {
  // 若已有会话，先结束
  if (sessionDetail.value) {
    await handleEndSession()
    sessionDetail.value = null
    sessionId.value = ''
  }

  if (newMode === t('rolePlay.index.modeVoice') && currentRole.value) {
    // 语音模式需要实时会话，切换时创建
    await initializeSession()
  } else {
    // 文本模式懒创建：首次发送时再由 ChatPanel 触发创建
    sessionDetail.value = null
    sessionId.value = ''
  }
})

// 页面初始化
onMounted(async () => {
  // 加载角色信息
  await loadRole()

  // 仅当是语音模式时预先创建会话；文本模式由首次发送时创建
  if (currentRole.value && mode.value === t('rolePlay.index.modeVoice')) {
    await initializeSession()
  } else {
    sessionDetail.value = null
    sessionId.value = ''
  }
})

async function startRecordTest() {
  if (recordTest.active) return

  try {
    if (recordTest.audioUrl) {
      URL.revokeObjectURL(recordTest.audioUrl)
      recordTest.audioUrl = null
    }

    recordTestChunks = []
    recordTest.duration = 0
    recordTest.chunkCount = 0
    recordTest.totalSamples = 0
    recordTest.totalBytes = 0
    recordTest.active = true

    recordTestStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordTestAudioCtx = new AudioContext()
    await recordTestAudioCtx.audioWorklet.addModule('/pcm16-worklet.js')

    recordTestSource = recordTestAudioCtx.createMediaStreamSource(recordTestStream)
    recordTestWorklet = new AudioWorkletNode(recordTestAudioCtx, 'pcm16-processor', {
      processorOptions: { targetSampleRate: 16000 },
    })

    recordTestSource.connect(recordTestWorklet)

    recordTestWorklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      const view = new Int16Array(e.data)
      recordTestChunks.push(new Int16Array(view))
    }

    recordTestTimer = window.setInterval(() => {
      if (!recordTest.active) {
        if (recordTestTimer) window.clearInterval(recordTestTimer)
        recordTestTimer = null
        return
      }
      recordTest.duration = parseFloat((recordTest.duration + 0.1).toFixed(1))
    }, 100)

    recordTestTimeout = window.setTimeout(() => {
      finishRecordTest()
    }, 5000)

    console.log('[RolePlay] Recording test started')
  } catch (error) {
    console.error('[RolePlay] Recording test failed:', error)
    cleanupRecordTest()
    recordTest.active = false
  }
}

function stopRecordTest() {
  if (!recordTest.active) return
  if (recordTestTimeout) {
    window.clearTimeout(recordTestTimeout)
    recordTestTimeout = null
  }
  finishRecordTest()
}

function finishRecordTest() {
  if (!recordTest.active) return

  recordTest.active = false

  if (recordTestTimer) {
    window.clearInterval(recordTestTimer)
    recordTestTimer = null
  }

  cleanupRecordTest()

  if (recordTestChunks.length > 0) {
    const totalSamples = recordTestChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const combined = new Int16Array(totalSamples)
    let offset = 0
    for (const chunk of recordTestChunks) {
      combined.set(chunk, offset)
      offset += chunk.length
    }

    const wavBuffer = createWavFile(combined, 16000)
    const blob = new Blob([wavBuffer], { type: 'audio/wav' })
    if (recordTest.audioUrl) URL.revokeObjectURL(recordTest.audioUrl)
    recordTest.audioUrl = URL.createObjectURL(blob)

    recordTest.chunkCount = recordTestChunks.length
    recordTest.totalSamples = totalSamples
    recordTest.totalBytes = totalSamples * 2
  }

  recordTest.lastCheckAt = new Date().toLocaleString()
  console.log('[RolePlay] Recording test stopped')
  recordTestChunks = []
}

function cleanupRecordTest() {
  if (recordTestWorklet) {
    try { recordTestWorklet.disconnect() } catch {}
    recordTestWorklet = null
  }
  if (recordTestSource) {
    try { recordTestSource.disconnect() } catch {}
    recordTestSource = null
  }
  if (recordTestAudioCtx) {
    try { recordTestAudioCtx.close() } catch {}
    recordTestAudioCtx = null
  }
  if (recordTestStream) {
    try { recordTestStream.getTracks().forEach(t => t.stop()) } catch {}
    recordTestStream = null
  }
  if (recordTestTimeout) {
    window.clearTimeout(recordTestTimeout)
    recordTestTimeout = null
  }
}

function createWavFile(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const length = samples.length
  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length * 2, true)

  let offset = 44
  for (let i = 0; i < length; i++) {
    view.setInt16(offset, samples[i], true)
    offset += 2
  }

  return buffer
}

onBeforeUnmount(async () => {
  // 清理录音测试资源
  if (recordTest.audioUrl) {
    URL.revokeObjectURL(recordTest.audioUrl)
    recordTest.audioUrl = null
  }
  if (recordTestTimer) window.clearInterval(recordTestTimer)
  if (recordTestTimeout) window.clearTimeout(recordTestTimeout)
  cleanupRecordTest()

  // 结束会话
  await handleEndSession()
})
</script>

<style scoped lang="scss">
.rpa {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 7px 24px 24px;
  max-height: 100vh;
  box-sizing: border-box;
}

.hero {
  background: linear-gradient(135deg, rgba(var(--rp-navy-rgb, 115, 143, 255), 0.18), rgba(var(--rp-blue-light-rgb, 181, 201, 255), 0.12));
  border-radius: var(--radius-lg, 18px);
  padding: 20px 24px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 20px;
}

.hero-main {
  display: flex;
  gap: 18px;
  align-items: center;
}

.hero-main .hero-content {
  min-width: 320px;
}

.hero-actions {
  display: flex;
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--rp-navy-light);
}

.hero-subtitle {
  font-size: 0.875rem;
  color: var(--rp-blue-dark);
}

.hero-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}


.hero-role-card {
  min-width: 280px;
  width: 50%;
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--radius-lg, 18px) !important;
  box-shadow: var(--shadow-lg);
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-role-card :deep(.ant-card-body) {
  padding: 0;
}

.workspace {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.role-overview {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.role-overview img {
  margin: auto 0;
  width: 74px;
  height: 74px;
  border-radius: var(--radius-lg, 18px);
  object-fit: cover;
  box-shadow: var(--shadow-md);
}

.role-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--rp-navy);
}

.role-desc {
  font-size: 0.8125rem;
  color: var(--rp-blue-dark);
  line-height: 1.5;
  height: 50px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 3em;
}

.role-overview--empty {
  justify-content: center;
  align-items: center;
  min-height: 120px;
  text-align: center;
}

.placeholder {
  font-size: 0.8125rem;
  color: var(--rp-blue-light);
}

.workspace {
  gap: 20px;
}

@media (max-width: 1200px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-main {
    width: 100%;
    justify-content: space-between;
  }

  .hero-main .hero-content {
    flex: 1;
  }

  .hero-role-card {
    min-width: 100%;
  }

  .workspace {
    min-height: auto;
  }
}
</style>

<!-- Dark mode overrides -->
<style lang="scss">
.dark {
  .rpa .hero {
    background: linear-gradient(135deg, rgba(115, 143, 255, 0.08), rgba(181, 201, 255, 0.05));
  }

  .rpa .hero-role-card {
    background: rgba(255, 255, 255, 0.04);
    box-shadow: var(--shadow-md);
  }

  .rpa .hero-title {
    color: var(--rp-navy-light);
  }

  .rpa .hero-subtitle {
    color: var(--rp-blue-dark);
  }

  .rpa .role-name {
    color: var(--rp-navy);
  }

  .rpa .role-desc {
    color: var(--rp-blue-dark);
  }

  .rpa .role-overview img {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .rpa .placeholder {
    color: var(--rp-blue-light);
  }

  .rpa .card-title {
    color: var(--rp-navy);
  }
}
</style>
