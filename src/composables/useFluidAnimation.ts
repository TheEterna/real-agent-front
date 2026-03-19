import gsap from 'gsap'
import { useReducedMotion } from './useReducedMotion'

export function useFluidAnimation() {
  const { prefersReduced, duration } = useReducedMotion()

  /** 呼吸效果 - 用于可交互元素的 hover 态 */
  function breathe(el: Element) {
    if (prefersReduced.value) return null
    return gsap.to(el, {
      scale: 1.06,
      boxShadow: 'var(--glow-subtle)',
      repeat: -1,
      yoyo: true,
      duration: 1.1,
      ease: 'sine.inOut',
    })
  }

  /** 弹入效果 - 用于新元素插入（消息卡片、工具卡片） */
  function springIn(el: Element) {
    return gsap.from(el, {
      y: 12,
      opacity: 0,
      scale: 0.97,
      duration: duration.value,
      ease: 'back.out(1.4)',
    })
  }

  /** 成功确认 - 用于操作完成反馈 */
  function confirmSuccess(el: Element) {
    return gsap.timeline()
      .to(el, { scale: 1.15, duration: 0.15, ease: 'power2.out' })
      .to(el, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
  }

  /** 错误抖动 - 用于操作失败反馈 */
  function shakeError(el: Element) {
    if (prefersReduced.value) return null
    return gsap.to(el, {
      keyframes: [
        { x: -4, duration: 0.08 },
        { x: 4, duration: 0.08 },
        { x: -2, duration: 0.08 },
        { x: 2, duration: 0.08 },
        { x: 0, duration: 0.08 },
      ],
      ease: 'power2.inOut',
    })
  }

  return { breathe, springIn, confirmSuccess, shakeError }
}
