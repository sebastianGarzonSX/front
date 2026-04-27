'use client'

import { useState, useEffect } from 'react'
import { DashboardKPIs } from '@/types'
import { apiFetch } from '@/lib/api'

/**
 * Hook para obtener los KPIs agregados del dashboard.
 *
 * ENDPOINT REQUERIDO: GET /api/dashboard/kpis
 * Headers: Authorization: Bearer <supabase-jwt>  (manejado por el cliente Supabase)
 *
 * Respuesta esperada: DashboardKPIs (ver types/index.ts)
 *
 * El backend debe:
 *  1. Verificar la sesión Supabase del usuario.
 *  2. Agregar datos desde las tablas `leads` y `opportunities`.
 *  3. Retornar el objeto DashboardKPIs completo.
 *  4. Cachear el resultado 15 minutos (o usar revalidación ISR en Next.js).
 */
export function useDashboardKPIs() {
  const [data, setData] = useState<DashboardKPIs | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchKPIs() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await apiFetch('/api/dashboard/kpis')

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Error ${res.status}`)
        }

        const json: DashboardKPIs = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchKPIs()
    return () => { cancelled = true }
  }, [])

  return { data, isLoading, error }
}
