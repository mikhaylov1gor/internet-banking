import { useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type UseEmailInputParams = {
  value?: string | ReadonlyArray<string> | number | undefined
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onValidationChange?: (isValid: boolean) => void
  externalError?: string
}

export const useEmailInput = ({
  value,
  onChange,
  onValidationChange,
  externalError,
}: UseEmailInputParams) => {
  const [localError, setLocalError] = useState('')
  const [isTouched, setIsTouched] = useState(false)

  const validateEmail = useCallback((email: string): boolean => {
    if (!email) {
      setLocalError('Email обязателен')
      return false
    }
    if (!emailRegex.test(email)) {
      setLocalError('Неверный формат email')
      return false
    }
    setLocalError('')
    return true
  }, [])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const email = e.target.value
      onChange?.(e)
      if (isTouched && localError) {
        setLocalError('')
        if (onValidationChange) {
          const isValid = email ? validateEmail(email) : false
          onValidationChange(isValid)
        }
      }
    },
    [isTouched, localError, onChange, onValidationChange, validateEmail]
  )

  const handleBlur = useCallback(() => {
    setIsTouched(true)
    const isValid = validateEmail(String(value ?? ''))
    onValidationChange?.(isValid)
  }, [value, validateEmail, onValidationChange])

  const displayError = externalError || localError

  return {
    displayError,
    handleChange,
    handleBlur,
    hasError: Boolean(displayError),
  }
}
