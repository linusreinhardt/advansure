import Link from 'next/link'
import type { AppTile } from '@/lib/apps'

export function AppGrid({ apps }: { apps: AppTile[] }) {
  if (apps.length === 0) {
    return <p className="muted">Aktuell sind keine Apps verfügbar.</p>
  }

  return (
    <div className="grid">
      {apps.map((app) => (
        <Link key={app.slug} href={app.href} className="tile">
          <span className="tile-icon" aria-hidden>
            {app.icon}
          </span>
          <span className="tile-title">{app.name}</span>
          <span className="tile-desc">{app.description}</span>
          {app.adminOnly && <span className="tile-tag">Admin</span>}
        </Link>
      ))}
    </div>
  )
}
