import { useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import { formatPhone } from './format-phone'

type UsePhoneInputParams = {
  value?: string | ReadonlyArray<string> | number | undefined
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onValidationChange?: (isValid: boolean) => void
  externalError?: string
}

export const usePhoneInput = ({
  value,
  onChange,
  onValidationChange,
  externalError,
}: UsePhoneInputParams) => {
  const [localError, setLocalError] = useState('')
  const [isTouched, setIsTouched] = useState(false)

  const validatePhone = useCallback((phone: string): boolean => {
    if (!phone || phone.trim() === '') {
      setLocalError('')
      return true
    }
    const cleaned = phone.replace(/\s|-|\(|\)/g, '')
    const exactFormat = /^\+7\d{10}$/
    if (!exactFormat.test(cleaned)) {
      setLocalError('Неверный формат телефона. Используйте формат: +7 (999) 999-99-99')
      return false
    }
    setLocalError('')
    return true
  }, [])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const formatted = formatPhone(inputValue)

      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      } as ChangeEvent<HTMLInputElement>

      onChange?.(syntheticEvent)
      if (isTouched) {
        const isValid = validatePhone(formatted)
        onValidationChange?.(isValid)
      }
    },
    [isTouched, onChange, onValidationChange, validatePhone]
  )

  const handleBlur = useCallback(() => {
    setIsTouched(true)
    if (value) {
      const isValid = validatePhone(String(value))
      onValidationChange?.(isValid)
    }
  }, [value, validatePhone, onValidationChange])

  const displayError = externalError || localError

  return {
    displayError,
    handleChange,
    handleBlur,
    hasError: Boolean(displayError),
  }
}
