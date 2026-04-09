import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getApiErrorMessage } from '@shared/api'
import { login, refreshToken } from '@shared/api/endpoints/auth'
import type { LoginResponse } from '@shared/api/endpoints/auth'
import { ssoLoginWithPassword } from '@shared/api/endpoints/sso'
import { tokenStorage } from '@shared/utils'
import { inlineHandledMutationMeta } from '@shared/features/app/model/inline-handled-mutation-meta'

const CLIENT_APP_URL = 'http://localhost:5174'
const EMPLOYEE_APP_URL = 'http://localhost:5173'

const ALLOWED_REDIRECT_ORIGINS = ['http://localhost:5173', 'http://localhost:5174']

const isValidRedirectUri = (uri: string): boolean => {
  try {
    const url = new URL(uri)
    return ALLOWED_REDIRECT_ORIGINS.some((origin) => url.origin === origin)
  } catch {
    return false
  }
}

export type SsoParams = {
  responseType: string
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
  codeChallengeMethod: string
}

const parseSsoParams = (): SsoParams | null => {
  const p = new URLSearchParams(window.location.search)
  const responseType = p.get('response_type')
  const clientId = p.get('client_id')
  const redirectUri = p.get('redirect_uri')
  const codeChallenge = p.get('code_challenge')
  const codeChallengeMethod = p.get('code_challenge_method')

  if (!responseType || !clientId || !redirectUri || !codeChallenge || !codeChallengeMethod) {
    return null
  }
  if (!isValidRedirectUri(redirectUri)) return null

  return {
    responseType,
    clientId,
    redirectUri,
    state: p.get('state') ?? '',
    codeChallenge,
    codeChallengeMethod,
  }
}

const parseLegacyParams = () => {
  const p = new URLSearchParams(window.location.search)
  const rawRedirectUri = p.get('redirect_uri') ?? ''
  return {
    redirectUri: isValidRedirectUri(rawRedirectUri) ? rawRedirectUri : '',
    isWebView: p.get('iswebview') === 'true',
  }
}

const getErrorMessage = (error: unknown): string | null => {
  if (error == null) return null
  return getApiErrorMessage(error, 'Ошибка авторизации. Попробуйте позже.')
}

type TokenData = {
  access_token: string
  refresh_token: string
  user_id: string
  user_type: string
}

const toTokenData = (response: LoginResponse): TokenData => ({
  access_token: response.token,
  refresh_token: response.refresh_token,
  user_id: response.user_id,
  user_type: response.type,
})

const storeSession = (response: LoginResponse) => {
  tokenStorage.setTokens({
    accessToken: response.token,
    refreshToken: response.refresh_token,
    userId: response.user_id,
    userType: response.type,
  })
}

type WindowWithReactNativeWebView = Window & {
  ReactNativeWebView?: { postMessage: (msg: string) => void }
}

const sendTokensViaPostMessage = (tokenData: TokenData) => {
  const message = { type: 'auth_success', payload: tokenData }
  if (window.parent !== window) {
    window.parent.postMessage(message, '*')
  } else {
    window.postMessage(message, '*')
  }
  const rnWebView = (window as WindowWithReactNativeWebView).ReactNativeWebView
  if (rnWebView) {
    rnWebView.postMessage(JSON.stringify(message))
  }
}

const resolveAppUrl = (userType: string): string =>
  userType === 'employee' ? EMPLOYEE_APP_URL : CLIENT_APP_URL

const useSsoAutoRefresh = (ssoParams: SsoParams) => {
  const [checkingSession, setCheckingSession] = useState(!!tokenStorage.getRefreshToken())
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const storedRefreshToken = tokenStorage.getRefreshToken()
    if (!storedRefreshToken) {
      setCheckingSession(false)
      return
    }

    refreshToken({ refresh_token: storedRefreshToken })
      .then((refreshed) => {
        storeSession(refreshed)
        const appRoot = resolveAppUrl(refreshed.type)
        window.location.href = appRoot
      })
      .catch(() => {
        tokenStorage.clear()
        setCheckingSession(false)
      })
  }, [])

  return { checkingSession, ssoParams }
}

