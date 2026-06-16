import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CreateUserForm } from './create-user-form'
import { UsersTable } from './users-table'
import type { Profile } from '@/types/db'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('profiles')
    .select('id, email, role, created_at, updated_at')
    .order('created_at', { ascending: true })

  const users = (data ?? []) as Profile[]

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner container">
          <div className="brand">
            <span className="brand-mark">A</span>
            <span className="brand-name">Benutzerverwaltung</span>
          </div>
          <Link href="/" className="btn btn-ghost">
            ← Zur Übersicht
          </Link>
        </div>
      </header>

      <main className="container stack">
        <section className="card">
          <h2 className="card-title">Neuen Account anlegen</h2>
          <p className="muted">
            Legt einen neuen Benutzer mit E-Mail, Passwort und Rolle an. Die
            Erstellung läuft serverseitig über den Service-Role-Key.
          </p>
          <CreateUserForm />
        </section>

        <section className="card">
          <h2 className="card-title">Benutzer ({users.length})</h2>
          <UsersTable users={users} currentUserId={user?.id ?? ''} />
        </section>
      </main>
    </div>
  )
}
