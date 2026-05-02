'use client'

import { useState, useEffect, useCallback } from 'react'
import { SurveyBreakdownResponse } from '@/types'
import { apiFetch } from '@/lib/api'

export function useSurveyBreakdown(
  since: string,
  until: string,
  city?: string | null
) {
  const [data, setData]         = useState<SurveyBreakdownResponse | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ since, until })
      if (city) params.set('city', city)
      const res = await apiFetch(`/api/dashboard/survey?${params}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [since, until, city])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, isLoading, error, refetch: fetch_ }
}
