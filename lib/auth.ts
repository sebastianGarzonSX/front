import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UserProfile } from '@/types'
import { redirect } from 'next/navigation'

/**
 * Obtiene el perfil completo del usuario autenticado desde un Server Component.
 * Si no hay sesión, redirige a /login.
 *
 * Usa dos clientes Supabase con propósitos distintos:
 *  - createClient()      → verifica el JWT del usuario (respeta cookies de sesión)
 *  - createAdminClient() → lee el perfil de public.users con service role,
 *                          bypasseando RLS. Seguro porque este código solo
 *                          corre en el servidor.
 */
export async function getAuthenticatedUser(): Promise<UserProfile> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Admin client para bypasear RLS — el JWT ya fue verificado arriba.
  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('id, name, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login?error=no_profile')
  }

  return {
    id: user.id,
    email: user.email!,
    name: profile.name,
    role: profile.role,
    created_at: user.created_at,
  }
}

/**
 * Obtiene el usuario autenticado sin redirigir.
 * Retorna null si no hay sesión activa.
 * Usar en layouts donde el usuario puede o no estar logueado.
 */
export async function getOptionalUser(): Promise<UserProfile | null> {
  try {
    return await getAuthenticatedUser()
  } catch {
    return null
  }
}
