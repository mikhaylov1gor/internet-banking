import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Account, Credit, CreditPayment } from '@shared/api'
import { convertFx } from '@shared/api/endpoints/fx'
import type { RubDepositPreviewPlan } from '@shared/utils/rub-deposit-preview'
import { getRubDepositPreviewPlan } from '@shared/utils/rub-deposit-preview'
import { useCredit, useCreditPayments, useRepayCredit } from '../../../features/credits'
import { useAccounts, useAccount, useTransferPreview } from '../../../features/accounts'

const PAYMENTS_PAGE_SIZE = 50

const REPAY_PREVIEW_BALANCE_EPS = 0.02

const round2 = (v: number) => Math.round(v * 100) / 100

export type RepayFundsByPreviewStatus =
  | 'idle'
  | 'needs_preview'
  | 'preview_unavailable'
  | 'insufficient'
  | 'sufficient'

type FxEstimateSlice = {
  isPending: boolean
  isFetching: boolean
  isError: boolean
  isSuccess: boolean
  data?: { result_amount: number } | undefined
}

function getRepayFundsByPreviewStatus(
  selectedAccountId: string,
  accounts: Credit extends never ? never : import('@shared/api').Account[] | undefined,
  repayAmountRaw: string,
  creditRemaining: number,
  accountCurrencyUpper: string,
  fxEstimate: FxEstimateSlice
): RepayFundsByPreviewStatus {
  if (!selectedAccountId.trim()) return 'idle'
  const acc = accounts?.find((a) => a.id === selectedAccountId)
  if (!acc) return 'idle'
  const rub = parseRepayAmountInput(repayAmountRaw)
  if (!Number.isFinite(rub) || rub < 0.01) return 'idle'
  if (rub > creditRemaining + 1e-9) return 'idle'

  const cur = accountCurrencyUpper.trim().toUpperCase() || 'RUB'
  if (cur === 'RUB') {
    if (acc.balance + REPAY_PREVIEW_BALANCE_EPS < rub) return 'insufficient'
    return 'sufficient'
  }

  if (cur !== 'USD' && cur !== 'EUR') {
    if (acc.balance + REPAY_PREVIEW_BALANCE_EPS < rub) return 'insufficient'
    return 'sufficient'
  }

  if (fxEstimate.isPending || fxEstimate.isFetching) return 'needs_preview'
  if (fxEstimate.isError || !fxEstimate.isSuccess || fxEstimate.data == null) return 'preview_unavailable'
  const debitEstimate = fxEstimate.data.result_amount
  if (acc.balance + REPAY_PREVIEW_BALANCE_EPS < debitEstimate) return 'insufficient'
  return 'sufficient'
}

function getInstallmentFundsByPreviewStatus(
  payAccountId: string,
  accounts: Account[] | undefined,
  installmentRubAmount: number | null,
  creditRemaining: number,
  accountCurrencyUpper: string,
  fxEstimate: FxEstimateSlice
): RepayFundsByPreviewStatus {
  if (!payAccountId.trim()) return 'idle'
  const acc = accounts?.find((a) => a.id === payAccountId)
  if (!acc) return 'idle'
  if (installmentRubAmount === null || installmentRubAmount < 0.01) return 'idle'
  if (installmentRubAmount > creditRemaining + 1e-9) return 'idle'

  const cur = accountCurrencyUpper.trim().toUpperCase() || 'RUB'
  if (cur === 'RUB') {
    if (acc.balance + REPAY_PREVIEW_BALANCE_EPS < installmentRubAmount) return 'insufficient'
    return 'sufficient'
  }

  if (cur !== 'USD' && cur !== 'EUR') {
    if (acc.balance + REPAY_PREVIEW_BALANCE_EPS < installmentRubAmount) return 'insufficient'
    return 'sufficient'
  }

  if (fxEstimate.isPending || fxEstimate.isFetching) return 'needs_preview'
  if (fxEstimate.isError || !fxEstimate.isSuccess || fxEstimate.data == null) return 'preview_unavailable'
  const debitEstimate = fxEstimate.data.result_amount
  if (acc.balance + REPAY_PREVIEW_BALANCE_EPS < debitEstimate) return 'insufficient'
  return 'sufficient'
}

export function parseRepayAmountInput(raw: string): number {
  return parseFloat(raw.replace(/\s/g, '').replace(',', '.'))
}

export const getCreditInstallmentDueAmount = (credit: Credit, row: CreditPayment): number => {
  if (row.status === 'paid') return 0
  const ar = row.amount_remaining
  if (ar != null && Number.isFinite(ar)) {
    return round2(Math.min(Math.max(0, ar), credit.remaining))
  }
  const minutePayment = Math.max(credit.daily_payment / 1440, 0.01)
  const expectedPrev =
    row.index <= 1 ? 0 : round2(Math.min(credit.amount, (row.index - 1) * minutePayment))
  const expectedAtI = row.expected_total
  const paid = row.paid_now_total
  const installmentDue = round2(Math.max(0, expectedAtI - Math.max(paid, expectedPrev)))
  return round2(Math.min(installmentDue, credit.remaining))
}

