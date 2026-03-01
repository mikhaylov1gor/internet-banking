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

export type RefreshTokenRequest = {
  refresh_token: string
}

export type RefreshTokenResponse = {
  token: string
  refresh_token: string
}


