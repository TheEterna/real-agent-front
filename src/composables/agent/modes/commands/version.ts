// Version命令实现 - 显示版本信息
import type { CommandHandler } from '@/types/agent/modes/commands'
import i18n from '@/i18n'

const t = i18n.global.t

export default {
  name: 'version',
  description: t('composable.commands.versionDesc'),
  usage: '/version',
  examples: ['/version'],
  async execute(args: string, context?: any): Promise<string> {
    return `🚀 VOLO AI Terminal

██████╗ ███████╗ █████╗ ██╗         █████╗  ██████╗ ███████╗███╗   ██╗████████╗
██╔══██╗██╔════╝██╔══██╗██║        ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
██████╔╝█████╗  ███████║██║        ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
██╔══██╗██╔══╝  ██╔══██║██║        ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
██║  ██║███████╗██║  ██║███████╗   ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝

📦 ${t('composable.commands.versionInfo')}
- ${t('composable.commands.versionTerminal')}
- ${t('composable.commands.versionGeekMode')}
- ${t('composable.commands.versionBuildTime', { date: new Date().toLocaleDateString('zh-CN') })}

🛠️ ${t('composable.commands.versionTechStack')}
- Frontend: Vue 3 + TypeScript
- Terminal: xterm.js v5.5.0
- State: Pinia
- Protocol: Server-Sent Events (SSE)
- Styling: SCSS + Animations

🌟 ${t('composable.commands.versionFeatures')}
- ${t('composable.commands.versionFeatureStream')}
- ${t('composable.commands.versionFeatureMatrix')}
- ${t('composable.commands.versionFeatureCommand')}
- ${t('composable.commands.versionFeatureTheme')}
- ${t('composable.commands.versionFeatureAi')}

💡 ${t('composable.commands.versionDeveloper')}
🎯 ${t('composable.commands.versionLicense')}`
  }
} as CommandHandler
