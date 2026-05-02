'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdsPreviewResponse } from '@/types'
import { apiFetch } from '@/lib/api'

export function useAdsPreview(since: string, until: string) {
  const [data, setData]         = useState<AdsPreviewResponse | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ since, until })
      const res = await apiFetch(`/api/dashboard/ads-preview?${params}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [since, until])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, isLoading, error, refetch: fetch_ }
}
