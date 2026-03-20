export type Theme = 'light' | 'dark'

const COOKIE_EXPIRY_DAYS = 365

const setThemeCookie = (name: string, value: string) => {
  const expires = new Date(Date.now() + COOKIE_EXPIRY_DAYS * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

const getThemeCookie = (name: string): string | null => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const buildCookieName = (userId: string | null): string =>
  userId ? `theme_${userId}` : 'theme_default'

export const themeStorage = {
  getTheme: (userId: string | null): Theme => {
    const raw = getThemeCookie(buildCookieName(userId))
    return raw === 'dark' ? 'dark' : 'light'
  },

  setTheme: (userId: string | null, theme: Theme) => {
    setThemeCookie(buildCookieName(userId), theme)
  },
}
