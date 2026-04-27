import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para uso en Server Components, Server Actions y Route Handlers.
 * Lee y escribe cookies para mantener la sesión del usuario.
 * Solo usar en contexto de servidor (app/ directory, middleware).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — las cookies se setean en el middleware
          }
        },
      },
    }
  )
}

/**
 * Cliente con service role — SOLO para operaciones admin en Route Handlers.
 * NUNCA usar en el cliente ni exponer al browser.
 */
export function createAdminClient() {
  // Importación dinámica en runtime para evitar que el bundler del cliente
  // incluya SUPABASE_SERVICE_ROLE_KEY accidentalmente.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
