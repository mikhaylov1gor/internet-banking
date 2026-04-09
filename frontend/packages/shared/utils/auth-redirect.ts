import { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce'

const AUTH_APP_URL = 'http://localhost:5175'

const SSO_STATE_KEY = 'sso_pkce_state'

const CLIENT_ID_BY_PORT: Record<string, string> = {
  '5173': 'employee-app',
  '5174': 'client-app',
}

export type SsoState = {
  codeVerifier: string
  state: string
  originalUrl: string
  clientId: string
  redirectUri: string
}

export const saveSsoState = (state: SsoState): void => {
  sessionStorage.setItem(SSO_STATE_KEY, JSON.stringify(state))
}

export const loadSsoState = (): SsoState | null => {
  const raw = sessionStorage.getItem(SSO_STATE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SsoState
  } catch {
    return null
  }
}

export const clearSsoState = (): void => {
  sessionStorage.removeItem(SSO_STATE_KEY)
}

export const redirectToSso = (): void => {
  const clientId = CLIENT_ID_BY_PORT[window.location.port] ?? 'client-app'
  const redirectUri = `${window.location.origin}/callback`
  const originalUrl = window.location.href

  const codeVerifier = generateCodeVerifier()
  const state = generateState()

  generateCodeChallenge(codeVerifier).then((codeChallenge) => {
    saveSsoState({ codeVerifier, state, originalUrl, clientId, redirectUri })

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    window.location.href = `${AUTH_APP_URL}/?${params.toString()}`
  })
}
