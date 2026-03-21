import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAccountOperationsWsSync } from '@shared/features/accounts'
import {
  useAccount,
  useAccounts,
  useAccountOperations,
  useCloseAccount,
  useDepositToAccount,
  useWithdrawFromAccount,
} from '../../../features/accounts'

const OPERATIONS_PAGE_SIZE = 10

export const useAccountDetailPage = () => {
  const { accountId } = useParams<{ accountId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromCredit = (location.state as { fromCredit?: boolean; creditId?: string })?.fromCredit
  const creditId = (location.state as { fromCredit?: boolean; creditId?: string })?.creditId
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [operationsPage, setOperationsPage] = useState(1)

  useEffect(() => {
    setOperationsPage(1)
  }, [accountId])

  useAccountOperationsWsSync(accountId || null, OPERATIONS_PAGE_SIZE)

  const { data: account, isLoading: accountLoading, error: accountError } = useAccount(accountId || null)

  const { data: accountsListData } = useAccounts({ status: 'active', page: 1, page_size: 100 })
  const otherActiveAccounts = useMemo(() => {
    if (!accountId) return []
    return (accountsListData?.accounts ?? []).filter((a) => a.id !== accountId && a.status === 'active')
  }, [accountsListData, accountId])

  const {
    data: operationsData,
    isLoading: operationsLoading,
    isError: operationsError,
    error: operationsFetchError,
  } = useAccountOperations(accountId || null, {
    page: operationsPage,
    page_size: OPERATIONS_PAGE_SIZE,
  })

  const operations = operationsData?.operations ?? []
  const operationsTotalPages = Math.max(operationsData?.pageQuantity ?? 1, 1)

  const closeAccountMutation = useCloseAccount()
  const depositMutation = useDepositToAccount()
  const withdrawMutation = useWithdrawFromAccount()

  const handleCloseAccount = () => {
    if (accountId) {
      closeAccountMutation.mutate(accountId, {
        onSuccess: () => {
          setShowConfirm(false)
        },
      })
    }
  }

  const handleDeposit = () => {
    if (accountId && depositAmount) {
      const amount = parseFloat(depositAmount)
      if (amount > 0) {
        depositMutation.mutate(
          { accountId, data: { amount } },
          {
            onSuccess: () => {
              setDepositAmount('')
              setShowDepositModal(false)
            },
          }
        )
      }
    }
  }

  const handleWithdraw = () => {
    if (accountId && withdrawAmount && account) {
      const amount = parseFloat(withdrawAmount)
      if (amount > 0 && amount <= account.balance) {
        withdrawMutation.mutate(
          { accountId, data: { amount } },
          {
            onSuccess: () => {
              setWithdrawAmount('')
              setShowWithdrawModal(false)
            },
          }
        )
      }
    }
  }

  const handleBack = () => {
    if (fromCredit && creditId) {
      navigate(`/credits/${creditId}`)
    } else {
      navigate('/accounts')
    }
  }

  const goPrevOperationsPage = () => setOperationsPage((p) => Math.max(1, p - 1))
  const goNextOperationsPage = () =>
    setOperationsPage((p) => Math.min(operationsTotalPages, p + 1))

  return {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
    operationsError,
    operationsFetchError,
    operationsPage,
    operationsTotalPages,
    goPrevOperationsPage,
    goNextOperationsPage,
    showConfirm,
    setShowConfirm,
    showDepositModal,
    setShowDepositModal,
    showWithdrawModal,
    setShowWithdrawModal,
    depositAmount,
    setDepositAmount,
    withdrawAmount,
    setWithdrawAmount,
    handleCloseAccount,
    closeAccountMutation,
    depositMutation,
    withdrawMutation,
    handleDeposit,
    handleWithdraw,
    handleBack,
    navigate,
    otherActiveAccounts,
  }
}
