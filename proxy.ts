import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/api/tracking/pageview']

const TRACKING_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Tracking pixel: responder CORS preflight directo y dejar pasar el POST
  if (pathname === '/api/tracking/pageview') {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: TRACKING_CORS_HEADERS })
    }
    const response = NextResponse.next({ request })
    for (const [k, v] of Object.entries(TRACKING_CORS_HEADERS)) {
      response.headers.set(k, v)
    }
    return response
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar la sesión — imprescindible para que los Server Components
  // reciban una sesión válida.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  // Usuario no autenticado intentando acceder a ruta protegida
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Usuario autenticado en /login sin errores → al dashboard
  // Si hay un ?error= en la URL es porque la app lo puso intencionalmente
  // (ej. no_profile), no redirigir o se crea un loop infinito.
  const hasError = request.nextUrl.searchParams.has('error')
  if (user && pathname === '/login' && !hasError) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
