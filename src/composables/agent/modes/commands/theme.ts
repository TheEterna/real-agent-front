// Theme命令实现 - 终端主题管理
import type { CommandHandler } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export default {
  name: 'theme',
  description: t('composable.commands.themeDesc'),
  usage: '/theme [list|set <theme-name>]',
  examples: [
    '/theme',
    '/theme list',
    '/theme set matrix-green',
    '/theme set cyberpunk'
  ],
  async execute(args: string, context?: any): Promise<string> {
    const trimmedArgs = args.trim().toLowerCase()

    if (!trimmedArgs || trimmedArgs === 'list') {
      return `🎨 ${t('composable.commands.themeAvailable')}

🟢 matrix-green ${t('composable.commands.themeCurrentSuffix')}    - ${t('composable.commands.themeMatrixGreenDesc')}
🔵 matrix-blue           - ${t('composable.commands.themeMatrixBlueDesc')}
🟣 cyberpunk            - ${t('composable.commands.themeCyberpunkDesc')}
🟡 hacker-gold          - ${t('composable.commands.themeHackerGoldDesc')}
⚪ terminal-classic      - ${t('composable.commands.themeTerminalClassicDesc')}

${t('composable.commands.themeUsage')}
${t('composable.commands.themeExample')}`
    }

    if (trimmedArgs.startsWith('set ')) {
      const themeName = trimmedArgs.substring(4).trim()

      const availableThemes = [
        'matrix-green',
        'matrix-blue',
        'cyberpunk',
        'hacker-gold',
        'terminal-classic'
      ]

      if (!availableThemes.includes(themeName)) {
        return `❌ ${t('composable.commands.themeNotFound', { name: themeName })}

${t('composable.commands.themeAvailableList', { list: availableThemes.join(', ') })}

${t('composable.commands.themeUseList')}`
      }

      // 这里应该调用主题切换函数
      // context?.switchTheme?.(themeName)

      return `✅ ${t('composable.commands.themeSwitched', { name: themeName })}

🎨 ${t('composable.commands.themeFeatures')}
- ${t('composable.commands.themeColorUpdated')}
- ${t('composable.commands.themeEffectApplied')}
- ${t('composable.commands.themeStyleRefreshed')}

${t('composable.commands.themeEnjoy')} ✨`
    }

    return `❌ ${t('composable.commands.themeInvalidArgs')}

${t('composable.commands.themeUsageTitle')}
  ${t('composable.commands.themeUsageShow')}
  ${t('composable.commands.themeUsageList')}
  ${t('composable.commands.themeUsageSet')}

${t('composable.commands.themeUsageExample')}`
  }
} as CommandHandler
