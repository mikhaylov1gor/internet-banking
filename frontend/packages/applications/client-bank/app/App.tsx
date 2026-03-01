import React from 'react'
import { MobileLoginPage, DesktopLoginPage } from '../pages/login'
import { MobileHomePage, DesktopHomePage } from '../pages/home'
import { MobileAccountsPage, DesktopAccountsPage } from '../pages/accounts'
import { AccountDetailPage } from '../pages/account-detail'
import { CreditsPage } from '../pages/credits'
import { CreditDetailPage } from '../pages/credit-detail'
import { 
  AppRouter, 
  AppRoute, 
  AppBarWithNavigation,
  NotFoundPage,
  createQueryClient 
} from '@shared/features/app'
import './style.css'

const queryClient = createQueryClient()

const navigationButtons = [
  { name: 'Счета', path: '/accounts' },
  { name: 'Кредиты', path: '/credits' },
]

const appBarComponent = <AppBarWithNavigation buttons={navigationButtons} />

const createRoutes = (isMobile: boolean): AppRoute[] => [
  {
    path: '/',
    element: isMobile ? <MobileHomePage /> : <DesktopHomePage />,
    protected: true,
    allowedUserType: 'client',
  },
  {
    path: '/accounts',
    element: isMobile ? <MobileAccountsPage /> : <DesktopAccountsPage />,
    protected: true,
    allowedUserType: 'client',
  },
  {
    path: '/accounts/:accountId',
    element: <AccountDetailPage />,
    protected: true,
    allowedUserType: 'client',
  },
  {
    path: '/credits',
    element: <CreditsPage />,
    protected: true,
    allowedUserType: 'client',
  },
  {
    path: '/credits/:creditId',
    element: <CreditDetailPage />,
    protected: true,
    allowedUserType: 'client',
  },
]

export const MobileApp: React.FC = () => {
  return (
    <AppRouter
      routes={createRoutes(true)}
      loginPage={<MobileLoginPage />}
      notFoundPage={<NotFoundPage />}
      appBarComponent={appBarComponent}
      queryClient={queryClient}
    />
  )
}

export const DesktopApp: React.FC = () => {
  return (
    <AppRouter
      routes={createRoutes(false)}
      loginPage={<DesktopLoginPage />}
      notFoundPage={<NotFoundPage />}
      appBarComponent={appBarComponent}
      queryClient={queryClient}
    />
  )
}

