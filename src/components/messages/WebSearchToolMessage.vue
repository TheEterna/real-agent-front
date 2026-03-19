<script setup lang="ts">
import {computed, ref, onMounted, onUnmounted} from 'vue'
import {UIMessage} from '@/types/events.js'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import {
  Search,
  Globe,
  Link2,
  ChevronRight,
  ChevronDown,
  LayoutTemplate,
  ExternalLink,
  Clock
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{ message: UIMessage }>()
const emit = defineEmits(['show-details'])


const toolData = computed(() => (props.message.data as any) ?? {})
const metaData = computed(() => (props.message.meta as any) ?? {})

const toolName = computed(() => toolData.value?.name || props.message.message || 'web_search')

const argumentsData = computed(() => {
  try {
    const raw = metaData.value?.arguments
    if (!raw) return null
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (!trimmed) return null
      try {
        return JSON.parse(trimmed)
      } catch {
        return trimmed
      }
    }
    return raw
  } catch {
    return null
  }
})

const responseData = computed(() => {
  try {
    const raw = toolData.value?.responseData
    if (!raw) return null

    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (!trimmed) return null

      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstItem = parsed[0]
          if (firstItem?.text && typeof firstItem.text === 'string') {
            try {
              return JSON.parse(firstItem.text)
            } catch {
              return firstItem
            }
          }
          return firstItem
        }
        return parsed
      } catch {
        // Not JSON, return as raw string for text parsing
        return trimmed
      }
    }
    return raw
  } catch {
    return null
  }
})

const elapsedMs = computed<number | null>(() => {
  const v = metaData.value?.elapsedMs
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v)
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? Math.round(n) : null
  }
  return null
})

/**
 * Robust parsing for plain text search results (e.g., from GLM or other models)
 */
const parseTextSearchResults = (text: string) => {
  if (!text || typeof text !== 'string') return null

  const rawLines = text.split(/\r?\n/)
  const lines = rawLines.map(l => l.trim()).filter(l => l)
  if (lines.length === 0) return null

  let query = ''
  const results: Array<{ title: string; url: string; snippet: string }> = []

  const urlFromLine = (line: string): string => {
    const m = line.match(/https?:\/\/\S+/)
    return m ? m[0].replace(/[)\]，。；;]+$/, '') : ''
  }

  // Query may appear in the first few lines, not always line[0]
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const m = lines[i].match(/^(搜索\S*|query|Query)\s*[:：]\s*(.+)$/)

    if (m) {
      query = m[2].trim()
      break
    }
  }

  const isItemStart = (line: string) => {
    return (
        /^-\s+/.test(line) ||
        /^[•·]\s+/.test(line) ||
        /^\d+\.\s+/.test(line) ||
        /^\d+、\s*/.test(line) ||
        /^\(\d+\)\s+/.test(line) ||
        /^（\d+）\s+/.test(line)
    )
  }

  const cleanItemTitle = (line: string) => {
    return line
        .replace(/^-\s+/, '')
        .replace(/^[•·]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/^\d+、\s*/, '')
        .replace(/^\(\d+\)\s+/, '')
        .replace(/^（\d+）\s+/, '')
        .trim()
  }

  let current: { title: string; url: string; snippet: string } | null = null
  const pushCurrent = () => {
    if (!current) return
    const hasAny = Boolean(current.title || current.url || current.snippet)
    if (hasAny) results.push(current)
    current = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip common section headers
    if (/^(来源|Sources?)\s*[:：]?$/i.test(line)) continue

    if (isItemStart(line)) {
      pushCurrent()
      current = {title: cleanItemTitle(line), url: '', snippet: ''}
      continue
    }

    if (!current) continue

    // URL may be a standalone line or embedded, or prefixed by "链接/URL/来源"
    if (!current.url) {
      const prefixed = line.match(/^(链接|URL|网址|来源)\s*[:：]\s*(https?:\/\/\S+)/i)
      if (prefixed?.[2]) {
        current.url = prefixed[2]
        continue
      }
      const u = urlFromLine(line)
      if (u) {
        current.url = u
        continue
      }
    }

    // Snippet may be "摘要:" / "Summary:" or plain text line(s)
    const snippetMatch = line.match(/^(摘要|Summary|简介|描述)\s*[:：]\s*(.*)$/i)
    if (snippetMatch) {
      const s = (snippetMatch[2] ?? '').trim()
      if (s) current.snippet = current.snippet ? `${current.snippet} ${s}` : s
      continue
    }

    if (!current.snippet && !isItemStart(line) && !/^https?:\/\//.test(line)) {
      current.snippet = line
    }
  }

  pushCurrent()

  return {query, results}
}

