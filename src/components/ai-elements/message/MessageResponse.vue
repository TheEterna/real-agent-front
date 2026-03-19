<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import MarkdownRender from 'vue-renderer-markdown'
import 'vue-renderer-markdown/index.css'

interface Props {
  content: string
  class?: HTMLAttributes['class']
}
const props = defineProps<Props>()

</script>

<template>
  <MarkdownRender
      :class="
        cn(
          'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          props.class,
        )
      "
      :content="props.content"
      v-bind="$attrs"
  />
</template>
<style lang="scss" scoped>

:deep().paragraph-node {
  margin: 0;
  margin-top: 0.75em!important;
}
:deep()h3 {
  margin-top: 0.75em!important;
}

</style>