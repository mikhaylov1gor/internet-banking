import React, { useState } from 'react'
import './style.css'

export type EmailInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  onValidationChange?: (isValid: boolean) => void
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const EmailInput: React.FC<EmailInputProps> = ({
  label,
  error,
  onValidationChange,
  value,
  onChange,
  className,
  ...props
}) => {
  const [localError, setLocalError] = useState<string>('')
  const [isTouched, setIsTouched] = useState(false)

  const validateEmail = (email: string): boolean => {
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
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    if (onChange) {
      onChange(e)
    }
    if (isTouched && localError) {
      setLocalError('')
      if (onValidationChange) {
        const isValid = email ? validateEmail(email) : false
        onValidationChange(isValid)
      }
    }
  }

  const handleBlur = () => {
    setIsTouched(true)
    const isValid = validateEmail(value as string || '')
    if (onValidationChange) {
      onValidationChange(isValid)
    }
  }

  const displayError = error || localError

  return (
    <div className="email-input-container">
      {label && <label className="email-input-label">{label}</label>}
      <input
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`email-input ${displayError ? 'email-input-error' : ''} ${className || ''}`}
        {...props}
      />
      {displayError && <span className="email-input-error-text">{displayError}</span>}
    </div>
  )
}

