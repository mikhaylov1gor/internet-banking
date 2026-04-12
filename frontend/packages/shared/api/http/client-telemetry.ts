import { z } from 'zod'
import { API_BASE_URL } from './api-base-url'

const ClientLogEntrySchema = z.object({
  service: z.string(),
  trace_id: z.string().optional(),
  endpoint: z.string(),
  method: z.string(),
  status_code: z.number(),
  duration_ms: z.number(),
  timestamp: z.string().optional(),
  error_msg: z.string().optional(),
})

export type ClientTelemetryEntry = z.infer<typeof ClientLogEntrySchema>

const telemetryServiceName = (): string => {
  if (typeof window === 'undefined') return 'web-client'
  return window.location.port === '5173' ? 'employee-web' : 'web-client'
}

export const buildTelemetryEntry = (input: {
  endpoint: string
  method: string
  statusCode: number
  durationMs: number
  traceId?: string
  errorMsg?: string
}): ClientTelemetryEntry => ({
  service: telemetryServiceName(),
  trace_id: input.traceId,
  endpoint: input.endpoint,
  method: input.method,
  status_code: input.statusCode,
  duration_ms: input.durationMs,
  timestamp: new Date().toISOString(),
  error_msg: input.errorMsg,
})

export const sendClientTelemetry = async (entries: ClientTelemetryEntry[]): Promise<void> => {
  if (entries.length === 0) return
  const parsed = z.array(ClientLogEntrySchema).safeParse(entries)
  if (!parsed.success) return
  const url = `${API_BASE_URL}/monitoring/client-logs`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  })
}

export const enqueueClientTelemetry = (entries: ClientTelemetryEntry[]): void => {
  void sendClientTelemetry(entries).catch(() => {})
}
