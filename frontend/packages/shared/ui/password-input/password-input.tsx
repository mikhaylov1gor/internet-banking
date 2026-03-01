import React, { useState } from 'react'
import './style.css'

export type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="password-input-container">
      {label && <label className="password-input-label">{label}</label>}
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`password-input ${error ? 'password-input-error' : ''} ${className || ''}`}
          {...props}
        />
        <button
          type="button"
          className="password-input-toggle-button"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      {error && <span className="password-input-error-text">{error}</span>}
    </div>
  )
}

