<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick, getCurrentInstance, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { appendMessage, useChatStore } from '@/stores/chatStore'
import { EventType } from '@/types/events'
import { Card as ACard, Empty as AEmpty, Space } from 'ant-design-vue'
import { PauseOutlined, CloseOutlined, AudioMutedOutlined, AudioTwoTone } from '@ant-design/icons-vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  sessionId: string
  roleId: string
  // UI config
  circleSize?: number
  primaryColor?: string
  secondaryColor?: string
  animationSpeed?: number
  volumeSensitivity?: number
}

const { t } = useI18n()
const props = defineProps<Props>()

// Default values
const circleSize = props.circleSize ?? 200
const primaryColor = props.primaryColor ?? 'var(--color-primary-500, #6b9a98)'
const secondaryColor = props.secondaryColor ?? 'var(--color-primary-300, #a0d0cd)'
const animationSpeed = props.animationSpeed ?? 1
const emit = defineEmits(['exit'])

// Chat store for message history
const chatStore = useChatStore()
const messages = computed(() => chatStore.getSessionMessages(props.sessionId))
const messageListRef = ref<HTMLElement | null>(null)

// Auto scroll to bottom when new messages arrive
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// Watch for new messages and scroll
watch(messages, () => {
  nextTick(() => scrollToBottom())
}, { deep: true })

const tips = ref(t('rolePlay.voice.canStartSpeaking'))
const dot = ref(1)
let dotTimer: number | null = null

const persistenceSignal = reactive({
  lastTurnAt: ''
})
const volumeSensitivity = props.volumeSensitivity ?? 3

const recording = ref(false)
const assistantResponding = ref(false)
const turning = ref(false)
const playing = ref(false)

const asrText = ref('')
const llmText = ref('')

let currentStream: MediaStream | null = null
let audioCtx: AudioContext | null = null
let workletNode: AudioWorkletNode | null = null // mic encoder (16k)
let playerNode: AudioWorkletNode | null = null // pcm24k player
let playerGain: GainNode | null = null
let ws: WebSocket | null = null
const muted = ref(false)


// UI amplitude level (0..1), used to drive pulsating circle
const vuLevel = ref(0)
const breathingPhase = ref(0)

// breathing animation baseline
setInterval(() => {
  breathingPhase.value += 0.02 * animationSpeed
}, 50)

const circleScale = computed(() => {
  if (muted.value) return 1.0
  const breathingScale = 1 + Math.sin(breathingPhase.value) * 0.02 // subtle breathing
  const base = ((recording.value || playing.value) ? 1.06 : 1.0) * breathingScale
  const s = base + vuLevel.value * 0.25
  return Number.isFinite(s) ? s : 1.0
})

const circleShadow = computed(() => {
  if (muted.value) {
    const color = primaryColor.replace('#', '')
    const r = parseInt(color.substr(0,2), 16)
    const g = parseInt(color.substr(2,2), 16)
    const b = parseInt(color.substr(4,2), 16)
    return `0 0 12px rgba(${r}, ${g}, ${b}, 0.2)`
  }
  const breathingGlow = 0.1 + Math.sin(breathingPhase.value * 0.8) * 0.05
  const blur = Math.round(20 + vuLevel.value * 40 + breathingGlow * 10)
  const alpha = Math.min(0.7, 0.2 + vuLevel.value * 0.5 + breathingGlow).toFixed(2)
  const color = primaryColor.replace('#', '')
  const r = parseInt(color.substr(0,2), 16)
  const g = parseInt(color.substr(2,2), 16)
  const b = parseInt(color.substr(4,2), 16)
  return `0 0 ${blur}px rgba(${r}, ${g}, ${b}, ${alpha})`
})

const circleGradient = computed(() => {
  const size = Math.round(circleSize * 0.6)
  return `radial-gradient(${size}px ${size}px at 40% 40%, ${primaryColor}, ${secondaryColor})`
})

const circleStyle = computed(() => ({
  width: `${circleSize}px`,
  height: `${circleSize}px`,
  background: circleGradient.value,
  transform: `scale(${circleScale.value})`,
  boxShadow: circleShadow.value,
  flexShrink: '0',
  aspectRatio: '1 / 1'
}))


