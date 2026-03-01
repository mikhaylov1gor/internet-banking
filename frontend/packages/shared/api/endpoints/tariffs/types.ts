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
  min_amount?: number
  max_amount?: number
}

export type TariffListResponse = {
  tariffs: CreditTariff[]
  pageNumber: number
  pageQuantity: number
}

export type GetTariffsParams = {
  page?: number
  page_size?: number
}
