'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

interface LpViewsResponse {
  tag:          string
  lp_views:     number
  unique_views: number | null
  updated_at:   string | null
}

interface SnippetResponse {
  tag:     string
  snippet: string
}

export function useLpViews(tag: string | null) {
  const [views, setViews]               = useState<number | null>(null)
  const [uniqueViews, setUniqueViews]   = useState<number | null>(null)
  const [updatedAt, setUpdatedAt]       = useState<string | null>(null)
  const [isLoading, setLoading]         = useState(false)
  const [snippet, setSnippet]           = useState<string | null>(null)
  const [snippetLoading, setSnippetLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tag) { setViews(null); setUniqueViews(null); setUpdatedAt(null); setError(null); return }
    setLoading(true); setError(null)
    apiFetch(`/api/tracking/lp-views?tag=${encodeURIComponent(tag)}`)
      .then(async r => {
        if (!r.ok) {
          const body = await r.text().catch(() => '')
          throw new Error(`lp-views ${r.status}: ${body}`)
        }
        return r.json()
      })
      .then((d: LpViewsResponse) => {
        setViews(d.lp_views)
        setUniqueViews(d.unique_views)
        setUpdatedAt(d.updated_at)
      })
      .catch((e) => { setError(e instanceof Error ? e.message : String(e)) })
      .finally(() => setLoading(false))
  }, [tag])

  const loadSnippet = useCallback(async () => {
    if (!tag) return
    setSnippetLoading(true)
    try {
      const res = await apiFetch(`/api/tracking/snippet?tag=${encodeURIComponent(tag)}`)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`snippet ${res.status}: ${body}`)
      }
      const data: SnippetResponse = await res.json()
      setSnippet(data.snippet)
    } catch (e) {
      console.error('[useLpViews] snippet error:', e)
      setSnippet(null)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSnippetLoading(false)
    }
  }, [tag])

  useEffect(() => {
    setSnippet(null)
  }, [tag])

  return { views, uniqueViews, updatedAt, isLoading, error, snippet, snippetLoading, loadSnippet }
}
