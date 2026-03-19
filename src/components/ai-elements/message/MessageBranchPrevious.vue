<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useMessageBranchContext } from './context'

const { t } = useI18n()
const { goToPrevious, totalBranches } = useMessageBranchContext()
</script>

<template>
  <Button
    :aria-label="t('aiElements.message.previousBranch')"
    :disabled="totalBranches <= 1"
    size="icon-sm"
    type="button"
    variant="ghost"
    v-bind="$attrs"
    @click="goToPrevious"
  >
    <slot>
      <ChevronLeftIcon :size="14" />
    </slot>
  </Button>
</template>
