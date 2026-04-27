'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * Fetch autenticado para el backend API.
 *
 * Lee el token de sesión de Supabase y lo adjunta en el header Authorization.
 * Úsalo en todos los hooks del dashboard en lugar de `fetch()` directamente.
 *
 * Ejemplo:
 *   const res = await apiFetch('/api/dashboard/kpis')
 *   const data = await res.json()
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
  }

  return fetch(path, { ...options, headers })
}
