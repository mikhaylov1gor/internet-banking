import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isAuthenticated } from '../../auth'
import { registerWebPushToken } from './web-push'

export const useWebPushAfterAuth = (): void => {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isAuthenticated()) {
      return
    }
    void registerWebPushToken().catch(() => {})
  }, [pathname])
}