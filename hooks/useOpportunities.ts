'use client'

import { useState, useEffect, useCallback } from 'react'
import { Opportunity, OpportunitiesFilters, PaginatedResponse, PipelineStage } from '@/types'
import { apiFetch } from '@/lib/api'

/**
 * Hook para listar oportunidades paginadas.
 *
 * ENDPOINT REQUERIDO: GET /api/opportunities
 * Query params: page, limit, status, pipeline_id, stage_name, date_from, date_to
 * Respuesta esperada: PaginatedResponse<Opportunity>  (ver types/index.ts)
 *
 * El backend debe:
 *  1. Verificar sesión Supabase.
 *  2. Aplicar filtros a la tabla `opportunities` (con JOIN a `leads` para nombre).
 *  3. Para viewer: no incluir el campo `value`.
 *  4. Retornar paginado.
 */
export function useOpportunities(filters: OpportunitiesFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<Opportunity> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (filters.page)        params.set('page',        String(filters.page))
    if (filters.limit)       params.set('limit',       String(filters.limit))
    if (filters.status)      params.set('status',      filters.status)
    if (filters.pipeline_id) params.set('pipeline_id', filters.pipeline_id)
    if (filters.stage_name)  params.set('stage_name',  filters.stage_name)
    if (filters.date_from)   params.set('date_from',   filters.date_from)
    if (filters.date_to)     params.set('date_to',     filters.date_to)

    try {
      const res = await apiFetch(`/api/opportunities?${params.toString()}`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Error ${res.status}`)
      }

      const json: PaginatedResponse<Opportunity> = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.pipeline_id,
    filters.stage_name,
    filters.date_from,
    filters.date_to,
  ])

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  return { data, isLoading, error, refetch: fetchOpportunities }
}

/**
 * Hook para el gráfico de embudo del pipeline.
 *
 * ENDPOINT REQUERIDO: GET /api/opportunities/pipeline
 * Respuesta esperada: PipelineStage[]  (ver types/index.ts)
 *
 * El backend debe:
 *  1. Verificar sesión.
 *  2. Agrupar oportunidades abiertas por stage_name.
 *  3. Calcular count, total_value y percentage para cada stage.
 */
export function usePipelineStages() {
  const [data, setData] = useState<PipelineStage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchPipeline() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await apiFetch('/api/opportunities/pipeline')

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Error ${res.status}`)
        }

        const json: PipelineStage[] = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchPipeline()
    return () => { cancelled = true }
  }, [])

  return { data, isLoading, error }
}
