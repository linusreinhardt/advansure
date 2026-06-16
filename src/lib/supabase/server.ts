import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase-Client für Server-Komponenten, Server-Actions und Route-Handler.
 * Nutzt den öffentlichen Anon-Key und liest/schreibt die Session über Cookies.
 * Row Level Security ist hier aktiv – der Client handelt im Namen des Users.
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
            // Aufruf aus einer Server-Komponente: Cookies sind dort read-only.
            // Das ist unkritisch – die Session wird in der Middleware erneuert.
          }
        },
      },
    }
  )
}
