// Status命令实现 - 显示终端状态信息
import type { CommandHandler } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export default {
  name: 'status',
  description: t('composable.commands.statusDesc'),
  usage: '/status',
  examples: ['/status'],
  async execute(args: string, context?: any): Promise<string> {
    const now = new Date()
    const uptime = performance.now()

    return `🖥️  VOLO AI Terminal Status

⏰ ${t('composable.commands.statusSystemTime', { time: now.toLocaleString('zh-CN') })}
⚡ ${t('composable.commands.statusUptime', { seconds: Math.floor(uptime / 1000) })}
🔋 ${t('composable.commands.statusOnline')}
🌐 ${t('composable.commands.statusMode')}
🎯 ${t('composable.commands.statusVersion')}

📊 ${t('composable.commands.statusConnectionInfo')}
- ${t('composable.commands.statusWsConnected')}
- ${t('composable.commands.statusTerminal', { version: context?.xtermVersion || 'v5.5.0' })}
- ${t('composable.commands.statusTheme')}
- ${t('composable.commands.statusFont')}

🚀 ${t('composable.commands.statusReady')}`
  }
} as CommandHandler
