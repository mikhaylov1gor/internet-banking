import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { convertFx } from '@shared/api/endpoints/fx'
import { formatAccountNumberMasked } from '@shared/utils/account-number'
import { getRubDepositPreviewPlan } from '@shared/utils/rub-deposit-preview'
import { getLoadDataErrorMessage } from '@shared/api'
import { MAX_CREDIT_TERM_MONTHS } from '@shared/api/endpoints/credits'
import {
  useCredits,
  useIssueCredit,
  useClientCreditRating,
  useCheckCreditAvailability,
} from '../../../features/credits'
import { useAccounts, useTransferPreview } from '../../../features/accounts'
import { useTariffs } from '../../../features/tariffs'
import { getCurrentUserId } from '@shared/features/auth'

export type TariffLimitsHint =
  | { kind: 'none' }
  | { kind: 'range'; min: number; max: number }
  | { kind: 'min'; min: number }
  | { kind: 'max'; max: number }

export type AmountValidationIssue =
  | { kind: 'below_min'; min: number }
  | { kind: 'above_max'; max: number }

function parseAmountInput(raw: string): number {
  return parseFloat(raw.replace(/\s/g, '').replace(',', '.'))
}

export const useCreditsPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [noAccountsError, setNoAccountsError] = useState('')
  const [amountBlurred, setAmountBlurred] = useState(false)
  const [termMonths, setTermMonths] = useState(12)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const {
    data: creditRating,
    isLoading: ratingLoading,
    isError: ratingError,
    error: ratingQueryError,
    refetch: refetchRating,
  } = useClientCreditRating()

  const {
    data: creditsResponse,
    isLoading,
    isError: creditsLoadError,
    error: creditsQueryError,
  } = useCredits({
    page,
    page_size: pageSize,
  })
  const credits = creditsResponse?.credits || []
  const totalPages = creditsResponse?.pageQuantity || 1
  const { data: accountsResponse, isError: accountsLoadError, error: accountsQueryError } = useAccounts({
    status: 'active',
  })
  const accounts = accountsResponse?.accounts
  const {
    data: tariffs,
    isError: tariffsLoadError,
    isPending: tariffsPending,
    error: tariffsQueryError,
  } = useTariffs()

  const takeCreditDisabledByTariffs =
    tariffsPending || tariffsLoadError || !tariffs?.length

  const takeCreditTariffsHint =
    !tariffsPending && (tariffsLoadError || (tariffs && tariffs.length === 0))
      ? 'Сейчас не получится взять кредит, попробуйте позже.'
      : null
  const issueCreditMutation = useIssueCredit()
  const checkAvailabilityMutation = useCheckCreditAvailability()
  const lastAvailabilityAmountRef = useRef<number | null>(null)
  const availabilityAutoRequestKeyRef = useRef<string | null>(null)
  const checkAvailabilityMutationRef = useRef(checkAvailabilityMutation)
  checkAvailabilityMutationRef.current = checkAvailabilityMutation
  const clientId = getCurrentUserId()

  const openRatingModal = useCallback(() => {
    setShowRatingModal(true)
    void refetchRating()
  }, [refetchRating])

  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false)
  }, [])

  useEffect(() => {
    if (showModal && tariffs && tariffs.length > 0 && !selectedTariff) {
      setSelectedTariff(tariffs[0].id)
    }
  }, [showModal, tariffs, selectedTariff])

  useEffect(() => {
    if (showModal && accounts && accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id)
    }
  }, [showModal, accounts, selectedAccount])

  const selectedAccountData = useMemo(
    () => accounts?.find((a) => a.id === selectedAccount),
    [accounts, selectedAccount]
  )

  const selectedAccountCurrency = (selectedAccountData?.currency || 'RUB').toUpperCase()

  const rubBridgeAccountId = useMemo(
    () => accounts?.find((a) => (a.currency || 'RUB').toUpperCase() === 'RUB')?.id ?? null,
    [accounts]
  )

  const [debouncedIssueCreditRubAmount, setDebouncedIssueCreditRubAmount] = useState<number | null>(null)
  useEffect(() => {
    if (!showModal) {
      setDebouncedIssueCreditRubAmount(null)
      return
    }
    const v = parseAmountInput(amount)
    if (!Number.isFinite(v) || v < 0.01) {
      setDebouncedIssueCreditRubAmount(null)
      return
    }
    const id = window.setTimeout(() => setDebouncedIssueCreditRubAmount(v), 400)
    return () => clearTimeout(id)
  }, [amount, showModal])

  const rubAmountForPreview = useMemo(() => {
    if (!showModal) return null
    if (amountBlurred) {
      const live = parseAmountInput(amount)
      if (Number.isFinite(live) && live >= 0.01) return live
      return null
    }
    return debouncedIssueCreditRubAmount
  }, [showModal, amountBlurred, amount, debouncedIssueCreditRubAmount])

  const issueCreditPreviewPlan = useMemo(() => {
    if (!showModal) return { kind: 'none' as const }
    return getRubDepositPreviewPlan(
      rubBridgeAccountId,
      selectedAccount,
      selectedAccountCurrency,
      rubAmountForPreview
    )
  }, [showModal, rubBridgeAccountId, selectedAccount, selectedAccountCurrency, rubAmountForPreview])

  const issueCreditTransferPreviewRequest =
    issueCreditPreviewPlan.kind === 'transfer' ? issueCreditPreviewPlan.request : null

  const issueCreditTransferPreviewQuery = useTransferPreview(issueCreditTransferPreviewRequest)

  const fxToCurrency =
    selectedAccountCurrency === 'USD' || selectedAccountCurrency === 'EUR'
      ? selectedAccountCurrency
      : null

  const issueCreditFxQuoteActive =
    showModal &&
    fxToCurrency !== null &&
    issueCreditPreviewPlan.kind === 'none' &&
    rubAmountForPreview !== null &&
    rubAmountForPreview >= 0.01

  const issueCreditFxQuoteQuery = useQuery({
    queryKey: ['fx-convert', 'issue-credit', fxToCurrency, rubAmountForPreview],
    queryFn: () =>
      convertFx({
        amount: rubAmountForPreview!,
        from_currency: 'RUB',
        to_currency: fxToCurrency!,
      }),
    enabled: issueCreditFxQuoteActive,
    staleTime: 15_000,
  })

  const handleOpenModal = () => {
    if (accountsLoadError) {
      setNoAccountsError(getLoadDataErrorMessage('счета', accountsQueryError))
      return
    }
    if (tariffsPending || tariffsLoadError || !tariffs?.length) {
      setNoAccountsError('Сейчас не получится взять кредит, попробуйте позже.')
      return
    }
    if (!accounts || accounts.length === 0) {
      setNoAccountsError(
        'Для оформления кредита необходимо иметь хотя бы один активный счет. Пожалуйста, откройте счет в разделе "Счета".'
      )
      return
    }
    setNoAccountsError('')
    setShowModal(true)
    if (tariffs && tariffs.length > 0) {
      setSelectedTariff(tariffs[0].id)
    }
    if (accounts && accounts.length > 0) {
      setSelectedAccount(accounts[0].id)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedTariff('')
    setSelectedAccount('')
    setAmount('')
    setNoAccountsError('')
    setAmountBlurred(false)
    setTermMonths(12)
    checkAvailabilityMutation.reset()
    lastAvailabilityAmountRef.current = null
    availabilityAutoRequestKeyRef.current = null
  }

  const handleIssueCredit = () => {
    const effectiveClientId = selectedAccountData?.client_id ?? clientId
    if (effectiveClientId && selectedTariff && selectedAccount && amount) {
      const amountValue = parseAmountInput(amount)
      if (Number.isFinite(amountValue) && amountValue > 0) {
        const selectedTariffData = tariffs?.find((t) => t.id === selectedTariff)
        if (selectedTariffData) {
          if (selectedTariffData.min_amount && amountValue < selectedTariffData.min_amount) {
            return
          }
          if (selectedTariffData.max_amount && amountValue > selectedTariffData.max_amount) {
            return
          }
        }
        issueCreditMutation.mutate(
          {
            client_id: effectiveClientId.trim(),
            account_id: selectedAccount.trim(),
            tariff_id: selectedTariff.trim(),
            amount: amountValue,
            term_months: termMonths,
          },
          {
            onSuccess: () => {
              handleCloseModal()
            },
          }
        )
      }
    }
  }

  const selectedTariffData = useMemo(
    () => tariffs?.find((t) => t.id === selectedTariff),
    [tariffs, selectedTariff]
  )

  const tariffLimitsHint = useMemo((): TariffLimitsHint => {
    const t = selectedTariffData
    if (!t || (!t.min_amount && !t.max_amount)) return { kind: 'none' }
    if (t.min_amount && t.max_amount) return { kind: 'range', min: t.min_amount, max: t.max_amount }
    if (t.min_amount) return { kind: 'min', min: t.min_amount }
    return { kind: 'max', max: t.max_amount! }
  }, [selectedTariffData])

  const amountValidationIssue = useMemo((): AmountValidationIssue | null => {
    if (!amountBlurred || !selectedTariffData || !amount) return null
    const amountValue = parseAmountInput(amount)
    if (!Number.isFinite(amountValue)) return null
    if (selectedTariffData.min_amount && amountValue < selectedTariffData.min_amount) {
      return { kind: 'below_min', min: selectedTariffData.min_amount }
    }
    if (selectedTariffData.max_amount && amountValue > selectedTariffData.max_amount) {
      return { kind: 'above_max', max: selectedTariffData.max_amount }
    }
    return null
  }, [amountBlurred, selectedTariffData, amount])

  const termValidationIssue = useMemo(() => {
    if (!Number.isFinite(termMonths) || termMonths < 1 || termMonths > MAX_CREDIT_TERM_MONTHS) {
      return `Срок: от 1 до ${MAX_CREDIT_TERM_MONTHS} мес. (лимит банка)`
    }
    return null
  }, [termMonths])

  const handleAmountBlur = useCallback(() => {
    setAmountBlurred(true)
  }, [])

  useEffect(() => {
    if (!showModal) return
    const checked = lastAvailabilityAmountRef.current
    if (checked === null) return
    const current = parseAmountInput(amount)
    if (!Number.isFinite(current) || Math.abs(current - checked) > 1e-9) {
      checkAvailabilityMutationRef.current.reset()
      lastAvailabilityAmountRef.current = null
      availabilityAutoRequestKeyRef.current = null
    }
  }, [amount, showModal])

  useEffect(() => {
    if (!showModal) return
    checkAvailabilityMutationRef.current.reset()
    lastAvailabilityAmountRef.current = null
    availabilityAutoRequestKeyRef.current = null
  }, [selectedAccount, showModal])

  useEffect(() => {
    if (!showModal || !amountBlurred) return
    const amountValue = parseAmountInput(amount)
    if (!Number.isFinite(amountValue) || amountValue < 0.01) {
      checkAvailabilityMutationRef.current.reset()
      lastAvailabilityAmountRef.current = null
      availabilityAutoRequestKeyRef.current = null
      return
    }

    const waitForFxPreview =
      issueCreditPreviewPlan.kind === 'transfer' && selectedAccountCurrency !== 'RUB'

    if (waitForFxPreview) {
      if (issueCreditTransferPreviewQuery.isPending || issueCreditTransferPreviewQuery.isFetching) return
      if (!issueCreditTransferPreviewQuery.isSuccess && !issueCreditTransferPreviewQuery.isError) return
    }

    const previewGate = waitForFxPreview
      ? `${issueCreditTransferPreviewQuery.isSuccess}-${issueCreditTransferPreviewQuery.isError}`
      : 'no-fx'
    const autoKey = `${selectedAccount}:${amountValue}:${previewGate}`
    if (availabilityAutoRequestKeyRef.current === autoKey) return

    const m = checkAvailabilityMutationRef.current
    if (
      m.isPending &&
      lastAvailabilityAmountRef.current !== null &&
      Math.abs(lastAvailabilityAmountRef.current - amountValue) < 1e-9
    ) {
      return
    }

    availabilityAutoRequestKeyRef.current = autoKey
    lastAvailabilityAmountRef.current = amountValue
    m.mutate(amountValue)
  }, [
    showModal,
    amountBlurred,
    amount,
    selectedAccount,
    selectedAccountCurrency,
    issueCreditPreviewPlan.kind,
    issueCreditTransferPreviewQuery.isPending,
    issueCreditTransferPreviewQuery.isFetching,
    issueCreditTransferPreviewQuery.isSuccess,
    issueCreditTransferPreviewQuery.isError,
  ])

  const issueCreditSubmitDisabled = useMemo(() => {
    if (issueCreditMutation.isPending || !selectedTariff || !selectedAccount || !amount) return true
    const amountValue = parseAmountInput(amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) return true
    if (!Number.isFinite(termMonths) || termMonths < 1 || termMonths > MAX_CREDIT_TERM_MONTHS) return true
    const t = selectedTariffData
    if (t) {
      if (t.min_amount && amountValue < t.min_amount) return true
      if (t.max_amount && amountValue > t.max_amount) return true
    }
    const needsBankAvailability = amountValue >= 0.01
    if (needsBankAvailability) {
      if (checkAvailabilityMutation.isPending) return true
      if (!checkAvailabilityMutation.isSuccess && !checkAvailabilityMutation.isError) return true
      if (checkAvailabilityMutation.isSuccess && checkAvailabilityMutation.data?.allowed === false) {
        return true
      }
    }
    return false
  }, [
    issueCreditMutation.isPending,
    selectedTariff,
    selectedAccount,
    amount,
    selectedTariffData,
    termMonths,
    checkAvailabilityMutation.isPending,
    checkAvailabilityMutation.isSuccess,
    checkAvailabilityMutation.isError,
    checkAvailabilityMutation.data?.allowed,
  ])

  const tariffSelectOptions = useMemo(
    () =>
      tariffs?.map((tariff) => ({
        value: tariff.id,
        label: `${tariff.name} (${(tariff.rate * 100).toFixed(2)}%)`,
      })) ?? [],
    [tariffs]
  )

  const accountSelectOptions = useMemo(
    () =>
      accounts?.map((account) => {
        const masked = formatAccountNumberMasked(account.account_number)
        const bal = account.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const cur = account.currency || 'RUB'
        return {
          value: account.id,
          label: `Счёт ${masked}`,
          listLabel: `Счёт ${masked} (${bal} ${cur})`,
        }
      }) ?? [],
    [accounts]
  )

  return {
    credits,
    isLoading,
    creditsLoadError,
    creditsQueryError,
    accountsLoadError,
    accountsQueryError,
    tariffsLoadError,
    tariffsQueryError,
    takeCreditDisabledByTariffs,
    takeCreditTariffsHint,
    accounts,
    tariffs,
    showModal,
    handleOpenModal,
    handleCloseModal,
    selectedTariff,
    setSelectedTariff,
    selectedAccount,
    setSelectedAccount,
    selectedAccountCurrency,
    amount,
    setAmount,
    amountBlurred,
    setAmountBlurred,
    termMonths,
    setTermMonths,
    maxTermMonths: MAX_CREDIT_TERM_MONTHS,
    termValidationIssue,
    checkAvailabilityMutation,
    handleAmountBlur,
    issueCreditMutation,
    handleIssueCredit,
    noAccountsError,
    page,
    setPage,
    limit: pageSize,
    setLimit: setPageSize,
    totalPages,
    showRatingModal,
    openRatingModal,
    closeRatingModal,
    creditRating,
    ratingLoading,
    ratingError,
    ratingQueryError,
    tariffLimitsHint,
    amountValidationIssue,
    issueCreditSubmitDisabled,
    tariffSelectOptions,
    accountSelectOptions,
    issueCreditPreviewPlan,
    issueCreditTransferPreviewQuery,
    issueCreditFxQuoteActive,
    issueCreditFxQuoteQuery,
  }
}
