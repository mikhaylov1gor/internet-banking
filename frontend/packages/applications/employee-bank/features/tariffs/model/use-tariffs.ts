import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTariffs,
  createTariff,
  type GetTariffsParams,
  type CreateTariffRequest,
} from '@shared/api/endpoints/tariffs'

export const useTariffs = (params?: GetTariffsParams) => {
  return useQuery({
    queryKey: ['tariffs', params],
    queryFn: () => getTariffs(params),
  })
}

export const useCreateTariff = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTariffRequest) => createTariff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
    },
  })
}


