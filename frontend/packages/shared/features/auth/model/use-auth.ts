import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

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
      localStorage.setItem('access_token', data.token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('user_type', data.type)
      queryClient.setQueryData(['user'], data)
      navigate('/')
    },
    onError: () => {
    },
  })
}

export const useLogout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_type')
    navigate('/login')
    queryClient.clear()
  }
}

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token')
}

export const getUserType = (): 'client' | 'employee' | null => {
  return (localStorage.getItem('user_type') as 'client' | 'employee') || null
}

export const getCurrentUserId = (): string | null => {
  return localStorage.getItem('user_id')
}

