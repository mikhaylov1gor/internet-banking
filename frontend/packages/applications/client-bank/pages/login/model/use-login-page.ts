import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tokenStorage } from '@shared/utils'
import { isAuthenticated } from '@shared/features/auth'
import { inlineHandledMutationMeta } from '@shared/features/app/model/inline-handled-mutation-meta'
import type { LoginRequest, LoginResponse } from '@shared/features/auth'

export const useLoginPage = () => {
  const authenticated = isAuthenticated()

  return {
    authenticated,
  }
}

export const useClientLogin = (loginFn: (data: LoginRequest) => Promise<LoginResponse>) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: async (data: LoginRequest) => {
      const response = await loginFn(data)
      if (response.type !== 'client') {
        throw new Error('Нет доступа. Это приложение предназначено только для клиентов.')
      }
      return response
    },
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

