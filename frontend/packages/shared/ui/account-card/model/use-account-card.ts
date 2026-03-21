import { useState, useEffect } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'

type UseAccountCardOptions = {
  accountId: string
  isHidden: boolean
  onToggleHidden?: (accountId: string) => void
}

export const useAccountCard = ({ accountId, isHidden, onToggleHidden }: UseAccountCardOptions) => {
  const [sensitiveRevealed, setSensitiveRevealed] = useState(false)

  useEffect(() => {
    if (!isHidden) {
      setSensitiveRevealed(false)
    }
  }, [isHidden])

  const handleToggleHidden = (e: MouseEvent) => {
    e.stopPropagation()
    onToggleHidden?.(accountId)
  }

  const handleSensitiveAreaClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (!isHidden) return
    setSensitiveRevealed((v) => !v)
  }

  const handleSensitiveAreaKeyDown = (e: KeyboardEvent) => {
    if (!isHidden) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      setSensitiveRevealed((v) => !v)
    }
  }

  return {
    sensitiveRevealed,
    handleToggleHidden,
    handleSensitiveAreaClick,
    handleSensitiveAreaKeyDown,
  }
}
