/**
 * 全文视图模式 composable
 * 负责加载所有章节内容、合并为单一 HTML、拆分回各章节并保存
 */
import { ref } from 'vue'
import type { OutlineNode } from '@/types/thesis-writer'
import { getChapterContent } from '@/api/thesis-writer'
import { useThesisStore } from '../stores/thesisStore'

export function useFullDocument() {
  const thesisStore = useThesisStore()
  const isLoading = ref(false)
  const isSaving = ref(false)
  const lastSaved = ref(false)
  const loadedCount = ref(0)
  const totalCount = ref(0)

  /** 原始内容快照，用于 diff 检测变更 */
  const originalContents = new Map<string, string>()

  // ==================== Flatten ====================

  /** DFS 扁平化大纲树，保持文档顺序 */
  function flattenNodes(nodes: OutlineNode[]): OutlineNode[] {
    const result: OutlineNode[] = []
    for (const node of nodes) {
      result.push(node)
      if (node.children?.length) {
        result.push(...flattenNodes(node.children))
      }
    }
    return result
  }

  // ==================== Load & Merge ====================

  /** 加载所有章节并合并为完整 HTML */
  async function loadFullDocument(outline: OutlineNode[]): Promise<string> {
    const allNodes = flattenNodes(outline)
    totalCount.value = allNodes.length
    loadedCount.value = 0
    isLoading.value = true
    originalContents.clear()

    try {
      // 并行加载所有章节内容
      const results = await Promise.all(
        allNodes.map(async (node) => {
          try {
            const res = await getChapterContent(node.id)
            const content = res.code === 200 && res.data ? (res.data.content || '') : ''
            return { nodeId: node.id, title: node.title, level: node.level, content }
          } catch {
            return { nodeId: node.id, title: node.title, level: node.level, content: '' }
          } finally {
            loadedCount.value++
          }
        }),
      )

      // 缓存原始内容 + 写入 Store 内存缓存（供章节视图 SWR 使用）
      for (const r of results) {
        originalContents.set(r.nodeId, r.content)
        thesisStore.cacheChapterContent(r.nodeId, r.content)
      }

      return buildHTML(results)
    } finally {
      isLoading.value = false
    }
  }

  /** 拼装完整 HTML：[divider][content][divider][content]... */
  function buildHTML(
    chapters: Array<{ nodeId: string; title: string; level: number; content: string }>,
  ): string {
    let html = ''
    for (const ch of chapters) {
      // 章节分隔符（TipTap 会通过 parseHTML 识别）
      html += `<div data-type="chapter-divider" data-node-id="${ch.nodeId}" data-title="${escapeAttr(ch.title)}" data-level="${ch.level}" class="chapter-divider chapter-divider-level-${ch.level}">${escapeHtml(ch.title)}</div>`
      // 章节内容（空章节插入空段落，确保光标可落位）
      html += ch.content || '<p></p>'
    }
    return html
  }

  // ==================== Split & Save ====================

  /** 从完整 HTML 中拆分各章节内容 */
  function splitHTML(fullHTML: string): Map<string, string> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${fullHTML}</div>`, 'text/html')
    const container = doc.body.firstElementChild!

    const result = new Map<string, string>()
    let currentNodeId: string | null = null
    let fragments: string[] = []

    for (const child of Array.from(container.children)) {
      if (child.getAttribute('data-type') === 'chapter-divider') {
        // 保存上一个章节
        if (currentNodeId !== null) {
          result.set(currentNodeId, fragments.join(''))
        }
        currentNodeId = child.getAttribute('data-node-id')
        fragments = []
      } else {
        fragments.push(child.outerHTML)
      }
    }

    // 最后一个章节
    if (currentNodeId !== null) {
      result.set(currentNodeId, fragments.join(''))
    }

    return result
  }

  /** 保存变更的章节（仅 diff 部分）- 使用串行保存保证顺序 */
  async function saveChangedChapters(fullHTML: string): Promise<{
    saved: number
    errors: number
    failedNodeIds: string[]
    skippedNodeIds: string[]
  }> {
    const currentContents = splitHTML(fullHTML)
    const changedContents = new Map<string, string>()

    // 筛选出有变更的章节
    for (const [nodeId, content] of currentContents) {
      const original = originalContents.get(nodeId) ?? ''
      if (normalizeHTML(content) !== normalizeHTML(original)) {
        changedContents.set(nodeId, content)
      }
    }

    if (changedContents.size === 0) {
      return { saved: 0, errors: 0, failedNodeIds: [], skippedNodeIds: [] }
    }

    isSaving.value = true
    lastSaved.value = false

    // 使用Store的批量保存方法（串行执行）
    const failedNodeIds: string[] = []
    const skippedNodeIds: string[] = []

    const result = await thesisStore.batchSaveContents(
      changedContents,
      (saved, total, errors) => {
        // 进度回调（可选：可用于显示保存进度）
        console.log(`[FullDocument] 保存进度: ${saved}/${total}, 错误: ${errors}`)
      }
    )

    // 更新本地缓存并分类失败原因
    for (const [nodeId, success] of result.results) {
      if (success) {
        const content = changedContents.get(nodeId)
        if (content !== undefined) {
          originalContents.set(nodeId, content)
        }
      } else {
        // 检查是否因为被锁定而失败
        if (thesisStore.isNodeLocked(nodeId)) {
          skippedNodeIds.push(nodeId)
        } else {
          failedNodeIds.push(nodeId)
        }
      }
    }

    isSaving.value = false

    // 只有全部成功才显示保存成功
    if (result.saved > 0 && result.errors === 0) {
      lastSaved.value = true
      setTimeout(() => { lastSaved.value = false }, 3000)
    }

    return {
      saved: result.saved,
      errors: result.errors,
      failedNodeIds,
      skippedNodeIds,
    }
  }

  // ==================== Scroll ====================

  /** 滚动到指定章节的 divider 位置 */
  function scrollToChapter(editorDom: HTMLElement, nodeId: string) {
    const divider = editorDom.querySelector(`[data-node-id="${nodeId}"]`)
    if (divider) {
      divider.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ==================== Util ====================

  function escapeAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  /** 去除空白差异，避免无意义的保存 */
  function normalizeHTML(html: string): string {
    return html.replace(/\s+/g, ' ').trim()
  }

  return {
    isLoading,
    isSaving,
    lastSaved,
    loadedCount,
    totalCount,
    loadFullDocument,
    splitHTML,
    saveChangedChapters,
    scrollToChapter,
    flattenNodes,
  }
}
