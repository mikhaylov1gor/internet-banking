import { redirectToSso } from '@shared/utils'
import { useSsoCallbackPage } from '@shared/features/auth'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'

const EMPLOYEE_APP_URL = 'http://localhost:5173'

const WRONG_TYPE_MESSAGE =
  'Вы вошли как клиент. Для доступа к приложению сотрудника необходимо войти с учётной записью сотрудника.'

export const CallbackPage = () => {
  const { error } = useSsoCallbackPage({
    expectedUserType: 'employee',
    defaultDestination: EMPLOYEE_APP_URL,
    wrongUserTypeMessage: WRONG_TYPE_MESSAGE,
  })

  if (error) {
    return (
      <ErrorFallback
        title="Ошибка авторизации"
        message={error}
        onRetry={() => redirectToSso()}
        onGoBack={() => {
          window.location.href = EMPLOYEE_APP_URL
        }}
        goBackLabel="На главную"
      />
    )
  }

  return (
    <div className="callback-page">
      <Spinner size="large" />
    </div>
  )
}
