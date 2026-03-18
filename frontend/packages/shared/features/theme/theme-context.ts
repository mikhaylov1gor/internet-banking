import { createContext } from 'react'
import type { Theme } from '@shared/utils'

export type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