onMounted(() => {
  dotTimer = window.setInterval(() => {
    dot.value = (dot.value % 3) + 1
  }, 800)
  // 进入语音模式即开始聆听
  startRecord().catch(() => {})
})

onBeforeUnmount(() => {
  if (dotTimer) window.clearInterval(dotTimer)
  cleanupRealtime()
})

// 页面路由变化时也要清理连接
const { $router } = getCurrentInstance()?.appContext.config.globalProperties || {}
if ($router) {
  const unwatch = $router.beforeEach(() => {
    cleanupRealtime()
    unwatch() // 只执行一次
  })
}

async function startRecord() {
  // 开始实时推流（AudioWorklet → PCM16k → WebSocket）并订阅后端 SSE
  try {
    await startRealtime()
    // 确保AudioContext被激活（现代浏览器需要用户交互）
    if (audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume()
      console.log('[VoiceMode] AudioContext resumed')
    }
    recording.value = true
    if (!muted.value) {
      tips.value = t('rolePlay.voice.canStartSpeaking')
    } else {
      tips.value = t('rolePlay.voice.muted')
    }
  } catch (e: any) {
    tips.value = t('rolePlay.voice.micError', { error: e?.message || e })
  }
}


function exitVoice() {
  // 彻底停止本轮，退出语音
  try { ws?.send('close') } catch {}
  cleanupRealtime()
  playing.value = false
  turning.value = false
  recording.value = false
  emit('exit')
}

function onStateButtonClick() {
  if (playing.value) {
    // 暂停AI播放（只停止播放，不关闭会话）
    try { playerNode?.port.postMessage({ type: 'stop' }) } catch {}
    playing.value = false
    turning.value = false
    assistantResponding.value = false
    tips.value = t('rolePlay.voice.paused')
    console.log('[VoiceMode] AI playback paused by user')
    // 回到聆听状态，但不重新开始录音（保持当前状态）
    if (!recording.value && !muted.value) {
      setTimeout(() => startRecord().catch(() => {}), 200)
    }
  } else {
    // 正在听：手动触发提交
    try { ws?.send('commit') } catch {}
    tips.value = t('rolePlay.voice.manualCommit')
  }
}

function toggleMute() {
  const nextMuted = !muted.value
  muted.value = nextMuted

  if (nextMuted) {
    // 静音时：只停止用户音频数据传输，不影响AI播放
    vuLevel.value = 0 // 立即停止圆圈律动
    if (!playing.value && !assistantResponding.value) {
      tips.value = t('rolePlay.voice.muted')
    }
    console.log('[VoiceMode] Muted - user audio transmission stopped')
  } else {
    // 取消静音时：恢复用户音频数据传输
    if (!playing.value && !assistantResponding.value) {
      tips.value = t('rolePlay.voice.canStartSpeaking')
    }
    console.log('[VoiceMode] Unmuted - user audio transmission resumed')
  }
}


