/**
 * useAiDialog
 *
 * AI 对话逻辑、模式切换（advisor/simulator）、SSE 流处理。
 * 通过 Store 管理消息和模式状态。
 */

import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import i18n from '@/i18n'
import { useSSEConnection } from '@/composables/sse/useSSEConnection'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import { dialogApi } from '../api/chatAnalyzer'
import type { DialogMessage, DialogMode, ChatAnalyzerEvent } from '../types'

export function useAiDialog() {
  const store = useChatAnalyzerStore()
  const { connect, closeActiveSource } = useSSEConnection()

  const inputText = ref('')
  const isStreaming = ref(false)
  const streamingContent = ref('')

  const canSend = computed(() => inputText.value.trim().length > 0 && !isStreaming.value)

  /**
   * Send message and start SSE stream
   */
  async function sendMessage(contactId?: string) {
    const cid = contactId ?? store.activeContactId
    if (!cid || !canSend.value) return

    const userContent = inputText.value.trim()
    inputText.value = ''

    // Optimistic update: add user message immediately
    const userMsg: DialogMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userContent,
      createdTime: new Date(),
    }
    store.appendDialogMessage(cid, userMsg)

    // Add placeholder for AI response
    const aiRole = store.dialogMode === 'advisor' ? 'ai_advisor' : 'ai_simulator'
    const aiMsg: DialogMessage = {
      id: `temp-ai-${Date.now()}`,
      role: aiRole,
      content: '',
      createdTime: new Date(),
    }
    store.appendDialogMessage(cid, aiMsg)

    isStreaming.value = true
    streamingContent.value = ''

    const endpoint = dialogApi.getDialogStreamUrl(cid)
    const payload = {
      content: userContent,
      mode: store.dialogMode,
    }

    try {
      await connect(
        { endpoint, method: 'POST', payload },
        {
          onEvent(event: MessageEvent) {
            try {
              const data: ChatAnalyzerEvent = JSON.parse(event.data)

              switch (data.type) {
                case 'CONTENT':
                  if (data.content) {
                    streamingContent.value += data.content
                    store.updateLastDialogMessage(cid, streamingContent.value)
                  }
                  break
                case 'DONE':
                  isStreaming.value = false
                  streamingContent.value = ''
                  closeActiveSource()
                  break
                case 'ERROR':
                  isStreaming.value = false
                  streamingContent.value = ''
                  closeActiveSource()
                  message.error(data.error ?? i18n.global.t('chatAnalyzer.composable.dialogFailed'))
                  break
              }
            } catch (e) {
              console.error('[AiDialog] Failed to parse event:', e)
            }
          },
          onError(_event, errorInfo) {
            if (errorInfo?.isUnauthorized) return
            isStreaming.value = false
            streamingContent.value = ''

            const msg = errorInfo?.isServerError
              ? i18n.global.t('chatAnalyzer.composable.serverError')
              : errorInfo?.isNetworkError
                ? i18n.global.t('chatAnalyzer.composable.networkError')
                : i18n.global.t('chatAnalyzer.composable.sseError')
            message.error(msg)
          },
          onDisconnected() {
            if (isStreaming.value) {
              isStreaming.value = false
              streamingContent.value = ''
            }
          },
        },
      )
    } catch (e) {
      isStreaming.value = false
      streamingContent.value = ''
      message.error(e instanceof Error ? e.message : i18n.global.t('chatAnalyzer.composable.dialogConnectFailed'))
    }
  }

  /**
   * Stop ongoing stream
   */
  function stopStream() {
    closeActiveSource()
    isStreaming.value = false
    streamingContent.value = ''
  }

  /**
   * Switch dialog mode (advisor / simulator)
   */
  function switchMode(mode: DialogMode) {
    if (isStreaming.value) {
      message.warning(i18n.global.t('chatAnalyzer.composable.waitReply'))
      return
    }
    store.setDialogMode(mode)
  }

  return {
    inputText,
    isStreaming,
    streamingContent,
    canSend,
    sendMessage,
    stopStream,
    switchMode,
  }
}
