import { AxiosError } from 'axios'
import { z } from 'zod'
import { parseApiResponse } from '../../parse-response'
import { jsonPublicClient } from '../../http/http-client'
import {
  SSOTokenRequestSchema,
  SSOTokenResponseSchema,
  SSOLoginRequestSchema,
  SSOLoginResponseSchema,
  type SSOTokenRequest,
  type SSOTokenResponse,
  type SSOLoginRequest,
  type SSOLoginResponse,
} from './types'

const SsoErrorBodySchema = z.object({ error: z.string().optional() })

export const exchangeCodeForTokens = async (data: SSOTokenRequest): Promise<SSOTokenResponse> => {
  SSOTokenRequestSchema.parse(data)
  const { data: body } = await jsonPublicClient.post('/sso/token', data)
  return parseApiResponse(SSOTokenResponseSchema, body)
}

export const ssoLoginWithPassword = async (data: SSOLoginRequest): Promise<SSOLoginResponse> => {
  SSOLoginRequestSchema.parse(data)
  try {
    const { data: body } = await jsonPublicClient.post('/sso/login', data)
    return parseApiResponse(SSOLoginResponseSchema, body)
  } catch (e: unknown) {
    if (e instanceof AxiosError && e.response?.data !== undefined) {
      const parsed = SsoErrorBodySchema.safeParse(e.response.data)
      if (parsed.success && parsed.data.error) {
        throw new Error(parsed.data.error)
      }
    }
    throw e instanceof Error ? e : new Error('Неверный email или пароль')
  }
}
