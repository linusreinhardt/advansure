import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="auth-shell">
      <div className="card placeholder">
        <h1>404</h1>
        <p className="muted">Diese Seite wurde nicht gefunden.</p>
        <Link href="/" className="btn btn-primary">
          Zur Startseite
        </Link>
      </div>
    </div>
  )
}
