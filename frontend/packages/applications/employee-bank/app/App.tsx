import { MobileHomePage, DesktopHomePage } from '../pages/home'
import { MobileAccountsPage, DesktopAccountsPage } from '../pages/accounts'
import { AccountDetailPage } from '../pages/account-detail'
import { MobileTariffsPage, DesktopTariffsPage } from '../pages/tariffs'
import { MobileUsersPage, DesktopUsersPage } from '../pages/users'
import { UserDetailPage } from '../pages/user-detail'
import { MobileCreditsPage, DesktopCreditsPage } from '../pages/credits'
import { CreditDetailPage } from '../pages/credit-detail'
import { CallbackPage } from '../pages/callback'
import { 
  AppRouter, 
  AppRoute, 
  AppBarWithNavigation,
  NotFoundPage,
  createQueryClient 
} from '@shared/features/app'
import type { NavigationButton } from '@shared/features/app'
import { EmployeeHideAccountsFeatureSync } from '../features/hide-accounts-feature'
import './style.css'

const queryClient = createQueryClient()

const CLIENT_APP_URL = 'http://localhost:5174'

const navigationButtons: NavigationButton[] = [
  { name: 'Счета', path: '/accounts' },
  { name: 'Кредиты', path: '/credits' },
  { name: 'Тарифы', path: '/tariffs' },
  { name: 'Пользователи', path: '/users' },
  { name: 'Мониторинг', path: '/monitoring/dashboard', external: true },
  { name: 'Приложение клиента', path: CLIENT_APP_URL, external: true },
]

const appBarComponent = <AppBarWithNavigation buttons={navigationButtons} />

const createRoutes = (isMobile: boolean): AppRoute[] => [
  {
    path: '/callback',
    element: <CallbackPage />,
    protected: false,
  },
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

export const MobileApp = () => {
  return (
    <AppRouter
      routes={createRoutes(true)}
      notFoundPage={<NotFoundPage />}
      appBarComponent={appBarComponent}
      allowedUserType="employee"
      queryClient={queryClient}
      insideBrowserRouter={<EmployeeHideAccountsFeatureSync />}
    />
  )
}

export const DesktopApp = () => {
  return (
    <AppRouter
      routes={createRoutes(false)}
      notFoundPage={<NotFoundPage />}
      appBarComponent={appBarComponent}
      allowedUserType="employee"
      queryClient={queryClient}
      insideBrowserRouter={<EmployeeHideAccountsFeatureSync />}
    />
  )
}
