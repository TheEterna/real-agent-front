// 命令注册表 - 动态加载命令模块
import type { CommandRegistry } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export const commandRegistry: CommandRegistry = {
  help: () => import('./help'),
  clear: () => import('./clear'),
  time: () => import('./time'),
  status: () => import('./status'),
  theme: () => import('./theme'),
  version: () => import('./version'),
  // 未来扩展命令在此添加
  // explain: () => import('./explain'),
  // analyze: () => import('./analyze'),
}

// 获取所有注册的命令名称
export const getRegisteredCommands = (): string[] => {
  return Object.keys(commandRegistry)
}

// 检查命令是否已注册
export const isRegisteredCommand = (command: string): boolean => {
  return command in commandRegistry
}

// 动态执行命令
export const executeCommand = async (command: string, args: string, context?: any): Promise<string> => {
  if (!isRegisteredCommand(command)) {
    throw new Error(t('composable.commands.commandNotFound', { command }))
  }

  try {
    const commandModule = await commandRegistry[command]()
    const handler = commandModule.default

    if (!handler || typeof handler.execute !== 'function') {
      throw new Error(t('composable.commands.commandConfigError', { command }))
    }

    return await handler.execute(args, context)
  } catch (error) {
    throw new Error(t('composable.commands.commandExecuteError', { command, error: error instanceof Error ? error.message : String(error) }))
  }
}