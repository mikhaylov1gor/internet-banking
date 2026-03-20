export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  const isMobileWidth = window.innerWidth <= 768

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  )

  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return isMobileWidth || (isMobileUA && hasTouchScreen)
}

