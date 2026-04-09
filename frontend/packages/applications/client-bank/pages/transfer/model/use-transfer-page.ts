import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useAccounts,
  useTransferBetweenAccounts,
  useTransferPreview,
  useAccountBasicByNumber,
} from '../../../features/accounts'
import { getApiErrorMessage, isNotFoundError } from '@shared/api/api-error'
import { formatAccountNumberMasked } from '@shared/utils/account-number'
import type { TransferRequest } from '@shared/api/endpoints/accounts'
import {
  resolvePrefillAccountId,
  buildTransferPreviewRequest,
  buildTransferSubmitPayload,
  parseTransferAmount,
  recipientOtherDigitsState,
  setOtherAccountMaskedValue,
  type TransferRecipientMode,
} from '../use-cases/transfer-page-scenario'

export type RecipientMode = TransferRecipientMode

export const useTransferPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillFrom = searchParams.get('from')?.trim() ?? ''
  const prefillTo = searchParams.get('to')?.trim() ?? ''

  const { data, isLoading, isError: accountsLoadError } = useAccounts({ status: 'active', page: 1, page_size: 100 })
  const accounts = useMemo(() => data?.accounts.filter((a) => a.status === 'active') ?? [], [data])

  const [fromAccountId, setFromAccountId] = useState('')
  const [recipientMode, setRecipientMode] = useState<RecipientMode>('own')
  const [toOwnAccountId, setToOwnAccountId] = useState('')
  const [toOtherAccountId, setToOtherAccountId] = useState('')
  const [amountStr, setAmountStr] = useState('')

  const transferMutation = useTransferBetweenAccounts()

  const paramsKey = `${prefillFrom}|${prefillTo}`
  const lastAppliedParamsKey = useRef<string | null>(null)

  const applyQueryPrefill = useCallback(() => {
    if (accounts.length === 0) return

    const nextFrom = resolvePrefillAccountId(accounts, prefillFrom)
    const nextTo = resolvePrefillAccountId(accounts, prefillTo)

    setFromAccountId(nextFrom)
    setAmountStr('')
    setToOtherAccountId('')
    if (nextTo) {
      setRecipientMode('own')
      setToOwnAccountId(nextTo)
    } else {
      setToOwnAccountId('')
      setRecipientMode('own')
    }
  }, [accounts, prefillFrom, prefillTo])

  useEffect(() => {
    if (accounts.length === 0) return
    if (lastAppliedParamsKey.current === paramsKey) return
    lastAppliedParamsKey.current = paramsKey
    applyQueryPrefill()
  }, [accounts, paramsKey, applyQueryPrefill])

  const handleNewTransfer = useCallback(() => {
    transferMutation.reset()
    applyQueryPrefill()
  }, [transferMutation, applyQueryPrefill])

  const fromAccount = useMemo(
    () => accounts.find((a) => a.id === fromAccountId),
    [accounts, fromAccountId]
  )

  const toOwnOptions = useMemo(() => {
    return accounts
      .filter((a) => a.id !== fromAccountId)
      .map((a) => {
        const masked = formatAccountNumberMasked(a.account_number)
        const bal = a.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const cur = a.currency || 'RUB'
        return {
          value: a.id,
          label: masked,
          listLabel: `${masked} · ${bal} ${cur}`,
        }
      })
  }, [accounts, fromAccountId])

  const fromOptions = useMemo(
    () => [
      { value: '', label: 'Выберите счёт списания' },
      ...accounts.map((a) => {
        const masked = formatAccountNumberMasked(a.account_number)
        const bal = a.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const cur = a.currency || 'RUB'
        return {
          value: a.id,
          label: masked,
          listLabel: `${masked} · ${bal} ${cur}`,
        }
      }),
    ],
    [accounts]
  )

  const toOwnAccount = useMemo(
    () => accounts.find((a) => a.id === toOwnAccountId),
    [accounts, toOwnAccountId]
  )

  const { toDigitsOther, toOtherDigitsComplete } = recipientOtherDigitsState(toOtherAccountId)
  const otherRecipientSameAsDebit = Boolean(
    fromAccount && toOtherDigitsComplete && toDigitsOther === fromAccount.account_number
  )

  const otherRecipientLookupDigits =
    recipientMode === 'other' && toOtherDigitsComplete && !otherRecipientSameAsDebit && fromAccount
      ? toDigitsOther
      : null

  const recipientByNumberQuery = useAccountBasicByNumber(otherRecipientLookupDigits)

  const otherRecipientNotFound =
    recipientMode === 'other' &&
    toOtherDigitsComplete &&
    !otherRecipientSameAsDebit &&
    recipientByNumberQuery.isFetched &&
    recipientByNumberQuery.isError &&
    isNotFoundError(recipientByNumberQuery.error)

  const otherRecipientClosed =
    recipientMode === 'other' &&
    toOtherDigitsComplete &&
    !otherRecipientSameAsDebit &&
    recipientByNumberQuery.isSuccess &&
    recipientByNumberQuery.data.status !== 'active'

  const otherRecipientLookupErrorMessage =
    recipientMode === 'other' &&
    toOtherDigitsComplete &&
    !otherRecipientSameAsDebit &&
    recipientByNumberQuery.isFetched &&
    recipientByNumberQuery.isError &&
    !isNotFoundError(recipientByNumberQuery.error)
      ? getApiErrorMessage(recipientByNumberQuery.error)
      : null

  const toOtherValid =
    toOtherDigitsComplete &&
    !otherRecipientSameAsDebit &&
    recipientByNumberQuery.isSuccess &&
    recipientByNumberQuery.data.status === 'active'

  const toOwnValid =
    recipientMode === 'own' && toOwnAccountId !== '' && toOwnAccountId !== fromAccountId && !!toOwnAccount

  const { amount, amountValid } = parseTransferAmount(amountStr)
  const withinBalance = fromAccount ? amount <= fromAccount.balance : false

  const [debouncedPreviewAmount, setDebouncedPreviewAmount] = useState<number | null>(null)
  useEffect(() => {
    if (!amountValid) {
      setDebouncedPreviewAmount(null)
      return
    }
    const id = window.setTimeout(() => setDebouncedPreviewAmount(amount), 400)
    return () => window.clearTimeout(id)
  }, [amount, amountValid])

  const previewRequest = useMemo((): TransferRequest | null => {
    return buildTransferPreviewRequest({
      debouncedPreviewAmount,
      fromAccountId,
      fromAccount,
      recipientMode,
      toOwnValid,
      toOwnAccount,
      toOtherValid,
      toDigitsOther,
    })
  }, [
    debouncedPreviewAmount,
    fromAccountId,
    fromAccount,
    recipientMode,
    toOwnValid,
    toOwnAccount,
    toOtherValid,
    toDigitsOther,
  ])

  const transferPreviewQuery = useTransferPreview(previewRequest)

  const canSubmit =
    fromAccountId !== '' &&
    fromAccount &&
    (toOwnValid || toOtherValid) &&
    amountValid &&
    withinBalance &&
    (recipientMode === 'other' || fromAccountId !== toOwnAccountId)

  const handleSubmit = () => {
    if (!canSubmit || !fromAccount) return

    const payload = buildTransferSubmitPayload({
      recipientMode,
      fromAccountId,
      fromAccount,
      toOwnAccount,
      toDigitsOther,
      amount,
    })

    transferMutation.mutate(payload, {
      onSuccess: () => {
        setAmountStr('')
        if (recipientMode === 'other') setToOtherAccountId('')
      },
    })
  }

  const errorMessage = transferMutation.isError ? getApiErrorMessage(transferMutation.error) : null

  const entryFromTopUpFlow = Boolean(prefillTo && resolvePrefillAccountId(accounts, prefillTo))
  const successCreditAccountId =
    transferMutation.data?.credit_operation?.account_id ??
    (transferMutation.isSuccess && entryFromTopUpFlow
      ? resolvePrefillAccountId(accounts, prefillTo) || undefined
      : undefined)
  const successDebitAccountId =
    transferMutation.data?.debit_operation?.account_id ??
    (transferMutation.isSuccess && !entryFromTopUpFlow && fromAccountId ? fromAccountId : undefined)

  const setToOtherAccountMasked = useCallback((raw: string) => {
    setToOtherAccountId(setOtherAccountMaskedValue(raw))
  }, [])

  return {
    navigate,
    isLoading,
    accountsLoadError,
    fromAccountId,
    setFromAccountId,
    fromOptions,
    fromAccount,
    recipientMode,
    setRecipientMode,
    toOwnAccountId,
    setToOwnAccountId,
    toOtherAccountId,
    setToOtherAccountMasked,
    toOwnOptions,
    amountStr,
    setAmountStr,
    canSubmit,
    amount,
    amountValid,
    withinBalance,
    handleSubmit,
    transferMutation,
    errorMessage,
    entryFromTopUpFlow,
    successCreditAccountId,
    successDebitAccountId,
    handleNewTransfer,
    previewRequest,
    transferPreviewQuery,
    otherRecipientSameAsDebit,
    otherRecipientNotFound,
    otherRecipientClosed,
    otherRecipientLookupErrorMessage,
    otherRecipientLookupPending:
      recipientMode === 'other' &&
      toOtherDigitsComplete &&
      !otherRecipientSameAsDebit &&
      recipientByNumberQuery.isPending,
  }
}
