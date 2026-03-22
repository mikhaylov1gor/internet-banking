import { AxiosError, isAxiosError } from 'axios'

type ErrorPayload = {
  error?: string
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Произошла ошибка. Попробуйте позже.'
): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ErrorPayload | undefined
    if (typeof data?.error === 'string' && data.error.trim() !== '') {
      return data.error
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
