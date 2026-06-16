import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Zusätzliche Absicherung des Admin-Bereichs (Defense in Depth).
 * Die Middleware schützt /admin/* bereits anhand der Rolle – diese serverseitige
 * Prüfung stellt sicher, dass auch bei direktem Rendern nur Admins Zugriff haben.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}
