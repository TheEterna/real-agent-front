import { describe, expect, it } from 'vitest'
import { withAvatarVersion } from '@/utils/avatarUrl'

describe('withAvatarVersion', () => {
  it('returns original value when url is empty', () => {
    expect(withAvatarVersion('', 123)).toBe('')
    expect(withAvatarVersion(null, 123)).toBe('')
  })

  it('returns original url when version is missing', () => {
    expect(withAvatarVersion('https://cdn.example.com/avatar.png')).toBe('https://cdn.example.com/avatar.png')
  })

  it('appends avatar version to plain urls', () => {
    expect(withAvatarVersion('https://cdn.example.com/avatar.png', 123)).toBe(
      'https://cdn.example.com/avatar.png?avatar_v=123'
    )
  })

  it('appends avatar version to urls with existing query parameters', () => {
    expect(withAvatarVersion('https://cdn.example.com/avatar.png?x=1', 123)).toBe(
      'https://cdn.example.com/avatar.png?x=1&avatar_v=123'
    )
  })
})
