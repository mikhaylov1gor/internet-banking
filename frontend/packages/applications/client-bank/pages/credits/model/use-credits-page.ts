import { useState, useEffect } from 'react'
import { useCredits, useIssueCredit } from '../../../features/credits'
import { useAccounts } from '../../../features/accounts'
import { useTariffs } from '../../../features/tariffs'
import { getCurrentUserId } from '@shared/features/auth'

export const useCreditsPage = () => {
  const [showModal, setShowModal] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [noAccountsError, setNoAccountsError] = useState('')
  const [amountBlurred, setAmountBlurred] = useState(false)

  const { data: credits, isLoading } = useCredits()
  const { data: accounts } = useAccounts({ status: 'active' })
  const { data: tariffs } = useTariffs()
  const issueCreditMutation = useIssueCredit()
  const clientId = getCurrentUserId()

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
      setNoAccountsError('Для оформления кредита необходимо иметь хотя бы один активный счет. Пожалуйста, откройте счет в разделе "Счета".')
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
        const selectedTariffData = tariffs?.find(t => t.id === selectedTariff)
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
  }
}


