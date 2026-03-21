import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { tokenStorage } from '@shared/utils'

const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY_MS = 1000

export const useAccountOperationsWsSync = (accountId: string | null, pageSize = 50): void => {
  const queryClient = useQueryClient()

  const invalidate = useCallback(() => {
    if (!accountId) return
    void queryClient.invalidateQueries({ queryKey: ['account-operations', accountId] })
    void queryClient.invalidateQueries({ queryKey: ['account', accountId] })
    void queryClient.invalidateQueries({ queryKey: ['accounts'] })
  }, [queryClient, accountId])

  useEffect(() => {
    if (!accountId) return

    let active = true
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectCount = 0

    const clearTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const disconnect = () => {
      clearTimer()
      if (ws) {
        const w = ws
        ws = null
        w.onopen = null
        w.onmessage = null
        w.onerror = null
        w.onclose = null
        w.close()
      }
    }

    const connect = () => {
      if (!active || !accountId) return
      disconnect()

      const token = tokenStorage.getAccessToken()
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const params = new URLSearchParams({ page_size: String(pageSize) })
      if (token) params.set('token', token)
      const url = `${wsProtocol}//${window.location.host}/ws/accounts/${accountId}/operations?${params}`

      const socket = new WebSocket(url)
      ws = socket

      socket.onopen = () => {
        if (!active) return
        reconnectCount = 0
      }

      socket.onmessage = (event: MessageEvent) => {
        if (!active) return
        try {
          const msg = JSON.parse(event.data as string) as { type?: string }
          if (msg.type === 'operation_created') {
            invalidate()
          }
        } catch {}
      }

      socket.onclose = () => {
        if (ws === socket) {
          ws = null
        }
        if (!active) return
        if (reconnectCount >= MAX_RECONNECT_ATTEMPTS) return
        reconnectCount += 1
        const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectCount - 1)
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      active = false
      disconnect()
    }
  }, [accountId, pageSize, invalidate])
}
