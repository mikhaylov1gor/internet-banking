import { z } from 'zod'

export const AppTypeSchema = z.enum(['client', 'employee'])
export type AppType = z.infer<typeof AppTypeSchema>

export const ThemeSchema = z.enum(['light', 'dark'])

export const AppSettingsSchema = z.object({
  app_type: AppTypeSchema,
  theme: ThemeSchema,
  hidden_account_ids: z.array(z.string()),
})

export type AppSettings = z.infer<typeof AppSettingsSchema>

export type UpdateAppSettingsRequest = {
  theme: 'light' | 'dark'
  hidden_account_ids: string[]
}
