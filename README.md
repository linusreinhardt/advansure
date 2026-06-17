# LinoHub

Interner App-Launcher mit Login, Rollen (`admin` / `user`) und geschütztem
Center-Screen. Gebaut mit **Next.js (App Router, TypeScript)** und **Supabase**.

## Features

- 🔐 Login über Supabase – **öffentliche Registrierung deaktiviert**
- 👤 Rollen `admin` / `user` in der Tabelle `profiles` (1:1 zu `auth.users`)
- 🛡️ Zugriffsschutz über **Middleware** _und_ **Row Level Security (RLS)**
- 🧭 Geschützter **Center-Screen** (`/`) als App-Launcher mit Kacheln
- 🧑‍💼 **Benutzerverwaltung** (`/admin/users`) – nur für Admins
- ➕ Account-Anlage über eine Server-Action mit `SUPABASE_SERVICE_ROLE_KEY`
  (läuft **ausschließlich serverseitig**, der Key landet nie im Client)
- 🧱 Erweiterbar: neue Apps einfach als `/apps/<name>` ergänzen

## Projektstruktur

```
linohub/
├── middleware.ts                  # Auth-/Rollen-Guard (leitet um)
├── next.config.ts
├── supabase/
│   └── migrations/
│       └── 0001_init.sql          # Tabelle, RLS-Policies, Trigger
└── src/
    ├── lib/
    │   ├── apps.ts                # Registry der Launcher-Apps
    │   └── supabase/
    │       ├── server.ts          # SSR-Client (Server Components/Actions)
    │       ├── client.ts          # Browser-Client (Anon-Key)
    │       ├── middleware.ts      # Session-Refresh + Redirect-Logik
    │       └── admin.ts           # Service-Role-Client (server-only!)
    ├── components/                # Header, App-Grid
    ├── types/db.ts                # Profile/Role-Typen
    └── app/
        ├── page.tsx               # /  -> Center-Screen (geschützt)
        ├── login/                 # /login (öffentlich) + Server-Action
        ├── admin/
        │   ├── layout.tsx         # zusätzlicher Admin-Guard
        │   └── users/             # /admin/users + Server-Actions
        └── apps/[name]/page.tsx   # generische App-Routen (Platzhalter)
```

---

## 1. Voraussetzungen

- Node.js **20.9+** (getestet mit Node 22)
- Ein **Supabase-Projekt** (kostenlos unter https://supabase.com)

## 2. Installation

```bash
npm install
```

## 3. Environment-Variablen

Alle Werte findest du im **Supabase Dashboard → Project Settings → API**.

| Variable                        | Sichtbarkeit        | Beschreibung                                        |
| ------------------------------- | ------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | öffentlich (Client) | Projekt-URL, z. B. `https://abc123.supabase.co`     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | öffentlich (Client) | Anon/Public Key                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | **GEHEIM (Server)** | Service-Role Key – umgeht RLS, **nur serverseitig** |

> ⚠️ Der `SUPABASE_SERVICE_ROLE_KEY` darf **niemals** das Prefix
> `NEXT_PUBLIC_` bekommen und nie im Client verwendet werden. Im Code wird er
> nur in `src/lib/supabase/admin.ts` gelesen, das mit `import 'server-only'`
> abgesichert ist.

### Lokal

```bash
cp .env.local.example .env.local
# .env.local öffnen und die drei Werte eintragen
```

### Vercel

**Project → Settings → Environment Variables** – lege alle drei Variablen für
**Production**, **Preview** und **Development** an:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`  → als **Sensitive/Secret** markieren

Nach dem Anlegen einmal **neu deployen**, damit die Variablen greifen.

## 4. SQL-Migration in Supabase ausführen

Die Migration liegt in `supabase/migrations/0001_init.sql` und legt Tabelle,
RLS-Policies und Trigger an.

**Variante A – SQL-Editor (am einfachsten):**

1. Supabase Dashboard öffnen → **SQL Editor** → **New query**
2. Inhalt von `supabase/migrations/0001_init.sql` komplett hineinkopieren
3. **Run** klicken

**Variante B – Supabase CLI:**

```bash
npm install -g supabase
supabase login
supabase link --project-ref DEIN-PROJECT-REF
supabase db push
```

## 5. Öffentliche Registrierung deaktivieren

Dashboard → **Authentication → Sign In / Providers** (bzw. **Settings**) →
Option **„Allow new users to sign up“** **ausschalten**.
Neue Accounts entstehen dann ausschließlich über die Admin-Benutzerverwaltung
(Service-Role) oder das Dashboard.

## 6. Ersten Admin anlegen (Bootstrap)

Da die Registrierung deaktiviert ist und nur Admins neue Nutzer anlegen können,
wird der erste Admin einmalig manuell erstellt:

1. Dashboard → **Authentication → Users → Add user**
   (E-Mail + Passwort, **„Auto Confirm User“** aktivieren).
   Der Trigger legt automatisch ein Profil mit Rolle `user` an.
2. Im **SQL-Editor** zum Admin befördern:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'deine-admin@firma.de';
   ```

Danach kann sich dieser Account einloggen und unter `/admin/users` weitere
Nutzer (inkl. weiterer Admins) anlegen.

## 7. Lokal starten

```bash
npm run dev
# http://localhost:3000
```

## 8. Deployment auf Vercel

1. Repository in Vercel importieren (Framework wird als **Next.js** erkannt).
2. Die drei Environment-Variablen aus Schritt 3 setzen.
3. Deploy. Fertig.

---

## Neue App hinzufügen

1. Eintrag in `src/lib/apps.ts` ergänzen:

   ```ts
   {
     slug: 'vertraege',
     name: 'Verträge',
     description: 'Vertragsverwaltung',
     href: '/apps/vertraege',
     icon: '📄',
     // adminOnly: true,  // optional
   }
   ```

2. Route bereitstellen – zwei Möglichkeiten:
   - **Generisch:** nichts weiter nötig, `/apps/vertraege` rendert den
     Platzhalter aus `src/app/apps/[name]/page.tsx`.
   - **Eigene Logik:** eigenen Ordner `src/app/apps/vertraege/page.tsx`
     (oder z. B. `src/app/vertraege/...`) anlegen.

Die Kachel erscheint automatisch im Launcher; `adminOnly`-Apps nur für Admins.

## Sicherheitsmodell (Kurzüberblick)

- **Middleware** (`middleware.ts`): leitet nicht eingeloggte Nutzer auf
  `/login` um und lässt `/admin/*` nur für `role = 'admin'` zu.
- **Server-seitige Guards**: `admin/layout.tsx` und jede Admin-Server-Action
  prüfen die Rolle zusätzlich (Defense in Depth).
- **Row Level Security**: User sehen nur ihr eigenes Profil, Admins alle.
  Die `is_admin()`-Funktion (`SECURITY DEFINER`) verhindert RLS-Rekursion.
- **Service-Role-Key**: nur in `src/lib/supabase/admin.ts`, abgesichert mit
  `import 'server-only'` – kann nicht in Client-Bundles gelangen.
