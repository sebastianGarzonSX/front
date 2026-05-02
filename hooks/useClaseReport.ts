'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClaseReport, MetaClaseData } from '@/types'
import { apiFetch } from '@/lib/api'

export function useClaseReport(tag: string | null, since: string, until: string) {
  const [report, setReport]       = useState<ClaseReport | null>(null)
  const [meta, setMeta]           = useState<MetaClaseData | null>(null)
  const [isLoading, setLoading]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!tag) { setReport(null); setMeta(null); return }
    setLoading(true)
    setError(null)
    try {
      const [resReport, resMeta] = await Promise.all([
        apiFetch(`/api/clase/report?tag=${encodeURIComponent(tag)}&since=${since}&until=${until}`),
        apiFetch(`/api/clase/meta?tag=${encodeURIComponent(tag)}&since=${since}&until=${until}`),
      ])
      if (!resReport.ok) throw new Error(`Error ${resReport.status}`)
      const [dataReport, dataMeta] = await Promise.all([resReport.json(), resMeta.json()])
      setReport(dataReport)
      setMeta(resMeta.ok ? dataMeta : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [tag, since, until])

  useEffect(() => { fetch_() }, [fetch_])

  return { report, meta, isLoading, error, refetch: fetch_ }
}
