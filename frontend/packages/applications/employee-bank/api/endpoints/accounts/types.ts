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
}

export type GetAccountsParams = {
  client_id?: string
  status?: 'active' | 'closed'
  limit?: number
  offset?: number
}

export type GetOperationsParams = {
  limit?: number
  offset?: number
}

export type CreateAccountRequest = {
  currency?: 'RUB' | 'USD' | 'EUR'
}


