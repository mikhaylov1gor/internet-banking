export type Theme = 'light' | 'dark'

export type ThemePersistAppType = 'client' | 'employee'

const sessionKey = (appType: ThemePersistAppType, userId: string): string =>
  `app_settings_theme_${appType}_${userId}`

export const readPersistedTheme = (appType: ThemePersistAppType, userId: string | null): Theme => {
  if (typeof window === 'undefined' || !userId) return 'light'
  try {
    const raw = sessionStorage.getItem(sessionKey(appType, userId))
    if (raw === 'dark') return 'dark'
    return 'light'
  } catch {
    return 'light'
  }
}

export const writePersistedTheme = (
  appType: ThemePersistAppType,
  userId: string,
  theme: Theme
): void => {
  try {
    sessionStorage.setItem(sessionKey(appType, userId), theme)
  } catch {}
}
