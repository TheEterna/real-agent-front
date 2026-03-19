export function withAvatarVersion(url?: string | null, version?: string | number | null): string {
  if (!url) {
    return ''
  }

  if (version === undefined || version === null || version === '') {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}avatar_v=${encodeURIComponent(String(version))}`
}
