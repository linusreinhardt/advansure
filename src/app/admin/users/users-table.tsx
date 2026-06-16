import type { Profile } from '@/types/db'
import { deleteUser, updateUserRole } from './actions'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: Profile[]
  currentUserId: string
}) {
  if (users.length === 0) {
    return <p className="muted">Noch keine Benutzer vorhanden.</p>
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>E-Mail</th>
            <th>Rolle</th>
            <th>Erstellt</th>
            <th className="ta-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId
            return (
              <tr key={u.id}>
                <td>
                  {u.email}
                  {isSelf && <span className="badge badge-self">Sie</span>}
                </td>
                <td>
                  <span
                    className={`badge ${u.role === 'admin' ? 'badge-admin' : ''}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="muted">{formatDate(u.created_at)}</td>
                <td>
                  <div className="row-actions">
                    <form action={updateUserRole} className="inline-form">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="input input-sm"
                        aria-label={`Rolle von ${u.email}`}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                      <button type="submit" className="btn btn-sm">
                        Speichern
                      </button>
                    </form>
                    {!isSelf && (
                      <form action={deleteUser} className="inline-form">
                        <input type="hidden" name="id" value={u.id} />
                        <button type="submit" className="btn btn-sm btn-danger">
                          Löschen
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
