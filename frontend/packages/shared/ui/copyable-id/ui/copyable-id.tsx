import type { ReactNode } from 'react'
import { useCopyableId } from '../model/use-copyable-id'
import '../style.css'

export type CopyableIdProps = {
  copyText: string
  toastOk: string
  toastFail?: string
  title?: string
  className?: string
  stopPropagation?: boolean
  children: ReactNode
}

export const CopyableId = ({
  copyText,
  toastOk,
  toastFail = 'Не удалось скопировать',
  title = 'Скопировать полный номер',
  className = '',
  stopPropagation = false,
  children,
}: CopyableIdProps) => {
  const { runCopy } = useCopyableId({ copyText, toastOk, toastFail, stopPropagation })

  return (
    <span
      role="button"
      tabIndex={0}
      className={`copyable-id ${className}`.trim()}
      style={{ cursor: 'pointer' }}
      title={title}
      onClick={(e) => void runCopy(e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (stopPropagation) {
            e.stopPropagation()
          }
          void runCopy(e)
        }
      }}
    >
      {children}
    </span>
  )
}
