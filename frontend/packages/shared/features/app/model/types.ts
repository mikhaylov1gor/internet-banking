import type { ReactNode } from 'react'
import type { createQueryClient } from './query-client'

export type AppRoute = {
  path: string
  element: ReactNode
  protected?: boolean
  allowedUserType?: 'client' | 'employee'
}

export type AppRouterProps = {
  routes: AppRoute[]
  notFoundPage: ReactNode
  appBarComponent?: ReactNode
  allowedUserType?: 'client' | 'employee'
  queryClient?: ReturnType<typeof createQueryClient>
  insideBrowserRouter?: ReactNode
}

export type ProtectedRouteProps = {
  children: ReactNode
  allowedUserType?: 'client' | 'employee'
  appBarComponent?: ReactNode
}

export type NavigationButton = {
  name: string
  path: string
  external?: boolean
}

export type AppBarWithNavigationProps = {
  buttons: NavigationButton[]
  onLogoClick?: () => void
}
