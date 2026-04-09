import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { redirectToSso, tokenStorage } from '@shared/utils'

export const API_BASE_URL =
  process.env.NODE_ENV === 'development' ? '/api' : (process.env.API_BASE_URL || 'http://localhost:8080')

const RefreshTokenBodySchema = z.object({
  token: z.string(),
  refresh_token: z.string(),
})

export const jsonPublicClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
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
          originalRequest.headers.Authorization = `Bearer ${parsed.token}`
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

    return Promise.reject(error)
  }
)