const normalized = computed(() => {
  const args = (argumentsData.value as any) ?? {}
  const resp = (responseData.value as any) ?? {}

  // 1. Plain text parsing (GLM-4.6 style)
  if (typeof responseData.value === 'string') {
    const parsed = parseTextSearchResults(responseData.value)
    if (parsed && parsed.results.length > 0) {
      return {
        query: parsed.query || args.query || args.q || '',
        answer: '',
        results: parsed.results,
        sources: []
      }
    }
  }

  // 2. Structured parsing
  const query = args.query ?? args.q ?? args.keyword ?? resp.query ?? resp.q ?? ''
  
  // 提取 summary 或 answer
  const answer = resp.summary ?? resp.answer ?? resp.result ?? resp.text ?? resp.content ?? ''
  
  // 提取搜索结果列表
  let resultsRaw = resp.results ?? resp.items ?? resp.data ?? resp.documents ?? []
  if (!Array.isArray(resultsRaw) && typeof resp === 'object' && resp !== null) {
     // 如果 resp 本身就是结果对象（非数组），且没有显式的 results 字段
     if (resp.title || resp.url || resp.snippet) {
       resultsRaw = [resp]
     }
  }
  const results = Array.isArray(resultsRaw) ? resultsRaw : []
  
  // 提取来源/引用
  const citations = resp.highlights ?? resp.citations ?? resp.references ?? resp.refs ?? resp.links ?? resp.urls ?? []
  const sources = Array.isArray(citations) ? citations : []

  return {
    query: String(query ?? ''),
    answer: typeof answer === 'string' ? answer : (answer ? JSON.stringify(answer, null, 2) : ''),
    results,
    sources
  }
})

const resultsView = computed(() => {
  return normalized.value.results
      .map((r: any) => {
        const url = r?.url ?? r?.link ?? r?.href ?? r?.source ?? r?.sourceUrl ?? ''
        const title = r?.title ?? r?.name ?? r?.headline ?? url ?? 'Untitled'
        const snippet = r?.snippet ?? r?.summary ?? r?.content ?? r?.text ?? ''
        const site = r?.site ?? r?.domain ?? r?.sourceName ?? ''
        const published = r?.published ?? r?.publishedAt ?? r?.date ?? r?.time ?? ''
        const score = r?.score ?? r?.rank ?? r?.relevance ?? null
        return {
          raw: r,
          url: String(url ?? ''),
          title: String(title ?? ''),
          snippet: typeof snippet === 'string' ? snippet : JSON.stringify(snippet, null, 2),
          site: String(site ?? ''),
          published: String(published ?? ''),
          score: score
        }
      })
      .filter((r: any) => r.title || r.url)
})

const sourcesView = computed(() => {
  // Use all sources instead of slicing
  const list = normalized.value.sources.length > 0 ? normalized.value.sources : normalized.value.results
  return list
      .map((s: any) => {
        if (typeof s === 'string') {
          let site = ''
          try {
            site = new URL(s).hostname
          } catch {
            site = ''
          }
          return {url: s, title: s, site}
        }
        const url = s?.url ?? s?.link ?? s?.href ?? ''
        const title = s?.title ?? s?.name ?? url ?? ''
        let site = s?.site ?? s?.domain ?? s?.sourceName ?? ''
        if (!site && url) {
          try {
            site = new URL(url).hostname
          } catch {
            site = ''
          }
        }
        return {url: String(url ?? ''), title: String(title ?? ''), site: String(site ?? '')}
      })
      .filter((s: any) => s.url || s.title)
})

