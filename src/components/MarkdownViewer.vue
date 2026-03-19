<script setup lang="ts">
// Lightweight markdown viewer component
// Keep dependencies local to this component to enable lazy loading
// @ts-ignore
import MarkdownIt from 'markdown-it'
// @ts-ignore
import DOMPurify from 'dompurify'


// @ts-ignore
import * as markdownItTaskLists from 'markdown-it-task-lists'
// @ts-ignore
import * as container from 'markdown-it-container'
// @ts-ignore
import * as markdownItAnchor from 'markdown-it-anchor'
// @ts-ignore
import * as mkatex from 'markdown-it-katex'

// @ts-ignore
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
 

const props = defineProps<{ message: string | undefined }>()
// 渲染Markdown
// 兼容 Vite 对 CommonJS/ESM 插件的导入：有的为 default，有的为命名空间对象
const resolvePlugin = (p: any) => {
  if (!p) return p
  // 优先 default
  const cand = (p as any).default ?? p
  if (typeof cand === 'function') return cand
  // 若仍为对象，尝试在其键里找到函数导出
  for (const key of Object.keys(p)) {
    const v = (p as any)[key]
    if (typeof v === 'function') return v
  }
  return cand
}

// 配置 markdown-it 实例，启用所有已安装的插件
const md: any = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  // 代码高亮配置
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (e) {
        console.error('代码高亮失败:', e)
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})
  .use(resolvePlugin(markdownItTaskLists), { enabled: true }) // 任务列表 - [ ] todo
  .use(resolvePlugin(markdownItAnchor)) // 标题锚点
  .use(resolvePlugin(mkatex))
  .use(resolvePlugin(container), 'info')
  .use(resolvePlugin(container), 'warning')
  .use(resolvePlugin(container), 'success')

// Ensure links open in a new tab and avoid tabnabbing
const defaultLinkOpenRender = md.renderer.rules.link_open || ((tokens: any, idx: any, options: any, env: any, self: any) => {
  return self.renderToken(tokens, idx, options)
})

md.renderer.rules.link_open = (tokens: any, idx: any, options: any, env: any, self: any) => {
  const token = tokens[idx]
  if (token) {
    token.attrSet('target', '_blank')
    const rel = token.attrGet('rel')
    if (!rel) token.attrSet('rel', 'noopener noreferrer')
    else if (!/\bnoopener\b/i.test(rel) || !/\bnoreferrer\b/i.test(rel)) {
      const nextRel = `${rel} noopener noreferrer`.trim().replace(/\s+/g, ' ')
      token.attrSet('rel', nextRel)
    }
  }
  return defaultLinkOpenRender(tokens, idx, options, env, self)
}


const renderMarkdown = (message: string) => {
  const unsafe = md.render(message || '')
  return DOMPurify.sanitize(unsafe, { ADD_ATTR: ['target', 'rel'] })
}
</script>

<template>
  <div class="markdown-message" v-html="renderMarkdown(props.message || '')"></div>
</template>

<style scoped>
.markdown-message {
  line-height: 1.6;
  color: #374151;
}

/* 标题样式 */
.markdown-message :deep(h1),
.markdown-message :deep(h2),
.markdown-message :deep(h3),
.markdown-message :deep(h4),
.markdown-message :deep(h5),
.markdown-message :deep(h6) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-message :deep(h1) { font-size: 2em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
.markdown-message :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
.markdown-message :deep(h3) { font-size: 1.25em; }
.markdown-message :deep(h4) { font-size: 1em; }
.markdown-message :deep(h5) { font-size: 0.875em; }
.markdown-message :deep(h6) { font-size: 0.85em; color: #6b7280; }

/* 段落与文本 */
.markdown-message :deep(p) {
  margin-top: 0;
  margin-bottom: 1em;
}

.markdown-message :deep(strong) {
  font-weight: 600;
}

.markdown-message :deep(em) {
  font-style: italic;
}

/* 链接样式 */
.markdown-message :deep(a) {
  color: #2563eb;
  text-decoration: none;
}

.markdown-message :deep(a:hover) {
  text-decoration: underline;
}

/* 有序列表样式 - 关键修复 */
.markdown-message :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 1em;
  list-style-type: decimal; /* 显示 1. 2. 3. */
}

/* 无序列表样式 */
.markdown-message :deep(ul) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 1em;
  list-style-type: disc; /* 显示圆点 */
}

