'use client'

import { useState, useEffect, useCallback } from 'react'
import { CalendarConfigResponse, CalendarAppointmentsResponse } from '@/types'
import { apiFetch } from '@/lib/api'

export function useCalendarSync(since: string, until: string, tag: string | null = null) {
  const [calendarId, setCalendarId]     = useState<string | null>(null)
  const [appointments, setAppointments] = useState<CalendarAppointmentsResponse | null>(null)
  const [isLoadingConfig, setLoadingConfig] = useState(true)
  const [isSyncing, setSyncing]         = useState(false)
  const [isSaving, setSaving]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Cargar config guardada
  useEffect(() => {
    apiFetch('/api/clase/calendar-config')
      .then(r => r.json())
      .then((d: CalendarConfigResponse) => setCalendarId(d.calendar_id))
      .catch(() => {})
      .finally(() => setLoadingConfig(false))
  }, [])

  // Sincronizar: llama al backend que a su vez llama a GHL
  const sync = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : ''
      const res = await apiFetch(
        `/api/clase/appointments?since=${since}&until=${until}${tagParam}`
      )
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data: CalendarAppointmentsResponse = await res.json()
      setAppointments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }, [since, until, tag])

  // Auto-sync cuando ya hay calendar configurado y cambian las fechas
  useEffect(() => {
    if (!calendarId || isLoadingConfig) return
    sync()
  }, [calendarId, isLoadingConfig, sync])

  // Guardar calendar_id
  const saveCalendarId = useCallback(async (id: string) => {
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch('/api/clase/calendar-config', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ calendar_id: id }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      setCalendarId(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    calendarId,
    appointments,
    isLoadingConfig,
    isSyncing,
    isSaving,
    error,
    sync,
    saveCalendarId,
  }
}
