<template>
  <div class="tiptap-editor flex flex-col" :class="{ 'ring-1 ring-amber-200/60 dark:ring-amber-500/30': isFocused }">
    <!-- Toolbar -->
    <div
      class="tiptap-toolbar flex items-center gap-1 sm:gap-0.5 px-3 py-2 sm:py-1.5 border-b border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 flex-wrap shrink-0"
    >
      <!-- Headings -->
      <ToolbarButton
        :active="editor?.isActive('heading', { level: 1 })"
        :title="t('thesisWriter.tiptapEditor.heading1')"
        @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <span class="text-xs font-bold">H1</span>
      </ToolbarButton>
      <ToolbarButton
        :active="editor?.isActive('heading', { level: 2 })"
        :title="t('thesisWriter.tiptapEditor.heading2')"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <span class="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        :active="editor?.isActive('heading', { level: 3 })"
        :title="t('thesisWriter.tiptapEditor.heading3')"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <span class="text-xs font-bold">H3</span>
      </ToolbarButton>

      <ToolbarDivider />

      <!-- Inline formatting -->
      <ToolbarButton
        :active="editor?.isActive('bold')"
        :title="t('thesisWriter.tiptapEditor.bold')"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <Bold :size="15" />
      </ToolbarButton>
      <ToolbarButton
        :active="editor?.isActive('italic')"
        :title="t('thesisWriter.tiptapEditor.italic')"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <Italic :size="15" />
      </ToolbarButton>
      <ToolbarButton
        :active="editor?.isActive('underline')"
        :title="t('thesisWriter.tiptapEditor.underline')"
        @click="editor?.chain().focus().toggleUnderline().run()"
      >
        <UnderlineIcon :size="15" />
      </ToolbarButton>
      <ToolbarButton
        :active="editor?.isActive('highlight')"
        :title="t('thesisWriter.tiptapEditor.highlight')"
        @click="editor?.chain().focus().toggleHighlight().run()"
      >
        <Highlighter :size="15" />
      </ToolbarButton>

      <ToolbarDivider />

      <!-- Lists -->
      <ToolbarButton
        :active="editor?.isActive('bulletList')"
        :title="t('thesisWriter.tiptapEditor.bulletList')"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        <List :size="15" />
      </ToolbarButton>
      <ToolbarButton
        :active="editor?.isActive('orderedList')"
        :title="t('thesisWriter.tiptapEditor.orderedList')"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        <ListOrdered :size="15" />
      </ToolbarButton>

      <ToolbarDivider />

      <!-- Block -->
      <ToolbarButton
        :active="editor?.isActive('blockquote')"
        :title="t('thesisWriter.tiptapEditor.blockquote')"
        @click="editor?.chain().focus().toggleBlockquote().run()"
      >
        <Quote :size="15" />
      </ToolbarButton>
      <ToolbarButton
        :active="editor?.isActive('codeBlock')"
        :title="t('thesisWriter.tiptapEditor.codeBlock')"
        @click="editor?.chain().focus().toggleCodeBlock().run()"
      >
        <Code :size="15" />
      </ToolbarButton>
      <ToolbarButton
        :title="t('thesisWriter.tiptapEditor.horizontalRule')"
        @click="editor?.chain().focus().setHorizontalRule().run()"
      >
        <Minus :size="15" />
      </ToolbarButton>

      <ToolbarDivider />

      <!-- Undo/Redo -->
      <ToolbarButton
        :title="t('thesisWriter.tiptapEditor.undo')"
        :disabled="!editor?.can().undo()"
        @click="editor?.chain().focus().undo().run()"
      >
        <Undo :size="15" />
      </ToolbarButton>
      <ToolbarButton
        :title="t('thesisWriter.tiptapEditor.redo')"
        :disabled="!editor?.can().redo()"
        @click="editor?.chain().focus().redo().run()"
      >
        <Redo :size="15" />
      </ToolbarButton>
    </div>

    <!-- Editor -->
    <div class="flex-1 overflow-y-auto">
      <EditorContent :editor="editor" class="tiptap-content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, watch, defineComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { GhostTextExtension } from '../extensions/GhostTextExtension'
