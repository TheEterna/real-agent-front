<script setup lang="ts">
/**
 * ChatInput — B 风格输入框
 *
 * 改造点：
 * 1. B 风格：实底白背景 + 柔和阴影 + 1.5px 边框 + 品牌色淡底 Send
 * 2. ArrowUp 图标替代 Send 纸飞机
 * 3. 药丸→圆角矩形：多行时 border-radius 平滑过渡
 * 4. 动态 placeholder：通过 prop 接收时段感知文案
 * 5. B2 弹簧激活：Send 按钮获得内容时弹簧动画
 */
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Paperclip, ArrowUp } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const props = defineProps<{
  disabled?: boolean
  placeholder?: string
}>()
const emit = defineEmits<{ send: [content: string] }>()

const { t } = useI18n()
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const hasContent = ref(false)
const isMultiLine = ref(false)
const isSending = ref(false)

const displayPlaceholder = computed(() => props.placeholder || t('playgroundChat.chatInput.defaultPlaceholder'))

watch(inputText, (val) => {
  hasContent.value = !!val.trim()
  nextTick(() => {
    const el = textareaRef.value
    if (el) {
      el.style.height = 'auto'
      const h = Math.min(el.scrollHeight, 110)
      el.style.height = h + 'px'
      isMultiLine.value = h > 40
    }
  })
})

function handleSend() {
  if (!inputText.value.trim() || props.disabled || isSending.value) return  // Guard: 防重入
  isSending.value = true
  try {
    emit('send', inputText.value.trim())
    inputText.value = ''
    isMultiLine.value = false
    nextTick(() => {
      const el = textareaRef.value
      if (el) el.style.height = 'auto'
    })
  } finally {
    isSending.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function focus() { textareaRef.value?.focus() }

/** 外部填入文本（话题建议 → 输入框），自动聚焦并将光标置尾 */
function setValue(text: string) {
  inputText.value = text
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    const h = Math.min(el.scrollHeight, 110)
    el.style.height = h + 'px'
    isMultiLine.value = h > 40
    el.focus()
    el.setSelectionRange(text.length, text.length)
  })
}

defineExpose({ focus, setValue })
</script>

