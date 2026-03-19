<script setup lang="ts">
import type {HTMLAttributes} from 'vue'
import {computed, defineComponent, h, onBeforeUnmount, onMounted, ref} from 'vue'
import {cn} from '@/lib/utils'
import { useI18n } from 'vue-i18n'
import 'markstream-vue/index.css'
import { ChevronDown, ChevronUp, Copy, Eye } from 'lucide-vue-next'

const { t } = useI18n()

// import type { MonacoTheme } from 'stream-monaco'
import MarkdownRender, {CodeBlockNode, MarkdownCodeBlockNode, removeCustomComponents, setCustomComponents} from 'markstream-vue'

const emit = defineEmits<{
  (e: 'open-code-artifact', payload: { code: string; language?: string }): void
  (e: 'close-code-artifact'): void
}>()

const props = defineProps<{
  content: string
  isArtifactOpen?: boolean
  class?: HTMLAttributes['class']
}>()

function handlePreview(payload?: any) {
  const code = payload?.code ?? payload?.raw ?? payload?.text ?? ''
  const language = payload?.language ?? ''

  emit('open-code-artifact', { code, language })
}

/**
 * 预处理 markdown 内容，修复常见的格式问题
 * 主要修复：###1.xxxx -> ### 1.xxxx （在 # 号和内容之间添加空格）
 */
const preprocessMarkdown = (content: string): string => {
  if (!content) return ''

  // 修复标题格式：行首的1-6个#号，紧跟着非空格字符（通常是数字或文字）
  // 匹配模式：^(#{1,6})([^\s]) -> $1 $2
  // 例如：
  //   ###1.xxxx -> ### 1.xxxx
  //   ##标题 -> ## 标题
  //   #1 -> # 1
  // 但跳过已经正确的格式（# 号后已经有空格）
  const processed = content.replace(/^(#{1,6})([^\s#])/gm, (match, hashes, firstChar) => {
    // 在 # 号和第一个非空格字符之间插入空格
    return `${hashes} ${firstChar}`
  })

  return processed
}

const processedContent = computed(() => preprocessMarkdown(props.content))

const CUSTOM_ID = 'docs'

const CustomCodeBlock = defineComponent({
  name: 'CustomCodeBlock',
  props: {
    node: {type: Object as any, required: true},
    loading: {type: Boolean, default: false},
    stream: {type: Boolean, default: true},
    darkTheme: {type: [String, Object] as any, default: undefined},
    lightTheme: {type: [String, Object] as any, default: undefined},
    isDark: {type: Boolean, default: false},
    isShowPreview: {type: Boolean, default: true},
    enableFontSizeControl: {type: Boolean, default: true},
    minWidth: {type: [String, Number] as any, default: '0'},
    maxWidth: {type: [String, Number] as any, default: '100%'},
    themes: {type: Array as any, default: () => []},
    showHeader: {type: Boolean, default: true},
    showCopyButton: {type: Boolean, default: true},
    showExpandButton: {type: Boolean, default: true},
    showPreviewButton: {type: Boolean, default: true},
    showFontSizeButtons: {type: Boolean, default: false},
    showRefreshButton: {type: Boolean, default: false},
  },
  setup(p: Record<string, any>, {attrs}: { attrs: Record<string, any> }) {
    const isCollapsed = ref(false)

    return () =>
        isCollapsed.value
        ?
            h(
                MarkdownCodeBlockNode as any,
                {
                  class: 'no-body',
                  ...(attrs as any),
                  ...p,
                  onPreviewCode: handlePreview,
                  showPreviewButton: false,
                  isShowPreview: false,
                  showHeader: true,
                  showCopyButton: true,
                  showExpandButton: true,
                  showFontSizeButtons: false,
                  showRefreshButton: false,
                },
                {
                  'header-right': () =>
                      h('div', { class: 'flex items-center gap-1.5' }, [
                        h(
                            'button',
                            {
                              type: 'button',
                              class: 'rounded-[8px]! code-action-btn p-1.5 text-xs rounded-md transition-colors hover:bg-secondary-75',
                              title: t('aiElements.message.expandCode'),
                              'aria-label': t('aiElements.message.expandCodeAriaLabel'),
                              onClick: (e: MouseEvent) => {
                                e.preventDefault()
                                e.stopPropagation()
                                isCollapsed.value = false
                              },
                            },
                            h(ChevronDown, { size: 16, 'aria-hidden': 'true' }),
                        ),
                        h(
                            'button',
                            {
                              type: 'button',
                              class: 'rounded-[8px]! code-action-btn p-2 text-xs rounded-md transition-colors hover:bg-secondary-75',
                              title: t('aiElements.message.copyCode'),
                              'aria-label': t('aiElements.message.copyCodeAriaLabel'),
                              onClick: async (e: MouseEvent) => {
                                e.preventDefault()
                                e.stopPropagation()
                                try {
                                  await navigator.clipboard.writeText(p.node?.code || p.node?.raw || '')
                                } catch (err) {
                                  console.error('Failed to copy: ', err)
                                }
                              },
                            },
                            h(Copy, { size: 16, 'aria-hidden': 'true' }),
                        ),
                        h(
                            'button',
                            {
                              type: 'button',
                              class: 'rounded-[8px]! code-action-btn p-2 text-xs rounded-md transition-colors hover:bg-secondary-75',
                              title: t('aiElements.message.previewCode'),
                              'aria-label': t('aiElements.message.previewCodeAriaLabel'),
                              onClick: (e: MouseEvent) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handlePreview((p as any).node)
                              },
                            },
                            h(Eye, { size: 16, 'aria-hidden': 'true' }),
                        ),
                      ]),
                }
            )



        : h(
            MarkdownCodeBlockNode as any,
            {
              ...(attrs as any),
              ...p,
              onPreviewCode: handlePreview,
              showPreviewButton: false,
              isShowPreview: false,
              showHeader: true,
              showCopyButton: true,
              showExpandButton: true,
              showFontSizeButtons: false,
              showRefreshButton: false,
            },
            {
              'header-right': () =>
                h('div', { class: 'flex items-center gap-1.5' }, [
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'rounded-[8px]! code-action-btn p-1.5 text-xs rounded-md transition-colors hover:bg-secondary-75',
                      title: t('aiElements.message.collapseCode'),
                      'aria-label': t('aiElements.message.collapseCodeAriaLabel'),
                      onClick: (e: MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        isCollapsed.value = true
                      },
                    },
                    h(ChevronUp, { size: 16, 'aria-hidden': 'true' }),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'rounded-[8px]! code-action-btn p-2 text-xs rounded-md transition-colors hover:bg-secondary-75',
                      title: t('aiElements.message.copyCode'),
                      'aria-label': t('aiElements.message.copyCodeAriaLabel'),
                      onClick: async (e: MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                          await navigator.clipboard.writeText(p.node?.code || p.node?.raw || '')
                        } catch (err) {
                          console.error('Failed to copy: ', err)
                        }
                      },
                    },
                    h(Copy, { size: 16, 'aria-hidden': 'true' }),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'rounded-[8px]! code-action-btn p-2 text-xs rounded-md transition-colors hover:bg-secondary-75',
                      title: t('aiElements.message.previewCode'),
                      'aria-label': t('aiElements.message.previewCodeAriaLabel'),
                      onClick: (e: MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handlePreview((p as any).node)
                      },
                    },
                    h(Eye, { size: 16, 'aria-hidden': 'true' }),
                  ),
                ]),
            }
        )
  },
})

