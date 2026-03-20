import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCredits,
  getCreditById,
  issueCredit,
  repayCredit,
  type GetCreditsParams,
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

export const useIssueCredit = () => {
  const queryClient = useQueryClient()

  return useMutation({
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
    mutationFn: ({ creditId, data }: { creditId: string; data: RepayCreditRequest }) =>
      repayCredit(creditId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: ['credit', variables.creditId] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}


