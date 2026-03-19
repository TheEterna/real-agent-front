// 命令解析器 - 极客模式专用
// 支持 /command args 格式的命令解析

import type { ParsedCommand } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export const useCommandParser = () => {
  // 解析命令字符串
  const parseCommand = (input: string): ParsedCommand | null => {
    if (!input.startsWith('/')) return null

    const trimmedInput = input.trim()
    const spaceIndex = trimmedInput.indexOf(' ')

    let command: string
    let args: string

    if (spaceIndex === -1) {
      // 没有参数的命令
      command = trimmedInput.slice(1).toLowerCase()
      args = ''
    } else {
      // 有参数的命令
      command = trimmedInput.slice(1, spaceIndex).toLowerCase()
      args = trimmedInput.slice(spaceIndex + 1).trim()
    }

    return {
      command,
      args,
      original: trimmedInput,
      metadata: extractMetadata(args)
    }
  }

  // 从参数中提取元数据
  const extractMetadata = (args: string): Record<string, any> => {
    const metadata: Record<string, any> = {}

    // 解析 --flag=value 格式的参数
    const flagRegex = /--(\w+)(?:=(\S+))?/g
    let match

    while ((match = flagRegex.exec(args)) !== null) {
      const key = match[1]
      const value = match[2] || true
      metadata[key] = value
    }

    // 解析 -f value 格式的参数
    const shortFlagRegex = /-([a-zA-Z])\s+(\S+)/g
    while ((match = shortFlagRegex.exec(args)) !== null) {
      const key = match[1]
      const value = match[2]
      metadata[key] = value
    }

    return metadata
  }

  // 检查命令是否有效
  const isValidCommand = (command: string): boolean => {
    return getAvailableCommands().includes(command)
  }

  // 获取可用命令列表
  const getAvailableCommands = (): string[] => {
    return [
      'help',
      'clear',
      'time',
      'status',
      'theme',
      'version'
    ]
  }

  // 获取命令帮助信息
  const getCommandHelp = (command?: string): string => {
    const helpInfo: Record<string, string> = {
      help: `${t('composable.terminal.helpCommandDesc')}\n${t('composable.terminal.usageLabel', { usage: 'help [command]' })}`,
      clear: `${t('composable.terminal.clearCommandDesc')}\n${t('composable.terminal.usageLabel', { usage: 'clear' })}`,
      time: `${t('composable.commands.timeDesc')}\n${t('composable.terminal.usageLabel', { usage: 'time' })}`,
      status: `${t('composable.terminal.statusCommandDesc')}\n${t('composable.terminal.usageLabel', { usage: 'status' })}`,
      theme: `${t('composable.terminal.themeCommandDesc')}\n${t('composable.terminal.usageLabel', { usage: 'theme [list|set <name>]' })}`,
      version: `${t('composable.terminal.versionCommandDesc')}\n${t('composable.terminal.usageLabel', { usage: 'version' })}`
    }

    if (command && helpInfo[command]) {
      return helpInfo[command]
    }

    return `${t('composable.terminal.availableCommandsTitle')}
${Object.entries(helpInfo).map(([cmd, desc]) =>
  `  /${cmd} - ${desc.split('\n')[0]}`
).join('\n')}

${t('composable.terminal.helpUsageTip')}`
  }

  // 命令自动补全
  const getCommandSuggestions = (partial: string): string[] => {
    const commands = getAvailableCommands()

    if (!partial.startsWith('/')) {
      return []
    }

    const commandPart = partial.slice(1).toLowerCase()

    return commands
      .filter(cmd => cmd.startsWith(commandPart))
      .map(cmd => `/${cmd}`)
  }

  return {
    parseCommand,
    isValidCommand,
    getAvailableCommands,
    getCommandHelp,
    getCommandSuggestions,
    extractMetadata
  }
}