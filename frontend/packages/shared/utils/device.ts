export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  const isMobileWidth = window.innerWidth <= 768

  const win = window as Window & { opera?: string }
  const userAgent = navigator.userAgent || navigator.vendor || win.opera || ''
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  )

  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return isMobileWidth || (isMobileUA && hasTouchScreen)
}

