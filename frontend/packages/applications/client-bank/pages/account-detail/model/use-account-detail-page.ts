import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  useAccount,
  useAccountOperations,
  useCloseAccount,
  useDepositToAccount,
  useWithdrawFromAccount,
} from '../../../features/accounts'

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
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1)

  const { data: account, isLoading: accountLoading, error: accountError } = useAccount(accountId || null)
  const { data: operations, isLoading: operationsLoading } = useAccountOperations(accountId || null, {
    limit,
    offset: (page - 1) * limit,
  })
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

  return {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
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
    limit,
    setLimit,
    page,
    setPage,
    handleCloseAccount,
    closeAccountMutation,
    depositMutation,
    withdrawMutation,
    handleDeposit,
    handleWithdraw,
    handleBack,
    navigate,
  }
}


