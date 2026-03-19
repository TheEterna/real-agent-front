/**
 * TipTap 自定义节点：章节分隔符
 * 用于全文视图模式，标记各章节的边界
 * - atom: true → 不可编辑内容
 * - selectable: false → 光标跳过
 * - 键盘快捷键阻止 Backspace/Delete 删除分隔符
 */
import { Node, mergeAttributes } from '@tiptap/core'

export const ChapterDividerExtension = Node.create({
  name: 'chapterDivider',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: false,

  addAttributes() {
    return {
      nodeId: { default: '' },
      title: { default: '' },
      level: { default: 1 },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="chapter-divider"]',
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false
          return {
            nodeId: dom.getAttribute('data-node-id'),
            title: dom.getAttribute('data-title'),
            level: parseInt(dom.getAttribute('data-level') || '1', 10),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({
        'data-type': 'chapter-divider',
        'data-node-id': HTMLAttributes.nodeId,
        'data-title': HTMLAttributes.title,
        'data-level': String(HTMLAttributes.level),
        'contenteditable': 'false',
        'class': `chapter-divider chapter-divider-level-${HTMLAttributes.level}`,
      }),
      HTMLAttributes.title,
    ]
  },

  // 阻止通过键盘删除章节分隔符
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { $from } = editor.state.selection
        // 光标紧接在 divider 之后 → 阻止删除
        if ($from.nodeBefore?.type.name === 'chapterDivider') {
          return true
        }
        return false
      },
      Delete: ({ editor }) => {
        const { $from } = editor.state.selection
        // 光标紧接在 divider 之前 → 阻止删除
        if ($from.nodeAfter?.type.name === 'chapterDivider') {
          return true
        }
        return false
      },
    }
  },
})
