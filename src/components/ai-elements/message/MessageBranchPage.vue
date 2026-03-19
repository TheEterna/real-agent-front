<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ButtonGroupText } from '@/components/ui/button-group'
import { cn } from '@/lib/utils'
import { useI18n } from 'vue-i18n'
import { useMessageBranchContext } from './context'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const { t } = useI18n()
const { currentBranch, totalBranches } = useMessageBranchContext()
</script>

<template>
  <ButtonGroupText
    :class="
      cn(
        'border-none bg-transparent text-muted-foreground shadow-none',
        props.class,
      )
    "
    v-bind="$attrs"
  >
    {{ t('aiElements.message.branchPage', { current: currentBranch + 1, total: totalBranches }) }}
  </ButtonGroupText>
</template>
