import './style.css'

export type SpinnerProps = {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export const Spinner = ({ size = 'medium', className }: SpinnerProps) => {
  return (
    <div className={`spinner ${size} ${className || ''}`}>
      <div className="circle"></div>
    </div>
  )
}

