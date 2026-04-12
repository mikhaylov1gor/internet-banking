import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { redirectToSso, tokenStorage } from '@shared/utils'
import { inlineHandledMutationMeta } from '../../app/model/inline-handled-mutation-meta'
import type { LoginRequest, LoginResponse } from '@shared/api/endpoints/auth'

export type { LoginRequest, LoginResponse } from '@shared/api/endpoints/auth'

export const useLogin = (loginFn: (data: LoginRequest) => Promise<LoginResponse>) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: loginFn,
    onSuccess: (data) => {
      tokenStorage.setTokens({
        accessToken: data.token,
        refreshToken: data.refresh_token,
        userId: data.user_id,
        userType: data.type,
      })
      queryClient.setQueryData(['user'], data)
      navigate('/')
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return () => {
    tokenStorage.clear()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('push_registered')
    }
    queryClient.clear()
    redirectToSso()
  }
}

export const isAuthenticated = (): boolean => {
  return !!tokenStorage.getAccessToken()
}

export const getUserType = (): 'client' | 'employee' | null => {
  return tokenStorage.getUserType()
}

export const getCurrentUserId = (): string | null => {
  return tokenStorage.getUserId()
}
