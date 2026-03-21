import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppErrorBoundary } from './app-error-boundary'
import { ProtectedRoute } from './protected-route'
import { createQueryClient } from '../model/query-client'
import type { AppRouterProps } from '../model/types'

export const AppRouter = ({
  routes,
  notFoundPage,
  appBarComponent,
  allowedUserType,
  queryClient = createQueryClient(),
  insideBrowserRouter,
}: AppRouterProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppErrorBoundary>
          {insideBrowserRouter}
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
        </AppErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
