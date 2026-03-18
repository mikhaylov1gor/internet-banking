import React, { useState, useCallback, useEffect } from 'react'
import { themeStorage, tokenStorage } from '@shared/utils'
import type { Theme } from '@shared/utils'
import { ThemeContext } from './theme-context'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userId = tokenStorage.getUserId()

  const [theme, setTheme] = useState<Theme>(() => themeStorage.getTheme(userId))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const currentTheme = themeStorage.getTheme(userId)
    if (currentTheme !== theme) {
      setTheme(currentTheme)
    }
  }, [userId])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      themeStorage.setTheme(userId, next)
      return next
    })
  }, [userId])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
