import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCredits, useIssueCredit, useClientCreditRating } from '../../../features/credits'
import { useAccounts } from '../../../features/accounts'
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

export const useCreditsPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [noAccountsError, setNoAccountsError] = useState('')
  const [amountBlurred, setAmountBlurred] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const {
    data: creditRating,
    isLoading: ratingLoading,
    isError: ratingError,
    refetch: refetchRating,
  } = useClientCreditRating()

  const { data: creditsResponse, isLoading } = useCredits({ page, page_size: pageSize })
  const credits = creditsResponse?.credits || []
  const totalPages = creditsResponse?.pageQuantity || 1
  const { data: accountsResponse } = useAccounts({ status: 'active' })
  const accounts = accountsResponse?.accounts
  const { data: tariffs } = useTariffs()
  const issueCreditMutation = useIssueCredit()
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

  const handleOpenModal = () => {
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
  }

  const handleIssueCredit = () => {
    if (clientId && selectedTariff && selectedAccount && amount) {
      const amountValue = parseFloat(amount)
      if (amountValue > 0) {
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
            client_id: clientId,
            account_id: selectedAccount,
            tariff_id: selectedTariff,
            amount: amountValue,
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
    const amountValue = parseFloat(amount)
    if (Number.isNaN(amountValue)) return null
    if (selectedTariffData.min_amount && amountValue < selectedTariffData.min_amount) {
      return { kind: 'below_min', min: selectedTariffData.min_amount }
    }
    if (selectedTariffData.max_amount && amountValue > selectedTariffData.max_amount) {
      return { kind: 'above_max', max: selectedTariffData.max_amount }
    }
    return null
  }, [amountBlurred, selectedTariffData, amount])

  const issueCreditSubmitDisabled = useMemo(() => {
    if (issueCreditMutation.isPending || !selectedTariff || !selectedAccount || !amount) return true
    const amountValue = parseFloat(amount)
    if (Number.isNaN(amountValue) || amountValue <= 0) return true
    const t = selectedTariffData
    if (t) {
      if (t.min_amount && amountValue < t.min_amount) return true
      if (t.max_amount && amountValue > t.max_amount) return true
    }
    return false
  }, [
    issueCreditMutation.isPending,
    selectedTariff,
    selectedAccount,
    amount,
    selectedTariffData,
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
      accounts?.map((account) => ({
        value: account.id,
        label: `Счет ${account.id.slice(0, 8)}... (${account.balance.toLocaleString()} ${account.currency || 'RUB'})`,
      })) ?? [],
    [accounts]
  )

  return {
    credits,
    isLoading,
    accounts,
    tariffs,
    showModal,
    handleOpenModal,
    handleCloseModal,
    selectedTariff,
    setSelectedTariff,
    selectedAccount,
    setSelectedAccount,
    amount,
    setAmount,
    amountBlurred,
    setAmountBlurred,
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
    tariffLimitsHint,
    amountValidationIssue,
    issueCreditSubmitDisabled,
    tariffSelectOptions,
    accountSelectOptions,
  }
}
