import type { Role } from '@/types/db'

/**
 * Zentrale Registry aller Apps, die im Launcher (Center-Screen) erscheinen.
 *
 * Neue App hinzufügen:
 *   1. Hier einen Eintrag ergänzen.
 *   2. Route anlegen – entweder generisch unter /apps/<slug>
 *      (siehe src/app/apps/[name]/page.tsx) oder eine eigene Route mit
 *      eigener Logik (wie /admin/users).
 */
export type AppTile = {
  /** Eindeutiger, URL-tauglicher Bezeichner. */
  slug: string
  /** Anzeigename auf der Kachel. */
  name: string
  /** Kurzbeschreibung. */
  description: string
  /** Ziel-Route der Kachel. */
  href: string
  /** Icon (Emoji – leicht gegen eine SVG-Komponente austauschbar). */
  icon: string
  /** Kachel nur für Admins anzeigen. */
  adminOnly?: boolean
}

export const apps: AppTile[] = [
  {
    slug: 'users',
    name: 'Benutzerverwaltung',
    description: 'Accounts anlegen, Rollen vergeben und Nutzer verwalten.',
    href: '/admin/users',
    icon: '👥',
    adminOnly: true,
  },
  {
    slug: 'example',
    name: 'Beispiel-App',
    description: 'Platzhalter-App als Vorlage für eigene Module.',
    href: '/apps/example',
    icon: '🧩',
  },
  {
    slug: 'reports',
    name: 'Berichte',
    description: 'Auswertungen und Reports (Platzhalter).',
    href: '/apps/reports',
    icon: '📊',
  },
]

/** Liefert die unter /apps/<slug> registrierte App – oder undefined. */
export function getAppByRoute(slug: string): AppTile | undefined {
  return apps.find((app) => app.href === `/apps/${slug}`)
}

/** Filtert die für eine Rolle sichtbaren Apps. */
export function visibleApps(role: Role): AppTile[] {
  return apps.filter((app) => !app.adminOnly || role === 'admin')
}
