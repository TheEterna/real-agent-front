<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ChevronRightIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useMessageBranchContext } from './context'

const { t } = useI18n()
const { goToNext, totalBranches } = useMessageBranchContext()
</script>

<template>
  <Button
    :aria-label="t('aiElements.message.nextBranch')"
    :disabled="totalBranches <= 1"
    size="icon-sm"
    type="button"
    variant="ghost"
    v-bind="$attrs"
    @click="goToNext"
  >
    <slot>
      <ChevronRightIcon :size="14" />
    </slot>
  </Button>
</template>
