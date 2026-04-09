import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  tokenStorage,
  EMPLOYEE_HIDE_ACCOUNTS_FEATURE_CHANGED_EVENT,
  syncEmployeeHideAccountsFeatureFromSearch,
  readPersistedTheme,
  writePersistedTheme,
  notifyUser,
} from '@shared/utils'
import type { Theme } from '@shared/utils'
import {
  getAppSettings,
  updateAppSettings,
  type AppSettings,
  type AppType,
} from '@shared/api/endpoints/app-settings'
import { isAuthenticated } from '../../auth'
import type { ThemeContextValue } from '../theme-context'

export const useThemeProviderState = (appType: AppType): ThemeContextValue => {
  const userId = tokenStorage.getUserId()

  const [hideAccountsFeatureEnabled, setHideAccountsFeatureEnabled] = useState(() => {
    if (appType !== 'employee') return true
    if (typeof window === 'undefined') return false
    return syncEmployeeHideAccountsFeatureFromSearch(window.location.search)
  })

  const [theme, setTheme] = useState<Theme>(() => readPersistedTheme(appType, tokenStorage.getUserId()))
  const [hiddenAccountIds, setHiddenAccountIds] = useState<string[]>([])
  const [isSettingsLoading, setIsSettingsLoading] = useState(false)

  const hiddenAccountIdsRef = useRef(hiddenAccountIds)
  hiddenAccountIdsRef.current = hiddenAccountIds

  const themeRef = useRef(theme)
  themeRef.current = theme

  const hideAccountsFeatureEnabledRef = useRef(hideAccountsFeatureEnabled)
  hideAccountsFeatureEnabledRef.current = hideAccountsFeatureEnabled

  const employeeHideFeaturePrevRef = useRef<boolean | null>(null)

  useEffect(() => {
    hideAccountsFeatureEnabledRef.current = hideAccountsFeatureEnabled
  }, [hideAccountsFeatureEnabled])

  useEffect(() => {
    if (appType !== 'employee') return
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail
      setHideAccountsFeatureEnabled(detail)
    }
    window.addEventListener(EMPLOYEE_HIDE_ACCOUNTS_FEATURE_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(EMPLOYEE_HIDE_ACCOUNTS_FEATURE_CHANGED_EVENT, onChange)
  }, [appType])

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const applySettingsFromResponse = useCallback(
    (settings: AppSettings) => {
      setTheme(settings.theme)
      const uid = tokenStorage.getUserId()
      if (uid) {
        writePersistedTheme(appType, uid, settings.theme)
      }
      const useHidden =
        appType === 'client' || (appType === 'employee' && hideAccountsFeatureEnabledRef.current)
      setHiddenAccountIds(useHidden ? settings.hidden_account_ids : [])
    },
    [appType]
  )

  useEffect(() => {
    if (!isAuthenticated()) return

    setIsSettingsLoading(true)
    getAppSettings(appType)
      .then((settings) => {
        applySettingsFromResponse(settings)
      })
      .catch(() => {})
      .finally(() => {
        setIsSettingsLoading(false)
      })
  }, [appType, userId, applySettingsFromResponse, hideAccountsFeatureEnabled])

  useEffect(() => {
    if (appType !== 'employee') return

    if (hideAccountsFeatureEnabled) {
      employeeHideFeaturePrevRef.current = true
      return
    }

    setHiddenAccountIds([])

    const prev = employeeHideFeaturePrevRef.current

    if (prev === null) {
      employeeHideFeaturePrevRef.current = false
      return
    }
    if (prev !== true) {
      return
    }

    employeeHideFeaturePrevRef.current = false

    if (!isAuthenticated()) return
    updateAppSettings(appType, {
      theme: themeRef.current,
      hidden_account_ids: [],
    })
      .then((settings) => {
        applySettingsFromResponse(settings)
      })
      .catch(() => {})
  }, [appType, hideAccountsFeatureEnabled, applySettingsFromResponse])

  const syncToServer = useCallback(
    (nextTheme: Theme, nextHiddenIds: string[]) => {
      const persistHidden =
        appType === 'client' ||
        (appType === 'employee' && hideAccountsFeatureEnabledRef.current)
      return updateAppSettings(appType, {
        theme: nextTheme,
        hidden_account_ids: persistHidden ? nextHiddenIds : [],
      })
        .then((settings) => {
          applySettingsFromResponse(settings)
        })
        .catch(() => {})
    },
    [appType, applySettingsFromResponse]
  )

  const toggleTheme = useCallback(() => {
    const next: Theme = themeRef.current === 'light' ? 'dark' : 'light'
    setTheme(next)
    const uid = tokenStorage.getUserId()
    if (uid) {
      writePersistedTheme(appType, uid, next)
    }
    const persistHidden =
      appType === 'client' ||
      (appType === 'employee' && hideAccountsFeatureEnabledRef.current)
    void updateAppSettings(appType, {
      theme: next,
      hidden_account_ids: persistHidden ? hiddenAccountIdsRef.current : [],
    })
      .then((settings) => {
        applySettingsFromResponse(settings)
      })
      .catch(() => {
        notifyUser('Ошибка синхронизации', 'warning')
      })
  }, [appType, applySettingsFromResponse])

  const toggleHiddenAccount = useCallback(
    (accountId: string) => {
      if (appType === 'employee' && !hideAccountsFeatureEnabledRef.current) return
      const prev = hiddenAccountIdsRef.current
      const next = prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
      void syncToServer(themeRef.current, next)
    },
    [appType, syncToServer]
  )

  const contextHideAccountsEnabled = appType === 'client' ? true : hideAccountsFeatureEnabled

  return {
    theme,
    toggleTheme,
    hiddenAccountIds,
    toggleHiddenAccount,
    isSettingsLoading,
    hideAccountsFeatureEnabled: contextHideAccountsEnabled,
  }
}
