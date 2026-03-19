<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CodeArgs } from '@/types/ui-event'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { Copy, Check } from 'lucide-vue-next'

const { t } = useI18n()
const props = defineProps<{ args: CodeArgs }>()

const copied = ref(false)

const highlightedCode = computed(() => {
  const lang = props.args.language
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(props.args.code, { language: lang, ignoreIllegals: true }).value
    } catch {
      // fall through to escape
    }
  }
  return escapeHtml(props.args.code)
})

const lines = computed(() => {
  return highlightedCode.value.split('\n')
})

const highlightSet = computed(() => new Set(props.args.highlightLines ?? []))

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.args.code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // clipboard API may not be available
  }
}
</script>

<template>
  <div class="w-full rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm overflow-hidden text-[0.8125rem]">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 bg-zinc-50/60 border-b border-zinc-100">
      <div class="flex items-center gap-2">
        <span v-if="args.title" class="text-xs font-semibold text-zinc-700">{{ args.title }}</span>
        <span class="text-[0.75rem] font-mono text-zinc-400 uppercase tracking-wider">{{ args.language }}</span>
      </div>
      <button
        class="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/80 transition-all duration-150 active:scale-95"
        @click="copyToClipboard"
      >
        <component :is="copied ? Check : Copy" :size="13" />
        <span>{{ copied ? t('uiEvent.code.copied') : t('uiEvent.code.copy') }}</span>
      </button>
    </div>

    <!-- Code body -->
    <div class="overflow-x-auto">
      <pre class="m-0 py-3 font-mono leading-relaxed bg-transparent"><code><template v-for="(line, index) in lines" :key="index"><div
  class="px-4 flex"
  :class="highlightSet.has(index + 1) ? 'bg-amber-50/80 border-l-2 border-amber-400' : 'border-l-2 border-transparent'"
><span class="inline-block w-8 shrink-0 text-right text-zinc-400 select-none mr-4 text-[0.75rem]">{{ index + 1 }}</span><span class="flex-1 whitespace-pre text-zinc-800" v-html="line || '&nbsp;'"></span></div></template></code></pre>
    </div>
  </div>
</template>
