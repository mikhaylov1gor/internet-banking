import {
  digitsOnlyAccountNumber,
  formatAccountNumberMasked,
  isCompleteAccountNumberDigits,
} from '@shared/utils/account-number'
import type { TransferRequest } from '@shared/api/endpoints/accounts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type AccountPick = { id: string; account_number: string }

export function resolvePrefillAccountId(accounts: AccountPick[], raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const digits = digitsOnlyAccountNumber(trimmed)
  if (digits.length === 16) {
    return accounts.find((a) => a.account_number === digits)?.id ?? ''
  }
  if (UUID_RE.test(trimmed)) {
    return accounts.find((a) => a.id === trimmed)?.id ?? ''
  }
  return ''
}

export type TransferRecipientMode = 'own' | 'other'

export type TransferPreviewInput = {
  debouncedPreviewAmount: number | null
  fromAccountId: string
  fromAccount: { account_number: string } | undefined
  recipientMode: TransferRecipientMode
  toOwnValid: boolean
  toOwnAccount: { account_number: string } | undefined
  toOtherValid: boolean
  toDigitsOther: string
}

export function buildTransferPreviewRequest(input: TransferPreviewInput): TransferRequest | null {
  const {
    debouncedPreviewAmount,
    fromAccountId,
    fromAccount,
    recipientMode,
    toOwnValid,
    toOwnAccount,
    toOtherValid,
    toDigitsOther,
  } = input
  if (debouncedPreviewAmount === null || debouncedPreviewAmount < 0.01) return null
  if (!fromAccountId || !fromAccount) return null
  if (recipientMode === 'own' && toOwnValid && toOwnAccount) {
    return {
      from_account_id: fromAccountId,
      to_account_number: toOwnAccount.account_number,
      amount: debouncedPreviewAmount,
    }
  }
  if (recipientMode === 'other' && toOtherValid) {
    return {
      from_account_id: fromAccountId,
      to_account_number: toDigitsOther,
      amount: debouncedPreviewAmount,
    }
  }
  return null
}

export type TransferSubmitPayloadInput = {
  recipientMode: TransferRecipientMode
  fromAccountId: string
  fromAccount: { account_number: string }
  toOwnAccount: { account_number: string } | undefined
  toDigitsOther: string
  amount: number
}

export function buildTransferSubmitPayload(input: TransferSubmitPayloadInput): TransferRequest {
  const { recipientMode, fromAccountId, toOwnAccount, toDigitsOther, amount } = input
  if (recipientMode === 'own' && toOwnAccount) {
    return {
      from_account_id: fromAccountId,
      to_account_number: toOwnAccount.account_number,
      amount,
    }
  }
  return {
    from_account_id: fromAccountId,
    to_account_number: toDigitsOther,
    amount,
  }
}

export function parseTransferAmount(amountStr: string): { amount: number; amountValid: boolean } {
  const amount = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.'))
  const amountValid = Number.isFinite(amount) && amount >= 0.01
  return { amount, amountValid }
}

export function recipientOtherDigitsState(toOtherAccountId: string) {
  const toDigitsOther = digitsOnlyAccountNumber(toOtherAccountId)
  const toOtherDigitsComplete = isCompleteAccountNumberDigits(toDigitsOther)
  return { toDigitsOther, toOtherDigitsComplete }
}

export function setOtherAccountMaskedValue(raw: string): string {
  return formatAccountNumberMasked(digitsOnlyAccountNumber(raw))
}
