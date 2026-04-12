import './axios-augmentation'
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { z } from 'zod'
import { redirectToSso, tokenStorage } from '@shared/utils'
import { API_BASE_URL } from './api-base-url'
import { buildTelemetryEntry, enqueueClientTelemetry } from './client-telemetry'
import {
  circuitBreakerIsOpen,
  circuitBreakerRecord,
  isCircuitExcludedPath,
} from './circuit-breaker'
import { CircuitBreakerOpenError } from '../api-error'

export { API_BASE_URL } from './api-base-url'

const RefreshTokenBodySchema = z.object({
  token: z.string(),
  refresh_token: z.string(),
})

const RETRY_MAX = 3
const mutatingMethods = new Set(['post', 'put', 'patch', 'delete'])

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const requestPath = (config: InternalAxiosRequestConfig): string => {
  try {
    const u = new URL(config.url || '', config.baseURL || API_BASE_URL)
    return u.pathname + u.search
  } catch {
    return config.url || ''
  }
}

const shouldRetryStatus = (status: number | undefined): boolean => {
  if (status === undefined) return true
  return status >= 500 && status <= 599
}

const shouldCountCircuitFailure = (error: AxiosError): boolean => {
  const s = error.response?.status
  if (s === undefined) return error.code === 'ERR_NETWORK'
  return s >= 500
}

const readApiErrorBodyMessage = (error: AxiosError): string | undefined => {
  const data = error.response?.data
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    return (data as { error: string }).error
  }
  return undefined
}

const attachTraceAndIdempotency = (config: InternalAxiosRequestConfig): void => {
  const headers = AxiosHeaders.from(config.headers)
  const existingTrace = headers.get('trace-id')
  const traceId =
    typeof existingTrace === 'string' && existingTrace.trim() !== '' ? existingTrace : crypto.randomUUID()
  if (!existingTrace) {
    headers.set('trace-id', traceId)
  }
  const method = (config.method || 'get').toLowerCase()
  if (mutatingMethods.has(method) && !headers.get('Idempotency-Key')) {
    headers.set('Idempotency-Key', crypto.randomUUID())
  }
  config.headers = headers
  const resolvedTrace =
    typeof headers.get('trace-id') === 'string' ? (headers.get('trace-id') as string) : traceId
  config.metadata = {
    startTime: performance.now(),
    traceId: resolvedTrace,
  }
}

const emitTelemetryForConfig = (
  config: InternalAxiosRequestConfig | undefined,
  statusCode: number,
  errorMsg?: string
): void => {
  if (!config?.metadata) return
  const path = requestPath(config)
  const durationMs = Math.round(performance.now() - config.metadata.startTime)
  const entry = buildTelemetryEntry({
    endpoint: path,
    method: (config.method || 'get').toUpperCase(),
    statusCode,
    durationMs,
    traceId: config.metadata.traceId,
    errorMsg,
  })
  enqueueClientTelemetry([entry])
}

const applyRequestGuards = (config: InternalAxiosRequestConfig): void => {
  const path = requestPath(config)
  if (circuitBreakerIsOpen() && !isCircuitExcludedPath(path)) {
    throw new CircuitBreakerOpenError()
  }
  attachTraceAndIdempotency(config)
}

export const jsonPublicClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

jsonPublicClient.interceptors.request.use(
  (config) => {
    applyRequestGuards(config)
    return config
  },
  (error: unknown) => Promise.reject(error)
)

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

refreshClient.interceptors.request.use(
  (config) => {
    applyRequestGuards(config)
    return config
  },
  (error: unknown) => Promise.reject(error)
)

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    applyRequestGuards(config)
    const token = tokenStorage.getAccessToken()
    if (token) {
      const headers = AxiosHeaders.from(config.headers)
      headers.set('Authorization', `Bearer ${token}`)
      config.headers = headers
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

type QueueEntry = {
  resolve: (token: string) => void
  reject: (reason?: unknown) => void
}

let isRefreshing = false
let failedQueue: QueueEntry[] = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token !== null) {
      prom.resolve(token)
    } else {
      prom.reject(new Error('Token refresh failed'))
    }
  })
  failedQueue = []
}

