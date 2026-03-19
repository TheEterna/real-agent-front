// Help命令实现
import type { CommandHandler } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export default {
  name: 'help',
  description: t('composable.commands.helpDesc'),
  usage: '/help [command]',
  examples: [
    '/help',
    '/help clear',
    '/help explain'
  ],
  async execute(args: string, context?: any): Promise<string> {
    const { useCommandParser } = await import('../useCommandParser')
    const { getCommandHelp } = useCommandParser()
    const parser = getCommandHelp

    if (args.trim()) {
      return parser(args.trim())
    }

    return `🎯 ${t('composable.commands.helpTitle')}

${parser()}

💡 ${t('common.label.description')}:
- ${t('composable.commands.helpTipAiChat')}
- ${t('composable.commands.helpTipCommand')}
- ${t('composable.commands.helpTipHistory')}
- ${t('composable.commands.helpTipInterrupt')}

🚀 ${t('composable.commands.helpGeekFeatures')}
- ${t('composable.commands.helpFeatureTerminal')}
- ${t('composable.commands.helpFeatureCommand')}
- ${t('composable.commands.helpFeatureStream')}
- ${t('composable.commands.helpFeatureMatrix')}

${t('composable.commands.helpEnjoy')} 🤖`
  }
} as CommandHandler
