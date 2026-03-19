<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  code: string
  language?: string
  showLineNumbers?: boolean

}

const props = withDefaults(defineProps<Props>(), {
  language: 'text',
  showLineNumbers: true
})

// 将代码按行分割
const codeLines = computed(() => {
  return props.code.split('\n')
})
</script>

<template>
  <div class="code-block" role="region" :aria-label="t('comp.codeBlock.ariaCodeBlock', { language })">
    <div class="code-header">
      <span class="language-adge" :aria-label="t('comp.codeBlock.ariaLanguage', { language })">{{ language }}</span>
    </div>
    <pre class="code-content"><code v-for="(line, index) in codeLines" :key="index" class="code-line"><span v-if="showLineNumbers" class="line-number">{{ index + 1 }}</span><span class="line-text">{{ line }}</span></code></pre>
  </div>
</template>

<style scoped lang="scss">
.code-block {
  border-radius: 6px;
  overflow: hidden;
  background: var(--code-block-bg, #f6f8fa);
  border: 1px solid var(--code-block-border, #e1e4e8);
  font-size: 0.8125rem;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--code-header-bg, #f0f0f0);
  border-bottom: 1px solid var(--code-block-border, #e1e4e8);
}

.language-badge {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary, #586069);
  font-family: var(--font-mono);
}

.code-content {
  margin: 0;
  padding: 12px 0;
  overflow-x: auto;
  font-family: var(--font-mono);
  line-height: 1.5;
  background: transparent;
}

.code-line {
  display: block;
  padding: 0 12px;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }
}

.line-number {
  display: inline-block;
  width: 40px;
  text-align: right;
  color: var(--line-number-color, #8c8c8c);
  user-select: none;
  margin-right: 16px;
}

.line-text {
  color: var(--code-text-color, #24292e);
}
</style>

<style lang="scss">
/* Dark mode overrides for CodeBlock */
.dark {
  .code-block {
    background: var(--code-block-bg, #1e1e2e);
    border-color: var(--code-block-border, #313244);
  }

  .code-header {
    background: var(--code-header-bg, #181825);
    border-bottom-color: var(--code-block-border, #313244);
  }

  .language-badge {
    color: var(--text-secondary, #a6adc8);
  }

  .code-line {
    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }
  }

  .line-number {
    color: var(--line-number-color, #585b70);
  }

  .line-text {
    color: var(--code-text-color, #cdd6f4);
  }
}
</style>
