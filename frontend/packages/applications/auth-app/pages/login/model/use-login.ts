import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { login, refreshToken } from '@shared/api/endpoints/auth'
import type { LoginResponse } from '@shared/api/endpoints/auth'
import { tokenStorage } from '@shared/utils'

const CLIENT_APP_URL = 'http://localhost:5174'
const EMPLOYEE_APP_URL = 'http://localhost:5173'

const ALLOWED_REDIRECT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
]

const isValidRedirectUri = (uri: string): boolean => {
  try {
    const url = new URL(uri)
    return ALLOWED_REDIRECT_ORIGINS.some(origin => url.origin === origin)
  } catch {
    return false
  }
}

const getAuthParams = () => {
  const params = new URLSearchParams(window.location.search)
  const rawRedirectUri = params.get('redirect_uri') || ''
  return {
    redirectUri: isValidRedirectUri(rawRedirectUri) ? rawRedirectUri : '',
    isWebView: params.get('iswebview') === 'true',
  }
}

const getErrorMessage = (error: Error | null): string | null => {
  if (!error) return null
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>
    if (typeof data.error === 'string') return data.error
  }
  return error.message || 'Ошибка авторизации'
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

const sendTokensViaPostMessage = (tokenData: TokenData) => {
  const message = { type: 'auth_success', payload: tokenData }

  if (window.parent !== window) {
    window.parent.postMessage(message, '*')
  } else {
    window.postMessage(message, '*')
  }

  const rnWebView = (window as unknown as { ReactNativeWebView?: { postMessage: (msg: string) => void } }).ReactNativeWebView
  if (rnWebView) {
    rnWebView.postMessage(JSON.stringify(message))
  }
}

const isEmployeeAppUri = (uri: string): boolean => {
  try {
    return new URL(uri).origin === EMPLOYEE_APP_URL
  } catch {
    return false
  }
}

const resolveRedirectUri = (redirectUri: string, userType: string): string => {
  if (userType === 'client' && isEmployeeAppUri(redirectUri)) {
    return CLIENT_APP_URL
  }
  return redirectUri
}

const deliverTokens = (
  redirectUri: string,
  isWebView: boolean,
  tokenData: TokenData,
  onComplete: () => void,
) => {
  if (isWebView) {
    sendTokensViaPostMessage(tokenData)
    onComplete()
    return
  }

  if (redirectUri) {
    window.location.href = resolveRedirectUri(redirectUri, tokenData.user_type)
    return
  }

  if (tokenData.user_type === 'client') {
    window.location.href = CLIENT_APP_URL
    return
  }

  onComplete()
}

const useAuthLogin = () => {
  const { redirectUri, isWebView } = getAuthParams()
  const [authComplete, setAuthComplete] = useState(false)
  const [userType, setUserType] = useState<'client' | 'employee' | null>(null)
  const hasStoredSession = !!tokenStorage.getRefreshToken()
  const [checkingSession, setCheckingSession] = useState(hasStoredSession)
  const autoLoginAttempted = useRef(false)

  useEffect(() => {
    if (autoLoginAttempted.current) return
    autoLoginAttempted.current = true

    const storedRefreshToken = tokenStorage.getRefreshToken()
    if (!storedRefreshToken) {
      setCheckingSession(false)
      return
    }

    const tryAutoLogin = async () => {
      try {
        const refreshed = await refreshToken({ refresh_token: storedRefreshToken })
        storeSession(refreshed)
        const tokenData = toTokenData(refreshed)
        deliverTokens(redirectUri, isWebView, tokenData, () => {
          setUserType(refreshed.type)
          setAuthComplete(true)
          setCheckingSession(false)
        })
      } catch {
        tokenStorage.clear()
        setCheckingSession(false)
      }
    }

    tryAutoLogin()
  }, [redirectUri, isWebView])

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      storeSession(data)
      deliverTokens(redirectUri, isWebView, toTokenData(data), () => {
        setUserType(data.type)
        setAuthComplete(true)
      })
    },
  })

  return { mutation, isWebView, authComplete, checkingSession, userType }
}

export const useLoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailValid, setEmailValid] = useState(false)
  const { mutation, isWebView, authComplete, checkingSession, userType } = useAuthLogin()

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }, [])

  const handleEmailValidationChange = useCallback((valid: boolean) => {
    setEmailValid(valid)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (emailValid && password) {
      mutation.mutate({ email, password })
    }
  }, [emailValid, password, email, mutation])

  const goToClientApp = useCallback(() => {
    window.location.href = CLIENT_APP_URL
  }, [])

  const goToEmployeeApp = useCallback(() => {
    window.location.href = EMPLOYEE_APP_URL
  }, [])

  return {
    email,
    password,
    isWebView,
    authComplete,
    checkingSession,
    userType,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: getErrorMessage(mutation.error),
    isSubmitDisabled: !emailValid || !password || mutation.isPending,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange,
    handleEmailValidationChange,
    goToClientApp,
    goToEmployeeApp,
  }
}
