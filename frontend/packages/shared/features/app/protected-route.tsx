import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, getUserType } from '../auth'
import { ErrorFallback } from '@shared/ui/error-fallback'

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
    return <Navigate to="/login" replace />
  }
  
  if (allowedUserType && getUserType() !== allowedUserType) {
    const deniedUserType = allowedUserType === 'client' ? 'employee' : 'client'
    return (
      <>
        {appBarComponent}
        <div style={{ padding: '20px' }}>
          <ErrorFallback
            title="Нет доступа"
            message="У вас нет доступа к этой странице"
            onGoBack={() => window.location.href = '/'}
            goBackLabel="На главную"
          />
        </div>
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

