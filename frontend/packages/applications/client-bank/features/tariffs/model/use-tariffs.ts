import { useQuery } from '@tanstack/react-query'
import { getTariffs, type GetTariffsParams } from '@shared/api/endpoints/tariffs'

export const useTariffs = (params?: GetTariffsParams) => {
  return useQuery({
    queryKey: ['tariffs', params],
    queryFn: () => getTariffs(params),
  })
}


