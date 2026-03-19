// 消息渲染器
// 负责将不同类型的消息格式化并渲染到 xterm.js 终端

import type { Terminal } from '@xterm/xterm'
import type { UIMessage, BaseEventItem } from '@/types/events'
import type { GeekModeTheme } from '@/types/terminal/themes'
import i18n from '@/i18n'

const { t } = i18n.global

export interface MessageRenderOptions {
  enableColors?: boolean
  enableTimestamp?: boolean
  enableTypewriter?: boolean
  typewriterSpeed?: number
  maxLineLength?: number
  indent?: number
}

export class MessageRenderer {
  private terminal: Terminal | null = null
  private theme: GeekModeTheme | null = null
  private options: Required<MessageRenderOptions>

  // ANSI 控制序列
  private static readonly ANSI = {
    // 颜色
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    GRAY: '\x1b[90m',

    // 亮色
    BRIGHT_RED: '\x1b[91m',
    BRIGHT_GREEN: '\x1b[92m',
    BRIGHT_YELLOW: '\x1b[93m',
    BRIGHT_BLUE: '\x1b[94m',
    BRIGHT_MAGENTA: '\x1b[95m',
    BRIGHT_CYAN: '\x1b[96m',
    BRIGHT_WHITE: '\x1b[97m',

    // 样式
    RESET: '\x1b[0m',
    BOLD: '\x1b[1m',
    DIM: '\x1b[2m',
    ITALIC: '\x1b[3m',
    UNDERLINE: '\x1b[4m',
    BLINK: '\x1b[5m',
    REVERSE: '\x1b[7m',

    // 背景色
    BG_BLACK: '\x1b[40m',
    BG_RED: '\x1b[41m',
    BG_GREEN: '\x1b[42m',
    BG_YELLOW: '\x1b[43m',
    BG_BLUE: '\x1b[44m',

    // 光标控制
    CLEAR_LINE: '\x1b[2K',
    MOVE_UP: '\x1b[1A',
    MOVE_DOWN: '\x1b[1B',
    MOVE_LEFT: '\x1b[1D',
    MOVE_RIGHT: '\x1b[1C',
    HOME: '\x1b[H',
    CLEAR_SCREEN: '\x1b[2J'
  } as const

  // 消息类型图标
  private static readonly ICONS = {
    user: '👤',
    assistant: '🤖',
    system: '⚙️',
    tool: '🔧',
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    command: '⚡',
    output: '📄',
    thinking: '🤔',
    action: '🚀'
  } as const

  constructor(options: MessageRenderOptions = {}) {
    this.options = {
      enableColors: options.enableColors ?? true,
      enableTimestamp: options.enableTimestamp ?? true,
      enableTypewriter: options.enableTypewriter ?? false,
      typewriterSpeed: options.typewriterSpeed ?? 30,
      maxLineLength: options.maxLineLength ?? 120,
      indent: options.indent ?? 2
    }
  }

  // 设置终端引用
  setTerminal(terminal: Terminal) {
    this.terminal = terminal
  }

  // 设置主题
  setTheme(theme: GeekModeTheme) {
    this.theme = theme
  }

  // 获取消息类型的颜色
  private getColorForType(type: string): string {
    if (!this.options.enableColors) return ''

    const colorMap: Record<string, string> = {
      user: MessageRenderer.ANSI.BRIGHT_CYAN,
      assistant: MessageRenderer.ANSI.BRIGHT_GREEN,
      system: MessageRenderer.ANSI.GRAY,
      tool: MessageRenderer.ANSI.YELLOW,
      error: MessageRenderer.ANSI.BRIGHT_RED,
      success: MessageRenderer.ANSI.BRIGHT_GREEN,
      warning: MessageRenderer.ANSI.BRIGHT_YELLOW,
      info: MessageRenderer.ANSI.BRIGHT_BLUE,
      command: MessageRenderer.ANSI.GREEN,
      output: MessageRenderer.ANSI.WHITE,
      thinking: MessageRenderer.ANSI.MAGENTA,
      action: MessageRenderer.ANSI.CYAN
    }

    return colorMap[type] || MessageRenderer.ANSI.WHITE
  }

