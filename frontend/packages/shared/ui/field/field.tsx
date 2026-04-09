import type { ReactNode } from 'react'
import './style.css'

export type FieldProps = {
  label?: string
  error?: string
  htmlFor?: string
  className?: string
  children: ReactNode
}

export const Field = ({ label, error, htmlFor, className = '', children }: FieldProps) => {
  return (
    <div className={`field ${className}`.trim()}>
      {label !== undefined && label !== '' && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}
