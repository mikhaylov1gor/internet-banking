import React from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { isMobileDevice } from '@shared/utils'
import { DesktopLoginPage, MobileLoginPage } from '../pages/login'
import './style.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const isMobile = isMobileDevice()

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="auth-app">
        {isMobile ? <MobileLoginPage /> : <DesktopLoginPage />}
      </div>
    </QueryClientProvider>
  )
}
