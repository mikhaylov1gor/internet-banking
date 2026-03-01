import React, { useState } from 'react'
import './style.css'

export type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  onValidationChange?: (isValid: boolean) => void
}

const phoneRegex = /^\+?[1-9]\d{1,14}$/

const formatPhone = (value: string): string => {
  let cleaned = value.replace(/[^\d+]/g, '')
  
  if (cleaned.startsWith('+8')) {
    cleaned = '+7' + cleaned.slice(2)
  }
  
  if (cleaned.startsWith('8')) {
    cleaned = '+7' + cleaned.slice(1)
  }
  
  if (!cleaned.startsWith('+7') && cleaned.length > 0) {
    const digits = cleaned.replace(/\+/g, '')
    if (digits.length > 0) {
      cleaned = `+7${digits.slice(0, 10)}`
    }
  }
  
  if (cleaned.startsWith('+7')) {
    const digits = cleaned.slice(2).replace(/\D/g, '')
    if (digits.length === 0) return '+7'
    if (digits.length <= 3) return `+7 (${digits}`
    if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`
    if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    if (digits.length <= 10) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
  }
  
  return cleaned
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
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

  const validatePhone = (phone: string): boolean => {
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
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formatted = formatPhone(inputValue)
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: formatted,
      },
    } as React.ChangeEvent<HTMLInputElement>
    
    if (onChange) {
      onChange(syntheticEvent)
    }
    if (isTouched) {
      const isValid = validatePhone(formatted)
      if (onValidationChange) {
        onValidationChange(isValid)
      }
    }
  }

  const handleBlur = () => {
    setIsTouched(true)
    if (value) {
      const isValid = validatePhone(value as string)
      if (onValidationChange) {
        onValidationChange(isValid)
      }
    }
  }

  const displayError = error || localError

  return (
    <div className="phone-input-container">
      {label && <label className="phone-input-label">{label}</label>}
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="+7 (999) 123-45-67"
        className={`phone-input ${displayError ? 'phone-input-error' : ''} ${className || ''}`}
        {...props}
      />
      {displayError && <span className="phone-input-error-text">{displayError}</span>}
    </div>
  )
}