async function startRealtime() {

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  currentStream = stream
  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  await audioCtx.audioWorklet.addModule('/pcm16-worklet.js')
  await audioCtx.audioWorklet.addModule('/pcm24k-player.js')
  const source = audioCtx.createMediaStreamSource(stream)
  workletNode = new AudioWorkletNode(audioCtx, 'pcm16-processor', { processorOptions: { targetSampleRate: 16000 } })
  source.connect(workletNode)
  // Optional monitor pass-through; keep minimal or disconnect
  // workletNode.connect(audioCtx.destination)

  // Player worklet for streaming 24k PCM base64 from server
  playerNode = new AudioWorkletNode(audioCtx, 'pcm24k-player')
  // 根据阿里云官方文档，音频采样率为24kHz
  try { playerNode.port.postMessage({ type: 'setSrcRate', value: 24000 }) } catch {}
  console.log('[VoiceMode] Set player sample rate to 24000Hz (official Aliyun spec)')
  playerGain = audioCtx.createGain()
  playerGain.gain.value = 1 // 始终保持AI音量为1，静音只影响用户麦克风
  playerNode.connect(playerGain).connect(audioCtx.destination)

  // 调试信息
  console.log('[VoiceMode] Audio setup:', {
    audioCtxState: audioCtx.state,
    audioCtxSampleRate: audioCtx.sampleRate,
    playerGainValue: playerGain.gain.value,
    muted: muted.value,
    playerNodeConnected: !!playerNode,
    destinationConnected: !!audioCtx.destination
  })

  // 测试音频播放 - 播放一个简单的测试音调
  const testOscillator = audioCtx.createOscillator()
  const testGain = audioCtx.createGain()
  testOscillator.connect(testGain).connect(audioCtx.destination)
  testOscillator.frequency.setValueAtTime(440, audioCtx.currentTime) // A4音调
  testGain.gain.setValueAtTime(0.1, audioCtx.currentTime) // 低音量
  testOscillator.start(audioCtx.currentTime)
  testOscillator.stop(audioCtx.currentTime + 0.2) // 播放0.2秒
  console.log('[VoiceMode] Test tone played - if you hear a beep, audio output works')

  // Open SSE first to ensure we receive events (only once)
  // Open WebSocket for PCM frames (reopen if closed)
  if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) openWs()


  // Forward PCM Int16 buffers from worklet to WS
  workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
    if (muted.value) {
      vuLevel.value = 0
      return
    }
    // update UI vu meter from the same 20ms chunk (320 samples @16k)
    try {
      const view = new Int16Array(e.data)
      if (view && view.length) {
        let sum = 0
        for (let i = 0; i < view.length; i++) {
          const v = view[i]
          sum += v * v
        }
        const rms = Math.sqrt(sum / view.length) / 32768
        const level = Math.min(1, rms * volumeSensitivity) // configurable sensitivity
        vuLevel.value = vuLevel.value * 0.8 + level * 0.2 // smooth
      }
    } catch {}

    // forward to backend (阿里云VAD会自动处理打断)
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        if (muted.value) return
        console.log('[VoiceMode] sending audio data:', e.data.byteLength, 'bytes')
        ws.send(e.data)
      } else {
        console.warn('[VoiceMode] WebSocket not ready, state:', ws?.readyState)
      }
    } catch (err) {
      console.error('[VoiceMode] failed to send audio:', err)
    }
  }
}

function cleanupRealtime() {
  if (ws) { try { ws.close() } catch {} ; ws = null }
  if (workletNode) { try { workletNode.disconnect() } catch {} ; workletNode = null }
  if (playerNode) { try { playerNode.disconnect() } catch {} ; playerNode = null }
  if (playerGain) { try { playerGain.disconnect() } catch {} ; playerGain = null }
  if (audioCtx) { try { audioCtx.close() } catch {} ; audioCtx = null }
  if (currentStream) { try { currentStream.getTracks().forEach(t => t.stop()) } catch {} ; currentStream = null }
}