/* 嵌套列表 */
.markdown-message :deep(ul ul),
.markdown-message :deep(ol ol),
.markdown-message :deep(ul ol),
.markdown-message :deep(ol ul) {
  margin-top: 0;
  margin-bottom: 0;
}

.markdown-message :deep(li) {
  margin-bottom: 0.25em;
}

/* 任务列表样式 */
.markdown-message :deep(.task-list-item) {
  list-style-type: none;
}

.markdown-message :deep(.task-list-item-checkbox) {
  margin-right: 0.5em;
  margin-left: -1.5em;
}

/* 代码块样式 */
.markdown-message :deep(pre) {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.45;
  margin-bottom: 1em;
}

.markdown-message :deep(code) {
  background: #f8fafc;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: var(--font-mono);
}

.markdown-message :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

/* 引用块样式 */
.markdown-message :deep(blockquote) {
  padding: 0 1em;
  color: #6b7280;
  border-left: 0.25em solid #d1d5db;
  margin: 0 0 1em 0;
}

.markdown-message :deep(blockquote > :first-child) {
  margin-top: 0;
}

.markdown-message :deep(blockquote > :last-child) {
  margin-bottom: 0;
}

/* 表格样式 */
.markdown-message :deep(table) {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  margin-bottom: 1em;
  overflow: auto;
}

.markdown-message :deep(table th),
.markdown-message :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #d1d5db;
}

.markdown-message :deep(table th) {
  font-weight: 600;
  background-color: #f8fafc;
  background-color: white;
  border-top: 1px solid #d1d5db;
}

.markdown-message :deep(table tr:nth-child(2n)) {
  background-color: #f8fafc;
}

/* 水平线 */
.markdown-message :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d1d5db;
  border: 0;
}

/* 图片样式 */
.markdown-message :deep(img) {
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 4px;
}
</style>

<style lang="scss">
/* Dark mode overrides for MarkdownViewer */
.dark {
  .markdown-message {
    color: #e2e8f0;

    /* 标题 */
    h1,
    h2 {
      border-bottom-color: #313244;
    }

    h6 {
      color: #a6adc8;
    }

    /* 链接 */
    a {
      color: #7dd3fc;

      &:hover {
        color: #93e0fc;
      }
    }

    /* 代码块 */
    pre {
      background: #1e1e2e;
    }

    code {
      background: #1e1e2e;
      color: #cdd6f4;
    }

    pre code {
      background: transparent;
    }

    /* 引用块 */
    blockquote {
      color: #a6adc8;
      border-left-color: #45475a;
    }

    /* 表格 */
    table th,
    table td {
      border-color: #313244;
    }

    table th {
      background-color: #181825;
    }

    table tr:nth-child(2n) {
      background-color: rgba(255, 255, 255, 0.03);
    }

    /* 水平线 */
    hr {
      background-color: #313244;
    }

    /* highlight.js 暗色覆写 (覆盖 github.css 亮色主题) */
    .hljs {
      background: #1e1e2e;
      color: #cdd6f4;
    }

    .hljs-keyword,
    .hljs-selector-tag,
    .hljs-literal,
    .hljs-section,
    .hljs-link {
      color: #cba6f7;
    }

    .hljs-function .hljs-keyword {
      color: #cba6f7;
    }

    .hljs-string,
    .hljs-title,
    .hljs-name,
    .hljs-type,
    .hljs-attribute,
    .hljs-symbol,
    .hljs-bullet,
    .hljs-addition,
    .hljs-variable,
    .hljs-template-tag,
    .hljs-template-variable {
      color: #a6e3a1;
    }

    .hljs-comment,
    .hljs-quote,
    .hljs-deletion,
    .hljs-meta {
      color: #6c7086;
    }

    .hljs-number,
    .hljs-regexp,
    .hljs-literal,
    .hljs-variable.constant_ {
      color: #fab387;
    }

    .hljs-title.function_,
    .hljs-title.class_ {
      color: #89b4fa;
    }

    .hljs-built_in {
      color: #f9e2af;
    }

    .hljs-attr {
      color: #89dceb;
    }

    .hljs-emphasis {
      font-style: italic;
    }

    .hljs-strong {
      font-weight: 700;
    }
  }
}
</style>
