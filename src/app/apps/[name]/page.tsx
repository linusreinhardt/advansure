import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAppByRoute } from '@/lib/apps'

export default async function AppPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const app = getAppByRoute(name)

  if (!app) {
    notFound()
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner container">
          <div className="brand">
            <span className="brand-mark">L</span>
            <span className="brand-name">{app.name}</span>
          </div>
          <Link href="/" className="btn btn-ghost">
            ← Zur Übersicht
          </Link>
        </div>
      </header>
      <main className="container">
        <section className="card placeholder">
          <span className="tile-icon" aria-hidden>
            {app.icon}
          </span>
          <h1>{app.name}</h1>
          <p className="muted">{app.description}</p>
          <p>
            Diese App ist ein Platzhalter. Inhalt und Logik gehören in{' '}
            <code>src/app/apps/{name}/page.tsx</code> bzw. eine eigene Route.
          </p>
        </section>
      </main>
    </div>
  )
}