const truncateText = (v: unknown, max = 280) => {
  const s = typeof v === 'string' ? v : v == null ? '' : String(v)
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 3))}...`
}

const formatIsoDate = (v: unknown) => {
  const s = typeof v === 'string' ? v : ''
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString()
}

const openUrl = (url: string) => {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

const handleShowDetails = () => {
  let md = `# Sources\n\n`

  resultsView.value.forEach((r: any, idx: number) => {
    md += `## ${idx + 1}. ${r.title || 'Untitled'}\n\n`

    if (r.url) {
      md += `[${r.url}](${r.url})\n\n`
    }

    const author = r.raw?.author ? truncateText(r.raw.author, 180) : ''
    const publishedDate = r.raw?.publishedDate ? formatIsoDate(r.raw.publishedDate) : (r.published ? String(r.published) : '')
    const meta = [author, publishedDate].filter(Boolean).join(' • ')
    if (meta) md += `${meta}\n\n`

    if (r.raw?.image) {
      md += `![Image](${r.raw.image})\n\n`
    }

    const summary = r.raw?.summary || r.snippet
    if (summary) {
      md += `${truncateText(summary, 480)}\n\n`
    }

    if (r.raw?.subpages && Array.isArray(r.raw.subpages) && r.raw.subpages.length) {
      md += `<details>\n<summary>Subpages (${r.raw.subpages.length})</summary>\n\n`
      ;(r.raw.subpages as any[]).slice(0, 10).forEach((sp: any, i: number) => {
        const t = sp?.title || sp?.url || sp?.id || `Subpage ${i + 1}`
        const u = sp?.url || ''
        const a = sp?.author ? truncateText(sp.author, 140) : ''
        const p = sp?.publishedDate ? formatIsoDate(sp.publishedDate) : ''
        md += `### ${i + 1}. ${t}\n\n`
        if (u) md += `[${u}](${u})\n\n`
        const m = [a, p].filter(Boolean).join(' • ')
        if (m) md += `${m}\n\n`
        if (sp?.summary) md += `${truncateText(sp.summary, 380)}\n\n`
        if (sp?.highlights && Array.isArray(sp.highlights) && sp.highlights.length) {
          ;(sp.highlights as any[]).slice(0, 8).forEach((hh: any) => {
            md += `- ${truncateText(hh, 300)}\n`
          })
          md += `\n`
        }
        md += `---\n\n`
      })
      md += `</details>\n\n`
    }

    if (r.raw?.extras && typeof r.raw.extras === 'object') {
      const links = (r.raw.extras as any)?.links
      if (Array.isArray(links) && links.length) {
        md += `<details>\n<summary>Extras</summary>\n\n`
        links.slice(0, 20).forEach((l: any) => {
          if (typeof l === 'string') md += `- ${l}\n`
          else if (l?.url) md += `- ${l.url}\n`
        })
        md += `\n</details>\n\n`
      }
    }
    md += `---\n\n`
  })

  emit('show-details', {
    content: md,
    type: 'document',
    title: 'Web Search'
  })
}

// --- Scroll & Drag Logic ---
const scrollContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)

const handleMouseDown = (e: MouseEvent) => {
  if (!scrollContainer.value) return
  isDragging.value = true
  scrollContainer.value.classList.add('active')
  startX.value = e.pageX - scrollContainer.value.offsetLeft
  scrollLeft.value = scrollContainer.value.scrollLeft
}

const handleMouseUp = () => {
  isDragging.value = false
  if (scrollContainer.value) {
    scrollContainer.value.classList.remove('active')
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !scrollContainer.value) return
  e.preventDefault()
  const x = e.pageX - scrollContainer.value.offsetLeft
  const walk = (x - startX.value) * 2 // Scroll speed
  scrollContainer.value.scrollLeft = scrollLeft.value - walk
}

