import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { visibleApps } from '@/lib/apps'
import { Header } from '@/components/header'
import { AppGrid } from '@/components/app-grid'
import type { Role } from '@/types/db'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Schutz greift bereits in der Middleware; hier zur Sicherheit erneut.
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('id', user.id)
    .single()

  const role: Role = profile?.role === 'admin' ? 'admin' : 'user'
  const email: string = profile?.email ?? user.email ?? ''

  return (
    <div className="page">
      <Header email={email} role={role} />
      <main className="container">
        <section className="hero">
          <h1>Willkommen zurück</h1>
          <p>Wähle eine Anwendung, um loszulegen.</p>
        </section>
        <AppGrid apps={visibleApps(role)} />
      </main>
    </div>
  )
}
