import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { redirectToAuth, tokenStorage } from '@shared/utils'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  refresh_token: string
  user_id: string
  type: 'client' | 'employee'
}

export const useLogin = (loginFn: (data: LoginRequest) => Promise<LoginResponse>) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
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
    onError: () => {
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return () => {
    tokenStorage.clear()
    queryClient.clear()
    redirectToAuth()
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
