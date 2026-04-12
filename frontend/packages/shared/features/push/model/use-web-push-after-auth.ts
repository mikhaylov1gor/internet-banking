import { useEffect } from 'react'
import { isAuthenticated } from '../../auth'
import { registerWebPushToken } from './web-push'

export const useWebPushAfterAuth = (): void => {
  useEffect(() => {
    if (!isAuthenticated()) return
    void registerWebPushToken().catch(() => {})
  }, [])
}
