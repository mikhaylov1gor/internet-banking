import { useEffect, useRef, useState } from 'react'
import { exchangeCodeForTokens, type SSOTokenResponse } from '@shared/api'
import { tokenStorage, loadSsoState, clearSsoState } from '@shared/utils'
type UseSsoCallbackPageOptions = {
  expectedUserType: 'client' | 'employee'
  defaultDestination: string
  wrongUserTypeMessage: string
}

export const useSsoCallbackPage = ({
  expectedUserType,
  defaultDestination,
  wrongUserTypeMessage,
}: UseSsoCallbackPageOptions) => {
  const [error, setError] = useState<string | null>(null)
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const returnedState = params.get('state')

    if (!code) {
      setError('Авторизационный код не получен')
      return
    }

    const ssoState = loadSsoState()

    if (!ssoState) {
      setError('Сессия авторизации не найдена')
      return
    }

    if (ssoState.state && returnedState !== ssoState.state) {
      setError('Ошибка проверки состояния (CSRF)')
      return
    }

    exchangeCodeForTokens({
      grant_type: 'authorization_code',
      code,
      client_id: ssoState.clientId,
      redirect_uri: ssoState.redirectUri,
      code_verifier: ssoState.codeVerifier,
    })
      .then((data: SSOTokenResponse) => {
        if (data.type !== expectedUserType) {
          clearSsoState()
          setError(wrongUserTypeMessage)
          return
        }
        tokenStorage.setTokens({
          accessToken: data.access_token || data.token,
          refreshToken: data.refresh_token,
          userId: data.user_id,
          userType: data.type,
        })
        clearSsoState()
        const destination = ssoState.originalUrl || defaultDestination
        window.location.replace(destination)
      })
      .catch(() => {
        clearSsoState()
        setError('Не удалось выполнить вход. Проверьте данные и попробуйте снова.')
      })
  }, [defaultDestination, expectedUserType, wrongUserTypeMessage])

  return { error }
}