import { InlineDiffExtension } from '../extensions/InlineDiffExtension'
import { ChapterDividerExtension } from '../extensions/ChapterDividerExtension'
import '../extensions/diff-styles.css'
import '../extensions/chapter-divider-styles.css'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
} from 'lucide-vue-next'

const { t } = useI18n()

// ==================== Props / Emits ====================
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    editable?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '',
    editable: true,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'selectionChange', payload: { text: string; rect: { top: number; left: number; bottom: number } } | null): void
  (e: 'ghostRequest', context: { cursorPos: number; textBefore: string }): void
}>()

// ==================== State ====================
const isFocused = ref(false)

// ==================== Lowlight ====================
const lowlight = createLowlight(common)

// ==================== Editor ====================
const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      codeBlock: false, // replaced by CodeBlockLowlight
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Highlight,
    Typography,
    Underline,
    CodeBlockLowlight.configure({
      lowlight,
    }),
    GhostTextExtension.configure({
      idleDelay: 2000,
      onGhostRequest: (context) => {
        emit('ghostRequest', context)
      },
    }),
    InlineDiffExtension,
    ChapterDividerExtension,
  ],
  onUpdate({ editor: e }) {
    emit('update:modelValue', e.getHTML())
  },
  onSelectionUpdate({ editor: e }) {
    const { from, to } = e.state.selection
    if (from === to) {
      emit('selectionChange', null)
      return
    }
    const text = e.state.doc.textBetween(from, to, ' ')
    if (text.trim().length < 2) {
      emit('selectionChange', null)
      return
    }
    const coords = e.view.coordsAtPos(from)
    const toCoords = e.view.coordsAtPos(to)
    emit('selectionChange', {
      text,
      rect: { top: coords.top, left: (coords.left + toCoords.left) / 2, bottom: coords.bottom },
    })
  },
  onFocus() {
    isFocused.value = true
    emit('focus')
  },
  onBlur() {
    isFocused.value = false
    emit('blur')
  },
})

// Sync external changes into editor
watch(
  () => props.modelValue,
  (val) => {
    if (!editor.value) return
    const currentHTML = editor.value.getHTML()
    if (val !== currentHTML) {
      editor.value.commands.setContent(val, { emitUpdate: false })
    }
  }
)

watch(
  () => props.editable,
  (val) => {
    editor.value?.setEditable(val)
  }
)

// ==================== Expose API ====================
function getHTML(): string {
  return editor.value?.getHTML() ?? ''
}

function getText(): string {
  return editor.value?.getText() ?? ''
}

function getJSON() {
  return editor.value?.getJSON() ?? null
}

function focus() {
  editor.value?.commands.focus()
}

function insertContent(html: string) {
  editor.value?.commands.insertContent(html)
}

function setContent(html: string) {
  editor.value?.commands.setContent(html)
}

function getSelectedText(): string {
  if (!editor.value) return ''
  const { from, to } = editor.value.state.selection
  return editor.value.state.doc.textBetween(from, to, ' ')
}

function getSelectionRange(): { from: number; to: number } | null {
  if (!editor.value) return null
  const { from, to } = editor.value.state.selection
  if (from === to) return null
  return { from, to }
}

function replaceRange(from: number, to: number, content: string) {
  editor.value?.chain().focus().deleteRange({ from, to }).insertContentAt(from, content).run()
}

function setGhostText(text: string) {
  editor.value?.commands.setGhostText(text)
}

function clearGhostText() {
  editor.value?.commands.clearGhostText()
}

function showDiff(from: number, to: number, originalText: string, suggestedText: string) {
  editor.value?.commands.showDiff(from, to, originalText, suggestedText)
}

function clearDiff() {
  editor.value?.commands.clearDiff()
}

defineExpose({
  getHTML,
  getText,
  getJSON,
  focus,
  insertContent,
  setContent,
  getSelectedText,
  getSelectionRange,
  replaceRange,
  setGhostText,
  clearGhostText,
  showDiff,
  clearDiff,
  editor,
})

// ==================== Cleanup ====================
onBeforeUnmount(() => {
  editor.value?.destroy()
})

