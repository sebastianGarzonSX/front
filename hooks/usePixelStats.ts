'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface PixelEventStat {
  event_name:   string
  count:        number
  unique_count?: number
}

export function usePixelStats(pixelId: string | null, since: string, until: string) {
  const [stats, setStats]       = useState<PixelEventStat[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!pixelId) { setStats([]); setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(
        `/api/meta/pixel-stats?pixel_id=${encodeURIComponent(pixelId)}&since=${since}&until=${until}`
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json() as { stats: PixelEventStat[] }
      setStats(data.stats)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setStats([])
    } finally {
      setLoading(false)
    }
  }, [pixelId, since, until])

  useEffect(() => { fetch_() }, [fetch_])

  return { stats, isLoading, error }
}