const useLegacyAuth = () => {
  const { redirectUri, isWebView } = parseLegacyParams()
  const [authComplete, setAuthComplete] = useState(false)
  const [userType, setUserType] = useState<'client' | 'employee' | null>(null)
  const [checkingSession, setCheckingSession] = useState(!!tokenStorage.getRefreshToken())
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    const storedRefreshToken = tokenStorage.getRefreshToken()
    if (!storedRefreshToken) {
      setCheckingSession(false)
      return
    }

    refreshToken({ refresh_token: storedRefreshToken })
      .then((refreshed) => {
        storeSession(refreshed)
        const tokenData = toTokenData(refreshed)
        if (isWebView) {
          sendTokensViaPostMessage(tokenData)
          setUserType(refreshed.type)
          setAuthComplete(true)
          setCheckingSession(false)
          return
        }
        if (redirectUri) {
          window.location.href =
            refreshed.type === 'client' && redirectUri.startsWith(EMPLOYEE_APP_URL)
              ? CLIENT_APP_URL
              : redirectUri
          return
        }
        window.location.href = resolveAppUrl(refreshed.type)
      })
      .catch(() => {
        tokenStorage.clear()
        setCheckingSession(false)
      })
  }, [redirectUri, isWebView])

  const mutation = useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: login,
    onSuccess: (data) => {
      storeSession(data)
      const tokenData = toTokenData(data)
      if (isWebView) {
        sendTokensViaPostMessage(tokenData)
        setUserType(data.type)
        setAuthComplete(true)
        return
      }
      if (redirectUri) {
        window.location.href =
          data.type === 'client' && redirectUri.startsWith(EMPLOYEE_APP_URL)
            ? CLIENT_APP_URL
            : redirectUri
        return
      }
      setUserType(data.type)
      setAuthComplete(true)
    },
  })

  return { mutation, isWebView, authComplete, checkingSession, userType }
}

type SsoLoginParams = SsoParams & { email: string; password: string }

const useSsoLogin = () =>
  useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: (params: SsoLoginParams) =>
      ssoLoginWithPassword({
        email: params.email,
        password: params.password,
        response_type: params.responseType,
        client_id: params.clientId,
        redirect_uri: params.redirectUri,
        state: params.state,
        code_challenge: params.codeChallenge,
        code_challenge_method: params.codeChallengeMethod,
      }),
    onSuccess: (data) => {
      if (data.redirect) {
        window.location.replace(data.redirect)
      }
    },
  })

export const useLoginPage = () => {
  const ssoParams = parseSsoParams()
  const isSsoMode = !!ssoParams

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const sso = useSsoAutoRefresh(ssoParams ?? ({} as SsoParams))
  const legacy = useLegacyAuth()
  const ssoMutation = useSsoLogin()

  const checkingSession = isSsoMode ? sso.checkingSession : legacy.checkingSession

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

  const handleEmailValidationChange = useCallback((valid: boolean) => {
    setEmailValid(valid)
  }, [])

  const isSubmitDisabled =
    !emailValid ||
    !password ||
    (isSsoMode ? ssoMutation.isPending : legacy.mutation.isPending)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!emailValid || !password) return
      if (isSsoMode && ssoParams) {
        ssoMutation.mutate({ ...ssoParams, email, password })
      } else {
        legacy.mutation.mutate({ email, password })
      }
    },
    [emailValid, password, email, isSsoMode, ssoParams, ssoMutation, legacy.mutation],
  )

  const goToClientApp = useCallback(() => {
    window.location.href = CLIENT_APP_URL
  }, [])

  const goToEmployeeApp = useCallback(() => {
    window.location.href = EMPLOYEE_APP_URL
  }, [])

  return {
    email,
    password,
    emailValid,
    isSsoMode,
    ssoParams,
    formRef,
    isWebView: isSsoMode ? false : legacy.isWebView,
    authComplete: isSsoMode ? false : legacy.authComplete,
    checkingSession,
    userType: isSsoMode ? null : legacy.userType,
    isPending: isSsoMode ? ssoMutation.isPending : legacy.mutation.isPending,
    isError: isSsoMode ? ssoMutation.isError : legacy.mutation.isError,
    errorMessage: isSsoMode ? getErrorMessage(ssoMutation.error) : getErrorMessage(legacy.mutation.error),
    isSubmitDisabled,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange,
    handleEmailValidationChange,
    goToClientApp,
    goToEmployeeApp,
  }
}
