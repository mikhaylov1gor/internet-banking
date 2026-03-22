import type { ReactNode } from 'react'
import './style.css'

export type InlineAlertProps = {
  children: ReactNode
  tone?: 'emphasized' | 'plain'
  role?: 'alert' | 'status'
  className?: string
}

export const InlineAlert = ({
  children,
  tone = 'emphasized',
  role = 'alert',
  className = '',
}: InlineAlertProps) => {
  const toneClass = tone === 'plain' ? 'inline-alert--plain' : 'inline-alert--emphasized'
  return (
    <div className={`inline-alert ${toneClass} ${className}`.trim()} role={role}>
      {children}
    </div>
  )
}
