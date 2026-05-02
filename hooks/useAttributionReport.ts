'use client'

import { useState, useEffect, useCallback } from 'react'
import { AttributionReport } from '@/types'
import { apiFetch } from '@/lib/api'

export function useAttributionReport(since: string, until: string, tag?: string | null) {
  const [data, setData]         = useState<AttributionReport | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `/api/reports/attribution?since=${since}&until=${until}`
      if (tag) url += `&tag=${encodeURIComponent(tag)}`
      const res = await apiFetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Error ${res.status}`)
      }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [since, until, tag])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, isLoading, error, refetch: fetch_ }
}
