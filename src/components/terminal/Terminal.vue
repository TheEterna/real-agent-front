<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from 'xterm-addon-fit'
import CommandSuggestions from './CommandSuggestions.vue'
import type { TerminalConfig } from '@/types/terminal'
import { DEFAULT_TERMINAL_CONFIG } from '@/configs/terminal/xterm-config'
import { useCommandInput } from '@/composables/terminal/useCommandInput'
import type { ParsedCommand, ParseError } from '@/stores/terminalStore'
import { debounce } from "lodash"
import '@xterm/xterm/css/xterm.css';
import {useCommandHandler} from "@/composables/terminal/useCommandHandler";

// Props
interface Props {
  config?: Partial<TerminalConfig>
  sessionId?: string
}

const props = withDefaults(defineProps<Props>(), {})

const { t } = useI18n()

// 状态
const container = ref<HTMLElement>()
const terminal = ref<Terminal>()
// const isReady = ref(true)
// fixme: dev to true, should be false
const isReady = ref(true)

// 右键菜单状态
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0
})

// 终端存储

let fitAddon: FitAddon | null = null


// 命令输入处理
const {
  currentInput,
  currentCommandLine,
  cursorPosition,
  suggestions,
  selectedSuggestionIndex,
  showSuggestions,
  handleInput,
  handleTabComplete,
  pasteText,
  selectPreviousSuggestion,
  selectNextSuggestion,
  selectSuggestion,
  selectPreviousHistory,
  selectNextHistory,
  executeCommand,
  handleTerminalData,
  updateDisplay
} = useCommandInput({
  terminal: terminal,
  isReady: isReady
})
// 初始化
const init = () => {
  if (!container.value) return

  // 合并配置，确保支持复制粘贴和选择
  const config = {
    ...DEFAULT_TERMINAL_CONFIG,
    ...props.config,

  }

  terminal.value = new Terminal(config)

  fitAddon = new FitAddon()
  terminal.value.loadAddon(fitAddon)
  terminal.value.open(container.value)


  // 监听输入
  terminal.value.onData(handleTerminalData)


  window.addEventListener('resize', debounce(function () {
    fitAddon?.fit()
  }, 500))
  terminal.value.onResize((config, vo) => {
      console.log(`触发终端onResize：cols为${config.cols}, rows为${config.rows}`)
  })


  isReady.value = true
  terminal.value.focus()


  showWelcomeMessage()

}
const showWelcomeMessage = () => {
  if (!terminal.value) return

  const welcomeText = `
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║  ██████╗ ███████╗ █████╗ ██╗         █████╗  ██████╗ ███████╗███╗   ██╗████████╗ ║
║  ██╔══██╗██╔════╝██╔══██╗██║        ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝ ║
║  ██████╔╝█████╗  ███████║██║        ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║    ║
║  ██╔══██╗██╔══╝  ██╔══██║██║        ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║    ║
║  ██║  ██║███████╗██║  ██║███████╗   ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║    ║
║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝    ║
║  ${t('terminal.welcomeTitle')}                                        ║
║  ${t('terminal.welcomeHelp')}                                             ║
║  Session ID: ${props.sessionId}                                                           ║
╚══════════════════════════════════════════════════════════════════════════════════╝

${t('terminal.welcomeReady')}
`

  terminal.value?.write(welcomeText)
}



const clear = () => terminal.value?.clear()
const focus = () => terminal.value?.focus()

// 右键菜单处理
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()

  // 菜单尺寸（估算）
  const menuWidth = 120
  const menuHeight = 80

  // 计算菜单位置，确保不超出视口边界
  let x = e.clientX
  let y = e.clientY

  // 防止右侧溢出
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10
  }

  // 防止底部溢出
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10
  }

  // 始终显示右键菜单（复制需要选中文本，粘贴不需要）
  contextMenu.value = {
    show: true,
    x,
    y
  }
}

// 复制选中的文本
const handleCopy = async () => {
  const selection = terminal.value?.getSelection()

  if (selection) {
    try {
      await navigator.clipboard.writeText(selection)
      console.log('复制成功')
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 关闭菜单
  contextMenu.value.show = false
}

// 粘贴剪贴板内容
const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText()

    if (text) {
      // ⚠️ 使用 pasteText 方法一次性插入文本，光标自动跳到末尾
      // 不使用 handleTerminalData，因为它会逐字符处理，导致光标位置错误
      pasteText(text)
      console.log('粘贴成功')
    }
  } catch (err) {
    console.error('粘贴失败:', err)
  }

  // 关闭菜单
  contextMenu.value.show = false
}

// 检查是否有选中文本（用于禁用/启用复制菜单项）
const hasSelection = () => {
  return !!terminal.value?.getSelection()
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenu.value.show = false
}

// 点击其他地方关闭菜单
const handleClickOutside = () => {
  if (contextMenu.value.show) {
    closeContextMenu()
  }
}

