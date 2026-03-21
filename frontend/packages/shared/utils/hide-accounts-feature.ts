export const HIDE_ACCOUNTS_FEATURE_QUERY_PARAM = 'HideAcctounsFeature'

const STORAGE_KEY = 'employee_hide_accounts_feature'

export const EMPLOYEE_HIDE_ACCOUNTS_FEATURE_CHANGED_EVENT = 'employee-hide-accounts-feature-changed'

export const syncEmployeeHideAccountsFeatureFromSearch = (search: string): boolean => {
  if (typeof window === 'undefined') {
    return false
  }
  const normalized = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(normalized)
  const raw = params.get(HIDE_ACCOUNTS_FEATURE_QUERY_PARAM)
  if (raw === 'true') {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    return true
  }
  if (raw === 'false') {
    sessionStorage.setItem(STORAGE_KEY, 'false')
    return false
  }
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

export const dispatchEmployeeHideAccountsFeatureChanged = (enabled: boolean): void => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<boolean>(EMPLOYEE_HIDE_ACCOUNTS_FEATURE_CHANGED_EVENT, { detail: enabled })
  )
}
