import type { ReactNode } from 'react'
import type { AppType } from '@shared/api/endpoints/app-settings'
import { ThemeContext } from './theme-context'
import { useThemeProviderState } from './model/use-theme-provider-state'

type ThemeProviderProps = {
  children: ReactNode
  appType: AppType
}

export const ThemeProvider = ({ children, appType }: ThemeProviderProps) => {
  const value = useThemeProviderState(appType)
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
