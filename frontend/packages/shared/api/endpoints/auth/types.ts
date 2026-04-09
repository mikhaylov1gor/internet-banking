import { z } from 'zod'

export const LoginRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const LoginResponseSchema = z.object({
  token: z.string(),
  refresh_token: z.string(),
  user_id: z.string(),
  type: z.enum(['client', 'employee']),
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string(),
})
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>