<template>
  <div class="input-zone">
    <div class="input-outer" :class="{ 'is-multi-line': isMultiLine }">
      <div class="input-row">
        <div class="input-left">
          <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
            <Tooltip>
              <TooltipTrigger as-child>
                <button
                  class="input-icon-btn attachment-disabled"
                  :aria-label="t('playgroundChat.chatInput.attachmentDeveloping')"
                  disabled
                >
                  <Paperclip :size="16" :stroke-width="1.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" :side-offset="6">
                {{ t('playgroundChat.chatInput.attachmentDeveloping') }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <textarea
          ref="textareaRef"
          v-model="inputText"
          rows="1"
          :placeholder="displayPlaceholder"
          :aria-label="t('playgroundChat.chatInput.messageInput')"
          @keydown="handleKeydown"
        ></textarea>
      </div>
      <TooltipProvider :delay-duration="300" :skip-delay-duration="100">
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="send-btn"
              :class="{ 'is-active': hasContent && !disabled }"
              :disabled="!hasContent || disabled"
              :aria-label="t('common.button.send')"
              @click="handleSend"
            >
              <ArrowUp :size="16" :stroke-width="2.2" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" :side-offset="6">
            {{ t('playgroundChat.chatInput.sendMessage') }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <div class="input-hint">{{ t('playgroundChat.chatInput.shiftEnterHint') }}</div>
  </div>
</template>

<style scoped>
/* ── ChatInput 局部 Design Tokens ── */
.input-zone {
  /* 基础色 */
  --ci-ink: rgba(45,43,41,0.9);
  --ci-ink-muted: rgba(45,43,41,0.35);
  --ci-ink-subtle: rgba(45,43,41,0.2);
  --ci-ink-hover: rgba(45,43,41,0.6);
  --ci-bg: #fff;
  --ci-border: rgba(45,43,41,0.1);
  --ci-shadow: rgba(0,0,0,0.04);

  /* 附件按钮 */
  --ci-icon-bg: rgba(45,43,41,0.04);
  --ci-icon-bg-hover: rgba(45,43,41,0.08);

  /* 品牌色 */
  --ci-brand: var(--soul, #6B9A98);
  --ci-brand-deep: var(--soul-deep, #4A7A78);
  --ci-brand-glow-12: rgba(107,154,152,0.12);
  --ci-brand-glow-08: rgba(107,154,152,0.08);
  --ci-brand-glow-30: rgba(107,154,152,0.3);
  --ci-brand-glow-40: rgba(107,154,152,0.4);

  flex-shrink: 0; padding: 12px 32px 20px;
}

/* ═══ Input outer — input + send 水平排列 ═══ */
.input-outer {
  display: flex; align-items: center; gap: 12px;
}
.input-outer.is-multi-line {
  align-items: flex-end;
}
.input-outer.is-multi-line .input-row {
  border-radius: 20px;
  align-items: flex-end;
}

/* ═══ 输入框容器 — 圆角 + 边框 ═══ */
.input-row {
  flex: 1;
  display: flex; align-items: center; gap: 8px;
  background: var(--ci-bg);
  border: 1px solid var(--ci-border);
  border-radius: 9999px;
  padding: 7px 16px 7px 18px;
  box-shadow: 0 2px 8px var(--ci-shadow);
  min-height: 48px;
  transition:
    border-color 0.35s cubic-bezier(0.22,1,0.36,1),
    box-shadow 0.35s cubic-bezier(0.22,1,0.36,1),
    background 0.35s cubic-bezier(0.22,1,0.36,1),
    border-radius 0.3s cubic-bezier(0.22,1,0.36,1);
}

.input-row:focus-within {
  border-color: var(--ci-brand);
  box-shadow: 0 0 0 3px var(--ci-brand-glow-12), 0 4px 20px var(--ci-brand-glow-08);
}

.input-left { display: flex; align-items: center; gap: 2px; }

.input-icon-btn {
  width: 36px; height: 36px; min-width: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  color: var(--ci-ink-muted);
  border: none;
  background: var(--ci-icon-bg);
  cursor: pointer;
  transition: all 0.15s;
}
.input-icon-btn:not(:disabled):hover { color: var(--ci-ink-hover); background: var(--ci-icon-bg-hover); }
.input-icon-btn:not(:disabled):active { transform: scale(0.92); }
.input-icon-btn.attachment-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.input-outer.is-multi-line .input-left { margin-bottom: 3px; }

.input-row textarea {
  flex: 1; border: none; outline: none; resize: none;
  font-size: 1rem; line-height: 1.55;
  color: var(--ci-ink); background: transparent;
  max-height: 110px; min-height: 24px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.input-row textarea::placeholder { color: var(--ci-ink-muted); }

/* ═══ Send 按钮 — 设计稿：独立圆形暗色按钮 ═══ */
.send-btn {
  width: 48px; height: 48px; min-width: 48px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; border: none;
  background: var(--ci-border);
  color: var(--ci-ink-muted);
  cursor: default;
  transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
}

.input-outer.is-multi-line .send-btn { margin-bottom: 3px; }

.send-btn.is-active {
  background: var(--ink, #171717);
  color: #fff;
  cursor: pointer;
  animation: send-spring 0.4s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes send-spring {
  0%   { transform: scale(0.92); }
  50%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}

.send-btn.is-active:hover {
  background: var(--ink, #171717);
  transform: scale(1.06);
  box-shadow: 0 4px 14px rgba(0,0,0,0.15);
}
.send-btn.is-active:active { transform: scale(0.93); }

.input-hint {
  text-align: center; font-size: 0.75rem;
  color: var(--ci-ink-subtle); margin-top: 4px;
  opacity: 0; transition: opacity 0.15s;
}
.input-outer:focus-within ~ .input-hint { opacity: 1; }

@media (min-width: 1024px) {
  .input-row { padding: 8px 16px 8px 24px; }
  .input-row textarea { font-size: 1rem; }
}
@media (max-width: 640px) {
  .input-zone { padding: 4px 8px 8px; }
}
</style>

<!-- ═══ 暗色模式 — 覆写 Token ═══ -->
<style>
.dark .input-zone {
  --ci-ink: rgba(224,231,235,0.9);
  --ci-ink-muted: rgba(224,231,235,0.22);
  --ci-ink-subtle: rgba(224,231,235,0.12);
  --ci-ink-hover: rgba(224,231,235,0.5);
  --ci-bg: rgba(255,255,255,0.05);
  --ci-border: rgba(255,255,255,0.1);
  --ci-shadow: rgba(0,0,0,0.2);
  --ci-icon-bg: rgba(255,255,255,0.04);
  --ci-icon-bg-hover: rgba(255,255,255,0.08);
  --ci-brand: #6B9A98;
  --ci-brand-deep: #7cb7b4;
  --ci-brand-glow-12: rgba(124,183,180,0.1);
  --ci-brand-glow-08: rgba(0,0,0,0.15);
  --ci-brand-glow-30: rgba(124,183,180,0.3);
  --ci-brand-glow-40: rgba(124,183,180,0.35);
}
.dark .input-row:focus-within {
  border-color: rgba(124,183,180,0.5);
  box-shadow: 0 0 0 3px rgba(124,183,180,0.1), 0 4px 20px var(--ci-shadow);
}
.dark .send-btn.is-active {
  background: rgba(224,231,235,0.85);
  color: #1a1a1a;
}
.dark .send-btn.is-active:hover {
  background: rgba(224,231,235,0.95);
  box-shadow: 0 4px 14px rgba(0,0,0,0.3);
}
</style>
