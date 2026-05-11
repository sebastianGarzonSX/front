'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

export interface MetaPixel {
  id:             string
  name:           string
  account_id:     string
  account_label:  string
  creation_time?: number
}

export function useMetaPixels() {
  const [pixels, setPixels]     = useState<MetaPixel[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/meta/pixels')
      .then(async (r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        const data = await r.json() as { pixels: MetaPixel[] }
        setPixels(data.pixels)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error desconocido'))
      .finally(() => setLoading(false))
  }, [])

  return { pixels, isLoading, error }
}
