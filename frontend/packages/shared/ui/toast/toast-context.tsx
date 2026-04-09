import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { USER_NOTIFY_EVENT, type UserNotifyDetail, type UserNotifyVariant } from '@shared/utils'
import './style.css'

type ToastContextValue = {
  show: (message: string, variant?: UserNotifyVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const fallbackToast: ToastContextValue = { show: () => {} }

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<{ message: string; variant: UserNotifyVariant } | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((text: string, variant: UserNotifyVariant = 'default') => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }
    setToast({ message: text, variant })
    hideTimer.current = setTimeout(() => {
      setToast(null)
      hideTimer.current = null
    }, 2800)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  useEffect(() => {
    const onNotify = (e: Event) => {
      const detail = (e as CustomEvent<UserNotifyDetail>).detail
      if (detail?.message) {
        show(detail.message, detail.variant ?? 'default')
      }
    }
    window.addEventListener(USER_NOTIFY_EVENT, onNotify)
    return () => window.removeEventListener(USER_NOTIFY_EVENT, onNotify)
  }, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast !== null && (
        <div
          className={
            toast.variant === 'warning'
              ? 'shared-toast shared-toast--warning'
              : 'shared-toast'
          }
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  return ctx ?? fallbackToast
}
