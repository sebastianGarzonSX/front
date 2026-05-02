'use client'

import { useState, useEffect } from 'react'
import { EventTag } from '@/types'
import { apiFetch } from '@/lib/api'

export function useEventTags() {
  const [tags, setTags]         = useState<EventTag[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch('/api/reports/events')
      .then((r) => r.json())
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false))
  }, [])

  return { tags, isLoading }
}
