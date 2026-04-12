import { AxiosError, isAxiosError } from 'axios'
import { z } from 'zod'
import { circuitBreakerIsOpen } from './http/circuit-breaker'

export const CIRCUIT_BREAKER_USER_MESSAGE = 'Сервис временно недоступен. Подождите немного.'

export class CircuitBreakerOpenError extends Error {
  constructor() {
    super(CIRCUIT_BREAKER_USER_MESSAGE)
    this.name = 'CircuitBreakerOpenError'
  }
}

const ApiErrorBodySchema = z
  .object({
    error: z.string().optional(),
  })
  .passthrough()

const readApiErrorFromBody = (data: unknown): string | undefined => {
  const parsed = ApiErrorBodySchema.safeParse(data)
  if (!parsed.success) return undefined
  const msg = parsed.data.error
  return typeof msg === 'string' && msg.trim() !== '' ? msg : undefined
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Произошла ошибка. Попробуйте позже.'
): string => {
  if (error instanceof CircuitBreakerOpenError) {
    return CIRCUIT_BREAKER_USER_MESSAGE
  }
  if (error instanceof AxiosError) {
    const fromBody = error.response?.data !== undefined ? readApiErrorFromBody(error.response.data) : undefined
    if (fromBody) {
      return fromBody
    }
    if (error.response) {
      return fallback
    }
    return fallback
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export const getLoadDataErrorMessage = (what: string, cause?: unknown): string => {
  const fallback = `Не удалось получить ${what}. Попробуйте позже.`
  if (cause !== undefined) {
    return getApiErrorMessage(cause, fallback)
  }
  if (circuitBreakerIsOpen()) {
    return CIRCUIT_BREAKER_USER_MESSAGE
  }
  return fallback
}

export const getHttpStatus = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined

export const isNotFoundError = (error: unknown): boolean => getHttpStatus(error) === 404

export const isForbiddenError = (error: unknown): boolean => getHttpStatus(error) === 403

export const isUnauthorizedError = (error: unknown): boolean => getHttpStatus(error) === 401

export const formatUserCreateErrorMessage = (error: unknown): string => {
  const msg = getApiErrorMessage(error, 'Ошибка создания пользователя. Попробуйте позже.')
  const lower = msg.toLowerCase()
  if (msg === 'email already exists' || lower.includes('email already exists')) {
    return 'Email уже занят'
  }
  return msg
}

export const ISSUE_CREDIT_AMOUNT_UNAVAILABLE_MESSAGE =
  'Сейчас не можем выдать кредит на такую сумму.'

export const getIssueCreditErrorMessage = (error: unknown): string => {
  const raw = getApiErrorMessage(error, ISSUE_CREDIT_AMOUNT_UNAVAILABLE_MESSAGE)
  const lower = raw.toLowerCase()
  if (
    lower.includes('недостаточно средств') ||
    lower.includes('insufficient funds')
  ) {
    return ISSUE_CREDIT_AMOUNT_UNAVAILABLE_MESSAGE
  }
  return raw
}
