import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inlineHandledMutationMeta } from '@shared/features/app/model/inline-handled-mutation-meta'
import {
  getTariffs,
  createTariff,
  type GetTariffsParams,
  type CreateTariffRequest,
} from '@shared/api/endpoints/tariffs'
import type { CreditTariff } from '@shared/api/endpoints/tariffs'

export const useTariffs = (params?: GetTariffsParams) => {
  return useQuery({
    queryKey: ['tariffs', params],
    queryFn: () => getTariffs(params),
  })
}

export const useTariff = (tariffId: string | null) => {
  return useQuery({
    queryKey: ['tariff', tariffId],
    queryFn: async () => {
      if (!tariffId) throw new Error('Tariff ID is required')
      const response = await getTariffs()
      const tariff = response.tariffs.find((t: CreditTariff) => t.id === tariffId)
      if (!tariff) throw new Error('Tariff not found')
      return tariff
    },
    enabled: !!tariffId,
  })
}

export const useCreateTariff = () => {
  const queryClient = useQueryClient()

  return useMutation({
    meta: { ...inlineHandledMutationMeta },
    mutationFn: (data: CreateTariffRequest) => createTariff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
    },
  })
}


