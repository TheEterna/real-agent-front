import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'

export function useReducedMotion() {
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  const duration = computed(() => prefersReduced.value ? 0 : 0.3)
  const ease = computed(() => prefersReduced.value ? 'none' : 'power2.out')

  return { prefersReduced, duration, ease }
}
