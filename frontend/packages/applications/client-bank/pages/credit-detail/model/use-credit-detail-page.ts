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
  const { data: accounts } = useAccounts({ status: 'active' })
  const repayCreditMutation = useRepayCredit()

  const handleRepay = () => {
    if (creditId && repayAmount && credit) {
      const amount = parseFloat(repayAmount)
      if (amount > 0 && amount <= credit.remaining) {
        repayCreditMutation.mutate(
          { creditId, data: { amount } },
          {
            onSuccess: () => {
              setRepayAmount('')
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


