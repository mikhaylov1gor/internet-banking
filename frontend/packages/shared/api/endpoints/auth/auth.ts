import { parseApiResponse } from '../../parse-response'
import { jsonPublicClient } from '../../http/http-client'
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshTokenRequestSchema,
  type LoginRequest,
  type LoginResponse,
  type RefreshTokenRequest,
} from './types'

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  LoginRequestSchema.parse(data)
  const { data: body } = await jsonPublicClient.post('/auth/login', data)
  return parseApiResponse(LoginResponseSchema, body)
}

export const refreshToken = async (data: RefreshTokenRequest): Promise<LoginResponse> => {
  RefreshTokenRequestSchema.parse(data)
  const { data: body } = await jsonPublicClient.post('/auth/refresh', data)
  return parseApiResponse(LoginResponseSchema, body)
}
