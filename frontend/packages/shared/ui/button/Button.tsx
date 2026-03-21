import React from 'react'
import './style.css'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`button button-${variant} button-${size} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
}
