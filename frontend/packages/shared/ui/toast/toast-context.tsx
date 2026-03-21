import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { USER_NOTIFY_EVENT, type UserNotifyDetail } from '@shared/utils'
import './style.css'

type ToastContextValue = {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const fallbackToast: ToastContextValue = { show: () => {} }

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((text: string) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }
    setMessage(text)
    hideTimer.current = setTimeout(() => {
      setMessage(null)
      hideTimer.current = null
    }, 2800)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  useEffect(() => {
    const onNotify = (e: Event) => {
      const detail = (e as CustomEvent<UserNotifyDetail>).detail
      if (detail?.message) {
        show(detail.message)
      }
    }
    window.addEventListener(USER_NOTIFY_EVENT, onNotify)
    return () => window.removeEventListener(USER_NOTIFY_EVENT, onNotify)
  }, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message !== null && (
        <div className="shared-toast" role="status" aria-live="polite">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  return ctx ?? fallbackToast
}
