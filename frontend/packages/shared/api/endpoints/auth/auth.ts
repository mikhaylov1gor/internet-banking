import axios from 'axios'
import type { LoginRequest, LoginResponse, RefreshTokenRequest } from './types'

const API_BASE_URL = process.env.NODE_ENV === 'development' ? '/api' : (process.env.API_BASE_URL || 'http://localhost:8080')

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/login', data)
  return response.data
}

export const refreshToken = async (data: RefreshTokenRequest): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/refresh', data)
  return response.data
}
