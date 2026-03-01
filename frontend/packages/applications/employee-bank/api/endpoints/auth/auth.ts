import { apiClient } from '../../client'
import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from './types'

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data)
  return response.data
}

export const refreshToken = async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', data)
  return response.data
}


