import type { ReactNode } from 'react'
import { useModalBodyScrollLock } from '../model/use-modal-body-scroll'
import '../style.css'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  showCloseButton?: boolean
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}: ModalProps) => {
  useModalBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {showCloseButton && (
              <button type="button" className="modal-close-button" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}
