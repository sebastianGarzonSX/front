'use client'

import { useState, useEffect, useCallback } from 'react'
import { PixelEventsResponse } from '@/types'
import { apiFetch } from '@/lib/api'

export function usePixelEvents(tag: string | null, since: string, until: string) {
  const [data, setData]         = useState<PixelEventsResponse | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : ''
      const res = await apiFetch(`/api/clase/pixel-events?since=${since}&until=${until}${tagParam}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [tag, since, until])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, isLoading, error, refetch: fetch_ }
}
