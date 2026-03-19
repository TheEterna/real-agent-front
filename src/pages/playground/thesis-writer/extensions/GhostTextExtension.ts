import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import type { EditorState } from '@tiptap/pm/state'

export interface GhostTextOptions {
  /**
   * 光标停顿多少毫秒后触发 ghost request
   */
  idleDelay: number
  /**
   * 外部回调：当需要 AI 预测时触发
   * 返回的 text 会被渲染为 ghost text
   */
  onGhostRequest: (context: { cursorPos: number; textBefore: string }) => void
}

// 用于设置/清除 ghost text 的自定义命令
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ghostText: {
      setGhostText: (text: string) => ReturnType
      clearGhostText: () => ReturnType
      acceptGhostText: () => ReturnType
    }
  }
}

const ghostTextPluginKey = new PluginKey('ghostText')

export const GhostTextExtension = Extension.create<GhostTextOptions>({
  name: 'ghostText',

  addOptions() {
    return {
      idleDelay: 2000,
      onGhostRequest: () => {},
    }
  },

  addCommands() {
    return {
      setGhostText: (text: string) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(ghostTextPluginKey, { type: 'set', text })
        }
        return true
      },
      clearGhostText: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(ghostTextPluginKey, { type: 'clear' })
        }
        return true
      },
      acceptGhostText: () => ({ tr, state, dispatch }) => {
        const pluginState = ghostTextPluginKey.getState(state)
        if (!pluginState?.ghostText || !dispatch) return false
        // 在光标位置插入 ghost text
        tr.insertText(pluginState.ghostText)
        tr.setMeta(ghostTextPluginKey, { type: 'clear' })
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    const extension = this
    let idleTimer: ReturnType<typeof setTimeout> | null = null

    return [
      new Plugin({
        key: ghostTextPluginKey,

        state: {
          init(): { ghostText: string | null; pos: number | null } {
            return { ghostText: null, pos: null }
          },
          apply(tr, prev) {
            const meta = tr.getMeta(ghostTextPluginKey)
            if (meta?.type === 'set') {
              return { ghostText: meta.text, pos: tr.selection.from }
            }
            if (meta?.type === 'clear') {
              return { ghostText: null, pos: null }
            }
            // 用户输入时清除 ghost text
            if (tr.docChanged && prev.ghostText) {
              return { ghostText: null, pos: null }
            }
            return prev
          },
        },

        props: {
          decorations(state: EditorState) {
            const pluginState = ghostTextPluginKey.getState(state)
            if (!pluginState?.ghostText || pluginState.pos == null) {
              return DecorationSet.empty
            }

            const widget = Decoration.widget(pluginState.pos, () => {
              const span = document.createElement('span')
              span.className = 'ghost-text'
              span.textContent = pluginState.ghostText!
              span.style.cssText = 'color: #94a3b8; opacity: 0.6; pointer-events: none; font-style: italic;'
              return span
            }, { side: 1 })

            return DecorationSet.create(state.doc, [widget])
          },

          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            const pluginState = ghostTextPluginKey.getState(view.state)

            if (pluginState?.ghostText) {
              if (event.key === 'Tab') {
                event.preventDefault()
                // 接受 ghost text
                const { tr } = view.state
                tr.insertText(pluginState.ghostText)
                tr.setMeta(ghostTextPluginKey, { type: 'clear' })
                view.dispatch(tr)
                return true
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                const { tr } = view.state
                tr.setMeta(ghostTextPluginKey, { type: 'clear' })
                view.dispatch(tr)
                return true
              }
            }

            return false
          },
        },

        view(editorView: EditorView) {
          return {
            update(view: EditorView, prevState: EditorState) {
              // 清理之前的计时器
              if (idleTimer) {
                clearTimeout(idleTimer)
                idleTimer = null
              }

              const { selection } = view.state
              // 只在光标（非选区）时触发
              if (selection.from !== selection.to) return

              const pluginState = ghostTextPluginKey.getState(view.state)
              if (pluginState?.ghostText) return // 已有 ghost text，不重复请求

              // 检查是否在段落末尾
              const $pos = view.state.doc.resolve(selection.from)
              const isAtEnd = $pos.parentOffset === $pos.parent.content.size
              const isInParagraph = $pos.parent.type.name === 'paragraph'
              const hasContent = $pos.parent.textContent.length > 10 // 至少有一些内容

              if (!isAtEnd || !isInParagraph || !hasContent) return

              // 设置空闲计时器
              idleTimer = setTimeout(() => {
                const textBefore = $pos.parent.textContent
                extension.options.onGhostRequest({
                  cursorPos: selection.from,
                  textBefore,
                })
              }, extension.options.idleDelay)
            },
            destroy() {
              if (idleTimer) {
                clearTimeout(idleTimer)
                idleTimer = null
              }
            },
          }
        },
      }),
    ]
  },
})

export default GhostTextExtension
