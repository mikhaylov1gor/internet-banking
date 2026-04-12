import { z } from 'zod'
import { API_BASE_URL } from './api-base-url'
import { getClientTelemetryServiceLabel } from './telemetry-service-id'

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

const TELEMETRY_RETRY_MAX = 3

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const buildTelemetryEntry = (input: {
  endpoint: string
  method: string
  statusCode: number
  durationMs: number
  traceId?: string
  errorMsg?: string
}): ClientTelemetryEntry => ({
  service: getClientTelemetryServiceLabel(),
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
  const traceId = crypto.randomUUID()
  const idempotencyKey = crypto.randomUUID()

  for (let attempt = 0; attempt < TELEMETRY_RETRY_MAX; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'trace-id': traceId,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(parsed.data),
      })
      if (res.ok) {
        return
      }
      if (res.status >= 400 && res.status < 500) {
        return
      }
    } catch {
      /* retry */
    }
    if (attempt < TELEMETRY_RETRY_MAX - 1) {
      await sleep(Math.min(8000, 400 * 2 ** attempt))
    }
  }
}

export const enqueueClientTelemetry = (entries: ClientTelemetryEntry[]): void => {
  void sendClientTelemetry(entries).catch(() => {})
}
