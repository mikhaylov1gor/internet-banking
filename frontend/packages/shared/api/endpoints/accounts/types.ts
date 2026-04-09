import { z } from 'zod'

const CurrencySchema = z.enum(['RUB', 'USD', 'EUR'])
const AccountStatusSchema = z.enum(['active', 'closed'])

export const AccountSchema = z.object({
  id: z.string(),
  account_number: z.string(),
  client_id: z.string(),
  balance: z.number(),
  currency: CurrencySchema.nullish(),
  status: AccountStatusSchema,
  opened_at: z.string(),
  closed_at: z.string().nullish(),
})
export type Account = z.infer<typeof AccountSchema>

export const AccountBasicSchema = z.object({
  id: z.string(),
  account_number: z.string(),
  currency: z.string(),
  status: z.string(),
})
export type AccountBasic = z.infer<typeof AccountBasicSchema>

export const OperationSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  type: z.string(),
  amount: z.number(),
  balance_after: z.number(),
  description: z.string().nullish(),
  created_at: z.string(),
  credit_id: z.string().nullish(),
})
export type Operation = z.infer<typeof OperationSchema>

export const AccountListResponseSchema = z.object({
  accounts: z.array(AccountSchema),
  pageNumber: z.number(),
  pageQuantity: z.number(),
})
export type AccountListResponse = z.infer<typeof AccountListResponseSchema>

export const OperationListResponseSchema = z.object({
  operations: z.array(OperationSchema),
  pageNumber: z.number(),
  pageQuantity: z.number(),
})
export type OperationListResponse = z.infer<typeof OperationListResponseSchema>

export type GetAccountsParams = {
  client_id?: string
  status?: 'active' | 'closed'
  page?: number
  page_size?: number
}

export type GetOperationsParams = {
  page?: number
  page_size?: number
}

export type CreateAccountRequest = {
  client_id: string
  currency?: 'RUB' | 'USD' | 'EUR'
}

export type ChangeBalanceRequest = {
  amount: number
}

export type TransferRequest = {
  from_account_id: string
  to_account_id?: string
  to_account_number?: string
  amount: number
}

export const TransferResponseSchema = z.object({
  debit_operation: OperationSchema,
  credit_operation: OperationSchema,
})
export type TransferResponse = z.infer<typeof TransferResponseSchema>

export const TransferPreviewResponseSchema = z.object({
  from_account_id: z.string(),
  to_account_id: z.string(),
  to_account_number: z.string().optional(),
  from_currency: CurrencySchema,
  to_currency: CurrencySchema,
  debit_amount: z.number(),
  credit_amount: z.number(),
  rate: z.number(),
})
export type TransferPreviewResponse = z.infer<typeof TransferPreviewResponseSchema>
