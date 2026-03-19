// 终端命令执行器和注册表
// 管理所有可用的终端命令

import { useCommandParser } from '../useCommandParser'
import type { CommandDefinition } from '../useCommandParser'
import i18n from '@/i18n'

const t = i18n.global.t

// 命令执行上下文
export interface CommandContext {
  terminal?: any
  sessionId?: string
  switchTheme?: (themeName: string) => void
  xtermVersion?: string
  commandHistory?: string[]
  [key: string]: any
}

// 获取命令解析器实例
const { registerCommand, getCommandDefinition, isValidCommand } = useCommandParser()

// 基础命令：帮助
const helpCommand: CommandDefinition = {
  name: 'help',
  description: t('composable.terminal.helpCommandDesc'),
  usage: 'help [command]',
  examples: [
    'help',
    'help clear',
    'help theme'
  ],
  aliases: ['h', '?'],
  handler: async (args: string[], options: Record<string, any>, context?: CommandContext) => {
    const { formatCommandHelp, formatAllCommandsHelp } = useCommandParser()

    if (args.length === 0) {
      return formatAllCommandsHelp()
    }

    const commandName = args[0]
    return formatCommandHelp(commandName)
  }
}

// 清屏命令
const clearCommand: CommandDefinition = {
  name: 'clear',
  description: t('composable.terminal.clearCommandDesc'),
  usage: 'clear',
  examples: ['clear'],
  aliases: ['cls', 'c'],
  handler: async (args: string[], options: Record<string, any>, context?: CommandContext) => {
    // 返回特殊标识符，告诉终端需要清屏
    return '__CLEAR_TERMINAL__'
  }
}

// 主题切换命令
const themeCommand: CommandDefinition = {
  name: 'theme',
  description: t('composable.terminal.themeCommandDesc'),
  usage: 'theme [name]',
  examples: [
    'theme',
    'theme matrix-green',
    'theme cyberpunk',
    'theme hacker-gold'
  ],
  aliases: ['t'],
  handler: async (args: string[], options: Record<string, any>, context?: CommandContext) => {
    const availableThemes = [
      'matrix-green',
      'matrix-blue',
      'cyberpunk',
      'hacker-gold',
      'terminal-classic'
    ]

    if (args.length === 0) {
      return `${t('composable.terminal.themeAvailableList', { list: availableThemes.join(', ') })}\n${t('composable.terminal.themeUsage')}`
    }

    const themeName = args[0]
    if (!availableThemes.includes(themeName)) {
      return `${t('composable.terminal.themeUnknown', { name: themeName })}\n${t('composable.terminal.themeAvailable', { list: availableThemes.join(', ') })}`
    }

    if (context?.switchTheme) {
      context.switchTheme(themeName)
      return t('composable.terminal.themeSwitched', { name: themeName })
    } else {
      return t('composable.terminal.themeSwitchUnavailable')
    }
  }
}

// 状态信息命令
const statusCommand: CommandDefinition = {
  name: 'status',
  description: t('composable.terminal.statusCommandDesc'),
  usage: 'status',
  examples: ['status'],
  aliases: ['stat'],
  handler: async (args: string[], options: Record<string, any>, context?: CommandContext) => {
    let status = `\n=== ${t('composable.terminal.terminalStatusTitle')} ===\n`
    status += `${t('composable.terminal.sessionId', { id: context?.sessionId || '?' })}\n`
    status += `${t('composable.terminal.xtermVersion', { version: context?.xtermVersion || '?' })}\n`
    status += `${t('composable.terminal.commandHistoryCount', { count: context?.commandHistory?.length || 0 })}\n`
    status += `${t('composable.terminal.time', { time: new Date().toLocaleString() })}\n`

    // 添加终端信息
    if (context?.terminal) {
      const term = context.terminal
      status += `${t('composable.terminal.terminalSize', { cols: term.cols || '?', rows: term.rows || '?' })}\n`
    }

    return status
  }
}

// 版本信息命令
const versionCommand: CommandDefinition = {
  name: 'version',
  description: t('composable.terminal.versionCommandDesc'),
  usage: 'version',
  examples: ['version'],
  aliases: ['v', 'ver'],
  handler: async (args: string[], options: Record<string, any>, context?: CommandContext) => {
    return `\n${t('composable.terminal.versionInfo', { year: new Date().getFullYear() })}\n`
  }
}

// 历史命令
const historyCommand: CommandDefinition = {
  name: 'history',
  description: t('composable.terminal.historyDesc'),
  usage: 'history [count]',
  examples: [
    'history',
    'history 10'
  ],
  aliases: ['hist'],
  handler: async (args: string[], options: Record<string, any>, context?: CommandContext) => {
    const history = context?.commandHistory || []

    if (history.length === 0) {
      return t('composable.terminal.historyEmpty')
    }

    let limit = 20 // 默认显示最近20条
    if (args.length > 0) {
      const requestedLimit = parseInt(args[0])
      if (!isNaN(requestedLimit) && requestedLimit > 0) {
        limit = Math.min(requestedLimit, 100) // 最多100条
      }
    }

    const recentHistory = history.slice(-limit)
    let result = `\n${t('composable.terminal.recentHistoryTitle', { count: recentHistory.length })}\n\n`

    recentHistory.forEach((cmd, index) => {
      const lineNumber = (history.length - recentHistory.length + index + 1).toString().padStart(3, ' ')
      result += `${lineNumber}  ${cmd}\n`
    })

    return result
  }
}

// Echo命令（测试用）
const echoCommand: CommandDefinition = {
  name: 'echo',
  description: t('composable.terminal.echoDesc'),
  usage: 'echo <text>',
  examples: [
    'echo Hello World',
    'echo "text with spaces"'
  ],
  handler: async (args: string[], options: Record<string, any>, context?: CommandContext) => {
    if (args.length === 0) {
      return ''
    }
    return args.join(' ')
  }
}

// 注册所有基础命令
const registerBasicCommands = () => {
  registerCommand(helpCommand)
  registerCommand(clearCommand)
  registerCommand(themeCommand)
  registerCommand(statusCommand)
  registerCommand(versionCommand)
  registerCommand(historyCommand)
  registerCommand(echoCommand)
}

// 执行命令
export const executeCommand = async (
  commandName: string,
  args: string[],
  context?: CommandContext
): Promise<string> => {
  const definition = getCommandDefinition(commandName)

  if (!definition) {
    throw new Error(t('composable.terminal.commandNotExistsHelp', { command: commandName }))
  }

  try {
    const result = await definition.handler(args, {}, context)
    return result
  } catch (error) {
    throw new Error(t('composable.terminal.commandExecError', { error: error instanceof Error ? error.message : String(error) }))
  }
}

// 初始化命令系统
export const initializeCommands = () => {
  registerBasicCommands()
}

// 导出命令相关类型和工具
export type { CommandDefinition }
export { registerCommand, getCommandDefinition, isValidCommand }

// 自动初始化
initializeCommands()