import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inlineHandledMutationMeta } from '@shared/features/app/model/inline-handled-mutation-meta'
import {
  getCredits,
  getCreditById,
  getCreditPayments,
  getClientCreditRating,
  issueCredit,
  repayCredit,
  checkCreditAvailability,
  type GetCreditsParams,
  type GetCreditPaymentsParams,
  type IssueCreditRequest,
  type RepayCreditRequest,
} from '@shared/api/endpoints/credits'
import { getCurrentUserId } from '@shared/features/auth'

export const useCredits = (params?: Omit<GetCreditsParams, 'client_id'>) => {
  const clientId = getCurrentUserId()
  return useQuery({
    queryKey: ['credits', { ...params, client_id: clientId }],
    queryFn: () => getCredits({ ...params, client_id: clientId || undefined }),
    enabled: !!clientId,
  })
}

export const useClientCreditRating = () => {
  const clientId = getCurrentUserId()
  return useQuery({
    queryKey: ['credit-rating', clientId],
    queryFn: () => {
      if (!clientId) throw new Error('client id required')
      return getClientCreditRating(clientId)
    },
    enabled: !!clientId,
  })
}

export const useCredit = (creditId: string | null) => {
  return useQuery({
    queryKey: ['credit', creditId],
    queryFn: () => {
      if (!creditId) throw new Error('Credit ID is required')
      return getCreditById(creditId)
    },
    enabled: !!creditId,
  })
}

export const useCreditPayments = (
  creditId: string | null,
  params: GetCreditPaymentsParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['credit-payments', creditId, params],
    queryFn: () => {
      if (!creditId) throw new Error('Credit ID is required')
      return getCreditPayments(creditId, params)
    },
    enabled: !!creditId && options?.enabled !== false,
  })
}

export const useIssueCredit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: (data: IssueCreditRequest) => issueCredit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export const useRepayCredit = () => {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: ({ creditId, data }: { creditId: string; data: RepayCreditRequest }) =>
      repayCredit(creditId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: ['credit', variables.creditId] })
      queryClient.invalidateQueries({ queryKey: ['credit-payments', variables.creditId] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export const useCheckCreditAvailability = () =>
  useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: (amount: number) => checkCreditAvailability(amount),
  })


