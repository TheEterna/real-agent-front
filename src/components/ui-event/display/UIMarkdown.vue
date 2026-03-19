<script setup lang="ts">
import { computed } from 'vue'
import type { MarkdownArgs } from '@/types/ui-event'
// @ts-ignore
import MarkdownIt from 'markdown-it'
// @ts-ignore
import DOMPurify from 'dompurify'
// @ts-ignore
import * as markdownItTaskLists from 'markdown-it-task-lists'
// @ts-ignore
import * as markdownItAnchor from 'markdown-it-anchor'
// @ts-ignore
import * as mkatex from 'markdown-it-katex'
// @ts-ignore
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const props = defineProps<{ args: MarkdownArgs }>()

// Same resolvePlugin helper as MarkdownViewer.vue
const resolvePlugin = (p: any) => {
  if (!p) return p
  const cand = (p as any).default ?? p
  if (typeof cand === 'function') return cand
  for (const key of Object.keys(p)) {
    const v = (p as any)[key]
    if (typeof v === 'function') return v
  }
  return cand
}

const md: any = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch {
        // fall through
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})
  .use(resolvePlugin(markdownItTaskLists), { enabled: true })
  .use(resolvePlugin(markdownItAnchor))
  .use(resolvePlugin(mkatex))

// Ensure links open in a new tab
const defaultLinkOpenRender = md.renderer.rules.link_open || ((tokens: any, idx: any, options: any, _env: any, self: any) => {
  return self.renderToken(tokens, idx, options)
})

md.renderer.rules.link_open = (tokens: any, idx: any, options: any, env: any, self: any) => {
  const token = tokens[idx]
  if (token) {
    token.attrSet('target', '_blank')
    const rel = token.attrGet('rel')
    if (!rel) token.attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpenRender(tokens, idx, options, env, self)
}

const renderedHtml = computed(() => {
  const unsafe = md.render(props.args.content || '')
  return DOMPurify.sanitize(unsafe, { ADD_ATTR: ['target', 'rel'] })
})
</script>

<template>
  <div class="ui-markdown w-full rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm shadow-sm p-4 overflow-hidden">
    <div class="markdown-body" v-html="renderedHtml"></div>
  </div>
</template>

<style scoped>
.markdown-body {
  line-height: 1.7;
  color: #374151;
  font-size: 0.875rem;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 1.4em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
  color: #1f2937;
}
.markdown-body :deep(h1) { font-size: 1.5em; }
.markdown-body :deep(h2) { font-size: 1.25em; }
.markdown-body :deep(h3) { font-size: 1.1em; }

.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 0.8em;
}

.markdown-body :deep(a) {
  color: #2563eb;
  text-decoration: none;
}
.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-bottom: 0.8em;
  list-style-type: decimal;
}
.markdown-body :deep(ul) {
  padding-left: 2em;
  margin-bottom: 0.8em;
  list-style-type: disc;
}
.markdown-body :deep(li) {
  margin-bottom: 0.2em;
}

.markdown-body :deep(pre) {
  background: #f8fafc;
  padding: 0.8rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.85em;
  line-height: 1.5;
  margin-bottom: 0.8em;
}
.markdown-body :deep(code) {
  background: #f3f4f6;
  padding: 0.15em 0.35em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: var(--font-mono);
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

.markdown-body :deep(blockquote) {
  padding: 0 1em;
  color: #6b7280;
  border-left: 3px solid #d1d5db;
  margin: 0 0 0.8em 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 0.8em;
  font-size: 0.9em;
}
.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
}
.markdown-body :deep(table th) {
  font-weight: 600;
  background-color: #f9fafb;
}

.markdown-body :deep(hr) {
  height: 1px;
  background-color: #e5e7eb;
  border: 0;
  margin: 1.2em 0;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}
</style>
