import { createContext } from 'react'
import type { Theme } from '@shared/utils'

export type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
  hiddenAccountIds: string[]
  toggleHiddenAccount: (accountId: string) => void
  isSettingsLoading: boolean
  hideAccountsFeatureEnabled: boolean
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