// 生命周期
onMounted(() => {
  nextTick(init)
  setTimeout(() => {
    fitAddon?.fit()
  }, 60)

  // 监听全局点击，关闭右键菜单
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // terminal.value?.dispose()
  // fitAddon = null

  // 移除监听
  document.removeEventListener('click', handleClickOutside)
})

// 暴露
defineExpose({ clear, focus, terminal, isReady })
</script>

<template>
  <div class="terminal" role="log" :aria-label="t('terminal.ariaLabel')">
    <div class="terminal-header" aria-hidden="true">
      <span>VOLO AI Terminal</span>
    </div>

    <div class="terminal-body">
      <CommandSuggestions
        v-if="showSuggestions"
        :suggestions="suggestions"
        :selected-index="selectedSuggestionIndex"
        @select="selectSuggestion"
      />

      <div
        ref="container"
        class="terminal-container"
        :aria-label="t('terminal.inputAreaAriaLabel')"
        @contextmenu="handleContextMenu"
      >
        <div v-if="!isReady" class="loading">{{ t('terminal.initializing') }}</div>
      </div>

      <!-- 右键菜单 -->
      <div
        v-if="contextMenu.show"
        class="context-menu"
        role="menu"
        :aria-label="t('terminal.contextMenuAriaLabel')"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <div
          class="menu-item"
          role="menuitem"
          :class="{ disabled: !hasSelection() }"
          :aria-disabled="!hasSelection()"
          @click="hasSelection() && handleCopy()"
        >
          <span class="menu-icon">📋</span>
          <span>{{ t('terminal.copy') }}</span>
        </div>
        <div class="menu-divider" role="separator"></div>
        <div class="menu-item" role="menuitem" @click="handlePaste">
          <span class="menu-icon">📄</span>
          <span>{{ t('terminal.paste') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 0, 0.3);
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
}

.terminal-header {
  flex-shrink: 0;  // 防止被压缩
  padding: 8px 16px;
  background: linear-gradient(135deg, #0f1f0f 0%, #1a2f1a 100%);
  border-bottom: 1px solid rgba(0, 255, 0, 0.3);
  color: #00ff00;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
}

.terminal-body {
  flex: 1;
  min-height: 0;  // 关键：允许 flex 子元素缩小
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;  // 防止内容溢出
}

.terminal-container {
  flex: 1;
  min-height: 0;  // 关键：允许 flex 子元素缩小
  position: relative;
  width: 100%;
  overflow: hidden;  // 防止内容溢出
  // ⚠️ 移除padding，改用xterm内部的padding配置，避免坐标偏移

  :deep(.xterm) {
    height: 100%;  // 确保 xterm 填充整个容器
    width: 100%;
    padding: 8px;  // ⚠️ 在xterm内部设置padding，保证坐标计算正确
  }

  // 确保 xterm 的 viewport 和 screen 正确对齐
  :deep(.xterm-viewport) {
    width: 100% !important;
  }
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #00ff00;
  font-family: var(--font-mono);
  text-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
}

// 右键菜单样式
.context-menu {
  position: fixed;
  z-index: 9999;
  background: rgba(15, 31, 15, 0.98);
  border: 1px solid rgba(0, 255, 0, 0.5);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
  min-width: 120px;
  padding: 4px 0;
  backdrop-filter: blur(8px);

  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    color: #00ff00;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;

    .menu-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    &:hover:not(.disabled) {
      background: rgba(0, 255, 0, 0.2);
      box-shadow: inset 0 0 8px rgba(0, 255, 0, 0.3);
    }

    &:active:not(.disabled) {
      background: rgba(0, 255, 0, 0.3);
    }

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .menu-divider {
    height: 1px;
    background: rgba(0, 255, 0, 0.2);
    margin: 4px 8px;
  }
}
</style>

<style lang="scss">
/* Dark mode overrides for Terminal.vue
   Terminal is already dark-themed (#000 bg, green text).
   Only borders, shadows, and surrounding chrome need adjustment
   so the component blends into a dark page background. */
.dark {
  .terminal {
    border-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 24px rgba(0, 255, 0, 0.15);
  }

  .terminal-header {
    background: linear-gradient(135deg, #0a170a 0%, #132613 100%);
    border-bottom-color: rgba(0, 255, 0, 0.2);
  }

  .context-menu {
    background: rgba(10, 20, 10, 0.98);
    border-color: rgba(0, 255, 0, 0.4);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);

    .menu-item {
      &:hover:not(.disabled) {
        background: rgba(0, 255, 0, 0.15);
        box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.2);
      }

      &:active:not(.disabled) {
        background: rgba(0, 255, 0, 0.25);
      }
    }

    .menu-divider {
      background: rgba(0, 255, 0, 0.15);
    }
  }
}
</style>