function openWs() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const url = `${proto}//${location.host}/ws/voice/stream?sessionId=${encodeURIComponent(props.sessionId)}&roleId=${encodeURIComponent(props.roleId)}`
  ws = new WebSocket(url)
  ws.binaryType = 'arraybuffer'
  ws.onopen = () => { /* ready to send PCM and receive events */ }
  ws.onerror = () => { tips.value = t('rolePlay.voice.voiceChannelError') }
  ws.onclose = () => { /* server closed or user exit */ }
  ws.onmessage = (ev: MessageEvent<string>) => {
    try {
      console.log('[WS] Raw message:', ev.data)
      const msg = JSON.parse(ev.data || '{}') as { event?: string; data?: any }
      const event = msg.event || ''
      const payload = msg.data
      console.log('[WS] Parsed event:', event, 'payload:', payload, 'type:', typeof payload)
      switch (event) {
        case 'user_final': {
          const text = textOf(payload)
          asrText.value = text
          if (text.trim()) appendMessage(props.sessionId, { type: EventType.USER, sender: 'user', message: text })
          assistantResponding.value = true
          break
        }
        case 'llm_delta': {
          const text = textOf(payload)

          if (assistantResponding.value) {
            llmText.value += text
            console.log('[WS] llm_delta - updated llmText:', JSON.stringify(llmText.value))
          } else {
            asrText.value = text
            console.log('[WS] llm_delta - updated asrText:', JSON.stringify(asrText.value))
          }
          break
        }
        case 'audio_delta': {

          if (!playerNode) {
            console.warn('[WS] audio_delta - playerNode not ready')
            return
          }
          if (!playerGain) {
            console.warn('[WS] audio_delta - playerGain not ready')
            return
          }
          const ab = base64ToArrayBuffer(String(payload))
          console.log('[WS] audio_delta - Debug info:', {
            payloadLength: String(payload).length,
            decodedBytes: ab.byteLength,
            playerGainValue: playerGain.gain.value,
            audioCtxState: audioCtx?.state,
            playing: playing.value
          })

          if (ab && ab.byteLength) {
            // 检查PCM数据的前几个字节
            const view = new Int16Array(ab.slice(0, Math.min(ab.byteLength, 20)))
            console.log('[WS] audio_delta - PCM sample data (first 10 samples):', Array.from(view))

            playerNode.port.postMessage({ type: 'push', pcm16: ab }, [ab])
            if (!playing.value) { playing.value = true; tips.value = t('rolePlay.voice.playing') }
            console.log('[WS] audio_delta - sent to player, playing:', playing.value)
          } else {
            console.warn('[WS] audio_delta - empty or invalid audio data')
          }

          break
        }
        case 'llm_final':
        case 'done': {
          console.log('[WS] Response completed')
          turning.value = false
          playing.value = false
          try { playerNode?.port.postMessage({ type: 'done' }) } catch {}
          const reply = llmText.value.trim()
          if (reply) {
            appendMessage(props.sessionId, { type: EventType.ASSISTANT, sender: 'assistant', message: reply })
            console.log('[WS] done - saved assistant message:', reply)
          }
          // 清空当前对话文本，准备下一轮
          llmText.value = ''
          asrText.value = ''
          assistantResponding.value = false
          persistenceSignal.lastTurnAt = new Date().toLocaleTimeString()
          // 自动开始下一轮录音
          if (!recording.value) {
            setTimeout(() => {
              startRecord().then(() => {
                if (!muted.value) {
                  tips.value = t('rolePlay.voice.canStartSpeaking')
                } else {
                  tips.value = t('rolePlay.voice.muted')
                }
              }).catch(() => {
                tips.value = t('rolePlay.voice.recordStartFailed')
              })
            }, 500)
          }
          break
        }
        case 'user_interrupt': {
          // 阿里云VAD检测到用户开始说话，打断AI播放
          console.log('[WS] User interruption detected by Aliyun VAD')
          if (playing.value) {
            try { playerNode?.port.postMessage({ type: 'stop' }) } catch {}
            playing.value = false
            assistantResponding.value = false
            turning.value = false
            if (!muted.value) {
              tips.value = t('rolePlay.voice.canContinueSpeaking')
            }
            // 被打断时不显示tip，只记录日志
            console.log('[WS] AI playback interrupted by user speech')
          }
          break
        }
        case 'user_speech_stopped': {
          // 用户停止说话
          console.log('[WS] User speech stopped')
          break
        }
        case 'error': {
          const errorMsg = textOf(payload) || t('rolePlay.voice.voiceChannelError')
          console.error('[WS] Server error:', errorMsg, 'raw payload:', payload)
          tips.value = errorMsg
          break
        }
        // session_created / voice_session_created 可按需处理
        default:
          console.log('[WS] Unhandled event:', event, 'payload:', payload)
          break
      }
    } catch (e) {
      console.error('[WS] Message parsing error:', e, 'raw data:', ev.data)
    }
  }
}

// SSE 已移除，统一走 WS 双工

function textOf(p: any): string {
  if (typeof p === 'string') return p
  if (!p || typeof p !== 'object') return ''
  return p.text || p.message || p.delta || ''
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  try {
    const cleaned = (b64 || '').replace(/\s+/g, '')
    const byteStr = atob(cleaned)
    const len = byteStr.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) bytes[i] = byteStr.charCodeAt(i)
    return bytes.buffer
  } catch {
    return new ArrayBuffer(0)
  }
}