  // 格式化时间戳
  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 分割长文本
  private wrapText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text]

    const lines: string[] = []
    let currentLine = ''

    const words = text.split(' ')
    for (let word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine = currentLine ? `${currentLine} ${word}` : word
      } else {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          // 单词太长，强制分割
          while (word.length > maxLength) {
            lines.push(word.substring(0, maxLength))
            word = word.substring(maxLength)
          }
          currentLine = word
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  // 添加缩进
  private addIndent(text: string, level: number = 1): string {
    const indent = ' '.repeat(this.options.indent * level)
    return text.split('\n').map(line => indent + line).join('\n')
  }

  // 格式化 JSON 数据
  private formatJSON(data: any): string {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      if (!this.options.enableColors) return jsonString

      // 简单的 JSON 语法高亮
      return jsonString
        .replace(/"([^"]+)":/g, `${MessageRenderer.ANSI.CYAN}"$1"${MessageRenderer.ANSI.RESET}:`)
        .replace(/: "([^"]+)"/g, `: ${MessageRenderer.ANSI.GREEN}"$1"${MessageRenderer.ANSI.RESET}`)
        .replace(/: (\d+)/g, `: ${MessageRenderer.ANSI.YELLOW}$1${MessageRenderer.ANSI.RESET}`)
        .replace(/: (true|false)/g, `: ${MessageRenderer.ANSI.MAGENTA}$1${MessageRenderer.ANSI.RESET}`)
        .replace(/: null/g, `: ${MessageRenderer.ANSI.GRAY}null${MessageRenderer.ANSI.RESET}`)
    } catch {
      return String(data)
    }
  }

  // 打字机效果写入
  private async typewriterWrite(text: string): Promise<void> {
    if (!this.terminal || !this.options.enableTypewriter) {
      this.terminal?.write(text)
      return
    }

    return new Promise((resolve) => {
      let index = 0
      const writeNext = () => {
        if (index < text.length && this.terminal) {
          this.terminal.write(text[index])
          index++
          setTimeout(writeNext, this.options.typewriterSpeed)
        } else {
          resolve()
        }
      }
      writeNext()
    })
  }

  // 渲染消息头部
  private renderMessageHeader(message: UIMessage): string {
    const parts: string[] = []

    // 时间戳
    if (this.options.enableTimestamp && message.startTime) {
      const startTime = this.formatTimestamp(message.startTime)
      parts.push(`${MessageRenderer.ANSI.GRAY}[${startTime}]${MessageRenderer.ANSI.RESET}`)
    }

    // 图标和发送者
    const icon = MessageRenderer.ICONS[message.type.toLowerCase() as keyof typeof MessageRenderer.ICONS] || '📝'
    const color = this.getColorForType(message.type)
    const sender = message.sender || 'Unknown'

    parts.push(`${icon} ${color}${sender}${MessageRenderer.ANSI.RESET}`)

    return parts.join(' ') + ':'
  }

  // 渲染普通消息
  async renderMessage(message: UIMessage): Promise<void> {
    if (!this.terminal) return

    const header = this.renderMessageHeader(message)
    await this.typewriterWrite(`\r\n${header}\r\n`)

    // 处理消息内容
    const content = message.message || ''
    const color = this.getColorForType(message.type)

    // 分割长行
    const lines = this.wrapText(content, this.options.maxLineLength - this.options.indent * 2)

    for (const line of lines) {
      const indentedLine = this.addIndent(line)
      const coloredLine = this.options.enableColors
        ? `${color}${indentedLine}${MessageRenderer.ANSI.RESET}`
        : indentedLine

      await this.typewriterWrite(`${coloredLine}\r\n`)
    }

    // 渲染数据（如果存在）
    if (message.data) {
      await this.renderData(message.data)
    }
  }

  // 渲染数据
  async renderData(data: any): Promise<void> {
    if (!this.terminal || !data) return

    const dataHeader = `${MessageRenderer.ANSI.DIM}📊 Data:${MessageRenderer.ANSI.RESET}`
    await this.typewriterWrite(`${dataHeader}\r\n`)

    const formattedData = this.formatJSON(data)
    const indentedData = this.addIndent(formattedData)

    await this.typewriterWrite(`${indentedData}\r\n`)
  }

  // 渲染工具调用
  async renderToolCall(message: UIMessage): Promise<void> {
    if (!this.terminal) return

    const header = `${MessageRenderer.ANSI.YELLOW}🔧 ${t('terminal.toolCall')}${MessageRenderer.ANSI.RESET}`
    await this.typewriterWrite(`\r\n${header}\r\n`)

    // 工具名称
    if (message.data?.toolName) {
      const toolName = `${MessageRenderer.ANSI.CYAN}Tool: ${message.data.toolName}${MessageRenderer.ANSI.RESET}`
      await this.typewriterWrite(`${this.addIndent(toolName)}\r\n`)
    }

    // 工具参数
    if (message.data?.parameters) {
      const paramsHeader = `${MessageRenderer.ANSI.DIM}Parameters:${MessageRenderer.ANSI.RESET}`
      await this.typewriterWrite(`${this.addIndent(paramsHeader)}\r\n`)

      const formattedParams = this.formatJSON(message.data.parameters)
      const indentedParams = this.addIndent(formattedParams, 2)
      await this.typewriterWrite(`${indentedParams}\r\n`)
    }

    // 工具结果
    if (message.data?.result) {
      const resultHeader = `${MessageRenderer.ANSI.DIM}Result:${MessageRenderer.ANSI.RESET}`
      await this.typewriterWrite(`${this.addIndent(resultHeader)}\r\n`)

      const formattedResult = typeof message.data.result === 'string'
        ? message.data.result
        : this.formatJSON(message.data.result)
      const indentedResult = this.addIndent(formattedResult, 2)
      await this.typewriterWrite(`${indentedResult}\r\n`)
    }
  }

  // 渲染错误消息
  async renderError(message: UIMessage): Promise<void> {
    if (!this.terminal) return

    const errorBox = [
      '┌─ ERROR ─────────────────────────────────────────────────┐',
      `│ ${message.message || 'Unknown error'}`.padEnd(59) + '│',
      '└─────────────────────────────────────────────────────────┘'
    ]

    for (const line of errorBox) {
      const coloredLine = `${MessageRenderer.ANSI.BRIGHT_RED}${line}${MessageRenderer.ANSI.RESET}`
      await this.typewriterWrite(`${coloredLine}\r\n`)
    }

    if (message.data?.stack) {
      const stackHeader = `${MessageRenderer.ANSI.DIM}Stack Trace:${MessageRenderer.ANSI.RESET}`
      await this.typewriterWrite(`${stackHeader}\r\n`)

      const stack = this.addIndent(message.data.stack)
      await this.typewriterWrite(`${MessageRenderer.ANSI.GRAY}${stack}${MessageRenderer.ANSI.RESET}\r\n`)
    }
  }

  // 渲染思考过程
  async renderThinking(message: UIMessage): Promise<void> {
    if (!this.terminal) return

    const thinkingHeader = `${MessageRenderer.ANSI.MAGENTA}🤔 ${t('terminal.thinking')}${MessageRenderer.ANSI.RESET}`
    await this.typewriterWrite(`\r\n${thinkingHeader}\r\n`)

    if (message.message) {
      const content = this.addIndent(message.message)
      const coloredContent = `${MessageRenderer.ANSI.DIM}${content}${MessageRenderer.ANSI.RESET}`
      await this.typewriterWrite(`${coloredContent}\r\n`)
    }
  }

  // 渲染进度信息
  async renderProgress(message: UIMessage): Promise<void> {
    if (!this.terminal) return

    const progress = message.data?.progress || 0
    const total = message.data?.total || 100
    const percentage = Math.round((progress / total) * 100)

    // 进度条
    const barWidth = 30
    const filledWidth = Math.round((percentage / 100) * barWidth)
    const emptyWidth = barWidth - filledWidth

    const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth)
    const progressText = `${MessageRenderer.ANSI.CYAN}Progress: [${progressBar}] ${percentage}%${MessageRenderer.ANSI.RESET}`

    // 使用 \r 覆盖当前行
    await this.typewriterWrite(`\r${progressText}`)

    if (percentage === 100) {
      await this.typewriterWrite('\r\n')
    }
  }

  // 主渲染方法
  async render(message: UIMessage): Promise<void> {
    try {
      switch (message.type as string) {
        case 'tool':
        case 'TOOL':
          await this.renderToolCall(message)
          break
        case 'error':
        case 'ERROR':
          await this.renderError(message)
          break
        case 'assistant':
        case 'ASSISTANT':
          await this.renderProgress(message)
          break
        case 'user':
        case 'USER':
          await this.renderProgress(message)
          break
        case 'tool_approval':
        case 'TOOL_APPROVAL':
          await this.renderProgress(message)
          break
        default:
          await this.renderMessage(message)
          break
      }
    } catch (error) {
      console.error('Message rendering error:', error)
      if (this.terminal) {
        const errorText = `${MessageRenderer.ANSI.BRIGHT_RED}[${t('terminal.renderError')}: ${error instanceof Error ? error.message : String(error)}]${MessageRenderer.ANSI.RESET}\r\n`
        await this.typewriterWrite(errorText)
      }
    }
  }
  // 渲染提示符
  async renderPrompt(prompt: string = '$ '): Promise<void> {
    if (!this.terminal) return

    const coloredPrompt = `${MessageRenderer.ANSI.BRIGHT_GREEN}${prompt}${MessageRenderer.ANSI.RESET}`
    await this.typewriterWrite(`\r\n${coloredPrompt}`)
  }

  // 清屏
  clear(): void {
    if (this.terminal) {
      this.terminal.write(MessageRenderer.ANSI.CLEAR_SCREEN + MessageRenderer.ANSI.HOME)
    }
  }

  // 更新配置
  updateOptions(options: Partial<MessageRenderOptions>): void {
    this.options = { ...this.options, ...options }
  }
}