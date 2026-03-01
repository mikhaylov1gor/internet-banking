import { useQuery } from '@tanstack/react-query'
import { getTariffs, type GetTariffsParams } from '@shared/api/endpoints/tariffs'

export const useTariffs = (params?: GetTariffsParams) => {
  return useQuery({
    queryKey: ['tariffs', params],
    queryFn: () => getTariffs(params),
    select: (data) => data?.tariffs, // Извлекаем массив tariffs из ответа для обратной совместимости
  })
}


