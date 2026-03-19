// Time命令实现
import type { CommandHandler } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export default {
  name: 'time',
  description: t('composable.commands.timeDesc'),
  usage: '/time',
  examples: ['/time'],
  async execute(args: string, context?: any): Promise<string> {
    const now = new Date()
    const startTime = now.getTime()
    const iso = now.toISOString()
    const local = now.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long'
    })

    return `⏰ ${t('composable.commands.timeTitle')}

📅 ${t('composable.commands.timeLocal', { time: local })}
🌍 ${t('composable.commands.timeUtc', { time: iso })}
⏱️  ${t('composable.commands.timeTimestamp', { time: startTime })}
🕐 ${t('composable.commands.timeUnix', { time: Math.floor(startTime / 1000) })}

${t('composable.commands.timeTimezone')}`
  }
} as CommandHandler
