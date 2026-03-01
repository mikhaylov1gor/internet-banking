import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { isAuthenticated } from '../auth'
import { ProtectedRoute, ProtectedRouteProps } from './protected-route'
import { createQueryClient } from './query-client'

export interface AppRoute {
  path: string
  element: React.ReactNode
  protected?: boolean
  allowedUserType?: 'client' | 'employee'
}

export interface AppRouterProps {
  routes: AppRoute[]
  loginPage: React.ReactNode
  notFoundPage: React.ReactNode
  appBarComponent?: React.ReactNode
  queryClient?: ReturnType<typeof createQueryClient>
}

export const AppRouter: React.FC<AppRouterProps> = ({
  routes,
  loginPage,
  notFoundPage,
  appBarComponent,
  queryClient = createQueryClient(),
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated() ? <Navigate to="/" replace /> : loginPage
              }
            />
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  route.protected ? (
                    <ProtectedRoute
                      allowedUserType={route.allowedUserType}
                      appBarComponent={appBarComponent}
                    >
                      {route.element}
                    </ProtectedRoute>
                  ) : (
                    route.element
                  )
                }
              />
            ))}
            <Route
              path="*"
              element={
                <ProtectedRoute appBarComponent={appBarComponent}>
                  {notFoundPage}
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