const withRetry = async (
  instance: AxiosInstance,
  error: AxiosError,
  cfg: InternalAxiosRequestConfig
): Promise<AxiosResponse> => {
  const path = requestPath(cfg)
  const status = error.response?.status
  const retryable = shouldRetryStatus(status) || error.code === 'ERR_NETWORK'

  if (!retryable || (cfg._retryCount ?? 0) >= RETRY_MAX) {
    if (shouldCountCircuitFailure(error)) circuitBreakerRecord(false, path)
    throw error
  }

  if (shouldCountCircuitFailure(error)) circuitBreakerRecord(false, path)

  cfg._retryCount = (cfg._retryCount ?? 0) + 1
  const backoffMs = Math.min(8000, 400 * 2 ** (cfg._retryCount - 1))

  await sleep(backoffMs)

  if (circuitBreakerIsOpen() && !isCircuitExcludedPath(path)) {
    circuitBreakerRecord(false, path)
    throw new CircuitBreakerOpenError()
  }

  try {
    return await instance.request(cfg)
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      return withRetry(instance, e, cfg)
    }
    throw e
  }
}

const attachResponseSide = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response) => {
      const path = requestPath(response.config)
      circuitBreakerRecord(true, path)
      emitTelemetryForConfig(response.config, response.status)
      const headerTrace = response.headers['trace-id']
      if (typeof headerTrace === 'string' && response.config.metadata) {
        response.config.metadata.traceId = headerTrace
      }
      return response
    },
    async (error: unknown) => {
      if (error instanceof CircuitBreakerOpenError) {
        return Promise.reject(error)
      }
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error)
      }
      const cfg = error.config as InternalAxiosRequestConfig | undefined
      const path = cfg ? requestPath(cfg) : ''
      if (cfg?.metadata) {
        emitTelemetryForConfig(cfg, error.response?.status ?? 0, readApiErrorBodyMessage(error))
      }
      if (!cfg) {
        return Promise.reject(error)
      }
      const retryable = shouldRetryStatus(error.response?.status) || error.code === 'ERR_NETWORK'
      if (retryable) {
        try {
          return await withRetry(instance, error, cfg)
        } catch (e) {
          return Promise.reject(e)
        }
      }
      if (shouldCountCircuitFailure(error)) circuitBreakerRecord(false, path)
      return Promise.reject(error)
    }
  )
}

attachResponseSide(jsonPublicClient)
attachResponseSide(refreshClient)

apiClient.interceptors.response.use(
  (response) => {
    const path = requestPath(response.config)
    circuitBreakerRecord(true, path)
    emitTelemetryForConfig(response.config, response.status)
    const headerTrace = response.headers['trace-id']
    if (typeof headerTrace === 'string' && response.config.metadata) {
      response.config.metadata.traceId = headerTrace
    }
    return response
  },
  async (error: unknown) => {
    if (error instanceof CircuitBreakerOpenError) {
      return Promise.reject(error)
    }
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error)
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const path = originalRequest ? requestPath(originalRequest) : ''

    if (originalRequest?.metadata) {
      emitTelemetryForConfig(
        originalRequest,
        error.response?.status ?? 0,
        readApiErrorBodyMessage(error)
      )
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              const headers = AxiosHeaders.from(originalRequest.headers)
              headers.set('Authorization', `Bearer ${token}`)
              originalRequest.headers = headers
            }
            return apiClient(originalRequest)
          })
          .catch((err: unknown) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshTokenValue = tokenStorage.getRefreshToken()

      if (!refreshTokenValue) {
        processQueue(new Error('No refresh token'), null)
        tokenStorage.clear()
        redirectToSso()
        return Promise.reject(error)
      }

      try {
        const response = await refreshClient.post('/auth/refresh', {
          refresh_token: refreshTokenValue,
        })

        const parsed = RefreshTokenBodySchema.parse(response.data)

        tokenStorage.setTokens({
          accessToken: parsed.token,
          refreshToken: parsed.refresh_token,
          userId: tokenStorage.getUserId() || '',
          userType: tokenStorage.getUserType() || '',
        })

        if (originalRequest.headers) {
          const headers = AxiosHeaders.from(originalRequest.headers)
          headers.set('Authorization', `Bearer ${parsed.token}`)
          originalRequest.headers = headers
        }

        processQueue(null, parsed.token)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError instanceof Error ? refreshError : new Error('Refresh failed'), null)
        tokenStorage.clear()
        redirectToSso()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const retryable = shouldRetryStatus(error.response?.status) || error.code === 'ERR_NETWORK'

    if (retryable && originalRequest) {
      try {
        return await withRetry(apiClient, error, originalRequest)
      } catch (e) {
        return Promise.reject(e)
      }
    }

    if (shouldCountCircuitFailure(error) && path) circuitBreakerRecord(false, path)

    return Promise.reject(error)
  }
)
