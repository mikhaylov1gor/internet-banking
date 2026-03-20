import React from 'react'
import './style.css'

export type SpinnerProps = {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', className }) => {
  return (
    <div className={`spinner ${size} ${className || ''}`}>
      <div className="circle"></div>
    </div>
  )
}

