'use client'

import { useState, useEffect, useCallback } from 'react'
import { FunnelByCityResponse, PipelineType } from '@/types'
import { apiFetch } from '@/lib/api'

export function useFunnelByCity(
  city:         string | null,
  since:        string,
  until:        string,
  pipelineType: PipelineType = 'registro',
  campaignIds?: string[]
) {
  const [data, setData]         = useState<FunnelByCityResponse | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const campaignKey = campaignIds?.join(',') ?? ''

  const fetch_ = useCallback(async () => {
    if (!city) { setData(null); return }
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        city,
        since,
        until,
        pipeline_type: pipelineType,
      })
      if (campaignKey) params.set('campaign_ids', campaignKey)
      const res = await apiFetch(`/api/dashboard/funnel?${params}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [city, since, until, pipelineType, campaignKey])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, isLoading, error, refetch: fetch_ }
}
