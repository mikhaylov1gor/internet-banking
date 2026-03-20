import { useQuery } from '@tanstack/react-query'
import { getCredits, getCreditById, type GetCreditsParams } from '@shared/api/endpoints/credits'

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