</script>

<template>
  <div class="voice-mode">
    <section class="voice-chat">
      <header class="chat-header">
        <div class="chat-title">{{ t("rolePlay.voice.chatTitle") }}</div>
        <div class="chat-subtitle">{{ t("rolePlay.voice.chatSubtitle") }}</div>
      </header>

      <div ref="messageListRef" class="message-list" role="log" aria-live="polite" :aria-label="t('rolePlay.voice.chatTitle')">
        <div v-if="!messages.length" class="chat-empty">
          <AEmpty :description="t('rolePlay.voice.emptyVoice')" />
        </div>
        <template v-else>
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="message-item"
            :class="{ 'user': msg.type === EventType.USER, 'assistant': msg.type === EventType.ASSISTANT }"
          >
            <div class="bubble" :class="msg.type === EventType.USER ? 'user' : 'ai'">
              <div class="bubble-label">{{ msg.type === EventType.USER ? t('rolePlay.voice.senderYou') : t('rolePlay.voice.senderAI') }}</div>
              <div class="bubble-text">{{ msg.message }}</div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <aside class="voice-side">
      <ACard class="voice-control-card" bordered="false">

        <div class="voice-visual">
          <div class="circle-shell">
            <div class="circle" :class="{ speaking: recording || playing }" :style="circleStyle"></div>
            <div class="pulse-ring" :class="{ active: recording || playing }"></div>
          </div>
        </div>

        <div class="status-panel">
          <div class="status-line">
            <span class="status-dot" :class="{ active: recording || playing }"></span>
            <span class="status-text">{{ muted ? t('rolePlay.voice.currentMuted') : tips }}</span>
          </div>
          <div class="status-meta">
            <div class="meta-pill" :class="{ playing: playing }">{{ playing ? t('rolePlay.voice.aiPlaying') : (recording ? t('rolePlay.voice.listening') : t('rolePlay.voice.waitingStart')) }}</div>
            <div v-if="persistenceSignal.lastTurnAt" class="meta-pill ghost">{{ t("rolePlay.voice.snapshot", { time: persistenceSignal.lastTurnAt }) }}</div>
          </div>
        </div>

        <div v-if="asrText || llmText" class="live-captions">
          <div v-if="asrText" class="caption-block">
            <div class="caption-label">{{ t("rolePlay.voice.youAreSaying") }}</div>
            <div class="caption-text">{{ asrText }}</div>
          </div>
          <div v-if="llmText" class="caption-block">
            <div class="caption-label">{{ t("rolePlay.voice.aiReplying") }}</div>
            <div class="caption-text">{{ llmText }}</div>
          </div>
        </div>

        <div class="interaction-control">
          <TooltipProvider v-if="playing" :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <PauseOutlined class="action-icon pause" :aria-label="t('rolePlay.voice.pauseAI')" role="button" tabindex="0" @click="onStateButtonClick" @keydown.enter="onStateButtonClick" @keydown.space.prevent="onStateButtonClick"/>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">{{ t("rolePlay.voice.pauseAI") }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div v-else class="dots" :class="{ dancing: recording || assistantResponding }">
            <span v-for="i in 3" :key="i" :class="{ on: i === dot }"></span>
          </div>
        </div>

        <div class="voice-actions">
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Space :size="16">
              <Tooltip>
                <TooltipTrigger as-child>
                  <AudioMutedOutlined v-if="muted" class="action-icon" :aria-label="t('rolePlay.voice.unmute')" role="button" tabindex="0" @click="toggleMute" @keydown.enter="toggleMute" @keydown.space.prevent="toggleMute" />
                  <AudioTwoTone v-else class="action-icon" :aria-label="t('rolePlay.voice.mute')" role="button" tabindex="0" @click="toggleMute" @keydown.enter="toggleMute" @keydown.space.prevent="toggleMute" />
                </TooltipTrigger>
                <TooltipContent side="top" :side-offset="6">{{ muted ? t('rolePlay.voice.unmute') : t('rolePlay.voice.mute') }}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <CloseOutlined class="action-icon danger" :aria-label="t('rolePlay.voice.exitVoice')" role="button" tabindex="0" @click="exitVoice" @keydown.enter="exitVoice" @keydown.space.prevent="exitVoice" />
                </TooltipTrigger>
                <TooltipContent side="top" :side-offset="6">{{ t("rolePlay.voice.exitVoice") }}</TooltipContent>
              </Tooltip>
            </Space>
          </TooltipProvider>
        </div>
      </ACard>
    </aside>
  </div>
