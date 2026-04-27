'use client'

import { useState, useEffect, useCallback } from 'react'
import { Lead, LeadsFilters, PaginatedResponse } from '@/types'
import { apiFetch } from '@/lib/api'

/**
 * Hook para listar leads paginados con filtros.
 *
 * ENDPOINT REQUERIDO: GET /api/leads
 * Query params: page, limit, stage, source, search, date_from, date_to
 * Respuesta esperada: PaginatedResponse<Lead>  (ver types/index.ts)
 *
 * El backend debe:
 *  1. Verificar sesión Supabase.
 *  2. Aplicar filtros a la tabla `leads` con Supabase query builder.
 *  3. Paginar con .range() o .limit()/.offset().
 *  4. Retornar { data: Lead[], meta: { total, page, limit, total_pages } }.
 */
export function useLeads(filters: LeadsFilters = {}) {
  const [data, setData] = useState<PaginatedResponse<Lead> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (filters.page)      params.set('page',      String(filters.page))
    if (filters.limit)     params.set('limit',     String(filters.limit))
    if (filters.stage)     params.set('stage',     filters.stage)
    if (filters.source)    params.set('source',    filters.source)
    if (filters.search)    params.set('search',    filters.search)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to)   params.set('date_to',   filters.date_to)

    try {
      const res = await apiFetch(`/api/leads?${params.toString()}`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Error ${res.status}`)
      }

      const json: PaginatedResponse<Lead> = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [
    filters.page,
    filters.limit,
    filters.stage,
    filters.source,
    filters.search,
    filters.date_from,
    filters.date_to,
  ])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  return { data, isLoading, error, refetch: fetchLeads }
}
