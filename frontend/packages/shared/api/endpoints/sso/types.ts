import { z } from 'zod'

export const SSOTokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  client_id: z.string(),
  redirect_uri: z.string(),
  code_verifier: z.string(),
})
export type SSOTokenRequest = z.infer<typeof SSOTokenRequestSchema>

export const SSOTokenResponseSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  user_id: z.string(),
  type: z.enum(['client', 'employee']),
})
export type SSOTokenResponse = z.infer<typeof SSOTokenResponseSchema>

export const SSOLoginRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
  response_type: z.string(),
  client_id: z.string(),
  redirect_uri: z.string(),
  state: z.string(),
  code_challenge: z.string(),
  code_challenge_method: z.string(),
})
export type SSOLoginRequest = z.infer<typeof SSOLoginRequestSchema>

export const SSOLoginResponseSchema = z.object({
  redirect: z.string().optional(),
})
export type SSOLoginResponse = z.infer<typeof SSOLoginResponseSchema>
