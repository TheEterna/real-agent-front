import i18n from '@/i18n'
const { t } = i18n.global

export const DEFAULT_ROLEPLAY_USER_ID = 1

export function getRoleplayModeLabel(mode: 'text' | 'voice'): string {
  return mode === 'voice' ? t('constants.roleplay.voice') : t('constants.roleplay.text')
}

export function toServerMode(label: string): 'text' | 'voice' {
  const voiceLabel = t('constants.roleplay.voice')
  return label === voiceLabel ? 'voice' : 'text'
}