const handleWheel = (e: WheelEvent) => {
  if (!scrollContainer.value) return
  if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
    // Only intercept vertical wheel if there is horizontal overflow
    if (scrollContainer.value.scrollWidth > scrollContainer.value.clientWidth) {
      e.preventDefault()
      scrollContainer.value.scrollLeft += e.deltaY
    }
  }
}

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    scrollContainer.value.addEventListener('mousemove', handleMouseMove)
    scrollContainer.value.addEventListener('wheel', handleWheel, {passive: false})
  }
})

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('mousedown', handleMouseDown)
    window.removeEventListener('mouseup', handleMouseUp)
    scrollContainer.value.removeEventListener('mousemove', handleMouseMove)
    scrollContainer.value.removeEventListener('wheel', handleWheel)
  }
})

const handleShowItemDetails = (idx: number) => {
  const r = resultsView.value[idx]
  if (!r) return

  let md = `# ${r.title || 'Untitled'}\n\n`

  if (r.url) {
    md += `[${r.url}](${r.url})\n\n`
  }

  const author = r.raw?.author ? truncateText(r.raw.author, 180) : ''
  const publishedDate = r.raw?.publishedDate ? formatIsoDate(r.raw.publishedDate) : (r.published ? String(r.published) : '')
  const meta = [author, publishedDate].filter(Boolean).join(' • ')
  if (meta) md += `**${meta}**\n\n`

  if (r.raw?.image) {
    md += `![Image](${r.raw.image})\n\n`
  }

  // 1. Brief Summary / Snippet
  const summary = r.raw?.summary || r.snippet
  if (summary) {
    md += `### Summary\n${summary}\n\n`
  }

  // 2. Highlights with special rendering
  if (r.raw?.highlights && Array.isArray(r.raw.highlights) && r.raw.highlights.length) {
    md += `### Highlights\n\n`
    const hs: any[] = r.raw.highlights
    const scores: any[] = Array.isArray(r.raw.highlightScores) ? r.raw.highlightScores : []
    hs.slice(0, 15).forEach((h: any, i: number) => {
      const score = scores[i]
      const scoreText = typeof score === 'number' ? ` \`score: ${score.toFixed(3)}\`` : ''
      md += `> ${h}${scoreText}\n\n`
    })
  }

  // 3. Full Text (The "Text" part requested)
  if (r.raw?.text) {
    md += `### Full Content\n\n${r.raw.text}\n\n`
  }

  // 4. Subpages
  if (r.raw?.subpages && Array.isArray(r.raw.subpages) && r.raw.subpages.length) {
    md += `### Related Subpages\n\n`
    ;(r.raw.subpages as any[]).slice(0, 8).forEach((sp: any, i: number) => {
      const t = sp?.title || sp?.url || sp?.id || `Subpage ${i + 1}`
      const u = sp?.url || ''
      md += `- **${t}** ${u ? `([Link](${u}))` : ''}\n`
      if (sp?.summary) md += `  ${truncateText(sp.summary, 200)}\n`
    })
    md += `\n`
  }

  emit('show-details', {
    content: md,
    type: 'document',
    title: r.title || 'Result Detail'
  })
}

// Auto-expand details if no answer block is present (common in text-only models like GLM)
onMounted(() => {
})
</script>

<template>
  <div class="tool-message-container">

    <div class="modern-search-container w-full mx-auto font-sans">
      <!-- 1. Minimal Header / Search Query -->
      <div
