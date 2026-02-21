import { useEffect, useRef, useState, useCallback } from 'react'
import { WS_URL } from '@/api/client'
import type { NodeStat } from '@/types'

export function useClusterStats(enabled = true) {
  const [nodes, setNodes] = useState<NodeStat[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!enabled) return
    const ws = new WebSocket(`${WS_URL}/ws/stats`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (Array.isArray(data)) setNodes(data)
      } catch { /* ignore malformed frames */ }
    }
    ws.onclose = () => {
      setConnected(false)
      retryRef.current = setTimeout(connect, 3000)
    }
    ws.onerror = () => ws.close()
  }, [enabled])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [connect])

  return { nodes, connected }
}
