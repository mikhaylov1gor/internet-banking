import { z } from 'zod'

const FxCurrencySchema = z.enum(['RUB', 'USD', 'EUR'])

export const FxConvertRequestSchema = z.object({
  amount: z.number(),
  from_currency: FxCurrencySchema,
  to_currency: FxCurrencySchema,
})
export type FxConvertRequest = z.infer<typeof FxConvertRequestSchema>

export const FxConvertResponseSchema = z.object({
  amount: z.number(),
  from_currency: FxCurrencySchema,
  to_currency: FxCurrencySchema,
  rate: z.number(),
  result_amount: z.number(),
})
export type FxConvertResponse = z.infer<typeof FxConvertResponseSchema>
