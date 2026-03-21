import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAccounts, useTransferBetweenAccounts } from '../../../features/accounts'
import { getApiErrorMessage } from '@shared/api/api-error'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type RecipientMode = 'own' | 'other'

export const useTransferPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillFrom = searchParams.get('from')?.trim() ?? ''
  const prefillTo = searchParams.get('to')?.trim() ?? ''

  const { data, isLoading } = useAccounts({ status: 'active', page: 1, page_size: 100 })
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

    const nextFrom =
      prefillFrom && UUID_RE.test(prefillFrom) && accounts.some((a) => a.id === prefillFrom)
        ? prefillFrom
        : ''
    const nextTo =
      prefillTo && UUID_RE.test(prefillTo) && accounts.some((a) => a.id === prefillTo) ? prefillTo : ''

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
      .map((a) => ({
        value: a.id,
        label: `Счёт ···${a.id.slice(-8)} · ${a.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${a.currency || 'RUB'}`,
      }))
  }, [accounts, fromAccountId])

  const fromOptions = useMemo(
    () => [
      { value: '', label: 'Выберите счёт списания' },
      ...accounts.map((a) => ({
        value: a.id,
        label: `···${a.id.slice(-8)} · ${a.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${a.currency || 'RUB'}`,
      })),
    ],
    [accounts]
  )

  const toId =
    recipientMode === 'own'
      ? toOwnAccountId
      : toOtherAccountId.trim()

  const toOtherValid = recipientMode === 'other' && UUID_RE.test(toId)
  const toOwnValid = recipientMode === 'own' && toOwnAccountId !== '' && toOwnAccountId !== fromAccountId

  const amount = parseFloat(amountStr.replace(/\s/g, '').replace(',', '.'))
  const amountValid = Number.isFinite(amount) && amount >= 0.01
  const withinBalance = fromAccount ? amount <= fromAccount.balance : false

  const canSubmit =
    fromAccountId !== '' &&
    fromAccount &&
    (toOwnValid || toOtherValid) &&
    amountValid &&
    withinBalance &&
    fromAccountId !== toId

  const handleSubmit = () => {
    if (!canSubmit) return
    transferMutation.mutate(
      {
        from_account_id: fromAccountId,
        to_account_id: toId,
        amount,
      },
      {
        onSuccess: () => {
          setAmountStr('')
          if (recipientMode === 'other') setToOtherAccountId('')
        },
      }
    )
  }

  const errorMessage = transferMutation.isError ? getApiErrorMessage(transferMutation.error) : null

  const entryFromTopUpFlow = Boolean(prefillTo && UUID_RE.test(prefillTo))
  const successCreditAccountId =
    transferMutation.data?.credit_operation?.account_id ??
    (transferMutation.isSuccess && entryFromTopUpFlow && prefillTo ? prefillTo : undefined)
  const successDebitAccountId =
    transferMutation.data?.debit_operation?.account_id ??
    (transferMutation.isSuccess && !entryFromTopUpFlow && fromAccountId ? fromAccountId : undefined)

  const toOwnCurrency =
    recipientMode === 'own' && toOwnAccountId ? accounts.find((a) => a.id === toOwnAccountId)?.currency : undefined

  const fromCur = fromAccount?.currency || 'RUB'
  const showFxHint = Boolean(
    fromAccount &&
      (recipientMode === 'other' ||
        (toOwnCurrency !== undefined && toOwnCurrency !== fromCur))
  )

  return {
    navigate,
    isLoading,
    accounts,
    fromAccountId,
    setFromAccountId,
    fromOptions,
    fromAccount,
    recipientMode,
    setRecipientMode,
    toOwnAccountId,
    setToOwnAccountId,
    toOtherAccountId,
    setToOtherAccountId,
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
    showFxHint,
    otherRecipientHint:
      recipientMode === 'other'
        ? 'Укажите номер счёта получателя (UUID), например из реквизитов или из приложения банка получателя.'
        : null,
    entryFromTopUpFlow,
    successCreditAccountId,
    successDebitAccountId,
    handleNewTransfer,
  }
}
