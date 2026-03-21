import type { SyntheticEvent } from 'react'
import { copyToClipboard } from '@shared/utils'
import { useToast } from '../../toast'

type UseCopyableIdOptions = {
  copyText: string
  toastOk: string
  toastFail: string
  stopPropagation: boolean
}

export const useCopyableId = ({
  copyText,
  toastOk,
  toastFail,
  stopPropagation,
}: UseCopyableIdOptions) => {
  const { show } = useToast()

  const runCopy = async (e?: SyntheticEvent) => {
    if (stopPropagation && e) {
      e.stopPropagation()
    }
    const ok = await copyToClipboard(copyText)
    show(ok ? toastOk : toastFail)
  }

  return { runCopy }
}
