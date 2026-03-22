import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '@shared/features/auth'
import { inlineHandledMutationMeta } from '@shared/features/app/model/inline-handled-mutation-meta'
import type { LoginRequest, LoginResponse } from '@shared/features/auth'

export const useLoginPage = () => {
  const authenticated = isAuthenticated()

  return {
    authenticated,
  }
}

export const useEmployeeLogin = (loginFn: (data: LoginRequest) => Promise<LoginResponse>) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: async (data: LoginRequest) => {
      const response = await loginFn(data)
      if (response.type !== 'employee') {
        throw new Error('Нет доступа. Это приложение предназначено только для сотрудников.')
      }
      return response
    },
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('user_type', data.type)
      queryClient.setQueryData(['user'], data)
      navigate('/')
    },
  })
}


