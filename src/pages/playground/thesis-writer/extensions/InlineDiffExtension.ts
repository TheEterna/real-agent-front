import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView } from '@tiptap/pm/view'
import type { EditorState, Transaction } from '@tiptap/pm/state'
import i18n from '@/i18n'

export interface InlineDiffOptions {
  onAccept?: (suggestedText: string) => void
  onReject?: () => void
}

interface DiffState {
  active: boolean
  from: number
  to: number
  originalText: string
  suggestedText: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineDiff: {
      showDiff: (from: number, to: number, originalText: string, suggestedText: string) => ReturnType
      clearDiff: () => ReturnType
      acceptDiff: () => ReturnType
      rejectDiff: () => ReturnType
    }
  }
}

const diffPluginKey = new PluginKey('inlineDiff')

export const InlineDiffExtension = Extension.create<InlineDiffOptions>({
  name: 'inlineDiff',

  addOptions() {
    return {
      onAccept: undefined,
      onReject: undefined,
    }
  },

  addCommands() {
    return {
      showDiff: (from: number, to: number, originalText: string, suggestedText: string) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(diffPluginKey, {
            type: 'show',
            from, to, originalText, suggestedText,
          })
        }
        return true
      },
      clearDiff: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(diffPluginKey, { type: 'clear' })
        }
        return true
      },
      acceptDiff: () => ({ tr, state, dispatch, editor }) => {
        const pluginState: DiffState | null = diffPluginKey.getState(state)
        if (!pluginState?.active || !dispatch) return false

        // 替换文档中的原文为建议文本
        tr.replaceWith(
          pluginState.from,
          pluginState.to,
          state.schema.text(pluginState.suggestedText)
        )
        tr.setMeta(diffPluginKey, { type: 'clear' })

        // 触发回调
        this.options.onAccept?.(pluginState.suggestedText)

        return true
      },
      rejectDiff: () => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(diffPluginKey, { type: 'clear' })
        }
        this.options.onReject?.()
        return true
      },
    }
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options

    return [
      new Plugin({
        key: diffPluginKey,

        state: {
          init(): DiffState {
            return { active: false, from: 0, to: 0, originalText: '', suggestedText: '' }
          },
          apply(tr: Transaction, prev: DiffState): DiffState {
            const meta = tr.getMeta(diffPluginKey)
            if (meta?.type === 'show') {
              return {
                active: true,
                from: meta.from,
                to: meta.to,
                originalText: meta.originalText,
                suggestedText: meta.suggestedText,
              }
            }
            if (meta?.type === 'clear') {
              return { active: false, from: 0, to: 0, originalText: '', suggestedText: '' }
            }
            // 映射位置到新文档
            if (prev.active && tr.docChanged) {
              return {
                ...prev,
                from: tr.mapping.map(prev.from),
                to: tr.mapping.map(prev.to),
              }
            }
            return prev
          },
        },

        props: {
          decorations(state: EditorState): DecorationSet {
            const pluginState: DiffState = diffPluginKey.getState(state)
            if (!pluginState?.active) return DecorationSet.empty

            const decorations: Decoration[] = []

            // 1. 原文：红色删除线
            decorations.push(
              Decoration.inline(pluginState.from, pluginState.to, {
                class: 'inline-diff-delete',
              })
            )

            // 2. 建议文本：绿色背景 widget（紧跟在原文之后）
            decorations.push(
              Decoration.widget(pluginState.to, (view: EditorView) => {
                const container = document.createElement('span')
                container.className = 'inline-diff-container'

                // 建议文本
                const suggestion = document.createElement('span')
                suggestion.className = 'inline-diff-insert'
                suggestion.textContent = pluginState.suggestedText
                container.appendChild(suggestion)

                // 操作按钮
                const actions = document.createElement('span')
                actions.className = 'inline-diff-actions'

                const acceptBtn = document.createElement('button')
                acceptBtn.className = 'inline-diff-btn inline-diff-btn-accept'
                acceptBtn.textContent = i18n.global.t('thesisWriter.inlineDiff.accept')
                acceptBtn.addEventListener('click', (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Dispatch acceptDiff
                  const { tr } = view.state
                  const currentState: DiffState = diffPluginKey.getState(view.state)
                  if (currentState?.active) {
                    tr.replaceWith(
                      currentState.from,
                      currentState.to,
                      view.state.schema.text(currentState.suggestedText)
                    )
                    tr.setMeta(diffPluginKey, { type: 'clear' })
                    view.dispatch(tr)
                    extensionOptions.onAccept?.(currentState.suggestedText)
                  }
                })
                actions.appendChild(acceptBtn)

                const rejectBtn = document.createElement('button')
                rejectBtn.className = 'inline-diff-btn inline-diff-btn-reject'
                rejectBtn.textContent = i18n.global.t('thesisWriter.inlineDiff.reject')
                rejectBtn.addEventListener('click', (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const { tr } = view.state
                  tr.setMeta(diffPluginKey, { type: 'clear' })
                  view.dispatch(tr)
                  extensionOptions.onReject?.()
                })
                actions.appendChild(rejectBtn)

                container.appendChild(actions)

                return container
              }, { side: 1 })
            )

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

export default InlineDiffExtension