</template>


<style scoped lang="scss">
.voice-mode {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  width: 100%;
  padding: 24px 16px;
  box-sizing: border-box;
  color: var(--rp-navy);
  align-items: stretch;
}

.voice-chat {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--radius-xl, 20px);
  box-shadow: var(--shadow-lg);
  padding: 24px;
}

.chat-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--rp-navy-light);
}

.chat-subtitle {
  font-size: 0.8125rem;
  color: var(--rp-blue);
}

.message-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 4px;
}

.chat-empty {
  padding: 80px 0;
}

.message-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-item.user {
  align-items: flex-end;
}

.bubble {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: var(--radius-lg, 14px);
  max-width: 80%;
  line-height: 1.55;
  font-size: 0.875rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(142, 160, 215, 0.24);
  background: rgba(255, 255, 255, 0.82);
}

.bubble.user {
  background: linear-gradient(135deg, rgba(129, 211, 255, 0.28), rgba(99, 162, 255, 0.26));
  color: var(--rp-accent-teal);
  border-color: rgba(99, 162, 255, 0.34);
}

.bubble.ai {
  background: linear-gradient(135deg, rgba(142, 233, 208, 0.24), rgba(97, 204, 169, 0.22));
  color: var(--rp-accent-green);
  border-color: rgba(97, 204, 169, 0.28);
}

.bubble-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.7;
}

.bubble-text {
  word-break: break-word;
}

.voice-side {
  display: flex;
  flex-direction: column;
}

.voice-control-card {
  border-radius: var(--radius-xl, 22px);
  box-shadow: var(--shadow-lg);
  background: linear-gradient(165deg, rgba(104, 143, 255, 0.12), rgba(221, 229, 255, 0.32));
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: center;
}

.voice-visual {
  display: flex;
  justify-content: center;
  width: 100%;
}

.circle {
  border-radius: 50%;
  opacity: .85;
  transition: transform .08s linear, box-shadow .12s ease;
}

.circle-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: calc(100% + 36px);
  height: calc(100% + 36px);
  border-radius: 50%;
  border: 1px dashed rgba(103, 137, 255, 0.45);
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.3s ease, transform 0.4s ease;
}

.pulse-ring.active {
  opacity: 1;
  animation: breathe 2.8s ease-in-out infinite;
}

.status-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--rp-accent-indigo);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full, 50%);
  background: rgba(91, 115, 255, 0.35);
  transition: background var(--duration-normal, 200ms) var(--ease-fluid), box-shadow var(--duration-normal, 200ms) var(--ease-fluid);
}

.status-dot.active {
  background: rgba(91, 115, 255, 0.9);
  box-shadow: 0 0 0 6px rgba(91, 115, 255, 0.18);
}

.status-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.meta-pill {
  padding: 4px 10px;
  border-radius: var(--radius-md, 12px);
  font-size: 0.75rem;
  background: rgba(93, 118, 255, 0.18);
  color: var(--rp-accent-blue);
  font-weight: 600;
  letter-spacing: .2px;
}

.meta-pill.playing {
  background: rgba(62, 202, 173, 0.18);
  color: var(--rp-accent-emerald);
}

.meta-pill.ghost {
  background: rgba(150, 163, 214, 0.16);
  color: var(--rp-blue-dark);
  font-weight: 500;
}

.live-captions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  background: rgba(255, 255, 255, 0.32);
  border: 1px solid rgba(174, 191, 242, 0.28);
  border-radius: var(--radius-lg, 14px);
  padding: 14px 16px;
}

.caption-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.caption-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rp-accent-deep);
  letter-spacing: .2px;
}

