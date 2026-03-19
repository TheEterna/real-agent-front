<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CollapsibleContent } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { MessageContent, MessageResponse } from '@/components/ai-elements/message'

interface Props {
  class?: HTMLAttributes['class']
  content: string
}

const props = defineProps<Props>()
</script>

<template>
  <CollapsibleContent
    :class="cn(
      'mt-4 text-base',
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2',
      'data-[state=open]:slide-in-from-top-2 text-muted-foreground',
      'outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      props.class,
    )"
  >
    <MessageContent>
      <MessageResponse :content="props.content" />
    </MessageContent>
  </CollapsibleContent>
</template>
