import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Privilegierter Supabase-Client mit Service-Role-Key.
 *
 * ⚠️  ACHTUNG: Dieser Client umgeht Row Level Security vollständig und darf
 *     NUR serverseitig (Server-Actions / Route-Handler) verwendet werden.
 *     Das `import 'server-only'` erzwingt einen Build-Fehler, falls dieses
 *     Modul versehentlich in Client-Code importiert wird – der Key kann so
 *     niemals im Browser landen.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase-Admin-Client: NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
