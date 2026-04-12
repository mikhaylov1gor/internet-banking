export {}

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number
      traceId: string
    }
    _retry?: boolean
    _retryCount?: number
  }
}
