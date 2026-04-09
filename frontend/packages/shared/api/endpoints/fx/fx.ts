import { jsonPublicClient } from '../../client'
import { parseApiResponse } from '../../parse-response'
import { FxConvertResponseSchema, type FxConvertRequest } from './types'

export const convertFx = async (body: FxConvertRequest) => {
  const response = await jsonPublicClient.post('/fx/convert', body)
  return parseApiResponse(FxConvertResponseSchema, response.data)
}
