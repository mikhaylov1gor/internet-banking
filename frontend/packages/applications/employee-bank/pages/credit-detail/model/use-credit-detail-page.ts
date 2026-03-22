import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCredit, useCreditPayments } from '../../../features/credits'
import { useUser } from '../../../features/users'
import { useTariff } from '../../../features/tariffs'

const PAYMENTS_PAGE_SIZE = 50

export const useCreditDetailPage = () => {
  const { creditId } = useParams<{ creditId: string }>()
  const navigate = useNavigate()
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [onlyOverduePayments, setOnlyOverduePayments] = useState(false)

  const { data: credit, isLoading: creditLoading, error: creditError } = useCredit(creditId || null)

  const { data: client, isLoading: clientLoading, isError: clientLoadError } = useUser(credit?.client_id || null)
  const { data: tariff, isLoading: tariffLoading, isError: tariffLoadError } = useTariff(credit?.tariff_id || null)

  const paymentsEnabled =
    !!creditId && (credit?.status === 'active' || credit?.status === 'overdue')
  const {
    data: creditPayments,
    isLoading: creditPaymentsLoading,
    isError: creditPaymentsError,
  } = useCreditPayments(
    creditId || null,
    {
      page: paymentsPage,
      page_size: PAYMENTS_PAGE_SIZE,
      only_overdue: onlyOverduePayments,
    },
    { enabled: paymentsEnabled }
  )

  const setOnlyOverduePaymentsAndResetPage = (value: boolean) => {
    setOnlyOverduePayments(value)
    setPaymentsPage(1)
  }

  return {
    credit,
    creditLoading,
    creditError,
    client,
    clientLoading,
    clientLoadError,
    tariff,
    tariffLoading,
    tariffLoadError,
    navigate,
    creditPayments,
    creditPaymentsLoading,
    creditPaymentsError,
    paymentsPage,
    setPaymentsPage,
    paymentsPageQuantity: creditPayments?.pageQuantity ?? 1,
    onlyOverduePayments,
    setOnlyOverduePayments: setOnlyOverduePaymentsAndResetPage,
    paymentsEnabled,
  }
}