v-if="false"
           class="flex items-center gap-2 mb-3 px-1 opacity-40 hover:opacity-100 transition-opacity duration-300">
        <div class="flex items-center justify-center w-4 h-4 text-emerald-500 shrink-0">
          <Search :size="11"/>
        </div>
        <h3 class="text-[9px] text-slate-400 dark:text-zinc-500 m-0 uppercase tracking-widest truncate">
          {{ normalized.query || 'Web Search' }}
        </h3>
      </div>

      <!-- 2. Sources Horizontal Scroll (Extreme-Capsule Style) -->
      <div v-if="sourcesView.length" class="w-full">
        <div class="flex items-center justify-between mb-2 px-1 w-full">
          <div class="flex items-center gap-1.5">
            <div class="p-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Globe :size="9" stroke-width="3"/>
            </div>
            <span class="text-[10px] text-slate-800 dark:text-zinc-200 tracking-tight">Sources</span>
            <span
                class="text-[8.5px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-full border border-emerald-100/30 leading-none">{{
                sourcesView.length
              }}</span>
          </div>

          <button
              :aria-label="t('messages.webSearch.viewFullResults')"
              class="flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-[9px] uppercase tracking-wide"
              @click="handleShowDetails"
          >
            <LayoutTemplate :size="9"/>
            <span>Full View</span>
          </button>
        </div>

        <!-- Scroll Container -->
        <div class="relative scroll-parent-container">
          <div
              ref="scrollContainer"
              class="sources-scroll-wrapper flex gap-1.5 overflow-x-auto pb-2 px-1 cursor-grab active:cursor-grabbing select-none"
          >
            <div
                v-for="(s, idx) in sourcesView"
                :key="idx"
                role="button"
                tabindex="0"
                :aria-label="t('messages.webSearch.viewSource', { title: s.title })"
                class="source-capsule-item shrink-0 w-36 flex items-center gap-1.5 p-1 rounded-full border border-slate-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5"
                @click="handleShowItemDetails(idx)"
                @keydown.enter="handleShowItemDetails(idx)"
                @keydown.space.prevent="handleShowItemDetails(idx)"
            >
              <!-- Site Icon -->
              <div
                  class="source-icon w-5 h-5 rounded-full bg-slate-50 dark:bg-zinc-800 shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-zinc-700 transition-colors">
                <img
v-if="s.site" :src="`https://www.google.com/s2/favicons?domain=${s.site}&sz=32`"
                     :alt="t('messages.webSearch.siteIcon', { site: s.site })"
                     class="w-3 h-3 object-contain"/>
                <Globe v-else :size="8" class="text-slate-400 dark:text-zinc-500"/>
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1 flex flex-col justify-center">
                <div class="source-title text-[10px] text-slate-700 dark:text-zinc-200 truncate leading-tight transition-colors">
                  {{ s.title }}
                </div>
              </div>

              <!-- Index -->
              <div class="source-index pr-1 text-[8px] text-slate-300 dark:text-zinc-500 transition-colors">
                {{ idx + 1 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Answer / Summary Content -->
      <div v-if="normalized.answer" class="answer-section relative px-1">
        <div class="flex items-center gap-1.5 mb-2.5 text-slate-800 dark:text-zinc-200">
          <div class="w-1 h-3 bg-emerald-500 rounded-full"></div>
          <span class="text-[9px] tracking-[0.15em] uppercase text-slate-400 dark:text-zinc-500">Analysis Summary</span>
        </div>
        <div
class="prose prose-sm prose-slate dark:prose-invert max-w-none
                  prose-p:leading-[1.55] prose-p:text-slate-600 dark:prose-p:text-zinc-300 prose-p:mb-2.5 prose-p:text-[0.8125rem]
                  prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:tracking-tight prose-headings:mb-2.5 prose-headings:mt-4
                  prose-li:text-slate-600 dark:prose-li:text-zinc-300 prose-li:text-[0.78125rem] prose-li:my-0.5
                  prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-slate-800 dark:prose-strong:text-zinc-200
                  prose-code:bg-slate-50 dark:prose-code:bg-zinc-800 prose-code:text-emerald-700 dark:prose-code:text-emerald-400 prose-code:px-1 prose-code:rounded prose-code:text-[0.71875rem]">
          <MarkdownViewer :message="normalized.answer"/>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.tool-message-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  cursor: pointer;
  width: 100%;
}
.modern-search-container {
  animation: searchAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes searchAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.sources-scroll-wrapper {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  -webkit-overflow-scrolling: touch;
}

.sources-scroll-wrapper::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}


/* Glass effect for capsules */
.source-capsule-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

:deep(.prose) {
  letter-spacing: -0.005em;
}

.answer-section {
  position: relative;
  max-width: 100%;
}

.source-capsule-item.active {
  cursor: grabbing;
}
</style>
