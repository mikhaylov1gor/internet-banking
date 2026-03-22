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

const formBody = (entries: Record<string, string>): string => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(entries)) {
    p.set(k, v)
  }
  return p.toString()
}

const formUrlEncodedHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' }

export const exchangeCodeForTokens = async (data: SSOTokenRequest): Promise<SSOTokenResponse> => {
  SSOTokenRequestSchema.parse(data)
  const { data: body } = await jsonPublicClient.post(
    '/sso/token',
    formBody({
      grant_type: data.grant_type,
      code: data.code,
      client_id: data.client_id,
      redirect_uri: data.redirect_uri,
      code_verifier: data.code_verifier,
    }),
    { headers: formUrlEncodedHeaders }
  )
  return parseApiResponse(SSOTokenResponseSchema, body)
}

export const ssoLoginWithPassword = async (data: SSOLoginRequest): Promise<SSOLoginResponse> => {
  SSOLoginRequestSchema.parse(data)
  try {
    const { data: body } = await jsonPublicClient.post(
      '/sso/login',
      formBody({
        email: data.email,
        password: data.password,
        response_type: data.response_type,
        client_id: data.client_id,
        redirect_uri: data.redirect_uri,
        state: data.state,
        code_challenge: data.code_challenge,
        code_challenge_method: data.code_challenge_method,
      }),
      { headers: formUrlEncodedHeaders }
    )
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
