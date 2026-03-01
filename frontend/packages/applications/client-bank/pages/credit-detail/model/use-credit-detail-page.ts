import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCredit, useRepayCredit } from '../../../features/credits'
import { useAccounts } from '../../../features/accounts'

export const useCreditDetailPage = () => {
  const { creditId } = useParams<{ creditId: string }>()
  const navigate = useNavigate()
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [repayAmount, setRepayAmount] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')

  const { data: credit, isLoading: creditLoading, error: creditError } = useCredit(creditId || null)
  const { data: accountsResponse } = useAccounts({ status: 'active' })
  const accounts = accountsResponse?.accounts
  const repayCreditMutation = useRepayCredit()

  const handleRepay = () => {
    if (creditId && repayAmount && credit && selectedAccount) {
      const amount = parseFloat(repayAmount)
      const selectedAccountData = accounts?.find((acc) => acc.id === selectedAccount)
      
      if (amount > 0 && amount <= credit.remaining && selectedAccountData && amount <= selectedAccountData.balance) {
        repayCreditMutation.mutate(
          { creditId, data: { amount, account_id: selectedAccount } },
          {
            onSuccess: () => {
              setRepayAmount('')
              setSelectedAccount('')
              setShowRepayModal(false)
            },
          }
        )
      }
    }
  }

  return {
    credit,
    creditLoading,
    creditError,
    accounts,
    showRepayModal,
    setShowRepayModal,
    repayAmount,
    setRepayAmount,
    selectedAccount,
    setSelectedAccount,
    repayCreditMutation,
    handleRepay,
    navigate,
  }
}


