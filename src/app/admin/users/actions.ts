'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/types/db'

function isValidRole(value: string): value is Role {
  return value === 'admin' || value === 'user'
}

/**
 * Stellt sicher, dass der aufrufende Nutzer Admin ist (Defense in Depth –
 * unabhängig von der Middleware). Wirft bei fehlender Berechtigung.
 */
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Nicht authentifiziert.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Keine Berechtigung.')
  }

  return { currentUserId: user.id }
}

export type CreateUserState = { error?: string; success?: string }

/**
 * Legt über den Service-Role-Key (nur serverseitig!) einen neuen Account an.
 * Der DB-Trigger erzeugt automatisch ein Profil; der anschließende Upsert
 * sichert die korrekte Rolle ab.
 */
export async function createUser(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  try {
    await requireAdmin()
  } catch (error) {
    return { error: (error as Error).message }
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'user')

  if (!email || !password) {
    return { error: 'E-Mail und Passwort sind erforderlich.' }
  }
  if (password.length < 8) {
    return { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' }
  }
  if (!isValidRole(role)) {
    return { error: 'Ungültige Rolle.' }
  }

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // direkt nutzbar, ohne E-Mail-Bestätigung
    user_metadata: { role },
  })

  if (error || !data.user) {
    return { error: error?.message ?? 'Benutzer konnte nicht angelegt werden.' }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id: data.user.id, email, role }, { onConflict: 'id' })

  if (profileError) {
    return { error: profileError.message }
  }

  revalidatePath('/admin/users')
  return { success: `Benutzer „${email}“ wurde angelegt.` }
}

/** Ändert die Rolle eines Benutzers. */
export async function updateUserRole(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const role = String(formData.get('role') ?? '')

  if (!id || !isValidRole(role)) {
    throw new Error('Ungültige Eingabe.')
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
  // Rolle zusätzlich in den User-Metadaten spiegeln (Konsistenz).
  await admin.auth.admin.updateUserById(id, { user_metadata: { role } })

  revalidatePath('/admin/users')
}

/** Löscht einen Benutzer (Profil folgt per ON DELETE CASCADE). */
export async function deleteUser(formData: FormData): Promise<void> {
  const { currentUserId } = await requireAdmin()

  const id = String(formData.get('id') ?? '')
  if (!id) {
    throw new Error('Ungültige Eingabe.')
  }
  if (id === currentUserId) {
    throw new Error('Sie können sich nicht selbst löschen.')
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/users')
}
