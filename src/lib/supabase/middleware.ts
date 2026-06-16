import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Pfade, die ohne Login erreichbar sind. */
const PUBLIC_PATHS = ['/login']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

/**
 * Erneuert die Supabase-Session und setzt die Zugriffsregeln durch:
 *  - nicht eingeloggt        -> Weiterleitung auf /login
 *  - eingeloggt auf /login   -> Weiterleitung auf /
 *  - /admin/*                -> nur für role = 'admin'
 */
export async function updateSession(request: NextRequest) {
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

  // WICHTIG: Zwischen dem Erstellen des Clients und getUser() keine Logik
  // einfügen – sonst kann es zu schwer auffindbaren Session-Bugs kommen.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 1) Nicht eingeloggt -> nur öffentliche Pfade erlaubt
  if (!user && !isPublicPath(pathname)) {
    return redirectTo(request, '/login', supabaseResponse)
  }

  // 2) Eingeloggt und auf /login -> zur Startseite
  if (user && pathname === '/login') {
    return redirectTo(request, '/', supabaseResponse)
  }

  // 3) Admin-Bereich -> Rolle prüfen (RLS erlaubt das Lesen des eigenen Profils)
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return redirectTo(request, '/', supabaseResponse)
    }
  }

  return supabaseResponse
}

/**
 * Baut eine Redirect-Antwort und überträgt die ggf. erneuerten Session-Cookies,
 * damit die Anmeldung beim Redirect nicht verloren geht.
 */
function redirectTo(
  request: NextRequest,
  pathname: string,
  base: NextResponse
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  const response = NextResponse.redirect(url)
  base.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}
