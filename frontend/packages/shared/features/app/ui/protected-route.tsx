import { isAuthenticated, getUserType } from '../../auth'
import { redirectToSso } from '@shared/utils'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { AppBarWithNavigation } from './app-bar-with-navigation'
import { USER_HOME_URL } from '../model/user-home-urls'
import type { ProtectedRouteProps } from '../model/types'

export const ProtectedRoute = ({
  children,
  allowedUserType,
  appBarComponent,
}: ProtectedRouteProps) => {
  if (!isAuthenticated()) {
    redirectToSso()
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
          onGoBack={() => {
            window.location.href = homeUrl
          }}
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
