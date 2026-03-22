import { useQuery } from '@tanstack/react-query'
import {
  getCredits,
  getCreditById,
  getCreditPayments,
  getClientCreditRating,
  type GetCreditsParams,
  type GetCreditPaymentsParams,
} from '@shared/api/endpoints/credits'

export const useCredits = (params?: GetCreditsParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['credits', params],
    queryFn: () => getCredits(params),
    enabled: options?.enabled !== false,
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

export const verifyCreditExistsForNavigation = (creditId: string) => getCreditById(creditId)

export const useClientCreditRatingForUser = (
  clientId: string | null | undefined,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['credit-rating', clientId],
    queryFn: () => getClientCreditRating(clientId!),
    enabled: !!clientId && options?.enabled !== false,
  })
}


