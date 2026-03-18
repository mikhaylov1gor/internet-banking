const AUTH_APP_URL = 'http://localhost:5175'

export const redirectToAuth = () => {
  const redirectUri = encodeURIComponent(window.location.href)
  window.location.href = `${AUTH_APP_URL}/?redirect_uri=${redirectUri}`
}