export const useCreditDetailPage = () => {
  const { creditId } = useParams<{ creditId: string }>()
  const navigate = useNavigate()
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [repayAmount, setRepayAmount] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [paymentToPay, setPaymentToPay] = useState<CreditPayment | null>(null)
  const [payInstallmentAccountId, setPayInstallmentAccountId] = useState('')
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [onlyOverduePayments, setOnlyOverduePayments] = useState(false)

  const { data: credit, isLoading: creditLoading, error: creditError } = useCredit(creditId || null)
  const { data: linkedAccount } = useAccount(credit?.account_id ?? null)
  const { data: accountsResponse, isError: accountsLoadError } = useAccounts({ status: 'active' })
  const accounts = accountsResponse?.accounts
  const repayCreditMutation = useRepayCredit()

  const rubBridgeAccountId = useMemo(
    () => accounts?.find((a) => (a.currency || 'RUB').toUpperCase() === 'RUB')?.id ?? null,
    [accounts]
  )

  const repayRubParsed = useMemo(() => {
    if (!showRepayModal || !credit) return null
    const v = parseRepayAmountInput(repayAmount)
    if (!Number.isFinite(v) || v < 0.01) return null
    if (v > credit.remaining + 1e-9) return null
    return v
  }, [showRepayModal, repayAmount, credit?.remaining])

  const repaySelectedCurrency = useMemo(() => {
    const acc = accounts?.find((a) => a.id === selectedAccount)
    return (acc?.currency || 'RUB').toUpperCase()
  }, [accounts, selectedAccount])

  const repayPreviewPlan = useMemo(
    () =>
      getRubDepositPreviewPlan(
        rubBridgeAccountId,
        selectedAccount,
        repaySelectedCurrency,
        repayRubParsed
      ),
    [rubBridgeAccountId, selectedAccount, repaySelectedCurrency, repayRubParsed]
  )

  const repayTransferPreviewRequest =
    showRepayModal && repayPreviewPlan.kind === 'transfer' ? repayPreviewPlan.request : null

  const installmentRubAmount = useMemo(() => {
    if (!paymentToPay || !credit) return null
    const v = getCreditInstallmentDueAmount(credit, paymentToPay)
    if (v < 0.01 || v > credit.remaining + 1e-9) return null
    return v
  }, [paymentToPay, credit])

  const installmentSelectedCurrency = useMemo(() => {
    const acc = accounts?.find((a) => a.id === payInstallmentAccountId)
    return (acc?.currency || 'RUB').toUpperCase()
  }, [accounts, payInstallmentAccountId])

  const installmentPreviewPlan = useMemo(
    () =>
      getRubDepositPreviewPlan(
        rubBridgeAccountId,
        payInstallmentAccountId,
        installmentSelectedCurrency,
        installmentRubAmount
      ),
    [rubBridgeAccountId, payInstallmentAccountId, installmentSelectedCurrency, installmentRubAmount]
  )

  const installmentTransferPreviewRequest =
    paymentToPay && installmentPreviewPlan.kind === 'transfer' ? installmentPreviewPlan.request : null

  const repayTransferPreviewQuery = useTransferPreview(repayTransferPreviewRequest)
  const installmentTransferPreviewQuery = useTransferPreview(installmentTransferPreviewRequest)

  const repayFxToCurrency =
    repaySelectedCurrency === 'USD' || repaySelectedCurrency === 'EUR' ? repaySelectedCurrency : null

  const repayFxEstimateEnabled =
    showRepayModal &&
    repayFxToCurrency !== null &&
    repayRubParsed !== null &&
    repayRubParsed >= 0.01

  const repayFxQuoteActive =
    repayFxEstimateEnabled && repayPreviewPlan.kind === 'none'

  const repayFxQuoteQuery = useQuery({
    queryKey: ['fx-convert', 'repay-credit', repayFxToCurrency, repayRubParsed],
    queryFn: () =>
      convertFx({
        amount: repayRubParsed!,
        from_currency: 'RUB',
        to_currency: repayFxToCurrency!,
      }),
    enabled: repayFxEstimateEnabled,
    staleTime: 15_000,
  })

  const installmentFxToCurrency =
    installmentSelectedCurrency === 'USD' || installmentSelectedCurrency === 'EUR'
      ? installmentSelectedCurrency
      : null

  const installmentFxEstimateEnabled =
    !!paymentToPay &&
    installmentFxToCurrency !== null &&
    installmentRubAmount !== null &&
    installmentRubAmount >= 0.01

  const installmentFxQuoteActive =
    installmentFxEstimateEnabled && installmentPreviewPlan.kind === 'none'

  const installmentFxQuoteQuery = useQuery({
    queryKey: ['fx-convert', 'pay-installment', installmentFxToCurrency, installmentRubAmount],
    queryFn: () =>
      convertFx({
        amount: installmentRubAmount!,
        from_currency: 'RUB',
        to_currency: installmentFxToCurrency!,
      }),
    enabled: installmentFxEstimateEnabled,
    staleTime: 15_000,
  })

  const repayFundsStatus = useMemo(
    () =>
      getRepayFundsByPreviewStatus(
        selectedAccount,
        accounts,
        repayAmount,
        credit?.remaining ?? 0,
        repaySelectedCurrency,
        {
          isPending: repayFxQuoteQuery.isPending,
          isFetching: repayFxQuoteQuery.isFetching,
          isError: repayFxQuoteQuery.isError,
          isSuccess: repayFxQuoteQuery.isSuccess,
          data: repayFxQuoteQuery.data,
        }
      ),
    [
      selectedAccount,
      accounts,
      repayAmount,
      credit?.remaining,
      repaySelectedCurrency,
      repayFxQuoteQuery.isPending,
      repayFxQuoteQuery.isFetching,
      repayFxQuoteQuery.isError,
      repayFxQuoteQuery.isSuccess,
      repayFxQuoteQuery.data,
    ]
  )

  const installmentFundsStatus = useMemo(
    () =>
      getInstallmentFundsByPreviewStatus(
        payInstallmentAccountId,
        accounts,
        installmentRubAmount,
        credit?.remaining ?? 0,
        installmentSelectedCurrency,
        {
          isPending: installmentFxQuoteQuery.isPending,
          isFetching: installmentFxQuoteQuery.isFetching,
          isError: installmentFxQuoteQuery.isError,
          isSuccess: installmentFxQuoteQuery.isSuccess,
          data: installmentFxQuoteQuery.data,
        }
      ),
    [
      payInstallmentAccountId,
      accounts,
      installmentRubAmount,
      credit?.remaining,
      installmentSelectedCurrency,
      installmentFxQuoteQuery.isPending,
      installmentFxQuoteQuery.isFetching,
      installmentFxQuoteQuery.isError,
      installmentFxQuoteQuery.isSuccess,
      installmentFxQuoteQuery.data,
    ]
  )

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

  const handleRepay = () => {
    if (creditId && repayAmount && credit && selectedAccount) {
      if (
        getRepayFundsByPreviewStatus(
          selectedAccount,
          accounts,
          repayAmount,
          credit.remaining,
          repaySelectedCurrency,
          {
            isPending: repayFxQuoteQuery.isPending,
            isFetching: repayFxQuoteQuery.isFetching,
            isError: repayFxQuoteQuery.isError,
            isSuccess: repayFxQuoteQuery.isSuccess,
            data: repayFxQuoteQuery.data,
          }
        ) !== 'sufficient'
      ) {
        return
      }
      const amount = parseRepayAmountInput(repayAmount)
      if (amount > 0 && amount <= credit.remaining) {
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

  const closePayInstallmentModal = () => {
    setPaymentToPay(null)
    setPayInstallmentAccountId('')
  }

  const handlePayInstallment = () => {
    if (!creditId || !credit || !paymentToPay || !payInstallmentAccountId) return
    if (
      getInstallmentFundsByPreviewStatus(
        payInstallmentAccountId,
        accounts,
        installmentRubAmount,
        credit.remaining,
        installmentSelectedCurrency,
        {
          isPending: installmentFxQuoteQuery.isPending,
          isFetching: installmentFxQuoteQuery.isFetching,
          isError: installmentFxQuoteQuery.isError,
          isSuccess: installmentFxQuoteQuery.isSuccess,
          data: installmentFxQuoteQuery.data,
        }
      ) !== 'sufficient'
    ) {
      return
    }
    const amount = getCreditInstallmentDueAmount(credit, paymentToPay)
    if (amount >= 0.01 && amount <= credit.remaining) {
      repayCreditMutation.mutate(
        { creditId, data: { amount, account_id: payInstallmentAccountId } },
        {
          onSuccess: () => {
            closePayInstallmentModal()
          },
        }
      )
    }
  }

  const setOnlyOverduePaymentsAndResetPage = (value: boolean) => {
    setOnlyOverduePayments(value)
    setPaymentsPage(1)
  }

  return {
    credit,
    linkedAccount,
    creditLoading,
    creditError,
    accounts,
    accountsLoadError,
    showRepayModal,
    setShowRepayModal,
    repayAmount,
    setRepayAmount,
    selectedAccount,
    setSelectedAccount,
    repayCreditMutation,
    handleRepay,
    paymentToPay,
    setPaymentToPay,
    payInstallmentAccountId,
    setPayInstallmentAccountId,
    closePayInstallmentModal,
    handlePayInstallment,
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
    repayPreviewPlan,
    repaySelectedCurrency,
    repayTransferPreviewQuery,
    repayFxQuoteActive,
    repayFxQuoteQuery,
    installmentPreviewPlan,
    installmentSelectedCurrency,
    installmentTransferPreviewQuery,
    installmentFxQuoteActive,
    installmentFxQuoteQuery,
    repayFundsStatus,
    installmentFundsStatus,
  }
}


