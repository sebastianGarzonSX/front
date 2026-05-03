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

  useEffect(() => {
    if (!tag) { setViews(null); setUniqueViews(null); setUpdatedAt(null); return }
    setLoading(true)
    apiFetch(`/api/tracking/lp-views?tag=${encodeURIComponent(tag)}`)
      .then(r => r.json())
      .then((d: LpViewsResponse) => {
        setViews(d.lp_views)
        setUniqueViews(d.unique_views)
        setUpdatedAt(d.updated_at)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tag])

  const loadSnippet = useCallback(async () => {
    if (!tag) return
    setSnippetLoading(true)
    try {
      const res = await apiFetch(`/api/tracking/snippet?tag=${encodeURIComponent(tag)}`)
      const data: SnippetResponse = await res.json()
      setSnippet(data.snippet)
    } catch {
      setSnippet(null)
    } finally {
      setSnippetLoading(false)
    }
  }, [tag])

  useEffect(() => {
    setSnippet(null)
  }, [tag])

  return { views, uniqueViews, updatedAt, isLoading, snippet, snippetLoading, loadSnippet }
}
