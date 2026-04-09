import { redirectToSso } from '@shared/utils'
import { useSsoCallbackPage } from '@shared/features/auth'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'

const CLIENT_APP_URL = 'http://localhost:5174'

const WRONG_TYPE_MESSAGE =
  'Вы вошли как сотрудник. Для доступа к клиентскому приложению необходимо войти с учётной записью клиента.'

export const CallbackPage = () => {
  const { error } = useSsoCallbackPage({
    expectedUserType: 'client',
    defaultDestination: CLIENT_APP_URL,
    wrongUserTypeMessage: WRONG_TYPE_MESSAGE,
  })

  if (error) {
    return (
      <ErrorFallback
        title="Ошибка авторизации"
        message={error}
        onRetry={() => redirectToSso()}
        onGoBack={() => {
          window.location.href = CLIENT_APP_URL
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
