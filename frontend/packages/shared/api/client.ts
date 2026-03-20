import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { redirectToAuth, tokenStorage } from '@shared/utils'

const API_BASE_URL = process.env.NODE_ENV === 'development' ? '/api' : (process.env.API_BASE_URL || 'http://localhost:8080')

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
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
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
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshTokenValue = tokenStorage.getRefreshToken()

      if (!refreshTokenValue) {
        processQueue(new Error('No refresh token'), null)
        tokenStorage.clear()
        redirectToAuth()
        return Promise.reject(error)
      }

      try {
        const response = await refreshClient.post('/auth/refresh', {
          refresh_token: refreshTokenValue,
        })

        const { token, refresh_token } = response.data
        tokenStorage.setTokens({
          accessToken: token,
          refreshToken: refresh_token,
          userId: tokenStorage.getUserId() || '',
          userType: tokenStorage.getUserType() || '',
        })

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }

        processQueue(null, token)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as Error, null)
        tokenStorage.clear()
        redirectToAuth()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
