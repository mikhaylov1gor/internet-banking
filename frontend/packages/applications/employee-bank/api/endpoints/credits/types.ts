export type Credit = {
  id: string
  client_id: string
  tariff_id: string
  amount: number
  remaining: number
  rate: number
  daily_payment: number
  status: 'active' | 'paid'
  issued_at: string
  paid_at?: string
}

export type GetCreditsParams = {
  client_id?: string
  limit?: number
  offset?: number
}


