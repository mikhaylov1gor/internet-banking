import { z } from 'zod'

export function parseApiResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data)
}
