'use client'

import { useState, useEffect } from 'react'
import { ClaseSummaryRow } from '@/types'
import { apiFetch } from '@/lib/api'

export function useClasesSummary() {
  const [rows, setRows]         = useState<ClaseSummaryRow[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch('/api/clase/summary')
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  return { rows, isLoading }
}
