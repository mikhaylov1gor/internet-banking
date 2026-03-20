export type Account = {
  id: string
  client_id: string
  balance: number
  currency?: 'RUB' | 'USD' | 'EUR'
  status: 'active' | 'closed'
  opened_at: string
  closed_at?: string
}

export type Operation = {
  id: string
  account_id: string
  type: string
  amount: number
  balance_after: number
  description?: string
  created_at: string
  credit_id?: string
}

export type AccountListResponse = {
  accounts: Account[]
  pageNumber: number
  pageQuantity: number
}

export type OperationListResponse = {
  operations: Operation[]
  pageNumber: number
  pageQuantity: number
}

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
