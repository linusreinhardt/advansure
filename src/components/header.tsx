import { logout } from '@/app/actions'
import type { Role } from '@/types/db'

export function Header({ email, role }: { email: string; role: Role }) {
  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span className="brand-name">Advansure</span>
        </div>
        <div className="user-area">
          <div className="user-meta">
            <span className="user-email">{email}</span>
            <span className={`badge ${role === 'admin' ? 'badge-admin' : ''}`}>
              {role}
            </span>
          </div>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost">
              Abmelden
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
