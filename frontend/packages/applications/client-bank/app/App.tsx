import { MobileHomePage, DesktopHomePage } from '../pages/home'
import { MobileAccountsPage, DesktopAccountsPage } from '../pages/accounts'
import { AccountDetailPage } from '../pages/account-detail'
import { CreditsPage } from '../pages/credits'
import { CreditDetailPage } from '../pages/credit-detail'
import { CallbackPage } from '../pages/callback'
import { TransferPage } from '../pages/transfer'
import { 
  AppRouter, 
  AppRoute, 
  AppBarWithNavigation,
  NotFoundPage,
  createQueryClient 
} from '@shared/features/app'
import type { NavigationButton } from '@shared/features/app'
import { getUserType } from '@shared/features/auth'
import './style.css'

const queryClient = createQueryClient()

const EMPLOYEE_APP_URL = 'http://localhost:5173'

const getNavigationButtons = (): NavigationButton[] => {
  const buttons: NavigationButton[] = [
    { name: 'Счета', path: '/accounts' },
    { name: 'Перевод', path: '/transfer' },
    { name: 'Кредиты', path: '/credits' },
  ]
  if (getUserType() === 'employee') {
    buttons.push({ name: 'Приложение сотрудника', path: EMPLOYEE_APP_URL, external: true })
  }
  return buttons
}

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
  },
  {
    path: '/accounts',
    element: isMobile ? <MobileAccountsPage /> : <DesktopAccountsPage />,
    protected: true,
  },
  {
    path: '/accounts/:accountId',
    element: <AccountDetailPage />,
    protected: true,
  },
  {
    path: '/transfer',
    element: <TransferPage />,
    protected: true,
  },
  {
    path: '/credits',
    element: <CreditsPage />,
    protected: true,
  },
  {
    path: '/credits/:creditId',
    element: <CreditDetailPage />,
    protected: true,
  },
]

export const MobileApp = () => {
  const appBarComponent = <AppBarWithNavigation buttons={getNavigationButtons()} />
  return (
    <AppRouter
      routes={createRoutes(true)}
      notFoundPage={<NotFoundPage />}
      appBarComponent={appBarComponent}
      queryClient={queryClient}
    />
  )
}

export const DesktopApp = () => {
  const appBarComponent = <AppBarWithNavigation buttons={getNavigationButtons()} />
  return (
    <AppRouter
      routes={createRoutes(false)}
      notFoundPage={<NotFoundPage />}
      appBarComponent={appBarComponent}
      queryClient={queryClient}
    />
  )
}
