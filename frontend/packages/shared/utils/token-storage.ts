const COOKIE_EXPIRY_DAYS = 7

const setCookie = (name: string, value: string) => {
  const expires = new Date(Date.now() + COOKIE_EXPIRY_DAYS * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const removeCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

export const tokenStorage = {
  getAccessToken: (): string | null => getCookie('access_token'),
  getRefreshToken: (): string | null => getCookie('refresh_token'),
  getUserId: (): string | null => getCookie('user_id'),
  getUserType: (): 'client' | 'employee' | null => {
    const type = getCookie('user_type')
    return (type === 'client' || type === 'employee') ? type : null
  },

  setTokens: (data: {
    accessToken: string
    refreshToken: string
    userId: string
    userType: string
  }) => {
    setCookie('access_token', data.accessToken)
    setCookie('refresh_token', data.refreshToken)
    setCookie('user_id', data.userId)
    setCookie('user_type', data.userType)
  },

  clear: () => {
    removeCookie('access_token')
    removeCookie('refresh_token')
    removeCookie('user_id')
    removeCookie('user_type')
  },
}
