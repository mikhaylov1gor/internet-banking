import React from 'react'
import { isAuthenticated, getUserType } from '../auth'
import { redirectToAuth } from '@shared/utils'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { AppBarWithNavigation } from './app-bar-with-navigation'

const USER_HOME_URL: Record<string, string> = {
  client: 'http://localhost:5174',
  employee: 'http://localhost:5173',
}

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserType?: 'client' | 'employee'
  appBarComponent?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserType,
  appBarComponent 
}) => {
  if (!isAuthenticated()) {
    redirectToAuth()
    return null
  }

  const userType = getUserType()

  if (allowedUserType && userType !== allowedUserType) {
    const homeUrl = USER_HOME_URL[userType || 'client']
    return (
      <>
        <AppBarWithNavigation buttons={[]} />
        <ErrorFallback
          title="Страница не найдена"
          message="Запрашиваемая страница не существует"
          onGoBack={() => { window.location.href = homeUrl }}
          goBackLabel="На главную"
        />
      </>
    )
  }
  
  return (
    <>
      {appBarComponent}
      {children}
    </>
  )
}
