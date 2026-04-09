import { z } from 'zod'

export const CreditRatingSchema = z.object({
  client_id: z.string(),
  score: z.number(),
  risk_level: z.string(),
  overdue_amount: z.number(),
  overdue_count: z.number(),
})
export type CreditRating = z.infer<typeof CreditRatingSchema>

const CreditStatusSchema = z.enum(['active', 'paid', 'overdue'])

export const CreditSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  account_id: z.string(),
  tariff_id: z.string(),
  amount: z.number(),
  remaining: z.number(),
  rate: z.number(),
  term_days: z.number().optional().default(0),
  total_due: z.number().optional().default(0),
  daily_payment: z.number(),
  maturity_at: z.string().nullish(),
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
  term_days?: number
  term_months?: number
}

export type RepayCreditRequest = {
  amount: number
  account_id: string
}

export const CreditPaymentSchema = z.object({
  day: z.number().optional(),
  index: z.number(),
  due_at: z.string(),
  amount_due: z.number().optional(),
  amount_paid: z.number().optional(),
  amount_remaining: z.number().optional(),
  expected_total: z.number(),
  paid_now_total: z.number(),
  status: z.enum(['pending', 'paid', 'partial', 'overdue']),
})
export type CreditPayment = z.infer<typeof CreditPaymentSchema>

export const CreditPaymentListResponseSchema = z.object({
  items: z.array(CreditPaymentSchema),
  pageNumber: z.number(),
  pageQuantity: z.number(),
})
export type CreditPaymentListResponse = z.infer<typeof CreditPaymentListResponseSchema>

export type GetCreditPaymentsParams = {
  page?: number
  page_size?: number
  only_overdue?: boolean
}

export const CreditAvailabilitySchema = z.object({
  allowed: z.boolean(),
  requested_amount: z.number(),
  master_balance: z.number(),
  master_currency: z.string(),
  shortfall: z.number().optional(),
})
export type CreditAvailability = z.infer<typeof CreditAvailabilitySchema>

export const CREDIT_AMOUNT_NOT_AVAILABLE_MESSAGE = 'Не можем оформить кредит на такую сумму'