.caption-text {
  font-size: 0.8125rem;
  color: var(--rp-navy);
  line-height: 1.5;
}

.interaction-control {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.dots {
  display: flex;
  gap: 8px;
  height: 16px;
  align-items: flex-end;
}

.dots span {
  width: 8px;
  height: 8px;
  background: var(--rp-text-light);
  border-radius: 50%;
  display: inline-block;
}

.dots span.on {
  background: var(--rp-accent-cyan);
}

.dots.dancing span {
  animation: beat 1.05s infinite ease-in-out;
}

.dots.dancing span:nth-child(1) { animation-delay: 0s }
.dots.dancing span:nth-child(2) { animation-delay: .18s }
.dots.dancing span:nth-child(3) { animation-delay: .36s }

.voice-actions {
  display: flex;
  justify-content: center;
  width: 100%;
}

.action-icon {
  cursor: pointer;
  font-size: 1.875rem;
  padding: 10px;
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(223, 232, 255, 0.9);
  border-radius: var(--radius-lg, 14px);
  color: var(--rp-accent-royal);
  transition: all var(--duration-normal, 200ms) var(--ease-fluid);

  &:hover {
    background: rgba(203, 216, 255, 1);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }
}

.action-icon.pause {
  background: rgba(188, 212, 255, 0.9);
  color: var(--rp-accent-deep);
}

.action-icon.danger {
  background: rgba(255, 215, 220, 0.85);
  color: var(--rp-accent-red);
}

.action-icon.danger:hover {
  background: rgba(255, 197, 203, 1);
}

.action-icon.pause:hover {
  background: rgba(165, 195, 255, 0.95);
}

@media (max-width: 1200px) {
  .voice-mode {
    grid-template-columns: 1fr;
  }

  .voice-side {
    order: -1;
  }
}

@keyframes pulse-pause {
  0%, 100% { transform: scale(1); opacity: 0.8 }
  50% { transform: scale(1.05); opacity: 1 }
}

@keyframes pulse {
  0%, 100% { opacity: .4 }
  50% { opacity: 1 }
}

@keyframes beat {
  0%, 100% { transform: translateY(0); opacity: .6 }
  50% { transform: translateY(-6px); opacity: 1 }
}

@keyframes breathe {
  0%, 100% { transform: scale(0.95); opacity: 0.45 }
  50% { transform: scale(1.05); opacity: 0.9 }
}

</style>

<!-- Dark mode overrides -->
<style lang="scss">
.dark {
  .voice-chat {
    background: rgba(255, 255, 255, 0.03);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .voice-mode .bubble {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .voice-mode .bubble.user {
    background: linear-gradient(135deg, rgba(129, 211, 255, 0.12), rgba(99, 162, 255, 0.1));
    border-color: rgba(99, 162, 255, 0.15);
  }

  .voice-mode .bubble.ai {
    background: linear-gradient(135deg, rgba(142, 233, 208, 0.1), rgba(97, 204, 169, 0.08));
    border-color: rgba(97, 204, 169, 0.12);
  }

  .voice-control-card {
    background: linear-gradient(165deg, rgba(104, 143, 255, 0.06), rgba(221, 229, 255, 0.08));
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .live-captions {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .voice-mode .action-icon {
    background: rgba(223, 232, 255, 0.1);

    &:hover {
      background: rgba(203, 216, 255, 0.15);
    }
  }

  .voice-mode .action-icon.pause {
    background: rgba(188, 212, 255, 0.12);
  }

  .voice-mode .action-icon.danger {
    background: rgba(255, 215, 220, 0.1);
  }

  .voice-mode .action-icon.danger:hover {
    background: rgba(255, 197, 203, 0.15);
  }

  .voice-mode .meta-pill {
    background: rgba(93, 118, 255, 0.12);
  }

  .voice-mode .meta-pill.playing {
    background: rgba(62, 202, 173, 0.12);
  }

  .voice-mode .meta-pill.ghost {
    background: rgba(150, 163, 214, 0.1);
  }

  .voice-mode .pulse-ring {
    border-color: rgba(103, 137, 255, 0.25);
  }
}
</style>
