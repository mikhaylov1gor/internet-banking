import { z } from 'zod'

export const CreditRatingSchema = z.object({
  client_id: z.string(),
  score: z.number(),
  risk_level: z.string(),
  overdue_amount: z.number(),
  overdue_count: z.number(),
})
export type CreditRating = z.infer<typeof CreditRatingSchema>

const CreditStatusSchema = z.enum(['active', 'paid'])

export const CreditSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  account_id: z.string(),
  tariff_id: z.string(),
  amount: z.number(),
  remaining: z.number(),
  rate: z.number(),
  daily_payment: z.number(),
  status: CreditStatusSchema,
  issued_at: z.string(),
  paid_at: z.string().nullish(),
})
export type Credit = z.infer<typeof CreditSchema>

export const CreditListResponseSchema = z.object({
  credits: z.array(CreditSchema),
  pageNumber: z.number(),
  pageQuantity: z.number(),
})
export type CreditListResponse = z.infer<typeof CreditListResponseSchema>

export type GetCreditsParams = {
  client_id?: string
  page?: number
  page_size?: number
}

export type IssueCreditRequest = {
  client_id: string
  tariff_id: string
  account_id: string
  amount: number
}

export type RepayCreditRequest = {
  amount: number
  account_id: string
}
