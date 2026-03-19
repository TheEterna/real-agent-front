/**
 * Video Playground GSAP 动画封装
 *
 * 提供所有状态转换动画的统一接口
 *
 * @author Han
 * @since 2026-02-03
 */

import gsap from 'gsap'
import type { Ref } from 'vue'

export function useVideoAnimations() {
  /**
   * 空状态 → 生成中
   */
  const animateEmptyToGenerating = (
    loaderRef: Ref<HTMLElement | undefined>,
    progressRef: Ref<HTMLElement | undefined>
  ) => {
    const tl = gsap.timeline()

    if (loaderRef.value) {
      tl.fromTo(
        loaderRef.value,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
    }

    if (progressRef.value) {
      tl.fromTo(
        progressRef.value,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
    }

    return tl
  }

  /**
   * 生成中 → 完成
   */
  const animateGeneratingToComplete = (
    loaderRef: Ref<HTMLElement | undefined>,
    videoRef: Ref<HTMLElement | undefined>
  ) => {
    const tl = gsap.timeline()

    // 1. 加载器消失
    if (loaderRef.value) {
      tl.to(loaderRef.value, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in'
      })
    }

    // 2. 视频卡片入场（3D 翻转效果）
    if (videoRef.value) {
      tl.fromTo(
        videoRef.value,
        {
          y: 100,
          rotateX: 15,
          opacity: 0,
          scale: 0.9
        },
        {
          y: 0,
          rotateX: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out'
        },
        '-=0.2'
      )
    }

    return tl
  }

  /**
   * 视频卡片悬浮效果
   */
  const animateVideoHover = (element: HTMLElement, isHovering: boolean) => {
    if (isHovering) {
      gsap.to(element, {
        rotateY: 5,
        rotateX: -5,
        scale: 1.02,
        duration: 0.5,
        ease: 'power2.out'
      })
    } else {
      gsap.to(element, {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out'
      })
    }
  }

  /**
   * 按钮点击动画
   */
  const animateButtonClick = (element: HTMLElement) => {
    const tl = gsap.timeline()

    tl.to(element, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.in'
    }).to(element, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out'
    })

    return tl
  }

  /**
   * 进度条动画
   */
  const animateProgress = (element: HTMLElement, progress: number) => {
    gsap.to(element, {
      width: `${progress}%`,
      duration: 0.3,
      ease: 'power2.out'
    })
  }

  /**
   * 失败状态抖动
   */
  const animateError = (element: HTMLElement) => {
    const tl = gsap.timeline()

    tl.to(element, {
      x: -10,
      duration: 0.1,
      ease: 'power2.inOut'
    })
      .to(element, {
        x: 10,
        duration: 0.1,
        ease: 'power2.inOut'
      })
      .to(element, {
        x: -10,
        duration: 0.1,
        ease: 'power2.inOut'
      })
      .to(element, {
        x: 0,
        duration: 0.1,
        ease: 'power2.inOut'
      })

    return tl
  }

  /**
   * 缩略图入场动画
   */
  const animateThumbnailIn = (element: HTMLElement, index: number) => {
    gsap.fromTo(
      element,
      {
        scale: 0,
        opacity: 0
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        delay: index * 0.05,
        ease: 'back.out(1.7)'
      }
    )
  }

  /**
   * 模式切换动画
   */
  const animateModeSwitch = (
    panelRef: Ref<HTMLElement | undefined>,
    isEntering: boolean
  ) => {
    if (!panelRef.value) return

    if (isEntering) {
      gsap.fromTo(
        panelRef.value,
        { x: -280, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
    } else {
      gsap.to(panelRef.value, {
        x: -280,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      })
    }
  }

  return {
    animateEmptyToGenerating,
    animateGeneratingToComplete,
    animateVideoHover,
    animateButtonClick,
    animateProgress,
    animateError,
    animateThumbnailIn,
    animateModeSwitch
  }
}
