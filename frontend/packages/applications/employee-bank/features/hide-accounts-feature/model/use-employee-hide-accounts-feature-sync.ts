import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  dispatchEmployeeHideAccountsFeatureChanged,
  syncEmployeeHideAccountsFeatureFromSearch,
} from '@shared/utils'

export const useEmployeeHideAccountsFeatureSync = () => {
  const location = useLocation()

  useEffect(() => {
    const enabled = syncEmployeeHideAccountsFeatureFromSearch(location.search)
    dispatchEmployeeHideAccountsFeatureChanged(enabled)
  }, [location.search])
}
