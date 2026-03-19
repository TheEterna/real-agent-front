/**
 * useAnalysis
 *
 * 触发分析 SSE、报告数据管理、报告 Drawer 控制。
 * 通过 Store 管理分析状态和报告数据。
 */

import { ref } from 'vue'
import { message } from 'ant-design-vue'
import i18n from '@/i18n'
import { useSSEConnection } from '@/composables/sse/useSSEConnection'
import { useChatAnalyzerStore } from '../stores/chatAnalyzerStore'
import { analysisApi } from '../api/chatAnalyzer'
import type { AnalysisReport, ChatAnalyzerEvent } from '../types'

export function useAnalysis() {
  const store = useChatAnalyzerStore()
  const { connect, closeActiveSource } = useSSEConnection()

  const isAnalyzing = ref(false)
  const analyzeProgress = ref('')
  const reportDrawerOpen = ref(false)

  /**
   * Trigger analysis for the active contact
   */
  async function startAnalysis(contactId?: string) {
    const cid = contactId ?? store.activeContactId
    if (!cid) {
      message.warning(i18n.global.t('chatAnalyzer.composable.selectContactFirst'))
      return
    }

    if (isAnalyzing.value) return

    isAnalyzing.value = true
    analyzeProgress.value = ''
    store.setAnalysisStatus('analyzing')

    const endpoint = analysisApi.getAnalyzeStreamUrl(cid)

    try {
      await connect(
        { endpoint, method: 'POST', payload: {} },
        {
          onEvent(event: MessageEvent) {
            try {
              const data: ChatAnalyzerEvent = JSON.parse(event.data)

              switch (data.type) {
                case 'STARTED':
                  analyzeProgress.value = i18n.global.t('chatAnalyzer.composable.analysisInit')
                  break
                case 'ANALYZING':
                  analyzeProgress.value = data.content ?? i18n.global.t('chatAnalyzer.composable.analysisProgress')
                  break
                case 'REPORT':
                  if (data.data) {
                    store.setReport(cid, data.data as AnalysisReport)
                    store.setAnalysisStatus('done')
                  }
                  break
                case 'EMOTION_TAG':
                  // Emotion tags are written back to records
                  // Reload records to get updated emotions
                  break
                case 'DONE':
                  isAnalyzing.value = false
                  analyzeProgress.value = ''
                  store.setAnalysisStatus('done')
                  closeActiveSource()
                  // Reload records to get emotion tags
                  store.loadRecords(cid)
                  message.success(i18n.global.t('chatAnalyzer.composable.analysisComplete'))
                  break
                case 'ERROR':
                  isAnalyzing.value = false
                  analyzeProgress.value = ''
                  store.setAnalysisStatus('error')
                  closeActiveSource()
                  message.error(data.error ?? i18n.global.t('chatAnalyzer.composable.analysisFailed'))
                  break
              }
            } catch (e) {
              console.error('[Analysis] Failed to parse event:', e)
            }
          },
          onError(_event, errorInfo) {
            if (errorInfo?.isUnauthorized) return
            isAnalyzing.value = false
            analyzeProgress.value = ''
            store.setAnalysisStatus('error')

            const msg = errorInfo?.isServerError
              ? i18n.global.t('chatAnalyzer.composable.analysisServerError')
              : errorInfo?.isNetworkError
                ? i18n.global.t('chatAnalyzer.composable.networkError')
                : i18n.global.t('chatAnalyzer.composable.sseError')
            message.error(msg)
          },
          onDisconnected() {
            if (isAnalyzing.value) {
              isAnalyzing.value = false
              analyzeProgress.value = ''
            }
          },
        },
      )
    } catch (e) {
      isAnalyzing.value = false
      analyzeProgress.value = ''
      store.setAnalysisStatus('error')
      message.error(e instanceof Error ? e.message : i18n.global.t('chatAnalyzer.composable.analysisConnectFailed'))
    }
  }

  /**
   * Stop ongoing analysis
   */
  function stopAnalysis() {
    closeActiveSource()
    isAnalyzing.value = false
    analyzeProgress.value = ''
  }

  /**
   * Open report drawer
   */
  function openReportDrawer() {
    reportDrawerOpen.value = true
  }

  /**
   * Close report drawer
   */
  function closeReportDrawer() {
    reportDrawerOpen.value = false
  }

  return {
    isAnalyzing,
    analyzeProgress,
    reportDrawerOpen,
    startAnalysis,
    stopAnalysis,
    openReportDrawer,
    closeReportDrawer,
  }
}
