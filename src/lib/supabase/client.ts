import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase-Client für Client-Komponenten (Browser).
 * Verwendet ausschließlich den öffentlichen Anon-Key. RLS bleibt aktiv.
 * (Aktuell läuft alles serverseitig – dieser Client steht für künftige
 *  Apps bereit, die clientseitig Daten laden wollen.)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
