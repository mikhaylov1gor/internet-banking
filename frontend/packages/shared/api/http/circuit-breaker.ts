const WINDOW_SIZE = 30
const MIN_SAMPLES = 8
const ERROR_RATE_THRESHOLD = 0.7
const COOLDOWN_MS = 30_000

type SlidingCircuitBreakerState = {
  outcomes: boolean[]
  openUntil: number
}

const state: SlidingCircuitBreakerState = {
  outcomes: [],
  openUntil: 0,
}

export const isCircuitExcludedPath = (url: string): boolean => {
  if (!url) return false
  return (
    url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/monitoring/client-logs')
  )
}

export const circuitBreakerIsOpen = (): boolean => Date.now() < state.openUntil

export const circuitBreakerRecord = (success: boolean, url: string): void => {
  if (isCircuitExcludedPath(url)) return
  const now = Date.now()
  if (now < state.openUntil) return
  state.outcomes.push(success)
  if (state.outcomes.length > WINDOW_SIZE) {
    state.outcomes.shift()
  }
  if (state.outcomes.length < MIN_SAMPLES) return
  const failures = state.outcomes.filter((x) => !x).length
  if (failures / state.outcomes.length > ERROR_RATE_THRESHOLD) {
    state.openUntil = now + COOLDOWN_MS
    state.outcomes = []
  }
}
