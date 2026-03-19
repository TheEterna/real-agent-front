// Clear命令实现
import type { CommandHandler } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export default {
  name: 'clear',
  description: t('composable.commands.clearDesc'),
  usage: '/clear',
  examples: ['/clear'],
  async execute(args: string, context?: any): Promise<string> {
    // 返回特殊标记，告诉UI清空消息列表
    return '__CLEAR_TERMINAL__'
  }
} as CommandHandler