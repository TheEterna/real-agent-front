/**
 * 批量生成初稿 Composable
 *
 * 流程：生成(buffer) → 审阅(accept/reject) → 保存(仅采纳的节点)
 * 核心原则：AI 生成的内容必须经用户确认后才写入后端。
 */
import { ref, computed } from 'vue'
import i18n from '@/i18n'
import MarkdownIt from 'markdown-it'
import type { BatchNodeStatus } from '@/types/thesis-writer'
import { saveChapterContent } from '@/api/thesis-writer'
import { useThesisSSE } from './useThesisSSE'
import { useThesisStore } from '../stores/thesisStore'

export type BatchDraftState = 'idle' | 'generating' | 'review' | 'saving' | 'done' | 'error'

export function useBatchDraft() {
  const { t } = i18n.global
  const thesisStore = useThesisStore()
  const { streamGuidedWrite, stopStream } = useThesisSSE()
  const md = new MarkdownIt({ html: true })

  // ==================== State ====================
  const state = ref<BatchDraftState>('idle')
  const nodeStatuses = ref<BatchNodeStatus[]>([])
  const currentNodeId = ref<string | null>(null)
  const currentPreview = ref('')
  const errorMessage = ref('')

  /** 内容按 nodeId 分桶 */
  const contentBuffers = new Map<string, string>()

  // ==================== Computed ====================

  /** 生成完成（含 generated + error）的节点数 */
  const generatedCount = computed(() =>
    nodeStatuses.value.filter(n => n.status === 'generated' || n.status === 'completed').length,
  )

  const completedCount = computed(() =>
    nodeStatuses.value.filter(n => n.status === 'completed').length,
  )

  const totalCount = computed(() => nodeStatuses.value.length)

  const totalWordCount = computed(() =>
    nodeStatuses.value.reduce((sum, n) => sum + n.wordCount, 0),
  )

  const failedNodes = computed(() =>
    nodeStatuses.value.filter(n => n.status === 'error'),
  )

  const currentNodeTitle = computed(() => {
    if (!currentNodeId.value) return ''
    const found = nodeStatuses.value.find(n => n.nodeId === currentNodeId.value)
    return found?.title || ''
  })

  /** 生成阶段进度（基于 generated + error 占比） */
  const progress = computed(() => {
    if (totalCount.value === 0) return 0
    const done = nodeStatuses.value.filter(
      n => n.status === 'generated' || n.status === 'error' || n.status === 'completed',
    ).length
    return Math.round((done / totalCount.value) * 100)
  })

  /** 审阅阶段：已采纳的节点 */
  const acceptedNodes = computed(() =>
    nodeStatuses.value.filter(n => n.decision === 'accepted'),
  )

  /** 审阅阶段：已拒绝的节点 */
  const rejectedNodes = computed(() =>
    nodeStatuses.value.filter(n => n.decision === 'rejected'),
  )

  /** 审阅阶段：待决策的节点（generated 且 decision 为 pending） */
  const pendingReviewNodes = computed(() =>
    nodeStatuses.value.filter(n => n.status === 'generated' && n.decision === 'pending'),
  )

  /** 是否所有可审阅节点都已做出决策 */
  const allReviewed = computed(() =>
    nodeStatuses.value
      .filter(n => n.status === 'generated')
      .every(n => n.decision !== 'pending'),
  )

  /** 采纳节点的总字数 */
  const acceptedWordCount = computed(() =>
    acceptedNodes.value.reduce((sum, n) => sum + n.wordCount, 0),
  )

  // ==================== Actions ====================

  /**
   * 开始批量生成
   */
  async function startBatchGeneration(params: {
    projectId: string
    selectedNodeIds: string[]
    chapterType: string
    answers: Record<string, string>
    note?: string
  }) {
    const { projectId, selectedNodeIds, chapterType, answers, note } = params

    // 初始化状态
    state.value = 'generating'
    errorMessage.value = ''
    currentPreview.value = ''
    currentNodeId.value = null
    contentBuffers.clear()

    // 初始化每个节点的状态（记录已有字数，用于审阅时提示覆盖风险）
    nodeStatuses.value = selectedNodeIds.map(nodeId => {
      const node = thesisStore.getNode(nodeId)
      return {
        nodeId,
        title: node?.title || nodeId,
        status: 'pending' as const,
        wordCount: 0,
        existingWordCount: node?.actualWordCount || 0,
        decision: 'pending' as const,
      }
    })

    // 锁定所有要生成的节点（防止用户同时编辑）
    thesisStore.lockNodes(selectedNodeIds)

    // 发起 SSE 流
    await streamGuidedWrite(
      {
        projectId,
        nodeId: selectedNodeIds[0],
        chapterType,
        answers,
        note,
        batchNodeIds: selectedNodeIds,
      },
      {
        batchMode: true,
        batchTotal: selectedNodeIds.length,

        onNodeStarted(nodeId: string) {
          currentNodeId.value = nodeId
          currentPreview.value = ''
          contentBuffers.set(nodeId, '')

          // 更新状态
          const idx = nodeStatuses.value.findIndex(n => n.nodeId === nodeId)
          if (idx !== -1) {
            nodeStatuses.value[idx].status = 'generating'
          }

          // 确保节点处于锁定状态
          thesisStore.lockNode(nodeId)
        },

        onContent(chunk: string) {
          if (currentNodeId.value) {
            const prev = contentBuffers.get(currentNodeId.value) || ''
            contentBuffers.set(currentNodeId.value, prev + chunk)
            currentPreview.value += chunk
          }
        },

        onDone() {
          // 批量模式下每个节点都有 DONE，不做特殊处理
        },

        async onNodeComplete(nodeId: string) {
          let content = contentBuffers.get(nodeId) || ''
          const idx = nodeStatuses.value.findIndex(n => n.nodeId === nodeId)

          // 如果内容看起来是 Markdown（不以 HTML 标签开头），转换为 HTML
          if (content && !content.trimStart().startsWith('<')) {
            content = md.render(content)
            // 回写转换后的 HTML 到 buffer
            contentBuffers.set(nodeId, content)
          }

          // 计算字数
          const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
          const englishWords = (content.match(/[a-zA-Z]+/g) || []).length
          const wordCount = chineseChars + englishWords

          // 标记为已生成（不保存，等待用户审阅）
          if (idx !== -1) {
            nodeStatuses.value[idx].status = 'generated'
            nodeStatuses.value[idx].wordCount = wordCount
            // 有已有内容的节点默认不采纳，需用户显式确认
            nodeStatuses.value[idx].decision = nodeStatuses.value[idx].existingWordCount > 0
              ? 'pending'
              : 'accepted'
          }

          // 判断是否全部生成完成 → 进入审阅阶段
          const allGenerated = nodeStatuses.value.every(
            n => n.status === 'generated' || n.status === 'error',
          )
          if (allGenerated) {
            state.value = 'review'
            currentNodeId.value = null
          }
        },

        onError(err: string) {
          errorMessage.value = err

          // 标记正在生成的节点为错误
          for (const ns of nodeStatuses.value) {
            if (ns.status === 'generating') {
              ns.status = 'error'
              ns.error = err
            }
          }

          // 如果有已生成的节点，进入审阅（用户仍可采纳已完成的部分）
          const hasGenerated = nodeStatuses.value.some(n => n.status === 'generated')
          if (hasGenerated) {
            state.value = 'review'
          } else {
            state.value = 'error'
            // 全部失败，解锁所有节点
            thesisStore.unlockNodes(nodeStatuses.value.map(n => n.nodeId))
          }
        },
      },
    )
  }

  /**
   * 取消生成 — 已生成的节点进入审阅，未完成的标记取消
   */
  function cancelGeneration() {
    stopStream()

    // 标记未完成的节点
    for (const ns of nodeStatuses.value) {
      if (ns.status === 'generating' || ns.status === 'pending') {
        ns.status = 'error'
        ns.error = t('thesisWriter.batchDraftComposable.cancelled')
      }
    }

    // 如果有已生成的节点，进入审阅（用户仍可采纳已完成的部分）
    const hasGenerated = nodeStatuses.value.some(n => n.status === 'generated')
    if (hasGenerated) {
      state.value = 'review'
    } else {
      state.value = 'done'
      // 全部取消，解锁所有节点
      thesisStore.unlockNodes(nodeStatuses.value.map(n => n.nodeId))
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    state.value = 'idle'
    nodeStatuses.value = []
    currentNodeId.value = null
    currentPreview.value = ''
    errorMessage.value = ''
    contentBuffers.clear()
    // 确保解锁所有节点
    thesisStore.clearAllLocks()
  }

  // ==================== 审阅操作 ====================

  /** 采纳单个节点 */
  function acceptNode(nodeId: string) {
    const ns = nodeStatuses.value.find(n => n.nodeId === nodeId)
    if (ns && ns.status === 'generated') {
      ns.decision = 'accepted'
    }
  }

  /** 拒绝单个节点 */
  function rejectNode(nodeId: string) {
    const ns = nodeStatuses.value.find(n => n.nodeId === nodeId)
    if (ns && ns.status === 'generated') {
      ns.decision = 'rejected'
    }
  }

  /** 全部采纳 */
  function acceptAll() {
    for (const ns of nodeStatuses.value) {
      if (ns.status === 'generated') {
        ns.decision = 'accepted'
      }
    }
  }

  /** 全部拒绝 */
  function rejectAll() {
    for (const ns of nodeStatuses.value) {
      if (ns.status === 'generated') {
        ns.decision = 'rejected'
      }
    }
  }

  /** 获取节点的生成内容预览（HTML） */
  function getNodeContent(nodeId: string): string {
    return contentBuffers.get(nodeId) || ''
  }

  /**
   * 保存所有已采纳的节点到后端
   * @returns 保存统计
   */
  async function saveAcceptedNodes(): Promise<{ saved: number; errors: number }> {
    const toSave = nodeStatuses.value.filter(
      n => n.status === 'generated' && n.decision === 'accepted',
    )

    if (toSave.length === 0) {
      // 没有要保存的，直接完成
      finishReview()
      return { saved: 0, errors: 0 }
    }

    state.value = 'saving'
    let saved = 0
    let errors = 0

    for (const ns of toSave) {
      ns.status = 'saving'
      const content = contentBuffers.get(ns.nodeId) || ''

      try {
        const res = await saveChapterContent(ns.nodeId, content)
        if (res.code === 200) {
          ns.status = 'completed'
          saved++
        } else {
          ns.status = 'error'
          ns.error = res.message || t('thesisWriter.batchDraftComposable.saveFailed')
          errors++
        }
      } catch (e) {
        console.error(`[BatchDraft] 保存节点 ${ns.nodeId} 失败:`, e)
        ns.status = 'error'
        ns.error = t('thesisWriter.batchDraftComposable.networkError')
        errors++
      }
    }

    finishReview()
    return { saved, errors }
  }

  /** 放弃所有生成内容，不保存任何东西 */
  function discardAll() {
    // 解锁所有节点
    thesisStore.unlockNodes(nodeStatuses.value.map(n => n.nodeId))
    state.value = 'done'
  }

  /** 审阅结束后的收尾：解锁节点、刷新大纲 */
  function finishReview() {
    // 解锁所有节点
    thesisStore.unlockNodes(nodeStatuses.value.map(n => n.nodeId))
    state.value = 'done'
    // 刷新大纲（已保存的节点字数会更新）
    thesisStore.loadOutline()
  }

  return {
    // State
    state,
    nodeStatuses,
    currentNodeId,
    currentNodeTitle,
    currentPreview,
    errorMessage,

    // Computed
    generatedCount,
    completedCount,
    totalCount,
    totalWordCount,
    failedNodes,
    progress,
    acceptedNodes,
    rejectedNodes,
    pendingReviewNodes,
    allReviewed,
    acceptedWordCount,

    // Actions
    startBatchGeneration,
    cancelGeneration,
    reset,

    // Review Actions
    acceptNode,
    rejectNode,
    acceptAll,
    rejectAll,
    getNodeContent,
    saveAcceptedNodes,
    discardAll,
  }
}
