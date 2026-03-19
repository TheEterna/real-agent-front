<script setup lang="ts">
import type { HTMLAttributes, VNode } from 'vue'
import type { MessageBranchContextType } from './context'
import { cn } from '@/lib/utils'
import { provide, readonly, ref, watch } from 'vue'
import { MessageBranchKey } from './context'

interface Props {
  defaultBranch?: number
  totalBranches?: number  // 新增：允许直接传入分支总数（用于外部状态管理场景）
  class?: HTMLAttributes['class']
}
const props = withDefaults(defineProps<Props>(), {
  defaultBranch: 0,
})

const emits = defineEmits<{
  (e: 'branchChange', branchIndex: number): void
}>()

const currentBranch = ref<number>(props.defaultBranch)
const branches = ref<VNode[]>([])
const totalBranchesRef = ref<number>(0)

// 监听 props.totalBranches 变化，同步到内部 ref
// 这允许外部直接传入分支总数，而不必使用 MessageBranchContent
watch(
  () => props.totalBranches,
  (newCount) => {
    if (newCount !== undefined && newCount >= 0) {
      totalBranchesRef.value = newCount
    }
  },
  { immediate: true }
)

function handleBranchChange(index: number) {
  currentBranch.value = index
  emits('branchChange', index)
}

function goToPrevious() {
  if (totalBranchesRef.value === 0)
    return
  const next = currentBranch.value > 0 ? currentBranch.value - 1 : totalBranchesRef.value - 1
  handleBranchChange(next)
}

function goToNext() {
  if (totalBranchesRef.value === 0)
    return
  const next = currentBranch.value < totalBranchesRef.value - 1 ? currentBranch.value + 1 : 0
  handleBranchChange(next)
}

function setBranches(count: number) {
  totalBranchesRef.value = count
}

const contextValue: MessageBranchContextType = {
  currentBranch: readonly(currentBranch),
  totalBranches: readonly(totalBranchesRef),
  goToPrevious,
  goToNext,
  branches,
  setBranches,
}

provide(MessageBranchKey, contextValue)
</script>

<template>
  <div
    :class="cn('grid w-full gap-2 [&>div]:pb-0', props.class)"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
