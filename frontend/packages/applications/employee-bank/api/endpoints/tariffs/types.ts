export type CreditTariff = {
  id: string
  name: string
  rate: number
  min_amount?: number
  max_amount?: number
}

export type CreateTariffRequest = {
  name: string
  rate: number
  min_amount: number
  max_amount: number
}

export type GetTariffsParams = {
  limit?: number
  offset?: number
}