setCustomComponents(CUSTOM_ID, {code_block: CustomCodeBlock as any})

onBeforeUnmount(() => {
  removeCustomComponents(CUSTOM_ID)
})
</script>

<template>
  <MarkdownRender
      :class="
      cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 w-full',
        props.class,
      )
    "
      :code-block-min-width="0"
      :custom-id="CUSTOM_ID"
      :render-code-blocks-as-pre="false"
      :content="processedContent"
      :code-block-props="{
        showPreviewButton: false
    }"
      v-bind="$attrs"
  />
</template>

<style lang="scss" scoped>
:deep(.no-body .code-block-content) {
  display: none!important;
}
:deep(.msv-code-header-btn.custom-expand-btn) {
  min-width: 44px;
  height: 24px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.6);
  color: rgba(15, 23, 42, 0.85);
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
}

:deep(.msv-code-header) {
  background: #f8fafc;
  border-bottom: none;
}

:deep(.msv-code-block-collapsed) {
  cursor: pointer;
  margin: 8px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.2s;

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(248, 250, 252, 0.5);
  }

  .msv-code-header {
    background: #f8fafc;
    border-bottom: none;
  }
}

:deep(.paragraph-node) {
  margin: 0;
  margin-top: 0.75em !important;
}

:deep(h3) {
  margin-top: 0.75em !important;
}

:deep(hr) {
  margin-top: 1rem !important;
  margin-bottom: 0 !important;
}

:deep(.msv-code-block),
:deep(.msv-code-block-wrapper),
:deep(.msv-code-block-content),
:deep(.code-block-content) {
  max-width: 100%;
}

:deep(.msv-code-block-content),
:deep(.code-block-content) {
  overflow-x: auto;
}

:deep(.msv-code-block-content pre),
:deep(.msv-code-block-content code),
:deep(.code-block-content pre),
:deep(.code-block-content code) {
  max-width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>

<style lang="scss">
/* Dark mode overrides for MessageResponse.vue
   Transforms code block headers and expand buttons
   from light (#f8fafc, white bg) to dark equivalents. */
.dark {
  .msv-code-header-btn.custom-expand-btn {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(224, 231, 235, 0.85);
  }

  .msv-code-header {
    background: #1a2328;
    border-bottom: none;
  }

  .msv-code-block-collapsed {
    border-color: rgba(148, 163, 184, 0.15);

    &:hover {
      border-color: rgba(77, 159, 255, 0.35);
      background: rgba(30, 42, 46, 0.5);
    }

    .msv-code-header {
      background: #1a2328;
    }
  }
}
</style>