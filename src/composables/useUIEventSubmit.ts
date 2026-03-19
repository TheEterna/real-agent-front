import { ref } from 'vue'
import i18n from '@/i18n'

const t = i18n.global.t

/** resume 函数类型（与 useSSE 的 resumeVoloAI 签名一致） */
type ResumeFn = (resumePointId: string, response?: any) => Promise<void>

/**
 * UI Event elicitation 回传 composable
 *
 * 封装 elicitation 模式下用户提交数据的逻辑：
 * - 接收来自 Index.vue 的 resumeVoloAI 函数
 * - 管理 submitting / submitted / error 状态
 * - 提交后锁定防重复
 *
 * @param resumeFn - 恢复 agent 执行的函数（来自 useSSE().resumeVoloAI）
 */
export function useUIEventSubmit(resumeFn: ResumeFn) {
  const submitting = ref(false)
  const submitted = ref(false)
  const error = ref<string | null>(null)

  /**
   * 提交 elicitation 数据
   * @param turnId - 当前 turn 的 resumePointId（用于恢复 agent 执行）
   * @param data - 用户填入的结构化数据
   */
  async function submitElicitation(turnId: string, data: Record<string, any>) {
    // 防重复提交
    if (submitting.value || submitted.value) return

    submitting.value = true
    error.value = null

    try {
      await resumeFn(turnId, {
        selectedOptionId: 'submit',
        data
      })
      submitted.value = true
    } catch (err: any) {
      error.value = err?.message || t('composable.uiEventSubmit.submitFailedRetry')
      console.error('[useUIEventSubmit] 提交失败:', err)
    } finally {
      submitting.value = false
    }
  }

  /** 重置状态（允许重新提交） */
  function reset() {
    submitting.value = false
    submitted.value = false
    error.value = null
  }

  return {
    submitting,
    submitted,
    error,
    submitElicitation,
    reset
  }
}