// ==================== Sub-components ====================
const ToolbarButton = defineComponent({
  props: {
    active: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    title: { type: String, default: '' },
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () =>
      h(
        'button',
        {
          class: [
            'inline-flex items-center justify-center rounded text-slate-500 dark:text-zinc-400 transition-colors active:scale-95',
            'w-11 h-11 sm:w-9 sm:h-9 md:w-7 md:h-7',
            props.active
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200',
            props.disabled && 'opacity-30 cursor-not-allowed',
          ],
          title: props.title,
          'aria-label': props.title,
          disabled: props.disabled,
          onClick: (e: Event) => {
            e.preventDefault()
            if (!props.disabled) emit('click')
          },
        },
        slots.default?.()
      )
  },
})

const ToolbarDivider = defineComponent({
  setup() {
    return () => h('div', { class: 'w-px h-4 bg-slate-200 dark:bg-zinc-700 mx-1' })
  },
})
</script>

<style>
/* TipTap editor content styles */
.tiptap-content .tiptap {
  outline: none;
  padding: 1.5rem;
  min-height: 400px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.8;
  color: var(--foreground, #334155);
  font-size: 1rem;
}

.tiptap-content .tiptap p {
  margin-bottom: 0.75rem;
}

.tiptap-content .tiptap h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--foreground, #1e293b);
  line-height: 1.3;
}

.tiptap-content .tiptap h2 {
  font-size: 1.375rem;
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  color: var(--foreground, #1e293b);
  line-height: 1.4;
}

.tiptap-content .tiptap h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--foreground, #334155);
  line-height: 1.4;
}

.tiptap-content .tiptap strong {
  font-weight: 600;
}

.tiptap-content .tiptap em {
  font-style: italic;
}

.tiptap-content .tiptap u {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.tiptap-content .tiptap mark {
  background-color: var(--color-amber-100, #fef08a);
  border-radius: 2px;
  padding: 0 2px;
}

.tiptap-content .tiptap ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.tiptap-content .tiptap ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.tiptap-content .tiptap li {
  margin-bottom: 0.25rem;
}

.tiptap-content .tiptap blockquote {
  border-left: 3px solid var(--border, #e2e8f0);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--muted-foreground, #64748b);
  font-style: italic;
}

.tiptap-content .tiptap code {
  background-color: var(--muted, #f1f5f9);
  border-radius: 3px;
  padding: 0.15em 0.4em;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875em;
  color: var(--color-pink-700, #be185d);
}

.tiptap-content .tiptap pre {
  background-color: var(--color-slate-800, #1e293b);
  color: var(--color-slate-200, #e2e8f0);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
}

.tiptap-content .tiptap pre code {
  background: none;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

.tiptap-content .tiptap hr {
  border: none;
  border-top: 1px solid var(--border, #e2e8f0);
  margin: 1.5rem 0;
}

/* Placeholder */
.tiptap-content .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--muted-foreground, #cbd5e1);
  pointer-events: none;
  height: 0;
}
</style>

<!-- Dark mode overrides (non-scoped to avoid Vue SFC :global bug) -->
<style>
.dark .tiptap-content .tiptap {
  color: rgba(224, 231, 235, 0.9);
}

.dark .tiptap-content .tiptap h1,
.dark .tiptap-content .tiptap h2 {
  color: rgba(240, 245, 249, 0.95);
}

.dark .tiptap-content .tiptap h3 {
  color: rgba(224, 231, 235, 0.9);
}

.dark .tiptap-content .tiptap mark {
  background-color: rgba(250, 204, 21, 0.25);
  color: rgba(250, 204, 21, 0.9);
}

.dark .tiptap-content .tiptap blockquote {
  border-left-color: rgba(255, 255, 255, 0.1);
  color: rgba(161, 172, 183, 0.8);
}

.dark .tiptap-content .tiptap code {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--color-pink-400, #f472b6);
}

.dark .tiptap-content .tiptap pre {
  background-color: rgba(0, 0, 0, 0.4);
  color: rgba(224, 231, 235, 0.9);
}

.dark .tiptap-content .tiptap hr {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.dark .tiptap-content .tiptap p.is-editor-empty:first-child::before {
  color: rgba(161, 172, 183, 0.5);
}
</style>
