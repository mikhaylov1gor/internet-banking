import React from 'react'
import { MobileLoginPage, DesktopLoginPage } from '../pages/login'
import { MobileHomePage, DesktopHomePage } from '../pages/home'
import { MobileAccountsPage, DesktopAccountsPage } from '../pages/accounts'
import { AccountDetailPage } from '../pages/account-detail'
import { MobileTariffsPage, DesktopTariffsPage } from '../pages/tariffs'
import { MobileUsersPage, DesktopUsersPage } from '../pages/users'
import { UserDetailPage } from '../pages/user-detail'
import { MobileCreditsPage, DesktopCreditsPage } from '../pages/credits'
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
  { name: 'Тарифы', path: '/tariffs' },
  { name: 'Пользователи', path: '/users' },
]

const appBarComponent = <AppBarWithNavigation buttons={navigationButtons} />

const createRoutes = (isMobile: boolean): AppRoute[] => [
  {
    path: '/',
    element: isMobile ? <MobileHomePage /> : <DesktopHomePage />,
    protected: true,
    allowedUserType: 'employee',
  },
  {
    path: '/accounts',
    element: isMobile ? <MobileAccountsPage /> : <DesktopAccountsPage />,
    protected: true,
    allowedUserType: 'employee',
  },
  {
    path: '/accounts/:accountId',
    element: <AccountDetailPage />,
    protected: true,
    allowedUserType: 'employee',
  },
  {
    path: '/tariffs',
    element: isMobile ? <MobileTariffsPage /> : <DesktopTariffsPage />,
    protected: true,
    allowedUserType: 'employee',
  },
  {
    path: '/users',
    element: isMobile ? <MobileUsersPage /> : <DesktopUsersPage />,
    protected: true,
    allowedUserType: 'employee',
  },
  {
    path: '/users/:userId',
    element: <UserDetailPage />,
    protected: true,
    allowedUserType: 'employee',
  },
  {
    path: '/credits',
    element: isMobile ? <MobileCreditsPage /> : <DesktopCreditsPage />,
    protected: true,
    allowedUserType: 'employee',
  },
  {
    path: '/credits/:creditId',
    element: <CreditDetailPage />,
    protected: true,
    allowedUserType: 'employee',
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


