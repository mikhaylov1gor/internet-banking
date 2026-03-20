import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './protected-route'
import { createQueryClient } from './query-client'

export interface AppRoute {
  path: string
  element: React.ReactNode
  protected?: boolean
  allowedUserType?: 'client' | 'employee'
}

export interface AppRouterProps {
  routes: AppRoute[]
  notFoundPage: React.ReactNode
  appBarComponent?: React.ReactNode
  allowedUserType?: 'client' | 'employee'
  queryClient?: ReturnType<typeof createQueryClient>
}

export const AppRouter: React.FC<AppRouterProps> = ({
  routes,
  notFoundPage,
  appBarComponent,
  allowedUserType,
  queryClient = createQueryClient(),
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app">
          <Routes>
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
                <ProtectedRoute
                  allowedUserType={allowedUserType}
                  appBarComponent={appBarComponent}
                >
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
