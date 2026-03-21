import { z } from 'zod'

export const CreditTariffSchema = z.object({
  id: z.string(),
  name: z.string(),
  rate: z.number(),
  min_amount: z.number().nullish(),
  max_amount: z.number().nullish(),
})
export type CreditTariff = z.infer<typeof CreditTariffSchema>

export type CreateTariffRequest = {
  name: string
  rate: number
  min_amount?: number
  max_amount?: number
}

export const TariffListResponseSchema = z.object({
  tariffs: z.array(CreditTariffSchema),
  pageNumber: z.number(),
  pageQuantity: z.number(),
})
export type TariffListResponse = z.infer<typeof TariffListResponseSchema>

export type GetTariffsParams = {
  page?: number
  page_size?: number
}
